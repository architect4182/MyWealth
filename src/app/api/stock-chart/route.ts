import { NextRequest, NextResponse } from "next/server";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface ChartPoint {
  timestamp: number;
  date: string;
  price: number;
}

function resolveSymbol(query: string, category: string): string {
  const lower = query.toLowerCase().trim();
  if (category === "US Stocks") {
    if (lower.includes("apple")) return "AAPL";
    if (lower.includes("google") || lower.includes("alphabet")) return "GOOGL";
    if (lower.includes("microsoft")) return "MSFT";
    if (lower.includes("amazon")) return "AMZN";
    if (lower.includes("nvidia")) return "NVDA";
    if (lower.includes("tesla")) return "TSLA";
    return query.toUpperCase();
  }

  if (category === "Indian Equities" || category === "Gold & Fixed Income") {
    if (lower.includes("jio platforms") || lower === "jpl") return "JPL.NS";
    if (lower.includes("jio financial") || lower === "jiofin") return "JIOFIN.NS";
    if (lower.includes("reliance") && !lower.includes("jio")) return "RELIANCE.NS";
    if (lower.includes("tata motors")) return "TATAMOTORS.NS";
    if (lower.includes("tcs") || lower.includes("tata consultancy")) return "TCS.NS";
    if (lower.includes("hdfc bank") || lower === "hdfc") return "HDFCBANK.NS";
    if (lower.includes("sbi") || lower.includes("state bank")) return "SBIN.NS";
    if (lower.includes("infosys")) return "INFY.NS";
    if (lower.includes("gold") || lower.includes("goldbees")) return "GOLDBEES.NS";
    if (lower.includes("nifty") || lower.includes("niftybees")) return "NIFTYBEES.NS";

    let sym = query.toUpperCase();
    if (!sym.endsWith(".NS") && !sym.endsWith(".BO")) {
      sym += ".NS";
    }
    return sym;
  }

  if (category === "Crypto") {
    if (lower.includes("bitcoin") || lower === "btc") return "BTC-USD";
    if (lower.includes("ethereum") || lower === "eth") return "ETH-USD";
    if (lower.includes("solana") || lower === "sol") return "SOL-USD";
    let sym = query.toUpperCase();
    if (!sym.endsWith("-USD")) sym += "-USD";
    return sym;
  }

  return query;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || searchParams.get("symbol")?.trim();
  const codeParam = searchParams.get("code")?.trim();
  const symbolParam = searchParams.get("symbol")?.trim();
  const category = searchParams.get("category") || "Indian Equities";
  const rawRange = (searchParams.get("range") || "1M").toUpperCase();

  if (!query && !codeParam && !symbolParam) {
    return NextResponse.json({ success: false, error: "Missing query, code, or symbol parameter" }, { status: 400 });
  }

  // 1. Dedicated Mutual Funds Handling via AMFI (mfapi.in)
  if (category === "Mutual Funds" || (query && query.toUpperCase().startsWith("MF-")) || codeParam) {
    try {
      let schemeCode = codeParam || "";
      if (!schemeCode && query) {
        const match = query.match(/^(?:MF-)?(\d{5,7})$/i);
        if (match) {
          schemeCode = match[1];
        } else {
          const clean = query.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
          const searchRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(clean)}`, {
            cache: "no-store",
          });
          const schemes = (await searchRes.json().catch(() => [])) as Array<{ schemeCode: number; schemeName: string }>;
          if (schemes && schemes.length > 0) {
            const isDirect = /direct/i.test(query);
            const isGrowth = /growth/i.test(query);
            const best =
              schemes.find((s) => {
                const n = s.schemeName.toLowerCase();
                return (isDirect ? n.includes("direct") : true) && (isGrowth ? n.includes("growth") : true);
              }) || schemes[0];
            schemeCode = String(best?.schemeCode || "");
          }
        }
      }

      if (schemeCode) {
        const navRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { cache: "no-store" });
        if (navRes.ok) {
          const navJson = await navRes.json();
          const rawData: Array<{ date: string; nav: string }> = navJson?.data || [];
          const schemeName = navJson?.meta?.scheme_name || query;

          // Days mapping based on range
          let daysLimit = 30;
          if (rawRange === "1D") daysLimit = 2;
          else if (rawRange === "1W") daysLimit = 7;
          else if (rawRange === "1M") daysLimit = 30;
          else if (rawRange === "3M") daysLimit = 90;
          else if (rawRange === "1Y") daysLimit = 365;
          else if (rawRange === "ALL" || rawRange === "5Y") daysLimit = 1825;

          // mfapi returns reverse chronological (latest first), so slice and reverse
          const sliced = rawData.slice(0, Math.min(daysLimit, rawData.length)).reverse();
          const points: ChartPoint[] = [];

          for (const item of sliced) {
            const price = Number(item.nav);
            if (!isNaN(price) && price > 0) {
              // Date format in mfapi: DD-MM-YYYY
              const parts = item.date.split("-");
              let ts = Date.now();
              if (parts.length === 3) {
                ts = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
              }
              points.push({
                timestamp: Math.floor(ts / 1000),
                date: item.date,
                price: Number(price.toFixed(4)),
              });
            }
          }

          if (points.length > 0) {
            const currentPrice = points[points.length - 1].price;
            const previousClose = points[0].price;
            const change = Number((currentPrice - previousClose).toFixed(4));
            const changePercent = previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;
            const prices = points.map((p) => p.price);
            const high = Math.max(...prices);
            const low = Math.min(...prices);

            return NextResponse.json({
              success: true,
              symbol: `MF-${schemeCode}`,
              name: schemeName,
              currency: "INR",
              currentPrice,
              previousClose,
              change,
              changePercent,
              dayHigh: high,
              dayLow: low,
              fiftyTwoWeekHigh: high,
              fiftyTwoWeekLow: low,
              points,
              range: rawRange,
              fundHouse: navJson?.meta?.fund_house || "",
              schemeCategory: navJson?.meta?.scheme_category || "",
              schemeType: navJson?.meta?.scheme_type || "",
              schemeCode: navJson?.meta?.scheme_code || schemeCode,
              isin: navJson?.meta?.isin_growth || "",
            });
          }
        }
      }
    } catch (e: any) {
      console.error("[stock-chart] MF API error:", e);
    }
  }

  // 2. Standard Equity / Stock / Crypto Chart via Yahoo Finance
  const targetQuery = query || symbolParam || codeParam || "";
  const symbol = symbolParam || resolveSymbol(targetQuery, category);

  // Map requested period to Yahoo Finance range & interval parameters
  let rangeParam = "1mo";
  let intervalParam = "1d";

  switch (rawRange) {
    case "1D":
      rangeParam = "1d";
      intervalParam = "5m";
      break;
    case "1W":
      rangeParam = "5d";
      intervalParam = "15m";
      break;
    case "1M":
      rangeParam = "1mo";
      intervalParam = "1d";
      break;
    case "3M":
      rangeParam = "3mo";
      intervalParam = "1d";
      break;
    case "1Y":
      rangeParam = "1y";
      intervalParam = "1wk";
      break;
    case "ALL":
    case "5Y":
      rangeParam = "5y";
      intervalParam = "1mo";
      break;
    default:
      rangeParam = "1mo";
      intervalParam = "1d";
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${rangeParam}&interval=${intervalParam}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Chart data not found (${res.status})` }, { status: 404 });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ success: false, error: "Empty chart data" }, { status: 404 });
    }

    const meta = result.meta || {};
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closes: (number | null)[] = quotes.close || [];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (price !== null && price !== undefined && !isNaN(price) && price > 0) {
        const ts = timestamps[i];
        const d = new Date(ts * 1000);
        const dateStr =
          rawRange === "1D"
            ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : d.toLocaleDateString([], { month: "short", day: "numeric" });

        points.push({
          timestamp: ts,
          date: dateStr,
          price: Number(price.toFixed(2)),
        });
      }
    }

    // Determine current and reference prices
    const latestMarketPrice = Number(meta.regularMarketPrice);
    const currentPrice =
      !isNaN(latestMarketPrice) && latestMarketPrice > 0
        ? Number(latestMarketPrice.toFixed(2))
        : points.length > 0
        ? points[points.length - 1].price
        : 0;

    const baselinePrice =
      Number(meta.chartPreviousClose) ||
      Number(meta.previousClose) ||
      (points.length > 0 ? points[0].price : currentPrice);

    const change = Number((currentPrice - baselinePrice).toFixed(2));
    const changePercent = baselinePrice > 0 ? Number(((change / baselinePrice) * 100).toFixed(2)) : 0;

    const prices = points.map((p) => p.price);
    const dayHigh = Number(meta.regularMarketDayHigh) || (prices.length ? Math.max(...prices) : currentPrice);
    const dayLow = Number(meta.regularMarketDayLow) || (prices.length ? Math.min(...prices) : currentPrice);
    const fiftyTwoWeekHigh = Number(meta.fiftyTwoWeekHigh) || dayHigh;
    const fiftyTwoWeekLow = Number(meta.fiftyTwoWeekLow) || dayLow;

    return NextResponse.json({
      success: true,
      symbol: meta.symbol || symbol.replace(".NS", ""),
      name: meta.shortName || meta.longName || query,
      currency: meta.currency === "USD" ? "USD" : "INR",
      currentPrice,
      previousClose: baselinePrice,
      change,
      changePercent,
      dayHigh: Number(dayHigh.toFixed(2)),
      dayLow: Number(dayLow.toFixed(2)),
      fiftyTwoWeekHigh: Number(fiftyTwoWeekHigh.toFixed(2)),
      fiftyTwoWeekLow: Number(fiftyTwoWeekLow.toFixed(2)),
      points,
      range: rawRange,
      exchange: meta.exchangeName || meta.fullExchangeName || "",
      marketState: meta.marketState || "",
    });
  } catch (err: any) {
    console.error("[stock-chart] Server error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch chart data" }, { status: 500 });
  }
}


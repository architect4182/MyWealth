import { NextRequest, NextResponse } from "next/server";
import { getStockTicker } from "@/utils/tickers";
import { fetchNasdaqRealTimeQuote } from "@/lib/live-quotes";

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

function isInvalidSymbolParam(sym?: string | null): boolean {
  if (!sym) return true;
  const s = sym.trim();
  if (s.startsWith("temp-")) return true;
  // UUID check: 8-4-4-4-12 hex characters or contains multiple hyphens like UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return true;
  if (/^[0-9a-f-]{24,}$/i.test(s)) return true;
  return false;
}

function resolveKnownSymbol(query: string, category: string): string | null {
  const lower = query.toLowerCase().trim();

  // Unified lookup via getStockTicker
  const mapped = getStockTicker(query, category);

  if (category === "US Stocks") {
    if (mapped) return mapped.replace(/\./g, "-");
    if (/^[A-Z0-9.-]{1,10}$/i.test(query.trim())) return query.trim().toUpperCase().replace(/\./g, "-");
    return null;
  }

  if (category === "Indian Equities" || category === "Gold & Fixed Income") {
    if (mapped) {
      return mapped.endsWith(".NS") || mapped.endsWith(".BO") ? mapped : `${mapped}.NS`;
    }
    if (/^[A-Z0-9.-]{1,12}\.(?:NS|BO)$/i.test(query.trim())) return query.trim().toUpperCase();
    if (/^[A-Z0-9]{1,10}$/i.test(query.trim())) return `${query.trim().toUpperCase()}.NS`;
    return null;
  }

  if (category === "Crypto") {
    if (mapped) return mapped.endsWith("-USD") ? mapped : `${mapped}-USD`;
    if (lower.includes("bitcoin") || lower === "btc") return "BTC-USD";
    if (lower.includes("ethereum") || lower === "eth") return "ETH-USD";
    if (lower.includes("solana") || lower === "sol") return "SOL-USD";
    let sym = query.toUpperCase();
    if (!sym.endsWith("-USD")) sym += "-USD";
    return sym;
  }

  return mapped || null;
}

async function searchYahooSymbol(query: string, category: string): Promise<string | null> {
  try {
    const clean = query
      .replace(/\b(limited|ltd|corp|corporation|inc|incorporated|pvt|private|company|co|group|holdings)\b/gi, "")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .trim();

    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(clean || query)}&quotesCount=8`;
    const res = await fetch(searchUrl, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const quotes = data?.quotes || [];

    for (const q of quotes) {
      const sym = q.symbol;
      if (!sym) continue;
      if (category === "Indian Equities" || category === "Gold & Fixed Income") {
        if (sym.endsWith(".NS") || sym.endsWith(".BO")) return sym;
      } else if (category === "US Stocks") {
        if (!sym.includes(".") && (q.quoteType === "EQUITY" || q.quoteType === "ETF")) return sym;
      } else if (category === "Crypto") {
        if (sym.endsWith("-USD")) return sym;
      } else {
        return sym;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || searchParams.get("symbol")?.trim();
  let codeParam = searchParams.get("code")?.trim() || "";
  let symbolParam = searchParams.get("symbol")?.trim() || "";
  const category = searchParams.get("category") || "Indian Equities";
  const rawRange = (searchParams.get("range") || "1M").toUpperCase();

  // Clean out invalid temp/uuid symbols
  if (isInvalidSymbolParam(symbolParam)) symbolParam = "";
  if (isInvalidSymbolParam(codeParam)) codeParam = "";

  if (!query && !codeParam && !symbolParam) {
    return NextResponse.json({ success: false, error: "Missing query or symbol parameter" }, { status: 400 });
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

          let daysLimit = 30;
          if (rawRange === "1D") daysLimit = 2;
          else if (rawRange === "1W") daysLimit = 7;
          else if (rawRange === "1M") daysLimit = 30;
          else if (rawRange === "3M") daysLimit = 90;
          else if (rawRange === "1Y") daysLimit = 365;
          else if (rawRange === "ALL" || rawRange === "5Y") daysLimit = 1825;

          const sliced = rawData.slice(0, Math.min(daysLimit, rawData.length)).reverse();
          const points: ChartPoint[] = [];

          for (const item of sliced) {
            const price = Number(item.nav);
            if (!isNaN(price) && price > 0) {
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

          if (points.length === 1) {
            points.push({
              timestamp: points[0].timestamp + 86400,
              date: points[0].date,
              price: points[0].price,
            });
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

  // 2. Intelligent Stock Symbol Resolution
  // Prioritize known Indian / US ticker mappings
  let resolvedSymbol = "";

  if (query) {
    resolvedSymbol = resolveKnownSymbol(query, category) || "";
  }
  if (!resolvedSymbol && symbolParam) {
    resolvedSymbol = resolveKnownSymbol(symbolParam, category) || "";
  }

  if (!resolvedSymbol && symbolParam) {
    let cleanSym = symbolParam.toUpperCase().trim();
    if ((category === "Indian Equities" || category === "Gold & Fixed Income") && !cleanSym.endsWith(".NS") && !cleanSym.endsWith(".BO")) {
      cleanSym += ".NS";
    }
    resolvedSymbol = cleanSym;
  }

  if (!resolvedSymbol && query) {
    resolvedSymbol = (await searchYahooSymbol(query, category)) || "";
  }

  if (!resolvedSymbol) {
    const fallbackTarget = (query || symbolParam || "").toUpperCase().trim();
    resolvedSymbol =
      (category === "Indian Equities" || category === "Gold & Fixed Income") && !fallbackTarget.endsWith(".NS") && !fallbackTarget.endsWith(".BO")
        ? `${fallbackTarget}.NS`
        : fallbackTarget;
  }

  // Ensure Indian Equities have proper .NS extension if no dot exists
  if ((category === "Indian Equities" || category === "Gold & Fixed Income") && !resolvedSymbol.includes(".")) {
    resolvedSymbol += ".NS";
  }

  // Period to parameters mapping with resilient intervals
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
      intervalParam = "1d";
      break;
    case "ALL":
    case "5Y":
      rangeParam = "5y";
      intervalParam = "1d";
      break;
    default:
      rangeParam = "1mo";
      intervalParam = "1d";
  }

  try {
    const prePostParam = rawRange === "1D" ? "&includePrePost=true" : "";
    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      resolvedSymbol
    )}?range=${rangeParam}&interval=${intervalParam}${prePostParam}`;

    let res = await fetch(url, { headers, cache: "no-store" });

    // Fallback: If not found or empty, try searching Yahoo Finance
    if (!res.ok && query) {
      const searchedSym = await searchYahooSymbol(query, category);
      if (searchedSym && searchedSym !== resolvedSymbol) {
        resolvedSymbol = searchedSym;
        url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          resolvedSymbol
        )}?range=${rangeParam}&interval=${intervalParam}`;
        res = await fetch(url, { headers, cache: "no-store" });
      }
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Chart data not found (${res.status})` }, { status: 404 });
    }

    let json = await res.json();
    let result = json?.chart?.result?.[0];

    // If result returned 0 timestamps, try fallback interval/range
    if (!result?.timestamp || result.timestamp.length === 0) {
      const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        resolvedSymbol
      )}?range=5d&interval=15m`;
      const fallbackRes = await fetch(fallbackUrl, { headers, cache: "no-store" });
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        if (fallbackJson?.chart?.result?.[0]?.timestamp?.length) {
          result = fallbackJson.chart.result[0];
        }
      }
    }

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
    let latestMarketPrice = Number(meta.regularMarketPrice);
    if (category === "US Stocks") {
      const nasdaqQuote = await fetchNasdaqRealTimeQuote(resolvedSymbol).catch(() => null);
      if (nasdaqQuote?.price) {
        latestMarketPrice = nasdaqQuote.price;
      } else if (rawRange === "1D" && points.length > 0) {
        const regTime = Number(meta.regularMarketTime) || 0;
        const lastPt = points[points.length - 1];
        if (lastPt.timestamp > regTime) {
          latestMarketPrice = lastPt.price;
        }
      }
    }

    const baselinePrice =
      Number(meta.chartPreviousClose) ||
      Number(meta.previousClose) ||
      (points.length > 0 ? points[0].price : latestMarketPrice || 0);

    const currentPrice =
      !isNaN(latestMarketPrice) && latestMarketPrice > 0
        ? Number(latestMarketPrice.toFixed(2))
        : points.length > 0
        ? points[points.length - 1].price
        : baselinePrice;

    // Guaranteed point generation: If points is 0 or 1, generate clean baseline points so SVG chart draws properly
    if (points.length === 0 && currentPrice > 0) {
      const now = Math.floor(Date.now() / 1000);
      points.push(
        { timestamp: now - 3600, date: "Prev Close", price: Number(baselinePrice.toFixed(2)) },
        { timestamp: now, date: "Live", price: Number(currentPrice.toFixed(2)) }
      );
    } else if (points.length === 1) {
      points.push({
        timestamp: points[0].timestamp + 60,
        date: points[0].date,
        price: points[0].price,
      });
    }

    const change = Number((currentPrice - baselinePrice).toFixed(2));
    const changePercent = baselinePrice > 0 ? Number(((change / baselinePrice) * 100).toFixed(2)) : 0;

    const prices = points.map((p) => p.price);
    const dayHigh = Number(meta.regularMarketDayHigh) || (prices.length ? Math.max(...prices) : currentPrice);
    const dayLow = Number(meta.regularMarketDayLow) || (prices.length ? Math.min(...prices) : currentPrice);
    const fiftyTwoWeekHigh = Number(meta.fiftyTwoWeekHigh) || dayHigh;
    const fiftyTwoWeekLow = Number(meta.fiftyTwoWeekLow) || dayLow;

    return NextResponse.json({
      success: true,
      symbol: meta.symbol || resolvedSymbol.replace(".NS", "").replace(".BO", ""),
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

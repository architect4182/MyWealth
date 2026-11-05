import { NextRequest, NextResponse } from "next/server";
import { INDIA_STOCKS_POOL, US_STOCKS_POOL, MF_POOL } from "@/data/trendingPool";
import { getStockTicker } from "@/utils/tickers";

export interface SearchResultItem {
  symbol: string;
  name: string;
  ticker: string;
  category: "Indian Equities" | "US Stocks" | "Mutual Funds" | "Gold & Fixed Income" | "Crypto";
  currency: "INR" | "USD";
  subtext: string;
}

const STATIC_ALIASES: SearchResultItem[] = [
  {
    symbol: "TMPV.NS",
    name: "Tata Motors Passenger Vehicles Ltd",
    ticker: "TMPV",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Auto",
  },
  {
    symbol: "TMCV.NS",
    name: "Tata Motors Commercial Vehicles Ltd",
    ticker: "TMCV",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Commercial Auto",
  },
  {
    symbol: "ETERNAL.NS",
    name: "Zomato Ltd (Eternal Limited)",
    ticker: "ETERNAL",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Consumer Tech",
  },
  {
    symbol: "JPL.NS",
    name: "Jio Platforms Limited",
    ticker: "JPL",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Telecom & Digital",
  },
  {
    symbol: "JIOFIN.NS",
    name: "Jio Financial Services Ltd",
    ticker: "JIOFIN",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Financial Services",
  },
  {
    symbol: "GOLDBEES.NS",
    name: "Nippon India ETF Gold BeES",
    ticker: "GOLDBEES",
    category: "Gold & Fixed Income",
    currency: "INR",
    subtext: "NSE India • Gold ETF",
  },
  {
    symbol: "NIFTYBEES.NS",
    name: "Nippon India ETF Nifty 50 BeES",
    ticker: "NIFTYBEES",
    category: "Indian Equities",
    currency: "INR",
    subtext: "NSE India • Nifty Index ETF",
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin (BTC)",
    ticker: "BTC",
    category: "Crypto",
    currency: "USD",
    subtext: "Cryptocurrency • Decentralized",
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum (ETH)",
    ticker: "ETH",
    category: "Crypto",
    currency: "USD",
    subtext: "Cryptocurrency • Smart Contracts",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type")?.toLowerCase() || ""; // "stock" | "mf" | "all"
  const categoryFilter = searchParams.get("category") || "";

  if (!q || q.length < 1) {
    return NextResponse.json({ success: true, results: [] });
  }

  const queryLower = q.toLowerCase();
  const tokens = queryLower.split(/\s+/).filter(Boolean);
  const results: SearchResultItem[] = [];
  const seenSymbols = new Set<string>();

  const matchesTokens = (name: string, ticker: string, symbol: string) => {
    const combined = `${name} ${ticker} ${symbol}`.toLowerCase();
    return tokens.every((tok) => combined.includes(tok));
  };

  const matchesCategory = (cat: string) => {
    if (type === "mf") return cat === "Mutual Funds";
    if (type === "stock") return cat === "Indian Equities" || cat === "US Stocks";
    if (categoryFilter) return categoryFilter === cat;
    return true;
  };

  // 1. Check local static aliases
  STATIC_ALIASES.forEach((item) => {
    if (matchesCategory(item.category) && matchesTokens(item.name, item.ticker, item.symbol)) {
      if (!seenSymbols.has(item.symbol)) {
        seenSymbols.add(item.symbol);
        results.push(item);
      }
    }
  });

  // 2. Check local curated pools (instant match across all relatable stocks & MFs)
  if (matchesCategory("Indian Equities")) {
    INDIA_STOCKS_POOL.forEach((item) => {
      if (matchesTokens(item.name, item.ticker, item.symbol)) {
        if (!seenSymbols.has(item.symbol)) {
          seenSymbols.add(item.symbol);
          results.push({
            symbol: item.symbol,
            name: item.name,
            ticker: item.ticker,
            category: "Indian Equities",
            currency: "INR",
            subtext: "NSE India • Equities",
          });
        }
      }
    });
  }

  if (matchesCategory("US Stocks")) {
    US_STOCKS_POOL.forEach((item) => {
      if (matchesTokens(item.name, item.ticker, item.symbol)) {
        if (!seenSymbols.has(item.symbol)) {
          seenSymbols.add(item.symbol);
          results.push({
            symbol: item.symbol,
            name: item.name,
            ticker: item.ticker,
            category: "US Stocks",
            currency: "USD",
            subtext: `${item.market} US • Equities`,
          });
        }
      }
    });
  }

  if (matchesCategory("Mutual Funds")) {
    MF_POOL.forEach((item) => {
      if (matchesTokens(item.name, item.ticker, String(item.code))) {
        const sym = `MF-${item.code}`;
        if (!seenSymbols.has(sym)) {
          seenSymbols.add(sym);
          results.push({
            symbol: sym,
            name: item.name,
            ticker: item.ticker,
            category: "Mutual Funds",
            currency: "INR",
            subtext: `AMFI • ${item.subCategory}`,
          });
        }
      }
    });
  }

  // 3. Dynamic external searches (parallelized with 2s timeout)
  const externalTasks: Promise<void>[] = [];

  // Mutual funds search via mfapi.in
  if (matchesCategory("Mutual Funds")) {
    externalTasks.push(
      (async () => {
        try {
          const clean = queryLower.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
          const mfRes = await fetch(
            `https://api.mfapi.in/mf/search?q=${encodeURIComponent(clean)}`,
            { signal: AbortSignal.timeout(2000), cache: "no-store" }
          );
          if (mfRes.ok) {
            const schemes = (await mfRes.json().catch(() => [])) as Array<{
              schemeCode: number;
              schemeName: string;
            }>;
            if (Array.isArray(schemes)) {
              // Sort to prioritize Direct Plan and Growth
              const sorted = [...schemes].sort((a, b) => {
                const aName = a.schemeName.toLowerCase();
                const bName = b.schemeName.toLowerCase();
                const aScore = (aName.includes("direct") ? 2 : 0) + (aName.includes("growth") ? 1 : 0);
                const bScore = (bName.includes("direct") ? 2 : 0) + (bName.includes("growth") ? 1 : 0);
                return bScore - aScore;
              });

              sorted.slice(0, 6).forEach((s) => {
                const sym = `MF-${s.schemeCode}`;
                if (!seenSymbols.has(sym)) {
                  seenSymbols.add(sym);
                  const isDirect = /direct/i.test(s.schemeName);
                  const isGrowth = /growth/i.test(s.schemeName);
                  const mfTicker = getStockTicker(s.schemeName, "Mutual Funds") || `MF-${s.schemeCode}`;
                  results.push({
                    symbol: sym,
                    name: s.schemeName,
                    ticker: mfTicker,
                    category: "Mutual Funds",
                    currency: "INR",
                    subtext: `AMFI Scheme • ${isDirect ? "Direct" : "Regular"} ${isGrowth ? "Growth" : ""}`.trim(),
                  });
                }
              });
            }
          }
        } catch {}
      })()
    );
  }

  // Stocks search via Yahoo Finance
  if (matchesCategory("Indian Equities") || matchesCategory("US Stocks")) {
    externalTasks.push(
      (async () => {
        try {
          const yRes = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "application/json",
              },
              signal: AbortSignal.timeout(2000),
              cache: "no-store",
            }
          );
          if (yRes.ok) {
            const yData = await yRes.json().catch(() => ({}));
            const quotes = (yData?.quotes || []) as Array<{
              symbol?: string;
              shortname?: string;
              longname?: string;
              quoteType?: string;
              exchange?: string;
            }>;

            quotes
              .filter((quote) => quote.quoteType === "EQUITY" && quote.symbol)
              .forEach((quote) => {
                const sym = String(quote.symbol);
                if (seenSymbols.has(sym)) return;

                const isIndian = sym.endsWith(".NS") || sym.endsWith(".BO");
                if (isIndian && !matchesCategory("Indian Equities")) return;
                if (!isIndian && !matchesCategory("US Stocks")) return;

                seenSymbols.add(sym);
                const category = isIndian ? "Indian Equities" : "US Stocks";
                const cleanTicker = sym.replace(/\.(NS|BO)$/i, "");
                results.push({
                  symbol: sym,
                  name: quote.longname || quote.shortname || cleanTicker,
                  ticker: cleanTicker,
                  category,
                  currency: isIndian ? "INR" : "USD",
                  subtext: isIndian ? `NSE / BSE India • ${sym}` : `${quote.exchange || "US Exchange"} • ${sym}`,
                });
              });
          }
        } catch {}
      })()
    );
  }

  await Promise.allSettled(externalTasks);

  // Score & sort results so exact and relatable multi-word matches appear first
  const scored = results.map((item) => {
    const n = item.name.toLowerCase();
    const t = item.ticker.toLowerCase();
    const s = item.symbol.toLowerCase();
    let score = 0;

    if (t === queryLower) score += 200;
    else if (t.startsWith(queryLower)) score += 120;
    else if (t.includes(queryLower)) score += 50;

    if (s.startsWith(queryLower)) score += 100;

    if (n === queryLower) score += 180;
    else if (n.startsWith(queryLower)) score += 100;
    else if (n.includes(` ${queryLower}`)) score += 70;
    else if (n.includes(queryLower)) score += 40;

    // Boost if every token matches as word prefix
    const allTokensPrefixWord = tokens.every((tok) =>
      n.split(/\s+/).some((word) => word.startsWith(tok))
    );
    if (allTokensPrefixWord) score += 40;

    // Small category preference if user specified sub-filter
    if (categoryFilter && item.category === categoryFilter) score += 10;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    success: true,
    results: scored.slice(0, 10).map((s) => s.item),
  });
}


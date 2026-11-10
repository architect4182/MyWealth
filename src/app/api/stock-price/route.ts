import { NextRequest, NextResponse } from "next/server";
import { getStockTicker } from "@/utils/tickers";
import { fetchNasdaqRealTimeQuote } from "@/lib/live-quotes";

interface SearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
}

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  quoteType: string;
}

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};


function isAllowedQuoteType(category: string, quoteType: string): boolean {
  switch (category) {
    case "Indian Equities":
    case "US Stocks":
      return quoteType === "EQUITY";
    case "Mutual Funds":
      return quoteType === "MUTUALFUND";
    case "Gold & Fixed Income":
      return quoteType === "ETF" || quoteType === "MUTUALFUND";
    case "Crypto":
      return quoteType === "CRYPTOCURRENCY";
    default:
      return false;
  }
}

function isAllowedListing(category: string, symbol: string, currency: string): boolean {
  const isIndianListing = symbol.endsWith(".NS") || symbol.endsWith(".BO");

  switch (category) {
    case "Indian Equities":
      return isIndianListing && currency === "INR";
    case "US Stocks":
      return !isIndianListing && currency === "USD";
    case "Mutual Funds":
    case "Gold & Fixed Income":
      return currency === "INR";
    case "Crypto":
      return currency === "USD";
    default:
      return false;
  }
}

function cleanCompanyName(name: string): string {
  return name
    .replace(/\b(ltd|limited|pvt|private|corp|corporation|inc|incorporated|llc|co|company|holdings)\b/gi, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function querySimilarity(query: string, quote: SearchQuote): number {
  const ignoredWords = new Set([
    "inc", "ltd", "limited", "corp", "corporation", "company", "co", "the",
    "direct", "plan", "growth", "fund", "equity", "shares", "pvt", "private"
  ]);
  const queryWords = query
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 1 && !ignoredWords.has(word)) ?? [];
  if (queryWords.length === 0) return 0.5;

  const quoteText = `${quote.shortname ?? ""} ${quote.longname ?? ""} ${quote.symbol ?? ""}`.toLowerCase();
  const matches = queryWords.filter((word) => quoteText.includes(word)).length;
  return matches / queryWords.length;
}

function toYahooSymbol(symbol: string, category: string): string {
  const upper = symbol.trim().toUpperCase();
  if (category === "Indian Equities") {
    return upper.endsWith(".NS") || upper.endsWith(".BO") ? upper : `${upper}.NS`;
  }
  if (category === "US Stocks") {
    // Yahoo Finance uses hyphens for US share classes (e.g. BRK.B -> BRK-B, BF.B -> BF-B)
    return upper.replace(/\./g, "-");
  }
  return upper;
}

async function getMarketQuote(symbol: string): Promise<MarketQuote | null> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=true`,
    { headers, cache: "no-store" }
  );
  if (!response.ok) return null;

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const regularPrice = Number(meta?.regularMarketPrice);
  const regularTime = Number(meta?.regularMarketTime) || 0;
  const resolvedSymbol = String(meta?.symbol ?? symbol);
  const currency = String(meta?.currency ?? "");

  // Check if extended-hours (pre-market / after-hours) or latest 1m interval is fresher than regularMarketTime
  let livePrice = regularPrice;
  const timestamps: number[] = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const closes: Array<number | null> = Array.isArray(result?.indicators?.quote?.[0]?.close)
    ? result.indicators.quote[0].close
    : [];
  for (let i = timestamps.length - 1; i >= 0; i--) {
    const c = closes[i];
    if (c !== null && c !== undefined && Number.isFinite(Number(c)) && Number(c) > 0) {
      if (timestamps[i] > regularTime || !Number.isFinite(livePrice) || livePrice <= 0) {
        livePrice = Number(Number(c).toFixed(4));
      }
      break;
    }
  }

  if (!Number.isFinite(livePrice) || livePrice <= 0 || !currency) return null;

  return {
    symbol: resolvedSymbol,
    name: String(meta?.shortName ?? meta?.longName ?? resolvedSymbol),
    price: Number(livePrice.toFixed(2)),
    currency,
    quoteType: String(meta?.instrumentType ?? ""),
  };
}

async function resolveAccurateQuote(
  rawSymbol: string,
  category: string,
  expectedType?: string
): Promise<{ symbol: string; name: string; price: number; currency: string } | null> {
  // For US Stocks, prefer official consolidated NASDAQ real-time quote (exact pre-market/regular/after-hours/close)
  if (category === "US Stocks") {
    const nasdaqQuote = await fetchNasdaqRealTimeQuote(rawSymbol).catch(() => null);
    if (nasdaqQuote) {
      return nasdaqQuote;
    }
  }

  const yahooSym = toYahooSymbol(rawSymbol, category);
  const directQuote = await getMarketQuote(yahooSym).catch(() => null);
  if (directQuote && validateMarketQuote(directQuote, category, expectedType)) {
    return directQuote;
  }

  // Indian fallback: if .NS returned nothing, try BSE (.BO)
  if (category === "Indian Equities" && yahooSym.endsWith(".NS")) {
    const bseSym = yahooSym.replace(/\.NS$/, ".BO");
    const bseQuote = await getMarketQuote(bseSym).catch(() => null);
    if (bseQuote && validateMarketQuote(bseQuote, category, expectedType)) {
      return bseQuote;
    }
  }

  return null;
}

function validateMarketQuote(quote: MarketQuote, category: string, expectedType?: string): boolean {
  if (!isAllowedListing(category, quote.symbol, quote.currency)) return false;
  const quoteType = expectedType || quote.quoteType;
  return !quoteType || isAllowedQuoteType(category, quoteType);
}

// Dedicated Indian Mutual Fund lookup via AMFI (mfapi.in)
async function getIndianMutualFundQuote(
  query: string
): Promise<{ symbol: string; name: string; price: number; currency: string } | null> {
  try {
    const mfCodeMatch = query.match(/^(?:MF-)?(\d{5,7})$/i);
    if (mfCodeMatch) {
      const code = mfCodeMatch[1];
      const navRes = await fetch(`https://api.mfapi.in/mf/${code}`, { cache: "no-store" });
      if (navRes.ok) {
        const navPayload = await navRes.json().catch(() => null);
        const latestNav = Number(navPayload?.data?.[0]?.nav);
        if (Number.isFinite(latestNav) && latestNav > 0) {
          return {
            symbol: `MF-${code}`,
            name: navPayload?.meta?.scheme_name || query,
            price: latestNav,
            currency: "INR",
          };
        }
      }
    }

    const clean = query.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    let res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(clean)}`, {
      cache: "no-store",
    });
    let schemes = (await res.json().catch(() => [])) as Array<{ schemeCode: number; schemeName: string }>;

    if (!schemes || schemes.length === 0) {
      const simplified = clean
        .replace(/\b(direct|plan|growth|regular|idcw|dividend|fund|mutual)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (simplified && simplified !== clean) {
        res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(simplified)}`, {
          cache: "no-store",
        });
        schemes = (await res.json().catch(() => [])) as Array<{ schemeCode: number; schemeName: string }>;
      }
    }

    if (!schemes || schemes.length === 0) {
      const words = clean.split(" ").slice(0, 3).join(" ");
      if (words) {
        res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(words)}`, {
          cache: "no-store",
        });
        schemes = (await res.json().catch(() => [])) as Array<{ schemeCode: number; schemeName: string }>;
      }
    }

    if (!schemes || schemes.length === 0) return null;

    const isDirect = /direct/i.test(query);
    const isGrowth = /growth/i.test(query);
    const isIDCW = /idcw|dividend/i.test(query);

    let best =
      schemes.find((s) => {
        const n = s.schemeName.toLowerCase();
        const directMatch = isDirect ? n.includes("direct") : !n.includes("direct");
        const growthMatch = isGrowth
          ? n.includes("growth")
          : isIDCW
          ? n.includes("idcw") || n.includes("dividend")
          : true;
        return directMatch && growthMatch;
      }) ||
      schemes.find((s) => {
        const n = s.schemeName.toLowerCase();
        return (isDirect ? n.includes("direct") : true) && (isGrowth ? n.includes("growth") : true);
      }) ||
      schemes[0];

    if (!best?.schemeCode) return null;

    const navRes = await fetch(`https://api.mfapi.in/mf/${best.schemeCode}`, { cache: "no-store" });
    if (!navRes.ok) return null;
    const navPayload = await navRes.json().catch(() => null);
    const latestNav = Number(navPayload?.data?.[0]?.nav);
    if (!Number.isFinite(latestNav) || latestNav <= 0) return null;

    return {
      symbol: `MF-${best.schemeCode}`,
      name: best.schemeName,
      price: latestNav,
      currency: "INR",
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || searchParams.get("symbol")?.trim();
  const market = searchParams.get("market")?.toUpperCase();
  let category = searchParams.get("category") || "";

  if (!category && market) {
    if (market === "US") category = "US Stocks";
    else if (market === "INDIA") category = "Indian Equities";
  }

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // 1. Direct Indian Mutual Funds handling via AMFI
  if (
    category === "Mutual Funds" ||
    (!category && (query.toUpperCase().includes("FUND") || query.toUpperCase().startsWith("MF-")))
  ) {
    const mfQuote = await getIndianMutualFundQuote(query);
    if (mfQuote) {
      return NextResponse.json({
        success: true,
        symbol: mfQuote.symbol,
        name: mfQuote.name,
        price: mfQuote.price,
        currency: mfQuote.currency,
      });
    }
  }

  if (
    !isAllowedQuoteType(
      category,
      category === "Indian Equities" || category === "US Stocks"
        ? "EQUITY"
        : category === "Mutual Funds"
        ? "MUTUALFUND"
        : category === "Crypto"
        ? "CRYPTOCURRENCY"
        : "ETF"
    )
  ) {
    return NextResponse.json({ success: false, error: "Unsupported asset category" }, { status: 400 });
  }


  try {
    // 2. Direct ticker symbol check
    const looksLikeTicker = /^[a-zA-Z0-9.^=-]{1,20}$/.test(query);
    if (looksLikeTicker) {
      const directQuote = await resolveAccurateQuote(query, category).catch(() => null);
      if (directQuote) {
        return NextResponse.json({
          success: true,
          symbol: directQuote.symbol,
          name: directQuote.name,
          price: directQuote.price,
          currency: directQuote.currency,
        });
      }
    }

    // 3. Known company / ticker resolution via unified mapping
    const mapped = getStockTicker(query, category);
    if (mapped && mapped !== query.toUpperCase()) {
      const mappedQuote = await resolveAccurateQuote(mapped, category).catch(() => null);
      if (mappedQuote) {
        return NextResponse.json({
          success: true,
          symbol: mappedQuote.symbol,
          name: mappedQuote.name,
          price: mappedQuote.price,
          currency: mappedQuote.currency,
        });
      }
    }

    // 4. Yahoo Finance Search (try original and cleaned queries)
    const cleaned = cleanCompanyName(query);
    const searchQueries = [query];
    if (cleaned && cleaned !== query) {
      searchQueries.push(cleaned);
    }

    let allQuotes: SearchQuote[] = [];
    for (const sq of searchQueries) {
      const searchResponse = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(sq)}&quotesCount=10`,
        { headers, cache: "no-store" }
      );
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const quotes = (searchData?.quotes ?? []) as SearchQuote[];
        allQuotes.push(...quotes);
      }
    }

    // Deduplicate quotes by symbol
    const seenSymbols = new Set<string>();
    const uniqueQuotes: SearchQuote[] = [];
    for (const q of allQuotes) {
      if (q.symbol && !seenSymbols.has(q.symbol)) {
        seenSymbols.add(q.symbol);
        uniqueQuotes.push(q);
      }
    }

    const candidates = uniqueQuotes
      .filter((quote) => Boolean(quote.symbol) && isAllowedQuoteType(category, String(quote.quoteType ?? "")))
      .filter((quote) => {
        const symbol = String(quote.symbol);
        return category !== "Indian Equities" || symbol.endsWith(".NS") || symbol.endsWith(".BO");
      })
      .filter((quote) => querySimilarity(query, quote) >= 0.35 || querySimilarity(cleaned, quote) >= 0.35)
      .sort((a, b) => {
        const simA = Math.max(querySimilarity(query, a), querySimilarity(cleaned, a));
        const simB = Math.max(querySimilarity(query, b), querySimilarity(cleaned, b));
        return simB - simA;
      });

    for (const candidate of candidates) {
      const quote = await resolveAccurateQuote(String(candidate.symbol), category, candidate.quoteType).catch(() => null);
      if (!quote) continue;

      return NextResponse.json({
        success: true,
        symbol: quote.symbol,
        name: candidate.shortname || candidate.longname || quote.name,
        price: quote.price,
        currency: quote.currency,
      });
    }

    return NextResponse.json(
      { success: false, error: "No matching quote found for this asset and currency" },
      { status: 404 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch market price";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


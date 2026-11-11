export interface LiveNasdaqQuote {
  symbol: string;
  name: string;
  price: number;
  currency: "USD";
  marketStatus?: string;
}

function parseDollarPrice(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Fetches real-time consolidated US exchange quotes (Pre-Market, Regular, After-Hours, and Close)
 * directly from NASDAQ's public market feed (covers both NASDAQ and NYSE listings).
 */
export async function fetchNasdaqRealTimeQuote(symbol: string): Promise<LiveNasdaqQuote | null> {
  const cleanSym = symbol.trim().toUpperCase().replace(/-/g, ".");
  if (!cleanSym || cleanSym.endsWith(".NS") || cleanSym.endsWith(".BO")) return null;

  for (const assetClass of ["stocks", "etf"] as const) {
    try {
      const res = await fetch(
        `https://api.nasdaq.com/api/quote/${encodeURIComponent(cleanSym)}/info?assetclass=${assetClass}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(3000),
          cache: "no-store",
        }
      );
      if (!res.ok) continue;

      const json = await res.json().catch(() => null);
      const data = json?.data;
      if (!data) continue;

      const primary = parseDollarPrice(data?.primaryData?.lastSalePrice);
      const secondary = parseDollarPrice(data?.secondaryData?.lastSalePrice);
      const price = primary ?? secondary;
      if (!price) continue;

      return {
        symbol: String(data?.symbol || cleanSym),
        name: String(data?.companyName || cleanSym),
        price: Number(price.toFixed(2)),
        currency: "USD",
        marketStatus: data?.marketStatus ? String(data.marketStatus) : undefined,
      };
    } catch {
      // Try next asset class
    }
  }

  return null;
}


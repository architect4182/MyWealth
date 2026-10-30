import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  const category = searchParams.get("category") || "";

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  try {
    // 1. Direct ticker candidate check
    let directTicker = query.toUpperCase();
    if (category === "Indian Equities" && !directTicker.includes(".")) {
      directTicker += ".NS";
    }

    let price: number | undefined;
    let currency: string | undefined;
    let resolvedSymbol = directTicker;
    let shortName: string | undefined;

    try {
      const chartRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(directTicker)}`,
        { headers, cache: "no-store" }
      );
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        const meta = chartData?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          price = Number(meta.regularMarketPrice);
          currency = meta.currency === "INR" ? "INR" : "USD";
          shortName = meta.shortName || meta.symbol;
          resolvedSymbol = meta.symbol;
        }
      }
    } catch {
      // Direct query fallback
    }

    // 2. Search fallback if direct ticker failed
    if (!price) {
      const searchRes = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5`,
        { headers, cache: "no-store" }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const quotes = searchData?.quotes || [];

        // Prefer Indian exchange (.NS or .BO) if category is Indian Equities
        let match = quotes[0];
        if (category === "Indian Equities") {
          const inMatch = quotes.find(
            (q: any) => q.symbol?.endsWith(".NS") || q.symbol?.endsWith(".BO")
          );
          if (inMatch) match = inMatch;
        }

        if (match?.symbol) {
          resolvedSymbol = match.symbol;
          shortName = match.shortname || match.longname || match.symbol;

          const chartRes2 = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(resolvedSymbol)}`,
            { headers, cache: "no-store" }
          );
          if (chartRes2.ok) {
            const chartData2 = await chartRes2.json();
            const meta2 = chartData2?.chart?.result?.[0]?.meta;
            if (meta2?.regularMarketPrice) {
              price = Number(meta2.regularMarketPrice);
              currency = meta2.currency === "INR" ? "INR" : "USD";
            }
          }
        }
      }
    }

    if (price) {
      return NextResponse.json({
        success: true,
        symbol: resolvedSymbol,
        name: shortName || query,
        price,
        currency: currency || (category === "US Stocks" ? "USD" : "INR"),
      });
    }

    return NextResponse.json(
      { success: false, error: "Price not found for symbol" },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch stock price" },
      { status: 500 }
    );
  }
}

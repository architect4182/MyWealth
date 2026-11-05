import { NextRequest, NextResponse } from "next/server";
import {
  TrendingStockCandidate,
  TrendingMFCandidate,
  INDIA_STOCKS_POOL,
  US_STOCKS_POOL,
  MF_POOL,
  shuffleWithSeed,
} from "@/data/trendingPool";

async function fetchStockBatch(pool: TrendingStockCandidate[], seed: number) {
  const shuffled = shuffleWithSeed(pool, seed);
  const selected = shuffled.slice(0, 12);

  const results = await Promise.all(
    selected.map(async (candidate) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate.symbol)}`,
          {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          const price = Number(meta?.regularMarketPrice);
          const prevClose = Number(meta?.previousClose || meta?.chartPreviousClose);

          if (Number.isFinite(price) && price > 0) {
            const change = prevClose ? price - prevClose : 0;
            const changePct = prevClose ? (change / prevClose) * 100 : 0;

            return {
              symbol: candidate.symbol,
              name: candidate.name,
              ticker: candidate.ticker,
              category: candidate.category,
              price: Number(price.toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(changePct.toFixed(2)),
              currency: candidate.currency,
              market: candidate.market,
            };
          }
        }
      } catch {}
      return null;
    })
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, 10)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "stocks";
  const market = searchParams.get("market"); // "india" | "us" | undefined
  const seedParam = searchParams.get("seed");
  const seed = seedParam ? parseInt(seedParam, 10) : Date.now();

  if (type === "stocks") {
    const [indiaItems, usItems] = await Promise.all([
      fetchStockBatch(INDIA_STOCKS_POOL, seed),
      fetchStockBatch(US_STOCKS_POOL, seed + 12345),
    ]);

    let activeItems = [...indiaItems, ...usItems];
    if (market === "india") {
      activeItems = indiaItems;
    } else if (market === "us") {
      activeItems = usItems;
    }

    return NextResponse.json(
      {
        success: true,
        type: "stocks",
        market: market || "both",
        count: activeItems.length,
        items: activeItems,
        indiaItems,
        usItems,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  // Mutual Funds
  const shuffledMF = shuffleWithSeed(MF_POOL, seed);
  const selectedMF = shuffledMF.slice(0, 12);

  const rawResults = await Promise.all(
    selectedMF.map(async (scheme) => {
      try {
        const res = await fetch(`https://api.mfapi.in/mf/${scheme.code}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          const navList = data?.data || [];
          const curNav = parseFloat(navList[0]?.nav);
          const prevNav = parseFloat(navList[1]?.nav);

          if (!isNaN(curNav) && curNav > 0) {
            const change = !isNaN(prevNav) && prevNav > 0 ? curNav - prevNav : 0;
            const changePct = !isNaN(prevNav) && prevNav > 0 ? (change / prevNav) * 100 : 0;

            return {
              code: scheme.code,
              name: scheme.name,
              ticker: scheme.ticker,
              subCategory: scheme.subCategory,
              category: "Mutual Funds" as const,
              price: Number(curNav.toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(changePct.toFixed(2)),
              currency: "INR" as const,
            };
          }
        }
      } catch {}
      return null;
    })
  );

  const results = rawResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, 10)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return NextResponse.json(
    {
      success: true,
      type: "mf",
      count: results.length,
      items: results,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

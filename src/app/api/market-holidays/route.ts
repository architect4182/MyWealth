import { NextResponse } from "next/server";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface HolidayCache {
  in: Record<string, string>;
  us: Record<string, string>;
  fetchedAt: number;
  year: number;
}

let serverCache: HolidayCache | null = null;

function parseNseDate(str: string): string | null {
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const m = String(str || "").trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return null;
  const mon = months[m[2]];
  if (!mon) return null;
  return `${m[3]}-${mon}-${m[1].padStart(2, "0")}`;
}

async function fetchIndianHolidays(): Promise<Record<string, string>> {
  const holidays: Record<string, string> = {};

  // 1. Official NSE Trading Holiday Master API
  try {
    const res = await fetch("https://www.nseindia.com/api/holiday-master?type=trading", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com/",
      },
      next: { revalidate: 604800 },
    });
    if (res.ok) {
      const data = await res.json();
      const cmList = Array.isArray(data?.CM) ? data.CM : [];
      for (const row of cmList) {
        const iso = parseNseDate(row.tradingDate);
        if (iso && row.description) {
          holidays[iso] = String(row.description).trim();
        }
      }
      if (Object.keys(holidays).length > 0) {
        return holidays;
      }
    }
  } catch (err) {
    console.warn("[market-holidays] NSE fetch fallback:", err);
  }

  // 2. Fallback: Upstox Public Exchange Holiday Feed (no auth required)
  try {
    const res = await fetch("https://api.upstox.com/v2/market/holidays", {
      headers: { Accept: "application/json" },
      next: { revalidate: 604800 },
    });
    if (res.ok) {
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      for (const row of rows) {
        const closed: string[] = Array.isArray(row.closed_exchanges) ? row.closed_exchanges : [];
        if (row.date && row.holiday_type === "TRADING_HOLIDAY" && closed.includes("NSE")) {
          holidays[String(row.date)] = String(row.description || "Market Holiday").trim();
        }
      }
    }
  } catch (err) {
    console.warn("[market-holidays] Upstox fetch error:", err);
  }

  return holidays;
}

async function fetchUsHolidaysForYear(year: number): Promise<Record<string, string>> {
  const holidays: Record<string, string> = {};
  const bankOnlyRegex = /veterans|columbus|indigenous/i;

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 604800 },
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (!row?.date || !row?.name) continue;
          const types: string[] = Array.isArray(row.types) ? row.types : [];
          // NYSE/NASDAQ observe all federal public holidays except Veterans Day & Columbus Day, plus Good Friday
          const isExchangeHoliday =
            (row.global && types.includes("Public") && !bankOnlyRegex.test(String(row.name))) ||
            /good friday/i.test(String(row.name));
          if (isExchangeHoliday && !holidays[row.date]) {
            holidays[String(row.date)] = String(row.name).trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn("[market-holidays] Nager US fetch error:", err);
  }

  return holidays;
}

export async function GET() {
  const now = Date.now();
  const currentYear = new Date().getFullYear();

  if (
    serverCache &&
    now - serverCache.fetchedAt < ONE_WEEK_MS &&
    serverCache.year === currentYear &&
    (Object.keys(serverCache.in).length > 0 || Object.keys(serverCache.us).length > 0)
  ) {
    return NextResponse.json(
      {
        success: true,
        cached: true,
        fetchedAt: serverCache.fetchedAt,
        in: serverCache.in,
        us: serverCache.us,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  }

  const [inHolidays, usCurrentYear, usNextYear] = await Promise.all([
    fetchIndianHolidays(),
    fetchUsHolidaysForYear(currentYear),
    new Date().getMonth() === 11 ? fetchUsHolidaysForYear(currentYear + 1) : Promise.resolve({}),
  ]);

  const usHolidays = { ...usCurrentYear, ...usNextYear };

  serverCache = {
    in: inHolidays,
    us: usHolidays,
    fetchedAt: now,
    year: currentYear,
  };

  return NextResponse.json(
    {
      success: true,
      cached: false,
      fetchedAt: now,
      in: inHolidays,
      us: usHolidays,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}


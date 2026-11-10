import { MarketTimingStatus } from "@/types/portfolio";

export interface MarketHolidaysMap {
  in: Record<string, string>;
  us: Record<string, string>;
  fetchedAt?: number;
}

const HOLIDAY_CACHE_KEY = "mywealth_market_holidays_v1";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

let dynamicHolidays: MarketHolidaysMap = {
  in: {},
  us: {},
};

/** Synchronously populate the holiday maps (hydrated from localStorage / API) */
export function setDynamicMarketHolidays(holidays: MarketHolidaysMap): void {
  dynamicHolidays = {
    in: holidays.in || {},
    us: holidays.us || {},
    fetchedAt: holidays.fetchedAt,
  };
}

/** Reads weekly-cached holidays from localStorage, or fetches /api/market-holidays once per week */
export async function syncMarketHolidaysWeekly(): Promise<MarketHolidaysMap> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(HOLIDAY_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MarketHolidaysMap;
        const isFresh =
          parsed?.fetchedAt &&
          Date.now() - parsed.fetchedAt < ONE_WEEK_MS &&
          (Object.keys(parsed.in || {}).length > 0 || Object.keys(parsed.us || {}).length > 0);
        if (isFresh) {
          setDynamicMarketHolidays(parsed);
          return parsed;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch("/api/market-holidays");
    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        const map: MarketHolidaysMap = {
          in: data.in || {},
          us: data.us || {},
          fetchedAt: Date.now(),
        };
        setDynamicMarketHolidays(map);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(map));
          } catch {}
        }
        return map;
      }
    }
  } catch (err) {
    console.warn("[market-status] Failed to sync weekly market holidays:", err);
  }

  return dynamicHolidays;
}

/** Returns "YYYY-MM-DD" in the given IANA timezone */
function getLocalDateStr(now: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const p: Record<string, string> = {};
  parts.forEach((x) => {
    p[x.type] = x.value;
  });
  return `${p.year}-${p.month}-${p.day}`;
}

export function getIndianMarketStatus(
  now: Date | null,
  inHolidays: Record<string, string> = dynamicHolidays.in
): MarketTimingStatus {
  if (!now) {
    return {
      isOpen: false,
      status: "CLOSED",
      label: "Market Closed",
      marketName: "NSE / BSE India",
      exchange: "NSE",
      timeZone: "IST (UTC+5:30)",
      currentTimeStr: "--:--",
      tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
      detail: "Loading market session...",
    };
  }

  const tz = "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const timeStr = formatter.format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });
  const weekday = partMap.weekday;
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const minutes = hour * 60 + minute;

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (isWeekend) {
    return {
      isOpen: false,
      status: "CLOSED",
      label: "Closed (Weekend)",
      marketName: "NSE / BSE India",
      exchange: "NSE",
      timeZone: "IST (UTC+5:30)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
      detail: "Opens Monday at 9:15 AM IST",
    };
  }

  // Holiday check (sourced dynamically from /api/market-holidays)
  const dateStr = getLocalDateStr(now, tz);
  const holidayName = inHolidays[dateStr];
  if (holidayName) {
    return {
      isOpen: false,
      status: "HOLIDAY",
      label: "Market Holiday",
      marketName: "NSE / BSE India",
      exchange: "NSE",
      timeZone: "IST (UTC+5:30)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
      detail: `NSE closed for ${holidayName}`,
      holidayName,
    };
  }

  // Pre-market: 9:00 AM - 9:15 AM IST (540 to 555)
  if (minutes >= 540 && minutes < 555) {
    return {
      isOpen: true,
      status: "PRE-MARKET",
      label: "Pre-Market",
      marketName: "NSE / BSE India",
      exchange: "NSE",
      timeZone: "IST (UTC+5:30)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
      detail: "Regular session opens 9:15 AM IST",
    };
  }

  // Regular market: 9:15 AM - 3:30 PM IST (555 to 930)
  if (minutes >= 555 && minutes < 930) {
    const hoursLeft = Math.floor((930 - minutes) / 60);
    const minsLeft = (930 - minutes) % 60;
    return {
      isOpen: true,
      status: "LIVE",
      label: "Live Trading",
      marketName: "NSE / BSE India",
      exchange: "NSE",
      timeZone: "IST (UTC+5:30)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
      detail: `Closes in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m (at 3:30 PM IST)`,
    };
  }

  // Post-close
  return {
    isOpen: false,
    status: "CLOSED",
    label: "Market Closed",
    marketName: "NSE / BSE India",
    exchange: "NSE",
    timeZone: "IST (UTC+5:30)",
    currentTimeStr: timeStr,
    tradingHoursStr: "9:15 AM – 3:30 PM IST (Mon–Fri)",
    detail: minutes < 540 ? "Opens today at 9:15 AM IST" : "Opens tomorrow at 9:15 AM IST",
  };
}

export function getUsMarketStatus(
  now: Date | null,
  usHolidays: Record<string, string> = dynamicHolidays.us
): MarketTimingStatus {
  if (!now) {
    return {
      isOpen: false,
      status: "CLOSED",
      label: "Market Closed",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: "--:--",
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: "Loading market session...",
    };
  }

  const tz = "America/New_York";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const timeStr = formatter.format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });
  const weekday = partMap.weekday;
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const minutes = hour * 60 + minute;

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (isWeekend) {
    return {
      isOpen: false,
      status: "CLOSED",
      label: "Closed (Weekend)",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: "Opens Monday at 9:30 AM EST",
    };
  }

  // Holiday check (sourced dynamically from /api/market-holidays)
  const dateStr = getLocalDateStr(now, tz);
  const holidayName = usHolidays[dateStr];
  if (holidayName) {
    return {
      isOpen: false,
      status: "HOLIDAY",
      label: "Market Holiday",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: `NYSE closed for ${holidayName}`,
      holidayName,
    };
  }

  // Pre-market: 4:00 AM - 9:30 AM EST (240 to 570)
  if (minutes >= 240 && minutes < 570) {
    return {
      isOpen: true,
      status: "PRE-MARKET",
      label: "Pre-Market",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: "Regular session opens 9:30 AM EST",
    };
  }

  // Regular market: 9:30 AM - 4:00 PM EST (570 to 960)
  if (minutes >= 570 && minutes < 960) {
    const hoursLeft = Math.floor((960 - minutes) / 60);
    const minsLeft = (960 - minutes) % 60;
    return {
      isOpen: true,
      status: "LIVE",
      label: "Live Trading",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: `Closes in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m (at 4:00 PM EST)`,
    };
  }

  // After-hours: 4:00 PM - 8:00 PM EST (960 to 1200)
  if (minutes >= 960 && minutes < 1200) {
    return {
      isOpen: true,
      status: "AFTER-HOURS",
      label: "After-Hours",
      marketName: "NYSE & NASDAQ (USA)",
      exchange: "NYSE",
      timeZone: "EST/EDT (New York)",
      currentTimeStr: timeStr,
      tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
      detail: "After-hours session ends at 8:00 PM EST",
    };
  }

  return {
    isOpen: false,
    status: "CLOSED",
    label: "Market Closed",
    marketName: "NYSE & NASDAQ (USA)",
    exchange: "NYSE",
    timeZone: "EST/EDT (New York)",
    currentTimeStr: timeStr,
    tradingHoursStr: "9:30 AM – 4:00 PM EST (Mon–Fri)",
    detail: minutes < 240 ? "Opens today at 9:30 AM EST" : "Opens tomorrow at 9:30 AM EST",
  };
}

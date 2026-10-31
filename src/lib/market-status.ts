import { MarketTimingStatus } from "@/types/portfolio";

export function getIndianMarketStatus(now: Date | null): MarketTimingStatus {
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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const timeStr = formatter.format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, string> = {};
  parts.forEach((p) => { partMap[p.type] = p.value; });
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

  // Post-close / next day opens at 9:15 AM
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

export function getUsMarketStatus(now: Date | null): MarketTimingStatus {
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
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const timeStr = formatter.format(now);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, string> = {};
  parts.forEach((p) => { partMap[p.type] = p.value; });
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

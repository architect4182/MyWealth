import { AssetCategory } from "@/types/portfolio";

export interface BrokerPlatform {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  badge?: string;
  categories: AssetCategory[];
  getUrl: (assetName: string, ticker: string, category: AssetCategory) => string;
}

export const BROKER_PLATFORMS: BrokerPlatform[] = [
  // --- Indian Equities Brokers ---
  {
    id: "groww",
    name: "Groww",
    domain: "groww.in",
    tagline: "0 account opening • Instant UPI investing & F&O",
    badge: "Most Popular",
    categories: ["Indian Equities", "Mutual Funds", "Gold & Fixed Income"],
    getUrl: (assetName, ticker, category) => {
      const q = ticker || assetName;
      if (category === "Mutual Funds") {
        return `https://groww.in/mutual-funds/search?q=${encodeURIComponent(assetName)}`;
      }
      if (category === "Gold & Fixed Income") {
        return `https://groww.in/gold`;
      }
      return `https://groww.in/search?q=${encodeURIComponent(q)}`;
    },
  },
  {
    id: "zerodha",
    name: "Zerodha Kite",
    domain: "zerodha.com",
    tagline: "India's pioneer discount broker • Sleek TradingView charts",
    badge: "Top Broker",
    categories: ["Indian Equities", "Mutual Funds", "Gold & Fixed Income"],
    getUrl: (assetName, ticker, category) => {
      if (category === "Mutual Funds") {
        return `https://coin.zerodha.com`;
      }
      return `https://kite.zerodha.com`;
    },
  },
  {
    id: "angelone",
    name: "Angel One",
    domain: "angelone.in",
    tagline: "Smart order API, free delivery trades & research calls",
    badge: "Trusted",
    categories: ["Indian Equities", "Mutual Funds"],
    getUrl: () => `https://www.angelone.in`,
  },
  {
    id: "upstox",
    name: "Upstox",
    domain: "upstox.com",
    tagline: "Fast mobile trading, pro charts & curated discovery",
    categories: ["Indian Equities", "Mutual Funds"],
    getUrl: () => `https://upstox.com`,
  },
  {
    id: "dhan",
    name: "Dhan",
    domain: "dhan.co",
    tagline: "Built for super traders & investors • TradingView sync",
    badge: "Trader Choice",
    categories: ["Indian Equities"],
    getUrl: () => `https://dhan.co`,
  },
  {
    id: "indmoney",
    name: "INDmoney",
    domain: "indmoney.com",
    tagline: "All-in-one super app for Indian stocks, US stocks & MFs",
    badge: "Global & Local",
    categories: ["Indian Equities", "US Stocks", "Mutual Funds", "Gold & Fixed Income"],
    getUrl: (assetName, ticker, category) => {
      if (category === "US Stocks") {
        const q = ticker || assetName;
        return `https://www.indmoney.com/us-stocks`;
      }
      if (category === "Mutual Funds") {
        return `https://www.indmoney.com/mutual-funds`;
      }
      return `https://www.indmoney.com`;
    },
  },
  {
    id: "hdfcsky",
    name: "HDFC Sky",
    domain: "hdfcsky.com",
    tagline: "Discount broking backed by HDFC Bank trust",
    categories: ["Indian Equities", "Mutual Funds"],
    getUrl: () => `https://hdfcsky.com`,
  },
  {
    id: "icicidirect",
    name: "ICICI Direct",
    domain: "icicidirect.com",
    tagline: "3-in-1 integrated banking and trading platform",
    categories: ["Indian Equities", "Mutual Funds"],
    getUrl: () => `https://www.icicidirect.com`,
  },
  {
    id: "kotakneo",
    name: "Kotak Neo",
    domain: "kotaksecurities.com",
    tagline: "Zero brokerage trade plans by Kotak Securities",
    categories: ["Indian Equities"],
    getUrl: () => `https://www.kotaksecurities.com`,
  },

  // --- Mutual Fund Specific Platforms ---
  {
    id: "zerodhacoin",
    name: "Zerodha Coin",
    domain: "zerodha.com",
    tagline: "Direct mutual funds in demat mode • 0 commissions",
    badge: "Direct AMC",
    categories: ["Mutual Funds"],
    getUrl: () => `https://coin.zerodha.com`,
  },
  {
    id: "kuvera",
    name: "Kuvera",
    domain: "kuvera.in",
    tagline: "Goal-based direct mutual funds & tax-saving investments",
    categories: ["Mutual Funds"],
    getUrl: () => `https://kuvera.in`,
  },
  {
    id: "mfcentral",
    name: "MFCentral",
    domain: "mfcentral.com",
    tagline: "Official unified portal powered by CAMS & KFintech",
    badge: "Official",
    categories: ["Mutual Funds"],
    getUrl: () => `https://www.mfcentral.com`,
  },

  // --- US Equities Brokers ---
  {
    id: "vested",
    name: "Vested Finance",
    domain: "vestedfinance.com",
    tagline: "Direct US stock investing for Indian residents • Low FX fee",
    badge: "US Investing",
    categories: ["US Stocks"],
    getUrl: () => `https://vestedfinance.com`,
  },
  {
    id: "interactivebrokers",
    name: "Interactive Brokers",
    domain: "interactivebrokers.com",
    tagline: "Institutional-grade global access to 150+ international markets",
    badge: "Global Pro",
    categories: ["US Stocks"],
    getUrl: () => `https://www.interactivebrokers.com`,
  },
  {
    id: "schwab",
    name: "Charles Schwab",
    domain: "schwab.com",
    tagline: "World-class US brokerage with 0 commission stock trading",
    categories: ["US Stocks"],
    getUrl: () => `https://www.schwab.com`,
  },
  {
    id: "robinhood",
    name: "Robinhood",
    domain: "robinhood.com",
    tagline: "Commission-free stock & ETF trading app",
    categories: ["US Stocks"],
    getUrl: () => `https://robinhood.com`,
  },

  // --- Gold & Fixed Income ---
  {
    id: "rbiretail",
    name: "RBI Retail Direct",
    domain: "rbiretaildirect.org.in",
    tagline: "Official Government of India bonds, T-Bills & SGB portal",
    badge: "Govt Direct",
    categories: ["Gold & Fixed Income"],
    getUrl: () => `https://rbiretaildirect.org.in`,
  },

  // --- Crypto ---
  {
    id: "coindcx",
    name: "CoinDCX",
    domain: "coindcx.com",
    tagline: "FIU-registered Indian cryptocurrency exchange",
    badge: "FIU Compliant",
    categories: ["Crypto"],
    getUrl: () => `https://coindcx.com`,
  },
  {
    id: "wazirx",
    name: "WazirX",
    domain: "wazirx.com",
    tagline: "Popular Indian crypto exchange & P2P platform",
    categories: ["Crypto"],
    getUrl: () => `https://wazirx.com`,
  },
  {
    id: "mudrex",
    name: "Mudrex",
    domain: "mudrex.com",
    tagline: "Crypto baskets & automated coin investing",
    categories: ["Crypto"],
    getUrl: () => `https://mudrex.com`,
  },
];

/**
 * Returns prioritized investment platforms for a specific asset category.
 */
export function getBrokersForCategory(category: AssetCategory): BrokerPlatform[] {
  return BROKER_PLATFORMS.filter((b) => b.categories.includes(category));
}

/**
 * Common quick-pick broker suggestions for the Add/Edit holding modal.
 */
export function getQuickBrokerOptions(category: AssetCategory): string[] {
  switch (category) {
    case "Indian Equities":
      return ["Groww", "Zerodha Kite", "Angel One", "Upstox", "Dhan", "INDmoney", "HDFC Sky", "ICICI Direct"];
    case "Mutual Funds":
      return ["Groww", "Zerodha Coin", "INDmoney", "Kuvera", "MFCentral", "Paytm Money"];
    case "US Stocks":
      return ["INDmoney", "Vested", "Interactive Brokers", "Charles Schwab", "Robinhood", "Webull"];
    case "Crypto":
      return ["CoinDCX", "WazirX", "Mudrex", "Binance"];
    case "Gold & Fixed Income":
      return ["Groww", "Zerodha Kite", "INDmoney", "RBI Retail Direct"];
    default:
      return ["Groww", "Zerodha Kite", "Angel One", "Upstox", "INDmoney"];
  }
}

/**
 * Resolves the logo domain for a broker name.
 */
export function getBrokerDomain(brokerName?: string): string {
  if (!brokerName) return "groww.in";
  const lower = brokerName.toLowerCase().trim();
  const match = BROKER_PLATFORMS.find(
    (b) => b.name.toLowerCase() === lower || b.id.toLowerCase() === lower || lower.includes(b.id)
  );
  if (match) return match.domain;

  if (lower.includes("groww")) return "groww.in";
  if (lower.includes("zerodha") || lower.includes("kite") || lower.includes("coin")) return "zerodha.com";
  if (lower.includes("angel")) return "angelone.in";
  if (lower.includes("upstox")) return "upstox.com";
  if (lower.includes("dhan")) return "dhan.co";
  if (lower.includes("indmoney")) return "indmoney.com";
  if (lower.includes("kuvera")) return "kuvera.in";
  if (lower.includes("vested")) return "vestedfinance.com";
  if (lower.includes("interactive")) return "interactivebrokers.com";
  if (lower.includes("schwab")) return "schwab.com";
  if (lower.includes("robinhood")) return "robinhood.com";
  if (lower.includes("hdfc")) return "hdfcsky.com";
  if (lower.includes("icici")) return "icicidirect.com";
  if (lower.includes("kotak")) return "kotaksecurities.com";
  if (lower.includes("coindcx")) return "coindcx.com";
  if (lower.includes("wazirx")) return "wazirx.com";

  return "groww.in";
}

/**
 * Returns destination website URL for a broker name and asset.
 */
export function getBrokerDestinationUrl(
  brokerName: string,
  assetName: string,
  ticker: string,
  category: AssetCategory
): string {
  const lower = (brokerName || "").toLowerCase().trim();
  const match = BROKER_PLATFORMS.find(
    (b) => b.name.toLowerCase() === lower || b.id.toLowerCase() === lower || lower.includes(b.id)
  );
  if (match) {
    return match.getUrl(assetName, ticker, category);
  }

  // Fallback defaults
  if (lower.includes("groww")) {
    return category === "Mutual Funds"
      ? `https://groww.in/mutual-funds/search?q=${encodeURIComponent(assetName)}`
      : `https://groww.in/search?q=${encodeURIComponent(ticker || assetName)}`;
  }
  if (lower.includes("zerodha") || lower.includes("kite")) {
    return `https://kite.zerodha.com`;
  }
  if (lower.includes("upstox")) return `https://upstox.com`;
  if (lower.includes("angel")) return `https://www.angelone.in`;
  if (lower.includes("dhan")) return `https://dhan.co`;
  if (lower.includes("indmoney")) return `https://www.indmoney.com`;

  return `https://www.google.com/search?q=invest+in+${encodeURIComponent(assetName)}+${encodeURIComponent(brokerName)}`;
}

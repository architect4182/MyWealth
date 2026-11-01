export interface TrendingStockCandidate {
  symbol: string;
  name: string;
  ticker: string;
  category: "Indian Equities" | "US Stocks";
  currency: "INR" | "USD";
  market: "NSE" | "NYSE" | "NASDAQ";
  defaultPrice: number;
}

export interface TrendingMFCandidate {
  code: number;
  name: string;
  ticker: string;
  subCategory: string;
  defaultPrice: number;
  defaultChangePct: number;
}

export const INDIA_STOCKS_POOL: TrendingStockCandidate[] = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", ticker: "TATAMOTORS", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 825.40 },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", ticker: "RELIANCE", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1164.90 },
  { symbol: "SBIN.NS", name: "State Bank of India", ticker: "SBIN", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 818.50 },
  { symbol: "INFY.NS", name: "Infosys Ltd", ticker: "INFY", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1855.20 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", ticker: "HDFCBANK", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1742.30 },
  { symbol: "ZOMATO.NS", name: "Zomato Ltd", ticker: "ZOMATO", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 268.40 },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", ticker: "TCS", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 4050.00 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", ticker: "ICICIBANK", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1285.60 },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", ticker: "BHARTIARTL", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1680.90 },
  { symbol: "ITC.NS", name: "ITC Limited", ticker: "ITC", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 485.20 },
  { symbol: "LT.NS", name: "Larsen & Toubro", ticker: "LT", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 3580.40 },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", ticker: "HINDUNILVR", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 2390.10 },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", ticker: "BAJFINANCE", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 6890.00 },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", ticker: "SUNPHARMA", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1810.50 },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", ticker: "MARUTI", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 11450.00 },
  { symbol: "TITAN.NS", name: "Titan Company", ticker: "TITAN", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 3260.00 },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", ticker: "M&M", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 2790.30 },
  { symbol: "AXISBANK.NS", name: "Axis Bank", ticker: "AXISBANK", category: "Indian Equities", currency: "INR", market: "NSE", defaultPrice: 1195.80 },
];

export const US_STOCKS_POOL: TrendingStockCandidate[] = [
  { symbol: "NVDA", name: "NVIDIA Corp", ticker: "NVDA", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 138.25 },
  { symbol: "AAPL", name: "Apple Inc.", ticker: "AAPL", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 232.10 },
  { symbol: "TSLA", name: "Tesla Inc.", ticker: "TSLA", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 254.60 },
  { symbol: "MSFT", name: "Microsoft Corp", ticker: "MSFT", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 428.15 },
  { symbol: "AMZN", name: "Amazon.com Inc.", ticker: "AMZN", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 188.70 },
  { symbol: "GOOGL", name: "Alphabet Inc.", ticker: "GOOGL", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 169.50 },
  { symbol: "META", name: "Meta Platforms", ticker: "META", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 582.40 },
  { symbol: "AMD", name: "Advanced Micro Devices", ticker: "AMD", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 156.30 },
  { symbol: "BRK-B", name: "Berkshire Hathaway", ticker: "BRK-B", category: "US Stocks", currency: "USD", market: "NYSE", defaultPrice: 452.80 },
  { symbol: "JPM", name: "JPMorgan Chase", ticker: "JPM", category: "US Stocks", currency: "USD", market: "NYSE", defaultPrice: 222.10 },
  { symbol: "V", name: "Visa Inc.", ticker: "V", category: "US Stocks", currency: "USD", market: "NYSE", defaultPrice: 284.50 },
  { symbol: "WMT", name: "Walmart Inc.", ticker: "WMT", category: "US Stocks", currency: "USD", market: "NYSE", defaultPrice: 82.40 },
  { symbol: "LLY", name: "Eli Lilly & Co.", ticker: "LLY", category: "US Stocks", currency: "USD", market: "NYSE", defaultPrice: 815.60 },
  { symbol: "AVGO", name: "Broadcom Inc.", ticker: "AVGO", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 172.90 },
  { symbol: "NFLX", name: "Netflix Inc.", ticker: "NFLX", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 755.20 },
  { symbol: "COST", name: "Costco Wholesale", ticker: "COST", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 890.30 },
  { symbol: "PLTR", name: "Palantir Technologies", ticker: "PLTR", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 44.80 },
  { symbol: "INTC", name: "Intel Corp", ticker: "INTC", category: "US Stocks", currency: "USD", market: "NASDAQ", defaultPrice: 22.90 },
];

export const MF_POOL: TrendingMFCandidate[] = [
  { code: 122639, name: "Parag Parikh Flexi Cap Fund", ticker: "PPFAS", subCategory: "Flexi Cap", defaultPrice: 89.23, defaultChangePct: 0.85 },
  { code: 120828, name: "Quant Small Cap Fund", ticker: "QUANT", subCategory: "Small Cap", defaultPrice: 264.40, defaultChangePct: 1.42 },
  { code: 118834, name: "Mirae Asset Large Cap Fund", ticker: "MIRAE", subCategory: "Large Cap", defaultPrice: 112.18, defaultChangePct: 0.65 },
  { code: 103175, name: "SBI Focused Equity Fund", ticker: "SBIMF", subCategory: "Focused", defaultPrice: 320.15, defaultChangePct: 0.52 },
  { code: 118989, name: "Nippon India Growth Fund", ticker: "NIPPON", subCategory: "Mid Cap", defaultPrice: 382.70, defaultChangePct: 1.15 },
  { code: 120503, name: "ICICI Prudential Bluechip Fund", ticker: "ICICI", subCategory: "Large Cap", defaultPrice: 108.92, defaultChangePct: 0.48 },
  { code: 101150, name: "HDFC Mid-Cap Opportunities Fund", ticker: "HDFC", subCategory: "Mid Cap", defaultPrice: 174.50, defaultChangePct: 1.05 },
  { code: 125354, name: "Axis Small Cap Fund", ticker: "AXIS", subCategory: "Small Cap", defaultPrice: 98.34, defaultChangePct: 0.94 },
  { code: 127042, name: "Motilal Oswal Midcap Fund", ticker: "MOSWAL", subCategory: "Mid Cap", defaultPrice: 104.80, defaultChangePct: 1.30 },
  { code: 120716, name: "UTI Nifty 50 Index Fund", ticker: "UTI", subCategory: "Index Fund", defaultPrice: 168.20, defaultChangePct: 0.40 },
  { code: 135781, name: "Tata Digital India Fund", ticker: "TATA", subCategory: "Sectoral / Tech", defaultPrice: 52.60, defaultChangePct: 1.62 },
  { code: 105758, name: "Kotak Emerging Equity Fund", ticker: "KOTAK", subCategory: "Mid Cap", defaultPrice: 122.45, defaultChangePct: 0.78 },
  { code: 100377, name: "DSP Midcap Fund", ticker: "DSP", subCategory: "Mid Cap", defaultPrice: 136.10, defaultChangePct: 0.88 },
  { code: 101860, name: "Bandhan Sterling Value Fund", ticker: "BANDHAN", subCategory: "Value", defaultPrice: 145.20, defaultChangePct: 0.62 },
  { code: 125497, name: "Edelweiss Balanced Advantage Fund", ticker: "EDEL", subCategory: "Hybrid", defaultPrice: 58.90, defaultChangePct: 0.35 },
];

export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length;
  let s = Math.abs(seed);
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * m--);
    const t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export function getInitialTrendingIndiaStocks() {
  return INDIA_STOCKS_POOL.slice(0, 10).map((c, i) => ({
    rank: i + 1,
    symbol: c.symbol,
    name: c.name,
    ticker: c.ticker,
    category: c.category,
    price: c.defaultPrice,
    change: Number(((c.defaultPrice * 1.25) / 100).toFixed(2)),
    changePercent: 1.25,
    currency: c.currency,
    market: c.market,
  }));
}

export function getInitialTrendingUSStocks() {
  return US_STOCKS_POOL.slice(0, 10).map((c, i) => ({
    rank: i + 1,
    symbol: c.symbol,
    name: c.name,
    ticker: c.ticker,
    category: c.category,
    price: c.defaultPrice,
    change: Number(((c.defaultPrice * 1.45) / 100).toFixed(2)),
    changePercent: 1.45,
    currency: c.currency,
    market: c.market,
  }));
}

export function getInitialTrendingMF() {
  return MF_POOL.slice(0, 10).map((c, i) => ({
    rank: i + 1,
    code: c.code,
    name: c.name,
    ticker: c.ticker,
    category: "Mutual Funds" as const,
    subCategory: c.subCategory,
    price: c.defaultPrice,
    change: Number(((c.defaultPrice * c.defaultChangePct) / 100).toFixed(2)),
    changePercent: c.defaultChangePct,
    currency: "INR" as const,
  }));
}


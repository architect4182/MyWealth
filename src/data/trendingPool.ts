export interface TrendingStockCandidate {
  symbol: string;
  name: string;
  ticker: string;
  category: "Indian Equities" | "US Stocks";
  currency: "INR" | "USD";
  market: "NSE" | "NYSE" | "NASDAQ";
}

export interface TrendingMFCandidate {
  code: number;
  name: string;
  ticker: string;
  subCategory: string;
}

export const INDIA_STOCKS_POOL: TrendingStockCandidate[] = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", ticker: "TATAMOTORS", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TMPV.NS", name: "Tata Motors Passenger Vehicles", ticker: "TMPV", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TMCV.NS", name: "Tata Motors Commercial Vehicles", ticker: "TMCV", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", ticker: "RELIANCE", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "SBIN.NS", name: "State Bank of India", ticker: "SBIN", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "INFY.NS", name: "Infosys Ltd", ticker: "INFY", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", ticker: "HDFCBANK", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ZOMATO.NS", name: "Zomato Ltd (Eternal)", ticker: "ZOMATO", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ETERNAL.NS", name: "Eternal Limited (Zomato)", ticker: "ETERNAL", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", ticker: "TCS", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TATAPOWER.NS", name: "Tata Power Company", ticker: "TATAPOWER", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd", ticker: "TATASTEEL", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", ticker: "TATACONSUM", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", ticker: "ICICIBANK", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", ticker: "BHARTIARTL", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ITC.NS", name: "ITC Limited", ticker: "ITC", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "LT.NS", name: "Larsen & Toubro", ticker: "LT", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", ticker: "HINDUNILVR", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", ticker: "BAJFINANCE", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", ticker: "SUNPHARMA", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", ticker: "MARUTI", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "TITAN.NS", name: "Titan Company", ticker: "TITAN", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", ticker: "M&M", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", ticker: "AXISBANK", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", ticker: "KOTAKBANK", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "WIPRO.NS", name: "Wipro Limited", ticker: "WIPRO", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", ticker: "ADANIENT", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", ticker: "ADANIPORTS", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp of India", ticker: "POWERGRID", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "NTPC.NS", name: "NTPC Limited", ticker: "NTPC", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", ticker: "ONGC", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "COALINDIA.NS", name: "Coal India Ltd", ticker: "COALINDIA", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "HAL.NS", name: "Hindustan Aeronautics Ltd", ticker: "HAL", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "BEL.NS", name: "Bharat Electronics Ltd", ticker: "BEL", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "IREDA.NS", name: "Indian Renewable Energy Dev", ticker: "IREDA", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "IRFC.NS", name: "Indian Railway Finance Corp", ticker: "IRFC", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "JIOFIN.NS", name: "Jio Financial Services", ticker: "JIOFIN", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "SWIGGY.NS", name: "Swiggy Limited", ticker: "SWIGGY", category: "Indian Equities", currency: "INR", market: "NSE" },
  { symbol: "PAYTM.NS", name: "One 97 Communications (Paytm)", ticker: "PAYTM", category: "Indian Equities", currency: "INR", market: "NSE" },
];

export const US_STOCKS_POOL: TrendingStockCandidate[] = [
  { symbol: "NVDA", name: "NVIDIA Corp", ticker: "NVDA", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "AAPL", name: "Apple Inc.", ticker: "AAPL", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", ticker: "TSLA", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp", ticker: "MSFT", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", ticker: "AMZN", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Google)", ticker: "GOOGL", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms (Facebook)", ticker: "META", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", ticker: "AMD", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", ticker: "BRK-B", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase", ticker: "JPM", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "V", name: "Visa Inc.", ticker: "V", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", ticker: "WMT", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "LLY", name: "Eli Lilly & Co.", ticker: "LLY", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "AVGO", name: "Broadcom Inc.", ticker: "AVGO", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", ticker: "NFLX", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "COST", name: "Costco Wholesale", ticker: "COST", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", ticker: "PLTR", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corp", ticker: "INTC", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "COIN", name: "Coinbase Global", ticker: "COIN", category: "US Stocks", currency: "USD", market: "NASDAQ" },
  { symbol: "UBER", name: "Uber Technologies", ticker: "UBER", category: "US Stocks", currency: "USD", market: "NYSE" },
  { symbol: "ABNB", name: "Airbnb Inc.", ticker: "ABNB", category: "US Stocks", currency: "USD", market: "NASDAQ" },
];

export const MF_POOL: TrendingMFCandidate[] = [
  { code: 122639, name: "Parag Parikh Flexi Cap Fund Direct Growth", ticker: "PPFAS", subCategory: "Flexi Cap" },
  { code: 120828, name: "Quant Small Cap Fund Direct Growth", ticker: "QUANT", subCategory: "Small Cap" },
  { code: 120847, name: "Quant Active Fund Direct Growth", ticker: "QUANT-ACT", subCategory: "Multi Cap" },
  { code: 120841, name: "Quant Mid Cap Fund Direct Growth", ticker: "QUANT-MID", subCategory: "Mid Cap" },
  { code: 118834, name: "Mirae Asset Large Cap Fund Direct Growth", ticker: "MIRAE", subCategory: "Large Cap" },
  { code: 118825, name: "Mirae Asset Emerging Bluechip Fund Direct Growth", ticker: "MIRAE-EB", subCategory: "Large & Mid Cap" },
  { code: 103175, name: "SBI Focused Equity Fund Direct Growth", ticker: "SBIMF", subCategory: "Focused" },
  { code: 119598, name: "SBI Small Cap Fund Direct Growth", ticker: "SBI-SMALL", subCategory: "Small Cap" },
  { code: 102885, name: "SBI Contra Fund Direct Growth", ticker: "SBI-CONTRA", subCategory: "Contra" },
  { code: 118989, name: "Nippon India Growth Fund Direct Growth", ticker: "NIPPON", subCategory: "Mid Cap" },
  { code: 120716, name: "Nippon India Small Cap Fund Direct Growth", ticker: "NIPPON-SM", subCategory: "Small Cap" },
  { code: 120503, name: "ICICI Prudential Bluechip Fund Direct Growth", ticker: "ICICI", subCategory: "Large Cap" },
  { code: 120594, name: "ICICI Prudential Technology Fund Direct Growth", ticker: "ICICI-TECH", subCategory: "Sectoral / Tech" },
  { code: 101150, name: "HDFC Mid-Cap Opportunities Fund Direct Growth", ticker: "HDFC", subCategory: "Mid Cap" },
  { code: 118968, name: "HDFC Small Cap Fund Direct Growth", ticker: "HDFC-SM", subCategory: "Small Cap" },
  { code: 118955, name: "HDFC Top 100 Fund Direct Growth", ticker: "HDFC-TOP", subCategory: "Large Cap" },
  { code: 125354, name: "Axis Small Cap Fund Direct Growth", ticker: "AXIS", subCategory: "Small Cap" },
  { code: 120505, name: "Axis Bluechip Fund Direct Growth", ticker: "AXIS-BLUE", subCategory: "Large Cap" },
  { code: 127042, name: "Motilal Oswal Midcap Fund Direct Growth", ticker: "MOSWAL", subCategory: "Mid Cap" },
  { code: 127041, name: "Motilal Oswal Large and Midcap Fund Direct Growth", ticker: "MOSWAL-LM", subCategory: "Large & Mid Cap" },
  { code: 120716, name: "UTI Nifty 50 Index Fund Direct Growth", ticker: "UTI", subCategory: "Index Fund" },
  { code: 135781, name: "Tata Digital India Fund Direct Growth", ticker: "TATA", subCategory: "Sectoral / Tech" },
  { code: 105758, name: "Kotak Emerging Equity Fund Direct Growth", ticker: "KOTAK", subCategory: "Mid Cap" },
  { code: 100377, name: "DSP Midcap Fund Direct Growth", ticker: "DSP", subCategory: "Mid Cap" },
  { code: 101860, name: "Bandhan Sterling Value Fund Direct Growth", ticker: "BANDHAN", subCategory: "Value" },
  { code: 125497, name: "Edelweiss Balanced Advantage Fund Direct Growth", ticker: "EDEL", subCategory: "Hybrid" },
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


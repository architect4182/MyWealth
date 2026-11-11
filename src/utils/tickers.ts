/**
 * Unified Stock and Mutual Fund Ticker / Abbreviation Engine
 * Maps company names, fund names, and exchange aliases to authentic market symbols and clean abbreviations.
 */

export interface TickerMapping {
  match: RegExp | string;
  ticker: string;
}

// 1. Official US Stock Tickers (NYSE / NASDAQ)
const US_STOCK_MAPPINGS: TickerMapping[] = [
  { match: /\bmicrosoft\b/i, ticker: "MSFT" },
  { match: /\bapple\b/i, ticker: "AAPL" },
  { match: /\btesla\b/i, ticker: "TSLA" },
  { match: /\bamazon\b/i, ticker: "AMZN" },
  { match: /\b(google|alphabet)\b/i, ticker: "GOOGL" },
  { match: /\bnvidia\b/i, ticker: "NVDA" },
  { match: /\b(meta|facebook)\b/i, ticker: "META" },
  { match: /\b(advanced micro devices|amd)\b/i, ticker: "AMD" },
  { match: /\bberkshire\b/i, ticker: "BRK.B" },
  { match: /\b(jpmorgan|jp morgan|chase)\b/i, ticker: "JPM" },
  { match: /\bvisa\b/i, ticker: "V" },
  { match: /\bwalmart\b/i, ticker: "WMT" },
  { match: /\b(eli lilly|lilly)\b/i, ticker: "LLY" },
  { match: /\bbroadcom\b/i, ticker: "AVGO" },
  { match: /\bnetflix\b/i, ticker: "NFLX" },
  { match: /\bcostco\b/i, ticker: "COST" },
  { match: /\bpalantir\b/i, ticker: "PLTR" },
  { match: /\bintel\b/i, ticker: "INTC" },
  { match: /\bcoinbase\b/i, ticker: "COIN" },
  { match: /\buber\b/i, ticker: "UBER" },
  { match: /\bairbnb\b/i, ticker: "ABNB" },
  { match: /\bmastercard\b/i, ticker: "MA" },
  { match: /\bsalesforce\b/i, ticker: "CRM" },
  { match: /\badobe\b/i, ticker: "ADBE" },
  { match: /\bcisco\b/i, ticker: "CSCO" },
  { match: /\boracle\b/i, ticker: "ORCL" },
  { match: /\bqualcomm\b/i, ticker: "QCOM" },
  { match: /\b(disney|walt disney)\b/i, ticker: "DIS" },
  { match: /\b(coca[\s-]?cola|coke)\b/i, ticker: "KO" },
  { match: /\bpepsi(co)?\b/i, ticker: "PEP" },
  { match: /\bpfizer\b/i, ticker: "PFE" },
  { match: /\bnike\b/i, ticker: "NKE" },
  { match: /\bmcdonald'?s\b/i, ticker: "MCD" },
  { match: /\b(exxon|exxonmobil)\b/i, ticker: "XOM" },
  { match: /\bchevron\b/i, ticker: "CVX" },
  { match: /\bbank of america\b/i, ticker: "BAC" },
  { match: /\bwells fargo\b/i, ticker: "WFC" },
  { match: /\bmorgan stanley\b/i, ticker: "MS" },
  { match: /\bgoldman\b/i, ticker: "GS" },
  { match: /\bblackrock\b/i, ticker: "BLK" },
  { match: /\bpaypal\b/i, ticker: "PYPL" },
  { match: /\b(square|block inc)\b/i, ticker: "SQ" },
  { match: /\bsnowflake\b/i, ticker: "SNOW" },
  { match: /\bservicenow\b/i, ticker: "NOW" },
  { match: /\bcrowdstrike\b/i, ticker: "CRWD" },
  { match: /\bpalo alto networks\b/i, ticker: "PANW" },
  { match: /\bmicron\b/i, ticker: "MU" },
  { match: /\bapplied materials\b/i, ticker: "AMAT" },
  { match: /\btexas instruments\b/i, ticker: "TXN" },
  { match: /\barm holdings\b/i, ticker: "ARM" },
  { match: /\bsuper micro\b/i, ticker: "SMCI" },
  { match: /\b(tsmc|taiwan semiconductor)\b/i, ticker: "TSM" },
  { match: /\basml\b/i, ticker: "ASML" },
  { match: /\bshopify\b/i, ticker: "SHOP" },
  { match: /\bspotify\b/i, ticker: "SPOT" },
  { match: /\broblox\b/i, ticker: "RBLX" },
  { match: /\b(snap|snapchat)\b/i, ticker: "SNAP" },
  { match: /\bpinterest\b/i, ticker: "PINS" },
  { match: /\brobinhood\b/i, ticker: "HOOD" },
  { match: /\bboeing\b/i, ticker: "BA" },
  { match: /\bgeneral electric\b/i, ticker: "GE" },
  { match: /\bcaterpillar\b/i, ticker: "CAT" },
  { match: /\b(johnson & johnson|j&j)\b/i, ticker: "JNJ" },
  { match: /\bunitedhealth\b/i, ticker: "UNH" },
  { match: /\b(procter & gamble|p&g)\b/i, ticker: "PG" },
  { match: /\bstarbucks\b/i, ticker: "SBUX" },
  { match: /\btarget\b/i, ticker: "TGT" },
  { match: /\bhome depot\b/i, ticker: "HD" },
  { match: /\blowe'?s\b/i, ticker: "LOW" },
  { match: /\bgeneral motors\b/i, ticker: "GM" },
  { match: /\bford\b/i, ticker: "F" },
  { match: /\bat&t\b/i, ticker: "T" },
  { match: /\bverizon\b/i, ticker: "VZ" },
  { match: /\bt[\s-]?mobile\b/i, ticker: "TMUS" },
  { match: /\bmoderna\b/i, ticker: "MRNA" },
  { match: /\bnovo nordisk\b/i, ticker: "NVO" },
  { match: /\bastrazeneca\b/i, ticker: "AZN" },
  { match: /\bnovartis\b/i, ticker: "NVS" },
  { match: /\babbvie\b/i, ticker: "ABBV" },
  { match: /\bmerck\b/i, ticker: "MRK" },
];

// 2. Official Indian Equities Tickers (NSE India)
const INDIA_STOCK_MAPPINGS: TickerMapping[] = [
  // Tata Group
  { match: /\btata motors passenger\b/i, ticker: "TMPV" },
  { match: /\btata motors commercial\b/i, ticker: "TMCV" },
  { match: /\btata motors\b/i, ticker: "TATAMOTORS" },
  { match: /\b(tcs|tata consultancy)\b/i, ticker: "TCS" },
  { match: /\btata power\b/i, ticker: "TATAPOWER" },
  { match: /\btata steel\b/i, ticker: "TATASTEEL" },
  { match: /\btata consumer\b/i, ticker: "TATACONSUM" },
  { match: /\btata elxsi\b/i, ticker: "TATAELXSI" },
  { match: /\btata tech(nologies)?\b/i, ticker: "TATATECH" },
  { match: /\btata comm(unications)?\b/i, ticker: "TATACOMM" },
  { match: /\btata chem(icals)?\b/i, ticker: "TATACHEM" },

  // Reliance & Jio
  { match: /\b(jio platforms|jpl)\b/i, ticker: "JPL" },
  { match: /\b(jio financial|jiofin)\b/i, ticker: "JIOFIN" },
  { match: /\breliance\b/i, ticker: "RELIANCE" },

  // Banking & Financials
  { match: /\b(sbi cards|sbi card)\b/i, ticker: "SBICARD" },
  { match: /\bsbi life\b/i, ticker: "SBILIFE" },
  { match: /\b(state bank of india|sbi)\b/i, ticker: "SBIN" },
  { match: /\bhdfc bank\b/i, ticker: "HDFCBANK" },
  { match: /\bhdfc life\b/i, ticker: "HDFCLIFE" },
  { match: /\bhdfc amc\b/i, ticker: "HDFCAMC" },
  { match: /\bhdfc\b/i, ticker: "HDFCBANK" },
  { match: /\bicici prudential life\b/i, ticker: "ICICIPRULI" },
  { match: /\bicici lombard\b/i, ticker: "ICICIGI" },
  { match: /\bicici bank\b/i, ticker: "ICICIBANK" },
  { match: /\bicici\b/i, ticker: "ICICIBANK" },
  { match: /\bkotak mahindra\b/i, ticker: "KOTAKBANK" },
  { match: /\bkotak\b/i, ticker: "KOTAKBANK" },
  { match: /\baxis bank\b/i, ticker: "AXISBANK" },
  { match: /\bindusind\b/i, ticker: "INDUSINDBK" },
  { match: /\bbank of baroda\b/i, ticker: "BANKBARODA" },
  { match: /\b(punjab national|pnb)\b/i, ticker: "PNB" },
  { match: /\bcanara bank\b/i, ticker: "CANBK" },
  { match: /\bunion bank\b/i, ticker: "UNIONBANK" },
  { match: /\bindian bank\b/i, ticker: "INDIANB" },
  { match: /\bidfc first\b/i, ticker: "IDFCFIRSTB" },
  { match: /\bfederal bank\b/i, ticker: "FEDERALBNK" },
  { match: /\byes bank\b/i, ticker: "YESBANK" },
  { match: /\bbandhan bank\b/i, ticker: "BANDHANBNK" },
  { match: /\bau small finance\b/i, ticker: "AUBANK" },
  { match: /\bbajaj finance\b/i, ticker: "BAJFINANCE" },
  { match: /\bbajaj finserv\b/i, ticker: "BAJAJFINSV" },

  // IT & Tech
  { match: /\binfosys\b/i, ticker: "INFY" },
  { match: /\bwipro\b/i, ticker: "WIPRO" },
  { match: /\b(hcl tech|hcl technologies)\b/i, ticker: "HCLTECH" },
  { match: /\btech mahindra\b/i, ticker: "TECHM" },
  { match: /\bltimindtree\b/i, ticker: "LTIM" },
  { match: /\bbirlasoft\b/i, ticker: "BSOFT" },

  // Consumer & Retail
  { match: /\b(zomato|eternal)\b/i, ticker: "ZOMATO" },
  { match: /\bswiggy\b/i, ticker: "SWIGGY" },
  { match: /\b(one 97|paytm)\b/i, ticker: "PAYTM" },
  { match: /\b(nykaa|fsn e-commerce)\b/i, ticker: "NYKAA" },
  { match: /\b(policybazaar|pb fintech)\b/i, ticker: "POLICYBZR" },
  { match: /\bdelhivery\b/i, ticker: "DELHIVERY" },
  { match: /\btrent\b/i, ticker: "TRENT" },
  { match: /\btitan\b/i, ticker: "TITAN" },
  { match: /\bkalyan jewellers\b/i, ticker: "KALYANKJIL" },
  { match: /\bvarun beverages\b/i, ticker: "VBL" },
  { match: /\b(hindustan unilever|hul)\b/i, ticker: "HINDUNILVR" },
  { match: /\bitc\b/i, ticker: "ITC" },
  { match: /\bbritannia\b/i, ticker: "BRITANNIA" },
  { match: /\bnestle india\b/i, ticker: "NESTLEIND" },
  { match: /\bdabur\b/i, ticker: "DABUR" },
  { match: /\bmarico\b/i, ticker: "MARICO" },
  { match: /\bgodrej consumer\b/i, ticker: "GODREJCP" },
  { match: /\basian paints\b/i, ticker: "ASIANPAINT" },
  { match: /\bberger paints\b/i, ticker: "BERGEPAINT" },

  // Auto
  { match: /\bmaruti( suzuki)?\b/i, ticker: "MARUTI" },
  { match: /\b(mahindra & mahindra|m&m)\b/i, ticker: "M&M" },
  { match: /\bhero moto(corp)?\b/i, ticker: "HEROMOTOCO" },
  { match: /\beicher motors\b/i, ticker: "EICHERMOT" },
  { match: /\bbajaj auto\b/i, ticker: "BAJAJ-AUTO" },
  { match: /\btvs motor\b/i, ticker: "TVSMOTOR" },

  // Telecom & Energy / Heavy
  { match: /\b(bharti airtel|airtel)\b/i, ticker: "BHARTIARTL" },
  { match: /\b(vodafone idea|idea)\b/i, ticker: "IDEA" },
  { match: /\b(larsen & toubro|l&t)\b/i, ticker: "LT" },
  { match: /\bpower grid\b/i, ticker: "POWERGRID" },
  { match: /\bntpc\b/i, ticker: "NTPC" },
  { match: /\b(ongc|oil & natural gas)\b/i, ticker: "ONGC" },
  { match: /\bcoal india\b/i, ticker: "COALINDIA" },
  { match: /\b(bpcl|bharat petroleum)\b/i, ticker: "BPCL" },
  { match: /\b(ioc|indian oil)\b/i, ticker: "IOC" },
  { match: /\b(hpcl|hindustan petroleum)\b/i, ticker: "HPCL" },
  { match: /\bgail\b/i, ticker: "GAIL" },
  { match: /\bvedanta\b/i, ticker: "VEDL" },

  // Defense & Infrastructure
  { match: /\b(hal|hindustan aeronautics)\b/i, ticker: "HAL" },
  { match: /\b(bel|bharat electronics)\b/i, ticker: "BEL" },
  { match: /\b(bdl|bharat dynamics)\b/i, ticker: "BDL" },
  { match: /\bmazagon dock\b/i, ticker: "MAZDOCK" },
  { match: /\bcochin shipyard\b/i, ticker: "COCHINSHIP" },
  { match: /\bireda\b/i, ticker: "IREDA" },
  { match: /\birfc\b/i, ticker: "IRFC" },
  { match: /\birctc\b/i, ticker: "IRCTC" },
  { match: /\b(rvnl|rail vikas)\b/i, ticker: "RVNL" },
  { match: /\bbhel\b/i, ticker: "BHEL" },
  { match: /\bbeml\b/i, ticker: "BEML" },
  { match: /\bsiemens\b/i, ticker: "SIEMENS" },
  { match: /\babb india\b/i, ticker: "ABB" },
  { match: /\bsuzlon\b/i, ticker: "SUZLON" },

  // Adani
  { match: /\badani ent(erprises)?\b/i, ticker: "ADANIENT" },
  { match: /\badani port(s)?\b/i, ticker: "ADANIPORTS" },
  { match: /\badani power\b/i, ticker: "ADANIPOWER" },
  { match: /\badani green\b/i, ticker: "ADANIGREEN" },
  { match: /\badani total gas\b/i, ticker: "ATGL" },
  { match: /\badani energy\b/i, ticker: "ADANIENSOL" },
  { match: /\badani wilmar\b/i, ticker: "AWL" },

  // Metals & Cement
  { match: /\bjsw steel\b/i, ticker: "JSWSTEEL" },
  { match: /\bhindalco\b/i, ticker: "HINDALCO" },
  { match: /\b(sail|steel authority)\b/i, ticker: "SAIL" },
  { match: /\bultratech cement\b/i, ticker: "ULTRACEMCO" },
  { match: /\bgrasim\b/i, ticker: "GRASIM" },
  { match: /\bambuja cement\b/i, ticker: "AMBUJACEM" },
  { match: /\bacc limited\b/i, ticker: "ACC" },

  // Pharma & Healthcare
  { match: /\bsun pharma(ceutical)?\b/i, ticker: "SUNPHARMA" },
  { match: /\bdr\.?\s*reddy'?s\b/i, ticker: "DRREDDY" },
  { match: /\bcipla\b/i, ticker: "CIPLA" },
  { match: /\bdivi'?s lab\b/i, ticker: "DIVISLAB" },
  { match: /\bapollo hospitals\b/i, ticker: "APOLLOHOSP" },
  { match: /\bzydus\b/i, ticker: "ZYDUSLIFE" },
  { match: /\blupin\b/i, ticker: "LUPIN" },
  { match: /\baurobindo pharma\b/i, ticker: "AUROPHARMA" },
  { match: /\btorrent pharma\b/i, ticker: "TORNTPHARM" },

  // Exchanges & Depository
  { match: /\bcdsl\b/i, ticker: "CDSL" },
  { match: /\bbse limited\b/i, ticker: "BSE" },
  { match: /\bmcx\b/i, ticker: "MCX" },
  { match: /\bangel one\b/i, ticker: "ANGELONE" },
  { match: /\bcams\b/i, ticker: "CAMS" },
  { match: /\bkfintech\b/i, ticker: "KFINTECH" },
  { match: /\bdlf\b/i, ticker: "DLF" },
  { match: /\blodha\b/i, ticker: "LODHA" },
];

// 3. Official Mutual Fund House (AMC) Abbreviations
const MF_AMC_MAPPINGS: TickerMapping[] = [
  { match: /\b(parag parikh|ppfas)\b/i, ticker: "PPFAS" },
  { match: /\bquant\b/i, ticker: "QUANT" },
  { match: /\bmirae asset\b/i, ticker: "MIRAE" },
  { match: /\bnippon india\b/i, ticker: "NIPPON" },
  { match: /\b(sbi mutual fund|sbi focused|sbi small|sbi contra|sbi magnum|sbi mf)\b/i, ticker: "SBI MF" },
  { match: /\b(icici prudential|icici pru)\b/i, ticker: "ICICI PRU" },
  { match: /\b(hdfc mid-cap|hdfc small cap|hdfc top 100|hdfc flexi|hdfc mutual fund|hdfc mf)\b/i, ticker: "HDFC MF" },
  { match: /\b(axis small cap|axis bluechip|axis midcap|axis mutual fund|axis mf)\b/i, ticker: "AXIS MF" },
  { match: /\b(motilal oswal|moswal)\b/i, ticker: "MOSWAL" },
  { match: /\b(kotak emerging|kotak small cap|kotak bluechip|kotak mutual fund|kotak mf)\b/i, ticker: "KOTAK MF" },
  { match: /\b(uti nifty 50|uti mastershare|uti mutual fund|uti mf)\b/i, ticker: "UTI MF" },
  { match: /\b(tata digital india|tata small cap|tata mutual fund|tata mf)\b/i, ticker: "TATA MF" },
  { match: /\b(dsp midcap|dsp small cap|dsp mutual fund|dsp mf)\b/i, ticker: "DSP MF" },
  { match: /\b(bandhan sterling|bandhan mutual fund|bandhan)\b/i, ticker: "BANDHAN" },
  { match: /\bcanara robeco\b/i, ticker: "CANARA" },
  { match: /\bsundaram\b/i, ticker: "SUNDARAM" },
  { match: /\b(franklin templeton|franklin india)\b/i, ticker: "FRANKLIN" },
  { match: /\binvesco\b/i, ticker: "INVESCO" },
  { match: /\bedelweiss\b/i, ticker: "EDELWEISS" },
  { match: /\b(hsbc small cap|hsbc mid cap|hsbc mutual fund|hsbc mf)\b/i, ticker: "HSBC MF" },
  { match: /\bpgim india\b/i, ticker: "PGIM" },
  { match: /\bwhiteoak\b/i, ticker: "WHITEOAK" },
  { match: /\bgroww\b/i, ticker: "GROWW" },
  { match: /\bzerodha\b/i, ticker: "ZERODHA" },
  { match: /\bnavi\b/i, ticker: "NAVI" },
  { match: /\b360 one\b/i, ticker: "360 ONE" },
  { match: /\bmahindra manulife\b/i, ticker: "MAHINDRA" },
  { match: /\b(baroda bnp|bnp paribas)\b/i, ticker: "BARODA BNP" },
  { match: /\bunion mutual fund\b/i, ticker: "UNION MF" },
  { match: /\bquantum mutual\b/i, ticker: "QUANTUM" },
  { match: /\btaurus mutual\b/i, ticker: "TAURUS" },
  { match: /\bsamco\b/i, ticker: "SAMCO" },
  { match: /\bhelios\b/i, ticker: "HELIOS" },
  { match: /\bold bridge\b/i, ticker: "OLD BRIDGE" },
  { match: /\bjm financial\b/i, ticker: "JM FIN" },
  { match: /\blic mutual\b/i, ticker: "LIC MF" },
  { match: /\bbank of india mutual\b/i, ticker: "BOI MF" },
  { match: /\bshriram mutual\b/i, ticker: "SHRIRAM" },
  { match: /\biti mutual\b/i, ticker: "ITI MF" },
  { match: /\btrust mutual\b/i, ticker: "TRUST MF" },
  { match: /\bnj mutual\b/i, ticker: "NJ MF" },
  { match: /\b(aditya birla sun life|absl)\b/i, ticker: "ABSL MF" },
];

// 4. ETFs & Commodities
const ETF_MAPPINGS: TickerMapping[] = [
  { match: /\b(gold bees|goldbees)\b/i, ticker: "GOLDBEES" },
  { match: /\b(nifty bees|niftybees)\b/i, ticker: "NIFTYBEES" },
  { match: /\b(bank bees|bankbees)\b/i, ticker: "BANKBEES" },
  { match: /\b(it bees|itbees)\b/i, ticker: "ITBEES" },
  { match: /\b(silver bees|silverbees)\b/i, ticker: "SILVERBEES" },
  { match: /\bjunior bees\b/i, ticker: "JUNIORBEES" },
  { match: /\bcpse etf\b/i, ticker: "CPSEETF" },
  { match: /\bbharat 22\b/i, ticker: "BHARAT22" },
  { match: /\bhdfc gold\b/i, ticker: "HDFCGOLD" },
  { match: /\bsbi gold\b/i, ticker: "SBIGETS" },
  { match: /\b(voo|vanguard s&p 500|vanguard 500)\b/i, ticker: "VOO" },
  { match: /\b(ivv|ishares core s&p 500)\b/i, ticker: "IVV" },
  { match: /\b(splg|spdr portfolio s&p 500)\b/i, ticker: "SPLG" },
  { match: /\b(vti|vanguard total stock)\b/i, ticker: "VTI" },
  { match: /\b(vgt|vanguard information tech(?:nology)?)\b/i, ticker: "VGT" },
  { match: /\b(vxus|vanguard total international)\b/i, ticker: "VXUS" },
  { match: /\b(vug|vanguard growth)\b/i, ticker: "VUG" },
  { match: /\b(vtv|vanguard value)\b/i, ticker: "VTV" },
  { match: /\b(vym|vanguard high dividend)\b/i, ticker: "VYM" },
  { match: /\b(vea|vanguard (?:ftse )?developed)\b/i, ticker: "VEA" },
  { match: /\b(vwo|vanguard (?:ftse )?emerging)\b/i, ticker: "VWO" },
  { match: /\b(bnd|vanguard total bond)\b/i, ticker: "BND" },
  { match: /\b(schd|schwab u\.?s\.? dividend)\b/i, ticker: "SCHD" },
  { match: /\b(qqqm|invesco nasdaq 100)\b/i, ticker: "QQQM" },
  { match: /\b(qqq|nasdaq 100)\b/i, ticker: "QQQ" },
  { match: /\b(spdr s&p 500|s&p 500|spy)\b/i, ticker: "SPY" },
];

// 5. Cryptocurrencies
const CRYPTO_MAPPINGS: TickerMapping[] = [
  { match: /\bbitcoin\b/i, ticker: "BTC" },
  { match: /\bethereum\b/i, ticker: "ETH" },
  { match: /\bsolana\b/i, ticker: "SOL" },
  { match: /\b(ripple|xrp)\b/i, ticker: "XRP" },
  { match: /\b(cardano|ada)\b/i, ticker: "ADA" },
  { match: /\bdogecoin\b/i, ticker: "DOGE" },
  { match: /\b(binance coin|bnb)\b/i, ticker: "BNB" },
  { match: /\b(polygon|matic)\b/i, ticker: "POL" },
  { match: /\b(polkadot|dot)\b/i, ticker: "DOT" },
  { match: /\bavalanche\b/i, ticker: "AVAX" },
];

/**
 * Returns the authentic stock ticker or mutual fund abbreviation for any asset name.
 */
export function getStockTicker(name: string, category?: string): string {
  if (!name) return "";
  const trimmed = name.trim();

  // 1. If user entered a pure ticker already (e.g. "MSFT", "AAPL", "TCS", "BTC")
  if (/^[A-Z0-9.-]{1,8}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const isMF =
    category === "Mutual Funds" ||
    (category !== "US Stocks" &&
      category !== "Indian Equities" &&
      /mutual fund|fund|direct|growth|regular|idcw|amfi|flexi cap|small cap|mid cap|large cap/i.test(trimmed));

  // 2. Mutual Fund Lookups
  if (isMF) {
    for (const mapping of MF_AMC_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }

    // Check for AMFI Scheme code e.g. "MF-120503" or digits
    const mfMatch = trimmed.match(/\b(?:MF-)?(\d{5,7})\b/i);
    if (mfMatch) {
      return `MF-${mfMatch[1]}`;
    }

    // Generic Mutual Fund AMC extraction (strip out noise suffixes)
    const cleanMF = trimmed
      .replace(/\b(direct|growth|regular|idcw|dividend|plan|option|fund|scheme|open-ended|equity|cap|index|opportunities|bluechip|balanced|advantage|hybrid|debt|tax saver|elss)\b/gi, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim();
    const mfWords = cleanMF.split(/\s+/).filter(Boolean);
    if (mfWords.length > 0) {
      const candidate = mfWords.slice(0, 2).join(" ").toUpperCase();
      if (candidate.length <= 12) return candidate;
      return mfWords[0].toUpperCase();
    }
  }

  // 3. Crypto Lookups
  if (category === "Crypto" || /\b(crypto|coin|token)\b/i.test(trimmed)) {
    for (const mapping of CRYPTO_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }
  }

  // 4. ETFs & Commodities
  for (const mapping of ETF_MAPPINGS) {
    if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
      return mapping.ticker;
    }
  }

  // 5. US Stocks Lookup
  if (category === "US Stocks" || category === undefined) {
    for (const mapping of US_STOCK_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }
  }

  // 6. Indian Equities Lookup
  if (category === "Indian Equities" || category === undefined) {
    for (const mapping of INDIA_STOCK_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }
  }

  // 7. If category was not passed or not matched yet, check both pools
  if (category !== "Indian Equities") {
    for (const mapping of US_STOCK_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }
  }
  if (category !== "US Stocks") {
    for (const mapping of INDIA_STOCK_MAPPINGS) {
      if (typeof mapping.match === "string" ? trimmed.toLowerCase().includes(mapping.match) : mapping.match.test(trimmed)) {
        return mapping.ticker;
      }
    }
  }

  // 8. Check if name has parenthesis ticker e.g. "Unknown Co. (ACME)" or "Custom (TICK)"
  const paren = trimmed.match(/\((?:NSE:|BSE:|NASDAQ:|NYSE:)?([A-Z0-9.-]{1,15})\)/i);
  if (paren && paren[1] && !/^(ltd|inc|corp|co|fund)$/i.test(paren[1])) {
    return paren[1].toUpperCase();
  }

  // 9. Clean Fallback Logic for Unlisted / Custom Holdings
  const clean = trimmed
    .replace(
      /\b(limited|ltd|corporation|corp|incorporated|inc|holdings|company|co|group|plc|pvt|private|class a|class b|class c)\b/gi,
      ""
    )
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 6).toUpperCase();
  }
  if (words.length > 1) {
    const acronym = words.map((w) => w[0]).join("").toUpperCase();
    if (acronym.length >= 2 && acronym.length <= 5) return acronym;
    return words[0].slice(0, 6).toUpperCase();
  }

  return trimmed.slice(0, 5).toUpperCase();
}

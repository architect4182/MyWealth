"use client";

import React, { useState, useEffect } from "react";
import { AssetCategory } from "@/types/portfolio";

/**
 * Free Company Logo API: https://api.companyenrich.com/logo/{domain}
 */
export const COMPANY_LOGO_API = "https://api.companyenrich.com/logo";

/**
 * Dynamically resolves a clean website domain from a company name or ticker.
 * E.g.:
 *   "youtube.com"         -> "youtube.com"
 *   "Apple Inc."          -> "apple.com"
 *   "Tata Motors Ltd"     -> "tatamotors.com"
 *   "State Bank of India" -> "sbi.co.in"
 */
export function getCompanyDomain(name: string, ticker: string = ""): string {
  const trimmed = (name || ticker || "").trim();
  if (!trimmed) return "google.com";

  // 1. Direct domain match (e.g. youtube.com, amazon.com)
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // 2. Clean legal entities, punctuation, and fund terms
  const clean = trimmed
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(
      /\b(limited|ltd|corporation|corp|incorporated|inc|holdings|company|co|group|plc|pvt|private|class a|class b|class c|shares|share|fund|etf)\b/gi,
      ""
    )
    .replace(/\s+/g, "")
    .toLowerCase();

  // 3. Known alternate TLDs, brand prefixes, or parent brand entities
  const domainOverrides: Record<string, string> = {
    // Indian Banks & Financials
    sbi: "sbi.co.in",
    statebankofindia: "sbi.co.in",
    sbin: "sbi.co.in",
    hdfcbank: "hdfcbank.com",
    icicibank: "icicibank.com",
    axisbank: "axisbank.com",
    kotakbank: "kotak.com",
    kotakmahindrabank: "kotak.com",
    bajfinance: "bajajfinserv.in",
    bajajfinance: "bajajfinserv.in",
    jiofin: "jio.com",
    jiofinancialservices: "jio.com",
    ireda: "ireda.in",
    indianrenewableenergydev: "ireda.in",
    indianrenewabledev: "ireda.in",
    irfc: "irfc.co.in",
    indianrailwayfinance: "irfc.co.in",
    // Indian Equities
    airtel: "airtel.in",
    bhartiairtel: "airtel.in",
    bhartiartl: "airtel.in",
    reliance: "ril.com",
    relianceindustries: "ril.com",
    jio: "jio.com",
    jioplatforms: "jio.com",
    tcs: "tcs.com",
    tataconsultancyservices: "tcs.com",
    tatamotors: "tatamotors.com",
    tmpv: "tatamotors.com",
    tmcv: "tatamotors.com",
    tatapower: "tatapower.com",
    tatasteel: "tatasteel.com",
    tataconsum: "tataconsumer.com",
    tataconsumerproducts: "tataconsumer.com",
    infy: "infosys.com",
    infosys: "infosys.com",
    wipro: "wipro.com",
    zomato: "zomato.com",
    eternal: "zomato.com",
    swiggy: "swiggy.com",
    paytm: "paytm.com",
    one97communicationspaytm: "paytm.com",
    one97commpaytm: "paytm.com",
    itc: "itcportal.com",
    lt: "larsentoubro.com",
    larsentoubro: "larsentoubro.com",
    hindunilvr: "hul.co.in",
    hindustanunilever: "hul.co.in",
    sunpharma: "sunpharma.com",
    sunpharmaceutical: "sunpharma.com",
    maruti: "marutisuzuki.com",
    marutisuzuki: "marutisuzuki.com",
    titan: "titan.co.in",
    mm: "mahindra.com",
    mahindramahindra: "mahindra.com",
    adanient: "adani.com",
    adanienterprises: "adani.com",
    adaniports: "adaniports.com",
    adaniportssez: "adaniports.com",
    powergrid: "powergrid.in",
    ntpc: "ntpc.co.in",
    ongc: "ongcindia.com",
    coalindia: "coalindia.in",
    hal: "hal-india.co.in",
    hindustanaeronautics: "hal-india.co.in",
    bel: "bel-india.in",
    bharatelectronics: "bel-india.in",
    irctc: "irctc.co.in",
    // Indian Mutual Fund AMCs
    navi: "navi.com",
    ppfas: "ppfas.com",
    paragparikh: "ppfas.com",
    quant: "quantmutual.com",
    mirae: "miraeassetmf.co.in",
    miraeasset: "miraeassetmf.co.in",
    sbimf: "sbi.bank.in",
    nippon: "nipponindiaim.com",
    nipponindia: "nipponindiaim.com",
    icicipru: "icicibank.com",
    iciciprudential: "icicibank.com",
    hdfcmf: "hdfcbank.com",
    axismf: "axisbank.com",
    moswal: "motilaloswalmf.com",
    motilaloswal: "motilaloswalmf.com",
    utimf: "utimf.com",
    uti: "utimf.com",
    tatamf: "tata.com",
    kotakmf: "kotak.com",
    dspmf: "dspim.com",
    dsp: "dspim.com",
    bandhan: "bandhanbank.com",
    edelweiss: "edelweissmf.com",
    canararobeco: "canararobeco.com",
    adityabirla: "adityabirlacapital.com",
    whiteoak: "whiteoakamc.com",
    sundaram: "sundarammutual.com",
    franklin: "franklintempletonindia.com",
    helios: "heliosmf.in",
    zerodha: "zerodhafundhouse.com",
    groww: "groww.in",
    // US Equities & ETFs
    alphabet: "google.com",
    google: "google.com",
    googl: "google.com",
    meta: "meta.com",
    metaplatforms: "meta.com",
    broadcom: "broadcom.com",
    avgo: "broadcom.com",
    jpmorgan: "jpmorganchase.com",
    jpm: "jpmorganchase.com",
    jpmorganchase: "jpmorganchase.com",
    berkshirehathaway: "berkshirehathaway.com",
    brkb: "berkshirehathaway.com",
    brka: "berkshirehathaway.com",
    vanguard: "corporate.vanguard.com",
    voo: "corporate.vanguard.com",
    vti: "corporate.vanguard.com",
    vgt: "corporate.vanguard.com",
    vxus: "corporate.vanguard.com",
    vug: "corporate.vanguard.com",
    vtv: "corporate.vanguard.com",
    vym: "corporate.vanguard.com",
    vea: "corporate.vanguard.com",
    vwo: "corporate.vanguard.com",
    bnd: "corporate.vanguard.com",
    qqq: "invesco.com",
    qqqm: "invesco.com",
    invesco: "invesco.com",
    spy: "ssga.com",
    splg: "ssga.com",
    spdr: "ssga.com",
    ishares: "ishares.com",
    blackrock: "blackrock.com",
    schwab: "schwab.com",
    schd: "schwab.com",
  };

  const tKey = ticker.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (domainOverrides[tKey]) return domainOverrides[tKey];
  if (domainOverrides[clean]) return domainOverrides[clean];

  // Match well-known Mutual Fund AMC & ETF prefixes when full scheme title includes index/plan words
  const lowerName = trimmed.toLowerCase();
  const prefixRules: Array<[string, string]> = [
    ["parag parikh", "ppfas.com"],
    ["ppfas", "ppfas.com"],
    ["navi ", "navi.com"],
    ["quant ", "quantmutual.com"],
    ["mirae asset", "miraeassetmf.co.in"],
    ["sbi ", "sbimf.com"],
    ["nippon india", "mf.nipponindiaim.com"],
    ["icici prudential", "icicibank.com"],
    ["hdfc ", "hdfcbank.com"],
    ["axis ", "axisbank.com"],
    ["motilal oswal", "motilaloswalmf.com"],
    ["uti ", "utimf.com"],
    ["kotak ", "kotak.com"],
    ["dsp ", "dspim.com"],
    ["bandhan ", "bandhanmutual.com"],
    ["edelweiss ", "edelweissmf.com"],
    ["aditya birla", "adityabirlacapital.com"],
    ["canara robeco", "canararobeco.com"],
    ["franklin ", "franklintempletonindia.com"],
    ["sundaram ", "sundarammutual.com"],
    ["whiteoak", "whiteoakamc.com"],
    ["bajaj finserv", "bajajfinserv.in"],
    ["hsbc ", "hsbc.com"],
    ["pgim ", "pgim.com"],
    ["zerodha ", "zerodhafundhouse.com"],
    ["groww ", "groww.in"],
    ["360 one", "360.one"],
    ["helios ", "heliosmf.in"],
    ["union ", "unionmf.com"],
    ["lic mf", "licmf.com"],
    ["tata digital", "tata.com"],
    ["tata nifty", "tata.com"],
    ["tata small", "tata.com"],
    ["tata mid", "tata.com"],
    ["tata flexi", "tata.com"],
    ["zomato", "zomato.com"],
    ["eternal", "zomato.com"],
    ["paytm", "paytm.com"],
    ["one 97", "paytm.com"],
    ["mahindra & mahindra", "mahindra.com"],
    ["adani ports", "adaniports.com"],
    ["adani enterprises", "adani.com"],
    ["indian renewable", "ireda.in"],
    ["indian railway finance", "irfc.co.in"],
    ["vanguard", "corporate.vanguard.com"],
    ["ishares", "ishares.com"],
    ["spdr", "ssga.com"],
    ["invesco", "invesco.com"],
    ["charles schwab", "schwab.com"],
    ["berkshire hathaway", "berkshirehathaway.com"],
  ];

  for (const [needle, targetDomain] of prefixRules) {
    if (lowerName.startsWith(needle) || lowerName.includes(needle)) {
      return targetDomain;
    }
  }

  if (clean.length >= 2) return `${clean}.com`;
  if (tKey.length >= 2) return `${tKey}.com`;
  return "google.com";
}

/**
 * Dynamically extract ticker / abbreviation from company or fund name
 */
export { getStockTicker } from "@/utils/tickers";

/**
 * In-memory cache for successfully loaded logo domains
 * Enables instantaneous display for previously seen logos without network flicker
 */
const loadedLogosCache = new Set<string>();

/**
 * Domains whose CompanyEnrich endpoint returns a generic grey monogram circle
 * instead of an actual brand emblem; use FinancialModelingPrep stock logo instead.
 */
const FMP_LOGO_TICKER_OVERRIDES: Record<string, string> = {
  "berkshirehathaway.com": "BRK-B",
  "corporate.vanguard.com": "VOO",
};

const AVATAR_PALETTES = [
  { bg: "#ede9fe", color: "#6d28d9", border: "transparent" },
  { bg: "#f3e8ff", color: "#7e22ce", border: "transparent" },
  { bg: "#e0e7ff", color: "#4338ca", border: "transparent" },
  { bg: "#f5f3ff", color: "#5b21b6", border: "transparent" },
  { bg: "#fae8ff", color: "#a21caf", border: "transparent" },
];

export function getCompanyMonogram(name: string, ticker: string = ""): string {
  const t = (ticker || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cleanName = (name || "")
    .replace(/\b(limited|ltd|corp|corporation|inc|holdings|pvt|fund|etf)\b/gi, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "");

  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (t.length >= 2) {
    return t.slice(0, 2);
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2);
  }
  return (t || cleanName || "A").slice(0, 1) || "A";
}

function getPaletteForEntity(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

/**
 * Universal dynamic Stock/Company Logo Avatar powered by https://api.companyenrich.com/logo/{domain}
 * Immediately renders high-visibility company initials/monogram so names & info
 * are fully legible before remote logos load asynchronously over the network.
 */
export const StockLogoAvatar = React.memo(function StockLogoAvatar({
  name,
  ticker = "",
  category,
}: {
  name: string;
  ticker?: string;
  category?: AssetCategory;
}) {
  const domain = getCompanyDomain(name, ticker);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => (domain ? loadedLogosCache.has(domain) : false));

  // Special Category Badges
  if (category === "Gold & Fixed Income") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "11px",
          boxShadow: "inset 0 1px 0.5px rgba(255, 255, 255, 0.6)",
        }}
      >
        AU
      </div>
    );
  }

  if (category === "Crypto") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #F7931A, #E07B00)",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "12px",
          boxShadow: "inset 0 1px 0.5px rgba(255, 255, 255, 0.6)",
        }}
      >
        ₿
      </div>
    );
  }

  const monogram = getCompanyMonogram(name, ticker);
  const palette = getPaletteForEntity(ticker || name || "company");
  const normalizedUsTicker = ticker
    .trim()
    .toUpperCase()
    .replace(/\.(NS|BO)$/i, "")
    .replace(/\./g, "-");
  const fmpLogoUrl =
    normalizedUsTicker && (category === "US Stocks" || FMP_LOGO_TICKER_OVERRIDES[domain])
      ? `https://financialmodelingprep.com/image-stock/${normalizedUsTicker || FMP_LOGO_TICKER_OVERRIDES[domain]
      }.png`
      : domain && FMP_LOGO_TICKER_OVERRIDES[domain]
        ? `https://financialmodelingprep.com/image-stock/${FMP_LOGO_TICKER_OVERRIDES[domain]}.png`
        : "";
  const companyEnrichUrl = domain ? `${COMPANY_LOGO_API}/${domain}` : "";
  const googleFaviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : "";
  const primaryLogoUrl =
    fmpLogoUrl ||
    (category === "Mutual Funds" ? googleFaviconUrl : companyEnrichUrl);
  const fallbackLogoUrl = fmpLogoUrl
    ? companyEnrichUrl
    : category === "Mutual Funds"
      ? companyEnrichUrl
      : googleFaviconUrl;
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const logoUrl = useFallbackLogo ? fallbackLogoUrl : primaryLogoUrl;

  useEffect(() => {
    setImgError(false);
    setUseFallbackLogo(false);
    setIsLoaded(domain ? loadedLogosCache.has(domain) : false);
  }, [domain, primaryLogoUrl]);

  return (
    <div
      className="apple-avatar-shell"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      {/* 1. Instant Monogram Base Layer (Company name & info are immediate!) */}
      <div
        className="apple-avatar-initials-badge"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: palette.bg,
          color: palette.color,
          border: "none",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: monogram.length > 2 ? "10px" : "11.5px",
          letterSpacing: "-0.01em",
          userSelect: "none",
        }}
      >
        {monogram}
      </div>

      {/* 2. Asynchronously Loaded Remote Logo (Fades in over monogram once ready) */}
      {!imgError && logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          width="100%"
          height="100%"
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            const img = e.currentTarget;
            // Reject Google S2's 16x16 default globe placeholder and fall back cleanly
            if (
              logoUrl.includes("google.com/s2/favicons") &&
              img.naturalWidth <= 16 &&
              img.naturalHeight <= 16
            ) {
              if (!useFallbackLogo && fallbackLogoUrl && fallbackLogoUrl !== logoUrl) {
                setUseFallbackLogo(true);
              } else {
                setImgError(true);
              }
              return;
            }
            loadedLogosCache.add(domain);
            setIsLoaded(true);
          }}
          onError={() => {
            if (!useFallbackLogo && fallbackLogoUrl && fallbackLogoUrl !== logoUrl) {
              setUseFallbackLogo(true);
            } else {
              setImgError(true);
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "inherit",
            background: "#ffffff",
            padding: "1px",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "block",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
});

/**
 * Clean, lightweight Broker/Investment App Logo Avatar
 */
export const BrokerLogoAvatar = React.memo(function BrokerLogoAvatar({
  brokerName,
  size = 28,
}: {
  brokerName: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const clean = (brokerName || "").toLowerCase().trim();
  let domain = "groww.in";
  if (clean.includes("groww")) domain = "groww.in";
  else if (clean.includes("zerodha") || clean.includes("kite") || clean.includes("coin")) domain = "zerodha.com";
  else if (clean.includes("angel")) domain = "angelone.in";
  else if (clean.includes("upstox")) domain = "upstox.com";
  else if (clean.includes("dhan")) domain = "dhan.co";
  else if (clean.includes("indmoney")) domain = "indmoney.com";
  else if (clean.includes("kuvera")) domain = "kuvera.in";
  else if (clean.includes("vested")) domain = "vestedfinance.com";
  else if (clean.includes("interactive")) domain = "interactivebrokers.com";
  else if (clean.includes("schwab")) domain = "schwab.com";
  else if (clean.includes("robinhood")) domain = "robinhood.com";
  else if (clean.includes("hdfc")) domain = "hdfcsky.com";
  else if (clean.includes("icici")) domain = "icicidirect.com";
  else if (clean.includes("kotak")) domain = "kotaksecurities.com";
  else if (clean.includes("coindcx")) domain = "coindcx.com";
  else if (clean.includes("wazirx")) domain = "wazirx.com";

  const initials = brokerName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "BR";

  const logoUrl = `${COMPANY_LOGO_API}/${domain}`;

  return (
    <div
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        background: "#f4f0ff",
        border: "1px solid rgba(147, 102, 255, 0.2)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: `${Math.max(9, Math.round(size * 0.36))}px`,
          color: "#9366FF",
          userSelect: "none",
        }}
      >
        {initials}
      </div>

      {!imgError && (
        <img
          src={logoUrl}
          alt={brokerName}
          width={size}
          height={size}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "inherit",
            background: "#ffffff",
            padding: "2px",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      )}
    </div>
  );
});

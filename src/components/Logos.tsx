"use client";

import React, { useState } from "react";
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

  // 3. Known alternate TLDs or parent brand entities (e.g. Indian banks/telcos)
  const domainOverrides: Record<string, string> = {
    sbi: "sbi.co.in",
    statebankofindia: "sbi.co.in",
    sbin: "sbi.co.in",
    airtel: "airtel.in",
    bhartiairtel: "airtel.in",
    reliance: "ril.com",
    relianceindustries: "ril.com",
    jio: "jio.com",
    jioplatforms: "jio.com",
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
    tcs: "tcs.com",
    tataconsultancyservices: "tcs.com",
  };

  const tKey = ticker.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (domainOverrides[tKey]) return domainOverrides[tKey];
  if (domainOverrides[clean]) return domainOverrides[clean];

  if (clean.length >= 2) return `${clean}.com`;
  if (tKey.length >= 2) return `${tKey}.com`;
  return "google.com";
}

/**
 * Dynamically extract ticker from company name
 */
export function getStockTicker(name: string): string {
  if (!name) return "";
  const paren = name.match(/\((?:NSE:|BSE:|NASDAQ:|NYSE:)?([A-Z0-9.-]+)\)/i);
  if (paren) return paren[1].toUpperCase();
  if (/^[A-Z]{1,6}$/.test(name.trim())) return name.trim();

  const lower = name.toLowerCase().trim();
  if (lower.includes("jio platforms") || lower === "jpl") return "JPL";
  if (lower.includes("jio financial") || lower === "jiofin") return "JIOFIN";
  if (lower.includes("reliance") && !lower.includes("jio")) return "RELIANCE";
  if (lower.includes("tata motors")) return "TATAMOTORS";
  if (lower.includes("tcs") || lower.includes("tata consultancy")) return "TCS";
  if (lower.includes("hdfc bank") || lower === "hdfc") return "HDFCBANK";

  const clean = name
    .replace(
      /\b(limited|ltd|corporation|corp|incorporated|inc|holdings|company|co|group|plc|pvt|private)\b/gi,
      ""
    )
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  if (words.length > 1) {
    const acronym = words.map((w) => w[0]).join("").toUpperCase();
    if (acronym.length >= 2 && acronym.length <= 5) return acronym;
    return words[0].slice(0, 5).toUpperCase();
  }
  return name.slice(0, 4).toUpperCase();
}

/**
 * In-memory cache for successfully loaded logo domains
 * Enables instantaneous display for previously seen logos without network flicker
 */
const loadedLogosCache = new Set<string>();

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
  const logoUrl = domain ? `${COMPANY_LOGO_API}/${domain}` : "";

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
          onLoad={() => {
            loadedLogosCache.add(domain);
            setIsLoaded(true);
          }}
          onError={() => setImgError(true)}
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

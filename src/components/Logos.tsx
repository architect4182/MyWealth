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
  { bg: "linear-gradient(135deg, rgba(0, 113, 227, 0.14) 0%, rgba(0, 113, 227, 0.05) 100%)", color: "#0071e3", border: "rgba(0, 113, 227, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(88, 86, 214, 0.14) 0%, rgba(88, 86, 214, 0.05) 100%)", color: "#5856d6", border: "rgba(88, 86, 214, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(175, 82, 222, 0.14) 0%, rgba(175, 82, 222, 0.05) 100%)", color: "#af52de", border: "rgba(175, 82, 222, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(52, 199, 89, 0.14) 0%, rgba(52, 199, 89, 0.05) 100%)", color: "#16a34a", border: "rgba(52, 199, 89, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(255, 149, 0, 0.14) 0%, rgba(255, 149, 0, 0.05) 100%)", color: "#d97706", border: "rgba(255, 149, 0, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(255, 45, 85, 0.14) 0%, rgba(255, 45, 85, 0.05) 100%)", color: "#e11d48", border: "rgba(255, 45, 85, 0.22)" },
  { bg: "linear-gradient(135deg, rgba(0, 199, 190, 0.14) 0%, rgba(0, 199, 190, 0.05) 100%)", color: "#0d9488", border: "rgba(0, 199, 190, 0.22)" },
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
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* 1. Instant Monogram Base Layer (Company name & info are immediate!) */}
      <div
        className="apple-avatar-initials-badge"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "8px",
          background: palette.bg,
          color: palette.color,
          border: `1px solid ${palette.border}`,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: monogram.length > 2 ? "10px" : "11.5px",
          letterSpacing: "-0.01em",
          userSelect: "none",
          boxShadow: "inset 0 1px 0.5px rgba(255, 255, 255, 0.7)",
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
            borderRadius: "8px",
            background: "#ffffff",
            padding: "2px",
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

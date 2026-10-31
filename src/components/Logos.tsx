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
 * Universal dynamic Stock/Company Logo Avatar powered by https://api.companyenrich.com/logo/{domain}
 * Gracefully falls back to letter badge if image fails or for special categories (Crypto, Gold)
 */
export function StockLogoAvatar({
  name,
  ticker = "",
  category,
}: {
  name: string;
  ticker?: string;
  category?: AssetCategory;
}) {
  const [imgError, setImgError] = useState(false);

  // Special Category Badges
  if (category === "Gold & Fixed Income") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "11px",
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
          borderRadius: "50%",
          background: "linear-gradient(135deg, #F7931A, #E07B00)",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "12px",
        }}
      >
        ₿
      </div>
    );
  }

  const domain = getCompanyDomain(name, ticker);
  const logoUrl = `${COMPANY_LOGO_API}/${domain}`;

  if (!imgError && domain) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width="100%"
        height="100%"
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "8px",
          display: "block",
          padding: "2px",
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  const letter = (ticker?.slice(0, 1) || name?.slice(0, 1) || "A").toUpperCase();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
        background: "rgba(0, 113, 227, 0.1)",
        color: "var(--apple-blue)",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: "12px",
      }}
    >
      {letter}
    </div>
  );
}

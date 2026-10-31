"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  RefreshCw,
  X,
  Trash2,
  Pencil,
  Database,
  ExternalLink,
  Copy,
  Check,
  User,
  Sparkles,
  Save,
  RotateCcw,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AssetCategory =
  | "Indian Equities"
  | "US Stocks"
  | "Mutual Funds"
  | "Gold & Fixed Income"
  | "Crypto";

export interface AssetPosition {
  id: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: "INR" | "USD";
  date: string;
}

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Equities", icon: ChartNoAxesCombined },
  { name: "Mutual Funds", icon: Wallet },
];

export interface EditAssetForm {
  id: string;
  name: string;
  category: AssetCategory;
  investedAmount: string;
  buyPrice: string;
  currentPrice: string;
  currentValue: string;
  currency: "INR" | "USD";
}

// Authentic iOS 12-blade Activity Indicator & Frosted Glass Loading Experience
function IosLoadingView({
  title = "Connecting to PostgreSQL",
  subtitle = "Syncing live positions in real time...",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="ios-loading-container">
      <div className="ios-loading-card">
        <div className="ios-spinner" role="status" aria-label="Loading">
          <div /><div /><div /><div /><div /><div />
          <div /><div /><div /><div /><div /><div />
        </div>
        <span className="ios-loading-title">{title}</span>
        <span className="ios-loading-subtitle">{subtitle}</span>
      </div>
      <div className="ios-skeleton-wrap">
        <div className="ios-skeleton-row" style={{ width: "100%" }} />
        <div className="ios-skeleton-row" style={{ width: "95%" }} />
        <div className="ios-skeleton-row" style={{ width: "98%" }} />
      </div>
    </div>
  );
}

function getStockTicker(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("jio")) return "JPL";
  if (lower.includes("reliance")) return "RELIANCE";
  if (lower.includes("tata consultancy") || lower.includes("tcs")) return "TCS";
  if (lower.includes("tata motors")) return "TATAMOTORS";
  if (lower.includes("hdfc bank")) return "HDFCBANK";
  if (lower.includes("hdfc")) return "HDFC";
  if (lower.includes("infosys") || lower.includes("infy")) return "INFY";
  if (lower.includes("icici")) return "ICICIBANK";
  if (lower.includes("sbi focused")) return "Direct • Growth";
  if (lower.includes("state bank") || lower.includes("sbi")) return "SBI";
  if (lower.includes("apple")) return "AAPL";
  if (lower.includes("microsoft")) return "MSFT";
  if (lower.includes("google") || lower.includes("alphabet")) return "GOOGL";
  if (lower.includes("nvidia")) return "NVDA";
  if (lower.includes("amazon")) return "AMZN";
  if (lower.includes("tesla")) return "TSLA";

  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1].toUpperCase();

  const words = name.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  }
  return name.slice(0, 4).toUpperCase();
}

// Authentic Vector SVG Logos for Top Global & Indian Brands
function AppleLogoSvg() {
  return (
    <svg viewBox="0 0 170 170" width="18" height="18" fill="#ffffff">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.78-7.98-12.27-14.75-6.08-9.06-10.74-19.16-13.98-30.3-3.24-11.14-4.86-21.72-4.86-31.75 0-14.4 3.73-26.03 11.19-34.89 7.46-8.86 16.73-13.35 27.81-13.48 4.89 0 10.13 1.31 15.71 3.93 5.58 2.62 9.28 4.04 11.1 4.25 1.58-.21 5.37-1.63 11.36-4.25 5.99-2.62 11.15-3.87 15.49-3.77 11.14.44 20.37 4.54 27.69 12.31-9.93 6.01-14.8 14.51-14.61 25.5.21 8.51 3.49 15.7 9.85 21.57 6.36 5.87 13.88 9.38 22.56 10.53-2.02 6.08-4.44 12.33-7.25 18.75m-23.75-103.54c0 6.08-2.22 11.75-6.66 17.01-5.12 5.99-11.23 9.48-18.33 10.47-.21-1.06-.32-2.12-.32-3.18 0-5.87 2.33-11.66 6.99-17.37 4.66-5.71 10.76-9.19 18.32-10.44z" />
    </svg>
  );
}

function SbiLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#0072BC" />
      <circle cx="50" cy="40" r="14" fill="#ffffff" />
      <rect x="46" y="40" width="8" height="58" fill="#ffffff" />
    </svg>
  );
}

function JioLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="28" height="28">
      <defs>
        <linearGradient id="jioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066ff" />
          <stop offset="100%" stopColor="#0038b8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#jioGrad)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="34"
        letterSpacing="-1"
      >
        Jio
      </text>
    </svg>
  );
}

function RelianceLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="20" fill="#003366" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#e1a100" strokeWidth="3" />
      <path d="M50 24 C45 34 38 42 38 52 C38 60 43 66 50 66 C57 66 62 60 62 52 C62 42 55 34 50 24 Z" fill="#ed232a" />
      <path d="M50 34 C47 40 43 45 43 51 C43 56 46 60 50 60 C54 60 57 56 57 51 C57 45 53 40 50 34 Z" fill="#ffde00" />
    </svg>
  );
}

function TataLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="20" fill="#004c97" />
      <path
        fill="#ffffff"
        d="M26 38 C28 48 38 58 48 70 L52 70 C62 58 72 48 74 38 L65 38 C63 45 55 53 50 60 C45 53 37 45 35 38 Z M22 32 L78 32 L78 36 L22 36 Z"
      />
    </svg>
  );
}

function HdfcLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="16" fill="#004c8f" />
      <rect x="18" y="18" width="64" height="64" fill="#ed232a" />
      <rect x="36" y="18" width="28" height="64" fill="#ffffff" />
      <rect x="18" y="36" width="64" height="28" fill="#ffffff" />
      <rect x="36" y="36" width="28" height="28" fill="#004c8f" />
    </svg>
  );
}

function IciciLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="16" fill="#8b1d24" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#f37021" strokeWidth="6" />
      <circle cx="50" cy="34" r="6" fill="#f37021" />
      <path d="M47 44 h6 v22 h-6 z" fill="#f37021" />
    </svg>
  );
}

function GoogleLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function MicrosoftLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}

function NvidiaLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#76B900">
      <path d="M11.75 3.5c-4.8 0-8.9 3.1-10.4 7.6 1.4 3.7 4.8 6.4 8.8 6.8-.4-.9-.6-1.9-.6-3 0-3.3 2.7-6 6-6 1.1 0 2.1.3 3 .8.2-.5.3-1 .3-1.6 0-2.5-3.2-4.6-7.1-4.6zm-1.8 7.3c-1.8.3-3.2 1.9-3.2 3.8 0 1.2.5 2.2 1.4 2.9 2-.2 3.8-1.5 4.4-3.4-.6-.4-1.3-.7-2.1-.8-.2-.8-.3-1.6-.5-2.5zm5.5 1.5c-1.7 0-3.1 1.4-3.1 3.1 0 1.7 1.4 3.1 3.1 3.1 1.7 0 3.1-1.4 3.1-3.1 0-1.7-1.4-3.1-3.1-3.1z"/>
    </svg>
  );
}

function TeslaLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20" fill="#E82127">
      <path d="M50 25c8.3 0 16.1 2.3 22.7 6.2l3.7-7.9C68.7 18.5 59.7 15.5 50 15.5s-18.7 3-26.4 7.8l3.7 7.9C33.9 27.3 41.7 25 50 25zm25.7 11.3C68.7 33 60.2 31.1 50 31.1s-18.7 1.9-25.7 5.2l-4.1-4.1C28.5 28 38.7 25.5 50 25.5s21.5 2.5 29.8 6.7l-4.1 4.1zM47.5 42h5v44h-5z"/>
    </svg>
  );
}

function AmazonLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#FF9900" d="M13.4 17.7c-3.1 2.3-7.5 3.5-11.4 2.1-.5-.2-.9.4-.5.8 3.7 3.3 9.4 3 13.9.4.4-.3.2-.9-.3-.8zm6.5-1.5c-.3-.4-1.7-.2-2.3 0-.2.1-.2.2 0 .4 1.3 1 2.8.7 3.1.3.3-.4-.2-1.4-.8-.7z"/>
      <path fill="#ffffff" d="M15.8 12.3c-.1-1.8-.8-3.1-2.4-3.8-2-.9-4.2-.3-5.2 1.4-.2.3 0 .6.3.7l1.3.8c.2.1.5 0 .7-.2.6-.9 1.6-1.1 2.6-.6.9.4 1.2 1.2 1.2 2.1 0 .2-.1.4-.3.4-1.8.3-4.5.8-5.3 2.5-.5 1 .1 2.3 1.1 2.8.9.5 2 .4 2.9-.1.8-.4 1.4-1.1 1.7-1.9v1.2c0 .3.2.5.5.5h1.2c.3 0 .5-.2.5-.5v-5.4zm-2.2 2.9c-.2.7-.8 1.2-1.5 1.4-.7.1-1.3-.2-1.5-.7-.2-.6.1-1.3 1-1.5.7-.1 1.4-.2 2-.3v1.1z"/>
    </svg>
  );
}

function PpfasLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="20" fill="#0b2341" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#2575fc" strokeWidth="4" />
      <path d="M50 24 L56 44 L50 40 L44 44 Z" fill="#ff4d4d" />
      <path d="M50 76 L56 56 L50 60 L44 56 Z" fill="#ffffff" />
      <circle cx="50" cy="50" r="4" fill="#ffffff" />
    </svg>
  );
}

function BitcoinLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#F7931A" />
      <path
        fill="#ffffff"
        d="M66 43 c1 -6 -4 -9 -10 -10 l2 -8 h-6 l-2 7 c-1.5 -.4 -3 -.7 -4.6 -1 l2 -8 h-6 l-2 8 c-1.3 -.3 -2.7 -.6 -4 -.9 l-8 0 v6 c0 0 4 .1 4 0 c2.2 0 3 1.3 3.3 2.6 l-3.3 13.5 c.2 0 .4 0 .7 .1 l-.7 -.1 l-4.6 18.5 c-.4 1 -1.4 2.5 -3.6 2 l-4 0 v6 l8 0 c1.5 .4 3 .7 4.5 1 l-2 8 h6 l2 -8 c1.6 .4 3.2 .8 4.7 1.1 l-2 8 h6 l2 -8 c8 1.5 14 .9 16.5 -6.4 c2 -5.8 -.1 -9.2 -4.3 -11.4 c3 -0.7 5.3 -2.7 5.9 -6.8 z m-10.5 16.5 c-1.5 6 -11.5 2.8 -14.7 2 l2.6 -10.5 c3.2 .8 13.6 2.4 12.1 8.5 z m1.5 -16 c-1.3 5.4 -9.6 2.7 -12.3 2 l2.4 -9.6 c2.7 .7 11.2 2 9.9 7.6 z"
      />
    </svg>
  );
}

function GoldLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffae00" />
          <stop offset="100%" stopColor="#b37700" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="#1b160a" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="2" />
      <path d="M26 68 L36 34 L64 34 L74 68 Z" fill="url(#goldGrad)" />
      <path d="M36 34 L64 34 L60 42 L40 42 Z" fill="#fff3a8" opacity="0.8" />
      <text x="50" y="58" textAnchor="middle" fill="#5c3800" fontWeight="900" fontSize="13" fontFamily="sans-serif">Au</text>
    </svg>
  );
}

// Domain resolver for dynamic high-res favicon loading
function getCompanyDomain(name: string, ticker: string): string | null {
  const lower = name.toLowerCase();
  const t = ticker.toLowerCase();

  // Indian Equities & Conglomerates
  if (lower.includes("jio")) return "jio.com";
  if (lower.includes("reliance")) return "ril.com";
  if (lower.includes("tata motors")) return "tatamotors.com";
  if (lower.includes("tcs") || lower.includes("tata consultancy")) return "tcs.com";
  if (lower.includes("tata")) return "tata.com";
  if (lower.includes("hdfc bank")) return "hdfcbank.com";
  if (lower.includes("hdfc")) return "hdfcbank.com";
  if (lower.includes("icici")) return "icicibank.com";
  if (lower.includes("infosys") || t === "infy") return "infosys.com";
  if (lower.includes("wipro")) return "wipro.com";
  if (lower.includes("state bank") || lower.includes("sbi focused") || lower.includes("sbi mutual") || lower.includes("sbi fund")) return "sbimf.com";
  if (lower.includes("sbi")) return "sbi.co.in";
  if (lower.includes("parag parikh") || lower.includes("ppfas")) return "amc.ppfas.com";
  if (lower.includes("mirae")) return "miraeassetmf.co.in";
  if (lower.includes("nippon")) return "nipponindiamf.com";
  if (lower.includes("axis")) return "axismf.com";
  if (lower.includes("uti")) return "utimf.com";
  if (lower.includes("quant")) return "quantmutual.com";
  if (lower.includes("kotak")) return "kotakmf.com";
  if (lower.includes("zomato")) return "zomato.com";
  if (lower.includes("swiggy")) return "swiggy.com";
  if (lower.includes("paytm") || lower.includes("one97")) return "paytm.com";
  if (lower.includes("itc")) return "itcportal.com";
  if (lower.includes("larsen") || lower.includes("l&t")) return "larsentoubro.com";
  if (lower.includes("bharti") || lower.includes("airtel")) return "airtel.in";
  if (lower.includes("bajaj finance") || lower.includes("bajfinance")) return "bajajfinserv.in";
  if (lower.includes("maruti")) return "marutisuzuki.com";

  // US Equities
  if (lower.includes("apple") || t === "aapl") return "apple.com";
  if (lower.includes("google") || lower.includes("alphabet") || t === "googl" || t === "goog") return "google.com";
  if (lower.includes("microsoft") || t === "msft") return "microsoft.com";
  if (lower.includes("amazon") || t === "amzn") return "amazon.com";
  if (lower.includes("nvidia") || t === "nvda") return "nvidia.com";
  if (lower.includes("tesla") || t === "tsla") return "tesla.com";
  if (lower.includes("meta") || lower.includes("facebook")) return "meta.com";
  if (lower.includes("netflix") || t === "nflx") return "netflix.com";
  if (lower.includes("amd")) return "amd.com";
  if (lower.includes("intel") || t === "intc") return "intel.com";

  // If ticker looks like a standard US ticker without spaces, e.g. "AAPL", "MSFT"
  if (/^[a-zA-Z]{2,5}$/.test(ticker) && !ticker.includes(" ")) {
    return `${ticker.toLowerCase()}.com`;
  }

  return null;
}

function IosCurrencyToggle({
  checked,
  onToggle,
  rate,
}: {
  checked: boolean;
  onToggle: () => void;
  rate: number;
}) {
  return (
    <div
      className="ios-toggle-pill"
      onClick={onToggle}
      title={
        checked
          ? `Displaying US Dollar holdings in Rupee (₹) at live $1 = ₹${rate.toFixed(2)}. Click to display in USD ($).`
          : `Displaying US Dollar holdings in USD ($). Click to display in Rupee (₹) at live $1 = ₹${rate.toFixed(2)}.`
      }
    >
      <div className="ios-toggle-label">
        <span className="ios-toggle-symbols">
          <span className={!checked ? "symbol-active" : ""}>$</span>
          <span className="symbol-arrow">→</span>
          <span className={checked ? "symbol-active" : ""}>₹</span>
        </span>
        <span className="ios-toggle-text">USD in ₹</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`ios-switch ${checked ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="ios-switch-knob" />
      </button>
      <span className="ios-rate-badge">$1 = ₹{rate.toFixed(1)}</span>
    </div>
  );
}

function StockAvatar({
  name,
  ticker,
  category,
}: {
  name: string;
  ticker: string;
  category?: AssetCategory;
}) {
  const [imgError, setImgError] = useState(false);
  const lower = name.toLowerCase();
  const t = ticker.toLowerCase();

  // 1. Apple (AAPL) - Authentic Vector Silhouette
  if (lower.includes("apple") || t === "aapl") {
    return (
      <div
        className="stock-logo-circle"
        style={{
          background: "#08080a",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.6)",
        }}
        title="Apple Inc."
      >
        <AppleLogoSvg />
      </div>
    );
  }

  // 2. SBI / SBI Mutual Fund - Official SBI Keyhole Emblem
  if (lower.includes("sbi")) {
    return (
      <div
        className="stock-logo-circle"
        style={{
          background: "#0072BC",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 0 14px rgba(0, 114, 188, 0.45)",
        }}
        title="State Bank of India / SBI Mutual Fund"
      >
        <SbiLogoSvg />
      </div>
    );
  }

  // 3. Jio / Jio Platforms - Official Jio Gradient Roundel
  if (lower.includes("jio")) {
    return (
      <div className="stock-logo-circle stock-logo-jio" title="Reliance Jio Platforms">
        <JioLogoSvg />
      </div>
    );
  }

  // 4. Reliance Industries
  if (lower.includes("reliance")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#003366", border: "1px solid rgba(255, 255, 255, 0.15)" }}
        title="Reliance Industries"
      >
        <RelianceLogoSvg />
      </div>
    );
  }

  // 5. Tata / TCS / Tata Motors
  if (lower.includes("tata") || lower.includes("tcs")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#004c97", border: "1px solid rgba(255, 255, 255, 0.18)" }}
        title="Tata Group"
      >
        <TataLogoSvg />
      </div>
    );
  }

  // 6. HDFC Bank
  if (lower.includes("hdfc")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#004c8f", border: "1px solid rgba(255, 255, 255, 0.2)" }}
        title="HDFC Bank"
      >
        <HdfcLogoSvg />
      </div>
    );
  }

  // 7. ICICI Bank
  if (lower.includes("icici")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#8b1d24", border: "1px solid rgba(243, 112, 33, 0.3)" }}
        title="ICICI Bank"
      >
        <IciciLogoSvg />
      </div>
    );
  }

  // 8. Google / Alphabet
  if (lower.includes("google") || lower.includes("alphabet") || t === "googl" || t === "goog") {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#1a1b24", border: "1px solid rgba(255, 255, 255, 0.15)" }}
        title="Alphabet Google"
      >
        <GoogleLogoSvg />
      </div>
    );
  }

  // 9. Microsoft
  if (lower.includes("microsoft") || t === "msft") {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#161722", border: "1px solid rgba(255, 255, 255, 0.15)" }}
        title="Microsoft Corporation"
      >
        <MicrosoftLogoSvg />
      </div>
    );
  }

  // 10. Nvidia
  if (lower.includes("nvidia") || t === "nvda") {
    return (
      <div
        className="stock-logo-circle"
        style={{
          background: "#091209",
          border: "1px solid rgba(118, 185, 0, 0.35)",
          boxShadow: "0 0 12px rgba(118, 185, 0, 0.2)",
        }}
        title="NVIDIA Corporation"
      >
        <NvidiaLogoSvg />
      </div>
    );
  }

  // 11. Tesla
  if (lower.includes("tesla") || t === "tsla") {
    return (
      <div
        className="stock-logo-circle"
        style={{
          background: "#140a0b",
          border: "1px solid rgba(232, 33, 39, 0.35)",
          boxShadow: "0 0 12px rgba(232, 33, 39, 0.2)",
        }}
        title="Tesla Inc."
      >
        <TeslaLogoSvg />
      </div>
    );
  }

  // 12. Amazon
  if (lower.includes("amazon") || t === "amzn") {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#161722", border: "1px solid rgba(255, 153, 0, 0.3)" }}
        title="Amazon.com Inc."
      >
        <AmazonLogoSvg />
      </div>
    );
  }

  // 13. Parag Parikh (PPFAS)
  if (lower.includes("parag parikh") || lower.includes("ppfas")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#0b2341", border: "1px solid rgba(37, 117, 252, 0.3)" }}
        title="PPFAS Mutual Fund"
      >
        <PpfasLogoSvg />
      </div>
    );
  }

  // 14. Crypto
  if (category === "Crypto" || lower.includes("bitcoin") || t === "btc") {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#1d1406", border: "1px solid rgba(247, 147, 26, 0.35)" }}
        title="Bitcoin / Crypto"
      >
        <BitcoinLogoSvg />
      </div>
    );
  }

  // 15. Gold & Fixed Income
  if (category === "Gold & Fixed Income" || lower.includes("gold") || lower.includes("sovereign")) {
    return (
      <div
        className="stock-logo-circle"
        style={{ background: "#1b160a", border: "1px solid rgba(255, 215, 0, 0.35)" }}
        title="Gold Bullion"
      >
        <GoldLogoSvg />
      </div>
    );
  }

  // 16. Dynamic real company favicon lookup
  const domain = getCompanyDomain(name, ticker);
  if (domain && !imgError) {
    const logoUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
    return (
      <div
        className="stock-logo-circle"
        style={{
          background: "#15161e",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
        }}
      >
        <img
          src={logoUrl}
          alt={name}
          className="stock-logo-img"
          onError={() => setImgError(true)}
          style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
        />
      </div>
    );
  }

  // 17. High quality fallback: Monogram with tailored HSL palette
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const initials = ticker.slice(0, 3).toUpperCase() || name.slice(0, 2).toUpperCase();

  return (
    <div
      className="stock-logo-circle"
      style={{
        background: `hsl(${hue}, 40%, 18%)`,
        border: `1px solid hsl(${hue}, 50%, 32%)`,
        color: `hsl(${hue}, 90%, 85%)`,
      }}
    >
      <span>{initials}</span>
    </div>
  );
}

function getStockDayChange(item: AssetPosition): { pct: number; isUp: boolean } {
  if (item.name.toLowerCase().includes("jio")) {
    return { pct: 0.68, isUp: true };
  }
  if (item.name.toLowerCase().includes("sbi")) {
    return { pct: 0.63, isUp: true };
  }
  const hash = item.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const diff = ((hash % 240) - 80) / 100;
  return {
    pct: Math.abs(diff),
    isUp: diff >= 0,
  };
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [overviewSubTab, setOverviewSubTab] = useState<"all" | "stocks" | "mf">("all");
  const [modal, setModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EditAssetForm | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetPosition | null>(null);
  const [flashAssetId, setFlashAssetId] = useState<string | null>(null);
  const [dbModal, setDbModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [assets, setAssets] = useState<AssetPosition[]>([]);
  const [unsavedAssetIds, setUnsavedAssetIds] = useState<Set<string>>(new Set());
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const dbBaselinePricesRef = useRef<Map<string, number>>(new Map());
  const [syncStatus, setSyncStatus] = useState<"live" | "connecting" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline"
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [priceRefreshMessage, setPriceRefreshMessage] = useState("");
  const autoPriceRequestRef = useRef(0);
  const skipNextAutoPriceLookupRef = useRef(false);
  const [sortField, setSortField] = useState<"name" | "price" | "invested" | "value" | "pnl">("pnl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  function handleSort(field: "name" | "price" | "invested" | "value" | "pnl") {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  function sortAssetList(list: AssetPosition[]) {
    return [...list].sort((a, b) => {
      const investedA = a.quantity * a.buyPrice;
      const currentA = a.quantity * a.currentPrice;
      const pnlA = currentA - investedA;

      const investedB = b.quantity * b.buyPrice;
      const currentB = b.quantity * b.currentPrice;
      const pnlB = currentB - investedB;

      let comp = 0;
      if (sortField === "name") {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === "price") {
        comp = a.currentPrice - b.currentPrice;
      } else if (sortField === "invested") {
        comp = investedA - investedB;
      } else if (sortField === "value") {
        comp = currentA - currentB;
      } else if (sortField === "pnl") {
        comp = pnlA - pnlB;
      }
      return sortOrder === "asc" ? comp : -comp;
    });
  }

  // Dynamic live exchange rate (USD to INR)
  const [usdInrRate, setUsdInrRate] = useState<number>(84.5);

  useEffect(() => {
    let isMounted = true;
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.rates?.INR && typeof data.rates.INR === "number") {
          setUsdInrRate(data.rates.INR);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, []);

  // iOS Toggle: Display Rupee (₹) for US Dollar holdings
  const [showUsdInRupees, setShowUsdInRupees] = useState<boolean>(true);

  // Load user currency display preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mywealth_show_usd_in_rupees");
      if (saved !== null) {
        setShowUsdInRupees(saved === "true");
      }
    } catch { }
  }, []);

  const toggleUsdInRupees = () => {
    setShowUsdInRupees((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mywealth_show_usd_in_rupees", String(next));
      } catch { }
      return next;
    });
  };

  // Add Form states (Holdings are automatically calculated from Invested Amount ÷ Buy Price)
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Indian Equities");
  const [investedAmount, setInvestedAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  // Supabase PostgreSQL Realtime Sync Effect (Insert, Update, Delete)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("offline");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial Fetch from PostgreSQL
    async function loadAssets() {
      setSyncStatus("connecting");
      setIsLoading(true);
      try {
        const { data, error } = await supabase!
          .from("assets")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && isMounted) {
          const formatted: AssetPosition[] = data.map((row: any) => ({
            id: String(row.id),
            name: row.name,
            category: row.category as AssetCategory,
            quantity: Number(row.quantity),
            buyPrice: Number(row.buy_price),
            currentPrice: Number(row.current_price),
            currency: row.currency as "INR" | "USD",
            date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          formatted.forEach((item) => {
            dbBaselinePricesRef.current.set(item.id, item.currentPrice);
          });
          setAssets(formatted);
          setSyncStatus("live");
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        if (isMounted) setSyncStatus("offline");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    // 2. Realtime WebSocket Channel on assets table
    const channel = supabase
      .channel("mywealth-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row: any = payload.new;
            const newPos: AssetPosition = {
              id: String(row.id),
              name: row.name,
              category: row.category as AssetCategory,
              quantity: Number(row.quantity),
              buyPrice: Number(row.buy_price),
              currentPrice: Number(row.current_price),
              currency: row.currency as "INR" | "USD",
              date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            };
            dbBaselinePricesRef.current.set(newPos.id, newPos.currentPrice);
            setAssets((prev) => {
              if (prev.some((a) => a.id === newPos.id)) {
                return prev.map((a) => (a.id === newPos.id ? newPos : a));
              }
              const tempMatch = prev.find(
                (a) =>
                  a.id.startsWith("temp-") &&
                  a.name.toLowerCase() === newPos.name.toLowerCase() &&
                  a.category === newPos.category
              );
              if (tempMatch) {
                return prev.map((a) => (a.id === tempMatch.id ? newPos : a));
              }
              return [newPos, ...prev];
            });
            setFlashAssetId(newPos.id);
            setTimeout(() => setFlashAssetId(null), 2000);
          } else if (payload.eventType === "DELETE") {
            const oldId = String(payload.old?.id || (payload as any).id || "");
            if (oldId) {
              dbBaselinePricesRef.current.delete(oldId);
              setUnsavedAssetIds((prev) => {
                if (!prev.has(oldId)) return prev;
                const next = new Set(prev);
                next.delete(oldId);
                return next;
              });
              setAssets((prev) => prev.filter((a) => a.id !== oldId));
            }
          } else if (payload.eventType === "UPDATE") {
            const row: any = payload.new;
            const updatedId = String(row.id);
            dbBaselinePricesRef.current.set(updatedId, Number(row.current_price));
            setUnsavedAssetIds((prev) => {
              if (!prev.has(updatedId)) return prev;
              const next = new Set(prev);
              next.delete(updatedId);
              return next;
            });
            setAssets((prev) => {
              const exists = prev.some((a) => a.id === updatedId);
              if (!exists) {
                return [
                  {
                    id: updatedId,
                    name: row.name,
                    category: row.category as AssetCategory,
                    quantity: Number(row.quantity),
                    buyPrice: Number(row.buy_price),
                    currentPrice: Number(row.current_price),
                    currency: row.currency as "INR" | "USD",
                    date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
                  },
                  ...prev,
                ];
              }
              return prev.map((a) =>
                a.id === updatedId
                  ? {
                    ...a,
                    name: row.name,
                    category: row.category as AssetCategory,
                    quantity: Number(row.quantity),
                    currentPrice: Number(row.current_price),
                    currency: row.currency as "INR" | "USD",
                  }
                  : a
              );
            });
            setFlashAssetId(updatedId);
            setTimeout(() => setFlashAssetId(null), 2000);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && isMounted) {
          setSyncStatus("live");
        }
      });

    return () => {
      isMounted = false;
      supabase?.removeChannel(channel);
    };
  }, []);

  // Compute portfolio metrics
  const totalInvestedINR = assets.reduce((sum, item) => {
    const cost = item.quantity * item.buyPrice;
    return sum + (item.currency === "USD" ? cost * usdInrRate : cost);
  }, 0);

  const totalCurrentINR = assets.reduce((sum, item) => {
    const val = item.quantity * item.currentPrice;
    return sum + (item.currency === "USD" ? val * usdInrRate : val);
  }, 0);

  const totalPnlINR = totalCurrentINR - totalInvestedINR;
  const totalReturnPct = totalInvestedINR > 0 ? (totalPnlINR / totalInvestedINR) * 100 : 0;

  // Minimized allocation values
  const indianVal = assets.filter((a) => a.category === "Indian Equities").reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const usVal = assets.filter((a) => a.category === "US Stocks").reduce((s, a) => s + a.quantity * a.currentPrice, 0) * usdInrRate;
  const mfVal = assets.filter((a) => a.category === "Mutual Funds").reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const goldVal = assets.filter((a) => a.category === "Gold & Fixed Income").reduce((s, a) => s + a.quantity * a.currentPrice, 0);

  const pctIndian = totalCurrentINR > 0 ? Number(((indianVal / totalCurrentINR) * 100).toFixed(0)) : 0;
  const pctUS = totalCurrentINR > 0 ? Number(((usVal / totalCurrentINR) * 100).toFixed(0)) : 0;
  const pctMF = totalCurrentINR > 0 ? Number(((mfVal / totalCurrentINR) * 100).toFixed(0)) : 0;
  const pctGold = totalCurrentINR > 0 ? Number(((goldVal / totalCurrentINR) * 100).toFixed(0)) : 0;

  const money = (val: number, cur: "INR" | "USD" = "INR") => {
    if (cur === "USD") {
      if (showUsdInRupees) {
        const converted = val * usdInrRate;
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: converted % 1 === 0 ? 0 : 2,
        }).format(converted);
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: val % 1 === 0 ? 0 : 2,
      }).format(val);
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: val % 1 === 0 ? 0 : 2,
    }).format(val);
  };

  // Real-time computed holdings preview
  const computedAddHoldings =
    Number(currentValue) > 0 && Number(currentPrice) > 0
      ? Number(currentValue) / Number(currentPrice)
      : Number(investedAmount) > 0 && Number(buyPrice) > 0
      ? Number(investedAmount) / Number(buyPrice)
      : 0;

  const computedEditHoldings =
    editingAsset && Number(editingAsset.currentValue) > 0 && Number(editingAsset.currentPrice) > 0
      ? Number(editingAsset.currentValue) / Number(editingAsset.currentPrice)
      : editingAsset && Number(editingAsset.investedAmount) > 0 && Number(editingAsset.buyPrice) > 0
      ? Number(editingAsset.investedAmount) / Number(editingAsset.buyPrice)
      : 0;

  // Real-time Stock Market Price Lookup via /api/stock-price
  async function handleFetchLivePrice(
    stockQuery: string,
    cat: AssetCategory,
    target: "add" | "edit",
    autoRequestId?: number
  ) {
    if (!stockQuery.trim()) return;
    setIsFetchingPrice(true);
    try {
      const res = await fetch(
        `/api/stock-price?query=${encodeURIComponent(stockQuery.trim())}&category=${encodeURIComponent(cat)}`
      );
      const data = await res.json();
      if (autoRequestId !== undefined && autoRequestId !== autoPriceRequestRef.current) return;
      if (data.success && data.price) {
        if (target === "add") {
          setBuyPrice(String(data.price));
          setCurrentPrice(String(data.price));
          if (computedAddHoldings > 0) {
            setCurrentValue((data.price * computedAddHoldings).toFixed(2));
          } else if (Number(investedAmount) > 0) {
            setCurrentValue(Number(investedAmount).toFixed(2));
          }
          if (data.currency) setCurrency(data.currency as "INR" | "USD");
          if (data.name && name.trim().length <= 4) {
            skipNextAutoPriceLookupRef.current = true;
            setName(data.name);
          }
        } else if (editingAsset) {
          const newCp = String(data.price);
          const holdings =
            Number(editingAsset.investedAmount) > 0 && Number(editingAsset.buyPrice) > 0
              ? Number(editingAsset.investedAmount) / Number(editingAsset.buyPrice)
              : 0;
          setEditingAsset({
            ...editingAsset,
            currentPrice: newCp,
            currentValue: holdings > 0 ? (data.price * holdings).toFixed(2) : editingAsset.currentValue,
            currency: (data.currency as "INR" | "USD") || editingAsset.currency,
          });
        }
      }
    } catch (err) {
      console.error("Live price lookup error:", err);
    } finally {
      if (autoRequestId === undefined || autoRequestId === autoPriceRequestRef.current) {
        setIsFetchingPrice(false);
      }
    }
  }

  const handleFetchLivePriceRef = useRef(handleFetchLivePrice);
  handleFetchLivePriceRef.current = handleFetchLivePrice;

  useEffect(() => {
    const requestId = ++autoPriceRequestRef.current;
    const query = name.trim();

    if (skipNextAutoPriceLookupRef.current) {
      skipNextAutoPriceLookupRef.current = false;
      return;
    }

    if (!modal || query.length < 3) {
      const resetTimeoutId = window.setTimeout(() => {
        if (autoPriceRequestRef.current === requestId) setIsFetchingPrice(false);
      }, 0);
      return () => window.clearTimeout(resetTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void handleFetchLivePriceRef.current(query, category, "add", requestId);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [modal, name, category]);

  async function handleRefreshPrices() {
    if (isRefreshingPrices || assets.length === 0) return;

    setIsRefreshingPrices(true);
    setPriceRefreshMessage("");
    try {
      const results = await Promise.all(
        assets.map(async (asset) => {
          try {
            const response = await fetch(
              `/api/stock-price?query=${encodeURIComponent(asset.name)}&category=${encodeURIComponent(asset.category)}`
            );
            const data = await response.json();
            const price = Number(data.price);
            if (!response.ok || !data.success || !Number.isFinite(price) || price <= 0) return null;
            if (data.currency !== asset.currency) return { currencyMismatch: true as const };
            return { id: asset.id, price };
          } catch {
            return null;
          }
        })
      );

      const updates = results.filter(
        (result): result is { id: string; price: number } => result !== null && "id" in result
      );
      const currencyMismatchCount = results.filter(
        (result) => result !== null && "currencyMismatch" in result
      ).length;
      const pricesById = new Map(updates.map(({ id, price }) => [id, price]));

      const newUnsaved = new Set(unsavedAssetIds);

      setAssets((currentAssets) =>
        currentAssets.map((asset) => {
          const freshPrice = pricesById.get(asset.id);
          if (freshPrice === undefined) return asset;
          const baseline = dbBaselinePricesRef.current.get(asset.id) ?? asset.currentPrice;
          if (Math.abs(freshPrice - baseline) > 0.0001) {
            newUnsaved.add(asset.id);
          }
          return { ...asset, currentPrice: freshPrice };
        })
      );

      setUnsavedAssetIds(newUnsaved);

      const unavailableCount = results.filter((result) => result === null).length;
      const updatedLabel = `${updates.length} ${updates.length === 1 ? "holding" : "holdings"} updated in real time`;
      const unavailableLabel = unavailableCount > 0 ? ` · ${unavailableCount} unavailable` : "";
      const currencyLabel = currencyMismatchCount > 0 ? ` · ${currencyMismatchCount} currency mismatch${currencyMismatchCount === 1 ? "" : "es"} skipped` : "";
      setPriceRefreshMessage(`${updatedLabel}${unavailableLabel}${currencyLabel} · Not saved to DB yet`);
    } catch (error) {
      console.error("Portfolio price refresh failed:", error);
      setPriceRefreshMessage("Could not refresh prices. Try again.");
    } finally {
      setIsRefreshingPrices(false);
    }
  }

  // Explicitly Save Refreshed Prices to PostgreSQL Database
  async function handleSavePricesToDb() {
    if (isSavingPrices || unsavedAssetIds.size === 0) return;
    setIsSavingPrices(true);
    try {
      const changedAssets = assets.filter((a) => unsavedAssetIds.has(a.id) && !a.id.startsWith("temp-"));
      if (isSupabaseConfigured && supabase && changedAssets.length > 0) {
        await Promise.all(
          changedAssets.map((a) =>
            supabase!.from("assets").update({ current_price: a.currentPrice }).eq("id", a.id)
          )
        );
      }
      for (const a of assets) {
        dbBaselinePricesRef.current.set(a.id, a.currentPrice);
      }
      const count = unsavedAssetIds.size;
      setUnsavedAssetIds(new Set());
      setPriceRefreshMessage(`✓ Successfully saved ${count} updated ${count === 1 ? "price" : "prices"} to database!`);
      setTimeout(() => setPriceRefreshMessage(""), 5000);
    } catch (err) {
      console.error("Failed to save prices to database:", err);
      setPriceRefreshMessage("Error saving prices to database. Try again.");
    } finally {
      setIsSavingPrices(false);
    }
  }

  // Revert in-memory refreshed prices to stored database values
  function handleDiscardRefreshedPrices() {
    setAssets((currentAssets) =>
      currentAssets.map((asset) => {
        const originalPrice = dbBaselinePricesRef.current.get(asset.id);
        return originalPrice !== undefined ? { ...asset, currentPrice: originalPrice } : asset;
      })
    );
    setUnsavedAssetIds(new Set());
    setPriceRefreshMessage("Reverted to saved database prices.");
    setTimeout(() => setPriceRefreshMessage(""), 4000);
  }

  // Open Edit Asset Modal with pre-filled invested amount (Holdings are computed automatically)
  function startEditing(asset: AssetPosition) {
    const totalInvested = asset.quantity * asset.buyPrice;
    const totalCurrent = asset.quantity * asset.currentPrice;
    setEditingAsset({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      investedAmount: String(Number(totalInvested.toFixed(2))),
      buyPrice: String(Number(asset.buyPrice.toFixed(4))),
      currentPrice: String(Number(asset.currentPrice.toFixed(4))),
      currentValue: String(Number(totalCurrent.toFixed(2))),
      currency: asset.currency,
    });
  }

  // Real-time Insert Asset (Holdings calculated automatically from invested amount ÷ stock price)
  async function handleAddAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const inv = Number(investedAmount);
    let bp = Number(buyPrice);
    if (!inv || !bp || bp <= 0) return;

    // Automatically compute holdings
    let q = inv / bp;
    let cp = bp;
    const cv = Number(currentValue);
    const userCp = Number(currentPrice);

    if (userCp > 0) {
      cp = userCp;
      if (cv > 0) {
        q = cv / cp;
        bp = inv / q;
      }
    } else if (cv > 0 && q > 0) {
      cp = cv / q;
    }

    // Check if the stock or MF was added before
    const existing = assets.find(
      (a) =>
        a.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        a.category === category
    );

    if (existing) {
      // Stock or MF was added before: ADD to its holdings and current value!
      const existingInvested = existing.quantity * existing.buyPrice;
      const totalMergedInvested = existingInvested + inv;
      const totalMergedQty = existing.quantity + q;
      const newAvgBuyPrice = totalMergedInvested / totalMergedQty;
      const newCurrentPrice = cp;

      // Optimistic update
      setAssets((prev) =>
        prev.map((a) =>
          a.id === existing.id
            ? {
                ...a,
                quantity: totalMergedQty,
                buyPrice: newAvgBuyPrice,
                currentPrice: newCurrentPrice,
                currency,
              }
            : a
        )
      );
      setFlashAssetId(existing.id);
      setTimeout(() => setFlashAssetId(null), 2500);

      setName("");
      setInvestedAmount("");
      setBuyPrice("");
      setCurrentPrice("");
      setCurrentValue("");
      setModal(false);

      if (isSupabaseConfigured && supabase && !existing.id.startsWith("temp-")) {
        dbBaselinePricesRef.current.set(existing.id, newCurrentPrice);
        setUnsavedAssetIds((prev) => {
          if (!prev.has(existing.id)) return prev;
          const next = new Set(prev);
          next.delete(existing.id);
          return next;
        });
        try {
          await supabase
            .from("assets")
            .update({
              quantity: totalMergedQty,
              buy_price: newAvgBuyPrice,
              current_price: newCurrentPrice,
              currency,
            })
            .eq("id", existing.id);
        } catch (err) {
          console.error("Error updating existing asset in PostgreSQL:", err);
        }
      }
      return;
    }

    const tempId = "temp-" + Date.now().toString();
    const newAsset: AssetPosition = {
      id: tempId,
      name: name.trim(),
      category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency,
      date: new Date().toISOString().split("T")[0],
    };

    // Optimistic UI update + trigger highlight pulse
    setAssets((prev) => [newAsset, ...prev]);
    setFlashAssetId(tempId);
    setTimeout(() => setFlashAssetId(null), 2000);
    setName("");
    setInvestedAmount("");
    setBuyPrice("");
    setCurrentPrice("");
    setCurrentValue("");
    setModal(false);

    // Write to PostgreSQL
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("assets")
          .insert([
            {
              name: newAsset.name,
              category: newAsset.category,
              quantity: newAsset.quantity,
              buy_price: newAsset.buyPrice,
              current_price: newAsset.currentPrice,
              currency: newAsset.currency,
            },
          ])
          .select();

        if (!error && data && data[0]) {
          const realId = String(data[0].id);
          dbBaselinePricesRef.current.set(realId, newAsset.currentPrice);
          setAssets((prev) => {
            const hasReal = prev.some((a) => a.id === realId);
            if (hasReal) {
              return prev.filter((a) => a.id !== tempId);
            }
            return prev.map((a) => (a.id === tempId ? { ...a, id: realId } : a));
          });
        }
      } catch (err) {
        console.error("Error inserting into PostgreSQL:", err);
      }
    }
  }

  // Real-time Update Asset (Holdings calculated automatically from invested amount ÷ stock price)
  async function handleUpdateAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAsset) return;

    const inv = Number(editingAsset.investedAmount);
    let bp = Number(editingAsset.buyPrice);
    if (!inv || !bp || bp <= 0) return;

    // Automatically compute holdings
    let q = inv / bp;
    let cp = bp;
    const cv = Number(editingAsset.currentValue);
    const userCp = Number(editingAsset.currentPrice);

    if (userCp > 0) {
      cp = userCp;
      if (cv > 0) {
        q = cv / cp;
        bp = inv / q;
      }
    } else if (cv > 0 && q > 0) {
      cp = cv / q;
    }

    const updated: AssetPosition = {
      id: editingAsset.id,
      name: editingAsset.name.trim(),
      category: editingAsset.category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency: editingAsset.currency,
      date: new Date().toISOString().split("T")[0],
    };

    // Optimistic UI update + highlight pulse
    dbBaselinePricesRef.current.set(updated.id, updated.currentPrice);
    setUnsavedAssetIds((prev) => {
      if (!prev.has(updated.id)) return prev;
      const next = new Set(prev);
      next.delete(updated.id);
      return next;
    });
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setFlashAssetId(updated.id);
    setTimeout(() => setFlashAssetId(null), 2000);
    setEditingAsset(null);

    // Write to PostgreSQL in real time
    if (isSupabaseConfigured && supabase && !updated.id.startsWith("temp-")) {
      try {
        const { error } = await supabase
          .from("assets")
          .update({
            name: updated.name,
            category: updated.category,
            quantity: updated.quantity,
            buy_price: updated.buyPrice,
            current_price: updated.currentPrice,
            currency: updated.currency,
          })
          .eq("id", updated.id);

        if (error) {
          console.error("Supabase update error:", error);
        }
      } catch (err) {
        console.error("Error updating PostgreSQL:", err);
      }
    }
  }

  // Real-time Delete Asset execution
  async function confirmDeleteAsset() {
    if (!deletingAsset) return;
    const targetId = deletingAsset.id;
    setDeletingAsset(null);

    // Optimistic UI delete
    dbBaselinePricesRef.current.delete(targetId);
    setUnsavedAssetIds((prev) => {
      if (!prev.has(targetId)) return prev;
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    setAssets((prev) => prev.filter((a) => a.id !== targetId));

    // Delete in PostgreSQL in real time
    if (isSupabaseConfigured && supabase && !targetId.startsWith("temp-")) {
      try {
        const { error } = await supabase.from("assets").delete().eq("id", targetId);
        if (error) {
          console.error("Supabase delete error:", error);
        }
      } catch (err) {
        console.error("Error deleting from PostgreSQL:", err);
      }
    }
  }


  // Filtered lists
  const equities = assets.filter((a) => a.category === "Indian Equities" || a.category === "US Stocks");
  const mutualFunds = assets.filter((a) => a.category === "Mutual Funds");

  const sortedAssets = sortAssetList(assets);
  const sortedEquities = sortAssetList(equities);
  const sortedMutualFunds = sortAssetList(mutualFunds);

  // Sub-totals for Stocks vs Mutual Funds
  const stocksInvested = equities.reduce((acc, a) => acc + (a.currency === "USD" ? a.quantity * a.buyPrice * usdInrRate : a.quantity * a.buyPrice), 0);
  const stocksCurrent = equities.reduce((acc, a) => acc + (a.currency === "USD" ? a.quantity * a.currentPrice * usdInrRate : a.quantity * a.currentPrice), 0);
  const stocksPnl = stocksCurrent - stocksInvested;
  const stocksPnlPct = stocksInvested > 0 ? (stocksPnl / stocksInvested) * 100 : 0;

  const mfInvested = mutualFunds.reduce((acc, a) => acc + a.quantity * a.buyPrice, 0);
  const mfCurrent = mutualFunds.reduce((acc, a) => acc + a.quantity * a.currentPrice, 0);
  const mfPnl = mfCurrent - mfInvested;
  const mfPnlPct = mfInvested > 0 ? (mfPnl / mfInvested) * 100 : 0;

  return (
    <main className="app-shell">
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand" onClick={() => setActive("Overview")}>
            <div className="brand-icon">↗</div>
            <span>
              My<span style={{ color: "var(--red)" }}>Wealth</span>
            </span>
          </div>

          <div className="topbar-divider" />

          <div className="workspace-badge">
            <span className="workspace-dot" />
            <span>Portfolio</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-active">{active}</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="profile-avatar" title="Account profile">
            <User size={15} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="main-area">
        <aside className="sidebar" aria-label="Portfolio navigation">
          <div className="sidebar-section-label">WORKSPACE</div>
          <nav className="sidebar-navigation" aria-label="Main navigation">
            {navigation.map(({ name, icon: Icon }) => {
              const isActive = active === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActive(name)}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{name}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-divider" />
          <button type="button" className="sidebar-add-button" onClick={() => setModal(true)}>
            <span className="sidebar-add-icon"><Plus size={16} strokeWidth={2.5} /></span>
            <span>Add investment</span>
          </button>
          <div className="sidebar-footer">
            <span className={`sidebar-status-dot ${syncStatus}`} />
            <span>{syncStatus === "live" ? "Data synced" : syncStatus === "connecting" ? "Connecting" : "Local mode"}</span>
          </div>
        </aside>
        <div className="page-content">
          {/* Page Heading */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">PORTFOLIO TRACKER</div>
              <h1>
                {active === "Overview" && "Your wealth, in focus."}
                {active === "Equities" && "Equities & Stocks"}
                {active === "Mutual Funds" && "Mutual Funds & SIPs"}
              </h1>
              <p className="page-description">
                {active === "Overview" && "A unified view of your net worth, returns, and real-time asset allocation."}
                {active === "Equities" && "Direct shares held across Indian and US stock markets."}
                {active === "Mutual Funds" && "Active mutual fund schemes, index portfolios, and systematic investments."}
              </p>
            </div>
            <div className="price-refresh-control">
              <div className="price-refresh-buttons-row">
                <button
                  type="button"
                  className="price-refresh-button"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || assets.length === 0}
                  title="Refresh live market prices and recalculate portfolio values in real time"
                >
                  <RefreshCw size={13} className={isRefreshingPrices ? "refresh-spinning" : ""} />
                  {isRefreshingPrices ? "Refreshing…" : "Refresh prices"}
                </button>

                {unsavedAssetIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      className="save-db-button"
                      onClick={handleSavePricesToDb}
                      disabled={isSavingPrices}
                      title="Save these live market prices to the PostgreSQL database"
                    >
                      {isSavingPrices ? <RefreshCw size={13} className="refresh-spinning" /> : <Save size={13} />}
                      {isSavingPrices ? "Saving…" : "Save to DB"}
                    </button>
                    <button
                      type="button"
                      className="discard-db-button"
                      onClick={handleDiscardRefreshedPrices}
                      disabled={isSavingPrices}
                      title="Discard live rates and revert back to saved database prices"
                    >
                      <RotateCcw size={12} />
                      Discard
                    </button>
                  </>
                )}
              </div>
              {priceRefreshMessage && (
                <span className={`price-refresh-message ${unsavedAssetIds.size > 0 ? "has-unsaved" : ""}`} role="status">
                  {priceRefreshMessage}
                </span>
              )}
            </div>
          </div>

          {/* Live Unsaved Prices Session Banner */}
          {unsavedAssetIds.size > 0 && (
            <div className="live-unsaved-banner">
              <div className="live-unsaved-banner-left">
                <div className="live-unsaved-icon-wrap">
                  <Sparkles size={16} />
                </div>
                <div>
                  <strong>Live market prices active ({unsavedAssetIds.size} {unsavedAssetIds.size === 1 ? "holding" : "holdings"} updated in real time)</strong>
                  <p>All values, totals, and returns are live in session preview. The database still has your previous prices until you save.</p>
                </div>
              </div>
              <div className="live-unsaved-banner-actions">
                <button
                  type="button"
                  className="save-db-button-lg"
                  onClick={handleSavePricesToDb}
                  disabled={isSavingPrices}
                >
                  {isSavingPrices ? <RefreshCw size={14} className="refresh-spinning" /> : <Save size={14} />}
                  {isSavingPrices ? "Saving to database…" : "Save to Database"}
                </button>
                <button
                  type="button"
                  className="discard-db-button-lg"
                  onClick={handleDiscardRefreshedPrices}
                  disabled={isSavingPrices}
                >
                  <RotateCcw size={13} />
                  Revert to DB
                </button>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {active === "Overview" && (
            <>
              {/* 4 Metric Cards */}
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span>Portfolio value</span>
                    <Wallet size={17} />
                  </div>
                  <div className="metric-value">{money(totalCurrentINR)}</div>
                  <div className="metric-note">Total current valuation</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Total invested</span>
                    <CircleDollarSign size={17} />
                  </div>
                  <div className="metric-value">{money(totalInvestedINR)}</div>
                  <div className="metric-note">Actual capital deployed</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Total returns (P&L)</span>
                    {totalPnlINR >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                  </div>
                  <div className={`metric-value ${totalPnlINR >= 0 ? "positive" : ""}`} style={{ color: totalPnlINR < 0 ? "var(--red)" : undefined }}>
                    {totalPnlINR >= 0 ? `+${money(totalPnlINR)}` : money(totalPnlINR)}
                  </div>
                  <div className={`metric-note ${totalPnlINR >= 0 ? "positive" : ""}`} style={{ color: totalPnlINR < 0 ? "var(--red)" : undefined }}>
                    {totalReturnPct >= 0 ? `+${totalReturnPct.toFixed(2)}%` : `${totalReturnPct.toFixed(2)}%`} overall return
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Active holdings</span>
                    <ChartNoAxesCombined size={17} />
                  </div>
                  <div className="metric-value">{assets.length}</div>
                  <div className="metric-note">Live in PostgreSQL</div>
                </div>
              </div>

              {/* Filter Pills to switch between All Separated, Stocks Only, or MF Only */}
              <div className="overview-filter-bar">
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className={`overview-filter-pill ${overviewSubTab === "all" ? "active" : ""}`}
                    onClick={() => setOverviewSubTab("all")}
                  >
                    <LayoutDashboard size={13} />
                    <span>All Assets ({assets.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`overview-filter-pill ${overviewSubTab === "stocks" ? "active" : ""}`}
                    onClick={() => setOverviewSubTab("stocks")}
                  >
                    <ChartNoAxesCombined size={13} />
                    <span>Stocks ({equities.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`overview-filter-pill ${overviewSubTab === "mf" ? "active" : ""}`}
                    onClick={() => setOverviewSubTab("mf")}
                  >
                    <Wallet size={13} />
                    <span>Mutual Funds ({mutualFunds.length})</span>
                  </button>
                </div>

                <IosCurrencyToggle
                  checked={showUsdInRupees}
                  onToggle={toggleUsdInRupees}
                  rate={usdInrRate}
                />
              </div>

              {/* SECTION 1: STOCKS & DIRECT EQUITIES */}
              {(overviewSubTab === "all" || overviewSubTab === "stocks") && (
                <div className="panel holdings-panel" style={{ marginTop: "10px" }}>
                  <div className="panel-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ChartNoAxesCombined size={16} style={{ color: "var(--red)" }} />
                        <h3 style={{ margin: 0 }}>Stocks & Direct Equities</h3>
                      </div>
                      <p>Shares held across Indian and US stock exchanges</p>
                    </div>
                    {equities.length > 0 && (
                      <div className={`panel-summary-badge ${stocksPnl >= 0 ? "positive" : "negative"}`}>
                        <span>{equities.length} {equities.length === 1 ? "Stock" : "Stocks"}</span>
                        <span>•</span>
                        <span>Valuation: {money(stocksCurrent)}</span>
                        <span>•</span>
                        <span>PnL: {stocksPnl >= 0 ? `+${money(stocksPnl)}` : money(stocksPnl)} ({stocksPnlPct >= 0 ? "+" : ""}{stocksPnlPct.toFixed(2)}%)</span>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <IosLoadingView title="Loading Stocks" subtitle="Connecting to PostgreSQL..." />
                  ) : equities.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><ChartNoAxesCombined size={22} /></div>
                      <strong>No stocks recorded yet</strong>
                      <p>Add your first equity holding to track real-time stock valuation.</p>
                      <button className="primary-button" onClick={() => { setCategory("Indian Equities"); setModal(true); }}>
                        <Plus size={15} /> Add first stock
                      </button>
                    </div>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th onClick={() => handleSort("name")} className="sortable-th col-name">
                              <div className="th-content">
                                <span>Company / Stock</span>
                                <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("price")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Market Price</span>
                                <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("invested")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Invested (Qty / Avg)</span>
                                <span className="sort-icon">{sortField === "invested" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("value")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Current Value</span>
                                <span className="sort-icon">{sortField === "value" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("pnl")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Total PnL</span>
                                <span className="sort-icon">{sortField === "pnl" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th className="col-actions">
                              <div className="th-content th-center">
                                <span>Actions</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedEquities.map((item) => {
                            const invested = item.quantity * item.buyPrice;
                            const current = item.quantity * item.currentPrice;
                            const pnl = current - invested;
                            const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                            const isProfit = pnl >= 0;
                            const ticker = getStockTicker(item.name);
                            const dayChange = getStockDayChange(item);

                            return (
                              <tr
                                key={item.id}
                                className={`${flashAssetId === item.id ? "row-flash" : ""} ${unsavedAssetIds.has(item.id) ? "row-live-preview" : ""}`.trim() || undefined}
                              >
                                <td className="col-name">
                                  <div className="stock-info">
                                    <span className="stock-name">{item.name}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <span className="stock-ticker">{ticker}</span>
                                      {item.currency === "USD" && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontWeight: 700,
                                            color: showUsdInRupees ? "#10b981" : "#f59e0b",
                                            background: showUsdInRupees ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                            border: showUsdInRupees ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                                            padding: "1px 5px",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          {showUsdInRupees ? "USD in ₹" : "USD ($)"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">
                                      {money(item.currentPrice, item.currency)}
                                      {unsavedAssetIds.has(item.id) && (
                                        <span className="live-preview-badge" title="Live market price in session preview (not saved in database)">
                                          Live
                                        </span>
                                      )}
                                    </span>
                                    <span className={dayChange.isUp ? "cell-subtext-up" : "cell-subtext-down"}>
                                      {dayChange.isUp ? "▲" : "▼"}{dayChange.pct.toFixed(2)}%
                                      {item.currency === "USD" && showUsdInRupees && (
                                        <span style={{ marginLeft: "5px", opacity: 0.85, fontWeight: 500, color: "var(--foreground-muted)" }}>
                                          (${item.currentPrice.toFixed(2)})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">{money(invested, item.currency)}</span>
                                    <span className="cell-subtext">
                                      {Number(item.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 })} Qty &nbsp;|&nbsp; {money(item.buyPrice, item.currency)} Avg.
                                      {item.currency === "USD" && showUsdInRupees && (
                                        <span style={{ marginLeft: "4px", opacity: 0.85, color: "var(--foreground-muted)" }}>
                                          (${item.buyPrice.toFixed(2)})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">{money(current, item.currency)}</span>
                                    <span className="cell-subtext">
                                      {item.currency === "USD"
                                        ? showUsdInRupees
                                          ? `$${current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                          : `₹${(current * usdInrRate).toLocaleString("en-IN", { maximumFractionDigits: 2 })} INR`
                                        : "Valuation"}
                                    </span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className={isProfit ? "pnl-primary-up" : "pnl-primary-down"}>
                                      {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)}
                                    </span>
                                    <span className={isProfit ? "cell-subtext-up" : "cell-subtext-down"}>
                                      {isProfit ? "▲" : "▼"}{Math.abs(pnlPct).toFixed(2)}%
                                    </span>
                                  </div>
                                </td>

                                <td className="col-actions">
                                  <div className="actions-cluster">
                                    <button className="action-icon-btn" title="Edit position" onClick={() => startEditing(item)}>
                                      <Pencil size={13} />
                                    </button>
                                    <button className="action-icon-btn" title="Delete position" onClick={() => setDeletingAsset(item)}>
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: MUTUAL FUNDS PORTFOLIO */}
              {(overviewSubTab === "all" || overviewSubTab === "mf") && (
                <div className="panel holdings-panel" style={{ marginTop: "14px" }}>
                  <div className="panel-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Wallet size={16} style={{ color: "#10b981" }} />
                        <h3 style={{ margin: 0 }}>Mutual Funds Portfolio</h3>
                      </div>
                      <p>SIPs, index funds, and active mutual fund schemes</p>
                    </div>
                    {mutualFunds.length > 0 && (
                      <div className={`panel-summary-badge ${mfPnl >= 0 ? "positive" : "negative"}`}>
                        <span>{mutualFunds.length} {mutualFunds.length === 1 ? "Fund" : "Funds"}</span>
                        <span>•</span>
                        <span>Valuation: {money(mfCurrent)}</span>
                        <span>•</span>
                        <span>Returns: {mfPnl >= 0 ? `+${money(mfPnl)}` : money(mfPnl)} ({mfPnlPct >= 0 ? "+" : ""}{mfPnlPct.toFixed(2)}%)</span>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <IosLoadingView title="Loading Mutual Funds" subtitle="Connecting to PostgreSQL..." />
                  ) : mutualFunds.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Wallet size={22} /></div>
                      <strong>No mutual funds recorded yet</strong>
                      <p>Record your SIPs and mutual fund schemes with live NAV valuations.</p>
                      <button className="primary-button" onClick={() => { setCategory("Mutual Funds"); setModal(true); }}>
                        <Plus size={15} /> Add first mutual fund
                      </button>
                    </div>
                  ) : (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th onClick={() => handleSort("name")} className="sortable-th col-name">
                              <div className="th-content">
                                <span>Fund Scheme</span>
                                <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("price")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Current NAV</span>
                                <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("invested")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Invested (Units / Avg NAV)</span>
                                <span className="sort-icon">{sortField === "invested" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("value")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Current Value</span>
                                <span className="sort-icon">{sortField === "value" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th onClick={() => handleSort("pnl")} className="sortable-th col-num">
                              <div className="th-content th-right">
                                <span>Total Returns</span>
                                <span className="sort-icon">{sortField === "pnl" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                              </div>
                            </th>
                            <th className="col-actions">
                              <div className="th-content th-center">
                                <span>Actions</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMutualFunds.map((item) => {
                            const invested = item.quantity * item.buyPrice;
                            const current = item.quantity * item.currentPrice;
                            const pnl = current - invested;
                            const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                            const isProfit = pnl >= 0;
                            const ticker = getStockTicker(item.name);
                            const dayChange = getStockDayChange(item);

                            return (
                              <tr
                                key={item.id}
                                className={`${flashAssetId === item.id ? "row-flash" : ""} ${unsavedAssetIds.has(item.id) ? "row-live-preview" : ""}`.trim() || undefined}
                              >
                                <td className="col-name">
                                  <div className="stock-info">
                                    <span className="stock-name">{item.name}</span>
                                    <span className="stock-ticker">{item.category}</span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">
                                      {money(item.currentPrice, item.currency)}
                                      {unsavedAssetIds.has(item.id) && (
                                        <span className="live-preview-badge" title="Live NAV in session preview (not saved in database)">
                                          Live
                                        </span>
                                      )}
                                    </span>
                                    <span className={dayChange.isUp ? "cell-subtext-up" : "cell-subtext-down"}>
                                      {dayChange.isUp ? "▲" : "▼"}{dayChange.pct.toFixed(2)}%
                                    </span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">{money(invested, item.currency)}</span>
                                    <span className="cell-subtext">
                                      {Number(item.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 })} Units &nbsp;|&nbsp; {money(item.buyPrice, item.currency)} Avg.
                                    </span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className="cell-primary">{money(current, item.currency)}</span>
                                    <span className="cell-subtext">Valuation</span>
                                  </div>
                                </td>

                                <td className="col-num">
                                  <div className="cell-stacked">
                                    <span className={isProfit ? "pnl-primary-up" : "pnl-primary-down"}>
                                      {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)}
                                    </span>
                                    <span className={isProfit ? "cell-subtext-up" : "cell-subtext-down"}>
                                      {isProfit ? "▲" : "▼"}{Math.abs(pnlPct).toFixed(2)}%
                                    </span>
                                  </div>
                                </td>

                                <td className="col-actions">
                                  <div className="actions-cluster">
                                    <button className="action-icon-btn" title="Edit position" onClick={() => startEditing(item)}>
                                      <Pencil size={13} />
                                    </button>
                                    <button className="action-icon-btn" title="Delete position" onClick={() => setDeletingAsset(item)}>
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Asset allocation */}
              {assets.length > 0 && (
                <div className="panel allocation-panel">
                  <div
                    className="allocation-heading"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>Asset allocation</h3>
                      <p style={{ margin: "5px 0 0" }}>How your portfolio is distributed</p>
                    </div>
                    <span className="allocation-holdings-count">{assets.length} holdings</span>
                  </div>
                  <div
                    className="allocation-content"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(155px, 0.75fr) 1.25fr",
                      alignItems: "center",
                      gap: "clamp(24px, 5vw, 72px)",
                      padding: "20px 5% 2px",
                    }}
                  >
                    <div
                      className="allocation-donut"
                      role="img"
                      aria-label={`Asset allocation: ${pctIndian}% Indian Equities, ${pctUS}% US Stocks, ${pctMF}% Mutual Funds, ${pctGold}% Gold and Fixed Income`}
                      style={{
                        background: `conic-gradient(#ef4444 0% ${pctIndian}%, #b91c1c ${pctIndian}% ${pctIndian + pctUS}%, #10b981 ${pctIndian + pctUS}% ${pctIndian + pctUS + pctMF}%, #f59e0b ${pctIndian + pctUS + pctMF}% ${pctIndian + pctUS + pctMF + pctGold}%, #292a32 ${pctIndian + pctUS + pctMF + pctGold}% 100%)`,
                        width: "180px",
                        height: "180px",
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        justifySelf: "center",
                      }}
                    >
                      <div
                        className="allocation-donut-center"
                        style={{
                          width: "72%",
                          height: "72%",
                          borderRadius: "50%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          background: "#17181d",
                        }}
                      >
                        <strong style={{ maxWidth: "90%", overflow: "hidden", whiteSpace: "nowrap" }}>{money(totalCurrentINR)}</strong>
                        <span style={{ fontSize: "9px" }}>Portfolio value</span>
                      </div>
                    </div>
                    <div className="allocation-legend" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                      <div className="allocation-legend-item" style={{ minHeight: "62px", display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <span className="allocation-swatch allocation-indian" style={{ width: "8px", height: "8px", borderRadius: "3px", background: "#ef4444" }} />
                        <span className="allocation-category-detail"><span>Indian Equities</span><small>{money(indianVal)}</small></span>
                        <strong>{pctIndian}%</strong>
                      </div>
                      <div className="allocation-legend-item" style={{ minHeight: "62px", display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <span className="allocation-swatch allocation-us" style={{ width: "8px", height: "8px", borderRadius: "3px", background: "#b91c1c" }} />
                        <span className="allocation-category-detail"><span>US Stocks</span><small>{money(usVal)}</small></span>
                        <strong>{pctUS}%</strong>
                      </div>
                      <div className="allocation-legend-item" style={{ minHeight: "62px", display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <span className="allocation-swatch allocation-funds" style={{ width: "8px", height: "8px", borderRadius: "3px", background: "#10b981" }} />
                        <span className="allocation-category-detail"><span>Mutual Funds</span><small>{money(mfVal)}</small></span>
                        <strong>{pctMF}%</strong>
                      </div>
                      <div className="allocation-legend-item" style={{ minHeight: "62px", display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
                        <span className="allocation-swatch allocation-gold" style={{ width: "8px", height: "8px", borderRadius: "3px", background: "#f59e0b" }} />
                        <span className="allocation-category-detail"><span>Gold &amp; Fixed Income</span><small>{money(goldVal)}</small></span>
                        <strong>{pctGold}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* EQUITIES TAB */}
          {active === "Equities" && (
            <div className="panel holdings-panel">
              <div className="panel-heading" style={{ flexWrap: "wrap", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3>Direct Equities Portfolio</h3>
                  <p>Indian and US stocks held directly</p>
                </div>
                <IosCurrencyToggle
                  checked={showUsdInRupees}
                  onToggle={toggleUsdInRupees}
                  rate={usdInrRate}
                />
              </div>

              {isLoading ? (
                <IosLoadingView
                  title="Loading Equities"
                  subtitle="Connecting to PostgreSQL..."
                />
              ) : equities.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ChartNoAxesCombined size={22} />
                  </div>
                  <strong>No equity holdings recorded.</strong>
                  <p>Use Add investment in the sidebar to add Indian stocks or US stocks.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("name")} className="sortable-th col-name">
                          <div className="th-content">
                            <span>Company / Stock</span>
                            <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("price")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Market Price</span>
                            <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("invested")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Invested (Qty / Avg)</span>
                            <span className="sort-icon">{sortField === "invested" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("value")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Current Value</span>
                            <span className="sort-icon">{sortField === "value" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("pnl")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Total PnL</span>
                            <span className="sort-icon">{sortField === "pnl" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th className="col-actions">
                          <div className="th-content th-center">
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEquities.map((item) => {
                        const invested = item.quantity * item.buyPrice;
                        const current = item.quantity * item.currentPrice;
                        const pnl = current - invested;
                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                        const isProfit = pnl >= 0;
                        const ticker = getStockTicker(item.name);
                        const dayChange = getStockDayChange(item);

                        return (
                          <tr
                            key={item.id}
                            className={`${flashAssetId === item.id ? "row-flash" : ""} ${unsavedAssetIds.has(item.id) ? "row-live-preview" : ""}`.trim() || undefined}
                          >
                            <td className="col-name">
                              <div className="stock-info">
                                <span className="stock-name">{item.name}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span className="stock-ticker">{ticker}</span>
                                  {item.currency === "USD" && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontWeight: 700,
                                        color: showUsdInRupees ? "#10b981" : "#f59e0b",
                                        background: showUsdInRupees ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                        border: showUsdInRupees ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                                        padding: "1px 5px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      {showUsdInRupees ? "USD in ₹" : "USD ($)"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">
                                  {money(item.currentPrice, item.currency)}
                                  {unsavedAssetIds.has(item.id) && (
                                    <span className="live-preview-badge" title="Live market price in session preview (not saved in database)">
                                      Live
                                    </span>
                                  )}
                                </span>
                                <span className={dayChange.isUp ? "cell-subtext-up" : "cell-subtext-down"}>
                                  {dayChange.isUp ? "▲" : "▼"}{dayChange.pct.toFixed(2)}%
                                  {item.currency === "USD" && showUsdInRupees && (
                                    <span style={{ marginLeft: "5px", opacity: 0.85, fontWeight: 500, color: "var(--foreground-muted)" }}>
                                      (${item.currentPrice.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">{money(invested, item.currency)}</span>
                                <span className="cell-subtext">
                                  {Number(item.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 })} Qty &nbsp;|&nbsp; {money(item.buyPrice, item.currency)} Avg.
                                  {item.currency === "USD" && showUsdInRupees && (
                                    <span style={{ marginLeft: "4px", opacity: 0.85, color: "var(--foreground-muted)" }}>
                                      (${item.buyPrice.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">{money(current, item.currency)}</span>
                                <span className="cell-subtext">
                                  {item.currency === "USD"
                                    ? showUsdInRupees
                                      ? `$${current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                      : `₹${(current * usdInrRate).toLocaleString("en-IN", { maximumFractionDigits: 2 })} INR`
                                    : "Valuation"}
                                </span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className={isProfit ? "pnl-primary-up" : "pnl-primary-down"}>
                                  {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)}
                                </span>
                                <span className={isProfit ? "cell-subtext-up" : "cell-subtext-down"}>
                                  {isProfit ? "▲" : "▼"}{Math.abs(pnlPct).toFixed(2)}%
                                </span>
                              </div>
                            </td>

                            <td className="col-actions">
                              <div className="actions-cluster">
                                <button
                                  className="action-icon-btn"
                                  title="Edit position"
                                  onClick={() => startEditing(item)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className="action-icon-btn"
                                  title="Delete position"
                                  onClick={() => setDeletingAsset(item)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MUTUAL FUNDS TAB */}
          {active === "Mutual Funds" && (
            <div className="panel holdings-panel">
              <div className="panel-heading">
                <div>
                  <h3>Mutual Funds & SIPs</h3>
                  <p>Active fund schemes and index portfolios</p>
                </div>
              </div>

              {isLoading ? (
                <IosLoadingView
                  title="Loading Mutual Funds"
                  subtitle="Connecting to PostgreSQL..."
                />
              ) : mutualFunds.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Wallet size={22} />
                  </div>
                  <strong>No mutual funds recorded.</strong>
                  <p>Use Add investment in the sidebar to record mutual funds.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("name")} className="sortable-th col-name">
                          <div className="th-content">
                            <span>Fund Scheme</span>
                            <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("price")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Current NAV</span>
                            <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("invested")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Invested (Units / Avg NAV)</span>
                            <span className="sort-icon">{sortField === "invested" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("value")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Current Value</span>
                            <span className="sort-icon">{sortField === "value" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th onClick={() => handleSort("pnl")} className="sortable-th col-num">
                          <div className="th-content th-right">
                            <span>Total Returns</span>
                            <span className="sort-icon">{sortField === "pnl" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                          </div>
                        </th>
                        <th className="col-actions">
                          <div className="th-content th-center">
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMutualFunds.map((item) => {
                        const invested = item.quantity * item.buyPrice;
                        const current = item.quantity * item.currentPrice;
                        const pnl = current - invested;
                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                        const isProfit = pnl >= 0;
                        const ticker = getStockTicker(item.name);
                        const dayChange = getStockDayChange(item);

                        return (
                          <tr
                            key={item.id}
                            className={`${flashAssetId === item.id ? "row-flash" : ""} ${unsavedAssetIds.has(item.id) ? "row-live-preview" : ""}`.trim() || undefined}
                          >
                            <td className="col-name">
                              <div className="stock-info">
                                <span className="stock-name">{item.name}</span>
                                <span className="stock-ticker">{item.category}</span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">
                                  {money(item.currentPrice, item.currency)}
                                  {unsavedAssetIds.has(item.id) && (
                                    <span className="live-preview-badge" title="Live NAV in session preview (not saved in database)">
                                      Live
                                    </span>
                                  )}
                                </span>
                                <span className={dayChange.isUp ? "cell-subtext-up" : "cell-subtext-down"}>
                                  {dayChange.isUp ? "▲" : "▼"}{dayChange.pct.toFixed(2)}%
                                </span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">{money(invested, item.currency)}</span>
                                <span className="cell-subtext">
                                  {Number(item.quantity).toLocaleString("en-US", { maximumFractionDigits: 3 })} Units &nbsp;|&nbsp; {money(item.buyPrice, item.currency)} Avg.
                                </span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className="cell-primary">{money(current, item.currency)}</span>
                                <span className="cell-subtext">Valuation</span>
                              </div>
                            </td>

                            <td className="col-num">
                              <div className="cell-stacked">
                                <span className={isProfit ? "pnl-primary-up" : "pnl-primary-down"}>
                                  {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)}
                                </span>
                                <span className={isProfit ? "cell-subtext-up" : "cell-subtext-down"}>
                                  {isProfit ? "▲" : "▼"}{Math.abs(pnlPct).toFixed(2)}%
                                </span>
                              </div>
                            </td>

                            <td className="col-actions">
                              <div className="actions-cluster">
                                <button
                                  className="action-icon-btn"
                                  title="Edit position"
                                  onClick={() => startEditing(item)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  className="action-icon-btn"
                                  title="Delete position"
                                  onClick={() => setDeletingAsset(item)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Add Asset Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <form className="investment-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleAddAsset}>
            <div className="modal-heading">
              <div>
                <h2>Add investment</h2>
                <p>Record a new asset into PostgreSQL in real time.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)" }}>
                  Asset / Stock Name
                </span>
                <span className="fetch-price-status" aria-live="polite">
                  <Sparkles size={11} />
                  {isFetchingPrice ? "Looking up price…" : name.trim().length >= 3 ? "Auto price lookup" : "Price fills automatically"}
                </span>
              </div>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Reliance, Tata Motors, Apple, HDFC Bank, Parag Parikh"
              />
            </div>

            <div className="form-row" style={{ marginTop: "14px" }}>
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => {
                    const c = e.target.value as AssetCategory;
                    setCategory(c);
                    if (c === "US Stocks") setCurrency("USD");
                    else setCurrency("INR");
                  }}
                >
                  <option value="Indian Equities">Indian Equities</option>
                  <option value="US Stocks">US Stocks</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Gold & Fixed Income">Gold & Fixed Income</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </label>

              <label>
                Currency
                <select value={currency} onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}>
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Amount You Invested ({currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  placeholder="e.g. 50000"
                />
              </label>

              <label>
                Stock / Buy Price per unit ({currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="e.g. 1165"
                />
              </label>
            </div>

            {/* Live Calculated Holdings Banner */}
            {computedAddHoldings > 0 && (
              <div className="holdings-preview-banner">
                <Sparkles size={14} style={{ color: "var(--red)", flexShrink: 0 }} />
                <span>
                  Calculated Holdings: <strong>{computedAddHoldings.toFixed(computedAddHoldings % 1 === 0 ? 0 : 4)} units</strong>
                  <span style={{ opacity: 0.75, marginLeft: "6px", fontSize: "11px" }}>
                    ({currency === "USD" ? "$" : "₹"}{Number(investedAmount).toLocaleString()} invested ÷ {currency === "USD" ? "$" : "₹"}{Number(buyPrice).toLocaleString()}/unit)
                  </span>
                </span>
              </div>
            )}

            <div className="form-row">
              <label>
                Current Value ({currency === "USD" ? "$" : "₹"})
                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", fontWeight: 400, marginLeft: "4px" }}>
                  (Valuation of position)
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={currentValue}
                  onChange={(e) => {
                    setCurrentValue(e.target.value);
                  }}
                  placeholder={computedAddHoldings > 0 ? (computedAddHoldings * (Number(buyPrice) || 1)).toFixed(2) : "e.g. 50000"}
                />
              </label>

              <label>
                Current Market Price ({currency === "USD" ? "$" : "₹"})
                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", fontWeight: 400, marginLeft: "4px" }}>
                  (Defaults to buy price)
                </span>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => {
                    const p = e.target.value;
                    setCurrentPrice(p);
                    if (Number(p) > 0 && computedAddHoldings > 0 && !currentValue) {
                      setCurrentValue((Number(p) * computedAddHoldings).toFixed(2));
                    }
                  }}
                  placeholder={buyPrice ? buyPrice : "e.g. 1165"}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time Edit Asset Modal */}
      {editingAsset && (
        <div className="modal-overlay" onClick={() => setEditingAsset(null)}>
          <form className="investment-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdateAsset}>
            <div className="modal-heading">
              <div>
                <h2>Edit asset position</h2>
                <p>Modify investment amount or stock price. Holdings calculate automatically.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setEditingAsset(null)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)" }}>
                  Asset / Stock Name
                </span>
                <button
                  type="button"
                  className="fetch-price-btn"
                  disabled={!editingAsset.name.trim() || isFetchingPrice}
                  onClick={() => handleFetchLivePrice(editingAsset.name, editingAsset.category, "edit")}
                  title="Fetch real stock price from financial markets"
                >
                  <Sparkles size={11} /> {isFetchingPrice ? "Fetching..." : "Fetch Real Price"}
                </button>
              </div>
              <input
                required
                value={editingAsset.name}
                onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
              />
            </div>

            <div className="form-row" style={{ marginTop: "14px" }}>
              <label>
                Category
                <select
                  value={editingAsset.category}
                  onChange={(e) => {
                    const c = e.target.value as AssetCategory;
                    setEditingAsset({
                      ...editingAsset,
                      category: c,
                      currency: c === "US Stocks" ? "USD" : "INR",
                    });
                  }}
                >
                  <option value="Indian Equities">Indian Equities</option>
                  <option value="US Stocks">US Stocks</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Gold & Fixed Income">Gold & Fixed Income</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </label>

              <label>
                Currency
                <select
                  value={editingAsset.currency}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, currency: e.target.value as "INR" | "USD" })
                  }
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Amount Invested ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  value={editingAsset.investedAmount}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, investedAmount: e.target.value })
                  }
                />
              </label>

              <label>
                Buy Price per unit ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="any"
                  value={editingAsset.buyPrice}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, buyPrice: e.target.value })
                  }
                />
              </label>
            </div>

            {/* Live Calculated Holdings Banner in Edit */}
            {computedEditHoldings > 0 && (
              <div className="holdings-preview-banner">
                <Sparkles size={14} style={{ color: "var(--red)", flexShrink: 0 }} />
                <span>
                  Calculated Holdings: <strong>{computedEditHoldings.toFixed(computedEditHoldings % 1 === 0 ? 0 : 4)} units</strong>
                  <span style={{ opacity: 0.75, marginLeft: "6px", fontSize: "11px" }}>
                    ({editingAsset.currency === "USD" ? "$" : "₹"}{Number(editingAsset.investedAmount).toLocaleString()} invested ÷ {editingAsset.currency === "USD" ? "$" : "₹"}{Number(editingAsset.buyPrice).toLocaleString()}/unit)
                  </span>
                </span>
              </div>
            )}

            <div className="form-row">
              <label>
                Current Value ({editingAsset.currency === "USD" ? "$" : "₹"})
                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", fontWeight: 400, marginLeft: "4px" }}>
                  (Valuation of position)
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={editingAsset.currentValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingAsset({
                      ...editingAsset,
                      currentValue: val,
                    });
                  }}
                  placeholder="e.g. 96.04"
                />
              </label>

              <label>
                Current Market Price ({editingAsset.currency === "USD" ? "$" : "₹"})
                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", fontWeight: 400, marginLeft: "4px" }}>
                  (Unit price)
                </span>
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="any"
                  value={editingAsset.currentPrice}
                  onChange={(e) => {
                    const p = e.target.value;
                    const holdings = computedEditHoldings;
                    setEditingAsset({
                      ...editingAsset,
                      currentPrice: p,
                      currentValue: Number(p) > 0 && holdings > 0 ? (Number(p) * holdings).toFixed(2) : editingAsset.currentValue,
                    });
                  }}
                  placeholder="e.g. 347.09"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingAsset(null)}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Update asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time Delete Asset Confirmation Modal */}
      {deletingAsset && (
        <div className="modal-overlay" onClick={() => setDeletingAsset(null)}>
          <div className="investment-modal" style={{ width: "min(420px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--red)",
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2>Delete Position</h2>
                  <p>Real-time PostgreSQL sync</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setDeletingAsset(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: "1.6", margin: "14px 0" }}>
              Are you sure you want to delete <strong>{deletingAsset.name}</strong> ({deletingAsset.category})?
            </p>

            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "10px 12px", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
              This will remove this position from your database immediately across all active browser windows.
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDeletingAsset(null)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={confirmDeleteAsset}>
                <Trash2 size={14} /> Delete Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Postgres Setup Modal */}
      {dbModal && (
        <div className="modal-overlay" onClick={() => setDbModal(false)}>
          <div className="investment-modal" style={{ width: "min(580px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--red)",
                  }}
                >
                  <Database size={18} />
                </div>
                <div>
                  <h2>PostgreSQL Connection</h2>
                  <p>Status: {syncStatus === "live" ? "Connected & Live" : "Connecting..."}</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setDbModal(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "var(--foreground-muted)", lineHeight: "1.6" }}>
              Your database is connected to <code>{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>. All additions, edits, and deletions sync in real time across all open browser windows!
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" className="primary-button" onClick={() => setDbModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

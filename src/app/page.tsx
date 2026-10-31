"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Trash2,
  Pencil,
  Database,
  Sparkles,
  Save,
  RotateCcw,
  Layers,
  TableProperties,
  ArrowUpDown,
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
    <svg viewBox="0 0 170 170" width="18" height="18" fill="currentColor">
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
          <stop offset="0%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#jioGrad)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <text
        x="50"
        y="58"
        fill="#ffffff"
        fontSize="34"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="-1"
      >
        Jio
      </text>
    </svg>
  );
}

function TataLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#0c4a6e" />
      <path d="M25 35h50v8H55v32h-10V43H25z" fill="#38bdf8" />
    </svg>
  );
}

function HdfcLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="20" fill="#004c8f" />
      <rect x="18" y="18" width="64" height="64" fill="#ffffff" rx="8" />
      <rect x="36" y="36" width="28" height="28" fill="#004c8f" />
      <rect x="45" y="18" width="10" height="64" fill="#ed1c24" />
      <rect x="18" y="45" width="64" height="10" fill="#ed1c24" />
    </svg>
  );
}

function IciciLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#b91c1c" />
      <path d="M35 25h30v12H52v26h13v12H35z" fill="#f97316" />
    </svg>
  );
}

function InfosysLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <rect width="100" height="100" rx="20" fill="#007cc3" />
      <text x="50" y="60" fill="#ffffff" fontSize="28" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        Infy
      </text>
    </svg>
  );
}

function ParagParikhLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#14532d" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#86efac" strokeWidth="6" />
      <text x="50" y="58" fill="#ffffff" fontSize="22" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        PP
      </text>
    </svg>
  );
}

function GoogleLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <text x="50" y="62" fill="#4285F4" fontSize="38" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        G
      </text>
    </svg>
  );
}

function MicrosoftLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="18" height="18">
      <rect x="5" y="5" width="42" height="42" fill="#f25022" />
      <rect x="53" y="5" width="42" height="42" fill="#7fba00" />
      <rect x="5" y="53" width="42" height="42" fill="#00a4ef" />
      <rect x="53" y="53" width="42" height="42" fill="#ffb900" />
    </svg>
  );
}

function NvidiaLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <circle cx="50" cy="50" r="48" fill="#76b900" />
      <text x="50" y="60" fill="#ffffff" fontSize="30" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        N
      </text>
    </svg>
  );
}

function AmazonLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <circle cx="50" cy="50" r="48" fill="#232f3e" />
      <text x="50" y="58" fill="#ff9900" fontSize="34" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        a
      </text>
    </svg>
  );
}

function TeslaLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <circle cx="50" cy="50" r="48" fill="#cc0000" />
      <text x="50" y="62" fill="#ffffff" fontSize="36" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        T
      </text>
    </svg>
  );
}

function GoldLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#b45309" />
      <circle cx="50" cy="50" r="36" fill="#f59e0b" />
      <text x="50" y="58" fill="#ffffff" fontSize="24" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        Au
      </text>
    </svg>
  );
}

function CryptoLogoSvg() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#f7931a" />
      <text x="50" y="62" fill="#ffffff" fontSize="36" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        ₿
      </text>
    </svg>
  );
}

function DefaultStockLogoSvg({ letter }: { letter: string }) {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22">
      <circle cx="50" cy="50" r="48" fill="#0071e3" />
      <text x="50" y="62" fill="#ffffff" fontSize="38" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
        {letter.toUpperCase()}
      </text>
    </svg>
  );
}

// Domain resolver for dynamic high-res favicon loading
function getCompanyDomain(name: string, ticker: string): string | null {
  const lower = name.toLowerCase();
  const t = ticker.toLowerCase();

  if (lower.includes("jio")) return "jio.com";
  if (lower.includes("reliance")) return "ril.com";
  if (lower.includes("tata motors")) return "tatamotors.com";
  if (lower.includes("tcs") || lower.includes("tata consultancy")) return "tcs.com";
  if (lower.includes("tata")) return "tata.com";
  if (lower.includes("hdfc bank") || lower.includes("hdfc")) return "hdfcbank.com";
  if (lower.includes("icici")) return "icicibank.com";
  if (lower.includes("infosys") || t === "infy") return "infosys.com";
  if (lower.includes("wipro")) return "wipro.com";
  if (lower.includes("state bank") || lower.includes("sbi")) return "sbimf.com";
  if (lower.includes("parag parikh") || lower.includes("ppfas")) return "amc.ppfas.com";
  if (lower.includes("apple") || t === "aapl") return "apple.com";
  if (lower.includes("google") || lower.includes("alphabet") || t === "googl") return "google.com";
  if (lower.includes("microsoft") || t === "msft") return "microsoft.com";
  if (lower.includes("amazon") || t === "amzn") return "amazon.com";
  if (lower.includes("nvidia") || t === "nvda") return "nvidia.com";
  if (lower.includes("tesla") || t === "tsla") return "tesla.com";

  if (/^[a-zA-Z]{2,5}$/.test(ticker) && !ticker.includes(" ")) {
    return `${ticker.toLowerCase()}.com`;
  }

  return null;
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

  if (lower.includes("apple") || t === "aapl") {
    return (
      <div style={{ color: "#1d1d1f" }} title="Apple Inc.">
        <AppleLogoSvg />
      </div>
    );
  }

  if (lower.includes("sbi")) {
    return <SbiLogoSvg />;
  }

  if (lower.includes("jio")) {
    return <JioLogoSvg />;
  }

  if (lower.includes("tata")) {
    return <TataLogoSvg />;
  }

  if (lower.includes("hdfc")) {
    return <HdfcLogoSvg />;
  }

  if (lower.includes("icici")) {
    return <IciciLogoSvg />;
  }

  if (lower.includes("infosys") || t === "infy") {
    return <InfosysLogoSvg />;
  }

  if (lower.includes("parag parikh") || lower.includes("ppfas")) {
    return <ParagParikhLogoSvg />;
  }

  if (lower.includes("google") || lower.includes("alphabet") || t === "googl") {
    return <GoogleLogoSvg />;
  }

  if (lower.includes("microsoft") || t === "msft") {
    return <MicrosoftLogoSvg />;
  }

  if (lower.includes("nvidia") || t === "nvda") {
    return <NvidiaLogoSvg />;
  }

  if (lower.includes("amazon") || t === "amzn") {
    return <AmazonLogoSvg />;
  }

  if (lower.includes("tesla") || t === "tsla") {
    return <TeslaLogoSvg />;
  }

  if (category === "Gold & Fixed Income") {
    return <GoldLogoSvg />;
  }

  if (category === "Crypto") {
    return <CryptoLogoSvg />;
  }

  const domain = getCompanyDomain(name, ticker);
  if (domain && !imgError) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={name}
        width="22"
        height="22"
        style={{ borderRadius: "50%" }}
        onError={() => setImgError(true)}
      />
    );
  }

  return <DefaultStockLogoSvg letter={ticker.slice(0, 1) || name.slice(0, 1) || "A"} />;
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
          <span style={{ opacity: 0.4 }}>→</span>
          <span className={checked ? "symbol-active" : ""}>₹</span>
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600 }}>USD in ₹</span>
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

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [overviewSubTab, setOverviewSubTab] = useState<"all" | "stocks" | "mf">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

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

  // Display Rupee (₹) for US Dollar holdings
  const [showUsdInRupees, setShowUsdInRupees] = useState<boolean>(true);

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

  // Add Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Indian Equities");
  const [investedAmount, setInvestedAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  // Supabase PostgreSQL Realtime Sync Effect
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("offline");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

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

  // Asset class distributions
  const indianVal = assets.filter((a) => a.category === "Indian Equities").reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const usVal = assets.filter((a) => a.category === "US Stocks").reduce((s, a) => s + a.quantity * a.currentPrice, 0) * usdInrRate;
  const mfVal = assets.filter((a) => a.category === "Mutual Funds").reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const goldVal = assets.filter((a) => a.category === "Gold & Fixed Income").reduce((s, a) => s + a.quantity * a.currentPrice, 0);

  const pctIndian = totalCurrentINR > 0 ? Number(((indianVal / totalCurrentINR) * 100).toFixed(1)) : 0;
  const pctUS = totalCurrentINR > 0 ? Number(((usVal / totalCurrentINR) * 100).toFixed(1)) : 0;
  const pctMF = totalCurrentINR > 0 ? Number(((mfVal / totalCurrentINR) * 100).toFixed(1)) : 0;
  const pctGold = totalCurrentINR > 0 ? Number(((goldVal / totalCurrentINR) * 100).toFixed(1)) : 0;

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
      setPriceRefreshMessage(`${updatedLabel}${unavailableLabel}${currencyLabel} · Live session preview`);
    } catch (error) {
      console.error("Portfolio price refresh failed:", error);
      setPriceRefreshMessage("Could not refresh prices. Try again.");
    } finally {
      setIsRefreshingPrices(false);
    }
  }

  // Save Refreshed Prices to Database
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

  // Insert Asset
  async function handleAddAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const inv = Number(investedAmount);
    let bp = Number(buyPrice);
    if (!inv || !bp || bp <= 0) return;

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

    const existing = assets.find(
      (a) =>
        a.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        a.category === category
    );

    if (existing) {
      const existingInvested = existing.quantity * existing.buyPrice;
      const totalMergedInvested = existingInvested + inv;
      const totalMergedQty = existing.quantity + q;
      const newAvgBuyPrice = totalMergedInvested / totalMergedQty;
      const newCurrentPrice = cp;

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

    setAssets((prev) => [newAsset, ...prev]);
    setFlashAssetId(tempId);
    setTimeout(() => setFlashAssetId(null), 2000);
    setName("");
    setInvestedAmount("");
    setBuyPrice("");
    setCurrentPrice("");
    setCurrentValue("");
    setModal(false);

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

  // Update Asset
  async function handleUpdateAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAsset) return;

    const inv = Number(editingAsset.investedAmount);
    let bp = Number(editingAsset.buyPrice);
    if (!inv || !bp || bp <= 0) return;

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

  // Delete Asset
  async function confirmDeleteAsset() {
    if (!deletingAsset) return;
    const targetId = deletingAsset.id;
    setDeletingAsset(null);

    dbBaselinePricesRef.current.delete(targetId);
    setUnsavedAssetIds((prev) => {
      if (!prev.has(targetId)) return prev;
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    setAssets((prev) => prev.filter((a) => a.id !== targetId));

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
  const equities = useMemo(
    () => assets.filter((a) => a.category === "Indian Equities" || a.category === "US Stocks"),
    [assets]
  );
  const mutualFunds = useMemo(
    () => assets.filter((a) => a.category === "Mutual Funds"),
    [assets]
  );

  // Active view list with search filter
  const currentCategoryList = useMemo(() => {
    if (active === "Equities") return equities;
    if (active === "Mutual Funds") return mutualFunds;
    if (overviewSubTab === "stocks") return equities;
    if (overviewSubTab === "mf") return mutualFunds;
    return assets;
  }, [active, overviewSubTab, equities, mutualFunds, assets]);

  const displayedAssets = useMemo(() => {
    let list = currentCategoryList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          getStockTicker(a.name).toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return sortAssetList(list);
  }, [currentCategoryList, searchQuery, sortField, sortOrder]);

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
    <main className="apple-canvas">
      {/* 1. Apple Floating Glass Island Header */}
      <header className="apple-island-header">
        {/* Brand & Status */}
        <div className="apple-brand-wrap" onClick={() => setActive("Overview")}>
          <div className="apple-brand-icon">↗</div>
          <span className="apple-brand-title">
            My<span>Wealth</span>
          </span>
          <span className={`apple-header-status-pill ${syncStatus}`}>
            <span className="apple-pulse-dot" />
            {syncStatus === "live" ? "Synced" : syncStatus === "connecting" ? "Connecting" : "Local"}
          </span>
        </div>

        {/* Center: Apple Segmented Pill Switcher */}
        <nav className="apple-segmented-nav" aria-label="Main Navigation">
          {navigation.map(({ name, icon: Icon }) => {
            const isTabActive = active === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setActive(name);
                  if (name === "Equities") setOverviewSubTab("stocks");
                  else if (name === "Mutual Funds") setOverviewSubTab("mf");
                  else setOverviewSubTab("all");
                }}
                className={`apple-nav-pill ${isTabActive ? "active" : ""}`}
              >
                <Icon size={14} strokeWidth={isTabActive ? 2.4 : 1.8} />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Currency Toggle + Add Investment Button + DB Setup */}
        <div className="apple-header-right">
          <IosCurrencyToggle
            checked={showUsdInRupees}
            onToggle={toggleUsdInRupees}
            rate={usdInrRate}
          />
          <button
            type="button"
            className="apple-add-btn"
            onClick={() => setModal(true)}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Asset</span>
          </button>
          <button
            type="button"
            className="apple-circle-icon-btn"
            title="PostgreSQL Configuration"
            onClick={() => setDbModal(true)}
          >
            <Database size={15} />
          </button>
        </div>
      </header>

      {/* 2. Apple Dynamic Island (Floating Session Live Prices Notification) */}
      {unsavedAssetIds.size > 0 && (
        <div className="apple-dynamic-island">
          <div className="apple-island-left">
            <div className="apple-island-sparkle-orb">
              <Sparkles size={15} />
            </div>
            <div className="apple-island-text">
              <strong>Live Market Prices Active ({unsavedAssetIds.size} {unsavedAssetIds.size === 1 ? "holding" : "holdings"} updated)</strong>
              <p>Session preview only — not saved to PostgreSQL database yet.</p>
            </div>
          </div>
          <div className="apple-island-actions">
            <button
              type="button"
              className="apple-island-save-btn"
              onClick={handleSavePricesToDb}
              disabled={isSavingPrices}
            >
              {isSavingPrices ? <RefreshCw size={13} className="refresh-spinning" /> : <Save size={13} />}
              <span>{isSavingPrices ? "Saving…" : "Save to DB"}</span>
            </button>
            <button
              type="button"
              className="apple-island-revert-btn"
              onClick={handleDiscardRefreshedPrices}
              disabled={isSavingPrices}
            >
              <RotateCcw size={12} />
              <span>Revert</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Stage */}
      <section className="apple-content-stage">
        {/* OVERVIEW BENTO HERO STAGE */}
        {active === "Overview" && (
          <div className="apple-bento-hero">
            {/* Bento Card 1: Apple Wallet Net Worth Showcase */}
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <div className="apple-eyebrow-row">
                  <span className="apple-hero-eyebrow">PORTFOLIO VALUATION</span>
                  <span className="apple-header-status-pill" style={{ padding: "2px 8px" }}>
                    <span className="apple-pulse-dot" />
                    Real-time
                  </span>
                </div>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || assets.length === 0}
                  title="Fetch live market quotes for all holdings"
                >
                  <RefreshCw size={13} className={isRefreshingPrices ? "refresh-spinning" : ""} />
                  <span>{isRefreshingPrices ? "Updating…" : "Refresh Prices"}</span>
                </button>
              </div>

              <div className="apple-hero-main-val">
                <span className="apple-hero-val-text">{money(totalCurrentINR)}</span>
              </div>

              <div className="apple-hero-return-row">
                <div className={`apple-hero-return-badge ${totalPnlINR >= 0 ? "positive" : "negative"}`}>
                  {totalPnlINR >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  <span>
                    {totalPnlINR >= 0 ? `+${money(totalPnlINR)}` : money(totalPnlINR)}
                    {" "}
                    ({totalReturnPct >= 0 ? `+${totalReturnPct.toFixed(2)}%` : `${totalReturnPct.toFixed(2)}%`}) All-Time Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  {priceRefreshMessage || "Live valuations synced with market"}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Total Invested</span>
                  <span className="apple-stat-chip-val">{money(totalInvestedINR)}</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Active Holdings</span>
                  <span className="apple-stat-chip-val">{assets.length} Assets</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">US Exposure</span>
                  <span className="apple-stat-chip-val">${(usVal / usdInrRate).toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Apple Spectrum Allocation Visualizer */}
            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Asset Allocation</h3>
                  <p className="apple-alloc-sub">Multi-class portfolio distribution</p>
                </div>
                <span className="apple-alloc-badge">{assets.length} Positions</span>
              </div>

              {/* Multi-segment Spectrum Bar */}
              <div className="apple-spectrum-bar-wrap">
                <div className="apple-spectrum-bar">
                  {pctIndian > 0 && (
                    <div
                      className="apple-spectrum-segment seg-indian"
                      style={{ width: `${pctIndian}%` }}
                      title={`Indian Equities: ${pctIndian}%`}
                    />
                  )}
                  {pctMF > 0 && (
                    <div
                      className="apple-spectrum-segment seg-mf"
                      style={{ width: `${pctMF}%` }}
                      title={`Mutual Funds: ${pctMF}%`}
                    />
                  )}
                  {pctUS > 0 && (
                    <div
                      className="apple-spectrum-segment seg-us"
                      style={{ width: `${pctUS}%` }}
                      title={`US Stocks: ${pctUS}%`}
                    />
                  )}
                  {pctGold > 0 && (
                    <div
                      className="apple-spectrum-segment seg-gold"
                      style={{ width: `${pctGold}%` }}
                      title={`Gold & Fixed: ${pctGold}%`}
                    />
                  )}
                </div>
              </div>

              {/* Allocation List Items */}
              <div className="apple-alloc-rows">
                <div className="apple-alloc-item" onClick={() => { setActive("Equities"); setOverviewSubTab("stocks"); }}>
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-indian" />
                    <div>
                      <span className="apple-alloc-name">Indian Equities</span>
                      <span className="apple-alloc-pct">{pctIndian}% of total</span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(indianVal)}</span>
                </div>

                <div className="apple-alloc-item" onClick={() => { setActive("Mutual Funds"); setOverviewSubTab("mf"); }}>
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-mf" />
                    <div>
                      <span className="apple-alloc-name">Mutual Funds</span>
                      <span className="apple-alloc-pct">{pctMF}% of total</span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(mfVal)}</span>
                </div>

                <div className="apple-alloc-item" onClick={() => { setActive("Equities"); setOverviewSubTab("stocks"); }}>
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-us" />
                    <div>
                      <span className="apple-alloc-name">US Equities</span>
                      <span className="apple-alloc-pct">{pctUS}% of total</span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(usVal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EQUITIES TAB HERO */}
        {active === "Equities" && (
          <div className="apple-bento-hero">
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <span className="apple-hero-eyebrow">EQUITIES & STOCKS PORTFOLIO</span>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || equities.length === 0}
                >
                  <RefreshCw size={13} className={isRefreshingPrices ? "refresh-spinning" : ""} />
                  <span>{isRefreshingPrices ? "Updating…" : "Refresh Prices"}</span>
                </button>
              </div>

              <div className="apple-hero-main-val">
                <span className="apple-hero-val-text">{money(stocksCurrent)}</span>
              </div>

              <div className="apple-hero-return-row">
                <div className={`apple-hero-return-badge ${stocksPnl >= 0 ? "positive" : "negative"}`}>
                  {stocksPnl >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  <span>
                    {stocksPnl >= 0 ? `+${money(stocksPnl)}` : money(stocksPnl)}
                    {" "}
                    ({stocksPnlPct >= 0 ? `+${stocksPnlPct.toFixed(2)}%` : `${stocksPnlPct.toFixed(2)}%`}) Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  Invested: {money(stocksInvested)}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Stock Holdings</span>
                  <span className="apple-stat-chip-val">{equities.length} Companies</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Indian Stocks</span>
                  <span className="apple-stat-chip-val">{assets.filter((a) => a.category === "Indian Equities").length}</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">US Stocks</span>
                  <span className="apple-stat-chip-val">{assets.filter((a) => a.category === "US Stocks").length} (${(usVal / usdInrRate).toFixed(2)})</span>
                </div>
              </div>
            </div>

            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Equities Diversification</h3>
                  <p className="apple-alloc-sub">Market exposure</p>
                </div>
              </div>
              <div className="apple-alloc-rows" style={{ marginTop: "12px" }}>
                <div className="apple-alloc-item">
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-indian" />
                    <div>
                      <span className="apple-alloc-name">NSE / BSE Equities</span>
                      <span className="apple-alloc-pct">{stocksCurrent > 0 ? ((indianVal / stocksCurrent) * 100).toFixed(1) : 0}% of equity</span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(indianVal)}</span>
                </div>
                <div className="apple-alloc-item">
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-us" />
                    <div>
                      <span className="apple-alloc-name">NASDAQ / NYSE Equities</span>
                      <span className="apple-alloc-pct">{stocksCurrent > 0 ? ((usVal / stocksCurrent) * 100).toFixed(1) : 0}% of equity</span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(usVal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MUTUAL FUNDS TAB HERO */}
        {active === "Mutual Funds" && (
          <div className="apple-bento-hero">
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <span className="apple-hero-eyebrow">MUTUAL FUNDS & SIPS</span>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || mutualFunds.length === 0}
                >
                  <RefreshCw size={13} className={isRefreshingPrices ? "refresh-spinning" : ""} />
                  <span>{isRefreshingPrices ? "Updating…" : "Refresh Prices"}</span>
                </button>
              </div>

              <div className="apple-hero-main-val">
                <span className="apple-hero-val-text">{money(mfCurrent)}</span>
              </div>

              <div className="apple-hero-return-row">
                <div className={`apple-hero-return-badge ${mfPnl >= 0 ? "positive" : "negative"}`}>
                  {mfPnl >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  <span>
                    {mfPnl >= 0 ? `+${money(mfPnl)}` : money(mfPnl)}
                    {" "}
                    ({mfPnlPct >= 0 ? `+${mfPnlPct.toFixed(2)}%` : `${mfPnlPct.toFixed(2)}%`}) NAV Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  Invested: {money(mfInvested)}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Schemes Tracked</span>
                  <span className="apple-stat-chip-val">{mutualFunds.length} Funds</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Portfolio Share</span>
                  <span className="apple-stat-chip-val">{pctMF}% of Net Worth</span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Total Units</span>
                  <span className="apple-stat-chip-val">{mutualFunds.reduce((s, a) => s + a.quantity, 0).toFixed(2)} units</span>
                </div>
              </div>
            </div>

            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Fund Schemes</h3>
                  <p className="apple-alloc-sub">Active mutual fund holdings</p>
                </div>
              </div>
              <div className="apple-alloc-rows" style={{ marginTop: "12px" }}>
                {mutualFunds.map((mf) => (
                  <div key={mf.id} className="apple-alloc-item">
                    <div className="apple-alloc-item-left">
                      <span className="apple-alloc-dot dot-mf" />
                      <div>
                        <span className="apple-alloc-name">{mf.name}</span>
                        <span className="apple-alloc-pct">{mf.quantity.toFixed(2)} units @ NAV ₹{mf.currentPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="apple-alloc-val">{money(mf.quantity * mf.currentPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. APPLE HOLDINGS SECTION */}
        <section className="apple-holdings-section">
          {/* Section Toolbar */}
          <div className="apple-holdings-toolbar">
            <div className="apple-filter-group">
              <button
                type="button"
                className={`apple-filter-pill ${overviewSubTab === "all" && active === "Overview" ? "active" : ""}`}
                onClick={() => { setActive("Overview"); setOverviewSubTab("all"); }}
              >
                <LayoutDashboard size={13} />
                <span>All Assets ({assets.length})</span>
              </button>
              <button
                type="button"
                className={`apple-filter-pill ${(overviewSubTab === "stocks" || active === "Equities") ? "active" : ""}`}
                onClick={() => { setActive("Equities"); setOverviewSubTab("stocks"); }}
              >
                <ChartNoAxesCombined size={13} />
                <span>Stocks ({equities.length})</span>
              </button>
              <button
                type="button"
                className={`apple-filter-pill ${(overviewSubTab === "mf" || active === "Mutual Funds") ? "active" : ""}`}
                onClick={() => { setActive("Mutual Funds"); setOverviewSubTab("mf"); }}
              >
                <Wallet size={13} />
                <span>Mutual Funds ({mutualFunds.length})</span>
              </button>
            </div>

            <div className="apple-toolbar-right">
              {/* Instant Search Bar */}
              <div className="apple-search-wrap">
                <Search size={14} className="apple-search-icon" />
                <input
                  type="text"
                  placeholder="Search assets or tickers…"
                  className="apple-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Switcher: Apple Cards vs Apple Table */}
              <div className="apple-view-toggle">
                <button
                  type="button"
                  className={`apple-view-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="Apple Stocks Cards View"
                >
                  <Layers size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  className={`apple-view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Spreadsheet Table View"
                >
                  <TableProperties size={13} />
                  <span>Table</span>
                </button>
              </div>

              {/* Quick Sort Selector */}
              <button
                type="button"
                className="apple-filter-pill"
                onClick={() => handleSort("pnl")}
                title="Toggle Sort by Return"
              >
                <ArrowUpDown size={12} />
                <span>Sort: {sortField.toUpperCase()} ({sortOrder})</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <IosLoadingView title="Loading Positions" subtitle="Syncing with PostgreSQL..." />
          ) : displayedAssets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ChartNoAxesCombined size={24} /></div>
              <strong>No assets match your search</strong>
              <p>Add a position or try clearing your search query.</p>
              <button className="primary-button" onClick={() => setModal(true)}>
                <Plus size={15} /> Add investment
              </button>
            </div>
          ) : viewMode === "cards" ? (
            /* APPLE STOCKS GLASS CARDS STACK */
            <div className="apple-card-stack">
              {displayedAssets.map((item) => {
                const ticker = getStockTicker(item.name);
                const isUnsaved = unsavedAssetIds.has(item.id);
                const isFlashed = flashAssetId === item.id;
                const investedVal = item.quantity * item.buyPrice;
                const currentVal = item.quantity * item.currentPrice;
                const pnl = currentVal - investedVal;
                const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                return (
                  <div
                    key={item.id}
                    className={`apple-asset-card ${isUnsaved ? "unsaved-glow" : ""} ${isFlashed ? "flash-pulse" : ""}`}
                  >
                    {/* Col 1: Brand Avatar + Asset Identity */}
                    <div className="apple-card-identity">
                      <div className="apple-avatar-squircle">
                        <StockAvatar name={item.name} ticker={ticker} category={item.category} />
                      </div>
                      <div className="apple-identity-text">
                        <div className="apple-asset-name-row">
                          <h4 className="apple-asset-name" title={item.name}>{item.name}</h4>
                          {isUnsaved && (
                            <span className="apple-live-badge" title="Market price updated in live preview mode">
                              <Sparkles size={9} /> Live
                            </span>
                          )}
                        </div>
                        <div className="apple-asset-tags">
                          <span className="apple-ticker-pill">{ticker}</span>
                          <span className="apple-category-pill">{item.category}</span>
                          {item.currency === "USD" && <span className="apple-curr-pill">USD</span>}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Holdings & Invested */}
                    <div className="apple-card-col">
                      <span className="apple-col-label">HOLDINGS & COST</span>
                      <span className="apple-holdings-val">
                        {item.quantity.toFixed(item.quantity % 1 === 0 ? 0 : 4)} {item.category === "Mutual Funds" ? "units" : "shares"}
                      </span>
                      <span className="apple-col-sub">
                        Avg {item.currency === "USD" ? `$${item.buyPrice.toFixed(2)}` : `₹${item.buyPrice.toFixed(2)}`}
                        {" · "}
                        Inv {money(investedVal, item.currency)}
                      </span>
                    </div>

                    {/* Col 3: Live Market Price */}
                    <div className="apple-card-col">
                      <span className="apple-col-label">MARKET PRICE</span>
                      <span className="apple-price-val">
                        {item.currency === "USD" ? `$${item.currentPrice.toFixed(2)}` : `₹${item.currentPrice.toFixed(2)}`}
                      </span>
                      {item.currency === "USD" && (
                        <span className="apple-col-sub">
                          ₹{(item.currentPrice * usdInrRate).toFixed(1)} / share
                        </span>
                      )}
                    </div>

                    {/* Col 4: Current Valuation & Returns */}
                    <div className="apple-card-col apple-card-val">
                      <span className="apple-col-label">CURRENT VALUATION</span>
                      <span className="apple-val-primary">{money(currentVal, item.currency)}</span>
                      {item.currency === "USD" && showUsdInRupees && (
                        <span className="apple-val-usd-pill">
                          ${currentVal.toFixed(2)} USD
                        </span>
                      )}
                      <div className={`apple-return-pill ${pnl >= 0 ? "positive" : "negative"}`}>
                        {pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>
                          {pnl >= 0 ? "+" : ""}{money(pnl, item.currency)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    {/* Col 5: Actions */}
                    <div className="apple-card-actions">
                      <button
                        type="button"
                        className="apple-action-pill-btn"
                        onClick={() => startEditing(item)}
                        title="Edit position"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="apple-action-pill-btn delete"
                        onClick={() => setDeletingAsset(item)}
                        title="Delete position"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* APPLE FROSTED SPREADSHEET TABLE */
            <div className="apple-table-panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("name")} className="sortable-th">
                        <div className="th-content">
                          <span>Asset / Company</span>
                          <span className="sort-icon">{sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                        </div>
                      </th>
                      <th onClick={() => handleSort("price")} className="sortable-th">
                        <div className="th-content th-right">
                          <span>Market Price</span>
                          <span className="sort-icon">{sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                        </div>
                      </th>
                      <th onClick={() => handleSort("invested")} className="sortable-th">
                        <div className="th-content th-right">
                          <span>Total Invested</span>
                          <span className="sort-icon">{sortField === "invested" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                        </div>
                      </th>
                      <th onClick={() => handleSort("value")} className="sortable-th">
                        <div className="th-content th-right">
                          <span>Current Valuation</span>
                          <span className="sort-icon">{sortField === "value" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                        </div>
                      </th>
                      <th onClick={() => handleSort("pnl")} className="sortable-th">
                        <div className="th-content th-right">
                          <span>Returns (P&L)</span>
                          <span className="sort-icon">{sortField === "pnl" ? (sortOrder === "asc" ? "↑" : "↓") : "↓↑"}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content th-center">
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAssets.map((item) => {
                      const ticker = getStockTicker(item.name);
                      const isUnsaved = unsavedAssetIds.has(item.id);
                      const isFlashed = flashAssetId === item.id;
                      const investedVal = item.quantity * item.buyPrice;
                      const currentVal = item.quantity * item.currentPrice;
                      const pnl = currentVal - investedVal;
                      const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                      return (
                        <tr key={item.id} className={isFlashed ? "flash-pulse" : ""}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div className="apple-avatar-squircle" style={{ width: "36px", height: "36px" }}>
                                <StockAvatar name={item.name} ticker={ticker} category={item.category} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <strong style={{ color: "var(--foreground)", fontSize: "13px" }}>{item.name}</strong>
                                  {isUnsaved && <span className="apple-live-badge"><Sparkles size={8} /> Live</span>}
                                </div>
                                <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                                  <span className="apple-ticker-pill">{ticker}</span>
                                  <span className="apple-category-pill">{item.category}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <strong style={{ color: "var(--foreground)", fontSize: "13px" }}>
                              {item.currency === "USD" ? `$${item.currentPrice.toFixed(2)}` : `₹${item.currentPrice.toFixed(2)}`}
                            </strong>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                              Avg {item.currency === "USD" ? `$${item.buyPrice.toFixed(2)}` : `₹${item.buyPrice.toFixed(2)}`}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <strong style={{ color: "var(--foreground)", fontSize: "13px" }}>
                              {money(investedVal, item.currency)}
                            </strong>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                              {item.quantity.toFixed(item.quantity % 1 === 0 ? 0 : 4)} units
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <strong style={{ color: "var(--foreground)", fontSize: "14px" }}>
                              {money(currentVal, item.currency)}
                            </strong>
                            {item.currency === "USD" && showUsdInRupees && (
                              <div className="apple-val-usd-pill" style={{ display: "inline-block" }}>
                                ${currentVal.toFixed(2)} USD
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className={`apple-return-pill ${pnl >= 0 ? "positive" : "negative"}`} style={{ display: "inline-flex" }}>
                              {pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              <span>{pnl >= 0 ? "+" : ""}{money(pnl, item.currency)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="apple-action-pill-btn"
                                onClick={() => startEditing(item)}
                                title="Edit position"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                className="apple-action-pill-btn delete"
                                onClick={() => setDeletingAsset(item)}
                                title="Delete position"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </section>

      {/* 5. ADD ASSET MODAL */}
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
                <span className="fetch-price-status">
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

            <div className="form-row">
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
                Buy Price per unit ({currency === "USD" ? "$" : "₹"})
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

            {computedAddHoldings > 0 && (
              <div className="holdings-preview-banner">
                <Sparkles size={14} style={{ color: "var(--apple-blue)", flexShrink: 0 }} />
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
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder={computedAddHoldings > 0 ? (computedAddHoldings * (Number(buyPrice) || 1)).toFixed(2) : "e.g. 50000"}
                />
              </label>

              <label>
                Market Price ({currency === "USD" ? "$" : "₹"})
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
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. EDIT ASSET MODAL */}
      {editingAsset && (
        <div className="modal-overlay" onClick={() => setEditingAsset(null)}>
          <form className="investment-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdateAsset}>
            <div className="modal-heading">
              <div>
                <h2>Edit holding</h2>
                <p>Update valuation or units in PostgreSQL.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setEditingAsset(null)}>
                <X size={18} />
              </button>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)" }}>Asset Name</span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  className="fetch-price-status"
                  onClick={() => handleFetchLivePrice(editingAsset.name, editingAsset.category, "edit")}
                  disabled={isFetchingPrice}
                >
                  <Sparkles size={11} />
                  {isFetchingPrice ? "Fetching live quote…" : "Refresh price"}
                </button>
              </div>
              <input
                required
                value={editingAsset.name}
                onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
              />
            </div>

            <div className="form-row">
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
                  onChange={(e) => setEditingAsset({ ...editingAsset, currency: e.target.value as "INR" | "USD" })}
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Amount You Invested ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  value={editingAsset.investedAmount}
                  onChange={(e) => setEditingAsset({ ...editingAsset, investedAmount: e.target.value })}
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
                  onChange={(e) => setEditingAsset({ ...editingAsset, buyPrice: e.target.value })}
                />
              </label>
            </div>

            {computedEditHoldings > 0 && (
              <div className="holdings-preview-banner">
                <Sparkles size={14} style={{ color: "var(--apple-blue)", flexShrink: 0 }} />
                <span>
                  Calculated Holdings: <strong>{computedEditHoldings.toFixed(computedEditHoldings % 1 === 0 ? 0 : 4)} units</strong>
                </span>
              </div>
            )}

            <div className="form-row">
              <label>
                Current Value ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={editingAsset.currentValue}
                  onChange={(e) => setEditingAsset({ ...editingAsset, currentValue: e.target.value })}
                />
              </label>

              <label>
                Market Price ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={editingAsset.currentPrice}
                  onChange={(e) => setEditingAsset({ ...editingAsset, currentPrice: e.target.value })}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingAsset(null)}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Update Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deletingAsset && (
        <div className="modal-overlay" onClick={() => setDeletingAsset(null)}>
          <div className="investment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>Delete asset</h2>
                <p>Are you sure you want to remove <strong>{deletingAsset.name}</strong> from your portfolio?</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setDeletingAsset(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "12px 0", fontSize: "13px", color: "var(--foreground-muted)" }}>
              This will remove the position permanently from PostgreSQL.
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDeletingAsset(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "var(--rose)" }}
                onClick={confirmDeleteAsset}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DATABASE MODAL */}
      {dbModal && (
        <div className="modal-overlay" onClick={() => setDbModal(false)}>
          <div className="investment-modal" style={{ width: "min(100%, 580px)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="apple-brand-icon" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
                  <Database size={16} />
                </div>
                <div>
                  <h2>PostgreSQL Setup</h2>
                  <p>Connected via Supabase Realtime Engine</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setDbModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: "1.6" }}>
              <p>Your portfolio is synchronized in real time with Supabase PostgreSQL.</p>
              <div style={{ background: "rgba(0,0,0,0.04)", padding: "14px", borderRadius: "12px", fontFamily: "monospace", fontSize: "12px", margin: "10px 0" }}>
                Status: {syncStatus.toUpperCase()} ({assets.length} positions)
              </div>
            </div>

            <div className="modal-actions">
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

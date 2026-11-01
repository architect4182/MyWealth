"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AssetPosition, AssetCategory, EditAssetForm, MarketTimingStatus, PrefillAssetData } from "@/types/portfolio";
import { getIndianMarketStatus, getUsMarketStatus } from "@/lib/market-status";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Comprehensive asset deduplication safeguard
export function dedupeAssets(items: AssetPosition[]): AssetPosition[] {
  if (!items || !items.length) return [];
  const seenIds = new Set<string>();
  const realItemKeys = new Set<string>();

  // Pass 1: Identify confirmed real database items
  for (const item of items) {
    const id = String(item.id || "").trim();
    if (id && !id.startsWith("temp-")) {
      seenIds.add(id);
      realItemKeys.add(`${item.name.toLowerCase().trim()}_${item.category}`);
    }
  }

  // Pass 2: Keep unique real items and deduplicate unconfirmed temp items
  const addedIds = new Set<string>();
  const result: AssetPosition[] = [];

  for (const item of items) {
    const id = String(item.id || "").trim();
    if (!id) continue;

    // Discard optimistic temp placeholder if confirmed real item for same asset exists
    if (id.startsWith("temp-")) {
      const key = `${item.name.toLowerCase().trim()}_${item.category}`;
      if (realItemKeys.has(key)) {
        continue;
      }
    }

    if (addedIds.has(id)) continue;
    addedIds.add(id);
    result.push(item);
  }

  return result;
}

// All asset holdings are fetched dynamically from Supabase PostgreSQL

interface PortfolioContextType {
  assets: AssetPosition[];
  syncStatus: "live" | "connecting" | "offline";
  isLoading: boolean;
  usdInrRate: number;
  showUsdInRupees: boolean;
  toggleUsdInRupees: () => void;
  indianMarket: MarketTimingStatus;
  usMarket: MarketTimingStatus;
  currentTime: Date | null;
  totalInvestedINR: number;
  totalCurrentINR: number;
  totalPnlINR: number;
  totalReturnPct: number;
  stocksInvested: number;
  stocksCurrent: number;
  stocksPnl: number;
  stocksPnlPct: number;
  mfInvested: number;
  mfCurrent: number;
  mfPnl: number;
  mfPnlPct: number;
  equities: AssetPosition[];
  mutualFunds: AssetPosition[];
  indianVal: number;
  usVal: number;
  mfVal: number;
  goldVal: number;
  pctIndian: number;
  pctUS: number;
  pctMF: number;
  pctGold: number;
  money: (val: number, cur?: "INR" | "USD") => string;
  isRefreshingPrices: boolean;
  priceRefreshMessage: string;
  handleRefreshPrices: () => Promise<void>;
  unsavedAssetIds: Set<string>;
  isSavingPrices: boolean;
  handleSavePricesToDb: () => Promise<void>;
  handleDiscardRefreshedPrices: () => void;
  flashAssetId: string | null;
  addAsset: (item: {
    name: string;
    category: AssetCategory;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    currency: "INR" | "USD";
  }) => Promise<void>;
  updateAsset: (updated: AssetPosition) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  modal: boolean;
  setModal: (v: boolean) => void;
  editingAsset: EditAssetForm | null;
  setEditingAsset: (v: EditAssetForm | null) => void;
  deletingAsset: AssetPosition | null;
  setDeletingAsset: (v: AssetPosition | null) => void;
  dbModal: boolean;
  setDbModal: (v: boolean) => void;
  marketModal: boolean;
  setMarketModal: (v: boolean) => void;
  defaultCategory: AssetCategory;
  setDefaultCategory: (c: AssetCategory) => void;
  startEditing: (asset: AssetPosition) => void;
  prefillAsset: PrefillAssetData | null;
  setPrefillAsset: (data: PrefillAssetData | null) => void;
  openAddModalWithPrefill: (data: PrefillAssetData) => void;
  userGender: "male" | "female";
  setUserGender: (gender: "male" | "female") => void;
  currentUserId: string;
  isLoggingOut: boolean;
  handleLogout: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [assets, setAssets] = useState<AssetPosition[]>([]);
  const [unsavedAssetIds, setUnsavedAssetIds] = useState<Set<string>>(new Set());
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const dbBaselinePricesRef = useRef<Map<string, number>>(new Map());

  const [syncStatus, setSyncStatus] = useState<"live" | "connecting" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline"
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [priceRefreshMessage, setPriceRefreshMessage] = useState("");
  const [flashAssetId, setFlashAssetId] = useState<string | null>(null);

  const [modal, setModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EditAssetForm | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetPosition | null>(null);
  const [dbModal, setDbModal] = useState(false);
  const [marketModal, setMarketModal] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory>("Indian Equities");
  const [prefillAsset, setPrefillAsset] = useState<PrefillAssetData | null>(null);
  const [userGender, setUserGenderState] = useState<"male" | "female">("male");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // 1. Immediately read cached identity and vision preference on client mount
    try {
      const savedUser = localStorage.getItem("mywealth_current_user");
      if (savedUser) {
        setCurrentUserId(savedUser);
      }
      const savedGender = localStorage.getItem("mywealth_user_gender");
      if (savedGender === "female" || savedGender === "male") {
        setUserGenderState(savedGender);
      }
    } catch {}

    // 2. Concurrently verify server session token
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data.username) {
          const uid = String(data.username).trim();
          setCurrentUserId(uid);
          try {
            localStorage.setItem("mywealth_current_user", uid);
          } catch {}
        } else if (data && !data.authenticated) {
          setCurrentUserId("");
        }
        if (data?.authenticated && (data.gender === "female" || data.gender === "male")) {
          setUserGenderState(data.gender);
          try {
            localStorage.setItem("mywealth_user_gender", data.gender);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setUserGender = (gender: "male" | "female") => {
    setUserGenderState(gender);
    try {
      localStorage.setItem("mywealth_user_gender", gender);
      if (isSupabaseConfigured && supabase && currentUserId) {
        supabase
          .from("users")
          .update({ gender })
          .eq("username", currentUserId.toLowerCase())
          .then(() => {});
      }
    } catch {}
  };

  const openAddModalWithPrefill = (data: PrefillAssetData) => {
    setDefaultCategory(data.category);
    setPrefillAsset(data);
    setModal(true);
  };

  // Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const indianMarket = useMemo(() => getIndianMarketStatus(currentTime), [currentTime]);
  const usMarket = useMemo(() => getUsMarketStatus(currentTime), [currentTime]);

  // Exchange rate
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
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Currency view toggle (Default OFF when logged in; maintained in active session only)
  const [showUsdInRupees, setShowUsdInRupees] = useState<boolean>(false);
  useEffect(() => {
    try {
      // Clean up legacy localStorage persistent key so it never persists across logins
      localStorage.removeItem("mywealth_show_usd_in_rupees");
      const sessionVal = sessionStorage.getItem("mywealth_session_show_usd_in_rupees");
      if (sessionVal !== null) {
        setShowUsdInRupees(sessionVal === "true");
      } else {
        setShowUsdInRupees(false);
      }
    } catch {}
  }, []);

  const toggleUsdInRupees = () => {
    setShowUsdInRupees((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("mywealth_session_show_usd_in_rupees", String(next));
      } catch {}
      return next;
    });
  };

  // Ensure clean luminous light theme (remove any residual dark mode class)
  useEffect(() => {
    try {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("mywealth_theme");
    } catch {}
  }, []);

  // Local storage cache for offline / fallback partitioned by user
  useEffect(() => {
    if (!currentUserId || !currentUserId.trim()) return;
    try {
      const uid = currentUserId.toLowerCase().trim();
      const local = localStorage.getItem(`mywealth_positions_${uid}`);
      if (local && !isSupabaseConfigured) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(dedupeAssets(parsed));
        }
      }
    } catch {}
  }, [currentUserId]);

  // Supabase Realtime Sync filtered strictly by user_id
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("offline");
      setIsLoading(false);
      return;
    }

    if (!currentUserId || !currentUserId.trim()) {
      setAssets([]);
      setIsLoading(false);
      setSyncStatus("offline");
      return;
    }

    let isMounted = true;
    const uid = currentUserId.trim();

    async function loadAssets() {
      setSyncStatus("connecting");
      setIsLoading(true);
      try {
        // Query scheme/assets table with username column (with fallback to user_id)
        let query = supabase!.from("assets").select("*").ilike("username", uid);
        let { data, error } = await query.order("created_at", { ascending: false });

        // If username column is not yet renamed in DB (code 42703), fallback to user_id
        if (error && (error.code === "42703" || error.message?.includes("username"))) {
          let fallbackQuery = supabase!.from("assets").select("*").ilike("user_id", uid);
          const fbRes = await fallbackQuery.order("created_at", { ascending: false });
          if (!fbRes.error && fbRes.data) {
            data = fbRes.data;
            error = null;
          } else {
            error = fbRes.error;
          }
        }

        if (!error && data && isMounted) {
          const formatted: AssetPosition[] = data.map((row: any) => ({
            id: String(row.id),
            username: row.username || row.user_id || uid,
            userId: row.username || row.user_id || uid,
            name: row.name,
            category: row.category as AssetCategory,
            quantity: Number(row.quantity),
            buyPrice: Number(row.buy_price),
            currentPrice: Number(row.current_price),
            currency: row.currency as "INR" | "USD",
            date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          const deduped = dedupeAssets(formatted);
          deduped.forEach((item) => {
            dbBaselinePricesRef.current.set(item.id, item.currentPrice);
          });
          setAssets(deduped);
          persistLocal(deduped, uid);
          setSyncStatus("live");
        } else if (error && (error.code === "42703" || error.message?.includes("user_id") || error.message?.includes("username"))) {
          if (isMounted) {
            const local = localStorage.getItem(`mywealth_positions_${uid}`);
            if (local) {
              try {
                setAssets(dedupeAssets(JSON.parse(local)));
              } catch {
                setAssets([]);
              }
            } else {
              setAssets([]);
            }
            setSyncStatus("live");
          }
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        if (isMounted) setSyncStatus("offline");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssets();

    const channel = supabase
      .channel(`mywealth-live-sync-${uid}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row: any = payload.new;
          const rowUser = (row.username || row.user_id || "").toLowerCase().trim();
          const matches = rowUser === uid.toLowerCase();
          if (!matches) return;

          const newPos: AssetPosition = {
            id: String(row.id),
            username: row.username || row.user_id || uid,
            userId: row.username || row.user_id || uid,
            name: row.name,
            category: row.category as AssetCategory,
            quantity: Number(row.quantity),
            buyPrice: Number(row.buy_price),
            currentPrice: Number(row.currentPrice !== undefined ? row.currentPrice : row.current_price),
            currency: row.currency as "INR" | "USD",
            date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          };
          dbBaselinePricesRef.current.set(newPos.id, newPos.currentPrice);

          setAssets((prev) => {
            // 1. If this exact real ID already exists, update in place
            if (prev.some((a) => a.id === newPos.id)) {
              return prev.map((a) => (a.id === newPos.id ? newPos : a));
            }

            // 2. Check if an optimistic temp item exists matching this asset
            const tempIndex = prev.findIndex(
              (a) =>
                a.id.startsWith("temp-") &&
                a.name.toLowerCase().trim() === newPos.name.toLowerCase().trim() &&
                a.category === newPos.category
            );

            let nextAssets: AssetPosition[];
            if (tempIndex !== -1) {
              // Replace optimistic temp item with confirmed real database asset
              nextAssets = [...prev];
              nextAssets[tempIndex] = newPos;
            } else {
              nextAssets = [newPos, ...prev];
            }

            const deduped = dedupeAssets(nextAssets);
            persistLocal(deduped, uid);
            return deduped;
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
            setAssets((prev) => {
              const cleaned = prev.filter((a) => a.id !== oldId);
              persistLocal(cleaned, uid);
              return cleaned;
            });
          }
        } else if (payload.eventType === "UPDATE") {
          const row: any = payload.new;
          const rowUser = (row.username || row.user_id || "").toLowerCase().trim();
          const matches = rowUser === uid.toLowerCase();
          if (!matches) return;

          const updatedId = String(row.id);
          dbBaselinePricesRef.current.set(updatedId, Number(row.current_price));
          setUnsavedAssetIds((prev) => {
            if (!prev.has(updatedId)) return prev;
            const next = new Set(prev);
            next.delete(updatedId);
            return next;
          });
          setAssets((prev) => {
            const next = prev.map((a) =>
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
            persistLocal(next, uid);
            return next;
          });
          setFlashAssetId(updatedId);
          setTimeout(() => setFlashAssetId(null), 2000);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && isMounted) {
          setSyncStatus("live");
        }
      });

    return () => {
      isMounted = false;
      try {
        supabase?.removeChannel(channel);
      } catch {}
    };
  }, [currentUserId]);

  // Save to localStorage partitioned per user
  const persistLocal = (newAssets: AssetPosition[], uid?: string) => {
    const user = (
      uid ||
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).toLowerCase().trim();
    if (!user) return;
    try {
      const deduped = dedupeAssets(newAssets);
      localStorage.setItem(`mywealth_positions_${user}`, JSON.stringify(deduped));
    } catch {}
  };

  // Metrics
  const totalInvestedINR = useMemo(() => {
    return assets.reduce((sum, item) => {
      const cost = item.quantity * item.buyPrice;
      return sum + (item.currency === "USD" ? cost * usdInrRate : cost);
    }, 0);
  }, [assets, usdInrRate]);

  const totalCurrentINR = useMemo(() => {
    return assets.reduce((sum, item) => {
      const val = item.quantity * item.currentPrice;
      return sum + (item.currency === "USD" ? val * usdInrRate : val);
    }, 0);
  }, [assets, usdInrRate]);

  const totalPnlINR = totalCurrentINR - totalInvestedINR;
  const totalReturnPct = totalInvestedINR > 0 ? (totalPnlINR / totalInvestedINR) * 100 : 0;

  const equities = useMemo(
    () => assets.filter((a) => a.category === "Indian Equities" || a.category === "US Stocks"),
    [assets]
  );
  const mutualFunds = useMemo(() => assets.filter((a) => a.category === "Mutual Funds"), [assets]);

  const stocksInvested = useMemo(() => {
    return equities.reduce(
      (acc, a) => acc + (a.currency === "USD" ? a.quantity * a.buyPrice * usdInrRate : a.quantity * a.buyPrice),
      0
    );
  }, [equities, usdInrRate]);

  const stocksCurrent = useMemo(() => {
    return equities.reduce(
      (acc, a) => acc + (a.currency === "USD" ? a.quantity * a.currentPrice * usdInrRate : a.quantity * a.currentPrice),
      0
    );
  }, [equities, usdInrRate]);

  const stocksPnl = stocksCurrent - stocksInvested;
  const stocksPnlPct = stocksInvested > 0 ? (stocksPnl / stocksInvested) * 100 : 0;

  const mfInvested = useMemo(() => mutualFunds.reduce((acc, a) => acc + a.quantity * a.buyPrice, 0), [mutualFunds]);
  const mfCurrent = useMemo(() => mutualFunds.reduce((acc, a) => acc + a.quantity * a.currentPrice, 0), [mutualFunds]);
  const mfPnl = mfCurrent - mfInvested;
  const mfPnlPct = mfInvested > 0 ? (mfPnl / mfInvested) * 100 : 0;

  const indianVal = useMemo(
    () => assets.filter((a) => a.category === "Indian Equities").reduce((s, a) => s + a.quantity * a.currentPrice, 0),
    [assets]
  );
  const usVal = useMemo(
    () =>
      assets.filter((a) => a.category === "US Stocks").reduce((s, a) => s + a.quantity * a.currentPrice, 0) * usdInrRate,
    [assets, usdInrRate]
  );
  const mfVal = useMemo(
    () => assets.filter((a) => a.category === "Mutual Funds").reduce((s, a) => s + a.quantity * a.currentPrice, 0),
    [assets]
  );
  const goldVal = useMemo(
    () => assets.filter((a) => a.category === "Gold & Fixed Income").reduce((s, a) => s + a.quantity * a.currentPrice, 0),
    [assets]
  );

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

  // Live price refresh
  const handleRefreshPrices = async () => {
    if (assets.length === 0 || isRefreshingPrices) return;
    setIsRefreshingPrices(true);
    setPriceRefreshMessage("Fetching latest market prices...");

    try {
      const refreshedList = await Promise.all(
        assets.map(async (asset) => {
          let ticker = "";
          let marketType = "";
          const lower = asset.name.toLowerCase();

          if (asset.category === "US Stocks") {
            marketType = "US";
            if (lower.includes("apple")) ticker = "AAPL";
            else if (lower.includes("google") || lower.includes("alphabet")) ticker = "GOOGL";
            else if (lower.includes("microsoft")) ticker = "MSFT";
            else if (lower.includes("amazon")) ticker = "AMZN";
            else if (lower.includes("nvidia")) ticker = "NVDA";
            else if (lower.includes("tesla")) ticker = "TSLA";
            else ticker = asset.name.toUpperCase();
          } else if (asset.category === "Indian Equities") {
            marketType = "INDIA";
            if (lower.includes("reliance") && !lower.includes("jio")) ticker = "RELIANCE";
            else if (lower.includes("jio financial")) ticker = "JIOFIN";
            else if (lower.includes("jio platforms") || lower.includes("jio") || lower === "jp") ticker = "JPL";
            else if (lower.includes("tata motors")) ticker = "TATAMOTORS";
            else if (lower.includes("tcs") || lower.includes("tata consultancy")) ticker = "TCS";
            else if (lower.includes("hdfc")) ticker = "HDFCBANK";
            else if (lower.includes("sbi") || lower.includes("state bank")) ticker = "SBIN";
            else if (lower.includes("infosys")) ticker = "INFY";
            else ticker = asset.name.toUpperCase();
          } else if (asset.category === "Mutual Funds") {
            ticker = asset.name;
          }

          if (!ticker) return asset;

          try {
            const url = asset.category === "Mutual Funds"
              ? `/api/stock-price?query=${encodeURIComponent(ticker)}&category=Mutual%20Funds`
              : `/api/stock-price?query=${encodeURIComponent(ticker)}&symbol=${encodeURIComponent(ticker)}&category=${encodeURIComponent(asset.category)}&market=${marketType}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.price && typeof data.price === "number") {
              const decimals = asset.category === "Mutual Funds" ? 4 : 2;
              return { ...asset, currentPrice: Number(data.price.toFixed(decimals)) };
            }
          } catch {}
          return asset;
        })
      );

      const changedIds = new Set<string>();
      refreshedList.forEach((item) => {
        const baseline = dbBaselinePricesRef.current.get(item.id);
        if (baseline === undefined) {
          const original = assets.find((a) => a.id === item.id);
          if (original && Math.abs(original.currentPrice - item.currentPrice) > 0.001) {
            changedIds.add(item.id);
          }
        } else if (Math.abs(baseline - item.currentPrice) > 0.001) {
          changedIds.add(item.id);
        }
      });

      setAssets(refreshedList);
      persistLocal(refreshedList);
      setUnsavedAssetIds(changedIds);
      setPriceRefreshMessage(`Successfully synced ${changedIds.size} market valuations.`);
      setTimeout(() => setPriceRefreshMessage(""), 4000);
    } catch {
      setPriceRefreshMessage("Price refresh failed.");
      setTimeout(() => setPriceRefreshMessage(""), 4000);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  const handleSavePricesToDb = async () => {
    if (unsavedAssetIds.size === 0 || isSavingPrices) return;
    setIsSavingPrices(true);
    try {
      const changedAssets = assets.filter((a) => unsavedAssetIds.has(a.id));
      if (isSupabaseConfigured && supabase && changedAssets.length > 0) {
        await Promise.all(
          changedAssets.map((a) =>
            supabase!.from("assets").update({ current_price: a.currentPrice }).eq("id", a.id)
          )
        );
      }
      changedAssets.forEach((a) => dbBaselinePricesRef.current.set(a.id, a.currentPrice));
      setUnsavedAssetIds(new Set());
      persistLocal(assets);
    } catch (err) {
      console.error("Save prices error:", err);
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleDiscardRefreshedPrices = () => {
    setAssets((current) =>
      current.map((item) => {
        const baseline = dbBaselinePricesRef.current.get(item.id);
        return baseline !== undefined ? { ...item, currentPrice: baseline } : item;
      })
    );
    setUnsavedAssetIds(new Set());
  };

  // CRUD
  const addAsset = async (item: {
    name: string;
    category: AssetCategory;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    currency: "INR" | "USD";
  }) => {
    const uid = (
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).trim();

    if (!uid) {
      console.error("Cannot add asset without active user identity");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newPos: AssetPosition = {
      id: tempId,
      username: uid,
      userId: uid,
      ...item,
      date: new Date().toISOString().split("T")[0],
    };

    setAssets((prev) => dedupeAssets([newPos, ...prev]));
    persistLocal([newPos, ...assets], uid);
    setFlashAssetId(tempId);
    setTimeout(() => setFlashAssetId(null), 2000);

    if (isSupabaseConfigured && supabase) {
      try {
        // Try inserting with username column
        let insertRes = await supabase
          .from("assets")
          .insert([
            {
              name: newPos.name,
              category: newPos.category,
              quantity: newPos.quantity,
              buy_price: newPos.buyPrice,
              current_price: newPos.currentPrice,
              currency: newPos.currency,
              username: uid,
            },
          ])
          .select();

        // If username column does not exist yet (code 42703), retry with user_id
        if (
          insertRes.error &&
          (insertRes.error.code === "42703" || insertRes.error.message?.includes("username"))
        ) {
          insertRes = await supabase
            .from("assets")
            .insert([
              {
                name: newPos.name,
                category: newPos.category,
                quantity: newPos.quantity,
                buy_price: newPos.buyPrice,
                current_price: newPos.currentPrice,
                currency: newPos.currency,
                user_id: uid,
              },
            ])
            .select();
        }

        if (!insertRes.error && insertRes.data && insertRes.data[0]) {
          const realId = String(insertRes.data[0].id);
          dbBaselinePricesRef.current.set(realId, newPos.currentPrice);
          setAssets((prev) => {
            // If Realtime already received this item and added realId, remove tempId
            if (prev.some((a) => a.id === realId)) {
              const cleaned = prev.filter((a) => a.id !== tempId);
              persistLocal(cleaned, uid);
              return dedupeAssets(cleaned);
            }
            // Otherwise, replace tempId with realId
            const updated = prev.map((a) =>
              a.id === tempId ? { ...a, id: realId, username: uid, userId: uid } : a
            );
            persistLocal(updated, uid);
            return dedupeAssets(updated);
          });
        }
      } catch (err) {
        console.error("Supabase insert error:", err);
      }
    }
  };

  const updateAsset = async (updated: AssetPosition) => {
    const uid = (
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).trim();

    setAssets((prev) => {
      const next = dedupeAssets(
        prev.map((a) => (a.id === updated.id ? { ...updated, username: uid, userId: uid } : a))
      );
      if (uid) persistLocal(next, uid);
      return next;
    });
    setFlashAssetId(updated.id);
    setTimeout(() => setFlashAssetId(null), 2000);

    if (isSupabaseConfigured && supabase && !updated.id.startsWith("temp-")) {
      try {
        await supabase
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
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  };

  const deleteAsset = async (id: string) => {
    const uid = (
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).trim();

    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (uid) persistLocal(next, uid);
      return next;
    });
    dbBaselinePricesRef.current.delete(id);

    if (isSupabaseConfigured && supabase && !id.startsWith("temp-")) {
      try {
        await supabase.from("assets").delete().eq("id", id);
      } catch (err) {
        console.error("Supabase delete error:", err);
      }
    }
  };

  const startEditing = (asset: AssetPosition) => {
    setEditingAsset({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      investedAmount: (asset.quantity * asset.buyPrice).toFixed(2),
      buyPrice: asset.buyPrice.toString(),
      currentPrice: asset.currentPrice.toString(),
      currentValue: (asset.quantity * asset.currentPrice).toFixed(2),
      currency: asset.currency,
    });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Wipe React in-memory states immediately
      setAssets([]);
      setUnsavedAssetIds(new Set());
      dbBaselinePricesRef.current.clear();
      setCurrentUserId("");
      setShowUsdInRupees(false);

      // 2. Unsubscribe Supabase Realtime channel
      if (supabase) {
        try {
          supabase.removeAllChannels();
        } catch {}
      }

      // 3. Purge all localStorage caches beforehand
      try {
        const keysToRemove: string[] = [
          "mywealth_current_user",
          "mywealth_user_gender",
          "mywealth_positions",
          "mywealth_show_usd_in_rupees",
        ];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("mywealth_positions") || k.startsWith("mywealth_"))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch {}
        });
      } catch {}

      // 4. Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch {}

      // 5. Expire server session cookie via POST
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}

      // 6. Seamless direct client-side redirect to /login (no page reload)
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const safeAssets = useMemo(() => dedupeAssets(assets), [assets]);

  return (
    <PortfolioContext.Provider
      value={{
        assets: safeAssets,
        syncStatus,
        isLoading,
        usdInrRate,
        showUsdInRupees,
        toggleUsdInRupees,
        indianMarket,
        usMarket,
        currentTime,
        totalInvestedINR,
        totalCurrentINR,
        totalPnlINR,
        totalReturnPct,
        stocksInvested,
        stocksCurrent,
        stocksPnl,
        stocksPnlPct,
        mfInvested,
        mfCurrent,
        mfPnl,
        mfPnlPct,
        equities,
        mutualFunds,
        indianVal,
        usVal,
        mfVal,
        goldVal,
        pctIndian,
        pctUS,
        pctMF,
        pctGold,
        money,
        isRefreshingPrices,
        priceRefreshMessage,
        handleRefreshPrices,
        unsavedAssetIds,
        isSavingPrices,
        handleSavePricesToDb,
        handleDiscardRefreshedPrices,
        flashAssetId,
        addAsset,
        updateAsset,
        deleteAsset,
        modal,
        setModal,
        editingAsset,
        setEditingAsset,
        deletingAsset,
        setDeletingAsset,
        dbModal,
        setDbModal,
        marketModal,
        setMarketModal,
        defaultCategory,
        setDefaultCategory,
        startEditing,
        prefillAsset,
        setPrefillAsset,
        openAddModalWithPrefill,
        userGender,
        setUserGender,
        currentUserId,
        isLoggingOut,
        handleLogout,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}

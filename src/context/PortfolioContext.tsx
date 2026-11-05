"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AssetPosition, AssetCategory, EditAssetForm, MarketTimingStatus, PrefillAssetData, AssetSaveNotification, OperationResult, ProcessingState } from "@/types/portfolio";
import { getIndianMarketStatus, getUsMarketStatus } from "@/lib/market-status";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { calculateSipCatchup, formatLocalDate } from "@/utils/sip";
import { getStockTicker } from "@/utils/tickers";

// Pre-cached high performance number formatters (zero C++ constructor allocations per render)
const inrIntFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrDecFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const usdIntFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdDecFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

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
  handleRefreshPrices: (silent?: boolean | unknown) => Promise<void>;
  unsavedAssetIds: Set<string>;
  isSavingPrices: boolean;
  handleSavePricesToDb: () => Promise<void>;
  handleDiscardRefreshedPrices: () => void;
  flashAssetId: string | null;
  addAsset: (item: {
    name: string;
    category: AssetCategory;
    quantity: number;
    investedAmount?: number;
    buyPrice: number;
    currentPrice: number;
    currency: "INR" | "USD";
    isSip?: boolean;
    sipAmount?: number;
    sipDay?: number;
    sipStartDate?: string;
    sipInstallments?: number;
    lastSipDate?: string;
    sipStatus?: "active" | "paused";
    brokerApp?: string;
  }) => Promise<void>;
  updateAsset: (updated: AssetPosition) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  totalMonthlySipINR: number;
  activeSipCount: number;
  sipNotice: string | null;
  clearSipNotice: () => void;
  assetSaveNotification: AssetSaveNotification | null;
  setAssetSaveNotification: (v: AssetSaveNotification | null) => void;
  operationResult: OperationResult | null;
  setOperationResult: (v: OperationResult | null) => void;
  closeOperationResult: () => void;
  processingState: ProcessingState | null;
  setProcessingState: (v: ProcessingState | null) => void;
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
  currentUserId: string;
  isLoggingOut: boolean;
  handleLogout: (reason?: string) => Promise<void>;
  viewingAsset: AssetPosition | null;
  setViewingAsset: (asset: AssetPosition | null) => void;
  openAssetDetail: (asset: AssetPosition) => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [assets, setAssets] = useState<AssetPosition[]>([]);
  const [unsavedAssetIds, setUnsavedAssetIds] = useState<Set<string>>(new Set());
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const dbBaselinePricesRef = useRef<Map<string, number>>(new Map());
  const recentAddsRef = useRef<Map<string, number>>(new Map());

  const [syncStatus, setSyncStatus] = useState<"live" | "connecting" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline"
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [priceRefreshMessage, setPriceRefreshMessage] = useState("");
  const [flashAssetId, setFlashAssetId] = useState<string | null>(null);
  const [sipNotice, setSipNotice] = useState<string | null>(null);
  const clearSipNotice = useCallback(() => setSipNotice(null), []);
  const [assetSaveNotification, setAssetSaveNotification] = useState<AssetSaveNotification | null>(null);
  const [operationResult, setOperationResult] = useState<OperationResult | null>(null);
  const closeOperationResult = useCallback(() => setOperationResult(null), []);
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);
  const assetNotificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sipCatchupExecutedRef = useRef<Set<string>>(new Set());

  const [modal, setModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EditAssetForm | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetPosition | null>(null);
  const [dbModal, setDbModal] = useState(false);
  const [marketModal, setMarketModal] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory>("Indian Equities");
  const [prefillAsset, setPrefillAsset] = useState<PrefillAssetData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
  const [transientAsset, setTransientAsset] = useState<AssetPosition | null>(null);

  const viewingAsset = useMemo(() => {
    if (transientAsset) {
      const matching = assets.find(
        (a) => a.id === transientAsset.id || a.name.toLowerCase() === transientAsset.name.toLowerCase()
      );
      return matching || transientAsset;
    }
    if (!viewingAssetId) return null;
    return assets.find((a) => a.id === viewingAssetId) || null;
  }, [viewingAssetId, transientAsset, assets]);

  const setViewingAsset = useCallback(
    (asset: AssetPosition | null) => {
      if (!asset) {
        setViewingAssetId(null);
        setTransientAsset(null);
      } else {
        const existing = assets.find(
          (a) => a.id === asset.id || a.name.toLowerCase() === asset.name.toLowerCase()
        );
        if (existing) {
          setViewingAssetId(existing.id);
          setTransientAsset(null);
        } else {
          setViewingAssetId(null);
          setTransientAsset(asset);
        }
      }
    },
    [assets]
  );

  const openAssetDetail = useCallback(
    (asset: AssetPosition) => {
      setViewingAsset(asset);
    },
    [setViewingAsset]
  );

  useEffect(() => {
    // 1. Immediately read cached identity and vision preference on client mount
    try {
      const savedUser = localStorage.getItem("mywealth_current_user");
      if (savedUser) {
        setCurrentUserId(savedUser);
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
            if (!localStorage.getItem("mywealth_last_activity")) {
              localStorage.setItem("mywealth_last_activity", String(Date.now()));
            }
          } catch {}
        } else if (data && !data.authenticated) {
          setCurrentUserId("");
          try {
            localStorage.removeItem("mywealth_current_user");
            localStorage.removeItem("mywealth_last_activity");
          } catch {}
          if (pathname && pathname !== "/login") {
            router.replace("/login");
          }
        }

      })
      .catch(() => {});
  }, []);



  // Body Scroll Lock: Prevent background page from scrolling while any modal is active
  const isAnyModalOpen = Boolean(
    modal || editingAsset || deletingAsset || dbModal || marketModal || viewingAsset
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isAnyModalOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      };
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [isAnyModalOpen]);

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
      const uid = currentUserId.trim();
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
        // Query scheme/assets table with username column
        let query = supabase!.from("assets").select("*").ilike("username", uid);
        let { data, error } = await query.order("created_at", { ascending: false });

        // Resilient fallback: Query via dedicated server API endpoint
        if ((error || !data || data.length === 0) && isMounted) {
          try {
            const apiRes = await fetch(`/api/assets?username=${encodeURIComponent(uid)}`);
            if (apiRes.ok) {
              const apiJson = await apiRes.json();
              if (apiJson.success && Array.isArray(apiJson.assets) && apiJson.assets.length > 0) {
                data = apiJson.assets;
                error = null;
              }
            }
          } catch {}
        }

        if (!error && data && isMounted) {
          const formatted: AssetPosition[] = data.map((row: any) => {
            const quantity = Number(row.quantity) || 0;
            const investedAmount = row.invested_amount !== undefined && row.invested_amount !== null
              ? Number(row.invested_amount)
              : (quantity * Number(row.buy_price || 0));
            const buyPrice = investedAmount > 0 && quantity > 0
              ? (investedAmount / quantity)
              : Number(row.buy_price || 0);

            return {
              id: String(row.id),
              username: row.username || row.user_id || uid,
              userId: row.username || row.user_id || uid,
              name: row.name,
              category: row.category as AssetCategory,
              quantity,
              investedAmount,
              buyPrice,
              currentPrice: Number(row.current_price !== undefined ? row.current_price : buyPrice),
              currency: row.currency as "INR" | "USD",
              date: row.created_at ? row.created_at.split("T")[0] : formatLocalDate(),
              isSip: Boolean(row.is_sip),
              sipAmount: row.sip_amount ? Number(row.sip_amount) : undefined,
              sipDay: row.sip_day ? Number(row.sip_day) : undefined,
              sipStartDate: row.sip_start_date || undefined,
              sipInstallments: row.sip_installments ? Number(row.sip_installments) : undefined,
              lastSipDate: row.last_sip_date || undefined,
              sipStatus: (row.sip_status as "active" | "paused") || (row.is_sip ? "active" : undefined),
              brokerApp: row.broker_app || undefined,
            };
          });

          // Merge local SIP metadata if Supabase schema columns are not yet provisioned
          try {
            const localCacheStr = localStorage.getItem(`mywealth_positions_${uid}`);
            if (localCacheStr) {
              const localCache: AssetPosition[] = JSON.parse(localCacheStr);
              const localMap = new Map(localCache.map((a) => [a.id, a]));
              formatted.forEach((pos) => {
                const loc = localMap.get(pos.id);
                if (loc?.isSip && !pos.isSip) {
                  pos.isSip = loc.isSip;
                  pos.sipAmount = loc.sipAmount;
                  pos.sipDay = loc.sipDay;
                  pos.sipStartDate = loc.sipStartDate;
                  pos.sipInstallments = loc.sipInstallments;
                  pos.lastSipDate = loc.lastSipDate;
                  pos.sipStatus = loc.sipStatus;
                }
                if (loc?.brokerApp && !pos.brokerApp) {
                  pos.brokerApp = loc.brokerApp;
                }
              });
            }
          } catch {}

          const deduped = dedupeAssets(formatted);
          deduped.forEach((item) => {
            dbBaselinePricesRef.current.set(item.id, item.currentPrice);
          });
          setAssets((prev) => {
            // Keep recent optimistic temporary items that haven't resolved yet
            const recentTemp = prev.filter(
              (a) => a.id.startsWith("temp-") && Date.now() - Number(a.id.replace("temp-", "")) < 20000
            );
            const combined = dedupeAssets([...recentTemp, ...deduped]);
            persistLocal(combined, uid);
            return combined;
          });
          setSyncStatus("live");
        } else if (error && (error.code === "42703" || error.message?.includes("username"))) {
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

          const quantity = Number(row.quantity) || 0;
          const investedAmount = row.invested_amount !== undefined && row.invested_amount !== null
            ? Number(row.invested_amount)
            : (quantity * Number(row.buy_price || 0));
          const buyPrice = investedAmount > 0 && quantity > 0
            ? (investedAmount / quantity)
            : Number(row.buy_price || 0);

          const newPos: AssetPosition = {
            id: String(row.id),
            username: row.username || row.user_id || uid,
            userId: row.username || row.user_id || uid,
            name: row.name,
            category: row.category as AssetCategory,
            quantity,
            investedAmount,
            buyPrice,
            currentPrice: Number(row.currentPrice !== undefined ? row.currentPrice : (row.current_price !== undefined ? row.current_price : buyPrice)),
            currency: row.currency as "INR" | "USD",
            date: row.created_at ? row.created_at.split("T")[0] : formatLocalDate(),
            isSip: Boolean(row.is_sip),
            sipAmount: row.sip_amount ? Number(row.sip_amount) : undefined,
            sipDay: row.sip_day ? Number(row.sip_day) : undefined,
            sipStartDate: row.sip_start_date || undefined,
            sipInstallments: row.sip_installments ? Number(row.sip_installments) : undefined,
            lastSipDate: row.last_sip_date || undefined,
            sipStatus: (row.sip_status as "active" | "paused") || (row.is_sip ? "active" : undefined),
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
            const next = prev.map((a) => {
              if (a.id !== updatedId) return a;
              const q = row.quantity !== undefined ? Number(row.quantity) : a.quantity;
              const inv = row.invested_amount !== undefined && row.invested_amount !== null
                ? Number(row.invested_amount)
                : (row.buy_price !== undefined ? q * Number(row.buy_price) : a.investedAmount);
              const bp = (inv !== undefined && q > 0)
                ? (inv / q)
                : (row.buy_price !== undefined ? Number(row.buy_price) : a.buyPrice);

              return {
                ...a,
                name: row.name ?? a.name,
                category: (row.category as AssetCategory) ?? a.category,
                quantity: q,
                investedAmount: inv,
                buyPrice: bp,
                currentPrice: row.current_price !== undefined ? Number(row.current_price) : a.currentPrice,
                currency: (row.currency as "INR" | "USD") ?? a.currency,
                isSip: row.is_sip !== undefined ? Boolean(row.is_sip) : a.isSip,
                sipAmount: row.sip_amount !== undefined ? (row.sip_amount ? Number(row.sip_amount) : undefined) : a.sipAmount,
                sipDay: row.sip_day !== undefined ? (row.sip_day ? Number(row.sip_day) : undefined) : a.sipDay,
                sipStartDate: row.sip_start_date !== undefined ? (row.sip_start_date || undefined) : a.sipStartDate,
                sipInstallments: row.sip_installments !== undefined ? (row.sip_installments ? Number(row.sip_installments) : undefined) : a.sipInstallments,
                lastSipDate: row.last_sip_date !== undefined ? (row.last_sip_date || undefined) : a.lastSipDate,
                sipStatus: (row.sip_status as "active" | "paused") ?? a.sipStatus,
              };
            });
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
      const cost = item.investedAmount !== undefined && item.investedAmount > 0
        ? item.investedAmount
        : item.quantity * item.buyPrice;
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
      (acc, a) => {
        const cost = a.investedAmount !== undefined && a.investedAmount > 0
          ? a.investedAmount
          : a.quantity * a.buyPrice;
        return acc + (a.currency === "USD" ? cost * usdInrRate : cost);
      },
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

  const mfInvested = useMemo(() => mutualFunds.reduce((acc, a) => {
    const cost = a.investedAmount !== undefined && a.investedAmount > 0
      ? a.investedAmount
      : a.quantity * a.buyPrice;
    return acc + (a.currency === "USD" ? cost * usdInrRate : cost);
  }, 0), [mutualFunds, usdInrRate]);
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

  const money = useCallback(
    (val: number, cur: "INR" | "USD" = "INR") => {
      if (!Number.isFinite(val)) return cur === "USD" ? "$0" : "₹0";
      const isInt = val % 1 === 0;
      if (cur === "USD") {
        if (showUsdInRupees) {
          const converted = val * usdInrRate;
          return (converted % 1 === 0 ? inrIntFormatter : inrDecFormatter).format(converted);
        }
        return (isInt ? usdIntFormatter : usdDecFormatter).format(val);
      }
      return (isInt ? inrIntFormatter : inrDecFormatter).format(val);
    },
    [showUsdInRupees, usdInrRate]
  );

  const totalMonthlySipINR = useMemo(() => {
    return assets
      .filter((a) => a.isSip && a.sipStatus !== "paused")
      .reduce((sum, item) => {
        const amt = item.sipAmount || 0;
        return sum + (item.currency === "USD" ? amt * usdInrRate : amt);
      }, 0);
  }, [assets, usdInrRate]);

  const activeSipCount = useMemo(() => {
    return assets.filter((a) => a.isSip && a.sipStatus !== "paused").length;
  }, [assets]);

  // Automated Monthly SIP Catch-Up & Auto-Execution Engine
  useEffect(() => {
    if (!assets || assets.length === 0) return;
    const uid = (
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).trim();

    const pendingCatches: Array<{
      asset: AssetPosition;
      catchup: NonNullable<ReturnType<typeof calculateSipCatchup>>;
    }> = [];

    assets.forEach((asset) => {
      if (!asset.isSip || asset.sipStatus === "paused") return;
      const key = `${asset.id}_${asset.lastSipDate || asset.sipStartDate}_${formatLocalDate()}`;
      if (sipCatchupExecutedRef.current.has(key)) return;

      const result = calculateSipCatchup(asset);
      if (result && result.dueCount > 0) {
        pendingCatches.push({ asset, catchup: result });
        sipCatchupExecutedRef.current.add(key);
      }
    });

    if (pendingCatches.length === 0) return;

    // Apply scheduled catchups to state & persistent store
    const updatedAssets = assets.map((a) => {
      const match = pendingCatches.find((p) => p.asset.id === a.id);
      if (match) {
        return {
          ...a,
          quantity: match.catchup.newQuantity,
          buyPrice: match.catchup.newBuyPrice,
          sipInstallments: match.catchup.newInstallments,
          lastSipDate: match.catchup.newLastSipDate,
        };
      }
      return a;
    });

    setAssets(dedupeAssets(updatedAssets));
    if (uid) persistLocal(updatedAssets, uid);

    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          await Promise.all(
            pendingCatches.map(async ({ asset, catchup }) => {
              const res = await supabase!
                .from("assets")
                .update({
                  quantity: catchup.newQuantity,
                  buy_price: catchup.newBuyPrice,
                  sip_installments: catchup.newInstallments,
                  last_sip_date: catchup.newLastSipDate,
                })
                .eq("id", asset.id);

              if (res.error && (res.error.code === "42703" || res.error.message?.includes("sip"))) {
                await supabase!
                  .from("assets")
                  .update({
                    quantity: catchup.newQuantity,
                    buy_price: catchup.newBuyPrice,
                    last_sip_date: catchup.newLastSipDate,
                  })
                  .eq("id", asset.id);
              }
            })
          );
        } catch (err) {
          console.error("Supabase SIP catchup error:", err);
        }
      })();
    }

    const summaries = pendingCatches.map(
      (p) => `${p.asset.name} · +${p.catchup.dueCount} installment${p.catchup.dueCount > 1 ? "s" : ""} added`
    );
    setSipNotice(summaries.join(", "));
    const timer = setTimeout(() => setSipNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [assets, currentUserId]);

  // Live price refresh (manual or automatic background sync)
  const handleRefreshPrices = async (silentParam?: boolean | unknown) => {
    const silent = typeof silentParam === "boolean" ? silentParam : false;
    if (assets.length === 0 || isRefreshingPrices) return;
    if (!silent) {
      setIsRefreshingPrices(true);
      setPriceRefreshMessage("Fetching latest market prices...");
    }

    try {
      const refreshedList = await Promise.all(
        assets.map(async (asset) => {
          let ticker = "";
          let marketType = "";

          if (asset.category === "US Stocks") {
            marketType = "US";
            ticker = getStockTicker(asset.name, "US Stocks");
          } else if (asset.category === "Indian Equities") {
            marketType = "INDIA";
            ticker = getStockTicker(asset.name, "Indian Equities");
          } else if (asset.category === "Mutual Funds") {
            ticker = asset.name;
          } else {
            ticker = getStockTicker(asset.name, asset.category);
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
      const uid = (currentUserId || (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") || "").trim();
      persistLocal(refreshedList, uid);

      // Persist refreshed prices directly to Supabase so DB is immediately updated
      if (isSupabaseConfigured && supabase && changedIds.size > 0) {
        const changedAssets = refreshedList.filter((a) => changedIds.has(a.id));
        await Promise.all(
          changedAssets.map((a) =>
            supabase!.from("assets").update({ current_price: a.currentPrice }).eq("id", a.id)
          )
        );
        changedAssets.forEach((a) => dbBaselinePricesRef.current.set(a.id, a.currentPrice));
        setUnsavedAssetIds(new Set());
      } else {
        setUnsavedAssetIds(changedIds);
      }

      if (!silent) {
        setPriceRefreshMessage(`Successfully synced ${changedIds.size} market valuations.`);
        setTimeout(() => setPriceRefreshMessage(""), 4000);
      }
    } catch {
      if (!silent) {
        setPriceRefreshMessage("Price refresh failed.");
        setTimeout(() => setPriceRefreshMessage(""), 4000);
      }
    } finally {
      if (!silent) {
        setIsRefreshingPrices(false);
      }
    }
  };

  // Automated background price sync: automatically fetches live prices on load and periodically every 60s
  const hasAutoSyncedInitialPricesRef = useRef(false);
  useEffect(() => {
    if (assets.length === 0 || !currentUserId) return;

    // 1. Initial automated price sync when assets are first loaded
    if (!hasAutoSyncedInitialPricesRef.current) {
      hasAutoSyncedInitialPricesRef.current = true;
      const initTimer = setTimeout(() => {
        handleRefreshPrices(true);
      }, 1000);
      return () => clearTimeout(initTimer);
    }

    // 2. Periodic background refresh every 60 seconds
    const intervalTimer = setInterval(() => {
      if (getIndianMarketStatus(new Date()).isOpen || getUsMarketStatus(new Date()).isOpen) { handleRefreshPrices(true); }
    }, 60 * 1000);

    // 3. Tab visibility / focus refresh
    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        if (getIndianMarketStatus(new Date()).isOpen || getUsMarketStatus(new Date()).isOpen) { handleRefreshPrices(true); }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    window.addEventListener("focus", handleVisibilityRefresh);

    return () => {
      clearInterval(intervalTimer);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      window.removeEventListener("focus", handleVisibilityRefresh);
    };
  }, [assets.length, currentUserId]);

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
    investedAmount?: number;
    buyPrice: number;
    currentPrice: number;
    currency: "INR" | "USD";
    isSip?: boolean;
    sipAmount?: number;
    sipDay?: number;
    sipStartDate?: string;
    sipInstallments?: number;
    lastSipDate?: string;
    sipStatus?: "active" | "paused";
    brokerApp?: string;
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

    // Duplicate submission guard: prevent rapid multi-click duplicates in DB
    const lockKey = `${uid}:${item.name.toLowerCase().trim()}:${item.category}`;
    const now = Date.now();
    const lastAdd = recentAddsRef.current.get(lockKey);
    if (lastAdd && now - lastAdd < 2500) {
      console.warn("Ignoring rapid duplicate asset submission for", item.name);
      return;
    }
    recentAddsRef.current.set(lockKey, now);

    if (assetNotificationTimerRef.current) {
      clearTimeout(assetNotificationTimerRef.current);
    }
    setAssetSaveNotification({
      status: "saving",
      name: item.name,
      message: `Adding ${item.name} to your portfolio…`,
    });

    const inv = item.investedAmount !== undefined && item.investedAmount > 0
      ? item.investedAmount
      : (item.quantity * item.buyPrice);
    const tempId = `temp-${Date.now()}`;
    const newPos: AssetPosition = {
      id: tempId,
      username: uid,
      userId: uid,
      ...item,
      investedAmount: inv,
      date: formatLocalDate(),
    };

    setAssets((prev) => {
      const next = dedupeAssets([newPos, ...prev]);
      persistLocal(next, uid);
      return next;
    });
    setFlashAssetId(tempId);
    setTimeout(() => setFlashAssetId(null), 2000);

    // 1. Primary path: Persist via secure, server-side /api/assets endpoint
    setProcessingState({
      active: true,
      title: "Recording Holding…",
      subtitle: `Adding ${item.name} to database`,
    });
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          investedAmount: inv,
          username: uid,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData?.success || !resData?.asset) {
        throw new Error(resData?.error || "Failed to save asset");
      }

      const realRow = resData.asset;
      const realId = String(realRow.id);
      dbBaselinePricesRef.current.set(realId, newPos.currentPrice);

      setAssets((prev) => {
        // If Realtime already received this item and added realId, remove tempId
        if (prev.some((a) => a.id === realId)) {
          const cleaned = prev.filter((a) => a.id !== tempId);
          persistLocal(cleaned, uid);
          return dedupeAssets(cleaned);
        }
        // Otherwise, replace tempId with realId and server-confirmed attributes
        const updated = prev.map((a) =>
          a.id === tempId
            ? {
                ...a,
                id: realId,
                username: realRow.username || uid,
                userId: realRow.username || uid,
                investedAmount: realRow.invested_amount !== undefined && realRow.invested_amount !== null ? Number(realRow.invested_amount) : inv,
                isSip: Boolean(realRow.is_sip !== undefined ? realRow.is_sip : a.isSip),
                sipAmount:
                  realRow.sip_amount !== undefined && realRow.sip_amount !== null
                    ? Number(realRow.sip_amount)
                    : a.sipAmount,
                sipDay:
                  realRow.sip_day !== undefined && realRow.sip_day !== null
                    ? Number(realRow.sip_day)
                    : a.sipDay,
                sipStartDate: realRow.sip_start_date || a.sipStartDate,
                sipInstallments:
                  realRow.sip_installments !== undefined && realRow.sip_installments !== null
                    ? Number(realRow.sip_installments)
                    : a.sipInstallments,
                lastSipDate: realRow.last_sip_date || a.lastSipDate,
                sipStatus: realRow.sip_status || a.sipStatus,
                brokerApp: realRow.broker_app || a.brokerApp,
              }
            : a
        );
        persistLocal(updated, uid);
        return dedupeAssets(updated);
      });
      setFlashAssetId(realId);
      setOperationResult({
        isOpen: true,
        type: "success",
        action: "add",
        title: "Asset Added Successfully!",
        message: `${item.name} has been recorded and synced with the database.`,
        assetName: item.name,
        details: {
          category: newPos.category,
          quantity: newPos.quantity,
          investedAmount: inv,
          buyPrice: newPos.buyPrice,
          currentPrice: newPos.currentPrice,
          currentValue: (newPos.quantity * newPos.currentPrice).toFixed(2),
          currency: newPos.currency,
          brokerApp: newPos.brokerApp,
          isSip: newPos.isSip,
          sipAmount: newPos.sipAmount,
        },
      });
      setAssetSaveNotification(null);
    } catch (err: any) {
      console.warn("[addAsset] API call failed, attempting direct Supabase fallback:", err);

      // 2. Secondary fallback: Direct Supabase insert
      let directSaved = false;
      if (isSupabaseConfigured && supabase) {
        try {
          const sipFields = item.isSip
            ? {
                is_sip: true,
                sip_amount: item.sipAmount,
                sip_day: item.sipDay,
                sip_start_date: item.sipStartDate,
                sip_installments: item.sipInstallments || 1,
                last_sip_date: item.lastSipDate,
                sip_status: item.sipStatus || "active",
              }
            : {};

          let insertRes = await supabase
            .from("assets")
            .insert([
              {
                name: newPos.name,
                category: newPos.category,
                quantity: newPos.quantity,
                invested_amount: inv,
                buy_price: newPos.buyPrice,
                current_price: newPos.currentPrice,
                currency: newPos.currency,
                username: uid,
                broker_app: newPos.brokerApp || null,
                ...sipFields,
              },
            ])
            .select();

          if (insertRes.error && (insertRes.error.code === "42703" || insertRes.error.message?.includes("invested") || insertRes.error.message?.includes("broker") || insertRes.error.message?.includes("sip"))) {
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
                  username: uid,
                },
              ])
              .select();
          }

          if (!insertRes.error && insertRes.data && insertRes.data[0]) {
            const realId = String(insertRes.data[0].id);
            dbBaselinePricesRef.current.set(realId, newPos.currentPrice);
            setAssets((prev) => {
              const updated = prev.map((a) => (a.id === tempId ? { ...a, id: realId } : a));
              persistLocal(updated, uid);
              return dedupeAssets(updated);
            });
            directSaved = true;
          }
        } catch (directErr) {
          console.error("Direct Supabase fallback failed:", directErr);
        }
      }

      setAssetSaveNotification(null);
      if (directSaved) {
        setOperationResult({
          isOpen: true,
          type: "success",
          action: "add",
          title: "Asset Added Successfully!",
          message: `${item.name} has been recorded and synced with the database.`,
          assetName: item.name,
          details: {
            category: newPos.category,
            quantity: newPos.quantity,
            buyPrice: newPos.buyPrice,
            currentPrice: newPos.currentPrice,
            currentValue: (newPos.quantity * newPos.currentPrice).toFixed(2),
            currency: newPos.currency,
            brokerApp: newPos.brokerApp,
            isSip: newPos.isSip,
            sipAmount: newPos.sipAmount,
          },
        });
      } else {
        // Revert optimistic item so UI matches DB
        setAssets((prev) => {
          const reverted = prev.filter((a) => a.id !== tempId);
          persistLocal(reverted, uid);
          return dedupeAssets(reverted);
        });
        setOperationResult({
          isOpen: true,
          type: "error",
          action: "add",
          title: "Failed to Add Asset",
          message: `Unable to save ${item.name} to database: ${err?.message || "Connection error"}`,
          assetName: item.name,
        });
      }
    } finally {
      setProcessingState(null);
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

    if (!updated.id.startsWith("temp-")) {
      setProcessingState({
        active: true,
        title: "Updating Holding…",
        subtitle: `Saving changes for ${updated.name}`,
      });
      try {
        const res = await fetch("/api/assets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        const resData = await res.json().catch(() => ({}));

        if (!res.ok || !resData?.success) {
          throw new Error(resData?.error || "Failed to update asset in database");
        }

        const inv = updated.investedAmount !== undefined && updated.investedAmount > 0
          ? updated.investedAmount
          : (updated.quantity * updated.buyPrice);

        setOperationResult({
          isOpen: true,
          type: "success",
          action: "update",
          title: "Holding Updated Successfully!",
          message: `${updated.name} has been updated and synced with database.`,
          assetName: updated.name,
          details: {
            category: updated.category,
            quantity: updated.quantity,
            investedAmount: inv,
            buyPrice: updated.buyPrice,
            currentPrice: updated.currentPrice,
            currentValue: (updated.quantity * updated.currentPrice).toFixed(2),
            currency: updated.currency,
            brokerApp: updated.brokerApp,
            isSip: updated.isSip,
            sipAmount: updated.sipAmount,
          },
        });
      } catch (err: any) {
        console.error("Asset update error:", err);
        let directSaved = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const inv = updated.investedAmount !== undefined && updated.investedAmount > 0
              ? updated.investedAmount
              : (updated.quantity * updated.buyPrice);

            const sipRow = updated.isSip
              ? {
                  is_sip: true,
                  sip_amount: updated.sipAmount,
                  sip_day: updated.sipDay,
                  sip_start_date: updated.sipStartDate,
                  sip_installments: updated.sipInstallments,
                  last_sip_date: updated.lastSipDate,
                  sip_status: updated.sipStatus || "active",
                }
              : { is_sip: false };

            let sbRes = await supabase
              .from("assets")
              .update({
                name: updated.name,
                category: updated.category,
                quantity: updated.quantity,
                invested_amount: inv,
                buy_price: updated.buyPrice,
                current_price: updated.currentPrice,
                currency: updated.currency,
                broker_app: updated.brokerApp || null,
                ...sipRow,
              })
              .eq("id", updated.id);

            if (sbRes.error && (sbRes.error.code === "42703" || sbRes.error.message?.includes("invested") || sbRes.error.message?.includes("broker_app"))) {
              sbRes = await supabase
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
            }

            if (!sbRes.error) {
              directSaved = true;
            }
          } catch (sbErr) {
            console.error("Direct Supabase update error:", sbErr);
          }
        }

        setAssetSaveNotification(null);
      if (directSaved) {
          const inv = updated.investedAmount !== undefined && updated.investedAmount > 0
            ? updated.investedAmount
            : (updated.quantity * updated.buyPrice);

          setOperationResult({
            isOpen: true,
            type: "success",
            action: "update",
            title: "Holding Updated Successfully!",
            message: `${updated.name} has been updated and synced with database.`,
            assetName: updated.name,
            details: {
              category: updated.category,
              quantity: updated.quantity,
              investedAmount: inv,
              buyPrice: updated.buyPrice,
              currentPrice: updated.currentPrice,
              currentValue: (updated.quantity * updated.currentPrice).toFixed(2),
              currency: updated.currency,
              brokerApp: updated.brokerApp,
              isSip: updated.isSip,
              sipAmount: updated.sipAmount,
            },
          });
        } else {
          setOperationResult({
            isOpen: true,
            type: "error",
            action: "update",
            title: "Failed to Update Holding",
            message: `Could not save updates for ${updated.name}: ${err?.message || "Database connection error"}`,
            assetName: updated.name,
          });
        }
      } finally {
        setProcessingState(null);
      }
    }
  };

  const deleteAsset = async (id: string) => {
    const uid = (
      currentUserId ||
      (typeof window !== "undefined" ? localStorage.getItem("mywealth_current_user") : "") ||
      ""
    ).trim();

    const targetAsset = assets.find((a) => a.id === id);
    const deletedName = targetAsset?.name || "Holding";

    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (uid) persistLocal(next, uid);
      return next;
    });
    dbBaselinePricesRef.current.delete(id);

    if (!id.startsWith("temp-")) {
      setProcessingState({
        active: true,
        title: "Removing Holding…",
        subtitle: `Deleting ${deletedName} from database`,
      });
      try {
        const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok || !resData?.success) {
          throw new Error(resData?.error || "Failed to delete holding");
        }

        setOperationResult({
          isOpen: true,
          type: "success",
          action: "delete",
          title: "Asset Removed",
          message: `${deletedName} was permanently removed from your portfolio and database.`,
          assetName: deletedName,
        });
      } catch (err: any) {
        console.error("Asset delete error:", err);
        let directDeleted = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const delRes = await supabase.from("assets").delete().eq("id", id);
            if (!delRes.error) {
              directDeleted = true;
            }
          } catch {}
        }

        if (directDeleted) {
          setOperationResult({
            isOpen: true,
            type: "success",
            action: "delete",
            title: "Asset Removed",
            message: `${deletedName} was permanently removed from your portfolio and database.`,
            assetName: deletedName,
          });
        } else {
          setOperationResult({
            isOpen: true,
            type: "error",
            action: "delete",
            title: "Failed to Delete Asset",
            message: `Could not delete ${deletedName} from database: ${err?.message || "Connection error"}`,
            assetName: deletedName,
          });
        }
      } finally {
        setProcessingState(null);
      }
    }
  };

  const startEditing = (asset: AssetPosition) => {
    const inv = asset.investedAmount !== undefined && asset.investedAmount > 0
      ? asset.investedAmount
      : (asset.quantity * asset.buyPrice);

    setEditingAsset({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      quantity: asset.quantity ? asset.quantity.toString() : "",
      investedAmount: inv.toFixed(2),
      buyPrice: asset.buyPrice.toString(),
      currentPrice: asset.currentPrice.toString(),
      currentValue: (asset.quantity * asset.currentPrice).toFixed(2),
      currency: asset.currency,
      isSip: asset.isSip,
      sipAmount: asset.sipAmount ? asset.sipAmount.toString() : "",
      sipDay: asset.sipDay ? asset.sipDay.toString() : "5",
      sipStartDate: asset.sipStartDate,
      sipInstallments: asset.sipInstallments ? asset.sipInstallments.toString() : undefined,
      lastSipDate: asset.lastSipDate,
      sipStatus: asset.sipStatus,
      brokerApp: asset.brokerApp || "",
    });
  };

  const handleLogout = async (reason?: string) => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Wipe React in-memory states immediately
      setAssets([]);
      setUnsavedAssetIds(new Set());
      dbBaselinePricesRef.current.clear();
      setCurrentUserId("");
      setShowUsdInRupees(false);
      setViewingAssetId(null);
      setTransientAsset(null);

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
          "mywealth_last_activity",
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

      // 5. Expire client cookies explicitly
      try {
        if (typeof document !== "undefined") {
          document.cookie = "mywealth_auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax";
        }
      } catch {}

      // 6. Expire server session cookie via POST with timeout guarantee
      try {
        await Promise.race([
          fetch("/api/auth/logout", { method: "POST" }),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ]);
      } catch {}

      // 7. Hard document navigation to /login (wipes in-memory JS state, caches & listeners)
      const targetUrl = typeof reason === "string" && reason ? `/login?reason=${encodeURIComponent(reason)}` : "/login";
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      } else {
        router.replace(targetUrl);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const safeAssets = useMemo(() => dedupeAssets(assets), [assets]);

  const contextValue = useMemo(
    () => ({
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
      currentUserId,
      isLoggingOut,
      handleLogout,
      totalMonthlySipINR,
      activeSipCount,
      sipNotice,
      clearSipNotice,
      assetSaveNotification,
      setAssetSaveNotification,
      operationResult,
      setOperationResult,
      closeOperationResult,
      processingState,
      setProcessingState,
      viewingAsset,
      setViewingAsset,
      openAssetDetail,
    }),
    [
      safeAssets,
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
      unsavedAssetIds,
      isSavingPrices,
      flashAssetId,
      modal,
      editingAsset,
      deletingAsset,
      dbModal,
      marketModal,
      defaultCategory,
      prefillAsset,
      currentUserId,
      isLoggingOut,
      totalMonthlySipINR,
      activeSipCount,
      sipNotice,
      assetSaveNotification,
      operationResult,
      processingState,
      viewingAsset,
      setViewingAsset,
      openAssetDetail,
    ]
  );

  return (
    <PortfolioContext.Provider value={contextValue}>
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

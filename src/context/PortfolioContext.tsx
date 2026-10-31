"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { AssetPosition, AssetCategory, EditAssetForm, MarketTimingStatus, PrefillAssetData } from "@/types/portfolio";
import { getIndianMarketStatus, getUsMarketStatus } from "@/lib/market-status";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_SAMPLE_ASSETS: AssetPosition[] = [
  {
    id: "sample-sbi-mf",
    name: "SBI Focused Fund",
    category: "Mutual Funds",
    quantity: 206.624,
    buyPrice: 424.34,
    currentPrice: 437.31,
    currency: "INR",
    date: "2024-01-15",
  },
  {
    id: "sample-jio-stock",
    name: "Jio Platforms Ltd",
    category: "Indian Equities",
    quantity: 3,
    buyPrice: 1371.60,
    currentPrice: 1431.30,
    currency: "INR",
    date: "2024-02-10",
  },
  {
    id: "sample-apple-stock",
    name: "Apple",
    category: "US Stocks",
    quantity: 0.3245,
    buyPrice: 296.00,
    currentPrice: 344.63,
    currency: "USD",
    date: "2024-03-01",
  },
];

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
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<AssetPosition[]>(DEFAULT_SAMPLE_ASSETS);
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

  // Currency view toggle
  const [showUsdInRupees, setShowUsdInRupees] = useState<boolean>(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mywealth_show_usd_in_rupees");
      if (saved !== null) setShowUsdInRupees(saved === "true");
    } catch {}
  }, []);

  const toggleUsdInRupees = () => {
    setShowUsdInRupees((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mywealth_show_usd_in_rupees", String(next));
      } catch {}
      return next;
    });
  };

  // Local storage cache for offline / fallback
  useEffect(() => {
    try {
      const local = localStorage.getItem("mywealth_positions");
      if (local && !isSupabaseConfigured) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(parsed);
        }
      }
    } catch {}
  }, []);

  // Supabase Realtime Sync
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
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssets();

    const channel = supabase
      .channel("mywealth-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, (payload) => {
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
          setAssets((prev) =>
            prev.map((a) =>
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
            )
          );
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
      supabase?.removeChannel(channel);
    };
  }, []);

  // Save to localStorage whenever assets change (offline support)
  const persistLocal = (newAssets: AssetPosition[]) => {
    try {
      localStorage.setItem("mywealth_positions", JSON.stringify(newAssets));
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
            if (lower.includes("reliance")) ticker = "RELIANCE";
            else if (lower.includes("jio")) ticker = "RELIANCE";
            else if (lower.includes("tata motors")) ticker = "TATAMOTORS";
            else if (lower.includes("tcs") || lower.includes("tata consultancy")) ticker = "TCS";
            else if (lower.includes("hdfc")) ticker = "HDFCBANK";
            else if (lower.includes("sbi") || lower.includes("state bank")) ticker = "SBIN";
            else if (lower.includes("infosys")) ticker = "INFY";
            else ticker = asset.name.toUpperCase();
          }

          if (!ticker) return asset;

          try {
            const res = await fetch(`/api/stock-price?symbol=${encodeURIComponent(ticker)}&market=${marketType}`);
            const data = await res.json();
            if (data.price && typeof data.price === "number") {
              return { ...asset, currentPrice: Number(data.price.toFixed(2)) };
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
    const tempId = `temp-${Date.now()}`;
    const newPos: AssetPosition = {
      id: tempId,
      ...item,
      date: new Date().toISOString().split("T")[0],
    };

    const next = [newPos, ...assets];
    setAssets(next);
    persistLocal(next);
    setFlashAssetId(tempId);
    setTimeout(() => setFlashAssetId(null), 2000);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("assets")
          .insert([
            {
              name: newPos.name,
              category: newPos.category,
              quantity: newPos.quantity,
              buy_price: newPos.buyPrice,
              current_price: newPos.currentPrice,
              currency: newPos.currency,
            },
          ])
          .select();
        if (!error && data && data[0]) {
          const realId = String(data[0].id);
          dbBaselinePricesRef.current.set(realId, newPos.currentPrice);
          setAssets((prev) => prev.map((a) => (a.id === tempId ? { ...a, id: realId } : a)));
        }
      } catch (err) {
        console.error("Supabase insert error:", err);
      }
    }
  };

  const updateAsset = async (updated: AssetPosition) => {
    const next = assets.map((a) => (a.id === updated.id ? updated : a));
    setAssets(next);
    persistLocal(next);
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
    const next = assets.filter((a) => a.id !== id);
    setAssets(next);
    persistLocal(next);
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

  return (
    <PortfolioContext.Provider
      value={{
        assets,
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

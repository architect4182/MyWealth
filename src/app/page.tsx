"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
  Plus,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  X,
  Trash2,
  Pencil,
  Database,
  Radio,
  ExternalLink,
  Copy,
  Check,
  User,
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
  quantity: string;
  buyPrice: string;
  currentPrice: string;
  currency: "INR" | "USD";
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [modal, setModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EditAssetForm | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetPosition | null>(null);
  const [flashAssetId, setFlashAssetId] = useState<string | null>(null);
  const [dbModal, setDbModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [assets, setAssets] = useState<AssetPosition[]>([]);
  const [syncStatus, setSyncStatus] = useState<"live" | "connecting" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline"
  );

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
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Add Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("Indian Equities");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  // Supabase PostgreSQL Realtime Sync Effect (Insert, Update, Delete)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("offline");
      return;
    }

    let isMounted = true;

    // 1. Initial Fetch from PostgreSQL
    async function loadAssets() {
      setSyncStatus("connecting");
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
          setAssets(formatted);
          setSyncStatus("live");
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        if (isMounted) setSyncStatus("offline");
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
              setAssets((prev) => prev.filter((a) => a.id !== oldId));
            }
          } else if (payload.eventType === "UPDATE") {
            const row: any = payload.new;
            const updatedId = String(row.id);
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
                      buyPrice: Number(row.buy_price),
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

  // Open Edit Asset Modal with pre-filled string values
  function startEditing(asset: AssetPosition) {
    setEditingAsset({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      quantity: String(asset.quantity),
      buyPrice: String(asset.buyPrice),
      currentPrice: String(asset.currentPrice),
      currency: asset.currency,
    });
  }

  // Real-time Insert Asset
  async function handleAddAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = Number(quantity);
    const bp = Number(buyPrice);
    const cp = currentPrice ? Number(currentPrice) : bp;

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
    setQuantity("");
    setBuyPrice("");
    setCurrentPrice("");
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

  // Real-time Update Asset (Edit)
  async function handleUpdateAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAsset) return;

    const q = Number(editingAsset.quantity) || 0;
    const bp = Number(editingAsset.buyPrice) || 0;
    const cp = editingAsset.currentPrice ? Number(editingAsset.currentPrice) : bp;

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
          {/* PostgreSQL Realtime Sync Status Badge */}
          {syncStatus === "live" ? (
            <span
              className="market-status"
              style={{
                borderColor: "rgba(16, 185, 129, 0.35)",
                background: "rgba(16, 185, 129, 0.08)",
                color: "#10b981",
                fontWeight: 700,
              }}
            >
              <Radio size={14} className="animate-pulse" style={{ color: "#10b981" }} />
              Postgres Realtime Live
            </span>
          ) : syncStatus === "connecting" ? (
            <span className="market-status">
              <span className="status-dot" /> Connecting Postgres...
            </span>
          ) : (
            <button
              onClick={() => setDbModal(true)}
              className="market-status"
              style={{
                cursor: "pointer",
                borderColor: "rgba(239, 68, 68, 0.35)",
                background: "rgba(239, 68, 68, 0.08)",
                color: "var(--foreground)",
              }}
              title="Click to view Postgres connection setup"
            >
              <Database size={13} style={{ color: "var(--red)" }} />
              <span>Connect Postgres</span>
            </button>
          )}

          <button className="icon-button" title="Notifications">
            <Bell size={18} />
          </button>

          <div className="profile-avatar" title="Account profile">
            <User size={15} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="main-area">
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
          </div>

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

              {/* YOUR ASSETS TABLE (Directly below metric cards) */}
              <div className="panel holdings-panel" style={{ marginTop: "12px" }}>
                <div className="panel-heading">
                  <div>
                    <h3>Your assets</h3>
                    <p>Live synchronized positions • Edit or delete anywhere</p>
                  </div>
                </div>

                {assets.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Search size={22} />
                    </div>
                    <strong>No assets tracked yet</strong>
                    <p>Add your first position to begin tracking your portfolio in real time.</p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button className="primary-button" onClick={() => setModal(true)}>
                        <Plus size={15} /> Add first asset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Asset Name</th>
                          <th>Category</th>
                          <th>Holdings</th>
                          <th>Avg Buy Price</th>
                          <th>Current Price</th>
                          <th>Invested Capital</th>
                          <th>Current Value</th>
                          <th>Returns (P&L)</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((item) => {
                          const invested = item.quantity * item.buyPrice;
                          const current = item.quantity * item.currentPrice;
                          const pnl = current - invested;
                          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                          const isProfit = pnl >= 0;

                          return (
                            <tr key={item.id} className={flashAssetId === item.id ? "row-flash" : undefined}>
                              <td>
                                <strong>{item.name}</strong>
                              </td>
                              <td>
                                <span className="category-pill">{item.category}</span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                              <td>{money(item.buyPrice, item.currency)}</td>
                              <td>
                                <strong style={{ color: "#ffffff" }}>
                                  {money(item.currentPrice, item.currency)}
                                </strong>
                              </td>
                              <td>{money(invested, item.currency)}</td>
                              <td>
                                <strong style={{ color: "#ffffff" }}>
                                  {money(current, item.currency)}
                                </strong>
                              </td>
                              <td>
                                <span className={isProfit ? "pnl-badge-positive" : "pnl-badge-negative"}>
                                  {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)} ({isProfit ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                  {/* Real-time Edit Button */}
                                  <button
                                    className="action-icon-btn"
                                    title="Edit position"
                                    onClick={() => startEditing(item)}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  {/* Real-time Delete Button */}
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
                <p className="data-disclaimer">
                  *All edits and deletions automatically sync across browser tabs and PostgreSQL in real time.
                </p>
              </div>

              {/* MINIMIZED ASSET ALLOCATION */}
              {assets.length > 0 && (
                <div className="panel" style={{ padding: "12px 18px", marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>Asset Allocation</h3>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>• {assets.length} Holdings</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: 600, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground-muted)" }}>
                        <i style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ef4444", display: "inline-block" }} />
                        Indian Equities ({pctIndian}%)
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground-muted)" }}>
                        <i style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#b91c1c", display: "inline-block" }} />
                        US Stocks ({pctUS}%)
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground-muted)" }}>
                        <i style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#10b981", display: "inline-block" }} />
                        Mutual Funds ({pctMF}%)
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground-muted)" }}>
                        <i style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f59e0b", display: "inline-block" }} />
                        Gold & Fixed ({pctGold}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.06)", gap: "2px" }}>
                    {pctIndian > 0 && <div style={{ width: `${pctIndian}%`, background: "#ef4444", borderRadius: "2px" }} title={`Indian Equities: ${pctIndian}%`} />}
                    {pctUS > 0 && <div style={{ width: `${pctUS}%`, background: "#b91c1c", borderRadius: "2px" }} title={`US Stocks: ${pctUS}%`} />}
                    {pctMF > 0 && <div style={{ width: `${pctMF}%`, background: "#10b981", borderRadius: "2px" }} title={`Mutual Funds: ${pctMF}%`} />}
                    {pctGold > 0 && <div style={{ width: `${pctGold}%`, background: "#f59e0b", borderRadius: "2px" }} title={`Gold & Fixed: ${pctGold}%`} />}
                  </div>
                </div>
              )}
            </>
          )}

          {/* EQUITIES TAB */}
          {active === "Equities" && (
            <div className="panel holdings-panel">
              <div className="panel-heading">
                <div>
                  <h3>Direct Equities Portfolio</h3>
                  <p>Indian and US stocks held directly</p>
                </div>
              </div>

              {equities.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ChartNoAxesCombined size={22} />
                  </div>
                  <strong>No equity holdings recorded.</strong>
                  <p>Click the + button in the dock to add Indian stocks or US stocks.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Stock Name</th>
                        <th>Category</th>
                        <th>Shares</th>
                        <th>Avg Buy Price</th>
                        <th>Current Price</th>
                        <th>Invested</th>
                        <th>Current Value</th>
                        <th>P&L</th>
                        <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equities.map((item) => {
                        const invested = item.quantity * item.buyPrice;
                        const current = item.quantity * item.currentPrice;
                        const pnl = current - invested;
                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                        const isProfit = pnl >= 0;

                        return (
                          <tr key={item.id} className={flashAssetId === item.id ? "row-flash" : undefined}>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>
                              <span className="category-pill">{item.category}</span>
                            </td>
                            <td>{item.quantity}</td>
                            <td>{money(item.buyPrice, item.currency)}</td>
                            <td>
                              <strong>{money(item.currentPrice, item.currency)}</strong>
                            </td>
                            <td>{money(invested, item.currency)}</td>
                            <td>
                              <strong>{money(current, item.currency)}</strong>
                            </td>
                            <td>
                              <span className={isProfit ? "pnl-badge-positive" : "pnl-badge-negative"}>
                                {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)} ({isProfit ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
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

              {mutualFunds.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Wallet size={22} />
                  </div>
                  <strong>No mutual funds recorded.</strong>
                  <p>Click the + button in the dock to record mutual funds.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Fund Scheme</th>
                        <th>Units</th>
                        <th>Avg NAV</th>
                        <th>Current NAV</th>
                        <th>Total Invested</th>
                        <th>Current Value</th>
                        <th>Returns</th>
                        <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mutualFunds.map((item) => {
                        const invested = item.quantity * item.buyPrice;
                        const current = item.quantity * item.currentPrice;
                        const pnl = current - invested;
                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                        const isProfit = pnl >= 0;

                        return (
                          <tr key={item.id} className={flashAssetId === item.id ? "row-flash" : undefined}>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>{item.quantity}</td>
                            <td>{money(item.buyPrice, item.currency)}</td>
                            <td>
                              <strong style={{ color: "#ffffff" }}>
                                {money(item.currentPrice, item.currency)}
                              </strong>
                            </td>
                            <td>{money(invested, item.currency)}</td>
                            <td>
                              <strong style={{ color: "#ffffff" }}>
                                {money(current, item.currency)}
                              </strong>
                            </td>
                            <td>
                              <span className={isProfit ? "pnl-badge-positive" : "pnl-badge-negative"}>
                                {isProfit ? `+${money(pnl, item.currency)}` : money(pnl, item.currency)} ({isProfit ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
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

      {/* Clean Floating Bottom Dock */}
      <div className="dock-wrapper">
        <nav className="dock" role="navigation" aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => {
            const isActive = active === name;
            return (
              <button
                key={name}
                onClick={() => setActive(name)}
                className={`dock-item ${isActive ? "active" : ""}`}
                aria-label={name}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="dock-icon-box">
                  <Icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />
                </div>
                <span className="dock-tooltip">{name}</span>
                {isActive && <span className="dock-indicator" />}
              </button>
            );
          })}

          <div className="dock-separator" />

          <button
            onClick={() => setModal(true)}
            className="dock-item dock-add-btn"
            aria-label="Add Asset"
            title="Add Asset"
          >
            <div className="dock-icon-box add-icon">
              <Plus size={19} strokeWidth={2.5} />
            </div>
            <span className="dock-tooltip">Add Asset</span>
          </button>
        </nav>
      </div>

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

            <label>
              Asset Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tata Motors, Parag Parikh Flexi Cap, Sovereign Gold Bond"
              />
            </label>

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
                Quantity / Units
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 15"
                />
              </label>

              <label>
                Average Buy Price
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="e.g. 2400"
                />
              </label>
            </div>

            <label>
              Current Market Price (Optional — defaults to buy price)
              <input
                type="number"
                min="0.000001"
                step="any"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="e.g. 2650"
              />
            </label>

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
                <p>Modify holding details. Changes save to PostgreSQL live.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setEditingAsset(null)}>
                <X size={18} />
              </button>
            </div>

            <label>
              Asset Name
              <input
                required
                value={editingAsset.name}
                onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
              />
            </label>

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
                Quantity / Units
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={editingAsset.quantity}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, quantity: e.target.value })
                  }
                />
              </label>

              <label>
                Average Buy Price
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={editingAsset.buyPrice}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, buyPrice: e.target.value })
                  }
                />
              </label>
            </div>

            <label>
              Current Market Price
              <input
                required
                type="number"
                min="0.000001"
                step="any"
                value={editingAsset.currentPrice}
                onChange={(e) =>
                  setEditingAsset({ ...editingAsset, currentPrice: e.target.value })
                }
              />
            </label>

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

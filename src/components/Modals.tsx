"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Database,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { AssetCategory } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import { MarketTimingBadge } from "@/components/MarketBadge";

export function AddAssetModal() {
  const {
    modal,
    setModal,
    defaultCategory,
    addAsset,
    prefillAsset,
    setPrefillAsset,
  } = usePortfolio();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>(defaultCategory);
  const [investedAmount, setInvestedAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">(
    defaultCategory === "US Stocks" ? "USD" : "INR"
  );
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const autoPriceRequestRef = useRef(0);
  const skipNextAutoPriceLookupRef = useRef(false);

  useEffect(() => {
    if (modal) {
      if (prefillAsset) {
        setName(prefillAsset.name);
        setCategory(prefillAsset.category);
        setBuyPrice(String(prefillAsset.price));
        setCurrentPrice(String(prefillAsset.price));
        setCurrency(prefillAsset.currency);
      } else {
        setCategory(defaultCategory);
        setCurrency(defaultCategory === "US Stocks" ? "USD" : "INR");
      }
    } else {
      setName("");
      setInvestedAmount("");
      setBuyPrice("");
      setCurrentPrice("");
      setCurrentValue("");
      setPrefillAsset(null);
    }
  }, [modal, defaultCategory, prefillAsset, setPrefillAsset]);

  const computedAddHoldings =
    Number(currentValue) > 0 && Number(currentPrice) > 0
      ? Number(currentValue) / Number(currentPrice)
      : Number(investedAmount) > 0 && Number(buyPrice) > 0
      ? Number(investedAmount) / Number(buyPrice)
      : 0;

  async function handleFetchLivePrice(
    stockQuery: string,
    cat: AssetCategory,
    autoRequestId?: number
  ) {
    if (!stockQuery.trim()) return;
    setIsFetchingPrice(true);
    try {
      const res = await fetch(
        `/api/stock-price?query=${encodeURIComponent(
          stockQuery.trim()
        )}&category=${encodeURIComponent(cat)}`
      );
      const data = await res.json();
      if (
        autoRequestId !== undefined &&
        autoRequestId !== autoPriceRequestRef.current
      )
        return;
      if (data.success && data.price) {
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
      }
    } catch (err) {
      console.error("Live price lookup error:", err);
    } finally {
      if (
        autoRequestId === undefined ||
        autoRequestId === autoPriceRequestRef.current
      ) {
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
      void handleFetchLivePriceRef.current(query, category, requestId);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [modal, name, category]);

  if (!modal) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    await addAsset({
      name: name.trim(),
      category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency,
    });

    setModal(false);
  }

  return (
    <div className="modal-overlay" onClick={() => setModal(false)}>
      <form
        className="investment-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-heading">
          <div>
            <h2>Add investment</h2>
            <p>Record a new asset into PostgreSQL in real time.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--foreground-muted)",
              }}
            >
              Asset / Stock Name
            </span>
            <span className="fetch-price-status">
              <Sparkles size={11} />
              {isFetchingPrice
                ? "Looking up price…"
                : name.trim().length >= 3
                ? "Auto price lookup"
                : "Price fills automatically"}
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
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
            >
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
            <Sparkles
              size={14}
              style={{ color: "var(--apple-blue)", flexShrink: 0 }}
            />
            <span>
              Calculated Holdings:{" "}
              <strong>
                {computedAddHoldings.toFixed(
                  computedAddHoldings % 1 === 0 ? 0 : 4
                )}{" "}
                units
              </strong>
              <span
                style={{ opacity: 0.75, marginLeft: "6px", fontSize: "11px" }}
              >
                ({currency === "USD" ? "$" : "₹"}
                {Number(investedAmount).toLocaleString()} invested ÷{" "}
                {currency === "USD" ? "$" : "₹"}
                {Number(buyPrice).toLocaleString()}/unit)
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
              placeholder={
                computedAddHoldings > 0
                  ? (computedAddHoldings * (Number(buyPrice) || 1)).toFixed(2)
                  : "e.g. 50000"
              }
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
          <button
            type="button"
            className="secondary-button"
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save Asset
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditAssetModal() {
  const { editingAsset, setEditingAsset, updateAsset } = usePortfolio();
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  if (!editingAsset) return null;

  const computedEditHoldings =
    Number(editingAsset.currentValue) > 0 && Number(editingAsset.currentPrice) > 0
      ? Number(editingAsset.currentValue) / Number(editingAsset.currentPrice)
      : Number(editingAsset.investedAmount) > 0 &&
        Number(editingAsset.buyPrice) > 0
      ? Number(editingAsset.investedAmount) / Number(editingAsset.buyPrice)
      : 0;

  async function handleRefreshQuote() {
    if (!editingAsset?.name.trim()) return;
    setIsFetchingPrice(true);
    try {
      const res = await fetch(
        `/api/stock-price?query=${encodeURIComponent(
          editingAsset.name.trim()
        )}&category=${encodeURIComponent(editingAsset.category)}`
      );
      const data = await res.json();
      if (data.success && data.price) {
        const newCp = String(data.price);
        const holdings =
          Number(editingAsset.investedAmount) > 0 &&
          Number(editingAsset.buyPrice) > 0
            ? Number(editingAsset.investedAmount) /
              Number(editingAsset.buyPrice)
            : 0;
        setEditingAsset({
          ...editingAsset,
          currentPrice: newCp,
          currentValue:
            holdings > 0
              ? (data.price * holdings).toFixed(2)
              : editingAsset.currentValue,
          currency: (data.currency as "INR" | "USD") || editingAsset.currency,
        });
      }
    } catch (err) {
      console.error("Live price lookup error:", err);
    } finally {
      setIsFetchingPrice(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    await updateAsset({
      id: editingAsset.id,
      name: editingAsset.name.trim(),
      category: editingAsset.category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency: editingAsset.currency,
      date: new Date().toISOString().split("T")[0],
    });

    setEditingAsset(null);
  }

  return (
    <div className="modal-overlay" onClick={() => setEditingAsset(null)}>
      <form
        className="investment-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-heading">
          <div>
            <h2>Edit holding</h2>
            <p>Update valuation or units in PostgreSQL.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setEditingAsset(null)}
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--foreground-muted)",
              }}
            >
              Asset Name
            </span>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              className="fetch-price-status"
              onClick={handleRefreshQuote}
              disabled={isFetchingPrice}
            >
              <Sparkles size={11} />
              {isFetchingPrice ? "Fetching live quote…" : "Refresh price"}
            </button>
          </div>
          <input
            required
            value={editingAsset.name}
            onChange={(e) =>
              setEditingAsset({ ...editingAsset, name: e.target.value })
            }
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
              onChange={(e) =>
                setEditingAsset({
                  ...editingAsset,
                  currency: e.target.value as "INR" | "USD",
                })
              }
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
              onChange={(e) =>
                setEditingAsset({
                  ...editingAsset,
                  investedAmount: e.target.value,
                })
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
                setEditingAsset({
                  ...editingAsset,
                  buyPrice: e.target.value,
                })
              }
            />
          </label>
        </div>

        {computedEditHoldings > 0 && (
          <div className="holdings-preview-banner">
            <Sparkles
              size={14}
              style={{ color: "var(--apple-blue)", flexShrink: 0 }}
            />
            <span>
              Calculated Holdings:{" "}
              <strong>
                {computedEditHoldings.toFixed(
                  computedEditHoldings % 1 === 0 ? 0 : 4
                )}{" "}
                units
              </strong>
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
              onChange={(e) =>
                setEditingAsset({
                  ...editingAsset,
                  currentValue: e.target.value,
                })
              }
            />
          </label>

          <label>
            Market Price ({editingAsset.currency === "USD" ? "$" : "₹"})
            <input
              type="number"
              min="0.0001"
              step="any"
              value={editingAsset.currentPrice}
              onChange={(e) =>
                setEditingAsset({
                  ...editingAsset,
                  currentPrice: e.target.value,
                })
              }
            />
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setEditingAsset(null)}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Update Asset
          </button>
        </div>
      </form>
    </div>
  );
}

export function DeleteAssetModal() {
  const { deletingAsset, setDeletingAsset, deleteAsset } = usePortfolio();

  if (!deletingAsset) return null;

  return (
    <div className="modal-overlay" onClick={() => setDeletingAsset(null)}>
      <div className="investment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>Delete asset</h2>
            <p>
              Are you sure you want to remove <strong>{deletingAsset.name}</strong> from your portfolio?
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setDeletingAsset(null)}
          >
            <X size={18} />
          </button>
        </div>
        <div
          style={{
            padding: "12px 0",
            fontSize: "13px",
            color: "var(--foreground-muted)",
          }}
        >
          This will remove the position permanently from PostgreSQL.
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDeletingAsset(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ background: "var(--rose)" }}
            onClick={() => {
              deleteAsset(deletingAsset.id);
              setDeletingAsset(null);
            }}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export function DbConfigModal() {
  const { dbModal, setDbModal, syncStatus, assets, currentUserId } = usePortfolio();
  const [copied, setCopied] = useState(false);

  if (!dbModal) return null;

  const sqlSnippet = `-- 1. Rename user_id to username in assets table so both tables share the same column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.assets RENAME COLUMN user_id TO username;
  END IF;
END $$;

-- Ensure username column exists and defaults to active user
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS username TEXT DEFAULT 'CHAY4182';
UPDATE public.assets SET username = 'CHAY4182' WHERE username IS NULL;

-- 2. Make username in users table UNIQUE and Primary identifier
ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- 3. Link assets(username) to users(username)
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS fk_assets_username;
ALTER TABLE public.assets 
ADD CONSTRAINT fk_assets_username 
FOREIGN KEY (username) 
REFERENCES public.users(username) 
ON UPDATE CASCADE 
ON DELETE CASCADE;

-- 4. Row Level Security policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select users" ON public.users;
CREATE POLICY "Allow anon select users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert users" ON public.users;
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update users" ON public.users;
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE USING (true);`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(sqlSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={() => setDbModal(false)}>
      <div
        className="investment-modal"
        style={{ width: "min(100%, 640px)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="apple-brand-icon"
              style={{ width: "32px", height: "32px", fontSize: "14px" }}
            >
              <Database size={16} />
            </div>
            <div>
              <h2>PostgreSQL Multi-User Architecture</h2>
              <p>Connected via Supabase Realtime Engine • Unified by username</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setDbModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--foreground)",
            lineHeight: "1.6",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.06)",
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Active User Session</div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px" }}>@{currentUserId}</div>
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.06)",
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sync & Multi-Tenant Status</div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px", color: "#16a34a" }}>
                {syncStatus.toUpperCase()} ({assets.length} isolated positions)
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(37, 99, 235, 0.05)",
              border: "1px solid rgba(37, 99, 235, 0.15)",
              borderRadius: "12px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "12px", color: "#1d4ed8" }}>
                SQL Migration for Supabase SQL Editor
              </span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(37, 99, 235, 0.3)",
                  background: copied ? "#16a34a" : "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied!" : "Copy SQL"}</span>
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
              Run this once in your Supabase SQL Editor to unify the tables with <code>username</code>:
            </p>
            <pre
              style={{
                background: "rgba(0,0,0,0.06)",
                padding: "10px 12px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "11px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {sqlSnippet}
            </pre>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => setDbModal(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarketSessionsModal() {
  const { marketModal, setMarketModal, indianMarket, usMarket } = usePortfolio();

  if (!marketModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setMarketModal(false)}>
      <div
        className="investment-modal"
        style={{ width: "min(100%, 560px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="apple-brand-icon"
              style={{ width: "34px", height: "34px", fontSize: "15px" }}
            >
              <Clock size={17} />
            </div>
            <div>
              <h2>Stock Market Trading Sessions</h2>
              <p>Real-time exchange clocks & active trading hours</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMarketModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginTop: "8px",
          }}
        >
          {/* Indian Markets */}
          <div className="apple-market-timing-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>
                  🇮🇳 National Stock Exchange (NSE / BSE)
                </strong>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  Mumbai, India • {indianMarket.timeZone}
                </div>
              </div>
              <MarketTimingBadge status={indianMarket} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                borderTop: "1px solid rgba(0,0,0,0.05)",
                paddingTop: "8px",
                marginTop: "4px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Current Time:
              </span>
              <strong style={{ color: "var(--foreground)" }}>
                {indianMarket.currentTimeStr}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Trading Hours:
              </span>
              <span>{indianMarket.tradingHoursStr}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Next Session:
              </span>
              <span style={{ color: "var(--apple-blue)", fontWeight: 600 }}>
                {indianMarket.detail}
              </span>
            </div>
          </div>

          {/* US Markets */}
          <div className="apple-market-timing-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>
                  🇺🇸 New York Stock Exchange & NASDAQ
                </strong>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  New York, United States • {usMarket.timeZone}
                </div>
              </div>
              <MarketTimingBadge status={usMarket} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                borderTop: "1px solid rgba(0,0,0,0.05)",
                paddingTop: "8px",
                marginTop: "4px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Current Time:
              </span>
              <strong style={{ color: "var(--foreground)" }}>
                {usMarket.currentTimeStr}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Trading Hours:
              </span>
              <span>{usMarket.tradingHoursStr}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--foreground-muted)" }}>
                Next Session:
              </span>
              <span style={{ color: "var(--apple-blue)", fontWeight: 600 }}>
                {usMarket.detail}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => setMarketModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function PortfolioModals() {
  return (
    <>
      <AddAssetModal />
      <EditAssetModal />
      <DeleteAssetModal />
      <DbConfigModal />
      <MarketSessionsModal />
    </>
  );
}

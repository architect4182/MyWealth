"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Database,
  Clock,
  Repeat,
  CalendarClock,
} from "lucide-react";
import { AssetCategory } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import { MarketTimingBadge } from "@/components/MarketBadge";
import { getNextSipDate, formatLocalDate } from "@/utils/sip";
import { AssetDetailModal } from "@/components/AssetDetailModal";
import { getQuickBrokerOptions } from "@/utils/brokers";
import { BrokerLogoAvatar } from "@/components/Logos";

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
  const [isEditCustomBroker, setIsEditCustomBroker] = useState(false);
  const [isSip, setIsSip] = useState(false);
  const [sipAmount, setSipAmount] = useState("");
  const [sipDay, setSipDay] = useState("5");
  const [sipStartDate, setSipStartDate] = useState("");
  const [initialInstallmentDone, setInitialInstallmentDone] = useState(true);
  const [brokerApp, setBrokerApp] = useState("Groww");
  const [isCustomBroker, setIsCustomBroker] = useState(false);

  const autoPriceRequestRef = useRef(0);
  const skipNextAutoPriceLookupRef = useRef(false);

  useEffect(() => {
    if (modal) {
      const todayStr = formatLocalDate();
      setSipStartDate(todayStr);
      setIsSip(false);
      if (prefillAsset) {
        setName(prefillAsset.name);
        setCategory(prefillAsset.category);
        setBuyPrice(String(prefillAsset.price));
        setCurrentPrice(String(prefillAsset.price));
        setCurrency(prefillAsset.currency);
        if (prefillAsset.brokerApp) {
          setBrokerApp(prefillAsset.brokerApp);
          setIsCustomBroker(!getQuickBrokerOptions(prefillAsset.category).includes(prefillAsset.brokerApp));
        } else {
          const quicks = getQuickBrokerOptions(prefillAsset.category);
          setBrokerApp(quicks[0] || "Groww");
          setIsCustomBroker(false);
        }
      } else {
        setCategory(defaultCategory);
        setCurrency(defaultCategory === "US Stocks" ? "USD" : "INR");
        const quicks = getQuickBrokerOptions(defaultCategory);
        setBrokerApp(quicks[0] || "Groww");
        setIsCustomBroker(false);
      }
    } else {
      setName("");
      setInvestedAmount("");
      setBuyPrice("");
      setCurrentPrice("");
      setCurrentValue("");
      setIsSip(false);
      setSipAmount("");
      setSipDay("5");
      setSipStartDate("");
      setInitialInstallmentDone(true);
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

    if (isSip) {
      const amount = Number(sipAmount);
      if (!amount || amount <= 0) return;
      const cp = Number(currentPrice) || Number(buyPrice) || 1;
      const bp = cp;
      const q = initialInstallmentDone ? amount / cp : 0;
      const installments = initialInstallmentDone ? 1 : 0;
      const lastDate = initialInstallmentDone
        ? sipStartDate || formatLocalDate()
        : undefined;

      await addAsset({
        name: name.trim(),
        category,
        quantity: q,
        buyPrice: bp,
        currentPrice: cp,
        currency,
        isSip: true,
        sipAmount: amount,
        sipDay: Number(sipDay) || 5,
        sipStartDate: sipStartDate || formatLocalDate(),
        sipInstallments: installments,
        lastSipDate: lastDate,
        sipStatus: "active",
        brokerApp: brokerApp.trim() || undefined,
      });

      setModal(false);
      return;
    }

    const inv = Number(investedAmount);
    let bp = Number(buyPrice) || Number(currentPrice);
    if (!inv || !bp || bp <= 0) return;

    const q = inv / bp;
    const userCp = Number(currentPrice);
    const cp = userCp > 0 ? userCp : bp;

    await addAsset({
      name: name.trim(),
      category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency,
      isSip: false,
      brokerApp: brokerApp.trim() || undefined,
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
            <p>Record a new asset or scheduled SIP into your portfolio.</p>
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
              Asset / Fund Name
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
            placeholder="e.g. Reliance, Tata Motors, Apple, Parag Parikh Flexi Cap"
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

        {/* Investing via App / Broker Selection */}
        <div className="apple-broker-input-section">
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
              Investing via App / Broker
            </span>
            <span style={{ fontSize: "10.5px", color: "#9366FF", fontWeight: 600 }}>
              Stored in DB
            </span>
          </div>

          <div className="apple-broker-chips-container">
            {getQuickBrokerOptions(category).map((app) => (
              <button
                key={app}
                type="button"
                className={`apple-broker-chip ${brokerApp === app && !isCustomBroker ? "active" : ""}`}
                onClick={() => {
                  setBrokerApp(app);
                  setIsCustomBroker(false);
                }}
              >
                <BrokerLogoAvatar brokerName={app} size={15} />
                <span>{app}</span>
              </button>
            ))}
            <button
              type="button"
              className={`apple-broker-chip ${isCustomBroker ? "active" : ""}`}
              onClick={() => {
                setIsCustomBroker(true);
                if (getQuickBrokerOptions(category).includes(brokerApp)) {
                  setBrokerApp("");
                }
              }}
            >
              <span>+ Custom / Other</span>
            </button>
          </div>

          {isCustomBroker && (
            <input
              style={{ marginTop: "8px" }}
              value={brokerApp}
              onChange={(e) => setBrokerApp(e.target.value)}
              placeholder="e.g. Zerodha, Groww, Upstox, SBI Securities, ICICI Direct"
            />
          )}
        </div>

        {/* Authentic Apple iOS Switch for SIP Check */}
        <div className={`apple-ios-sip-toggle-card ${isSip ? "active" : ""}`}>
          <div className="apple-ios-sip-info">
            <div className="apple-ios-sip-label-row">
              <Repeat size={14} style={{ color: isSip ? "#34c759" : "var(--foreground-muted)" }} />
              <strong className="apple-ios-sip-title">Is this a SIP (Recurring Investment)?</strong>
            </div>
            <span className="apple-ios-sip-desc">
              {isSip
                ? "Auto-executes monthly on payment date & recalculates P/L"
                : "Standard one-time lump sum investment"}
            </span>
          </div>
          <button
            type="button"
            className={`ios-switch ${isSip ? "active" : ""}`}
            onClick={() => {
              const next = !isSip;
              setIsSip(next);
              if (next && !sipAmount && investedAmount) setSipAmount(investedAmount);
            }}
            role="switch"
            aria-checked={isSip}
            aria-label="Toggle SIP"
          >
            <span className="ios-switch-knob" />
          </button>
        </div>

        {isSip ? (
          <>
            <div className="form-row">
              <label>
                Monthly SIP Amount ({currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  value={sipAmount}
                  onChange={(e) => setSipAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </label>

              <label>
                SIP Start Date
                <input
                  required
                  type="date"
                  value={sipStartDate}
                  onChange={(e) => setSipStartDate(e.target.value)}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Payment / Debit Date of Month
                <select
                  value={sipDay}
                  onChange={(e) => setSipDay(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of each month {d === 5 ? "• Recommended" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Current Price / NAV ({currency === "USD" ? "$" : "₹"})
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="any"
                  value={currentPrice || buyPrice}
                  onChange={(e) => {
                    setCurrentPrice(e.target.value);
                    setBuyPrice(e.target.value);
                  }}
                  placeholder="e.g. 85.50"
                />
              </label>
            </div>

            <div className="apple-sip-schedule-banner">
              <div className="apple-sip-schedule-left">
                <CalendarClock size={16} style={{ color: "#34c759", flexShrink: 0 }} />
                <div>
                  <strong>Next scheduled payment: {getNextSipDate(Number(sipDay) || 5)}</strong>
                  <p>On this day each month, MyWealth will automatically add this installment and update your returns.</p>
                </div>
              </div>
              <label className="apple-sip-checkbox-label">
                <input
                  type="checkbox"
                  checked={initialInstallmentDone}
                  onChange={(e) => setInitialInstallmentDone(e.target.checked)}
                />
                <span>Debit / Log 1st installment ({currency === "USD" ? "$" : "₹"}{sipAmount || "0"}) today</span>
              </label>
            </div>
          </>
        ) : (
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
        )}

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

        {!isSip && (
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
        )}

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

    const q = inv / bp;
    const userCp = Number(editingAsset.currentPrice);
    const cp = userCp > 0 ? userCp : (Number(editingAsset.currentPrice) || bp);

    await updateAsset({
      id: editingAsset.id,
      name: editingAsset.name.trim(),
      category: editingAsset.category,
      quantity: q,
      buyPrice: bp,
      currentPrice: cp,
      currency: editingAsset.currency,
      date: formatLocalDate(),
      isSip: editingAsset.isSip,
      sipAmount: editingAsset.sipAmount ? Number(editingAsset.sipAmount) : undefined,
      sipDay: editingAsset.sipDay ? Number(editingAsset.sipDay) : undefined,
      sipStartDate: editingAsset.sipStartDate,
      sipInstallments: editingAsset.sipInstallments ? Number(editingAsset.sipInstallments) : undefined,
      lastSipDate: editingAsset.lastSipDate,
      sipStatus: editingAsset.sipStatus || (editingAsset.isSip ? "active" : undefined),
      brokerApp: editingAsset.brokerApp?.trim() || undefined,
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
              onChange={(e) => {
                const cv = e.target.value;
                const holdings = computedEditHoldings;
                const cp = Number(cv) > 0 && holdings > 0 ? (Number(cv) / holdings).toFixed(2) : editingAsset.currentPrice;
                setEditingAsset({
                  ...editingAsset,
                  currentValue: cv,
                  currentPrice: cp,
                });
              }}
            />
          </label>

          <label>
            Market Price ({editingAsset.currency === "USD" ? "$" : "₹"})
            <input
              type="number"
              min="0.0001"
              step="any"
              value={editingAsset.currentPrice}
              onChange={(e) => {
                const cp = e.target.value;
                const holdings = computedEditHoldings;
                const cv = Number(cp) > 0 && holdings > 0 ? (Number(cp) * holdings).toFixed(2) : editingAsset.currentValue;
                setEditingAsset({
                  ...editingAsset,
                  currentPrice: cp,
                  currentValue: cv,
                });
              }}
            />
          </label>
        </div>

        {/* Authentic Apple iOS Switch for SIP Check */}
        <div className={`apple-ios-sip-toggle-card ${editingAsset.isSip ? "active" : ""}`}>
          <div className="apple-ios-sip-info">
            <div className="apple-ios-sip-label-row">
              <Repeat size={14} style={{ color: editingAsset.isSip ? "#34c759" : "var(--foreground-muted)" }} />
              <strong className="apple-ios-sip-title">Is this a SIP (Recurring Investment)?</strong>
            </div>
            <span className="apple-ios-sip-desc">
              {editingAsset.isSip
                ? "Auto-executes monthly on payment date & recalculates P/L"
                : "Standard one-time lump sum investment"}
            </span>
          </div>
          <button
            type="button"
            className={`ios-switch ${editingAsset.isSip ? "active" : ""}`}
            onClick={() => {
              const next = !editingAsset.isSip;
              setEditingAsset({
                ...editingAsset,
                isSip: next,
                sipStatus: next ? "active" : "paused",
                sipDay: editingAsset.sipDay || "5",
              });
            }}
            role="switch"
            aria-checked={Boolean(editingAsset.isSip)}
            aria-label="Toggle SIP"
          >
            <span className="ios-switch-knob" />
          </button>
        </div>

        {editingAsset.isSip && (
          <>
            <div className="form-row">
              <label>
                Monthly SIP Amount ({editingAsset.currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editingAsset.sipAmount || ""}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      sipAmount: e.target.value,
                    })
                  }
                  placeholder="e.g. 5000"
                />
              </label>

              <label>
                SIP Start Date
                <input
                  type="date"
                  value={editingAsset.sipStartDate || ""}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      sipStartDate: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Payment / Debit Date of Month
                <select
                  value={editingAsset.sipDay || "5"}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      sipDay: e.target.value,
                    })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of each month {d === 5 ? "• Recommended" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                SIP Status
                <select
                  value={editingAsset.sipStatus || "active"}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      sipStatus: e.target.value as "active" | "paused",
                    })
                  }
                >
                  <option value="active">Active (Auto-add)</option>
                  <option value="paused">Paused (Hold)</option>
                </select>
              </label>
            </div>
          </>
        )}

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
          This will remove the position permanently.
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

  if (!dbModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setDbModal(false)}>
      <div
        className="investment-modal"
        style={{ width: "min(100%, 540px)", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}
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
              <h2>PostgreSQL Database Status</h2>
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
                background: "rgba(28, 28, 38, 0.7)",
                border: "1px solid rgba(147, 102, 255, 0.16)",
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Active User Session</div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px", textTransform: "uppercase" }}>{currentUserId}</div>
            </div>
            <div
              style={{
                background: "rgba(28, 28, 38, 0.7)",
                border: "1px solid rgba(147, 102, 255, 0.16)",
                padding: "10px 14px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Sync & Multi-Tenant Status</div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginTop: "2px", color: "#16a34a" }}>
                {syncStatus.toUpperCase()} ({assets.length} isolated positions)
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(22, 163, 74, 0.05)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              borderRadius: "12px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔒</span>
            <div style={{ fontSize: "12px", color: "var(--foreground)" }}>
              <strong>Multi-tenant isolation active.</strong> Holdings, orders, and portfolio allocations are securely scoped to <code>{currentUserId ? currentUserId.toUpperCase() : ""}</code> in Supabase PostgreSQL.
            </div>
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
      <AssetDetailModal />
    </>
  );
}

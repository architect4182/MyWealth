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
import { SearchResultItem } from "@/app/api/search-assets/route";

function calculateHoldings(investedAmount: string, buyPrice: string): number {
  const invested = Number(investedAmount);
  const price = Number(buyPrice);
  return Number.isFinite(invested) && invested > 0 && Number.isFinite(price) && price > 0
    ? invested / price
    : 0;
}

export function AddAssetModal() {
  const {
    modal,
    setModal,
    defaultCategory,
    addAsset,
    prefillAsset,
    setPrefillAsset,
  } = usePortfolio();

  // 1. Ask User First: "stock" | "mf"
  const [assetType, setAssetType] = useState<"stock" | "mf">(() => {
    return defaultCategory === "Mutual Funds" ? "mf" : "stock";
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>(defaultCategory);
  const [quantity, setQuantity] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">(
    defaultCategory === "US Stocks" ? "USD" : "INR"
  );
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditCustomBroker, setIsEditCustomBroker] = useState(false);
  const [isSip, setIsSip] = useState(defaultCategory === "Mutual Funds");
  const [sipAmount, setSipAmount] = useState("");
  const [sipDay, setSipDay] = useState("");
  const [sipStartDate, setSipStartDate] = useState("");
  const [initialInstallmentDone, setInitialInstallmentDone] = useState(true);
  const [brokerApp, setBrokerApp] = useState("");
  const [isCustomBroker, setIsCustomBroker] = useState(false);

  // Search / Relatable words state
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<number | null>(null);

  const autoPriceRequestRef = useRef(0);
  const skipNextAutoPriceLookupRef = useRef(false);

  useEffect(() => {
    if (modal) {
      const todayStr = formatLocalDate();
      setSipStartDate(todayStr);
      setSipDay(String(new Date().getDate()));
      setIsSubmitting(false);
      setShowSuggestions(false);
      setSuggestions([]);
      setHighlightIndex(-1);

      if (prefillAsset) {
        setName(prefillAsset.name);
        setCategory(prefillAsset.category);
        const at: "stock" | "mf" = prefillAsset.category === "Mutual Funds" ? "mf" : "stock";
        setAssetType(at);
        setBuyPrice(prefillAsset.price ? String(prefillAsset.price) : "");
        setCurrentPrice(prefillAsset.price ? String(prefillAsset.price) : "");
        setCurrency(prefillAsset.currency);
        setQuantity("");
        setInvestedAmount("");
        setCurrentValue("");
        setIsSip(prefillAsset.category === "Mutual Funds");
        if (prefillAsset.brokerApp) {
          setBrokerApp(prefillAsset.brokerApp);
          setIsCustomBroker(!getQuickBrokerOptions(prefillAsset.category).includes(prefillAsset.brokerApp));
        } else {
          setBrokerApp("");
          setIsCustomBroker(false);
        }
      } else {
        const at: "stock" | "mf" = defaultCategory === "Mutual Funds" ? "mf" : "stock";
        setAssetType(at);
        setCategory(defaultCategory);
        setCurrency(defaultCategory === "US Stocks" ? "USD" : "INR");
        setIsSip(defaultCategory === "Mutual Funds");
        setBrokerApp("");
        setIsCustomBroker(false);
      }
    } else {
      setName("");
      setQuantity("");
      setInvestedAmount("");
      setBuyPrice("");
      setCurrentPrice("");
      setCurrentValue("");
      setIsSip(false);
      setSipAmount("");
      setSipDay(String(new Date().getDate()));
      setSipStartDate("");
      setInitialInstallmentDone(true);
      setPrefillAsset(null);
      setIsSubmitting(false);
      setShowSuggestions(false);
      setSuggestions([]);
      setHighlightIndex(-1);
    }
  }, [modal, defaultCategory, prefillAsset, setPrefillAsset]);

  const handleSelectAssetType = (type: "stock" | "mf") => {
    setAssetType(type);
    setName("");
    setQuantity("");
    setInvestedAmount("");
    setBuyPrice("");
    setCurrentPrice("");
    setCurrentValue("");
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightIndex(-1);

    if (type === "stock") {
      setCategory("Indian Equities");
      setCurrency("INR");
      setIsSip(false);
      setBrokerApp("");
      setIsCustomBroker(false);
    } else {
      setCategory("Mutual Funds");
      setCurrency("INR");
      setIsSip(true);
      setBrokerApp("");
      setIsCustomBroker(false);
    }
  };

  // Live relatable words lookup whenever name changes
  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    const query = name.trim();
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightIndex(-1);
      return;
    }

    searchDebounceRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search-assets?q=${encodeURIComponent(query)}&type=${assetType}`
        );
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.results) && data.results.length > 0) {
          setSuggestions(data.results);
          setShowSuggestions(true);
          setHighlightIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [name, assetType]);

  // Click outside search container to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: SearchResultItem) => {
    skipNextAutoPriceLookupRef.current = true;
    setName(item.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightIndex(-1);

    if (item.category) {
      setCategory(item.category);
      if (item.category === "Mutual Funds") {
        setAssetType("mf");
        setIsSip(true);
      } else {
        setAssetType("stock");
        setIsSip(false);
      }
    }
    if (item.currency) {
      setCurrency(item.currency);
    }
    // Clear old values and fetch exact live CMP from exchange/AMFI
    setBuyPrice("");
    setCurrentPrice("");
    if (!quantity) setQuantity("1");
    setIsFetchingPrice(true);

    void handleFetchLivePriceRef.current(item.ticker || item.name, item.category || category);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const computedAddHoldings = calculateHoldings(investedAmount, buyPrice);

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
        const qNum = Number(quantity) > 0 ? Number(quantity) : 1;
        setQuantity(String(qNum));
        setCurrentValue((qNum * data.price).toFixed(2));
        if (!investedAmount || Number(investedAmount) <= 0) {
          setInvestedAmount((qNum * data.price).toFixed(2));
        } else {
          setInvestedAmount((qNum * (Number(buyPrice) || data.price)).toFixed(2));
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
        autoRequestId !== undefined ||
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
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Immediately close modal so user cannot keep clicking and trigger duplicate DB rows
    setIsSubmitting(true);
    setModal(false);

    if (isSip) {
      const amount = Number(sipAmount) || Number(investedAmount);
      if (!amount || amount <= 0) {
        setIsSubmitting(false);
        return;
      }
      const cp = Number(currentPrice) || Number(buyPrice);
      if (!cp || cp <= 0) {
        setIsSubmitting(false);
        return;
      }
      const bp = cp;
      const q = initialInstallmentDone ? amount / cp : 0;
      const installments = initialInstallmentDone ? 1 : 0;
      const lastDate = initialInstallmentDone
        ? sipStartDate || formatLocalDate()
        : undefined;

      try {
        await addAsset({
          name: trimmedName,
          category,
          quantity: q,
          buyPrice: bp,
          currentPrice: cp,
          currency,
          isSip: true,
          sipAmount: amount,
          sipDay: Number(sipDay) || new Date().getDate(),
          sipStartDate: sipStartDate || formatLocalDate(),
          sipInstallments: installments,
          lastSipDate: lastDate,
          sipStatus: "active",
          brokerApp: brokerApp.trim() || undefined,
        });
      } catch (err) {
        console.error("Add SIP asset error:", err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const userQ = Number(quantity);
    const inv = Number(investedAmount);
    let bp = Number(buyPrice) || Number(currentPrice);
    if (!bp || bp <= 0) {
      if (inv > 0 && userQ > 0) {
        bp = inv / userQ;
      } else {
        setIsSubmitting(false);
        return;
      }
    }

    let q = 1;
    if (userQ > 0) {
      q = userQ;
    } else if (inv > 0 && bp > 0) {
      q = inv / bp;
    }

    // Clean floating-point division noise (e.g. 3.0000000000000004 -> 3)
    if (Math.abs(q - Math.round(q)) < 0.00001) {
      q = Math.round(q);
    }

    const userCp = Number(currentPrice);
    const cp = userCp > 0 ? userCp : bp;

    try {
      await addAsset({
        name: trimmedName,
        category,
        quantity: q,
        buyPrice: bp,
        currentPrice: cp,
        currency,
        isSip: false,
        brokerApp: brokerApp.trim() || undefined,
      });
    } catch (err) {
      console.error("Add asset error:", err);
    } finally {
      setIsSubmitting(false);
    }
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
            <p>Select Stock or Mutual Fund, search relatable words, and record holdings.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Ask User First: Stock or MF? */}
        <div className="add-asset-type-selector">
          <button
            type="button"
            className={`add-type-btn ${assetType === "stock" ? "active" : ""}`}
            onClick={() => handleSelectAssetType("stock")}
          >
            <span className="add-type-icon">📈</span>
            <div className="add-type-text">
              <strong>Stocks & Equities</strong>
              <span>Indian & US Stocks</span>
            </div>
          </button>

          <button
            type="button"
            className={`add-type-btn ${assetType === "mf" ? "active" : ""}`}
            onClick={() => handleSelectAssetType("mf")}
          >
            <span className="add-type-icon">🏦</span>
            <div className="add-type-text">
              <strong>Mutual Funds</strong>
              <span>SIP & Lumpsum (AMFI)</span>
            </div>
          </button>
        </div>

        {/* Sub-toggle for Stocks: India vs US */}
        {assetType === "stock" && (
          <div className="add-stock-market-pills">
            <button
              type="button"
              className={`add-market-sub-pill ${category === "Indian Equities" ? "active" : ""}`}
              onClick={() => {
                setCategory("Indian Equities");
                setCurrency("INR");
              }}
            >
              🇮🇳 India (NSE / BSE)
            </button>
            <button
              type="button"
              className={`add-market-sub-pill ${category === "US Stocks" ? "active" : ""}`}
              onClick={() => {
                setCategory("US Stocks");
                setCurrency("USD");
              }}
            >
              🇺🇸 US (NASDAQ / NYSE)
            </button>
          </div>
        )}

        {/* 2. Asset / Fund Name with Relatable Words Search Dropdown */}
        <div ref={searchContainerRef} className="asset-search-container">
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
              {assetType === "stock"
                ? "Stock / Company Name"
                : "Mutual Fund Scheme"}
            </span>
            <span className="fetch-price-status">
              <Sparkles size={11} />
              {isFetchingPrice
                ? "Fetching live price…"
                : isSearching
                ? "Finding relatable matches…"
                : "Auto-fills price @ CMP/NAV"}
            </span>
          </div>

          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              assetType === "stock"
                ? "Search stocks: e.g. Tata Motors, ICICI Bank, Apple, Reliance..."
                : "Search mutual funds: e.g. Parag Parikh, Quant Small Cap, Mirae Asset..."
            }
            autoComplete="off"
          />

          {/* Relatable Words / Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="asset-search-dropdown">
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.symbol}-${idx}`}
                  className={`asset-search-item ${highlightIndex === idx ? "highlighted" : ""}`}
                  onMouseDown={() => handleSelectSuggestion(item)}
                >
                  <div className="asset-search-item-left">
                    <span className="asset-search-item-badge">{item.ticker || item.symbol}</span>
                    <div className="asset-search-item-info">
                      <span className="asset-search-item-name">{item.name}</span>
                      <span className="asset-search-item-sub">{item.subtext}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--foreground-muted)",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Select ↵
                  </span>
                </div>
              ))}
            </div>
          )}
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
                if (c === "Mutual Funds") {
                  setAssetType("mf");
                  setIsSip(true);
                } else {
                  setAssetType("stock");
                  setIsSip(false);
                }
              }}
            >
              <option value="Indian Equities">Indian Equities (NSE/BSE)</option>
              <option value="US Stocks">US Stocks (NASDAQ/NYSE)</option>
              <option value="Mutual Funds">Mutual Funds (AMFI)</option>
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

        <div>
          <label>
            Investing via App / Broker
            <select
              value={isCustomBroker ? "__custom__" : (brokerApp || "")}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomBroker(true);
                  setBrokerApp("");
                } else {
                  setIsCustomBroker(false);
                  setBrokerApp(e.target.value);
                }
              }}
            >
              <option value="">-- Select Investing App / Broker (Optional) --</option>
              {getQuickBrokerOptions(category).map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
              <option value="__custom__">Other / Custom Broker…</option>
            </select>
          </label>
          {isCustomBroker && (
            <input
              style={{ marginTop: "8px" }}
              required
              value={brokerApp}
              onChange={(e) => setBrokerApp(e.target.value)}
              placeholder="e.g. Zerodha, Groww, Upstox, SBI Securities, ICICI Direct"
              autoFocus
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
                  placeholder="0.00"
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
          <>
            <div className="form-row">
              <label>
                Quantity (Shares / Units)
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="any"
                  value={quantity}
                  onChange={(e) => {
                    const q = e.target.value;
                    setQuantity(q);
                    const numQ = Number(q);
                    if (numQ > 0) {
                      if (Number(buyPrice) > 0) {
                        setInvestedAmount((numQ * Number(buyPrice)).toFixed(2));
                      }
                      if (Number(currentPrice) > 0) {
                        setCurrentValue((numQ * Number(currentPrice)).toFixed(2));
                      }
                    }
                  }}
                  placeholder="e.g. 10"
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
                  onChange={(e) => {
                    const price = e.target.value;
                    setBuyPrice(price);
                    const numBp = Number(price);
                    if (numBp > 0) {
                      if (Number(quantity) > 0) {
                        setInvestedAmount((Number(quantity) * numBp).toFixed(2));
                      } else if (Number(investedAmount) > 0) {
                        const newQ = Number(investedAmount) / numBp;
                        setQuantity(newQ.toFixed(newQ % 1 === 0 ? 0 : 4));
                        if (Number(currentPrice) > 0) {
                          setCurrentValue((newQ * Number(currentPrice)).toFixed(2));
                        }
                      }
                    }
                  }}
                  placeholder="e.g. 1165"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Market Price (CMP / NAV) ({currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => {
                    const p = e.target.value;
                    setCurrentPrice(p);
                    const numCp = Number(p);
                    if (numCp > 0 && Number(quantity) > 0) {
                      setCurrentValue((Number(quantity) * numCp).toFixed(2));
                    }
                  }}
                  placeholder={buyPrice ? buyPrice : "e.g. 1165"}
                />
              </label>

              <label>
                Current Valuation ({currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={currentValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentValue(value);
                    const numCv = Number(value);
                    const cp = Number(currentPrice) || Number(buyPrice);
                    if (numCv > 0 && cp > 0) {
                      const newQ = numCv / cp;
                      setQuantity(newQ.toFixed(newQ % 1 === 0 ? 0 : 4));
                      if (Number(buyPrice) > 0) {
                        setInvestedAmount((newQ * Number(buyPrice)).toFixed(2));
                      }
                    }
                  }}
                  placeholder={
                    Number(quantity) > 0 && Number(currentPrice || buyPrice) > 0
                      ? (Number(quantity) * Number(currentPrice || buyPrice)).toFixed(2)
                      : "0.00"
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Total Amount Invested ({currency === "USD" ? "$" : "₹"})
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={investedAmount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    setInvestedAmount(amount);
                    const numInv = Number(amount);
                    const bp = Number(buyPrice);
                    if (numInv > 0 && bp > 0) {
                      const newQ = numInv / bp;
                      setQuantity(newQ.toFixed(newQ % 1 === 0 ? 0 : 4));
                      if (Number(currentPrice) > 0) {
                        setCurrentValue((newQ * Number(currentPrice)).toFixed(2));
                      }
                    }
                  }}
                  placeholder={
                    Number(quantity) > 0 && Number(buyPrice) > 0
                      ? (Number(quantity) * Number(buyPrice)).toFixed(2)
                      : "0.00"
                  }
                />
              </label>
            </div>

            {(Number(quantity) > 0 || computedAddHoldings > 0) && (
              <div className="holdings-preview-banner">
                <Sparkles
                  size={14}
                  style={{ color: "var(--apple-blue)", flexShrink: 0 }}
                />
                <span>
                  Holdings: <strong>{(Number(quantity) || computedAddHoldings).toFixed((Number(quantity) || computedAddHoldings) % 1 === 0 ? 0 : 4)} units</strong>
                  <span
                    style={{ opacity: 0.85, marginLeft: "8px", fontSize: "11px" }}
                  >
                    • Exact Live Value: {currency === "USD" ? "$" : "₹"}
                    {((Number(quantity) || computedAddHoldings) * (Number(currentPrice) || Number(buyPrice) || 0)).toFixed(2)}
                  </span>
                </span>
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Asset"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditAssetModal() {
  const { editingAsset, setEditingAsset, updateAsset } = usePortfolio();
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditCustomBroker, setIsEditCustomBroker] = useState(false);

  // Synchronize purchased app name when opening or changing holding to edit
  useEffect(() => {
    if (editingAsset) {
      setIsSubmitting(false);
      const quicks = getQuickBrokerOptions(editingAsset.category);
      if (editingAsset.brokerApp && editingAsset.brokerApp.trim()) {
        const isQuick = quicks.includes(editingAsset.brokerApp.trim());
        setIsEditCustomBroker(!isQuick);
      } else {
        setIsEditCustomBroker(false);
      }
    }
  }, [editingAsset?.id]);

  if (!editingAsset) return null;

  const computedEditHoldings = calculateHoldings(
    editingAsset.investedAmount,
    editingAsset.buyPrice
  );

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
          Number(editingAsset.quantity) > 0
            ? Number(editingAsset.quantity)
            : Number(editingAsset.investedAmount) > 0 && Number(editingAsset.buyPrice) > 0
            ? Number(editingAsset.investedAmount) / Number(editingAsset.buyPrice)
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
    if (!editingAsset || isSubmitting) return;

    const userQuantity = Number(editingAsset.quantity);
    const inv = Number(editingAsset.investedAmount);
    let bp = Number(editingAsset.buyPrice);
    if (!bp && userQuantity > 0 && inv > 0) {
      bp = inv / userQuantity;
    }
    if (!bp || bp <= 0) return;

    let q = 0;
    if (Number.isFinite(userQuantity) && userQuantity > 0) {
      q = userQuantity;
    } else if (inv > 0 && bp > 0) {
      q = inv / bp;
    }
    if (q <= 0) return;

    if (Math.abs(q - Math.round(q)) < 0.00001) {
      q = Math.round(q);
    }

    const userCp = Number(editingAsset.currentPrice);
    const cp = userCp > 0 ? userCp : bp;

    const assetToUpdate = {
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
    };

    // Close popup immediately to prevent double submissions!
    setIsSubmitting(true);
    setEditingAsset(null);

    try {
      await updateAsset(assetToUpdate);
    } catch (err) {
      console.error("Update asset error:", err);
    } finally {
      setIsSubmitting(false);
    }
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
            <p>Update valuation, units, or CMP in portfolio.</p>
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

        <div>
          <label>
            Investing via App / Broker
            <select
              value={
                isEditCustomBroker ||
                (editingAsset.brokerApp &&
                  !getQuickBrokerOptions(editingAsset.category).includes(
                    editingAsset.brokerApp
                  ))
                  ? "__custom__"
                  : (editingAsset.brokerApp || "")
              }
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsEditCustomBroker(true);
                  setEditingAsset({ ...editingAsset, brokerApp: "" });
                } else {
                  setIsEditCustomBroker(false);
                  setEditingAsset({
                    ...editingAsset,
                    brokerApp: e.target.value,
                  });
                }
              }}
            >
              <option value="">-- Select Investing App / Broker (Optional) --</option>
              {getQuickBrokerOptions(editingAsset.category).map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
              <option value="__custom__">Other / Custom Broker…</option>
            </select>
          </label>
          {(isEditCustomBroker ||
            (editingAsset.brokerApp &&
              !getQuickBrokerOptions(editingAsset.category).includes(
                editingAsset.brokerApp
              ))) && (
            <input
              style={{ marginTop: "8px" }}
              required
              value={editingAsset.brokerApp || ""}
              onChange={(e) =>
                setEditingAsset({
                  ...editingAsset,
                  brokerApp: e.target.value,
                })
              }
              placeholder="e.g. Zerodha, Groww, Upstox, SBI Securities, ICICI Direct"
              autoFocus
            />
          )}
        </div>

        <div className="form-row">
          <label>
            Quantity (Shares / Units)
            <input
              required
              type="number"
              min="0.0001"
              step="any"
              value={editingAsset.quantity || ""}
              onChange={(e) => {
                const q = e.target.value;
                const numQ = Number(q);
                const bp = Number(editingAsset.buyPrice);
                const cp = Number(editingAsset.currentPrice);
                setEditingAsset({
                  ...editingAsset,
                  quantity: q,
                  investedAmount: numQ > 0 && bp > 0 ? (numQ * bp).toFixed(2) : editingAsset.investedAmount,
                  currentValue: numQ > 0 && cp > 0 ? (numQ * cp).toFixed(2) : editingAsset.currentValue,
                });
              }}
              placeholder="e.g. 10"
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
              onChange={(e) => {
                const bp = e.target.value;
                const numBp = Number(bp);
                const q = Number(editingAsset.quantity);
                setEditingAsset({
                  ...editingAsset,
                  buyPrice: bp,
                  investedAmount: numBp > 0 && q > 0 ? (q * numBp).toFixed(2) : editingAsset.investedAmount,
                });
              }}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Market Price (CMP / NAV) ({editingAsset.currency === "USD" ? "$" : "₹"})
            <input
              type="number"
              min="0.0001"
              step="any"
              value={editingAsset.currentPrice}
              onChange={(e) => {
                const cp = e.target.value;
                const numCp = Number(cp);
                const q = Number(editingAsset.quantity) || computedEditHoldings;
                setEditingAsset({
                  ...editingAsset,
                  currentPrice: cp,
                  currentValue: numCp > 0 && q > 0 ? (numCp * q).toFixed(2) : editingAsset.currentValue,
                });
              }}
            />
          </label>

          <label>
            Current Valuation ({editingAsset.currency === "USD" ? "$" : "₹"})
            <input
              type="number"
              min="0.01"
              step="any"
              value={editingAsset.currentValue}
              onChange={(e) => {
                const cv = e.target.value;
                const numCv = Number(cv);
                const cp = Number(editingAsset.currentPrice);
                const bp = Number(editingAsset.buyPrice);
                let newQ = editingAsset.quantity;
                let newInv = editingAsset.investedAmount;
                if (numCv > 0 && cp > 0) {
                  const calculatedQ = numCv / cp;
                  newQ = calculatedQ.toFixed(calculatedQ % 1 === 0 ? 0 : 4);
                  if (bp > 0) {
                    newInv = (calculatedQ * bp).toFixed(2);
                  }
                }
                setEditingAsset({
                  ...editingAsset,
                  currentValue: cv,
                  quantity: newQ,
                  investedAmount: newInv,
                });
              }}
              placeholder={
                (Number(editingAsset.quantity) || computedEditHoldings) > 0 && Number(editingAsset.currentPrice || editingAsset.buyPrice) > 0
                  ? ((Number(editingAsset.quantity) || computedEditHoldings) * Number(editingAsset.currentPrice || editingAsset.buyPrice)).toFixed(2)
                  : "0.00"
              }
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Total Amount Invested ({editingAsset.currency === "USD" ? "$" : "₹"})
            <input
              required
              type="number"
              min="0.01"
              step="any"
              value={editingAsset.investedAmount}
              onChange={(e) => {
                const inv = e.target.value;
                const numInv = Number(inv);
                const bp = Number(editingAsset.buyPrice);
                const cp = Number(editingAsset.currentPrice);
                let newQ = editingAsset.quantity;
                let newCv = editingAsset.currentValue;
                if (numInv > 0 && bp > 0) {
                  const calculatedQ = numInv / bp;
                  newQ = calculatedQ.toFixed(calculatedQ % 1 === 0 ? 0 : 4);
                  if (cp > 0) {
                    newCv = (calculatedQ * cp).toFixed(2);
                  }
                }
                setEditingAsset({
                  ...editingAsset,
                  investedAmount: inv,
                  quantity: newQ,
                  currentValue: newCv,
                });
              }}
            />
          </label>
        </div>

        {((Number(editingAsset.quantity) || computedEditHoldings) > 0) && (
          <div className="holdings-preview-banner">
            <Sparkles
              size={14}
              style={{ color: "var(--apple-blue)", flexShrink: 0 }}
            />
            <span>
              Holdings: <strong>{(Number(editingAsset.quantity) || computedEditHoldings).toFixed((Number(editingAsset.quantity) || computedEditHoldings) % 1 === 0 ? 0 : 4)} units</strong>
              <span style={{ opacity: 0.85, marginLeft: "8px", fontSize: "11px" }}>
                • Exact Live Valuation: {editingAsset.currency === "USD" ? "$" : "₹"}
                {((Number(editingAsset.quantity) || computedEditHoldings) * (Number(editingAsset.currentPrice) || Number(editingAsset.buyPrice) || 0)).toFixed(2)}
              </span>
            </span>
          </div>
        )}

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
                sipAmount: next && !editingAsset.sipAmount ? editingAsset.investedAmount : editingAsset.sipAmount,
              });
            }}
            role="switch"
            aria-checked={editingAsset.isSip}
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
                  required
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
                  placeholder="0.00"
                />
              </label>

              <label>
                SIP Start Date
                <input
                  required
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
                Payment / Debit Day of Month
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
                  <option value="active">Active (Auto-invests each month)</option>
                  <option value="paused">Paused</option>
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
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update Asset"}
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
                background: "#f8f9fc",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                padding: "12px 14px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--foreground-muted, #5e5e6e)",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Active User Session
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  marginTop: "4px",
                  color: "var(--foreground, #111116)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {currentUserId}
              </div>
            </div>
            <div
              style={{
                background: "#f8f9fc",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                padding: "12px 14px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--foreground-muted, #5e5e6e)",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Sync & Multi-Tenant Status
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  marginTop: "4px",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px rgba(34, 197, 94, 0.6)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span>
                  {syncStatus.toUpperCase()} ({assets.length} isolated positions)
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(22, 163, 74, 0.06)",
              border: "1px solid rgba(22, 163, 74, 0.22)",
              borderRadius: "14px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🔒</span>
            <div style={{ fontSize: "12px", color: "var(--foreground, #111116)", lineHeight: "1.5" }}>
              <strong style={{ color: "#15803d" }}>Multi-tenant isolation active.</strong> Holdings, orders, and portfolio allocations are securely scoped to{" "}
              <code
                style={{
                  background: "rgba(22, 163, 74, 0.12)",
                  color: "#15803d",
                  padding: "1px 6px",
                  borderRadius: "5px",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                {currentUserId ? currentUserId.toUpperCase() : ""}
              </code>{" "}
              in Supabase PostgreSQL.
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

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Repeat,
  Sparkles,
  Activity,
  Layers,
  Calendar,
  Wallet,
  Scale,
  RefreshCw,
  Plus,
  Landmark,
  Building2,
  Tag,
  FileText,
  ExternalLink,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { StockLogoAvatar, getStockTicker, BrokerLogoAvatar } from "@/components/Logos";
import { getBrokersForCategory, getBrokerDestinationUrl } from "@/utils/brokers";
import { MarketTimingBadge } from "@/components/MarketBadge";
import { getNextSipDate } from "@/utils/sip";

interface ChartPoint {
  timestamp: number;
  date: string;
  price: number;
}

interface StockChartResponse {
  success: boolean;
  symbol: string;
  name: string;
  currency: "INR" | "USD";
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  points: ChartPoint[];
  range: string;
  fundHouse?: string;
  schemeCategory?: string;
  schemeType?: string;
  schemeCode?: number | string;
  isin?: string;
  exchange?: string;
  marketState?: string;
}

const PERIODS = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;
type Period = (typeof PERIODS)[number];

export function AssetDetailModal() {
  const {
    viewingAsset,
    setViewingAsset,
    startEditing,
    setDeletingAsset,
    money,
    indianMarket,
    usMarket,
    showUsdInRupees,
    openAddModalWithPrefill,
  } = usePortfolio();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");
  const [chartData, setChartData] = useState<StockChartResponse | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Crosshair / Hover state for interactive scrubber
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Real-time quote polling & flash state
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Market timing status synced with context (respects holidays & sessions)
  const marketStatus = useMemo(() => {
    return viewingAsset?.category === "US Stocks" ? usMarket : indianMarket;
  }, [viewingAsset?.category, indianMarket, usMarket]);

  const ticker = useMemo(() => {
    return viewingAsset ? getStockTicker(viewingAsset.name, viewingAsset.category) : "";
  }, [viewingAsset]);

  const categoryBrokers = useMemo(() => {
    return viewingAsset ? getBrokersForCategory(viewingAsset.category) : [];
  }, [viewingAsset]);

  // Fetch chart data helper
  const fetchChart = useCallback(
    async (period: Period, silent = false) => {
      if (!viewingAsset) return;

      // If market is closed or category is Mutual Funds, skip background polling calls completely
      if (silent && (!marketStatus.isOpen || viewingAsset.category === "Mutual Funds")) {
        return;
      }

      if (!silent) {
        setIsLoadingChart(true);
        setChartError(null);
      }

      try {
        const queryParam = encodeURIComponent(viewingAsset.name);
        const catParam = encodeURIComponent(viewingAsset.category);
        let url = `/api/stock-chart?query=${queryParam}&category=${catParam}&range=${period}`;

        // Check if viewingAsset has an AMFI scheme code (MF-120503 or digits in ID or in name)
        const codeMatch =
          viewingAsset.id?.match(/^(?:MF-)?(\d{5,7})$/i) ||
          viewingAsset.name.match(/\b(\d{5,7})\b/);
        if (codeMatch) {
          url += `&code=${encodeURIComponent(codeMatch[1])}`;
        } else if (viewingAsset.id?.startsWith("trending-")) {
          const trendSym = viewingAsset.id.replace("trending-", "").trim();
          if (trendSym) {
            url += `&symbol=${encodeURIComponent(trendSym)}`;
          }
        } else {
          // If viewingAsset has a clean ticker (e.g. AAPL, JPL, RELIANCE)
          let sym = ticker || getStockTicker(viewingAsset.name, viewingAsset.category);
          if (sym && sym !== viewingAsset.name && /^[A-Z0-9.^=-]{1,15}$/.test(sym)) {
            if (viewingAsset.category === "Indian Equities" && !sym.endsWith(".NS") && !sym.endsWith(".BO")) {
              sym += ".NS";
            }
            url += `&symbol=${encodeURIComponent(sym)}`;
          }
        }

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Chart data unavailable (${res.status})`);
        }

        const data: StockChartResponse = await res.json();
        if (!data.success || !data.points || data.points.length === 0) {
          throw new Error("No chart data points returned");
        }

        setChartData((prev) => {
          if (prev && prevPriceRef.current !== null && prevPriceRef.current !== data.currentPrice) {
            if (data.currentPrice > prevPriceRef.current) {
              setPriceFlash("up");
            } else {
              setPriceFlash("down");
            }
            setTimeout(() => setPriceFlash(null), 1200);
          }
          prevPriceRef.current = data.currentPrice;
          return data;
        });
      } catch (err: any) {
        if (!silent) {
          setChartError(err.message || "Failed to load live chart");
        }
      } finally {
        if (!silent) setIsLoadingChart(false);
      }
    },
    [viewingAsset, marketStatus.isOpen]
  );

  // Initial load when modal opens or period changes (runs once on open or when switching period)
  useEffect(() => {
    if (viewingAsset) {
      prevPriceRef.current = viewingAsset.currentPrice;
      fetchChart(selectedPeriod, false);
    } else {
      setChartData(null);
      setHoveredPoint(null);
      setHoverPosition(null);
      setPriceFlash(null);
    }
  }, [viewingAsset, selectedPeriod, fetchChart]);

  // Real-time live polling every 30 seconds ONLY while that specific market is open and tab is visible
  useEffect(() => {
    if (!viewingAsset) return;

    // Multiple calls happen ONLY while this asset's market is open (never on closed/holiday or Mutual Funds)
    if (!marketStatus.isOpen || viewingAsset.category === "Mutual Funds") {
      return;
    }

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchChart(selectedPeriod, true);
      }
    }, 30000);

    return () => {
      window.clearInterval(pollInterval);
    };
  }, [viewingAsset, selectedPeriod, fetchChart, marketStatus.isOpen]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingAsset) {
        setViewingAsset(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingAsset, setViewingAsset]);



  // SVG Chart Geometry dimensions
  const chartWidth = 560;
  const chartHeight = 180;

  // Active price values (either hovered point or latest live quote)
  const activeCurrentPrice = chartData?.currentPrice ?? viewingAsset?.currentPrice ?? 0;
  const referencePrice = chartData?.previousClose || viewingAsset?.buyPrice || 0;

  const points = useMemo(() => {
    if (chartData?.points && chartData.points.length > 0) {
      return chartData.points;
    }
    if (viewingAsset) {
      const now = Math.floor(Date.now() / 1000);
      const prev = referencePrice || viewingAsset.buyPrice || activeCurrentPrice;
      return [
        { timestamp: now - 3600, date: "Prev", price: Number(prev.toFixed(2)) },
        { timestamp: now, date: "Live", price: Number(activeCurrentPrice.toFixed(2)) },
      ];
    }
    return [];
  }, [chartData, viewingAsset, referencePrice, activeCurrentPrice]);

  if (!viewingAsset) return null;

  const displayPrice = hoveredPoint ? hoveredPoint.price : activeCurrentPrice;

  // Change computation
  const periodStartPrice = chartData?.points?.[0]?.price || referencePrice;
  const baselineForChange = hoveredPoint ? periodStartPrice : referencePrice;
  const activeChange = displayPrice - baselineForChange;
  const activeChangePct = baselineForChange > 0 ? (activeChange / baselineForChange) * 100 : 0;
  const isPositive = activeChange >= 0;

  // Personal holdings computations with live CMP
  const isOwnedInPortfolio = viewingAsset.quantity > 0;
  const totalQuantity = viewingAsset.quantity;
  const avgBuyPrice = viewingAsset.buyPrice;
  const personalInvested = viewingAsset.investedAmount !== undefined && viewingAsset.investedAmount > 0
    ? viewingAsset.investedAmount
    : (totalQuantity * avgBuyPrice);
  const personalCurrentVal = totalQuantity * activeCurrentPrice;
  const personalPnl = personalCurrentVal - personalInvested;
  const personalPnlPct = personalInvested > 0 ? (personalPnl / personalInvested) * 100 : 0;
  const isPersonalPositive = personalPnl >= 0;

  // Day's Range and 52-Week Range
  const dayHigh = chartData?.dayHigh ?? Math.max(activeCurrentPrice, viewingAsset.currentPrice);
  const dayLow = chartData?.dayLow ?? Math.min(activeCurrentPrice, viewingAsset.currentPrice);
  const dayRangeSpan = dayHigh - dayLow;
  const daySliderPct =
    dayRangeSpan > 0 ? Math.min(100, Math.max(0, ((activeCurrentPrice - dayLow) / dayRangeSpan) * 100)) : 50;

  const fiftyTwoHigh = chartData?.fiftyTwoWeekHigh ?? dayHigh;
  const fiftyTwoLow = chartData?.fiftyTwoWeekLow ?? dayLow;
  const fiftyTwoSpan = fiftyTwoHigh - fiftyTwoLow;
  const fiftyTwoSliderPct =
    fiftyTwoSpan > 0 ? Math.min(100, Math.max(0, ((activeCurrentPrice - fiftyTwoLow) / fiftyTwoSpan) * 100)) : 50;

  let pathD = "";
  let areaD = "";
  let coordinates: { x: number; y: number; point: ChartPoint }[] = [];

  if (points.length >= 2) {
    const prices = points.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pad = (maxP - minP) * 0.08 || 1;
    const yMin = minP - pad;
    const yMax = maxP + pad;
    const ySpan = yMax - yMin || 1;

    coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1)) * chartWidth;
      const y = chartHeight - ((p.price - yMin) / ySpan) * chartHeight;
      return { x, y, point: p };
    });

    pathD = coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x.toFixed(2)},${curr.y.toFixed(2)}` : `${acc} L ${curr.x.toFixed(2)},${curr.y.toFixed(2)}`;
    }, "");

    areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  } else if (points.length === 1) {
    const p = points[0];
    const y = chartHeight / 2;
    coordinates = [
      { x: 0, y, point: p },
      { x: chartWidth, y, point: p },
    ];
    pathD = `M 0,${y.toFixed(2)} L ${chartWidth},${y.toFixed(2)}`;
    areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  }

  // Interactive mouse/touch scrubber handlers
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || coordinates.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = relX / rect.width;
    const index = Math.min(coordinates.length - 1, Math.max(0, Math.round(ratio * (coordinates.length - 1))));
    const match = coordinates[index];
    if (match) {
      setHoveredPoint(match.point);
      setHoverPosition({ x: match.x, y: match.y });
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPosition(null);
  };

  const isChartProfit = isOwnedInPortfolio ? isPersonalPositive : isPositive;
  const strokeColor = isChartProfit ? "#16a34a" : "#ef4444";
  const gradientId = `chartGrad_${viewingAsset.id}_${isChartProfit ? "gain" : "loss"}`;

  return (
    <div
      className="modal-overlay"
      onClick={() => setViewingAsset(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-detail-title"
    >
      <div
        className="investment-modal stock-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Logo, Identity, Market Status, Actions */}
        <div className="stock-detail-header">
          <div className="stock-detail-identity">
            <div className="apple-avatar-squircle" style={{ width: "48px", height: "48px", flexShrink: 0 }}>
              <StockLogoAvatar
                name={viewingAsset.name}
                ticker={ticker}
                category={viewingAsset.category}
              />
            </div>
            <div className="stock-detail-info">
              <div className="stock-detail-title-row">
                <h2 id="asset-detail-title" className="stock-detail-name">
                  {viewingAsset.name}
                </h2>
              </div>
              <div className="stock-detail-pills">
                <span className="apple-ticker-pill">{ticker}</span>
                <span className="apple-category-pill">{viewingAsset.category}</span>
                <MarketTimingBadge status={marketStatus} />
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit/Delete if owned, or Add Position if discovering */}
          <div className="stock-detail-top-actions">
            {isOwnedInPortfolio ? (
              <>
                <button
                  type="button"
                  className="stock-header-btn edit"
                  onClick={() => {
                    const assetToEdit = viewingAsset;
                    setViewingAsset(null);
                    startEditing(assetToEdit);
                  }}
                  title="Edit holding details"
                >
                  <Pencil size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="stock-header-btn delete"
                  onClick={() => {
                    const assetToDelete = viewingAsset;
                    setViewingAsset(null);
                    setDeletingAsset(assetToDelete);
                  }}
                  title="Delete holding from portfolio"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="stock-header-btn add-pos"
                  onClick={() => {
                    const toAdd = {
                      name: chartData?.name || viewingAsset.name,
                      category: viewingAsset.category,
                      price: activeCurrentPrice,
                      currency: viewingAsset.currency,
                    };
                    setViewingAsset(null);
                    openAddModalWithPrefill(toAdd);
                  }}
                  title="Track in your portfolio"
                >
                  <Plus size={13} />
                  <span>Track Holding</span>
                </button>
              </>
            )}
          </div>

          {/* Close button: always pinned in top right corner */}
          <button
            type="button"
            className="icon-button stock-modal-close-btn"
            onClick={() => setViewingAsset(null)}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content: Panoramic 2-Column Grid on Desktop */}
        <div className="stock-modal-panoramic-body">
          {/* Left Column: Price Header + Period Bar + Interactive Chart */}
          <div className="stock-modal-chart-col">
            {/* Live Hero Price Section */}
            <div className={`stock-hero-price-card ${priceFlash ? `flash-${priceFlash}` : ""}`}>
              <div className="stock-hero-price-row">
                <div className="stock-price-main">
                  <span className="stock-price-currency">
                    {viewingAsset.currency === "USD" ? "$" : "₹"}
                  </span>
                  <span className="stock-price-digits">
                    {viewingAsset.category === "Mutual Funds"
                      ? displayPrice.toFixed(4)
                      : displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className={`stock-change-badge ${isPositive ? "positive" : "negative"}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>
                    {isPositive ? "+" : ""}
                    {viewingAsset.currency === "USD" ? "$" : "₹"}
                    {Math.abs(activeChange).toFixed(viewingAsset.category === "Mutual Funds" ? 4 : 2)} (
                    {isPositive ? "+" : ""}
                    {activeChangePct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="stock-hero-subtext">
                {hoveredPoint ? (
                  <span className="stock-hover-timestamp">
                    Point: <strong>{hoveredPoint.date}</strong> · {viewingAsset.currency === "USD" ? "$" : "₹"}
                    {hoveredPoint.price.toFixed(2)}
                  </span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>
                      {viewingAsset.category === "Mutual Funds" ? "AMFI NAV" : "Current Market Price"} · Prev Close:{" "}
                      {viewingAsset.currency === "USD" ? "$" : "₹"}
                      {referencePrice.toFixed(2)}
                    </span>
                    {!marketStatus.isOpen && viewingAsset.category !== "Mutual Funds" && (
                      <span className="stock-market-closed-notice-pill">
                        ● Market is closed · {marketStatus.detail} (Single call made)
                      </span>
                    )}
                    {marketStatus.isOpen && viewingAsset.category !== "Mutual Funds" && (
                      <span className="stock-market-live-notice-pill">
                        ● Market is open · Live polling active
                      </span>
                    )}
                    {viewingAsset.category === "Mutual Funds" && (
                      <span className="stock-market-closed-notice-pill">
                        ● Daily NAV · Loaded once
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Segmented Period Tabs */}
            <div className="stock-period-segmented-bar">
              {PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`stock-period-tab ${selectedPeriod === period ? "active" : ""}`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Interactive SVG Chart Container */}
            <div
              className="stock-chart-wrapper"
              style={{
                background: "#f8f9fc",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                minHeight: "200px",
              }}
            >
              {isLoadingChart && !chartData && (
                <div
                  className="stock-chart-loading-overlay"
                  style={{
                    background: "#f8f9fc",
                    color: "#5e5e6e",
                    border: "none",
                  }}
                >
                  <RefreshCw size={24} className="spin-icon" style={{ color: "#9366FF" }} />
                  <span style={{ color: "#5e5e6e", fontWeight: 600 }}>Fetching real-time market data...</span>
                </div>
              )}

              {chartError && !chartData ? (
                <div className="stock-chart-error-banner">
                  <p>{chartError}</p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => fetchChart(selectedPeriod, false)}
                    style={{ marginTop: "8px", padding: "4px 12px", fontSize: "12px" }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="stock-svg-chart"
                  style={{ overflow: "hidden", display: "block", width: "100%" }}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  onTouchMove={(e) => {
                    if (e.touches[0] && svgRef.current) {
                      const rect = svgRef.current.getBoundingClientRect();
                      const relX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
                      const ratio = relX / rect.width;
                      const idx = Math.min(coordinates.length - 1, Math.max(0, Math.round(ratio * (coordinates.length - 1))));
                      const match = coordinates[idx];
                      if (match) {
                        setHoveredPoint(match.point);
                        setHoverPosition({ x: match.x, y: match.y });
                      }
                    }
                  }}
                  onTouchEnd={handleChartMouseLeave}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
                      <stop offset="85%" stopColor={strokeColor} stopOpacity="0.02" />
                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Chart Gradient Area */}
                  {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

                  {/* Chart Line Path */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Crosshair & Cursor Point */}
                  {hoverPosition && (
                    <g>
                      <line
                        x1={hoverPosition.x}
                        y1={0}
                        x2={hoverPosition.x}
                        y2={chartHeight}
                        stroke="var(--foreground-muted)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity={0.6}
                      />
                      <circle
                        cx={hoverPosition.x}
                        cy={hoverPosition.y}
                        r={7}
                        fill={strokeColor}
                        opacity={0.25}
                      />
                      <circle
                        cx={hoverPosition.x}
                        cy={hoverPosition.y}
                        r={4}
                        fill={strokeColor}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </g>
                  )}
                </svg>
              )}

              {/* Chart Period Date Range Footnote */}
              {points.length > 0 && (
                <div className="stock-chart-dates-footer">
                  <span>{points[0].date}</span>
                  <span>{points[points.length - 1].date}</span>
                </div>
              )}
            </div>

            {/* Market Key Statistics & Ranges (Moved to Left Side under Chart) */}
            <div className="stock-market-stats-section" style={{ marginTop: "8px" }}>
              <h3 className="stock-bento-title">
                <Activity size={15} /> Key Market Statistics
              </h3>

              <div className="stock-range-bars-container">
                <div className="stock-range-card">
                  <div className="range-title-row">
                    <span>Day Range</span>
                    <span className="range-current">
                      CMP: {viewingAsset.currency === "USD" ? "$" : "₹"}
                      {activeCurrentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="range-track-wrapper">
                    <div className="range-track">
                      <div
                        className="range-pin"
                        style={{ left: `${daySliderPct}%` }}
                        title={`Current: ${activeCurrentPrice}`}
                      />
                    </div>
                  </div>
                  <div className="range-labels-row">
                    <span>L: {viewingAsset.currency === "USD" ? "$" : "₹"}{dayLow.toFixed(2)}</span>
                    <span>H: {viewingAsset.currency === "USD" ? "$" : "₹"}{dayHigh.toFixed(2)}</span>
                  </div>
                </div>

                <div className="stock-range-card">
                  <div className="range-title-row">
                    <span>52-Week Range</span>
                    <span className="range-current">
                      Pos: {fiftyTwoSliderPct.toFixed(0)}% of 52W High
                    </span>
                  </div>
                  <div className="range-track-wrapper">
                    <div className="range-track">
                      <div
                        className="range-pin"
                        style={{ left: `${fiftyTwoSliderPct}%` }}
                        title={`Current: ${activeCurrentPrice}`}
                      />
                    </div>
                  </div>
                  <div className="range-labels-row">
                    <span>52W L: {viewingAsset.currency === "USD" ? "$" : "₹"}{fiftyTwoLow.toFixed(2)}</span>
                    <span>52W H: {viewingAsset.currency === "USD" ? "$" : "₹"}{fiftyTwoHigh.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme / Exchange Profile (Moved to Left Side to fill empty space) */}
            {viewingAsset.category === "Mutual Funds" ? (
              <div className="stock-bento-section" style={{ marginTop: "4px" }}>
                <h3 className="stock-bento-title">
                  <Landmark size={15} /> Mutual Fund Scheme Profile
                </h3>
                <div className="stock-bento-grid three-col">
                  <div className="stock-bento-card">
                    <span className="bento-label">Fund House / AMC</span>
                    <strong className="bento-value" style={{ fontSize: "13px" }}>
                      {chartData?.fundHouse || "AMFI Recognized"}
                    </strong>
                    <span className="bento-subtext">Asset Management Co</span>
                  </div>
                  <div className="stock-bento-card">
                    <span className="bento-label">Scheme Category</span>
                    <strong className="bento-value" style={{ fontSize: "13px" }}>
                      {chartData?.schemeCategory || "Growth / Equity"}
                    </strong>
                    <span className="bento-subtext">{chartData?.schemeType || "Open Ended"}</span>
                  </div>
                  <div className="stock-bento-card">
                    <span className="bento-label">AMFI Scheme Code</span>
                    <strong className="bento-value" style={{ fontSize: "13px" }}>
                      {chartData?.schemeCode || "Registered"}
                    </strong>
                    <span className="bento-subtext">{chartData?.isin || "Growth Option"}</span>
                  </div>
                </div>
              </div>
            ) : chartData?.exchange ? (
              <div className="stock-bento-section" style={{ marginTop: "4px" }}>
                <h3 className="stock-bento-title">
                  <Building2 size={15} /> Exchange & Security Profile
                </h3>
                <div className="stock-bento-grid three-col">
                  <div className="stock-bento-card">
                    <span className="bento-label">Exchange</span>
                    <strong className="bento-value" style={{ fontSize: "14px" }}>
                      {chartData.exchange}
                    </strong>
                    <span className="bento-subtext">Primary Listing</span>
                  </div>
                  <div className="stock-bento-card">
                    <span className="bento-label">Ticker Symbol</span>
                    <strong className="bento-value" style={{ fontSize: "14px" }}>
                      {chartData.symbol || ticker}
                    </strong>
                    <span className="bento-subtext">{viewingAsset.category}</span>
                  </div>
                  <div className="stock-bento-card">
                    <span className="bento-label">Trading Session</span>
                    <strong className="bento-value" style={{ fontSize: "14px" }}>
                      {chartData.marketState || "Regular Hours"}
                    </strong>
                    <span className="bento-subtext">Session Status</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Holdings / Investment Platforms & Profile */}
          <div className="stock-modal-stats-col">
            {/* If owned: Position Bento */}
            {isOwnedInPortfolio && (
              <div className="stock-bento-section">
                <h3 className="stock-bento-title">
                  <Wallet size={15} /> Your Investment Position
                </h3>

                <div className="stock-bento-grid">
                  {viewingAsset.brokerApp && (() => {
                    const brokerUrl = getBrokerDestinationUrl(
                      viewingAsset.brokerApp,
                      viewingAsset.name,
                      ticker,
                      viewingAsset.category
                    );
                    return (
                      <a
                        href={brokerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stock-bento-card stock-broker-nav-card"
                        title={`Open ${viewingAsset.brokerApp} website in new tab`}
                        style={{
                          textDecoration: "none",
                          cursor: "pointer",
                          display: "block",
                          color: "inherit",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="bento-label">Invested via App</span>
                          <ExternalLink size={12} style={{ color: "#9366FF" }} />
                        </div>
                        <strong className="bento-value" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", marginTop: "2px" }}>
                          <BrokerLogoAvatar brokerName={viewingAsset.brokerApp} size={18} />
                          <span>{viewingAsset.brokerApp}</span>
                        </strong>
                        <span className="bento-subtext" style={{ color: "#9366FF", fontWeight: 600 }}>
                          Open {viewingAsset.brokerApp} site ↗
                        </span>
                      </a>
                    );
                  })()}
                  <div className="stock-bento-card">
                    <span className="bento-label">Holdings Quantity</span>
                    <strong className="bento-value">
                      {totalQuantity.toFixed(totalQuantity % 1 === 0 ? 0 : 4)}{" "}
                      <span className="bento-unit">{viewingAsset.category === "Mutual Funds" ? "units" : "shares"}</span>
                    </strong>
                    <span className="bento-subtext">Registered in portfolio</span>
                  </div>

                  <div className="stock-bento-card">
                    <span className="bento-label">Average Buy Price</span>
                    <strong className="bento-value">
                      {viewingAsset.currency === "USD" ? "$" : "₹"}
                      {avgBuyPrice.toFixed(2)}
                    </strong>
                    <span className="bento-subtext">Cost basis per unit</span>
                  </div>

                  <div className="stock-bento-card">
                    <span className="bento-label">Total Invested</span>
                    <strong className="bento-value">{money(personalInvested, viewingAsset.currency)}</strong>
                    <span className="bento-subtext">Principal committed</span>
                  </div>

                  <div className="stock-bento-card highlight">
                    <span className="bento-label">Current Valuation</span>
                    <strong className="bento-value">{money(personalCurrentVal, viewingAsset.currency)}</strong>
                    {viewingAsset.currency === "USD" && showUsdInRupees ? (
                      <span className="bento-subtext">${personalCurrentVal.toFixed(2)} USD</span>
                    ) : (
                      <span className="bento-subtext">Live value @ CMP</span>
                    )}
                  </div>

                  <div className={`stock-bento-card span-2 ${isPersonalPositive ? "gain" : "loss"}`}>
                    <div className="bento-pnl-header">
                      <span className="bento-label">Total Net Return (P&L)</span>
                      <span className={`bento-pnl-tag ${isPersonalPositive ? "positive" : "negative"}`}>
                        {isPersonalPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {isPersonalPositive ? "+" : ""}
                        {personalPnlPct.toFixed(2)}%
                      </span>
                    </div>
                    <strong className="bento-value pnl">
                      {isPersonalPositive ? "+" : ""}
                      {money(personalPnl, viewingAsset.currency)}
                    </strong>
                    <span className="bento-subtext">
                      Unrealized gain / loss across all {totalQuantity.toFixed(totalQuantity % 1 === 0 ? 0 : 4)} units
                    </span>
                  </div>

                  {viewingAsset.isSip && (
                    <div className="stock-bento-card span-2 sip-card">
                      <div className="bento-pnl-header">
                        <span className="bento-label">
                          <Repeat size={13} /> Automated SIP Schedule
                        </span>
                        <span className={`apple-sip-pill ${viewingAsset.sipStatus === "paused" ? "paused" : "active"}`}>
                          {viewingAsset.sipStatus === "paused" ? "Paused" : "Active Monthly SIP"}
                        </span>
                      </div>
                      <div className="bento-sip-body">
                        <div>
                          <strong>{money(viewingAsset.sipAmount || 0, viewingAsset.currency)}</strong>
                          <span> / month</span>
                        </div>
                        <div className="bento-sip-schedule-info">
                          <span>Debit Day: <strong>{viewingAsset.sipDay || 5}th of month</strong></span>
                          <span>Next Auto-Debit: <strong>{getNextSipDate(viewingAsset.sipDay || 5)}</strong></span>
                          <span>Completed: <strong>{viewingAsset.sipInstallments || 1} installments</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Direct Investment Section when not owned */}
            {!isOwnedInPortfolio && (
              <div id="stock-invest-platforms-section" className="stock-bento-section stock-invest-now-section">
                <div className="stock-invest-header">
                  <div className="stock-invest-title-row">
                    <h3 className="stock-bento-title" style={{ margin: 0 }}>
                      <ExternalLink size={15} /> Want to invest now?
                    </h3>
                    <span className="stock-invest-badge">Direct Investment</span>
                  </div>
                  <p className="stock-invest-subtitle">
                    Select a verified investment app to buy <strong>{ticker || viewingAsset.name}</strong> directly on their live platform:
                  </p>
                </div>

                <div className="stock-invest-grid">
                  {categoryBrokers.map((broker) => {
                    const destUrl = broker.getUrl(viewingAsset.name, ticker, viewingAsset.category);
                    return (
                      <a
                        key={broker.id}
                        href={destUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stock-invest-app-tile"
                        title={`Invest in ${ticker || viewingAsset.name} via ${broker.name}`}
                      >
                        <div className="stock-invest-app-left">
                          <BrokerLogoAvatar brokerName={broker.name} size={24} />
                          <span className="stock-invest-app-name">{broker.name}</span>
                        </div>
                        <ExternalLink size={12} className="stock-invest-app-arrow" />
                      </a>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

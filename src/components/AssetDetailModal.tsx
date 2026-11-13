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
  Briefcase,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { StockLogoAvatar, getStockTicker, BrokerLogoAvatar } from "@/components/Logos";
import { getBrokersForCategory, getBrokerDestinationUrl } from "@/utils/brokers";
import { MarketTimingBadge } from "@/components/MarketBadge";
import { getNextSipDate } from "@/utils/sip";
import { AssetPosition } from "@/types/portfolio";
import { useAnimatedModal } from "@/hooks/useAnimatedModal";

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

// Smooth Catmull-Rom to Cubic Bezier spline generator for natural organic mountain waves
function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)},${pts[1].y.toFixed(2)}`;

  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const tension = 0.18;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function AssetDetailModal() {
  const { viewingAsset } = usePortfolio();
  const { shouldRender, isClosing, displayValue } = useAnimatedModal(viewingAsset);

  if (!shouldRender || !displayValue) return null;
  return <AssetDetailModalInner viewingAsset={displayValue} isClosing={isClosing} />;
}

function AssetDetailModalInner({
  viewingAsset,
  isClosing,
}: {
  viewingAsset: AssetPosition;
  isClosing: boolean;
}) {
  const {
    setViewingAsset,
    startEditing,
    setDeletingAsset,
    money,
    indianMarket,
    usMarket,
    showUsdInRupees,
    openAddModalWithPrefill,
    syncAssetCurrentPrice,
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

        if (
          data.currentPrice &&
          data.currentPrice > 0 &&
          !viewingAsset.id.startsWith("trending-") &&
          Math.abs(viewingAsset.currentPrice - data.currentPrice) > 0.0001
        ) {
          syncAssetCurrentPrice(viewingAsset.id, data.currentPrice);
        }
      } catch (err: any) {
        if (!silent) {
          setChartError(err.message || "Failed to load live chart");
        }
      } finally {
        if (!silent) setIsLoadingChart(false);
      }
    },
    [viewingAsset, marketStatus.isOpen, syncAssetCurrentPrice]
  );

  const fetchChartRef = useRef(fetchChart);
  fetchChartRef.current = fetchChart;
  const viewingAssetId = viewingAsset?.id || null;

  // Initial load when modal opens or period changes (runs once per opened asset or period switch)
  useEffect(() => {
    if (viewingAssetId) {
      prevPriceRef.current = viewingAsset?.currentPrice ?? null;
      void fetchChartRef.current(selectedPeriod, false);
    } else {
      setChartData(null);
      setHoveredPoint(null);
      setHoverPosition(null);
      setPriceFlash(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingAssetId, selectedPeriod]);

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
  const chartWidth = 640;
  const chartHeight = 220;

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
  let secondaryPathD = "";
  let secondaryAreaD = "";
  let coordinates: { x: number; y: number; point: ChartPoint }[] = [];

  if (points.length >= 2) {
    const prices = points.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceSpan = (maxP - minP) || 1;
    // Generous top headroom for black tooltip pill and bottom space for volume bars
    const yMin = minP - priceSpan * 0.12;
    const yMax = maxP + priceSpan * 0.35;
    const ySpan = yMax - yMin || 1;

    coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1)) * chartWidth;
      const y = chartHeight - ((p.price - yMin) / ySpan) * chartHeight;
      return { x, y, point: p };
    });

    pathD = buildSmoothPath(coordinates);
    areaD = pathD ? `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : "";

    // Secondary rolling hill wave in background
    const secondaryCoordinates = coordinates.map((c, i) => {
      const progress = i / (coordinates.length - 1);
      const wave = Math.sin(progress * Math.PI * 2.2) * 20 + Math.cos(progress * Math.PI * 1.4) * 12;
      const ySec = Math.min(chartHeight - 16, Math.max(36, c.y * 0.72 + chartHeight * 0.2 + wave));
      return { x: c.x, y: ySec };
    });
    secondaryPathD = buildSmoothPath(secondaryCoordinates);
    secondaryAreaD = secondaryPathD ? `${secondaryPathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : "";
  } else if (points.length === 1) {
    const p = points[0];
    const y = chartHeight * 0.55;
    coordinates = [
      { x: 0, y, point: p },
      { x: chartWidth, y, point: p },
    ];
    pathD = `M 0,${y.toFixed(2)} L ${chartWidth},${y.toFixed(2)}`;
    areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  }

  // Volume bars for chart base
  const volumeBars = useMemo(() => {
    const barCount = 36;
    const barWidth = 3.5;
    const gap = (chartWidth - barCount * barWidth) / (barCount - 1);
    return Array.from({ length: barCount }, (_, i) => {
      const x = i * (barWidth + gap);
      const wave = Math.sin(i * 0.42) * 0.35 + Math.sin(i * 1.15) * 0.25 + 0.5;
      const height = 10 + wave * 26;
      return { x, width: barWidth, height };
    });
  }, [chartWidth]);

  // Find peak coordinate to highlight by default if not hovering
  const highestIndex = useMemo(() => {
    if (points.length === 0) return 0;
    return points.reduce((maxIdx, p, idx, arr) => (p.price > arr[maxIdx].price ? idx : maxIdx), 0);
  }, [points]);

  const lastCoordinate = coordinates.length > 0 ? coordinates[coordinates.length - 1] : null;
  const peakCoordinate = coordinates[highestIndex] || lastCoordinate;
  const activeHighlightCoord = hoverPosition && hoveredPoint
    ? { x: hoverPosition.x, y: hoverPosition.y, point: hoveredPoint }
    : peakCoordinate;

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
  const strokeColor = isChartProfit ? "#059669" : "#dc2626";
  const gradientId = `chartGrad_${viewingAsset.id}_${isChartProfit ? "gain" : "loss"}`;
  const formatUnits = (q: number) => {
    if (!Number.isFinite(q)) return "0";
    if (Math.abs(q - Math.round(q)) < 1e-8) return String(Math.round(q));
    return Number(q.toFixed(6)).toString();
  };

  return (
    <div
      className={`modal-overlay${isClosing ? " closing" : ""}`}
      onClick={() => setViewingAsset(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-detail-title"
    >
      <div
        className="investment-modal stock-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Inline Logo, Name, Pills + Edit/Delete/Close */}
        <div className="stock-detail-header">
          <div className="stock-detail-identity">
            <div className="apple-avatar-squircle" style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px" }}>
              <StockLogoAvatar
                name={viewingAsset.name}
                ticker={ticker}
                category={viewingAsset.category}
              />
            </div>
            <div className="stock-detail-info-inline">
              <h2 id="asset-detail-title" className="stock-detail-name">
                {viewingAsset.name}
              </h2>
              <div className="stock-detail-pills">
                <span className="apple-ticker-pill">{ticker}</span>
                <span className="apple-category-pill">{viewingAsset.category}</span>
                <MarketTimingBadge status={marketStatus} />
              </div>
            </div>
          </div>

          {/* Action Buttons + Close */}
          <div className="stock-detail-top-actions">
            {isOwnedInPortfolio ? (
              <>
                <button
                  type="button"
                  className="stock-header-btn edit ios-liquid-btn ios-liquid-btn--edit"
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
                  className="stock-header-btn delete ios-liquid-btn ios-liquid-btn--delete"
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
              <button
                type="button"
                className="stock-header-btn add-pos ios-liquid-btn ios-liquid-btn--add"
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
            )}

            <button
              type="button"
              className="icon-button stock-modal-close-btn"
              onClick={() => setViewingAsset(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="stock-modal-header-divider" />

        {/* Upper Panoramic 2-Column Body: Left (Price & Trajectory Chart) | Right (Your Investment Position) */}
        <div className="stock-modal-panoramic-body">
          {/* Left Column: Hero Price + Status + Unified Chart Card */}
          <div className="stock-modal-chart-col">
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
                  {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>
                    {isPositive ? "+" : "-"}
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
                  <div className="stock-hero-meta-stack">
                    <span>
                      {viewingAsset.category === "Mutual Funds" ? "AMFI NAV" : "Current Market Price"} • Prev Close:{" "}
                      {viewingAsset.currency === "USD" ? "$" : "₹"}
                      {referencePrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Unified Neo-Card Chart Container with Period Bar + Glowing Layers + Footer */}
            <div className="stock-unified-chart-card">
              {/* Top Bar matching screenshot */}
              <div className="stock-chart-top-bar">
                {/* Left: Trend Icon Pill */}
                <div className="stock-chart-trend-icon-pill" title="Price Trajectory">
                  <TrendingUp size={18} strokeWidth={2.4} />
                </div>

                {/* Center: Segmented Period Bar with glowing active dot */}
                <div className="stock-period-segmented-bar">
                  {PERIODS.map((period) => {
                    const isActive = selectedPeriod === period;
                    return (
                      <button
                        key={period}
                        type="button"
                        className={`stock-period-tab ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedPeriod(period)}
                      >
                        {isActive && <span className="stock-period-glow-dot" aria-hidden="true" />}
                        <span>{period}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Floating Change Badge */}
                <div className={`stock-chart-return-badge ${isPositive ? "positive" : "negative"}`}>
                  {isPositive ? <TrendingUp size={14} strokeWidth={2.6} /> : <TrendingDown size={14} />}
                  <span>
                    {isPositive ? "+" : ""}
                    {activeChangePct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="stock-chart-svg-wrap">
                {isLoadingChart && !chartData && (
                  <div className="stock-chart-loading-overlay">
                    <RefreshCw size={24} className="spin-icon" style={{ color: "#059669" }} />
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
                    style={{ overflow: "visible", display: "block", width: "100%" }}
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
                      {/* Primary Foreground Wave Gradient */}
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.48" />
                        <stop offset="42%" stopColor="#34D399" stopOpacity="0.22" />
                        <stop offset="82%" stopColor="#6EE7B7" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                      </linearGradient>

                      {/* Secondary Background Rolling Hill Gradient */}
                      <linearGradient id="secondaryWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
                        <stop offset="50%" stopColor="#10B981" stopOpacity="0.09" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                      </linearGradient>

                      {/* Base Volume Bars Gradient */}
                      <linearGradient id="volumeBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#004643" stopOpacity="0.03" />
                      </linearGradient>

                      {/* Filter for glowing neon emerald stroke */}
                      <filter id="primaryLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10B981" floodOpacity="0.4" />
                      </filter>
                    </defs>

                    {/* Faint dashed horizontal reference lines */}
                    {[0.28, 0.52, 0.76].map((pct) => (
                      <line
                        key={pct}
                        x1={0}
                        y1={chartHeight * pct}
                        x2={chartWidth}
                        y2={chartHeight * pct}
                        stroke="rgba(0, 70, 67, 0.05)"
                        strokeDasharray="4 6"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Base Volume Pill Bars */}
                    <g className="stock-chart-volume-bars" opacity="0.42">
                      {volumeBars.map((bar, idx) => (
                        <rect
                          key={idx}
                          x={bar.x}
                          y={chartHeight - bar.height}
                          width={bar.width}
                          height={bar.height}
                          rx={bar.width / 2}
                          fill="url(#volumeBarGrad)"
                        />
                      ))}
                    </g>

                    {/* Secondary Background Rolling Hill Wave */}
                    {secondaryAreaD && (
                      <path d={secondaryAreaD} fill="url(#secondaryWaveGrad)" />
                    )}
                    {secondaryPathD && (
                      <path
                        d={secondaryPathD}
                        fill="none"
                        stroke="#14B8A6"
                        strokeWidth="1.6"
                        strokeOpacity="0.32"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Primary Foreground Wave Area */}
                    {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

                    {/* Primary Foreground Glowing Curve Stroke */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#primaryLineGlow)"
                      />
                    )}

                    {/* Resting Endpoint Glowing Neon Ring (Right side) */}
                    {lastCoordinate && activeHighlightCoord !== lastCoordinate && (
                      <g>
                        <circle
                          cx={lastCoordinate.x}
                          cy={lastCoordinate.y}
                          r="11"
                          fill="#10B981"
                          opacity="0.25"
                        />
                        <circle
                          cx={lastCoordinate.x}
                          cy={lastCoordinate.y}
                          r="5.5"
                          fill="#004643"
                          stroke="#10B981"
                          strokeWidth="2.4"
                        />
                        <circle
                          cx={lastCoordinate.x}
                          cy={lastCoordinate.y}
                          r="1.8"
                          fill="#FFFFFF"
                        />
                      </g>
                    )}

                    {/* Highlighted Data Point (Hovered or Peak) with Black Tooltip Pill */}
                    {activeHighlightCoord && (
                      <g className="stock-chart-active-highlight">
                        {/* Vertical Dashed Guideline */}
                        <line
                          x1={activeHighlightCoord.x}
                          y1={activeHighlightCoord.y}
                          x2={activeHighlightCoord.x}
                          y2={chartHeight}
                          stroke="rgba(0, 70, 67, 0.22)"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />

                        {/* Floating Black Pill Tooltip above point */}
                        <g transform={`translate(${Math.max(52, Math.min(chartWidth - 52, activeHighlightCoord.x))}, ${activeHighlightCoord.y - 12})`}>
                          {/* Downward triangle caret pointer */}
                          <polygon
                            points="-5,-2 5,-2 0,4"
                            fill="#061D1A"
                          />
                          {/* Rounded rect pill */}
                          <rect
                            x="-50"
                            y="-30"
                            width="100"
                            height="28"
                            rx="14"
                            fill="#061D1A"
                            filter="drop-shadow(0 4px 10px rgba(0, 0, 0, 0.32))"
                          />
                          {/* Tooltip text */}
                          <text
                            x="0"
                            y="-14"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="12.5"
                            fontWeight="700"
                            letterSpacing="-0.2px"
                            dominantBaseline="middle"
                          >
                            {viewingAsset.currency === "USD" ? "$" : "₹"}
                            {activeHighlightCoord.point.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </text>
                        </g>

                        {/* Radiant Glowing Neon Aura around the point */}
                        <circle
                          cx={activeHighlightCoord.x}
                          cy={activeHighlightCoord.y}
                          r="13"
                          fill="#10B981"
                          opacity="0.35"
                        />
                        <circle
                          cx={activeHighlightCoord.x}
                          cy={activeHighlightCoord.y}
                          r="6.5"
                          fill="#004643"
                          stroke="#10B981"
                          strokeWidth="2.8"
                        />
                        <circle
                          cx={activeHighlightCoord.x}
                          cy={activeHighlightCoord.y}
                          r="2"
                          fill="#FFFFFF"
                        />
                      </g>
                    )}
                  </svg>
                )}
              </div>

              {/* Chart Footer matching screenshot */}
              {points.length > 0 && (
                <div className="stock-chart-dates-footer">
                  <div className="stock-chart-footer-item">
                    <Calendar size={14} className="stock-chart-footer-icon" />
                    <span>{points[0].date}</span>
                  </div>

                  <div className="stock-chart-footer-cmp-pill">
                    <Briefcase size={14} className="stock-chart-footer-cmp-icon" />
                    <span>
                      {viewingAsset.category === "Mutual Funds" ? "NAV" : "CMP"}:{" "}
                      <strong>
                        {viewingAsset.currency === "USD" ? "$" : "₹"}
                        {displayPrice.toFixed(viewingAsset.category === "Mutual Funds" ? 4 : 2)}
                      </strong>
                    </span>
                  </div>

                  <div className="stock-chart-footer-item">
                    <span>{points[points.length - 1].date}</span>
                    <Calendar size={14} className="stock-chart-footer-icon" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Outer Card Wrapping "Your Investment Position" */}
          <div className="stock-modal-stats-col">
            {isOwnedInPortfolio ? (
              <div className="stock-position-outer-card">
                <div className="stock-position-header-row">
                  <h3 className="stock-position-title">
                    <Wallet size={16} style={{ color: "#2563eb" }} /> Your Investment Position
                  </h3>
                  <span className="stock-ledger-pill">{viewingAsset.currency} LEDGER</span>
                </div>

                {/* Full-Width Broker Banner */}
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
                      className="stock-position-broker-banner"
                      title={`Open ${viewingAsset.brokerApp} website in new tab`}
                    >
                      <div className="stock-position-broker-left">
                        <span className="bento-label">Invested via App</span>
                        <div className="stock-position-broker-brand">
                          <BrokerLogoAvatar brokerName={viewingAsset.brokerApp} size={20} />
                          <strong>{viewingAsset.brokerApp}</strong>
                        </div>
                      </div>
                      <span className="stock-position-broker-link">
                        Open {viewingAsset.brokerApp} site <ExternalLink size={12} />
                      </span>
                    </a>
                  );
                })()}

                {/* 2x2 Bento Stat Grid */}
                <div className="stock-bento-grid">
                  <div className="stock-bento-card">
                    <span className="bento-label">Holdings Quantity</span>
                    <strong className="bento-value">
                      {formatUnits(totalQuantity)}{" "}
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

                  <div className="stock-bento-card">
                    <span className="bento-label">Current Valuation</span>
                    <strong className="bento-value">{money(personalCurrentVal, viewingAsset.currency)}</strong>
                    {viewingAsset.currency === "USD" && showUsdInRupees ? (
                      <span className="bento-subtext">${personalCurrentVal.toFixed(2)} USD</span>
                    ) : (
                      <span className="bento-subtext">Live value at CMP</span>
                    )}
                  </div>
                </div>

                {/* Full-Width Total Net Return Banner */}
                <div className={`stock-net-return-banner ${isPersonalPositive ? "gain" : "loss"}`}>
                  <div className="stock-net-return-top">
                    <div>
                      <span className="bento-label">Total Net Return (P&L)</span>
                      <div className="stock-net-return-amount">
                        {isPersonalPositive ? "+" : ""}
                        {money(personalPnl, viewingAsset.currency)}
                      </div>
                    </div>
                    <span className={`stock-net-return-pill ${isPersonalPositive ? "positive" : "negative"}`}>
                      {isPersonalPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isPersonalPositive ? "+" : ""}
                      {personalPnlPct.toFixed(2)}%
                    </span>
                  </div>
                  <span className="bento-subtext">
                    Unrealized {isPersonalPositive ? "profit" : "loss"} across all {formatUnits(totalQuantity)} units
                  </span>
                </div>

                {viewingAsset.isSip && (
                  <div className="stock-bento-card sip-card" style={{ marginTop: "10px" }}>
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
            ) : (
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

        <div className="stock-modal-header-divider" />

        {/* Full-Width Bottom Section 1: Key Market Statistics */}
        <div className="stock-market-stats-section">
          <h3 className="stock-bento-title">
            <Activity size={15} style={{ color: "#2563eb" }} /> Key Market Statistics
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
                <div className="range-track gradient-track">
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
                <div className="range-track gradient-track">
                  <div
                    className="range-pin pin-blue"
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

        {/* Full-Width Bottom Section 2: Exchange & Security Profile (or MF Profile) */}
        {viewingAsset.category === "Mutual Funds" ? (
          <div className="stock-bento-section">
            <h3 className="stock-bento-title">
              <Landmark size={15} style={{ color: "#2563eb" }} /> Mutual Fund Scheme Profile
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
          <div className="stock-bento-section">
            <h3 className="stock-bento-title">
              <Building2 size={15} style={{ color: "#2563eb" }} /> Exchange & Security Profile
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
    </div>
  );
}

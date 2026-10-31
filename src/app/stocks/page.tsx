"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChartNoAxesCombined,
  Building2,
  Globe,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Header } from "@/components/Header";
import { DynamicIsland } from "@/components/DynamicIsland";
import { PortfolioModals } from "@/components/Modals";
import { HoldingsTableAndCards } from "@/components/HoldingsTableAndCards";
import { TrendingSection } from "@/components/TrendingSection";

export default function StocksPage() {
  const {
    equities,
    stocksCurrent,
    stocksInvested,
    stocksPnl,
    stocksPnlPct,
    indianVal,
    usVal,
    pctIndian,
    pctUS,
    usdInrRate,
    money,
    isRefreshingPrices,
    handleRefreshPrices,
    priceRefreshMessage,
  } = usePortfolio();

  const [showSidePanel, setShowSidePanel] = useState(true);
  const [stockSubTab, setStockSubTab] = useState<"all" | "indian" | "us">("all");

  const indianAssets = useMemo(
    () => equities.filter((a) => a.category === "Indian Equities"),
    [equities]
  );
  const usAssets = useMemo(
    () => equities.filter((a) => a.category === "US Stocks"),
    [equities]
  );

  const displayedStocks = useMemo(() => {
    if (stockSubTab === "indian") return indianAssets;
    if (stockSubTab === "us") return usAssets;
    return equities;
  }, [stockSubTab, indianAssets, usAssets, equities]);

  const filterTabs = [
    {
      key: "all",
      label: "All Stocks",
      count: equities.length,
      icon: <ChartNoAxesCombined size={13} />,
    },
    {
      key: "indian",
      label: "NSE / BSE India",
      count: indianAssets.length,
      icon: <Building2 size={13} />,
    },
    {
      key: "us",
      label: "US Equities",
      count: usAssets.length,
      icon: <Globe size={13} />,
    },
  ];

  return (
    <main className="apple-portfolio-app">
      {/* 1. Capsule Header with Route Pill Switcher */}
      <Header
        showSidePanel={showSidePanel}
        setShowSidePanel={setShowSidePanel}
      />

      {/* 2. Floating Session Live Prices Notification */}
      <DynamicIsland />

      {/* 3. Main Stage Layout */}
      <div
        className={`apple-stage-layout ${
          showSidePanel ? "with-sidebar" : "full-width"
        }`}
      >
        {/* Left Side Inspiration Panel (Desktop only, naturally feathered & dissolved) */}
        {showSidePanel && (
          <aside className="apple-side-panel">
            <img
              src="/side-panel-image.png"
              alt="MyWealth Portfolio Vision"
              className="apple-panel-img"
            />
          </aside>
        )}

        <section className="apple-content-stage">
          {/* EQUITIES TAB HERO */}
          <div className="apple-bento-hero">
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <span className="apple-hero-eyebrow">
                  EQUITIES & STOCKS PORTFOLIO
                </span>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || equities.length === 0}
                  title="Fetch live market quotes for all stock holdings"
                >
                  <RefreshCw
                    size={13}
                    className={isRefreshingPrices ? "refresh-spinning" : ""}
                  />
                  <span>
                    {isRefreshingPrices ? "Updating…" : "Refresh Prices"}
                  </span>
                </button>
              </div>

              <div className="apple-hero-main-val">
                <span className="apple-hero-val-text">{money(stocksCurrent)}</span>
              </div>

              <div className="apple-hero-return-row">
                <div
                  className={`apple-hero-return-badge ${
                    stocksPnl >= 0 ? "positive" : "negative"
                  }`}
                >
                  {stocksPnl >= 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}
                  <span>
                    {stocksPnl >= 0 ? `+${money(stocksPnl)}` : money(stocksPnl)}{" "}
                    (
                    {stocksPnlPct >= 0
                      ? `+${stocksPnlPct.toFixed(2)}%`
                      : `${stocksPnlPct.toFixed(2)}%`}
                    ) Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  {priceRefreshMessage || `Invested: ${money(stocksInvested)}`}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Total Equities</span>
                  <span className="apple-stat-chip-val">
                    {equities.length} Companies
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Indian Stocks</span>
                  <span className="apple-stat-chip-val">
                    {indianAssets.length} Holdings ({money(indianVal)})
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">US Stocks</span>
                  <span className="apple-stat-chip-val">
                    {usAssets.length} Holdings ($
                    {(usVal / usdInrRate).toFixed(2)} USD)
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Equity Share</span>
                  <span className="apple-stat-chip-val">
                    {(pctIndian + pctUS).toFixed(1)}% of Net Worth
                  </span>
                </div>
              </div>
            </div>

            {/* Equities Diversification Bento Card */}
            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Equities Diversification</h3>
                  <p className="apple-alloc-sub">Geographic & exchange exposure</p>
                </div>
                <span className="apple-alloc-badge">
                  {equities.length} Stocks
                </span>
              </div>

              {/* Multi-segment Spectrum Bar for Equities */}
              <div className="apple-spectrum-bar-wrap" style={{ marginTop: "8px" }}>
                <div className="apple-spectrum-bar">
                  {stocksCurrent > 0 && indianVal > 0 && (
                    <div
                      className="apple-spectrum-segment seg-indian"
                      style={{
                        width: `${((indianVal / stocksCurrent) * 100).toFixed(1)}%`,
                      }}
                      title={`NSE/BSE: ${((indianVal / stocksCurrent) * 100).toFixed(1)}%`}
                    />
                  )}
                  {stocksCurrent > 0 && usVal > 0 && (
                    <div
                      className="apple-spectrum-segment seg-us"
                      style={{
                        width: `${((usVal / stocksCurrent) * 100).toFixed(1)}%`,
                      }}
                      title={`NASDAQ/NYSE: ${((usVal / stocksCurrent) * 100).toFixed(1)}%`}
                    />
                  )}
                </div>
              </div>

              <div className="apple-alloc-rows" style={{ marginTop: "12px" }}>
                <div
                  className="apple-alloc-item"
                  onClick={() => setStockSubTab("indian")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-indian" />
                    <div>
                      <span className="apple-alloc-name">
                        NSE / BSE Equities (India)
                      </span>
                      <span className="apple-alloc-pct">
                        {stocksCurrent > 0
                          ? ((indianVal / stocksCurrent) * 100).toFixed(1)
                          : 0}
                        % of equities ({indianAssets.length} holdings)
                      </span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(indianVal)}</span>
                </div>

                <div
                  className="apple-alloc-item"
                  onClick={() => setStockSubTab("us")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="apple-alloc-item-left">
                    <span className="apple-alloc-dot dot-us" />
                    <div>
                      <span className="apple-alloc-name">
                        NASDAQ / NYSE Equities (US)
                      </span>
                      <span className="apple-alloc-pct">
                        {stocksCurrent > 0
                          ? ((usVal / stocksCurrent) * 100).toFixed(1)
                          : 0}
                        % of equities ({usAssets.length} holdings)
                      </span>
                    </div>
                  </div>
                  <span className="apple-alloc-val">{money(usVal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STOCKS TABLE & CARDS SECTION */}
          <HoldingsTableAndCards
            assets={displayedStocks}
            filterTabs={filterTabs}
            activeFilterTab={stockSubTab}
            onFilterTabChange={(key) =>
              setStockSubTab(key as "all" | "indian" | "us")
            }
            emptyTitle="No stock positions found"
            emptyDescription="Add an Indian or US equity position or search for another ticker."
            defaultAddCategory={
              stockSubTab === "us" ? "US Stocks" : "Indian Equities"
            }
          />

          {/* TRENDING STOCKS TODAY (TOP 10 LIVE MOVERS) */}
          <TrendingSection type="stocks" />
        </section>
      </div>

      {/* 4. Bottom Footer Glass Pill */}
      <footer className="apple-canvas-footer">
        <div className="apple-footer-pill">
          <span className="apple-footer-dot" />
          <span>MyWealth • Real-time Portfolio & Market Intelligence</span>
        </div>
      </footer>

      {/* Modals Container */}
      <PortfolioModals />
    </main>
  );
}

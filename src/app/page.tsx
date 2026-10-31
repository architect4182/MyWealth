"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Header } from "@/components/Header";
import { DynamicIsland } from "@/components/DynamicIsland";
import { PortfolioModals } from "@/components/Modals";
import { HoldingsTableAndCards } from "@/components/HoldingsTableAndCards";
import { MarketTimingBadge } from "@/components/MarketBadge";

export default function Home() {
  const {
    assets,
    equities,
    mutualFunds,
    totalCurrentINR,
    totalInvestedINR,
    totalPnlINR,
    totalReturnPct,
    indianVal,
    usVal,
    mfVal,
    pctIndian,
    pctUS,
    pctMF,
    pctGold,
    usdInrRate,
    indianMarket,
    usMarket,
    money,
    isRefreshingPrices,
    handleRefreshPrices,
    priceRefreshMessage,
  } = usePortfolio();

  const [showSidePanel, setShowSidePanel] = useState(true);
  const [overviewSubTab, setOverviewSubTab] = useState<"all" | "stocks" | "mf">("all");

  const displayedAssets = useMemo(() => {
    if (overviewSubTab === "stocks") return equities;
    if (overviewSubTab === "mf") return mutualFunds;
    return assets;
  }, [overviewSubTab, equities, mutualFunds, assets]);

  const filterTabs = [
    {
      key: "all",
      label: "All Assets",
      count: assets.length,
      icon: <LayoutDashboard size={13} />,
    },
    {
      key: "stocks",
      label: "Stocks",
      count: equities.length,
      icon: <ChartNoAxesCombined size={13} />,
    },
    {
      key: "mf",
      label: "Mutual Funds",
      count: mutualFunds.length,
      icon: <Wallet size={13} />,
    },
  ];

  return (
    <main className="apple-portfolio-app">
      {/* 1. Apple Floating Capsule Header with Route Nav */}
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
          {/* OVERVIEW BENTO HERO STAGE */}
          <div className="apple-bento-hero">
            {/* Bento Card 1: Apple Wallet Net Worth Showcase */}
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <div className="apple-eyebrow-row">
                  <span className="apple-hero-eyebrow">PORTFOLIO VALUATION</span>
                  <MarketTimingBadge
                    status={
                      indianMarket.isOpen
                        ? indianMarket
                        : usMarket.isOpen
                        ? usMarket
                        : indianMarket
                    }
                  />
                </div>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || assets.length === 0}
                  title="Fetch live market quotes for all holdings"
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
                <span className="apple-hero-val-text">
                  {money(totalCurrentINR)}
                </span>
              </div>

              <div className="apple-hero-return-row">
                <div
                  className={`apple-hero-return-badge ${
                    totalPnlINR >= 0 ? "positive" : "negative"
                  }`}
                >
                  {totalPnlINR >= 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}
                  <span>
                    {totalPnlINR >= 0 ? `+${money(totalPnlINR)}` : money(totalPnlINR)}{" "}
                    (
                    {totalReturnPct >= 0
                      ? `+${totalReturnPct.toFixed(2)}%`
                      : `${totalReturnPct.toFixed(2)}%`}
                    ) All-Time Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  {priceRefreshMessage || "Live valuations synced with market"}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Total Invested</span>
                  <span className="apple-stat-chip-val">
                    {money(totalInvestedINR)}
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Active Holdings</span>
                  <span className="apple-stat-chip-val">
                    {assets.length} Assets
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">US Exposure</span>
                  <span className="apple-stat-chip-val">
                    ${(usVal / usdInrRate).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Apple Spectrum Allocation Visualizer */}
            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Asset Allocation</h3>
                  <p className="apple-alloc-sub">Multi-class portfolio distribution</p>
                </div>
                <span className="apple-alloc-badge">
                  {assets.length} Positions
                </span>
              </div>

              {/* Multi-segment Spectrum Bar */}
              <div className="apple-spectrum-bar-wrap">
                <div className="apple-spectrum-bar">
                  {pctIndian > 0 && (
                    <div
                      className="apple-spectrum-segment seg-indian"
                      style={{ width: `${pctIndian}%` }}
                      title={`Indian Equities: ${pctIndian}%`}
                    />
                  )}
                  {pctMF > 0 && (
                    <div
                      className="apple-spectrum-segment seg-mf"
                      style={{ width: `${pctMF}%` }}
                      title={`Mutual Funds: ${pctMF}%`}
                    />
                  )}
                  {pctUS > 0 && (
                    <div
                      className="apple-spectrum-segment seg-us"
                      style={{ width: `${pctUS}%` }}
                      title={`US Stocks: ${pctUS}%`}
                    />
                  )}
                  {pctGold > 0 && (
                    <div
                      className="apple-spectrum-segment seg-gold"
                      style={{ width: `${pctGold}%` }}
                      title={`Gold & Fixed: ${pctGold}%`}
                    />
                  )}
                </div>
              </div>

              {/* Allocation List Items with links to dedicated pages */}
              <div className="apple-alloc-rows">
                <Link
                  href="/stocks"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="apple-alloc-item">
                    <div className="apple-alloc-item-left">
                      <span className="apple-alloc-dot dot-indian" />
                      <div>
                        <span className="apple-alloc-name">
                          Indian Equities ↗
                        </span>
                        <span className="apple-alloc-pct">
                          {pctIndian}% of total
                        </span>
                      </div>
                    </div>
                    <span className="apple-alloc-val">{money(indianVal)}</span>
                  </div>
                </Link>

                <Link
                  href="/mutual-funds"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="apple-alloc-item">
                    <div className="apple-alloc-item-left">
                      <span className="apple-alloc-dot dot-mf" />
                      <div>
                        <span className="apple-alloc-name">
                          Mutual Funds ↗
                        </span>
                        <span className="apple-alloc-pct">
                          {pctMF}% of total
                        </span>
                      </div>
                    </div>
                    <span className="apple-alloc-val">{money(mfVal)}</span>
                  </div>
                </Link>

                <Link
                  href="/stocks"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="apple-alloc-item">
                    <div className="apple-alloc-item-left">
                      <span className="apple-alloc-dot dot-us" />
                      <div>
                        <span className="apple-alloc-name">
                          US Equities ↗
                        </span>
                        <span className="apple-alloc-pct">{pctUS}% of total</span>
                      </div>
                    </div>
                    <span className="apple-alloc-val">{money(usVal)}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. APPLE HOLDINGS SECTION */}
          <HoldingsTableAndCards
            assets={displayedAssets}
            filterTabs={filterTabs}
            activeFilterTab={overviewSubTab}
            onFilterTabChange={(key) =>
              setOverviewSubTab(key as "all" | "stocks" | "mf")
            }
            emptyTitle="No investments recorded"
            emptyDescription="Add an Indian stock, US equity, or mutual fund position to start tracking."
            defaultAddCategory="Indian Equities"
          />
        </section>
      </div>

      {/* 5. Bottom Footer Glass Pill */}
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

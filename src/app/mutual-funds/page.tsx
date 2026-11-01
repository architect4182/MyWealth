"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  PiggyBank,
  Layers,
  Repeat,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Header } from "@/components/Header";
import { DynamicIsland } from "@/components/DynamicIsland";
import { PortfolioModals } from "@/components/Modals";
import { HoldingsTableAndCards } from "@/components/HoldingsTableAndCards";
import { TrendingSection } from "@/components/TrendingSection";

export default function MutualFundsPage() {
  const {
    mutualFunds,
    mfCurrent,
    mfInvested,
    mfPnl,
    mfPnlPct,
    pctMF,
    money,
    isRefreshingPrices,
    handleRefreshPrices,
    priceRefreshMessage,
    userGender,
    totalMonthlySipINR,
    activeSipCount,
  } = usePortfolio();

  const sidePanelImg = userGender === "female" ? "/side-panel-female.png" : "/side-panel-male.png";

  const [showSidePanel, setShowSidePanel] = useState(true);
  const [mfSubTab, setMfSubTab] = useState<"all" | "equity" | "focused" | "sip">("all");

  const totalUnits = useMemo(
    () => mutualFunds.reduce((sum, a) => sum + a.quantity, 0),
    [mutualFunds]
  );

  const mfSipList = useMemo(() => mutualFunds.filter((f) => f.isSip), [mutualFunds]);

  const displayedFunds = useMemo(() => {
    if (mfSubTab === "sip") return mfSipList;
    if (mfSubTab === "equity") {
      return mutualFunds.filter((f) =>
        f.name.toLowerCase().includes("equity") ||
        f.name.toLowerCase().includes("flexi") ||
        f.name.toLowerCase().includes("index")
      );
    }
    if (mfSubTab === "focused") {
      return mutualFunds.filter((f) =>
        f.name.toLowerCase().includes("focus") ||
        f.name.toLowerCase().includes("growth") ||
        f.name.toLowerCase().includes("bluechip")
      );
    }
    return mutualFunds;
  }, [mfSubTab, mutualFunds, mfSipList]);

  const filterTabs = [
    {
      key: "all",
      label: "All Mutual Funds",
      count: mutualFunds.length,
      icon: <Wallet size={13} />,
    },
    ...(mfSipList.length > 0
      ? [
          {
            key: "sip",
            label: "Active SIPs",
            count: mfSipList.length,
            icon: <Repeat size={13} />,
          },
        ]
      : []),
    {
      key: "equity",
      label: "Equity & Index",
      count: mutualFunds.filter((f) =>
        f.name.toLowerCase().includes("equity") ||
        f.name.toLowerCase().includes("flexi") ||
        f.name.toLowerCase().includes("index")
      ).length,
      icon: <Layers size={13} />,
    },
    {
      key: "focused",
      label: "Focused & Growth",
      count: mutualFunds.filter((f) =>
        f.name.toLowerCase().includes("focus") ||
        f.name.toLowerCase().includes("growth") ||
        f.name.toLowerCase().includes("bluechip")
      ).length,
      icon: <PiggyBank size={13} />,
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
              src={sidePanelImg}
              alt="MyWealth Portfolio Vision"
              className="apple-panel-img"
              loading="lazy"
              decoding="async"
              suppressHydrationWarning
            />
          </aside>
        )}

        <section className="apple-content-stage">
          {/* MUTUAL FUNDS HERO */}
          <div className="apple-bento-hero">
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <span className="apple-hero-eyebrow">MUTUAL FUNDS & SIPS</span>
                <button
                  type="button"
                  className="apple-hero-refresh-btn"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshingPrices || mutualFunds.length === 0}
                  title="Fetch live NAV updates for all mutual funds"
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
                <span className="apple-hero-val-text">{money(mfCurrent)}</span>
              </div>

              <div className="apple-hero-return-row">
                <div
                  className={`apple-hero-return-badge ${
                    mfPnl >= 0 ? "positive" : "negative"
                  }`}
                >
                  {mfPnl >= 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}
                  <span>
                    {mfPnl >= 0 ? `+${money(mfPnl)}` : money(mfPnl)}{" "}
                    (
                    {mfPnlPct >= 0
                      ? `+${mfPnlPct.toFixed(2)}%`
                      : `${mfPnlPct.toFixed(2)}%`}
                    ) NAV Gain
                  </span>
                </div>
                <span className="apple-hero-caption">
                  {priceRefreshMessage || `Invested: ${money(mfInvested)}`}
                </span>
              </div>

              <div className="apple-hero-stat-chips">
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Schemes Tracked</span>
                  <span className="apple-stat-chip-val">
                    {mutualFunds.length} Funds
                  </span>
                </div>
                {totalMonthlySipINR > 0 && (
                  <div className="apple-stat-chip">
                    <span className="apple-stat-chip-label">Monthly SIP</span>
                    <span className="apple-stat-chip-val" style={{ color: "var(--apple-blue)" }}>
                      {money(totalMonthlySipINR)}/mo ({activeSipCount})
                    </span>
                  </div>
                )}
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Portfolio Share</span>
                  <span className="apple-stat-chip-val">
                    {pctMF}% of Net Worth
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Total Units</span>
                  <span className="apple-stat-chip-val">
                    {totalUnits.toFixed(2)} units
                  </span>
                </div>
                <div className="apple-stat-chip">
                  <span className="apple-stat-chip-label">Avg NAV Cost</span>
                  <span className="apple-stat-chip-val">
                    ₹{(totalUnits > 0 ? mfInvested / totalUnits : 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Schemes Diversification Bento Card */}
            <div className="apple-allocation-card">
              <div className="apple-alloc-header">
                <div>
                  <h3 className="apple-alloc-title">Fund Schemes</h3>
                  <p className="apple-alloc-sub">Active mutual fund holdings</p>
                </div>
                <span className="apple-alloc-badge">
                  {mutualFunds.length} Schemes
                </span>
              </div>

              {/* Multi-segment Spectrum Bar for Funds */}
              <div className="apple-spectrum-bar-wrap" style={{ marginTop: "8px" }}>
                <div className="apple-spectrum-bar">
                  {mutualFunds.map((mf, idx) => {
                    const mfVal = mf.quantity * mf.currentPrice;
                    const pct = mfCurrent > 0 ? (mfVal / mfCurrent) * 100 : 0;
                    if (pct <= 0) return null;
                    const bgColors = ["#34c759", "#30b0c7", "#5856d6", "#ff9500", "#af52de"];
                    return (
                      <div
                        key={mf.id}
                        className="apple-spectrum-segment"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: bgColors[idx % bgColors.length],
                        }}
                        title={`${mf.name}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="apple-alloc-rows" style={{ marginTop: "12px" }}>
                {mutualFunds.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--muted)", padding: "12px 0" }}>
                    No mutual fund schemes recorded yet. Click "Add Asset" to record your first fund.
                  </div>
                ) : (
                  mutualFunds.map((mf) => {
                    const mfVal = mf.quantity * mf.currentPrice;
                    const pct = mfCurrent > 0 ? ((mfVal / mfCurrent) * 100).toFixed(1) : "0";
                    return (
                      <div key={mf.id} className="apple-alloc-item">
                        <div className="apple-alloc-item-left">
                          <span className="apple-alloc-dot dot-mf" />
                          <div>
                            <span className="apple-alloc-name">{mf.name}</span>
                            <span className="apple-alloc-pct">
                              {mf.quantity.toFixed(2)} units @ NAV ₹{mf.currentPrice.toFixed(2)} ({pct}%)
                            </span>
                          </div>
                        </div>
                        <span className="apple-alloc-val">{money(mfVal)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* MUTUAL FUNDS TABLE & CARDS SECTION */}
          <HoldingsTableAndCards
            assets={displayedFunds}
            filterTabs={filterTabs}
            activeFilterTab={mfSubTab}
            onFilterTabChange={(key) =>
              setMfSubTab(key as "all" | "equity" | "focused")
            }
            emptyTitle="No mutual fund schemes found"
            emptyDescription="Add a mutual fund scheme or SIP to start tracking NAV gains."
            defaultAddCategory="Mutual Funds"
          />

          {/* TOP TRENDING MUTUAL FUNDS (TOP 10 LIVE SCHEMES) */}
          <TrendingSection type="mf" />
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

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShieldCheck,
  Globe,
  Target,
  Plus,
  BarChart3,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { DynamicIsland } from "@/components/DynamicIsland";
import { PortfolioModals } from "@/components/Modals";
import { MarketTimingBadge } from "@/components/MarketBadge";
import { getNextSipDate } from "@/utils/sip";
import { Footer } from "@/components/Footer";

export default function Home() {
  const {
    assets,
    equities,
    mutualFunds,
    totalCurrentINR,
    totalInvestedINR,
    totalPnlINR,
    totalReturnPct,
    indianInvested,
    usInvested,
    usInvestedUSD,
    mfInvested,
    indianProfitsOnly,
    usProfitsOnly,
    investedPctIndian,
    investedPctUS,
    investedPctMF,
    investedPctGold,
    usdInrRate,
    indianMarket,
    usMarket,
    money,
    isLoading,
    isRefreshingPrices,
    handleRefreshPrices,
    priceRefreshMessage,
    totalMonthlySipINR,
    activeSipCount,
    openAssetDetail,
    setModal,
  } = usePortfolio();

  // Dynamic Macro Portfolio Intelligence (High-level asset health, currency balance, and wealth trajectory)
  const macroInsights = useMemo(() => {
    if (assets.length === 0) {
      return {
        healthScore: 0,
        healthLabel: "No Assets",
        maxWeightPct: 0,
        isConcentrated: false,
        nextMilestone: 25000,
        milestoneProgressPct: 0,
        milestoneRemaining: 0,
        inrTotal: 0,
        inrPct: 0,
        usdTotalNative: 0,
        usdTotalInr: 0,
        usdPct: 0,
        brokerCount: 0,
        activeSips: 0,
        nextSipDateStr: null as string | null,
        categoriesCount: 0,
      };
    }

    let inrTotal = 0;
    let usdTotalInr = 0;
    let usdTotalNative = 0;
    let maxPositionInr = 0;

    for (const asset of assets) {
      const currentLocal = asset.quantity * asset.currentPrice;
      const isUsd = asset.currency === "USD" || asset.category === "US Stocks";
      const currentInr = isUsd ? currentLocal * usdInrRate : currentLocal;

      if (isUsd) {
        usdTotalNative += currentLocal;
        usdTotalInr += currentInr;
      } else {
        inrTotal += currentInr;
      }

      if (currentInr > maxPositionInr) {
        maxPositionInr = currentInr;
      }
    }

    const netWorth = totalCurrentINR > 0 ? totalCurrentINR : (inrTotal + usdTotalInr || 1);
    const inrPct = Number(((inrTotal / netWorth) * 100).toFixed(1));
    const usdPct = Number(((usdTotalInr / netWorth) * 100).toFixed(1));
    const maxWeightPct = Number(((maxPositionInr / netWorth) * 100).toFixed(1));

    // Dynamic Health Score (0-100)
    let score = 92;
    if (maxWeightPct > 50) score -= 20;
    else if (maxWeightPct > 35) score -= 10;
    else if (maxWeightPct > 25) score -= 4;

    if (assets.length < 3) score -= 14;
    else if (assets.length < 5) score -= 5;

    const categories = new Set(assets.map((a) => a.category));
    if (categories.size === 1) score -= 10;
    if (usdPct >= 10 && usdPct <= 60) score += 6; // Cross-border FX hedge

    score = Math.max(45, Math.min(98, Math.round(score)));

    let healthLabel = "Balanced & Resilient";
    if (score >= 88) healthLabel = "Optimal & Resilient";
    else if (score >= 75) healthLabel = "Well Spread";
    else if (score >= 60) healthLabel = "Moderate Spread";
    else healthLabel = "Concentrated";

    // Dynamic Next Milestone
    const milestoneTiers = [
      10000, 25000, 50000, 75000, 100000, 200000, 300000, 500000, 750000, 1000000,
      1500000, 2500000, 5000000, 10000000,
    ];
    const nextMilestone =
      milestoneTiers.find((m) => m > totalCurrentINR) ||
      Math.ceil((totalCurrentINR * 1.3) / 10000) * 10000;
    const milestoneProgressPct = Math.min(
      100,
      Math.max(5, Math.round((totalCurrentINR / nextMilestone) * 100))
    );
    const milestoneRemaining = Math.max(0, nextMilestone - totalCurrentINR);

    const brokerSet = new Set(assets.map((a) => a.brokerApp?.trim()).filter(Boolean));
    const brokerCount = brokerSet.size || 1;

    const sipAssets = assets.filter((a) => a.isSip);
    const nextSipDateStr =
      sipAssets.length > 0 ? getNextSipDate(sipAssets[0].sipDay || 5) : null;

    return {
      healthScore: score,
      healthLabel,
      maxWeightPct,
      isConcentrated: maxWeightPct >= 35,
      nextMilestone,
      milestoneProgressPct,
      milestoneRemaining,
      inrTotal,
      inrPct,
      usdTotalNative,
      usdTotalInr,
      usdPct,
      brokerCount,
      activeSips: sipAssets.length,
      nextSipDateStr,
      categoriesCount: categories.size,
    };
  }, [assets, totalCurrentINR, usdInrRate]);

  return (
    <main className="apple-portfolio-app">
      {/* 1. Floating Session Live Prices Notification */}
      <DynamicIsland />

      {/* 3. Main Stage Layout */}
      <div className="apple-stage-layout full-width">
        <section className="apple-content-stage">
          {isLoading ? (
            <div className="ios-loading-container" style={{ minHeight: "55vh", justifyContent: "center" }}>
              <div className="ios-loading-card">
                <div className="ios-spinner" role="status" aria-label="Loading Overview">
                  <div /><div /><div /><div /><div /><div />
                  <div /><div /><div /><div /><div /><div />
                </div>
                <span className="ios-loading-title">Loading Portfolio Overview</span>
                <span className="ios-loading-subtitle">Syncing valuations & insights…</span>
              </div>
              <div className="ios-skeleton-wrap">
                <div className="ios-skeleton-row" style={{ width: "100%" }} />
                <div className="ios-skeleton-row" style={{ width: "92%" }} />
                <div className="ios-skeleton-row" style={{ width: "96%" }} />
              </div>
            </div>
          ) : (
            <>
              {/* OVERVIEW BENTO HERO STAGE: Portfolio Valuation + Asset Allocation */}
              <div className="apple-bento-hero">
                {/* Bento Card 1: Apple Wallet Net Worth Showcase */}
                <div className="apple-wallet-hero">
                  <div className="apple-wallet-header">
                    <div className="apple-eyebrow-row" style={{ flexWrap: "wrap", gap: "6px" }}>
                      <span className="apple-hero-eyebrow">PORTFOLIO VALUATION</span>
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
                      className={`apple-hero-return-badge ${totalPnlINR >= 0 ? "positive" : "negative"}`}
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
                    {totalMonthlySipINR > 0 && (
                      <div className="apple-stat-chip">
                        <span className="apple-stat-chip-label">Monthly SIP</span>
                        <span className="apple-stat-chip-val" style={{ color: "var(--apple-blue)" }}>
                          {money(totalMonthlySipINR)}/mo ({activeSipCount})
                        </span>
                      </div>
                    )}
                    <div className="apple-stat-chip">
                      <span className="apple-stat-chip-label">Active Holdings</span>
                      <span className="apple-stat-chip-val">
                        {assets.length} Assets
                      </span>
                    </div>
                    <div className="apple-stat-chip">
                      <span className="apple-stat-chip-label">Indian P&L</span>
                      <span
                        className="apple-stat-chip-val"
                        style={{
                          color:
                            indianProfitsOnly > 0
                              ? "#16a34a"
                              : indianProfitsOnly < 0
                                ? "#dc2626"
                                : undefined,
                        }}
                      >
                        {indianProfitsOnly > 0
                          ? `+${money(indianProfitsOnly, "INR")}`
                          : money(indianProfitsOnly, "INR")}
                      </span>
                    </div>
                    <div className="apple-stat-chip">
                      <span className="apple-stat-chip-label">US P&L</span>
                      <span
                        className="apple-stat-chip-val"
                        style={{
                          color:
                            usProfitsOnly > 0
                              ? "#16a34a"
                              : usProfitsOnly < 0
                                ? "#dc2626"
                                : undefined,
                        }}
                      >
                        {usProfitsOnly > 0
                          ? `+${money(usProfitsOnly, "USD")}`
                          : money(usProfitsOnly, "USD")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Apple Spectrum Allocation Visualizer (Total Invested) */}
                <div className="apple-allocation-card">
                  <div className="apple-alloc-header">
                    <div>
                      <h3 className="apple-alloc-title">Asset Allocation</h3>
                      <p className="apple-alloc-sub">Multi-class invested capital distribution</p>
                    </div>
                  </div>

                  {/* Multi-segment Spectrum Bar */}
                  <div className="apple-spectrum-bar-wrap">
                    <div className="apple-spectrum-bar">
                      {investedPctIndian > 0 && (
                        <div
                          className="apple-spectrum-segment seg-indian"
                          style={{ width: `${investedPctIndian}%` }}
                          title={`Indian Equities: ${investedPctIndian}%`}
                        />
                      )}
                      {investedPctMF > 0 && (
                        <div
                          className="apple-spectrum-segment seg-mf"
                          style={{ width: `${investedPctMF}%` }}
                          title={`Mutual Funds: ${investedPctMF}%`}
                        />
                      )}
                      {investedPctUS > 0 && (
                        <div
                          className="apple-spectrum-segment seg-us"
                          style={{ width: `${investedPctUS}%` }}
                          title={`US Stocks: ${investedPctUS}%`}
                        />
                      )}
                      {investedPctGold > 0 && (
                        <div
                          className="apple-spectrum-segment seg-gold"
                          style={{ width: `${investedPctGold}%` }}
                          title={`Gold & Fixed: ${investedPctGold}%`}
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
                              {investedPctIndian}% of invested
                            </span>
                          </div>
                        </div>
                        <span className="apple-alloc-val">{money(indianInvested)}</span>
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
                              {investedPctMF}% of invested
                            </span>
                          </div>
                        </div>
                        <span className="apple-alloc-val">{money(mfInvested)}</span>
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
                            <span className="apple-alloc-pct">{investedPctUS}% of invested</span>
                          </div>
                        </div>
                        <span className="apple-alloc-val">{money(usInvestedUSD, "USD")}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4. PORTFOLIO INTELLIGENCE & INSIGHTS (Derived from user's real investments) */}
              {assets.length === 0 ? (
                <div className="empty-state" style={{ marginTop: "8px" }}>
                  <div className="empty-icon">
                    <BarChart3 size={24} />
                  </div>
                  <strong>No Portfolio Insights Yet</strong>
                  <p>Add stocks or mutual funds to unlock performance analytics, broker breakdown, and diversification health.</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setModal(true)}
                  >
                    <Plus size={15} /> Add your first investment
                  </button>
                </div>
              ) : (
                <div className="overview-insights-stack">
                  {/* Row 1: 3-Column Macro Intelligence Cards */}
                  <div className="overview-insights-grid">
                    {/* Card 1: Portfolio Health & Quality Index */}
                    <div className="overview-insight-card">
                      <div className="overview-card-head">
                        <div className="overview-card-title-row">
                          <span className="overview-card-icon cyprus">
                            <ShieldCheck size={16} />
                          </span>
                          <div>
                            <h3 className="overview-card-title">Portfolio Health</h3>
                            <p className="overview-card-sub">Diversification & risk balance</p>
                          </div>
                        </div>
                        <span className="overview-chip-badge ok">
                          {macroInsights.healthLabel}
                        </span>
                      </div>

                      <div className="overview-metric-hero">
                        <div className="overview-metric-val">
                          <span>{macroInsights.healthScore}</span>
                          <span className="overview-metric-unit">/ 100</span>
                        </div>
                        <div className="overview-meter-bar">
                          <div
                            className="overview-meter-fill"
                            style={{ width: `${macroInsights.healthScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="overview-kv-list">
                        <div className="overview-kv-row">
                          <span>Single-Asset Concentration</span>
                          <strong>
                            {macroInsights.maxWeightPct}% max position
                            <small
                              style={{
                                marginLeft: "5px",
                                color: macroInsights.isConcentrated ? "#b45309" : "#004643",
                                fontWeight: 500,
                              }}
                            >
                              ({macroInsights.isConcentrated ? "Watch risk" : "Safe < 30%"})
                            </small>
                          </strong>
                        </div>
                        <div className="overview-kv-row">
                          <span>Asset Classes</span>
                          <strong>
                            {macroInsights.categoriesCount} categories across {assets.length} holdings
                          </strong>
                        </div>
                        <div className="overview-kv-row">
                          <span>Custody Accounts</span>
                          <strong>
                            Segregated across {macroInsights.brokerCount}{" "}
                            {macroInsights.brokerCount === 1 ? "broker" : "brokers"}
                          </strong>
                        </div>
                      </div>

                      <div className="overview-note-box">
                        {macroInsights.usdPct > 0
                          ? "Healthy international exposure cushions overall returns against domestic single-stock swings."
                          : "Consider global or mutual fund exposure to balance single-market volatility."}
                      </div>
                    </div>

                    {/* Card 2: Global Currency & FX Exposure */}
                    <div className="overview-insight-card">
                      <div className="overview-card-head">
                        <div className="overview-card-title-row">
                          <span className="overview-card-icon cyprus">
                            <Globe size={16} />
                          </span>
                          <div>
                            <h3 className="overview-card-title">Currency & FX Mix</h3>
                            <p className="overview-card-sub">Domestic vs global purchasing power</p>
                          </div>
                        </div>
                        <span className="overview-chip-badge">
                          {macroInsights.usdPct > 0 ? "Global Hedged" : "Domestic"}
                        </span>
                      </div>

                      <div className="overview-split-display">
                        <div className="overview-split-item">
                          <span className="overview-split-label">Domestic (INR)</span>
                          <span className="overview-split-val">{money(macroInsights.inrTotal)}</span>
                          <span className="overview-split-pct">{macroInsights.inrPct}% share</span>
                        </div>
                        <div className="overview-split-divider" />
                        <div className="overview-split-item">
                          <span className="overview-split-label">Global (USD)</span>
                          <span className="overview-split-val">
                            ${macroInsights.usdTotalNative.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="overview-split-pct">{macroInsights.usdPct}% share</span>
                        </div>
                      </div>

                      <div className="overview-kv-list">
                        <div className="overview-kv-row">
                          <span>Live USD / INR Benchmark</span>
                          <strong>1 USD = ₹{usdInrRate.toFixed(2)}</strong>
                        </div>
                        <div className="overview-kv-row">
                          <span>Converted USD Value</span>
                          <strong>{money(macroInsights.usdTotalInr)}</strong>
                        </div>
                      </div>

                      <div className="overview-note-box">
                        Offshore holdings preserve capital purchasing power against long-term rupee inflation.
                      </div>
                    </div>

                    {/* Card 3: Wealth Velocity & Milestones */}
                    <div className="overview-insight-card">
                      <div className="overview-card-head">
                        <div className="overview-card-title-row">
                          <span className="overview-card-icon cyprus">
                            <Target size={16} />
                          </span>
                          <div>
                            <h3 className="overview-card-title">Wealth Velocity</h3>
                            <p className="overview-card-sub">Capital momentum & next milestone</p>
                          </div>
                        </div>
                        <span className="overview-chip-badge ok">
                          {macroInsights.milestoneProgressPct}% Complete
                        </span>
                      </div>

                      <div className="overview-metric-hero">
                        <div className="overview-metric-val">
                          <span>{money(macroInsights.nextMilestone)}</span>
                          <span className="overview-metric-unit">Next Target</span>
                        </div>
                        <div className="overview-meter-bar">
                          <div
                            className="overview-meter-fill"
                            style={{ width: `${macroInsights.milestoneProgressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="overview-kv-list">
                        <div className="overview-kv-row">
                          <span>Distance to Target</span>
                          <strong>{money(macroInsights.milestoneRemaining)} to go</strong>
                        </div>
                        <div className="overview-kv-row">
                          <span>Active SIP Momentum</span>
                          <strong>
                            {macroInsights.activeSips > 0
                              ? `${macroInsights.activeSips} systematic investments`
                              : "No active SIPs"}
                          </strong>
                        </div>
                        {macroInsights.nextSipDateStr && (
                          <div className="overview-kv-row">
                            <span>Next Scheduled Debit</span>
                            <strong>{macroInsights.nextSipDateStr}</strong>
                          </div>
                        )}
                      </div>

                      <div className="overview-note-box">
                        {macroInsights.activeSips > 0
                          ? "Disciplined monthly dollar-cost averaging accelerates your compounding curve."
                          : "Starting systematic investments compounds principal effortlessly over market cycles."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Common Footer */}
      <Footer />

      {/* Modals Container */}
      <PortfolioModals />
    </main>
  );
}

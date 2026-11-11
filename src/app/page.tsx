"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Award,
  Layers,
  Building2,
  Scale,
  ArrowUpRight,
  Plus,
  BarChart3,
  Repeat,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Header } from "@/components/Header";
import { DynamicIsland } from "@/components/DynamicIsland";
import { PortfolioModals } from "@/components/Modals";
import { MarketTimingBadge } from "@/components/MarketBadge";
import { StockLogoAvatar, BrokerLogoAvatar, getStockTicker } from "@/components/Logos";
import { getNextSipDate } from "@/utils/sip";
import { Footer } from "@/components/Footer";
import { AssetPosition } from "@/types/portfolio";

interface EnrichedAssetMetric {
  asset: AssetPosition;
  ticker: string;
  investedLocal: number;
  currentLocal: number;
  pnlLocal: number;
  pnlPct: number;
  currentInr: number;
  investedInr: number;
  weightPct: number;
}

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
    indianProfitsOnly,
    usProfitsOnly,
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
    totalMonthlySipINR,
    activeSipCount,
    openAssetDetail,
    setModal,
  } = usePortfolio();

  // Compute rich portfolio intelligence metrics directly from user's real investments
  const insights = useMemo(() => {
    if (assets.length === 0) {
      return {
        enriched: [] as EnrichedAssetMetric[],
        topGainer: null as EnrichedAssetMetric | null,
        topLoser: null as EnrichedAssetMetric | null,
        largestPosition: null as EnrichedAssetMetric | null,
        winnersCount: 0,
        losersCount: 0,
        winRatePct: 0,
        brokerGroups: [] as { name: string; count: number; totalInr: number; sharePct: number }[],
        inrTotal: 0,
        usdTotalInr: 0,
        usdTotalNative: 0,
        sipAssets: [] as AssetPosition[],
      };
    }

    const enriched: EnrichedAssetMetric[] = assets.map((asset) => {
      const investedLocal =
        asset.investedAmount !== undefined && asset.investedAmount > 0
          ? asset.investedAmount
          : asset.quantity * asset.buyPrice;
      const currentLocal = asset.quantity * asset.currentPrice;
      const pnlLocal = currentLocal - investedLocal;
      const pnlPct = investedLocal > 0 ? (pnlLocal / investedLocal) * 100 : 0;
      const mult = asset.currency === "USD" ? usdInrRate : 1;
      const currentInr = currentLocal * mult;
      const investedInr = investedLocal * mult;
      const weightPct = totalCurrentINR > 0 ? (currentInr / totalCurrentINR) * 100 : 0;

      return {
        asset,
        ticker: getStockTicker(asset.name, asset.category),
        investedLocal,
        currentLocal,
        pnlLocal,
        pnlPct,
        currentInr,
        investedInr,
        weightPct,
      };
    });

    const sortedByReturn = [...enriched].sort((a, b) => b.pnlPct - a.pnlPct);
    const sortedByWeight = [...enriched].sort((a, b) => b.currentInr - a.currentInr);

    const winners = enriched.filter((e) => e.pnlLocal > 0);
    const losers = enriched.filter((e) => e.pnlLocal < 0);
    const winRatePct = enriched.length > 0 ? (winners.length / enriched.length) * 100 : 0;

    // Group by Broker / Platform
    const brokerMap = new Map<string, { count: number; totalInr: number }>();
    for (const item of enriched) {
      const brokerKey = item.asset.brokerApp?.trim() || "Direct / Unassigned";
      const prev = brokerMap.get(brokerKey) || { count: 0, totalInr: 0 };
      brokerMap.set(brokerKey, {
        count: prev.count + 1,
        totalInr: prev.totalInr + item.currentInr,
      });
    }
    const brokerGroups = Array.from(brokerMap.entries())
      .map(([name, info]) => ({
        name,
        count: info.count,
        totalInr: info.totalInr,
        sharePct: totalCurrentINR > 0 ? (info.totalInr / totalCurrentINR) * 100 : 0,
      }))
      .sort((a, b) => b.totalInr - a.totalInr);

    const inrTotal = enriched
      .filter((e) => e.asset.currency === "INR")
      .reduce((s, e) => s + e.currentInr, 0);
    const usdItems = enriched.filter((e) => e.asset.currency === "USD");
    const usdTotalInr = usdItems.reduce((s, e) => s + e.currentInr, 0);
    const usdTotalNative = usdItems.reduce((s, e) => s + e.currentLocal, 0);

    return {
      enriched: sortedByReturn,
      topGainer: sortedByReturn[0] || null,
      topLoser: sortedByReturn[sortedByReturn.length - 1] || null,
      largestPosition: sortedByWeight[0] || null,
      winnersCount: winners.length,
      losersCount: losers.length,
      winRatePct,
      brokerGroups,
      inrTotal,
      usdTotalInr,
      usdTotalNative,
      sipAssets: assets.filter((a) => a.isSip),
    };
  }, [assets, totalCurrentINR, usdInrRate]);

  const maxAbsPnlPct = useMemo(() => {
    if (insights.enriched.length === 0) return 10;
    return Math.max(5, ...insights.enriched.map((e) => Math.abs(e.pnlPct)));
  }, [insights.enriched]);

  return (
    <main className="apple-portfolio-app">
      {/* 1. Apple Floating Capsule Header with Route Nav */}
      <Header />

      {/* 2. Floating Session Live Prices Notification */}
      <DynamicIsland />

      {/* 3. Main Stage Layout */}
      <div className="apple-stage-layout full-width">
        <section className="apple-content-stage">
          {/* OVERVIEW BENTO HERO STAGE: Portfolio Valuation + Asset Allocation */}
          <div className="apple-bento-hero">
            {/* Bento Card 1: Apple Wallet Net Worth Showcase */}
            <div className="apple-wallet-hero">
              <div className="apple-wallet-header">
                <div className="apple-eyebrow-row" style={{ flexWrap: "wrap", gap: "6px" }}>
                  <span className="apple-hero-eyebrow">PORTFOLIO VALUATION</span>
                  <MarketTimingBadge status={indianMarket} />
                  <MarketTimingBadge status={usMarket} />
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
              {/* Row 1: 3-Column Portfolio Analytics Cards */}
              <div className="overview-insights-grid">
                {/* Insight Card 1: Winners vs Losers & Top Performers */}
                <div className="overview-insight-card">
                  <div className="overview-card-head">
                    <div className="overview-card-title-row">
                      <span className="overview-card-icon purple">
                        <Award size={15} />
                      </span>
                      <div>
                        <h3 className="overview-card-title">Performance Insights</h3>
                        <p className="overview-card-sub">Holdings profitability & leaders</p>
                      </div>
                    </div>
                    <span className="overview-chip-badge">
                      {insights.winRatePct.toFixed(0)}% Win Rate
                    </span>
                  </div>

                  {/* Win / Loss Ratio Bar */}
                  <div className="overview-ratio-block">
                    <div className="overview-ratio-labels">
                      <span style={{ color: "#15803d", fontWeight: 600 }}>
                        {insights.winnersCount} Profitable
                      </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>
                        {insights.losersCount} In Loss
                      </span>
                    </div>
                    <div className="overview-ratio-bar">
                      <div
                        className="overview-ratio-fill"
                        style={{ width: `${insights.winRatePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Top Performer & Laggard */}
                  <div className="overview-highlight-rows">
                    {insights.topGainer && (
                      <div
                        className="overview-highlight-item"
                        onClick={() => openAssetDetail(insights.topGainer!.asset)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openAssetDetail(insights.topGainer!.asset);
                          }
                        }}
                      >
                        <div className="overview-highlight-left">
                          <div className="apple-avatar-squircle" style={{ width: "30px", height: "30px", borderRadius: "50%" }}>
                            <StockLogoAvatar
                              name={insights.topGainer.asset.name}
                              ticker={insights.topGainer.ticker}
                              category={insights.topGainer.asset.category}
                            />
                          </div>
                          <div>
                            <span className="overview-micro-tag">TOP GAINER</span>
                            <div className="overview-item-name">{insights.topGainer.asset.name}</div>
                          </div>
                        </div>
                        <div className="overview-highlight-right positive">
                          <span>
                            {insights.topGainer.pnlLocal >= 0 ? "+" : ""}
                            {money(insights.topGainer.pnlLocal, insights.topGainer.asset.currency)}
                          </span>
                          <small>
                            {insights.topGainer.pnlPct >= 0 ? "+" : ""}
                            {insights.topGainer.pnlPct.toFixed(2)}%
                          </small>
                        </div>
                      </div>
                    )}

                    {insights.topLoser &&
                      insights.topLoser.asset.id !== insights.topGainer?.asset.id && (
                        <div
                          className="overview-highlight-item"
                          onClick={() => openAssetDetail(insights.topLoser!.asset)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openAssetDetail(insights.topLoser!.asset);
                            }
                          }}
                        >
                          <div className="overview-highlight-left">
                            <div className="apple-avatar-squircle" style={{ width: "30px", height: "30px", borderRadius: "50%" }}>
                              <StockLogoAvatar
                                name={insights.topLoser.asset.name}
                                ticker={insights.topLoser.ticker}
                                category={insights.topLoser.asset.category}
                              />
                            </div>
                            <div>
                              <span className="overview-micro-tag">
                                {insights.topLoser.pnlLocal < 0 ? "LARGEST DRAG" : "STEADY GAINER"}
                              </span>
                              <div className="overview-item-name">{insights.topLoser.asset.name}</div>
                            </div>
                          </div>
                          <div
                            className={`overview-highlight-right ${
                              insights.topLoser.pnlLocal >= 0 ? "positive" : "negative"
                            }`}
                          >
                            <span>
                              {insights.topLoser.pnlLocal >= 0 ? "+" : ""}
                              {money(insights.topLoser.pnlLocal, insights.topLoser.asset.currency)}
                            </span>
                            <small>
                              {insights.topLoser.pnlPct >= 0 ? "+" : ""}
                              {insights.topLoser.pnlPct.toFixed(2)}%
                            </small>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Insight Card 2: Portfolio Concentration & Currency Exposure */}
                <div className="overview-insight-card">
                  <div className="overview-card-head">
                    <div className="overview-card-title-row">
                      <span className="overview-card-icon blue">
                        <Scale size={15} />
                      </span>
                      <div>
                        <h3 className="overview-card-title">Concentration & FX Mix</h3>
                        <p className="overview-card-sub">Single-stock risk & currency exposure</p>
                      </div>
                    </div>
                    {insights.largestPosition && (
                      <span
                        className={`overview-chip-badge ${
                          insights.largestPosition.weightPct >= 40 ? "warn" : "ok"
                        }`}
                      >
                        {insights.largestPosition.weightPct >= 40
                          ? "Concentrated"
                          : insights.largestPosition.weightPct >= 25
                          ? "Balanced"
                          : "Well Spread"}
                      </span>
                    )}
                  </div>

                  {insights.largestPosition && (
                    <div
                      className="overview-concentration-box"
                      onClick={() => openAssetDetail(insights.largestPosition!.asset)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openAssetDetail(insights.largestPosition!.asset);
                        }
                      }}
                    >
                      <div className="overview-conc-top">
                        <span className="overview-micro-tag">HEAVIEST POSITION</span>
                        <strong>{insights.largestPosition.weightPct.toFixed(1)}% of Net Worth</strong>
                      </div>
                      <div className="overview-conc-name">
                        <span>{insights.largestPosition.asset.name}</span>
                        <span>{money(insights.largestPosition.currentInr)}</span>
                      </div>
                      <div className="overview-ratio-bar">
                        <div
                          className="overview-ratio-fill purple"
                          style={{ width: `${Math.min(100, insights.largestPosition.weightPct)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="overview-kv-list">
                    <div className="overview-kv-row">
                      <span>Domestic Currency (INR)</span>
                      <strong>
                        {money(insights.inrTotal)} ({totalCurrentINR > 0 ? ((insights.inrTotal / totalCurrentINR) * 100).toFixed(1) : "0.0"}%)
                      </strong>
                    </div>
                    <div className="overview-kv-row">
                      <span>Foreign Exposure (USD)</span>
                      <strong>
                        ${insights.usdTotalNative.toFixed(2)} ({totalCurrentINR > 0 ? ((insights.usdTotalInr / totalCurrentINR) * 100).toFixed(1) : "0.0"}%)
                      </strong>
                    </div>
                    <div className="overview-kv-row">
                      <span>Live USD / INR Rate</span>
                      <strong>1 USD = ₹{usdInrRate.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Insight Card 3: Broker / App Platform Custody */}
                <div className="overview-insight-card">
                  <div className="overview-card-head">
                    <div className="overview-card-title-row">
                      <span className="overview-card-icon emerald">
                        <Building2 size={15} />
                      </span>
                      <div>
                        <h3 className="overview-card-title">Broker Custody Split</h3>
                        <p className="overview-card-sub">Where your investments are held</p>
                      </div>
                    </div>
                    <span className="overview-chip-badge">
                      {insights.brokerGroups.length}{" "}
                      {insights.brokerGroups.length === 1 ? "Platform" : "Platforms"}
                    </span>
                  </div>

                  <div className="overview-broker-list">
                    {insights.brokerGroups.map((b) => (
                      <div key={b.name} className="overview-broker-row">
                        <div className="overview-broker-left">
                          <BrokerLogoAvatar brokerName={b.name} size={22} />
                          <div>
                            <div className="overview-broker-name">{b.name}</div>
                            <div className="overview-broker-meta">
                              {b.count} {b.count === 1 ? "holding" : "holdings"} · {b.sharePct.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <strong className="overview-broker-val">{money(b.totalInr)}</strong>
                      </div>
                    ))}
                  </div>

                  {insights.sipAssets.length > 0 && (
                    <div className="overview-sip-summary-bar">
                      <Repeat size={13} style={{ color: "#7c3aed", flexShrink: 0 }} />
                      <span>
                        <strong>{insights.sipAssets.length} Active SIP</strong> · Next auto-debit on{" "}
                        {getNextSipDate(insights.sipAssets[0].sipDay || 5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Returns Leaderboard Strip + Quick Navigation */}
              <div className="overview-performance-card">
                <div className="overview-perf-header">
                  <div>
                    <h3 className="overview-card-title" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <Layers size={15} style={{ color: "#7c3aed" }} /> Holding Return Leaderboard
                    </h3>
                    <p className="overview-card-sub">
                      Click any investment to inspect live chart & ledger, or open dedicated category tabs
                    </p>
                  </div>
                  <div className="overview-quick-links">
                    <Link href="/stocks" className="overview-route-pill">
                      Stocks ({equities.length}) <ArrowUpRight size={13} />
                    </Link>
                    <Link href="/mutual-funds" className="overview-route-pill">
                      Mutual Funds ({mutualFunds.length}) <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className="overview-leaderboard-list">
                  {insights.enriched.map((item) => {
                    const isPos = item.pnlPct >= 0;
                    const barWidth = Math.min(100, Math.max(6, (Math.abs(item.pnlPct) / maxAbsPnlPct) * 100));
                    return (
                      <div
                        key={item.asset.id}
                        className="overview-leader-row"
                        onClick={() => openAssetDetail(item.asset)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openAssetDetail(item.asset);
                          }
                        }}
                      >
                        <div className="overview-leader-identity">
                          <div className="apple-avatar-squircle" style={{ width: "30px", height: "30px", borderRadius: "50%" }}>
                            <StockLogoAvatar
                              name={item.asset.name}
                              ticker={item.ticker}
                              category={item.asset.category}
                            />
                          </div>
                          <div className="overview-leader-text">
                            <span className="overview-leader-name">{item.asset.name}</span>
                            <span className="overview-leader-meta">
                              {item.ticker} · {item.weightPct.toFixed(1)}% weight
                            </span>
                          </div>
                        </div>

                        <div className="overview-leader-bar-wrap">
                          <div className="overview-leader-bar-track">
                            <div
                              className={`overview-leader-bar-fill ${isPos ? "positive" : "negative"}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>

                        <div className={`overview-leader-pnl ${isPos ? "positive" : "negative"}`}>
                          <span>
                            {isPos ? "+" : ""}
                            {money(item.pnlLocal, item.asset.currency)}
                          </span>
                          <small>
                            {isPos ? "+" : ""}
                            {item.pnlPct.toFixed(2)}%
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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

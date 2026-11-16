"use client";

import React, { useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Target,
  Scale,
  Globe,
  Radio,
  Building2,
  Cpu,
  ShieldCheck,
  ShoppingBag,
  Coins,
} from "lucide-react";
import { AssetPosition } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import { getStockTicker } from "@/utils/tickers";

export interface InvestmentAnalysisSectionProps {
  assets: AssetPosition[];
}

interface ThematicCategory {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  match: (name: string, ticker: string) => boolean;
}

const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    id: "tech",
    name: "Tech & AI",
    color: "#2563eb",
    icon: <Cpu size={12} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const list = [
        "AAPL", "MSFT", "GOOGL", "GOOG", "NVDA", "AMZN", "META", "AMD",
        "AVGO", "TSM", "PLTR", "ORCL", "CRM", "ADBE", "INTC", "CSCO",
        "IBM", "TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM",
      ];
      return list.includes(t) || n.includes("apple") || n.includes("microsoft") || n.includes("google") || n.includes("nvidia");
    },
  },
  {
    id: "finance",
    name: "Banking & Financials",
    color: "#004643",
    icon: <Building2 size={12} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const list = ["ICICIBANK", "HDFCBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BRK.B", "BRK.A", "JPM", "BAC", "WFC", "V", "MA"];
      return list.includes(t) || n.includes("icici") || n.includes("hdfc") || n.includes("sbi") || n.includes("berkshire") || n.includes("bank");
    },
  },
  {
    id: "telecom",
    name: "Telecom & Digital",
    color: "#7c3aed",
    icon: <Radio size={12} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const list = ["JPL", "RELIANCE", "BHARTIARTL", "T", "VZ", "TMUS"];
      return list.includes(t) || n.includes("jio") || n.includes("reliance") || n.includes("airtel");
    },
  },
  {
    id: "index",
    name: "Index ETFs",
    color: "#059669",
    icon: <ShieldCheck size={12} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const list = ["VOO", "SPY", "QQQ", "VTI", "IVV", "NIFTYBEES", "BANKBEES", "NAVI"];
      return list.includes(t) || n.includes("vanguard") || n.includes("s&p") || n.includes("nifty") || n.includes("index") || n.includes("etf");
    },
  },
  {
    id: "consumer",
    name: "Consumer & Auto",
    color: "#d97706",
    icon: <ShoppingBag size={12} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const list = ["TATAMOTORS", "M&M", "MARUTI", "TSLA", "WMT", "COST", "KO", "PEP", "TITAN"];
      return list.includes(t) || n.includes("tata motors") || n.includes("tesla") || n.includes("walmart");
    },
  },
  {
    id: "other",
    name: "Other Equities",
    color: "#64748b",
    icon: <Coins size={12} />,
    match: () => true,
  },
];

export function InvestmentAnalysisSection({ assets }: InvestmentAnalysisSectionProps) {
  const { usdInrRate, money } = usePortfolio();

  const data = useMemo(() => {
    if (!assets || assets.length === 0) return null;

    let totalInvestedInr = 0;
    let inrInvested = 0;
    let usdInvestedInr = 0;
    let usdInvestedNative = 0;

    const items = assets.map((a) => {
      const ticker = getStockTicker(a.name, a.category) || a.name.slice(0, 4).toUpperCase();
      const isUsd = a.currency === "USD" || a.category === "US Stocks";
      const investedNative =
        a.investedAmount !== undefined && a.investedAmount > 0
          ? a.investedAmount
          : a.quantity * a.buyPrice;
      const currentNative = a.quantity * a.currentPrice;
      const pnlNative = currentNative - investedNative;
      const pnlPct = investedNative > 0 ? (pnlNative / investedNative) * 100 : 0;

      const investedInr = isUsd ? investedNative * usdInrRate : investedNative;
      const currentInr = isUsd ? currentNative * usdInrRate : currentNative;

      totalInvestedInr += investedInr;
      if (isUsd) {
        usdInvestedInr += investedInr;
        usdInvestedNative += investedNative;
      } else {
        inrInvested += investedInr;
      }

      const theme =
        THEMATIC_CATEGORIES.find((c) => c.match(a.name, ticker)) ||
        THEMATIC_CATEGORIES[THEMATIC_CATEGORIES.length - 1];

      return {
        id: a.id,
        name: a.name,
        ticker,
        currency: a.currency,
        investedNative,
        pnlNative,
        pnlPct,
        investedInr,
        currentInr,
        theme,
      };
    });

    // Group by Theme
    const themeGroupsMap = new Map<
      string,
      { theme: ThematicCategory; investedInr: number; tickers: string[] }
    >();

    for (const it of items) {
      const existing = themeGroupsMap.get(it.theme.id);
      if (existing) {
        existing.investedInr += it.investedInr;
        if (!existing.tickers.includes(it.ticker)) existing.tickers.push(it.ticker);
      } else {
        themeGroupsMap.set(it.theme.id, {
          theme: it.theme,
          investedInr: it.investedInr,
          tickers: [it.ticker],
        });
      }
    }

    const themes = Array.from(themeGroupsMap.values())
      .map((g) => ({
        ...g,
        pct: totalInvestedInr > 0 ? Math.round((g.investedInr / totalInvestedInr) * 100) : 0,
      }))
      .sort((a, b) => b.investedInr - a.investedInr);

    // Heaviest Holding
    const sortedByInvested = [...items].sort((a, b) => b.investedInr - a.investedInr);
    const topHolding = sortedByInvested[0];
    const topHoldingPct =
      totalInvestedInr > 0 ? Math.round((topHolding.investedInr / totalInvestedInr) * 100) : 0;

    // Best Performer & Drawdown
    const sortedByReturn = [...items].sort((a, b) => b.pnlPct - a.pnlPct);
    const topGainer = sortedByReturn[0];
    const topLaggard = sortedByReturn[sortedByReturn.length - 1];

    const usdPct = totalInvestedInr > 0 ? Math.round((usdInvestedInr / totalInvestedInr) * 100) : 0;
    const inrPct = 100 - usdPct;

    // Dynamic Real-Time Bullets Mentioning Specific Holdings
    const bullets: string[] = [];
    if (themes.length > 0) {
      bullets.push(
        `Highest sector conviction is in ${themes[0].theme.name} (${themes[0].pct}%), anchored by ${themes[0].tickers.join(", ")}.`
      );
    }
    if (usdPct > 0) {
      bullets.push(
        `${usdPct}% global allocation in US equities hedges purchasing power against domestic INR depreciation.`
      );
    }
    if (topLaggard && topLaggard.pnlPct < 0) {
      bullets.push(
        `${topLaggard.name} (${topLaggard.ticker}) is ${topLaggard.pnlPct.toFixed(1)}% below cost basis — watch for DCA accumulation.`
      );
    }

    return {
      themes,
      topHolding,
      topHoldingPct,
      topGainer,
      topLaggard,
      usdPct,
      inrPct,
      usdInvestedNative,
      bullets,
    };
  }, [assets, usdInrRate]);

  if (!data) return null;

  return (
    <section className="apple-minimal-analysis-wrap" aria-label="Holdings Analysis">
      <div className="apple-minimal-analysis-card">
        {/* Header */}
        <div className="apple-minimal-analysis-head">
          <div className="apple-minimal-analysis-title-row">
            <span className="apple-minimal-analysis-icon">
              <Sparkles size={14} />
            </span>
            <span className="apple-minimal-analysis-title">Portfolio Holdings Analysis</span>
            <span className="apple-minimal-analysis-badge">
              {assets.length} Positions Active
            </span>
          </div>

          <div className="apple-minimal-realtime-pill">
            <span className="apple-live-radar-ping" />
            <span className="apple-live-radar-core" />
            <span>Live Portfolio Diagnostics</span>
          </div>
        </div>

        {/* 1. Thematic Spectrum & Ticker Chips */}
        <div className="apple-minimal-thematic-row">
          <div className="apple-minimal-spectrum-bar">
            {data.themes.map((t) => (
              <div
                key={t.theme.id}
                style={{
                  width: `${Math.max(5, t.pct)}%`,
                  backgroundColor: t.theme.color,
                }}
                title={`${t.theme.name}: ${t.pct}% (${t.tickers.join(", ")})`}
              />
            ))}
          </div>

          <div className="apple-minimal-theme-chips">
            {data.themes.map((t) => (
              <div key={t.theme.id} className="apple-minimal-theme-chip">
                <span
                  className="apple-minimal-theme-dot"
                  style={{ backgroundColor: t.theme.color }}
                />
                <strong>{t.theme.name}</strong>
                <span className="apple-minimal-theme-pct">{t.pct}%</span>
                <span className="apple-minimal-theme-tickers">
                  ({t.tickers.slice(0, 3).join(", ")})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Key Diagnostic Stat Strip */}
        <div className="apple-minimal-stat-strip">
          {/* Top Allocation */}
          <div className="apple-minimal-stat-item">
            <span className="apple-minimal-stat-label">
              <Target size={11} /> Top Commitment
            </span>
            <span className="apple-minimal-stat-val">
              {data.topHolding.name}
              <small>({data.topHoldingPct}% of capital)</small>
            </span>
          </div>

          {/* Top Return Driver */}
          {data.topGainer && (
            <div className="apple-minimal-stat-item">
              <span className="apple-minimal-stat-label">
                <TrendingUp size={11} style={{ color: "#16a34a" }} /> Top Alpha Driver
              </span>
              <span className="apple-minimal-stat-val">
                {data.topGainer.name}
                <strong style={{ color: "#16a34a", marginLeft: "4px" }}>
                  +{data.topGainer.pnlPct.toFixed(1)}%
                </strong>
              </span>
            </div>
          )}

          {/* Value Consolidation / Currency Split */}
          <div className="apple-minimal-stat-item">
            {data.topLaggard && data.topLaggard.pnlPct < 0 ? (
              <>
                <span className="apple-minimal-stat-label">
                  <Scale size={11} style={{ color: "#b45309" }} /> DCA Watch
                </span>
                <span className="apple-minimal-stat-val">
                  {data.topLaggard.name}
                  <strong style={{ color: "#dc2626", marginLeft: "4px" }}>
                    {data.topLaggard.pnlPct.toFixed(1)}%
                  </strong>
                </span>
              </>
            ) : (
              <>
                <span className="apple-minimal-stat-label">
                  <Globe size={11} /> Currency Allocation
                </span>
                <span className="apple-minimal-stat-val">
                  INR {data.inrPct}% · USD {data.usdPct}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* 3. Real-time Holdings Takeaways (Short & Simple) */}
        <div className="apple-minimal-bullets">
          {data.bullets.slice(0, 2).map((b, i) => (
            <div key={i} className="apple-minimal-bullet-item">
              <span className="apple-minimal-bullet-dot">•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

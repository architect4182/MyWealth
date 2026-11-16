"use client";

import React, { useMemo, useState } from "react";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  Target,
  Sparkles,
  Globe,
  Building2,
  Cpu,
  ChevronDown,
  ChevronUp,
  Radio,
  BarChart3,
  Scale,
  ShoppingBag,
  HeartPulse,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { AssetPosition } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import { getStockTicker } from "@/utils/tickers";

export interface InvestmentAnalysisSectionProps {
  assets: AssetPosition[];
  title?: string;
  subtitle?: string;
}

interface ThematicCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  bgTint: string;
  icon: React.ReactNode;
  match: (name: string, ticker: string) => boolean;
}

const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    id: "tech",
    name: "Mega-Cap Tech & AI",
    description: "Cloud, semiconductor, and enterprise generative software",
    color: "#2563eb",
    bgTint: "rgba(37, 99, 235, 0.08)",
    icon: <Cpu size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const techTickers = [
        "AAPL", "MSFT", "GOOGL", "GOOG", "NVDA", "AMZN", "META", "AMD",
        "AVGO", "TSM", "PLTR", "ORCL", "CRM", "ADBE", "INTC", "CSCO",
        "IBM", "TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "SNOW", "NOW",
      ];
      if (techTickers.includes(t)) return true;
      return (
        n.includes("apple") ||
        n.includes("microsoft") ||
        n.includes("google") ||
        n.includes("alphabet") ||
        n.includes("nvidia") ||
        n.includes("infosys") ||
        n.includes("software") ||
        n.includes("technology")
      );
    },
  },
  {
    id: "finance",
    name: "Banking & Financial Services",
    description: "Credit expansion, asset management, and payment rails",
    color: "#004643",
    bgTint: "rgba(0, 70, 67, 0.08)",
    icon: <Building2 size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const finTickers = [
        "ICICIBANK", "HDFCBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BRK.B",
        "BRK.A", "JPM", "BAC", "WFC", "MS", "GS", "V", "MA", "BAJFINANCE", "BAJAJFINSV",
      ];
      if (finTickers.includes(t)) return true;
      return (
        n.includes("icici") ||
        n.includes("hdfc") ||
        n.includes("sbi") ||
        n.includes("bank") ||
        n.includes("berkshire") ||
        n.includes("jpmorgan") ||
        n.includes("finance") ||
        n.includes("visa") ||
        n.includes("mastercard")
      );
    },
  },
  {
    id: "telecom",
    name: "Digital & Telecom Infrastructure",
    description: "Mobile connectivity, broadband, and digital ecosystem",
    color: "#7c3aed",
    bgTint: "rgba(124, 58, 237, 0.08)",
    icon: <Radio size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const telTickers = ["JPL", "RELIANCE", "BHARTIARTL", "T", "VZ", "TMUS"];
      if (telTickers.includes(t)) return true;
      return (
        n.includes("jio") ||
        n.includes("reliance") ||
        n.includes("airtel") ||
        n.includes("telecom") ||
        n.includes("verizon")
      );
    },
  },
  {
    id: "index",
    name: "Broad Index & Core ETFs",
    description: "Market-wide benchmarks buffering single-stock variance",
    color: "#059669",
    bgTint: "rgba(5, 150, 105, 0.08)",
    icon: <ShieldCheck size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const indexTickers = [
        "VOO", "SPY", "QQQ", "VTI", "IVV", "NIFTYBEES", "BANKBEES", "GOLDBEES", "NAVI",
      ];
      if (indexTickers.includes(t)) return true;
      return (
        n.includes("vanguard") ||
        n.includes("s&p") ||
        n.includes("nifty") ||
        n.includes("index") ||
        n.includes("etf") ||
        n.includes("sensex")
      );
    },
  },
  {
    id: "consumer",
    name: "Consumer, Retail & Mobility",
    description: "Discretionary spending, automotive, and retail brands",
    color: "#d97706",
    bgTint: "rgba(217, 119, 6, 0.08)",
    icon: <ShoppingBag size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const conTickers = [
        "TATAMOTORS", "M&M", "MARUTI", "TSLA", "WMT", "COST", "TGT", "KO", "PEP", "NKE", "ITC", "TITAN",
      ];
      if (conTickers.includes(t)) return true;
      return (
        n.includes("tata motors") ||
        n.includes("tesla") ||
        n.includes("walmart") ||
        n.includes("costco") ||
        n.includes("retail") ||
        n.includes("consumer")
      );
    },
  },
  {
    id: "healthcare",
    name: "Healthcare & Pharmaceuticals",
    description: "Biotech, pharmaceuticals, and life sciences",
    color: "#e11d48",
    bgTint: "rgba(225, 29, 72, 0.08)",
    icon: <HeartPulse size={14} />,
    match: (name, ticker) => {
      const t = ticker.toUpperCase();
      const n = name.toLowerCase();
      const pharmaTickers = ["SUNPHARMA", "DRREDDY", "CIPLA", "LLY", "PFE", "JNJ", "ABBV", "NVO"];
      if (pharmaTickers.includes(t)) return true;
      return (
        n.includes("pharma") ||
        n.includes("sun") ||
        n.includes("lilly") ||
        n.includes("pfizer") ||
        n.includes("health")
      );
    },
  },
  {
    id: "other",
    name: "Other Core Holdings",
    description: "Diversified industrial and emerging sector positions",
    color: "#64748b",
    bgTint: "rgba(100, 116, 139, 0.08)",
    icon: <Coins size={14} />,
    match: () => true,
  },
];

export function InvestmentAnalysisSection({
  assets,
  title = "Portfolio Investment Analysis",
  subtitle = "Personalized sector exposure & diagnostics based on what you have invested",
}: InvestmentAnalysisSectionProps) {
  const { usdInrRate, money } = usePortfolio();
  const [isExpanded, setIsExpanded] = useState(true);

  // Dynamic Portfolio Diagnostics Engine
  const analysis = useMemo(() => {
    if (!assets || assets.length === 0) {
      return null;
    }

    let totalInvestedInr = 0;
    let totalCurrentInr = 0;
    let totalPnlInr = 0;
    let inrInvestedTotal = 0;
    let usdInvestedTotalInr = 0;
    let usdInvestedNative = 0;

    const normalizedHoldings = assets.map((a) => {
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
      const pnlInr = isUsd ? pnlNative * usdInrRate : pnlNative;

      totalInvestedInr += investedInr;
      totalCurrentInr += currentInr;
      totalPnlInr += pnlInr;

      if (isUsd) {
        usdInvestedTotalInr += investedInr;
        usdInvestedNative += investedNative;
      } else {
        inrInvestedTotal += investedInr;
      }

      // Determine Thematic Bucket
      const matchedTheme =
        THEMATIC_CATEGORIES.find((cat) => cat.match(a.name, ticker)) ||
        THEMATIC_CATEGORIES[THEMATIC_CATEGORIES.length - 1];

      return {
        id: a.id,
        name: a.name,
        ticker,
        category: a.category,
        currency: a.currency,
        quantity: a.quantity,
        buyPrice: a.buyPrice,
        currentPrice: a.currentPrice,
        investedNative,
        currentNative,
        pnlNative,
        pnlPct,
        investedInr,
        currentInr,
        pnlInr,
        themeId: matchedTheme.id,
        themeName: matchedTheme.name,
        themeColor: matchedTheme.color,
      };
    });

    const netReturnPct =
      totalInvestedInr > 0 ? (totalPnlInr / totalInvestedInr) * 100 : 0;

    // 1. Group by Thematic Sectors
    const themeMap = new Map<
      string,
      {
        theme: ThematicCategory;
        totalInvestedInr: number;
        totalCurrentInr: number;
        holdings: typeof normalizedHoldings;
      }
    >();

    for (const h of normalizedHoldings) {
      const cat = THEMATIC_CATEGORIES.find((c) => c.id === h.themeId)!;
      const existing = themeMap.get(h.themeId);
      if (existing) {
        existing.totalInvestedInr += h.investedInr;
        existing.totalCurrentInr += h.currentInr;
        existing.holdings.push(h);
      } else {
        themeMap.set(h.themeId, {
          theme: cat,
          totalInvestedInr: h.investedInr,
          totalCurrentInr: h.currentInr,
          holdings: [h],
        });
      }
    }

    const thematicGroups = Array.from(themeMap.values())
      .map((g) => ({
        ...g,
        weightPct:
          totalInvestedInr > 0
            ? Number(((g.totalInvestedInr / totalInvestedInr) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.totalInvestedInr - a.totalInvestedInr);

    // 2. Capital Concentration (Sorted by Invested Capital)
    const sortedByInvested = [...normalizedHoldings].sort(
      (a, b) => b.investedInr - a.investedInr
    );
    const topHolding = sortedByInvested[0];
    const topHoldingWeightPct =
      totalInvestedInr > 0
        ? Number(((topHolding.investedInr / totalInvestedInr) * 100).toFixed(1))
        : 0;

    const top3Invested = sortedByInvested
      .slice(0, 3)
      .reduce((sum, h) => sum + h.investedInr, 0);
    const top3WeightPct =
      totalInvestedInr > 0
        ? Number(((top3Invested / totalInvestedInr) * 100).toFixed(1))
        : 0;

    // 3. Performance Matrix (Gainers vs Drawdown)
    const sortedByReturn = [...normalizedHoldings].sort(
      (a, b) => b.pnlPct - a.pnlPct
    );
    const gainers = sortedByReturn.filter((h) => h.pnlPct > 0);
    const losers = sortedByReturn.filter((h) => h.pnlPct < 0);
    const topPerformer = sortedByReturn[0];
    const topLaggard = sortedByReturn[sortedByReturn.length - 1];

    const inrInvestedPct =
      totalInvestedInr > 0
        ? Number(((inrInvestedTotal / totalInvestedInr) * 100).toFixed(1))
        : 0;
    const usdInvestedPct =
      totalInvestedInr > 0
        ? Number(((usdInvestedTotalInr / totalInvestedInr) * 100).toFixed(1))
        : 0;

    // 4. Personalized Analytical Takeaways (explicitly mentioning what the user owns)
    const takeaways: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
      tag?: string;
    }> = [];

    // Thematic takeaway
    if (thematicGroups.length > 0) {
      const leadTheme = thematicGroups[0];
      const stockTickers = leadTheme.holdings.map((h) => h.ticker).join(", ");
      takeaways.push({
        icon: leadTheme.theme.icon,
        title: `${leadTheme.theme.name} Anchor (${leadTheme.weightPct}%)`,
        description: `Your highest capital commitment is in ${leadTheme.theme.name.toLowerCase()} through ${stockTickers}, representing ${leadTheme.weightPct}% of invested equity.`,
        tag: "Core Thesis",
      });
    }

    // Currency & Global hedge takeaway
    if (usdInvestedPct > 0) {
      takeaways.push({
        icon: <Globe size={14} />,
        title: `Cross-Border USD Hedge (${usdInvestedPct}%)`,
        description: `You have $${usdInvestedNative.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} committed in US stocks, providing international diversification and compounding dollar purchasing power against domestic INR inflation.`,
        tag: "Global Hedge",
      });
    }

    // Alpha / Performance takeaway
    if (topPerformer && topPerformer.pnlPct > 0) {
      const isUsd = topPerformer.currency === "USD";
      const pnlDisplay = isUsd
        ? `+$${topPerformer.pnlNative.toFixed(2)} (+${topPerformer.pnlPct.toFixed(1)}%)`
        : `+₹${topPerformer.pnlNative.toFixed(2)} (+${topPerformer.pnlPct.toFixed(1)}%)`;
      takeaways.push({
        icon: <TrendingUp size={14} />,
        title: `Primary Alpha Driver: ${topPerformer.name}`,
        description: `${topPerformer.ticker} is currently your best-performing holding with ${pnlDisplay} in unrealized profit, driving portfolio outperformance.`,
        tag: "Alpha Leader",
      });
    }

    // Drawdown / Accumulation takeaway
    if (topLaggard && topLaggard.pnlPct < 0) {
      takeaways.push({
        icon: <Scale size={14} />,
        title: `Accumulation Window: ${topLaggard.name}`,
        description: `${topLaggard.ticker} is trading at ${topLaggard.pnlPct.toFixed(1)}% vs your average cost. This represents an attractive discount level for dollar-cost averaging if your long-term thesis remains intact.`,
        tag: "DCA Watch",
      });
    }

    return {
      totalInvestedInr,
      totalCurrentInr,
      totalPnlInr,
      netReturnPct,
      thematicGroups,
      sortedByInvested,
      topHolding,
      topHoldingWeightPct,
      top3WeightPct,
      topPerformer,
      topLaggard,
      gainersCount: gainers.length,
      losersCount: losers.length,
      winRatePct: Math.round((gainers.length / normalizedHoldings.length) * 100),
      inrInvestedPct,
      usdInvestedPct,
      usdInvestedNative,
      inrInvestedTotal,
      takeaways,
    };
  }, [assets, usdInrRate]);

  if (!analysis) {
    return (
      <section className="apple-analysis-section">
        <div className="overview-insight-card" style={{ padding: "26px", textAlign: "center" }}>
          <div style={{ display: "inline-grid", placeItems: "center", width: "42px", height: "42px", borderRadius: "12px", background: "rgba(0, 70, 67, 0.08)", color: "#004643", margin: "0 auto 12px" }}>
            <BarChart3 size={20} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#0E2422" }}>
            No Investment Data to Analyze Yet
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#4A5E5B" }}>
            Add stocks to your portfolio to view automated thematic sector breakdown, capital concentration, and return analysis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="apple-analysis-section">
      {/* SECTION HEADER WITH COLLAPSE / EXPAND TOGGLE */}
      <div className="apple-analysis-header">
        <div className="apple-analysis-title-wrap">
          <span className="apple-analysis-icon-badge">
            <BrainCircuit size={17} />
          </span>
          <div>
            <div className="apple-analysis-title-row">
              <h2 className="apple-analysis-heading">{title}</h2>
              <span className="apple-analysis-chip-count">
                {assets.length} Holdings Analyzed
              </span>
            </div>
            <p className="apple-analysis-subheading">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="apple-analysis-toggle-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          title={isExpanded ? "Collapse Investment Analysis" : "Expand Investment Analysis"}
        >
          <span>{isExpanded ? "Hide Details" : "Show Analysis"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="apple-analysis-body">
          {/* 1. TOP BENTO GRID: SECTOR ALLOCATION + CAPITAL CONCENTRATION */}
          <div className="apple-analysis-grid-2col">
            {/* CARD A: THEMATIC & SECTOR EXPOSURE */}
            <div className="overview-insight-card">
              <div className="overview-card-head">
                <div className="overview-card-title-row">
                  <span className="overview-card-icon cyprus">
                    <Layers size={16} />
                  </span>
                  <div>
                    <h3 className="overview-card-title">Thematic & Sector Exposure</h3>
                    <p className="overview-card-sub">Capital deployment across industry themes</p>
                  </div>
                </div>
                <span className="overview-chip-badge ok">
                  {analysis.thematicGroups.length} Active Themes
                </span>
              </div>

              {/* Spectrum Progress Bar */}
              <div className="apple-spectrum-bar-wrap" style={{ margin: "2px 0 6px" }}>
                <div className="apple-spectrum-bar" style={{ height: "10px", borderRadius: "9999px" }}>
                  {analysis.thematicGroups.map((g) => (
                    <div
                      key={g.theme.id}
                      style={{
                        width: `${Math.max(4, g.weightPct)}%`,
                        backgroundColor: g.theme.color,
                        height: "100%",
                        transition: "width 0.4s ease",
                      }}
                      title={`${g.theme.name}: ${g.weightPct}% (${money(g.totalInvestedInr)})`}
                    />
                  ))}
                </div>
              </div>

              {/* Thematic Rows List */}
              <div className="apple-analysis-thematic-list">
                {analysis.thematicGroups.map((g) => (
                  <div key={g.theme.id} className="apple-analysis-theme-row">
                    <div className="apple-analysis-theme-left">
                      <span
                        className="apple-analysis-theme-dot"
                        style={{ backgroundColor: g.theme.color }}
                      />
                      <div className="apple-analysis-theme-info">
                        <div className="apple-analysis-theme-name-row">
                          <span className="apple-analysis-theme-name">
                            {g.theme.name}
                          </span>
                          <span className="apple-analysis-theme-pct">
                            {g.weightPct}%
                          </span>
                        </div>
                        <div className="apple-analysis-stock-pills">
                          {g.holdings.map((h) => (
                            <span
                              key={h.id}
                              className="apple-analysis-stock-pill"
                              style={{
                                color: h.pnlPct >= 0 ? "#004643" : "#991b1b",
                                borderColor:
                                  h.pnlPct >= 0
                                    ? "rgba(0, 70, 67, 0.2)"
                                    : "rgba(220, 38, 38, 0.2)",
                              }}
                            >
                              <strong>{h.ticker}</strong>
                              <small>
                                {h.pnlPct >= 0
                                  ? `+${h.pnlPct.toFixed(1)}%`
                                  : `${h.pnlPct.toFixed(1)}%`}
                              </small>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="apple-analysis-theme-val">
                      {money(g.totalInvestedInr)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="overview-note-box">
                {analysis.thematicGroups[0]
                  ? `Your highest concentration is in ${analysis.thematicGroups[0].theme.name} (${analysis.thematicGroups[0].weightPct}%), providing high conviction growth.`
                  : "Balanced across multiple sector verticals."}
              </div>
            </div>

            {/* CARD B: CAPITAL CONCENTRATION & FX BALANCE */}
            <div className="overview-insight-card">
              <div className="overview-card-head">
                <div className="overview-card-title-row">
                  <span className="overview-card-icon cyprus">
                    <Target size={16} />
                  </span>
                  <div>
                    <h3 className="overview-card-title">Capital Concentration & Balance</h3>
                    <p className="overview-card-sub">Holding weights & currency allocation</p>
                  </div>
                </div>
                <span
                  className={`overview-chip-badge ${
                    analysis.topHoldingWeightPct > 35 ? "warn" : "ok"
                  }`}
                >
                  {analysis.topHoldingWeightPct > 35 ? "High Weight" : "Healthy Spread"}
                </span>
              </div>

              {/* Heaviest Holding Highlight */}
              <div className="apple-analysis-highlight-box">
                <div className="apple-analysis-highlight-head">
                  <span className="apple-analysis-highlight-label">
                    HEAVIEST CAPITAL ALLOCATION
                  </span>
                  <span className="apple-analysis-highlight-val">
                    {analysis.topHoldingWeightPct}% of Equities
                  </span>
                </div>
                <div className="apple-analysis-highlight-name-row">
                  <strong>{analysis.topHolding.name}</strong>
                  <span>{money(analysis.topHolding.investedInr)} invested</span>
                </div>
                <div className="overview-meter-bar" style={{ marginTop: "6px" }}>
                  <div
                    className="overview-meter-fill"
                    style={{
                      width: `${Math.min(100, analysis.topHoldingWeightPct)}%`,
                      backgroundColor:
                        analysis.topHoldingWeightPct > 35 ? "#f59e0b" : "#004643",
                    }}
                  />
                </div>
              </div>

              {/* KV List */}
              <div className="overview-kv-list">
                <div className="overview-kv-row">
                  <span>Top 3 Holdings Concentration</span>
                  <strong>
                    {analysis.top3WeightPct}% of total capital
                    <small
                      style={{
                        marginLeft: "6px",
                        fontWeight: 500,
                        color: analysis.top3WeightPct > 65 ? "#b45309" : "#004643",
                      }}
                    >
                      ({analysis.top3WeightPct > 65 ? "High concentration" : "Good spread"})
                    </small>
                  </strong>
                </div>

                <div className="overview-kv-row">
                  <span>Domestic Exposure (INR)</span>
                  <strong>
                    {money(analysis.inrInvestedTotal)} ({analysis.inrInvestedPct}%)
                  </strong>
                </div>

                <div className="overview-kv-row">
                  <span>Global Exposure (USD)</span>
                  <strong>
                    ${analysis.usdInvestedNative.toFixed(2)} ({analysis.usdInvestedPct}%)
                  </strong>
                </div>

                <div className="overview-kv-row">
                  <span>Holdings Win Rate</span>
                  <strong>
                    <span style={{ color: "#16a34a" }}>{analysis.gainersCount} in Profit</span>
                    {" / "}
                    <span style={{ color: analysis.losersCount > 0 ? "#dc2626" : "#4A5E5B" }}>
                      {analysis.losersCount} Drawdown
                    </span>{" "}
                    ({analysis.winRatePct}%)
                  </strong>
                </div>
              </div>

              <div className="overview-note-box">
                {analysis.usdInvestedPct > 25
                  ? "Strong cross-border diversification protects portfolio purchasing power from local currency volatility."
                  : "Consider scaling global or index holdings for increased multi-market stability."}
              </div>
            </div>
          </div>

          {/* 2. RETURN DRIVERS & TAKEAWAYS (PERSONALIZED TO INVESTED ASSETS) */}
          <div className="apple-analysis-grid-2col" style={{ marginTop: "14px" }}>
            {/* CARD C: RETURN DRIVERS & ALPHA MATRIX */}
            <div className="overview-insight-card">
              <div className="overview-card-head">
                <div className="overview-card-title-row">
                  <span className="overview-card-icon cyprus">
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <h3 className="overview-card-title">Alpha Drivers & Drag Matrix</h3>
                    <p className="overview-card-sub">Top wealth generators and consolidation watch</p>
                  </div>
                </div>
                <span className="overview-chip-badge ok">
                  Net: {analysis.netReturnPct >= 0 ? `+${analysis.netReturnPct.toFixed(2)}%` : `${analysis.netReturnPct.toFixed(2)}%`}
                </span>
              </div>

              <div className="apple-analysis-alpha-container">
                {/* Winner Card */}
                {analysis.topPerformer && (
                  <div className="apple-analysis-alpha-card winner">
                    <div className="apple-analysis-alpha-badge-row">
                      <span className="apple-analysis-alpha-tag positive">
                        <ArrowUpRight size={12} /> Top Performer
                      </span>
                      <span className="apple-analysis-alpha-pct positive">
                        +{analysis.topPerformer.pnlPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="apple-analysis-alpha-details">
                      <strong>{analysis.topPerformer.name}</strong>
                      <span className="apple-analysis-alpha-sub">
                        {analysis.topPerformer.ticker} ·{" "}
                        {analysis.topPerformer.currency === "USD"
                          ? `+$${analysis.topPerformer.pnlNative.toFixed(2)}`
                          : `+₹${analysis.topPerformer.pnlNative.toFixed(2)}`}{" "}
                        gain
                      </span>
                    </div>
                  </div>
                )}

                {/* Laggard / Opportunity Card */}
                {analysis.topLaggard && analysis.topLaggard.pnlPct < 0 ? (
                  <div className="apple-analysis-alpha-card laggard">
                    <div className="apple-analysis-alpha-badge-row">
                      <span className="apple-analysis-alpha-tag negative">
                        <ArrowDownRight size={12} /> Value Consolidation
                      </span>
                      <span className="apple-analysis-alpha-pct negative">
                        {analysis.topLaggard.pnlPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="apple-analysis-alpha-details">
                      <strong>{analysis.topLaggard.name}</strong>
                      <span className="apple-analysis-alpha-sub">
                        {analysis.topLaggard.ticker} ·{" "}
                        {analysis.topLaggard.currency === "USD"
                          ? `-$${Math.abs(analysis.topLaggard.pnlNative).toFixed(2)}`
                          : `-₹${Math.abs(analysis.topLaggard.pnlNative).toFixed(2)}`}{" "}
                        drawdown vs buy price
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="apple-analysis-alpha-card clean">
                    <div className="apple-analysis-alpha-badge-row">
                      <span className="apple-analysis-alpha-tag positive">
                        <ShieldCheck size={12} /> 100% Green
                      </span>
                    </div>
                    <div className="apple-analysis-alpha-details">
                      <strong>All Holdings Profitable</strong>
                      <span className="apple-analysis-alpha-sub">
                        Zero underwater positions currently in your stock portfolio.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 3 Invested Holdings Summary */}
              <div className="apple-analysis-capital-tiers">
                <span className="apple-analysis-tiers-title">
                  CAPITAL DEPLOYED BY LEADING POSITIONS:
                </span>
                <div className="apple-analysis-tiers-list">
                  {analysis.sortedByInvested.slice(0, 4).map((h, i) => (
                    <div key={h.id} className="apple-analysis-tier-item">
                      <span className="apple-analysis-tier-rank">#{i + 1}</span>
                      <div className="apple-analysis-tier-content">
                        <div className="apple-analysis-tier-header">
                          <span className="apple-analysis-tier-name">{h.name}</span>
                          <span className="apple-analysis-tier-val">{money(h.investedInr)}</span>
                        </div>
                        <div className="overview-meter-bar" style={{ height: "4px" }}>
                          <div
                            className="overview-meter-fill"
                            style={{
                              width: `${((h.investedInr / analysis.totalInvestedInr) * 100).toFixed(1)}%`,
                              backgroundColor: h.themeColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD D: PERSONALIZED TAKEAWAYS BASED ON WHAT USER IS INVESTED IN */}
            <div className="overview-insight-card">
              <div className="overview-card-head">
                <div className="overview-card-title-row">
                  <span className="overview-card-icon cyprus">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="overview-card-title">Holdings-Based Intelligence</h3>
                    <p className="overview-card-sub">Dynamic observations from your active positions</p>
                  </div>
                </div>
                <span className="overview-chip-badge">Actionable</span>
              </div>

              <div className="apple-analysis-takeaways-list">
                {analysis.takeaways.map((item, idx) => (
                  <div key={idx} className="apple-analysis-takeaway-item">
                    <div className="apple-analysis-takeaway-icon-wrap">
                      {item.icon}
                    </div>
                    <div className="apple-analysis-takeaway-content">
                      <div className="apple-analysis-takeaway-header">
                        <strong className="apple-analysis-takeaway-title">
                          {item.title}
                        </strong>
                        {item.tag && (
                          <span className="apple-analysis-takeaway-tag">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="apple-analysis-takeaway-desc">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overview-note-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Info size={14} style={{ flexShrink: 0, color: "#004643" }} />
                <span>
                  Analysis automatically synchronizes with live market quotes and currency exchange benchmarks.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

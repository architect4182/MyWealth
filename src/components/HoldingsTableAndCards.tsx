"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Layers,
  TableProperties,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Plus,
  ChartNoAxesCombined,
  Repeat,
} from "lucide-react";
import { AssetPosition, AssetCategory } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import { StockLogoAvatar, getStockTicker } from "@/components/Logos";
import { MarketTimingBadge, getAssetMarketStatus } from "@/components/MarketBadge";
import { getNextSipDate } from "@/utils/sip";
import { getBrokerDestinationUrl } from "@/utils/brokers";

function formatQty(q: number): string {
  if (!Number.isFinite(q)) return "0";
  if (Math.abs(q - Math.round(q)) < 1e-8) return String(Math.round(q));
  return Number(q.toFixed(8)).toString();
}

export interface FilterSubTab {
  key: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

export interface HoldingsTableAndCardsProps {
  assets: AssetPosition[];
  filterTabs?: FilterSubTab[];
  activeFilterTab?: string;
  onFilterTabChange?: (key: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultAddCategory?: AssetCategory;
}

export function HoldingsTableAndCards({
  assets,
  filterTabs,
  activeFilterTab,
  onFilterTabChange,
  emptyTitle = "No holdings found",
  emptyDescription = "Add a position or try clearing your search query.",
  defaultAddCategory = "Indian Equities",
}: HoldingsTableAndCardsProps) {
  const {
    isLoading,
    unsavedAssetIds,
    flashAssetId,
    money,
    showUsdInRupees,
    currentTime,
    setModal,
    setDefaultCategory,
    openAssetDetail,
  } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortField, setSortField] = useState<"name" | "price" | "invested" | "value" | "pnl">("pnl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  function handleSort(field: "name" | "price" | "invested" | "value" | "pnl") {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  // Pre-cached market statuses for entire collection to eliminate redundant Date calculations
  const usStatus = useMemo(() => getAssetMarketStatus("US Stocks", currentTime), [currentTime]);
  const inStatus = useMemo(() => getAssetMarketStatus("Indian Equities", currentTime), [currentTime]);

  const displayedAssets = useMemo(() => {
    let list = [...assets];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          getStockTicker(a.name, a.category).toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? cmp : -cmp;
      } else if (sortField === "price") {
        valA = a.currentPrice;
        valB = b.currentPrice;
      } else if (sortField === "invested") {
        valA = a.investedAmount !== undefined && a.investedAmount > 0 ? a.investedAmount : a.quantity * a.buyPrice;
        valB = b.investedAmount !== undefined && b.investedAmount > 0 ? b.investedAmount : b.quantity * b.buyPrice;
      } else if (sortField === "value") {
        valA = a.quantity * a.currentPrice;
        valB = b.quantity * b.currentPrice;
      } else if (sortField === "pnl") {
        const invA = a.investedAmount !== undefined && a.investedAmount > 0 ? a.investedAmount : a.quantity * a.buyPrice;
        const curA = a.quantity * a.currentPrice;
        valA = curA - invA;

        const invB = b.investedAmount !== undefined && b.investedAmount > 0 ? b.investedAmount : b.quantity * b.buyPrice;
        const curB = b.quantity * b.currentPrice;
        valB = curB - invB;
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [assets, searchQuery, sortField, sortOrder]);

  return (
    <section className="apple-holdings-section">
      {/* Section Toolbar */}
      <div className="apple-holdings-toolbar">
        {filterTabs && filterTabs.length > 0 && onFilterTabChange && (
          <div className="apple-filter-group">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`apple-filter-pill ${activeFilterTab === tab.key ? "active" : ""}`}
                onClick={() => onFilterTabChange(tab.key)}
              >
                {tab.icon}
                <span>{tab.label} ({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        <div className="apple-toolbar-right">
          {/* Instant Search Bar */}
          <div className="apple-search-wrap">
            <Search size={14} className="apple-search-icon" />
            <input
              type="text"
              placeholder="Search assets or tickers…"
              className="apple-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Switcher: Apple Cards vs Apple Table */}
          <div className="apple-view-toggle">
            <button
              type="button"
              className={`apple-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Apple Cards View"
            >
              <Layers size={13} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`apple-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Spreadsheet Table View"
            >
              <TableProperties size={13} />
              <span>Table</span>
            </button>
          </div>

          {/* Quick Sort Selector */}
          <button
            type="button"
            className="apple-filter-pill"
            onClick={() => handleSort("pnl")}
            title="Toggle Sort by Return"
          >
            <ArrowUpDown size={12} />
            <span>Sort: {sortField.toUpperCase()} ({sortOrder})</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="ios-loading-container">
          <div className="ios-loading-card">
            <div className="ios-spinner" role="status" aria-label="Loading">
              <div /><div /><div /><div /><div /><div />
              <div /><div /><div /><div /><div /><div />
            </div>
            <span className="ios-loading-title">Loading Positions</span>
            <span className="ios-loading-subtitle">Please Wait...</span>
          </div>
          <div className="ios-skeleton-wrap">
            <div className="ios-skeleton-row" style={{ width: "100%" }} />
            <div className="ios-skeleton-row" style={{ width: "95%" }} />
            <div className="ios-skeleton-row" style={{ width: "98%" }} />
          </div>
        </div>
      ) : displayedAssets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ChartNoAxesCombined size={24} />
          </div>
          <strong>{emptyTitle}</strong>
          <p>{emptyDescription}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setDefaultCategory(defaultAddCategory);
              setModal(true);
            }}
          >
            <Plus size={15} /> Add investment
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* APPLE STOCKS GLASS CARDS STACK */
        <div className="apple-card-stack">
          {displayedAssets.map((item) => {
            const ticker = getStockTicker(item.name, item.category);
            const isUnsaved = unsavedAssetIds.has(item.id);
            const isFlashed = flashAssetId === item.id;
            const investedVal = item.investedAmount !== undefined && item.investedAmount > 0
              ? item.investedAmount
              : (item.quantity * item.buyPrice);
            const currentVal = item.quantity * item.currentPrice;
            const pnl = currentVal - investedVal;
            const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
            const unitGain = item.currentPrice - item.buyPrice;
            const unitGainPct = item.buyPrice > 0 ? (unitGain / item.buyPrice) * 100 : 0;

            return (
              <div
                key={item.id}
                className={`apple-asset-card ${isFlashed ? "flash-pulse" : ""} ${
                  isUnsaved ? "unsaved-glow" : ""
                }`}
                onClick={() => openAssetDetail(item)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openAssetDetail(item);
                  }
                }}
              >
                {/* Left Side: Avatar + Full Name + Ticker & Category + Holdings & Cost */}
                <div className="apple-asset-card-main">
                  <div className="apple-avatar-squircle">
                    <StockLogoAvatar
                      name={item.name}
                      ticker={ticker}
                      category={item.category}
                    />
                  </div>

                  <div className="apple-identity-text">
                    <div className="apple-asset-name-row">
                      <h4 className="apple-asset-name">{item.name}</h4>
                      {isUnsaved && (
                        <span className="apple-live-badge">
                          <Sparkles size={8} /> Live
                        </span>
                      )}
                    </div>

                    <div className="apple-asset-tags">
                      <span className="apple-ticker-pill">{ticker}</span>
                      <span className="apple-category-pill">{item.category}</span>
                      {item.isSip && (
                        <span
                          className={`apple-sip-pill ${item.sipStatus === "paused" ? "paused" : "active"}`}
                          title={`Monthly SIP: ${money(item.sipAmount || 0, item.currency)} on ${item.sipDay || 5}th. Next auto-investment: ${getNextSipDate(item.sipDay || 5)}`}
                        >
                          <Repeat size={10} /> SIP · {money(item.sipAmount || 0, item.currency)}/mo ({item.sipDay || 5}th)
                          {item.sipStatus === "paused" ? " • Paused" : ""}
                        </span>
                      )}
                      <MarketTimingBadge
                        status={item.category === "US Stocks" ? usStatus : inStatus}
                        compact
                      />
                      {item.brokerApp && (() => {
                        const brokerUrl = getBrokerDestinationUrl(
                          item.brokerApp,
                          item.name,
                          ticker,
                          item.category
                        );
                        return (
                          <a
                            href={brokerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="apple-broker-pill"
                            title={`Open ${item.brokerApp} website in new tab`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            via {item.brokerApp} ↗
                          </a>
                        );
                      })()}
                    </div>

                    <div className="apple-asset-holdings-line">
                      <span className="apple-holdings-tag">
                        <strong>{formatQty(item.quantity)}</strong> units
                      </span>
                      <span className="apple-dot-sep">•</span>
                      <span className="apple-cost-tag">
                        Avg: {item.currency === "USD" ? `$${item.buyPrice.toFixed(2)}` : `₹${item.buyPrice.toFixed(2)}`}
                      </span>
                      <span className="apple-dot-sep">•</span>
                      <span className="apple-inv-tag">
                        Inv: {money(investedVal, item.currency)}
                      </span>
                      {item.isSip && (
                        <>
                          <span className="apple-dot-sep">•</span>
                          <span className="apple-sip-sched-tag">
                            Next: {getNextSipDate(item.sipDay || 5)} ({item.sipInstallments || 1} done)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Valuation + CMP + Return Gain */}
                <div className="apple-asset-card-right">
                  <div className="apple-card-valuation-group">
                    <div className="apple-card-val-primary-col">
                      <div className="apple-val-primary">
                        {money(currentVal, item.currency)}
                      </div>
                      <div className="apple-cmp-sub">
                        {item.category === "Mutual Funds" ? "NAV" : "CMP"}: {item.currency === "USD" ? `$${item.currentPrice.toFixed(2)}` : `₹${item.category === "Mutual Funds" ? item.currentPrice.toFixed(4) : item.currentPrice.toFixed(2)}`}
                        {unitGain !== 0 && (
                          <span className={`apple-unit-diff ${unitGain >= 0 ? "positive-text" : "negative-text"}`}>
                            {" "}({unitGain >= 0 ? "+" : ""}{unitGainPct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      {item.currency === "USD" && showUsdInRupees && (
                        <span className="apple-val-usd-pill" style={{ margin: "1px 0" }}>
                          ${currentVal.toFixed(2)} USD
                        </span>
                      )}
                    </div>

                    <div
                      className={`apple-return-pill ${
                        pnl >= 0 ? "positive" : "negative"
                      }`}
                      style={{ margin: 0, padding: "2px 7px", fontSize: "11px" }}
                    >
                      {pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      <span>
                        {pnl >= 0 ? "+" : ""}
                        {money(pnl, item.currency)} ({pnlPct >= 0 ? "+" : ""}
                        {pnlPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="apple-card-chevron-circle" title="Click to view live charts & details">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SPREADSHEET TABLE VIEW */
        <div className="apple-table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th
                    className="sortable-th"
                    onClick={() => handleSort("name")}
                  >
                    <div className="th-content">
                      <span>Asset & Market</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => handleSort("price")}
                  >
                    <div className="th-content th-right">
                      <span>Price / Avg Buy</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => handleSort("invested")}
                  >
                    <div className="th-content th-right">
                      <span>Invested / Units</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => handleSort("value")}
                  >
                    <div className="th-content th-right">
                      <span>Current Value</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => handleSort("pnl")}
                  >
                    <div className="th-content th-right">
                      <span>Profit / Loss</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ width: "28px" }}></th>
                </tr>
              </thead>
              <tbody>
                {displayedAssets.map((item) => {
                  const ticker = getStockTicker(item.name, item.category);
                  const isUnsaved = unsavedAssetIds.has(item.id);
                  const isFlashed = flashAssetId === item.id;
                  const investedVal = item.investedAmount !== undefined && item.investedAmount > 0
              ? item.investedAmount
              : (item.quantity * item.buyPrice);
                  const currentVal = item.quantity * item.currentPrice;
                  const pnl = currentVal - investedVal;
                  const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                  return (
                    <tr
                      key={item.id}
                      className={isFlashed ? "flash-pulse" : ""}
                      onClick={() => openAssetDetail(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            className="apple-avatar-squircle"
                            style={{ width: "36px", height: "36px" }}
                          >
                            <StockLogoAvatar
                              name={item.name}
                              ticker={ticker}
                              category={item.category}
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <strong
                                style={{
                                  color: "var(--foreground)",
                                  fontSize: "13px",
                                }}
                              >
                                {item.name}
                              </strong>
                              {isUnsaved && (
                                <span className="apple-live-badge">
                                  <Sparkles size={8} /> Live
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginTop: "3px",
                                alignItems: "center",
                              }}
                            >
                              <span className="apple-ticker-pill">{ticker}</span>
                              <span className="apple-category-pill">
                                {item.category}
                              </span>
                              {item.isSip && (
                                <span
                                  className={`apple-sip-table-pill ${item.sipStatus === "paused" ? "paused" : "active"}`}
                                  title={`Monthly SIP: ${money(item.sipAmount || 0, item.currency)} on ${item.sipDay || 5}th. Next: ${getNextSipDate(item.sipDay || 5)}`}
                                >
                                  SIP{item.sipStatus === "paused" ? " (Paused)" : ""}
                                </span>
                              )}
                              <MarketTimingBadge
                                status={
                                  item.category === "US Stocks" ? usStatus : inStatus
                                }
                                compact
                              />
                              {item.brokerApp && (() => {
                                const brokerUrl = getBrokerDestinationUrl(
                                  item.brokerApp,
                                  item.name,
                                  ticker,
                                  item.category
                                );
                                return (
                                  <a
                                    href={brokerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="apple-broker-pill"
                                    title={`Open ${item.brokerApp} website in new tab`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    via {item.brokerApp} ↗
                                  </a>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <strong
                          style={{
                            color: "var(--foreground)",
                            fontSize: "13px",
                          }}
                        >
                          {item.currency === "USD"
                            ? `$${item.currentPrice.toFixed(2)}`
                            : `₹${item.category === "Mutual Funds" ? item.currentPrice.toFixed(4) : item.currentPrice.toFixed(2)}`}
                        </strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          Avg{" "}
                          {item.currency === "USD"
                            ? `$${item.buyPrice.toFixed(2)}`
                            : `₹${item.buyPrice.toFixed(2)}`}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <strong
                          style={{
                            color: "var(--foreground)",
                            fontSize: "13px",
                          }}
                        >
                          {money(investedVal, item.currency)}
                        </strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {formatQty(item.quantity)} units
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <strong
                          style={{
                            color: "var(--foreground)",
                            fontSize: "14px",
                          }}
                        >
                          {money(currentVal, item.currency)}
                        </strong>
                        {item.currency === "USD" && showUsdInRupees && (
                          <div
                            className="apple-val-usd-pill"
                            style={{ display: "inline-block" }}
                          >
                            ${currentVal.toFixed(2)} USD
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div
                          className={`apple-return-pill ${
                            pnl >= 0 ? "positive" : "negative"
                          }`}
                          style={{ display: "inline-flex" }}
                        >
                          {pnl >= 0 ? (
                            <TrendingUp size={11} />
                          ) : (
                            <TrendingDown size={11} />
                          )}
                          <span>
                            {pnl >= 0 ? "+" : ""}
                            {money(pnl, item.currency)} ({pnlPct >= 0 ? "+" : ""}
                            {pnlPct.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", width: "28px", paddingRight: "10px" }}>
                        <div className="apple-table-chevron-circle" title="Click to view live charts & details">
                          <ChevronRight size={13} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

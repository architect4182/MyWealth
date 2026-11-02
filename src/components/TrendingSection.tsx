"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { StockLogoAvatar, getStockTicker } from "@/components/Logos";
import { AssetCategory } from "@/types/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  getInitialTrendingIndiaStocks,
  getInitialTrendingUSStocks,
  getInitialTrendingMF,
} from "@/data/trendingPool";

export interface TrendingItem {
  rank: number;
  symbol?: string;
  code?: number;
  name: string;
  ticker: string;
  category: AssetCategory;
  subCategory?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: "INR" | "USD";
  market?: string;
}

export const TrendingSection = React.memo(function TrendingSection({ type }: { type: "stocks" | "mf" }) {
  const { showUsdInRupees, usdInrRate, money, assets, openAssetDetail } = usePortfolio();

  const handleTrendingClick = (item: TrendingItem) => {
    // 1. Check if user already owns this asset in their portfolio
    const existing = assets.find(
      (a) =>
        a.name.toLowerCase() === item.name.toLowerCase() ||
        (item.symbol && a.name.toLowerCase().includes(item.symbol.toLowerCase())) ||
        (item.code && a.name.includes(String(item.code)))
    );

    if (existing) {
      openAssetDetail(existing);
    } else {
      openAssetDetail({
        id: item.code ? `MF-${item.code}` : item.symbol || `trending-${item.name}`,
        name: item.name,
        category: item.category,
        quantity: 0,
        buyPrice: item.price,
        currentPrice: item.price,
        currency: item.currency,
        date: new Date().toISOString().split("T")[0],
        isSip: false,
      });
    }
  };

  // Instant baseline state: load company name and info immediately on frame 0!
  const [indiaItems, setIndiaItems] = useState<TrendingItem[]>(() =>
    type === "stocks" ? (getInitialTrendingIndiaStocks() as TrendingItem[]) : []
  );
  const [usItems, setUsItems] = useState<TrendingItem[]>(() =>
    type === "stocks" ? (getInitialTrendingUSStocks() as TrendingItem[]) : []
  );
  const [items, setItems] = useState<TrendingItem[]>(() =>
    type === "mf"
      ? (getInitialTrendingMF() as TrendingItem[])
      : ([...getInitialTrendingIndiaStocks(), ...getInitialTrendingUSStocks()] as TrendingItem[])
  );

  const [marketTab, setMarketTab] = useState<"both" | "india" | "us">("both");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fresh call every time page opens (never cached in DB)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const freshSeed = Date.now();
    fetch(`/api/trending?type=${type}&seed=${freshSeed}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.items) setItems(data.items);
          if (data.indiaItems) setIndiaItems(data.indiaItems);
          if (data.usItems) setUsItems(data.usItems);
        }
      })
      .catch((err) => {
        console.error("Failed to load trending items:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type]);

  // When clicked on refresh, fetch fresh items with a new seed
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const newSeed = Date.now() + Math.floor(Math.random() * 100000);
    try {
      const res = await fetch(`/api/trending?type=${type}&seed=${newSeed}`);
      const data = await res.json();
      if (data.items) setItems(data.items);
      if (data.indiaItems) setIndiaItems(data.indiaItems);
      if (data.usItems) setUsItems(data.usItems);
    } catch (err) {
      console.error("Refresh trending failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const title =
    type === "stocks" ? "Trending Stocks Today" : "Top Trending Mutual Funds";
  const subtitle =
    type === "stocks"
      ? "Top 10 India (NSE) & Top 10 USA (Wall St) market movers"
      : "Top 10 popular mutual fund schemes across categories";

  const renderGrid = (list: TrendingItem[]) => (
    <div className="apple-trending-grid">
      {list.map((item) => {
        const isPos = item.changePercent >= 0;
        const ticker = item.ticker || getStockTicker(item.name);
        const absChange = Math.abs(item.change || 0);
        const isUsd = item.currency === "USD";
        const isConverted = isUsd && showUsdInRupees;

        return (
          <div
            key={`${item.rank}-${item.symbol || item.name}`}
            className="apple-trending-card"
            onClick={() => handleTrendingClick(item)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            title={`Click to view live chart & details for ${item.name}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTrendingClick(item);
              }
            }}
          >
            <div className="apple-trending-card-left">
              <span
                className={`apple-trending-rank ${
                  item.rank === 1
                    ? "rank-gold"
                    : item.rank === 2
                    ? "rank-silver"
                    : item.rank === 3
                    ? "rank-bronze"
                    : ""
                }`}
              >
                #{item.rank}
              </span>

              <div
                className="apple-avatar-squircle"
                style={{ width: "36px", height: "36px", minWidth: "36px" }}
              >
                <StockLogoAvatar
                  name={item.name}
                  ticker={ticker}
                  category={item.category}
                />
              </div>

              <div className="apple-trending-info">
                <h4 className="apple-trending-name" title={item.name}>
                  {item.name}
                </h4>
                <div className="apple-trending-meta-row">
                  <span className="apple-ticker-pill">{ticker}</span>
                  {item.subCategory ? (
                    <span className="apple-category-pill">
                      {item.subCategory}
                    </span>
                  ) : (
                    item.market && (
                      <span className="apple-category-pill">
                        {item.market}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="apple-trending-card-right">
              <div className="apple-trending-price-group">
                <div className="apple-trending-price-row">
                  <span className="apple-trending-price">
                    {money(item.price, item.currency)}
                  </span>
                  {isConverted && (
                    <span
                      className="apple-val-usd-pill"
                      style={{ margin: 0, fontSize: "9px", padding: "1px 5px", lineHeight: "1.2" }}
                      title={`Original: $${item.price.toFixed(2)} USD (converted at live 1 USD = ₹${usdInrRate.toFixed(2)})`}
                    >
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div
                  className={`apple-return-pill ${
                    isPos ? "positive" : "negative"
                  }`}
                  style={{ margin: 0, padding: "2px 7px", fontSize: "11px" }}
                >
                  {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>
                    {isPos ? "+" : "-"}
                    {money(absChange, item.currency)}{" "}
                    ({isPos ? "+" : ""}{item.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="apple-trending-chevron" title="Click to view live chart & details">
                <ChevronRight size={13} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="apple-trending-section">
      {/* Section Header */}
      <div className="apple-trending-header">
        <div className="apple-trending-title-group">
          <div className="apple-trending-icon-badge">
            <Flame size={16} />
          </div>
          <div>
            <div className="apple-trending-title-row">
              <h3 className="apple-trending-title">{title}</h3>
              <span className="apple-trending-top-badge">
                {type === "stocks" ? "Top 10" : "Top 10"}
              </span>
              {(isLoading || isRefreshing) && (
                <span className="apple-trending-live-sync-pill">
                  <span className="apple-sync-pulse-dot" />
                  <span>{isRefreshing ? "Refreshing quotes…" : "Syncing live quotes…"}</span>
                </span>
              )}
            </div>
            <p className="apple-trending-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="apple-trending-toolbar-right">
          {type === "stocks" && (
            <div className="apple-filter-group" style={{ margin: 0 }}>
              <button
                type="button"
                className={`apple-filter-pill ${marketTab === "both" ? "active" : ""}`}
                onClick={() => setMarketTab("both")}
              >
                <span>Both (20)</span>
              </button>
              <button
                type="button"
                className={`apple-filter-pill ${marketTab === "india" ? "active" : ""}`}
                onClick={() => setMarketTab("india")}
              >
                <span>🇮🇳 India (10)</span>
              </button>
              <button
                type="button"
                className={`apple-filter-pill ${marketTab === "us" ? "active" : ""}`}
                onClick={() => setMarketTab("us")}
              >
                <span>🇺🇸 USA (10)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="apple-hero-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Fetch fresh trending items"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? "refresh-spinning" : ""}
            />
            <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Apple-grade Luminous Loading Progress Bar */}
      {(isLoading || isRefreshing) && (
        <div className="apple-trending-loading-bar-wrap" role="progressbar" aria-label="Fetching live market quotes">
          <div className="apple-trending-loading-bar-track">
            <div className="apple-trending-loading-bar-fill" />
          </div>
        </div>
      )}

      {/* Grid Content */}
      {items.length === 0 && isLoading ? (
        <div className="apple-trending-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="apple-trending-skeleton-card" />
          ))}
        </div>
      ) : type === "mf" ? (
        renderGrid(items)
      ) : (
        <div className="apple-trending-markets-stack">
          {/* 1. India Top 10 Section */}
          {(marketTab === "both" || marketTab === "india") && (
            <div className="apple-trending-sub-block">
              <div className="apple-trending-sub-header">
                <div className="apple-trending-sub-title">
                  <span className="apple-market-flag">🇮🇳</span>
                  <strong>Top 10 Indian Stocks</strong>
                  <span className="apple-market-pill">NSE / BSE</span>
                </div>
                <span className="apple-count-caption">10 Most Active Today</span>
              </div>
              {renderGrid(
                indiaItems.length > 0
                  ? indiaItems
                  : items.filter((i) => i.currency === "INR").slice(0, 10)
              )}
            </div>
          )}

          {/* 2. USA Top 10 Section */}
          {(marketTab === "both" || marketTab === "us") && (
            <div
              className="apple-trending-sub-block"
              style={{ marginTop: marketTab === "both" ? "10px" : "0" }}
            >
              <div className="apple-trending-sub-header">
                <div className="apple-trending-sub-title">
                  <span className="apple-market-flag">🇺🇸</span>
                  <strong>Top 10 US Equities</strong>
                  <span className="apple-market-pill">NASDAQ / NYSE</span>
                  {showUsdInRupees && (
                    <span
                      className="apple-market-pill"
                      style={{
                        background: "rgba(52, 199, 89, 0.1)",
                        color: "#15803d",
                        borderColor: "rgba(52, 199, 89, 0.25)",
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                      title={`Converted to INR at live $1 = ₹${usdInrRate.toFixed(2)}`}
                    >
                      in ₹ (@₹{usdInrRate.toFixed(2)})
                    </span>
                  )}
                </div>
                <span className="apple-count-caption">10 Most Active Today</span>
              </div>
              {renderGrid(
                usItems.length > 0
                  ? usItems
                  : items.filter((i) => i.currency === "USD").slice(0, 10)
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
});

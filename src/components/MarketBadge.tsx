"use client";

import React from "react";
import { AssetCategory, MarketTimingStatus } from "@/types/portfolio";
import { getIndianMarketStatus, getUsMarketStatus } from "@/lib/market-status";

export function getAssetMarketStatus(category: AssetCategory, now: Date | null): MarketTimingStatus {
  if (category === "US Stocks") {
    return getUsMarketStatus(now);
  }
  return getIndianMarketStatus(now);
}

export function MarketTimingBadge({
  status,
  compact = false,
}: {
  status: MarketTimingStatus;
  compact?: boolean;
}) {
  if (status.status === "LIVE") {
    return (
      <span
        className="apple-live-market-badge live"
        title={`${status.marketName}: ${status.label} • ${status.detail}`}
      >
        <span className="apple-live-radar-wrap">
          <span className="apple-live-radar-ping" />
          <span className="apple-live-radar-core" />
        </span>
        <span>LIVE</span>
        {!compact && <span style={{ opacity: 0.85 }}>{status.exchange}</span>}
      </span>
    );
  }

  if (status.status === "PRE-MARKET") {
    return (
      <span
        className="apple-live-market-badge pre-mkt"
        title={`${status.marketName}: ${status.label} • ${status.detail}`}
      >
        <span className="apple-live-dot pre-mkt" />
        <span>PRE-MKT</span>
        {!compact && <span style={{ opacity: 0.85 }}>{status.exchange}</span>}
      </span>
    );
  }

  if (status.status === "AFTER-HOURS") {
    return (
      <span
        className="apple-live-market-badge after-hrs"
        title={`${status.marketName}: ${status.label} • ${status.detail}`}
      >
        <span className="apple-live-dot after-hrs" />
        <span>AFTER-HRS</span>
        {!compact && <span style={{ opacity: 0.85 }}>{status.exchange}</span>}
      </span>
    );
  }

  return (
    <span
      className="apple-live-market-badge closed"
      title={`${status.marketName}: ${status.label} • ${status.detail}`}
    >
      <span className="apple-live-dot closed" />
      <span>CLOSED</span>
      {!compact && <span style={{ opacity: 0.85 }}>{status.exchange}</span>}
    </span>
  );
}

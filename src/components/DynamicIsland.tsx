"use client";

import React from "react";
import { Sparkles, Save, RotateCcw, RefreshCw } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export const DynamicIsland = React.memo(function DynamicIsland() {
  const {
    unsavedAssetIds,
    handleSavePricesToDb,
    handleDiscardRefreshedPrices,
    isSavingPrices,
  } = usePortfolio();

  if (unsavedAssetIds.size === 0) return null;

  return (
    <div className="apple-dynamic-island">
      <div className="apple-island-left">
        <div className="apple-island-sparkle-orb">
          <Sparkles size={15} />
        </div>
        <div className="apple-island-text">
          <strong>
            Live Market Prices Active ({unsavedAssetIds.size}{" "}
            {unsavedAssetIds.size === 1 ? "holding" : "holdings"} updated)
          </strong>
          <p>Session preview only — not saved to PostgreSQL database yet.</p>
        </div>
      </div>
      <div className="apple-island-actions">
        <button
          type="button"
          className="apple-island-save-btn"
          onClick={handleSavePricesToDb}
          disabled={isSavingPrices}
        >
          {isSavingPrices ? (
            <RefreshCw size={13} className="refresh-spinning" />
          ) : (
            <Save size={13} />
          )}
          <span>{isSavingPrices ? "Saving…" : "Save to DB"}</span>
        </button>
        <button
          type="button"
          className="apple-island-revert-btn"
          onClick={handleDiscardRefreshedPrices}
          disabled={isSavingPrices}
        >
          <RotateCcw size={12} />
          <span>Revert</span>
        </button>
      </div>
    </div>
  );
});

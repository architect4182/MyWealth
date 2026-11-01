"use client";

import React from "react";
import { Sparkles, Save, RotateCcw, RefreshCw, Repeat } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export const DynamicIsland = React.memo(function DynamicIsland() {
  const {
    unsavedAssetIds,
    handleSavePricesToDb,
    handleDiscardRefreshedPrices,
    isSavingPrices,
    sipNotice,
    clearSipNotice,
  } = usePortfolio();

  if (unsavedAssetIds.size === 0 && !sipNotice) return null;

  return (
    <div className="apple-dynamic-island-container">
      {sipNotice && (
        <div className="apple-dynamic-island sip-island">
          <div className="apple-island-left">
            <div className="apple-island-sparkle-orb sip-orb">
              <Repeat size={14} />
            </div>
            <div className="apple-island-text">
              <div className="apple-island-headline">
                <strong>Scheduled SIP Executed</strong>
                <span className="apple-island-badge">Auto</span>
              </div>
              <p title={sipNotice}>{sipNotice}</p>
            </div>
          </div>
          <div className="apple-island-actions">
            <button
              type="button"
              className="apple-island-dismiss-btn"
              onClick={clearSipNotice}
              aria-label="Dismiss SIP notification"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {unsavedAssetIds.size > 0 && (
        <div className="apple-dynamic-island live-price-island">
          <div className="apple-island-left">
            <div className="apple-island-sparkle-orb">
              <Sparkles size={14} />
            </div>
            <div className="apple-island-text">
              <div className="apple-island-headline">
                <strong>
                  Live Market Prices Active ({unsavedAssetIds.size}{" "}
                  {unsavedAssetIds.size === 1 ? "holding" : "holdings"} updated)
                </strong>
                <span className="apple-island-badge preview-badge">Preview</span>
              </div>
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
                <RefreshCw size={12} className="refresh-spinning" />
              ) : (
                <Save size={12} />
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
      )}
    </div>
  );
});

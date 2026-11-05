"use client";

import React from "react";
import { Sparkles, Save, RotateCcw, RefreshCw, Repeat, Check, AlertCircle } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export const DynamicIsland = React.memo(function DynamicIsland() {
  const {
    unsavedAssetIds,
    handleSavePricesToDb,
    handleDiscardRefreshedPrices,
    isSavingPrices,
    sipNotice,
    clearSipNotice,
    assetSaveNotification,
    setAssetSaveNotification,
  } = usePortfolio();

  if (unsavedAssetIds.size === 0 && !sipNotice && !assetSaveNotification) return null;

  return (
    <div className="apple-dynamic-island-container">
      {/* 1. Asset Addition & Realtime Sync Notification */}
      {assetSaveNotification && (
        <div
          className={`apple-dynamic-island asset-save-island ${
            assetSaveNotification.status === "saving"
              ? "is-saving"
              : assetSaveNotification.status === "success"
              ? "is-success"
              : "is-error"
          }`}
        >
          <div className="apple-island-left">
            <div
              className={`apple-island-sparkle-orb ${
                assetSaveNotification.status === "saving"
                  ? "saving-orb"
                  : assetSaveNotification.status === "success"
                  ? "success-orb"
                  : "error-orb"
              }`}
            >
              {assetSaveNotification.status === "saving" ? (
                <RefreshCw size={14} className="refresh-spinning" />
              ) : assetSaveNotification.status === "success" ? (
                <Check size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
            </div>
            <div className="apple-island-text">
              <div className="apple-island-headline">
                <strong>
                  {assetSaveNotification.status === "saving"
                    ? "Adding Asset…"
                    : assetSaveNotification.status === "success"
                    ? "Asset Added"
                    : "Save Failed"}
                </strong>
                <span
                  className={`apple-island-badge ${
                    assetSaveNotification.status === "saving"
                      ? "saving-badge"
                      : assetSaveNotification.status === "success"
                      ? "success-badge"
                      : "error-badge"
                  }`}
                >
                  {assetSaveNotification.status === "saving"
                    ? "Syncing"
                    : assetSaveNotification.status === "success"
                    ? "PostgreSQL"
                    : "Error"}
                </span>
              </div>
              <p>{assetSaveNotification.message}</p>
            </div>
          </div>
          {assetSaveNotification.status !== "saving" && (
            <div className="apple-island-actions">
              <button
                type="button"
                className="apple-island-dismiss-btn"
                onClick={() => setAssetSaveNotification(null)}
                aria-label="Dismiss notification"
              >
                <span>Dismiss</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SIP Scheduled Notice */}
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

      {/* 3. Live Price Updates Preview */}
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

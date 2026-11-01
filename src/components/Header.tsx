"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Wallet,
  Plus,
  Database,
  PanelLeft,
  LogOut,
  User,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { MyWealthLogo } from "@/components/MyWealthLogo";

function IosCurrencyToggle({
  checked,
  onToggle,
  rate,
}: {
  checked: boolean;
  onToggle: () => void;
  rate: number;
}) {
  return (
    <div
      className="ios-toggle-pill"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      title={
        checked
          ? `Displaying US Dollar holdings in Rupee (₹) at live $1 = ₹${rate.toFixed(2)}. Click to switch to USD ($).`
          : `Displaying US Dollar holdings in USD ($). Click to switch to Rupee (₹) at live $1 = ₹${rate.toFixed(2)}.`
      }
    >
      <span className="ios-toggle-symbol">{checked ? "₹" : "$"}</span>
      <span className="ios-toggle-label">{checked ? "USD in ₹" : "USD ($)"}</span>
      <span className={`ios-switch ${checked ? "active" : ""}`}>
        <span className="ios-switch-knob" />
      </span>
    </div>
  );
}

export function Header({
  showSidePanel,
  setShowSidePanel,
}: {
  showSidePanel?: boolean;
  setShowSidePanel?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const {
    indianMarket,
    usMarket,
    showUsdInRupees,
    toggleUsdInRupees,
    usdInrRate,
    setModal,
    setDbModal,
    setMarketModal,
    setDefaultCategory,
    currentUserId,
    handleLogout,
  } = usePortfolio();

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Stocks", href: "/stocks", icon: ChartNoAxesCombined },
    { name: "Mutual Funds", href: "/mutual-funds", icon: Wallet },
  ];

  return (
    <header className="apple-island-header">
      {/* Left: Brand + Toggle + Market Status */}
      <div className="apple-header-left">
        {setShowSidePanel && (
          <button
            type="button"
            className={`apple-circle-icon-btn apple-sidebar-toggle-btn ${showSidePanel ? "active" : ""}`}
            onClick={() => setShowSidePanel((prev) => !prev)}
            title={showSidePanel ? "Collapse inspiration panel" : "Show inspiration panel"}
          >
            <PanelLeft size={14} />
          </button>
        )}

        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <MyWealthLogo size={32} />
        </Link>

        {/* Dual Live Stock Market Timings Capsule */}
        <div
          className="apple-market-header-capsule"
          onClick={() => setMarketModal(true)}
          title="Stock Market Trading Sessions • Click for live hours & schedule"
        >
          <div className="apple-market-capsule-item">
            {indianMarket.status === "LIVE" ? (
              <>
                <span className="apple-live-radar-wrap">
                  <span className="apple-live-radar-ping" />
                  <span className="apple-live-radar-core" />
                </span>
                <span className="apple-market-code">NSE</span>
                <span className="apple-market-state live">LIVE</span>
              </>
            ) : (
              <>
                <span className={`apple-live-dot ${indianMarket.isOpen ? "pre-mkt" : "closed"}`} />
                <span className="apple-market-code">NSE</span>
                <span className={`apple-market-state ${indianMarket.isOpen ? "live" : "closed"}`}>
                  {indianMarket.status === "PRE-MARKET" ? "PRE" : "CLOSED"}
                </span>
              </>
            )}
          </div>
          <span className="apple-capsule-divider">|</span>
          <div className="apple-market-capsule-item">
            {usMarket.status === "LIVE" ? (
              <>
                <span className="apple-live-radar-wrap">
                  <span className="apple-live-radar-ping" />
                  <span className="apple-live-radar-core" />
                </span>
                <span className="apple-market-code">NYSE</span>
                <span className="apple-market-state live">LIVE</span>
              </>
            ) : (
              <>
                <span className={`apple-live-dot ${usMarket.isOpen ? "pre-mkt" : "closed"}`} />
                <span className="apple-market-code">NYSE</span>
                <span className={`apple-market-state ${usMarket.isOpen ? "live" : "closed"}`}>
                  {usMarket.status === "PRE-MARKET" ? "PRE" : usMarket.status === "AFTER-HOURS" ? "AFTER" : "CLOSED"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Apple Segmented Pill Switcher (Route Navigation) */}
      <nav className="apple-segmented-nav" aria-label="Main Navigation">
        {navigation.map(({ name, href, icon: Icon }) => {
          const isTabActive = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`apple-nav-pill ${isTabActive ? "active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <Icon size={14} strokeWidth={isTabActive ? 2.4 : 1.8} />
              <span className="apple-nav-pill-text">{name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: Currency Toggle + Add Asset Button + DB Setup */}
      <div className="apple-header-right">
        <IosCurrencyToggle
          checked={showUsdInRupees}
          onToggle={toggleUsdInRupees}
          rate={usdInrRate}
        />
        <button
          type="button"
          className="apple-add-btn"
          onClick={() => {
            if (pathname === "/stocks") setDefaultCategory("Indian Equities");
            else if (pathname === "/mutual-funds") setDefaultCategory("Mutual Funds");
            setModal(true);
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Asset</span>
        </button>
        <button
          type="button"
          className="apple-circle-icon-btn"
          title="PostgreSQL Configuration"
          onClick={() => setDbModal(true)}
        >
          <Database size={15} />
        </button>
        <div
          className="apple-user-pill"
          title={`Signed in as @${currentUserId}`}
        >
          <User size={13} strokeWidth={2.2} />
          <span className="apple-user-label">@{currentUserId}</span>
        </div>
        <button
          type="button"
          className="apple-circle-icon-btn apple-signout-btn"
          title={`Lock & Sign Out (@${currentUserId})`}
          onClick={handleLogout}
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Route Navigation Luminous Micro-Glow Track */}
      <div className="apple-header-glow-track" aria-hidden="true">
        <div key={pathname} className="apple-header-glow-pulse" />
      </div>
    </header>
  );
}

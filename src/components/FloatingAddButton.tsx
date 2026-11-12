"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export function FloatingAddButton() {
  const pathname = usePathname();
  const { setModal, setDefaultCategory } = usePortfolio();

  // Show ONLY on stocks and mutual funds pages
  const isStocks = pathname === "/stocks";
  const isMf = pathname === "/mutual-funds";

  if (!isStocks && !isMf) {
    return null;
  }

  const handleClick = () => {
    if (isStocks) {
      setDefaultCategory("Indian Equities");
    } else if (isMf) {
      setDefaultCategory("Mutual Funds");
    }
    setModal(true);
  };

  const label = isStocks
    ? "Add stock or equity position"
    : "Add mutual fund investment";

  return (
    <button
      type="button"
      className="apple-floating-add-btn ios-liquid-btn ios-liquid-btn--add"
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <Plus size={26} strokeWidth={2.8} />
    </button>
  );
}


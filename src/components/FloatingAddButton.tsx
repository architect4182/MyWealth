"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export function FloatingAddButton() {
  const pathname = usePathname();
  const { setModal, setDefaultCategory } = usePortfolio();

  const [isVisible, setIsVisible] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const lastScrollYRef = useRef(0);

  // Show ONLY on stocks and mutual funds pages
  const isStocks = pathname === "/stocks";
  const isMf = pathname === "/mutual-funds";

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          const diff = currentScrollY - lastScrollYRef.current;

          // While scrolling down (reading content), smoothly hide the button
          if (diff > 6 && currentScrollY > 40) {
            setIsVisible(false);
          } else if (diff < -6 || currentScrollY <= 40) {
            // While scrolling up or near the top, reveal it with spring
            setIsVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isStocks && !isMf) {
    return null;
  }

  const handleClick = () => {
    // Trigger click ripple & spring press animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 420);

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
      className={`apple-floating-add-btn ios-clear-liquid-glass ${!isVisible ? "is-hidden" : ""} ${isClicked ? "is-clicked" : ""}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <span className={`glass-click-ripple ${isClicked ? "active" : ""}`} aria-hidden="true" />
      <span className="glass-specular-dome" aria-hidden="true" />
      <span className="glass-rim-highlight" aria-hidden="true" />
      <Plus size={28} strokeWidth={3.2} className="glass-plus-icon" />
    </button>
  );
}

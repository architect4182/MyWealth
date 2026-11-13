"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Plus, TrendingUp, Landmark } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export function FloatingAddButton() {
  const pathname = usePathname();
  const { setModal, setDefaultCategory } = usePortfolio();

  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const lastScrollYRef = useRef(0);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Hidden on login page
  if (pathname === "/login") {
    return null;
  }

  // Scroll visibility handling: hides when scrolling down, shows when scrolling up
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          const diff = currentScrollY - lastScrollYRef.current;

          // If menu is open, don't hide on scroll
          if (!isOpen) {
            if (diff > 6 && currentScrollY > 40) {
              setIsVisible(false);
            } else if (diff < -6 || currentScrollY <= 40) {
              setIsVisible(true);
            }
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 360);
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (type: "stock" | "mf") => {
    setIsOpen(false);
    if (type === "stock") {
      setDefaultCategory("Indian Equities");
    } else {
      setDefaultCategory("Mutual Funds");
    }
    setModal(true);
  };

  return (
    <div ref={menuContainerRef} className="floating-add-wrapper">
      {/* Click-away backdrop overlay when menu is open */}
      {isOpen && (
        <div
          className="speed-dial-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Speed Dial Menu: Two Options (Stocks & MF) */}
      <div
        className={`speed-dial-menu ${isOpen ? "is-open" : ""}`}
        role="menu"
        aria-label="Add investment options"
        aria-hidden={!isOpen}
      >
        {/* Option 1: Stocks & Equities */}
        <button
          type="button"
          className="speed-dial-option speed-dial-option--stocks"
          onClick={() => handleSelect("stock")}
          role="menuitem"
          tabIndex={isOpen ? 0 : -1}
        >
          <div className="speed-dial-icon-wrap speed-dial-icon--stocks">
            <TrendingUp size={19} strokeWidth={2.4} />
          </div>
          <strong className="speed-dial-title">Stocks & Equities</strong>
        </button>

        {/* Option 2: Mutual Funds */}
        <button
          type="button"
          className="speed-dial-option speed-dial-option--mf"
          onClick={() => handleSelect("mf")}
          role="menuitem"
          tabIndex={isOpen ? 0 : -1}
        >
          <div className="speed-dial-icon-wrap speed-dial-icon--mf">
            <Landmark size={19} strokeWidth={2.4} />
          </div>
          <strong className="speed-dial-title">Mutual Funds</strong>
        </button>
      </div>

      {/* Primary Floating Action Button (Bottom Right) */}
      <button
        type="button"
        className={`apple-floating-add-btn ios-clear-liquid-glass ${!isVisible && !isOpen ? "is-hidden" : ""} ${isClicked ? "is-clicked" : ""} ${isOpen ? "is-open" : ""}`}
        onClick={handleToggle}
        aria-label={isOpen ? "Close add asset options" : "Add asset options"}
        aria-expanded={isOpen}
        title={isOpen ? "Close" : "Add Asset (Stocks & Mutual Funds)"}
      >
        <span className={`glass-click-ripple ${isClicked ? "active" : ""}`} aria-hidden="true" />
        <span className="glass-specular-dome" aria-hidden="true" />
        <span className="glass-rim-highlight" aria-hidden="true" />
        <Plus size={28} strokeWidth={3.2} className="glass-plus-icon" />
      </button>
    </div>
  );
}

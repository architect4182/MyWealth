"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div
        key={`route-bar-${pathname}`}
        className="apple-route-progress-bar"
        aria-hidden="true"
      />
      <div key={pathname} className="apple-route-stage">
        {children}
      </div>
    </>
  );
}


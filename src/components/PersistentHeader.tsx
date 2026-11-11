"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

/** Keeps the top Liquid Glass navigation bar mounted across page transitions. */
export function PersistentHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Header />;
}


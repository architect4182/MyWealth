"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { FloatingAddButton } from "@/components/FloatingAddButton";

/** Keeps the top Liquid Glass navigation bar and contextual floating action button mounted across page transitions. */
export function PersistentHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <>
      <Header />
      <FloatingAddButton />
    </>
  );
}


"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a modal mounted briefly while playing its CSS exit animation.
 */
export function useAnimatedModal<T>(
  value: T | null | undefined,
  isOpen?: boolean,
  durationMs = 220
) {
  const active = isOpen !== undefined ? isOpen : Boolean(value);
  const [rendered, setRendered] = useState(active);
  const [isClosing, setIsClosing] = useState(false);
  const [cachedValue, setCachedValue] = useState<T | null | undefined>(value);

  useEffect(() => {
    if (active) {
      if (value !== null && value !== undefined) {
        setCachedValue(value);
      }
      setRendered(true);
      setIsClosing(false);
      return;
    }

    if (rendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [active, value, rendered, durationMs]);

  return {
    shouldRender: rendered,
    isClosing,
    displayValue: active ? value : cachedValue,
  };
}


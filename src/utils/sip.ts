import { AssetPosition } from "@/types/portfolio";

/**
 * Safely formats a Date to YYYY-MM-DD in the local user timezone.
 * Avoids UTC timezone rollback bugs caused by .toISOString().
 */
export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calculates the next calendar date on which this SIP will execute.
 */
export function getNextSipDate(sipDay: number = 5, refDate?: Date): string {
  if (typeof window === "undefined" && !refDate) {
    return `${sipDay}${sipDay === 1 ? "st" : sipDay === 2 ? "nd" : sipDay === 3 ? "rd" : "th"} of month`;
  }
  const today = refDate || new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();

  let targetYear = year;
  let targetMonth = month;
  if (currentDay >= sipDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, sipDay), maxDays);
  const targetDate = new Date(targetYear, targetMonth, clampedDay);

  return targetDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface SipCatchupResult {
  dueCount: number;
  newQuantity: number;
  newBuyPrice: number;
  newInstallments: number;
  newLastSipDate: string;
  addedInvested: number;
}

/**
 * Evaluates whether an active SIP has reached or passed its scheduled installment date(s)
 * and calculates the new cumulative units, invested amount, and weighted average buy price.
 */
export function calculateSipCatchup(
  asset: AssetPosition,
  now: Date = new Date()
): SipCatchupResult | null {
  if (!asset.isSip || asset.sipStatus === "paused") return null;
  const amount = Number(asset.sipAmount);
  if (!amount || amount <= 0) return null;

  const dayOfMonth = Math.min(Math.max(1, asset.sipDay || 5), 28);
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastRunStr = asset.lastSipDate || asset.sipStartDate;
  if (!lastRunStr) return null;

  const parts = lastRunStr.split("-").map(Number);
  if (parts.length < 3) return null;
  const [lastY, lastM] = parts; // lastM is 1-indexed

  let nextYear = lastY;
  let nextMonth = lastM + 1; // 1-indexed next month
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  let targetDate = new Date(nextYear, nextMonth - 1, dayOfMonth);
  let dueCount = 0;
  let latestRunDate = lastRunStr;

  while (targetDate <= todayOnly) {
    dueCount++;
    latestRunDate = formatLocalDate(targetDate);
    nextMonth++;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    targetDate = new Date(nextYear, nextMonth - 1, dayOfMonth);
  }

  if (dueCount === 0) return null;

  const execPrice =
    asset.currentPrice > 0 ? asset.currentPrice : asset.buyPrice > 0 ? asset.buyPrice : 1;
  const addedInvested = dueCount * amount;
  const addedUnits = addedInvested / execPrice;
  const oldInvested = asset.quantity * asset.buyPrice;
  const totalInvested = oldInvested + addedInvested;
  const totalQuantity = asset.quantity + addedUnits;
  const avgBuyPrice = totalQuantity > 0 ? totalInvested / totalQuantity : asset.buyPrice;
  const totalInstallments = (asset.sipInstallments || 1) + dueCount;

  return {
    dueCount,
    newQuantity: Number(totalQuantity.toFixed(4)),
    newBuyPrice: Number(avgBuyPrice.toFixed(4)),
    newInstallments: totalInstallments,
    newLastSipDate: latestRunDate,
    addedInvested,
  };
}

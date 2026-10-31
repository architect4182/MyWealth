export type AssetCategory =
  | "Indian Equities"
  | "US Stocks"
  | "Mutual Funds"
  | "Gold & Fixed Income"
  | "Crypto";

export interface AssetPosition {
  id: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: "INR" | "USD";
  date: string;
}

export interface EditAssetForm {
  id: string;
  name: string;
  category: AssetCategory;
  investedAmount: string;
  buyPrice: string;
  currentPrice: string;
  currentValue: string;
  currency: "INR" | "USD";
}

export interface MarketTimingStatus {
  isOpen: boolean;
  status: "LIVE" | "PRE-MARKET" | "AFTER-HOURS" | "CLOSED";
  label: string;
  marketName: string;
  exchange: string;
  timeZone: string;
  currentTimeStr: string;
  tradingHoursStr: string;
  detail: string;
}

export interface PrefillAssetData {
  name: string;
  category: AssetCategory;
  price: number;
  currency: "INR" | "USD";
}


export type AssetCategory =
  | "Indian Equities"
  | "US Stocks"
  | "Mutual Funds"
  | "Gold & Fixed Income"
  | "Crypto";

export interface AssetPosition {
  id: string;
  username?: string;
  userId?: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  investedAmount?: number;
  buyPrice: number;
  currentPrice: number;
  currency: "INR" | "USD";
  date: string;
  tradeDate?: string;
  isSip?: boolean;
  sipAmount?: number;
  sipDay?: number;
  sipStartDate?: string;
  sipInstallments?: number;
  lastSipDate?: string;
  sipStatus?: "active" | "paused";
  brokerApp?: string;
}

export interface EditAssetForm {
  id: string;
  name: string;
  category: AssetCategory;
  quantity?: string;
  investedAmount: string;
  buyPrice: string;
  currentPrice: string;
  currentValue: string;
  currency: "INR" | "USD";
  tradeDate?: string;
  isSip?: boolean;
  sipAmount?: string;
  sipDay?: string;
  sipStartDate?: string;
  sipInstallments?: string;
  lastSipDate?: string;
  sipStatus?: "active" | "paused";
  brokerApp?: string;
}

export interface MarketTimingStatus {
  isOpen: boolean;
  status: "LIVE" | "PRE-MARKET" | "AFTER-HOURS" | "CLOSED" | "HOLIDAY";
  label: string;
  marketName: string;
  exchange: string;
  timeZone: string;
  currentTimeStr: string;
  tradingHoursStr: string;
  detail: string;
  holidayName?: string;
}

export interface PrefillAssetData {
  name: string;
  category: AssetCategory;
  price: number;
  currency: "INR" | "USD";
  brokerApp?: string;
}

export interface AssetSaveNotification {
  status: "saving" | "success" | "error";
  name: string;
  message: string;
}

export interface OperationResult {
  isOpen: boolean;
  type: "success" | "error";
  action: "add" | "update" | "delete";
  title: string;
  message: string;
  assetName?: string;
  details?: {
    category?: string;
    quantity?: number | string;
    investedAmount?: number | string;
    buyPrice?: number | string;
    currentPrice?: number | string;
    currentValue?: number | string;
    currency?: string;
    brokerApp?: string;
    isSip?: boolean;
    sipAmount?: number | string;
  };
  onRetry?: () => void;
}

export interface ProcessingState {
  active: boolean;
  title: string;
  subtitle?: string;
}




export type InventoryScope = "PRODUCT" | "VARIANT";

export type InventoryStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "ON_HOLD"
  | "DAMAGED"
  | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type InventoryItem = {
  id: string;

  scope: InventoryScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  businessType: BusinessType;

  warehouseName: string;
  locationCode?: string | null;

  totalStock: number;
  reservedStock: number;
  availableStock: number;

  lowStockThreshold: number;

  rentalAvailableStock?: number | null;
  damagedStock?: number | null;
  holdStock?: number | null;

  restockDate?: string | null;

  status: InventoryStatus;

  updatedAt: string;
};
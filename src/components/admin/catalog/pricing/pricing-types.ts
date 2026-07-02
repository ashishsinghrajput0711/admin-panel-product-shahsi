export type CommerceType =
  | "SHOP"
  | "RENTAL"
  | "RESALE"
  | "MTO"
  | "SUBSCRIPTION";

export type PricingScope =
  | "GLOBAL"
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "LOCATION"
  | "WAREHOUSE";

export type AdjustmentType =
  | "PERCENTAGE"
  | "FIXED"
  | "MULTIPLIER"
  | "OVERRIDE";

export type DynamicPricingRule = {
  id: string;
  name: string;
  description?: string | null;
  commerceType: CommerceType;
  scope: PricingScope;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  productId?: string | null;
  productVariantId?: string | null;
  categoryId?: string | null;
  locationId?: string | null;
  warehouseId?: string | null;
  minBasePrice?: number | null;
  maxBasePrice?: number | null;
  priority?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  conditions?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export const COMMERCE_TYPES: CommerceType[] = [
  "SHOP",
  "RENTAL",
  "RESALE",
  "MTO",
  "SUBSCRIPTION",
];

export const PRICING_SCOPES: PricingScope[] = [
  "GLOBAL",
  "PRODUCT",
  "VARIANT",
  "CATEGORY",
  "LOCATION",
  "WAREHOUSE",
];

export const ADJUSTMENT_TYPES: AdjustmentType[] = [
  "PERCENTAGE",
  "FIXED",
  "MULTIPLIER",
  "OVERRIDE",
];

export function formatPricingLabel(value?: string | null) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
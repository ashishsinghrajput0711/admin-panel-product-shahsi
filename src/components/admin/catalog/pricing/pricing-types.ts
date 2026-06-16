export type PricingStatus = "DRAFT" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";

export type PricingScope = "PRODUCT" | "VARIANT";

export type CommerceType =
  | "RETAIL"
  | "MADE_TO_ORDER"
  | "RENTAL"
  | "RESALE";

export type CurrencyCode = "USD" | "INR" | "GBP" | "EUR";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";

export type PricingRule = {
  id: string;

  name: string;
  code: string;

  scope: PricingScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  commerceType: CommerceType;

  currency: CurrencyCode;

  basePrice: number;
  salePrice?: number | null;
  rentalPrice?: number | null;
  resalePrice?: number | null;
  mtoPrice?: number | null;

  discountType: DiscountType;
  discountValue?: number | null;

  effectiveFrom?: string | null;
  effectiveTo?: string | null;

  status: PricingStatus;

  updatedAt: string;
};
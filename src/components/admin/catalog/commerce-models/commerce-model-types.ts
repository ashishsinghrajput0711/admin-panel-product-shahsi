export type CommerceModelType =
  | "RETAIL"
  | "MADE_TO_ORDER"
  | "RENTAL"
  | "RESALE";

export type CommerceModelStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type CommerceModelScope = "PRODUCT" | "VARIANT" | "CATEGORY";

export type CommerceModel = {
  id: string;

  name: string;
  code: string;

  type: CommerceModelType;
  scope: CommerceModelScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  categoryId?: string | null;
  categoryName?: string | null;

  businessType: BusinessType;

  isEnabled: boolean;

  returnWindowDays?: number | null;

  productionLeadTimeDays?: number | null;
  rushAllowed?: boolean | null;
  rushFee?: number | null;

  rentalDurationDays?: number | null;
  rentalDepositAmount?: number | null;
  lateFeePerDay?: number | null;
  cleaningFee?: number | null;

  resaleCommissionPercent?: number | null;
  sellerPayoutPercent?: number | null;

  minOrderQuantity?: number | null;
  maxOrderQuantity?: number | null;

  status: CommerceModelStatus;

  updatedAt: string;
};
export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type CommerceType =
  | "RETAIL"
  | "MADE_TO_ORDER"
  | "RENTAL"
  | "RESALE";

export type VariantType =
  | "SIZE"
  | "COLOR"
  | "LENGTH"
  | "FABRIC"
  | "RENTAL_PACKAGE"
  | "SUBSCRIPTION_PACKAGE";

export type VariantStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type DataQualityStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export type Variant = {
  id: string;

  productId: string;
  productName?: string | null;
  productSlug?: string | null;

  sku?: string | null;
  barcode?: string | null;
  variantSku?: string | null;

  businessType?: BusinessType | string | null;
  commerceTypes?: CommerceType[] | string[] | null;

  variantType?: VariantType | string | null;
  rentalPackageName?: string | null;
  subscriptionPackageName?: string | null;

  size?: string | null;
  color?: string | null;
  colorFamily?: string | null;
  fabric?: string | null;

  height?: string | null;
  length?: number | string | null;
  lengthLabel?: string | null;
  dressLength?: string | null;
  neckline?: string | null;
  sleeveLength?: string | null;
  detail?: string | null;

  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  sleeve?: number | null;
  shoulder?: number | null;
  fitType?: string | null;
  stretchLevel?: string | null;

  price?: number | null;
  compareAtPrice?: number | null;
  salePrice?: number | null;
  rentalPrice?: number | null;
  resalePrice?: number | null;
  mtoPrice?: number | null;

  stock?: number | null;
  reservedStock?: number | null;
  availableStock?: number | null;

  status?: VariantStatus | string | null;
  isActive?: boolean | null;
  isAvailable?: boolean | null;
  isShipsNow?: boolean | null;

  productionType?: string | null;

  fitDataStatus?: DataQualityStatus | string | null;
  seoStatus?: DataQualityStatus | string | null;

  attributes?: {
    fabric?: string | null;
    occasion?: string | null;
    [key: string]: unknown;
  } | null;

  weight?: number | null;
  weightUnit?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};



export type CatalogAttributeOption = {
  id?: string;
  label: string;
  value: string;
  colorHex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

export type CatalogAttributeForVariant = {
  id?: string;
  name?: string | null;
  label?: string | null;
  code?: string | null;
  slug?: string | null;
  key?: string | null;
  fieldType?: string | null;
  type?: string | null;
  options?: CatalogAttributeOption[] | null;
};
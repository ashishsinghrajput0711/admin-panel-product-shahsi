export type BusinessType = "SHAHSI" | "GOWNLOOP";
export type CommerceType = "RETAIL" | "MADE_TO_ORDER" | "RENTAL" | "RESALE";
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ProductImage = {
  id: string;
  url: string;
  secureUrl?: string | null;
  isPrimary?: boolean;
  altText?: string | null;
};

export type ProductVariant = {
  id: string;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  stock?: number | null;
  price?: number | null;
  isActive?: boolean;
};

export type Product = {
  id: string;

  title?: string;
  name?: string;

  sku?: string;
  slug?: string;

  vendor?: string | null;
  brand?: string | null;

  category?: string | null;
  primaryCategory?: string | null;
  categoryName?: string | null;
  categories?: string[];

  mode?: string | null;
  productType?: string | null;
  commerceTypes?: string[];

  basePrice?: number | null;
  compareAtPrice?: number | null;
  listingPrice?: number | null;
  price?: number | null;
  salePrice?: number | null;
  currency?: string | null;

  status?: string;
  statusLabel?: string;
  adminStatus?: string;

  availabilityStatus?: string | null;
  availabilityLabel?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;

  images?: ProductImage[];
  variants?: ProductVariant[];

  updatedAt?: string;
  createdAt?: string;
};
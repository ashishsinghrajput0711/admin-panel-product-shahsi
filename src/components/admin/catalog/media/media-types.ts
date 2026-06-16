export type MediaScope = "PRODUCT" | "VARIANT";

export type MediaType =
  | "IMAGE"
  | "VIDEO"
  | "THUMBNAIL"
  | "LOOKBOOK"
  | "SIZE_GUIDE"
  | "FABRIC_SWATCH";

export type MediaStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type CatalogMedia = {
  id: string;

  scope: MediaScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  businessType: BusinessType;

  type: MediaType;

  url: string;
  thumbnailUrl?: string | null;

  title?: string | null;
  altText?: string | null;

  fileName?: string | null;
  mimeType?: string | null;

  position: number;
  isPrimary: boolean;

  status: MediaStatus;

  updatedAt: string;
};
export type FitDataScope = "PRODUCT" | "VARIANT";

export type FitDataStatus = "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";

export type FitData = {
  id: string;
  productId: string;
  productName?: string | null;
  productSlug?: string | null;
  productSku?: string | null;
  productImage?: string | null;

  businessType?: string | null;
  scope?: FitDataScope | string | null;
  variantId?: string | null;
  variantSku?: string | null;

  fitType?: string | null;
  silhouette?: string | null;
  lengthType?: string | null;
  stretchLevel?: string | null;
  supportLevel?: string | null;
  closureType?: string | null;
  neckline?: string | null;
  sleeveLength?: string | null;
  waistline?: string | null;

  hasSizeChart?: boolean;
  sizeChartCount?: number;

  alterationAllowed?: boolean;
  customSizingAvailable?: boolean;

  recommendedForBodyTypes?: string[];
  notRecommendedForBodyTypes?: string[];

  status?: FitDataStatus | string;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
};
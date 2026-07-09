export type StyleDataScope = "PRODUCT" | "VARIANT";

export type StyleDataStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type CatalogStyleDataOptions = {
  status: StyleDataStatus[];
  scope: StyleDataScope[];
  businessType: BusinessType[];
  occasion: string[];
  colorFamily: string[];
  fabricFeel: string[];
  neckline: string[];
  sleeveType: string[];
  silhouette: string[];
  modestyLevel: string[];
  season: string[];
};

export type StyleData = {
  id: string;

  productId: string;
  productName: string;
  productSlug: string;
  productSku: string;
  productImage: string | null;

  variantId: string | null;
  variantTitle: string | null;
  variantSku: string | null;

  scope: StyleDataScope;
  businessType: BusinessType;
  status: StyleDataStatus;

  occasion: string[];
  colorFamily: string;
  fabricFeel: string;
  neckline: string;
  sleeveType: string;
  silhouette: string;
  modestyLevel: string;
  season: string[];

  tags: string[];
  stylingKeywords: string[];
  aiStylingNotes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type StyleDataSummary = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  archived: number;
};

export type StyleDataMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StyleDataListResponse = {
  items: StyleData[];
  meta: StyleDataMeta;
  summary: StyleDataSummary;
};
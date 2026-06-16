export type StyleDataScope = "PRODUCT" | "VARIANT";

export type StyleDataStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP";

export type ModestyLevel = "LOW" | "MEDIUM" | "HIGH";

export type Season =
  | "SPRING"
  | "SUMMER"
  | "FALL"
  | "WINTER"
  | "ALL_SEASON";

export type StyleData = {
  id: string;

  scope: StyleDataScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  businessType: BusinessType;

  occasion?: string | null;
  styleCategory?: string | null;

  colorFamily?: string | null;
  fabricFeel?: string | null;

  neckline?: string | null;
  sleeveType?: string | null;
  silhouette?: string | null;

  modestyLevel: ModestyLevel;
  season: Season;

  styleTags: string[];
  trendTags: string[];

  aiStylingNotes?: string | null;
  merchandisingNotes?: string | null;

  isFeatured: boolean;
  isTrendItem: boolean;

  status: StyleDataStatus;

  updatedAt: string;
};
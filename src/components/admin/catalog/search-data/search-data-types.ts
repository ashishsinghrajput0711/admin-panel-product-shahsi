export type SearchDataScope =
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "ATTRIBUTE"
  | "GLOBAL";

export type SearchDataStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BusinessType = "SHAHSI" | "GOWNLOOP" | "BOTH";

export type SearchIntent =
  | "GENERAL"
  | "CATEGORY_DISCOVERY"
  | "PRODUCT_DISCOVERY"
  | "OCCASION"
  | "COLOR"
  | "STYLE"
  | "FIT"
  | "BRIDAL_PARTY";

export type SearchData = {
  id: string;

  keyword: string;
  normalizedKeyword: string;

  scope: SearchDataScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  categoryId?: string | null;
  categoryName?: string | null;

  attributeId?: string | null;
  attributeName?: string | null;

  businessType: BusinessType;

  intent: SearchIntent;

  synonyms: string[];
  misspellings: string[];
  boostTerms: string[];

  rankingWeight: number;

  isVisible: boolean;
  isTrending: boolean;

  resultUrl?: string | null;
  notes?: string | null;

  status: SearchDataStatus;

  updatedAt: string;
};
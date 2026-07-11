export type CatalogLifecycleStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type CatalogPublicationStatus =
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "PUBLISH_BLOCKED";

export type CatalogBusinessType = "SHAHSI" | "GOWNLOOP";

export type PublishingIssueSeverity = "ERROR" | "WARNING" | "INFO";

export type PublishingIssue = {
  productId: string;
  code: string;
  field: string;
  message: string;
  severity: PublishingIssueSeverity;
  blocking: boolean;
};

export type PublishReadiness = {
  canPublish: boolean;
  blockingErrorCount: number;
  warningCount: number;
  infoCount: number;
  errors: PublishingIssue[];
  warnings: PublishingIssue[];
  info: PublishingIssue[];
  issues: PublishingIssue[];
};

export type PublishingPrimaryImage = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  name?: string | null;
  isPrimary?: boolean;
};

export type PublishingCategorySummary = {
  id: string;
  name: string;
};

export type PublishingRecord = {
  id: string;
  title: string;
  sku: string | null;
  slug: string;

  status: CatalogLifecycleStatus;
  businessType: CatalogBusinessType | string | null;
  productType: string | null;
  brand: string | null;

  publicationStatus: CatalogPublicationStatus;
  isPublished: boolean;

  publishedAt: string | null;
  publishedBy: string | null;
  unpublishedAt: string | null;

  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  primaryImage: PublishingPrimaryImage | null;
  categorySummary: PublishingCategorySummary | null;

  publishReadiness: PublishReadiness;

  createdAt: string;
  updatedAt: string;
};

export type PublishingListFilters = {
  search: string;
  status: CatalogLifecycleStatus | "";
  publicationStatus: CatalogPublicationStatus | "";
  businessType: CatalogBusinessType | "";
  productType: string;
  brand: string;
  categoryId: string;
};

export type PublishingListParams = PublishingListFilters & {
  page?: number;
  limit?: number;
};

export type PublishingListResult = {
  products: PublishingRecord[];
  meta: {
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PublishingSummary = {
  total: number;
  published: number;
  unpublished: number;
  publishBlocked: number;
  validationErrorProducts: number;
  warningProducts: number;

  draft: number;
  active: number;
  inactive: number;
  archived: number;

  inStock?: number;
  lowStock?: number;
  outOfStock?: number;
  rentable?: number;
  sellable?: number;
  madeToOrder?: number;
  unlisted?: number;
};

export type PublishingActionPayload = {
  reason: string;
};

export type PublishProductPayload = PublishingActionPayload & {
  publishedAt: string;
};

export type PublishingActionResult = {
  id: string;
  status: CatalogLifecycleStatus;
  publicationStatus: CatalogPublicationStatus;
  isPublished: boolean;

  publishedAt: string | null;
  publishedBy?: string | null;
  unpublishedAt?: string | null;

  idempotent: boolean;
};

export type BulkPublishingResultItem = {
  id: string;
  success: boolean;

  publicationStatus?: CatalogPublicationStatus;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  idempotent?: boolean;

  error?: string;
  statusCode?: number;
  validationErrors?: PublishingIssue[];
};

export type BulkPublishingResult = {
  requested: number;
  succeeded: number;
  failed: number;
  results: BulkPublishingResultItem[];
};

export type PublishingValidationResult = {
  totalProductsScanned: number;
  productsWithBlockingErrors: number;
  totalErrors: number;
  totalWarnings: number;
  errors: PublishingIssue[];
  warnings: PublishingIssue[];
};

export type PublishingHistoryActor = {
  id: string;
  name: string | null;
  email: string | null;
};

export type PublishingHistoryItem = {
  id: string;
  action: string;
  module: string;

  fromStatus: CatalogLifecycleStatus | null;
  toStatus: CatalogLifecycleStatus | null;

  fromPublicationStatus: CatalogPublicationStatus | null;
  toPublicationStatus: CatalogPublicationStatus | null;

  reason: string | null;
  createdBy: PublishingHistoryActor | null;
  createdAt: string;

  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
};

export type PublishingStatusHistory = {
  product: {
    id: string;
    title: string;
    slug: string;
    status: CatalogLifecycleStatus;
    isPublished: boolean;
    publicationStatus: CatalogPublicationStatus;
    publishedAt: string | null;
    publishedBy: string | null;
    unpublishedAt: string | null;
    approvedAt: string | null;
    publishReadiness: PublishReadiness;
  };
  history: PublishingHistoryItem[];
};

export type PublishingReadinessSummary = {
  variantCount: number;
  activeVariantCount: number;
  mediaCount: number;
  primaryImageAvailable: boolean;
  categoryAvailable: boolean;
  canPublish: boolean;
  blockingErrorCount: number;
  warningCount: number;
};

export type PublishingRelations = {
  product: {
    id: string;
    title: string;
    slug: string;
    status: CatalogLifecycleStatus;
    publicationStatus: CatalogPublicationStatus;
    isPublished: boolean;
  };

  readinessSummary: PublishingReadinessSummary;
  publishReadiness: PublishReadiness;

  relatedProducts: unknown[];
  relatedTo: unknown[];
  variants: unknown[];
  images: unknown[];
};
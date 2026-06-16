export type PublishingScope = "PRODUCT" | "VARIANT" | "CATEGORY";

export type PublishingStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export type ApprovalStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type BusinessType = "SHAHSI" | "GOWNLOOP" | "BOTH";

export type SalesChannel =
  | "WEBSITE"
  | "MOBILE_APP"
  | "BRIDAL_PARTY"
  | "RENTAL"
  | "RESALE"
  | "MARKETPLACE";

export type ReadinessStatus = "READY" | "WARNING" | "BLOCKED";

export type PublishingRecord = {
  id: string;

  scope: PublishingScope;

  productId?: string | null;
  productName?: string | null;

  variantId?: string | null;
  variantSku?: string | null;

  categoryId?: string | null;
  categoryName?: string | null;

  businessType: BusinessType;

  status: PublishingStatus;
  approvalStatus: ApprovalStatus;

  channels: SalesChannel[];

  isVisible: boolean;
  isFeatured: boolean;

  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
  unpublishedAt?: string | null;

  seoReady: ReadinessStatus;
  mediaReady: ReadinessStatus;
  inventoryReady: ReadinessStatus;
  pricingReady: ReadinessStatus;

  reviewerName?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;

  updatedAt: string;
};
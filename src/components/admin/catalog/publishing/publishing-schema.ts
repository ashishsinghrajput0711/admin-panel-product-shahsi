import { z } from "zod";

export const publishingSchema = z.object({
  scope: z.enum(["PRODUCT", "VARIANT", "CATEGORY"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),
  categoryId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP", "BOTH"]),

  status: z.enum([
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "UNPUBLISHED",
    "ARCHIVED",
  ]),

  approvalStatus: z.enum([
    "NOT_SUBMITTED",
    "PENDING",
    "APPROVED",
    "REJECTED",
  ]),

  channels: z
    .array(
      z.enum([
        "WEBSITE",
        "MOBILE_APP",
        "BRIDAL_PARTY",
        "RENTAL",
        "RESALE",
        "MARKETPLACE",
      ])
    )
    .min(1, "Select at least one sales channel"),

  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  scheduledPublishAt: z.string().optional(),
  publishedAt: z.string().optional(),
  unpublishedAt: z.string().optional(),

  seoReady: z.enum(["READY", "WARNING", "BLOCKED"]),
  mediaReady: z.enum(["READY", "WARNING", "BLOCKED"]),
  inventoryReady: z.enum(["READY", "WARNING", "BLOCKED"]),
  pricingReady: z.enum(["READY", "WARNING", "BLOCKED"]),

  reviewerName: z.string().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export type PublishingFormValues = z.infer<typeof publishingSchema>;
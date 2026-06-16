import { z } from "zod";

export const commerceModelSchema = z.object({
  name: z.string().min(2, "Commerce model name is required"),

  code: z
    .string()
    .min(2, "Code is required")
    .regex(/^[A-Z0-9_]+$/, "Use uppercase code format, example RENTAL_STANDARD"),

  type: z.enum(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"]),

  scope: z.enum(["PRODUCT", "VARIANT", "CATEGORY"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),
  categoryId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  isEnabled: z.boolean().optional(),

  returnWindowDays: z.coerce.number().int().min(0).optional(),

  productionLeadTimeDays: z.coerce.number().int().min(0).optional(),
  rushAllowed: z.boolean().optional(),
  rushFee: z.coerce.number().min(0).optional(),

  rentalDurationDays: z.coerce.number().int().min(0).optional(),
  rentalDepositAmount: z.coerce.number().min(0).optional(),
  lateFeePerDay: z.coerce.number().min(0).optional(),
  cleaningFee: z.coerce.number().min(0).optional(),

  resaleCommissionPercent: z.coerce.number().min(0).max(100).optional(),
  sellerPayoutPercent: z.coerce.number().min(0).max(100).optional(),

  minOrderQuantity: z.coerce.number().int().min(0).optional(),
  maxOrderQuantity: z.coerce.number().int().min(0).optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type CommerceModelFormValues = z.infer<typeof commerceModelSchema>;
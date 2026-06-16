import { z } from "zod";

export const pricingSchema = z.object({
  name: z.string().min(2, "Pricing rule name is required"),

  code: z
    .string()
    .min(2, "Code is required")
    .regex(/^[A-Z0-9_]+$/, "Use uppercase code format, example SUMMER_SALE_2026"),

  scope: z.enum(["PRODUCT", "VARIANT"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),

  commerceType: z.enum(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"]),

  currency: z.enum(["USD", "INR", "GBP", "EUR"]),

  basePrice: z.coerce.number().min(0, "Base price must be 0 or greater"),
  salePrice: z.coerce.number().min(0, "Sale price must be 0 or greater").optional(),
  rentalPrice: z.coerce.number().min(0, "Rental price must be 0 or greater").optional(),
  resalePrice: z.coerce.number().min(0, "Resale price must be 0 or greater").optional(),
  mtoPrice: z.coerce.number().min(0, "MTO price must be 0 or greater").optional(),

  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.coerce.number().min(0, "Discount value must be 0 or greater").optional(),

  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),

  status: z.enum(["DRAFT", "ACTIVE", "SCHEDULED", "EXPIRED", "ARCHIVED"]),
});

export type PricingFormValues = z.infer<typeof pricingSchema>;
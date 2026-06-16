import { z } from "zod";

export const searchDataSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),

  normalizedKeyword: z.string().min(1, "Normalized keyword is required"),

  scope: z.enum(["PRODUCT", "VARIANT", "CATEGORY", "ATTRIBUTE", "GLOBAL"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),
  categoryId: z.string().optional(),
  attributeId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP", "BOTH"]),

  intent: z.enum([
    "GENERAL",
    "CATEGORY_DISCOVERY",
    "PRODUCT_DISCOVERY",
    "OCCASION",
    "COLOR",
    "STYLE",
    "FIT",
    "BRIDAL_PARTY",
  ]),

  synonyms: z.string().optional(),
  misspellings: z.string().optional(),
  boostTerms: z.string().optional(),

  rankingWeight: z.coerce
    .number()
    .int()
    .min(0, "Ranking weight cannot be negative")
    .max(100, "Ranking weight should be between 0 and 100"),

  isVisible: z.boolean().optional(),
  isTrending: z.boolean().optional(),

  resultUrl: z.string().optional(),
  notes: z.string().optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type SearchDataFormValues = z.infer<typeof searchDataSchema>;
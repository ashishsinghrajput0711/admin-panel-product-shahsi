import { z } from "zod";

export const styleDataSchema = z.object({
  scope: z.enum(["PRODUCT", "VARIANT"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  occasion: z.string().optional(),
  styleCategory: z.string().optional(),

  colorFamily: z.string().optional(),
  fabricFeel: z.string().optional(),

  neckline: z.string().optional(),
  sleeveType: z.string().optional(),
  silhouette: z.string().optional(),

  modestyLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),

  season: z.enum(["SPRING", "SUMMER", "FALL", "WINTER", "ALL_SEASON"]),

  styleTags: z.string().optional(),
  trendTags: z.string().optional(),

  aiStylingNotes: z.string().optional(),
  merchandisingNotes: z.string().optional(),

  isFeatured: z.boolean().optional(),
  isTrendItem: z.boolean().optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type StyleDataFormValues = z.infer<typeof styleDataSchema>;
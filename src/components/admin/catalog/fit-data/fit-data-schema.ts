import { z } from "zod";

const optionalText = z.string().optional().default("");

const sizeChartRowSchema = z.object({
  size: z.string().min(1, "Size required hai."),
  bust: z.string().optional().default(""),
  waist: z.string().optional().default(""),
  hips: z.string().optional().default(""),
  length: z.string().optional().default(""),
});

export const fitDataSchema = z.object({
  productId: z.string().min(1, "Product ID required hai."),
  scope: z.enum(["PRODUCT", "VARIANT"]).default("PRODUCT"),
  variantId: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),

  fitType: z.string().min(1, "Fit type required hai."),
  silhouette: z.string().min(1, "Silhouette required hai."),
  lengthType: z.string().min(1, "Length type required hai."),
  stretchLevel: z.string().min(1, "Stretch level required hai."),
  supportLevel: z.string().min(1, "Support level required hai."),
  closureType: z.string().min(1, "Closure type required hai."),
  neckline: z.string().min(1, "Neckline required hai."),
  sleeveLength: z.string().min(1, "Sleeve length required hai."),
  waistline: z.string().min(1, "Waistline required hai."),

  fitNotes: optionalText,
  sizeRecommendationNote: optionalText,

  modelHeight: optionalText,
  modelWearingSize: optionalText,
  modelBust: optionalText,
  modelWaist: optionalText,
  modelHips: optionalText,

  guideBust: optionalText,
  guideWaist: optionalText,
  guideHips: optionalText,
  guideLength: optionalText,

  sizeChart: z.array(sizeChartRowSchema).min(1, "At least one size row required hai."),

  alterationAllowed: z.boolean().default(false),
  customSizingAvailable: z.boolean().default(false),
  isActive: z.boolean().default(true),

  recommendedForBodyTypes: z.array(z.string()).default([]),
  notRecommendedForBodyTypes: z.array(z.string()).default([]),
});

export type FitDataFormValues = z.infer<typeof fitDataSchema>;
import { z } from "zod";

export const fitDataSchema = z.object({
  scope: z.enum(["PRODUCT", "VARIANT"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  sizeLabel: z.string().optional(),

  bustMeasurement: z.coerce.number().min(0).optional(),
  waistMeasurement: z.coerce.number().min(0).optional(),
  hipMeasurement: z.coerce.number().min(0).optional(),
  shoulderMeasurement: z.coerce.number().min(0).optional(),
  sleeveLength: z.coerce.number().min(0).optional(),
  garmentLength: z.coerce.number().min(0).optional(),
  inseamLength: z.coerce.number().min(0).optional(),

  minBust: z.coerce.number().min(0).optional(),
  maxBust: z.coerce.number().min(0).optional(),
  minWaist: z.coerce.number().min(0).optional(),
  maxWaist: z.coerce.number().min(0).optional(),
  minHip: z.coerce.number().min(0).optional(),
  maxHip: z.coerce.number().min(0).optional(),

  fitType: z.enum(["RELAXED", "REGULAR", "FITTED", "BODYCON", "OVERSIZED"]),

  stretchLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),

  silhouette: z.enum([
    "A_LINE",
    "MERMAID",
    "SHEATH",
    "BALL_GOWN",
    "EMPIRE",
    "STRAIGHT",
    "FIT_AND_FLARE",
  ]),

  customLengthAllowed: z.boolean().optional(),
  alterationAllowed: z.boolean().optional(),

  fitNotes: z.string().optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type FitDataFormValues = z.infer<typeof fitDataSchema>;
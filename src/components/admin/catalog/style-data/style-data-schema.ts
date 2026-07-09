import { z } from "zod";

export const styleDataSchema = z
  .object({
    productId: z.string().min(1, "Product required hai."),
    variantId: z.string().optional(),

    scope: z.enum(["PRODUCT", "VARIANT"]),
    businessType: z.enum(["SHAHSI", "GOWNLOOP"]),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),

    occasion: z.array(z.string()).default([]),
    colorFamily: z.string().min(1, "Color family required hai."),
    fabricFeel: z.string().min(1, "Fabric feel required hai."),
    neckline: z.string().min(1, "Neckline required hai."),
    sleeveType: z.string().min(1, "Sleeve type required hai."),
    silhouette: z.string().min(1, "Silhouette required hai."),
    modestyLevel: z.string().min(1, "Modesty level required hai."),
    season: z.array(z.string()).default([]),

    tags: z.array(z.string()).default([]),
    stylingKeywords: z.array(z.string()).default([]),
    aiStylingNotes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.scope === "PRODUCT" && values.variantId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variantId"],
        message: "PRODUCT scope me variantId nahi bhejna hai.",
      });
    }

    if (values.scope === "VARIANT" && !values.variantId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variantId"],
        message: "VARIANT scope ke liye variantId required hai.",
      });
    }

    if (!values.occasion.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occasion"],
        message: "At least one occasion select karo.",
      });
    }

    if (!values.season.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["season"],
        message: "At least one season select karo.",
      });
    }
  });

export type StyleDataFormValues = z.infer<typeof styleDataSchema>;
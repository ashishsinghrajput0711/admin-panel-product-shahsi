import { z } from "zod";

export const mediaSchema = z.object({
  scope: z.enum(["PRODUCT", "VARIANT"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  type: z.enum([
    "IMAGE",
    "VIDEO",
    "THUMBNAIL",
    "LOOKBOOK",
    "SIZE_GUIDE",
    "FABRIC_SWATCH",
  ]),

  url: z.string().min(1, "Media URL is required").url("Enter a valid URL"),

  thumbnailUrl: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: "Enter a valid thumbnail URL",
    }),

  title: z.string().optional(),

  altText: z.string().max(180, "Alt text should be under 180 characters").optional(),

  fileName: z.string().optional(),
  mimeType: z.string().optional(),

  position: z.coerce.number().int().min(0, "Position cannot be negative"),

  isPrimary: z.boolean().optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type MediaFormValues = z.infer<typeof mediaSchema>;
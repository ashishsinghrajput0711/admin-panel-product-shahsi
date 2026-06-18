import { z } from "zod";

const metafieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
  z.undefined(),
]);

const taxonomySchema = z
  .object({
    id: z.string().optional().nullable(),
    taxonomyId: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    fullPath: z.string().optional().nullable(),
    label: z.string().optional().nullable(),
    parentName: z.string().optional().nullable(),
    metafieldCount: z.number().optional().nullable(),
  })
  .optional()
  .nullable();

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),

  sku: z.string().min(2, "SKU is required"),

  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase URL slug format"),

  description: z.string().optional(),

  shortDescription: z
    .string()
    .max(180, "Short description should be under 180 characters")
    .optional(),

  brand: z.string().optional(),

  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  categories: z.array(z.string()).optional(),

  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),

  productType: z.enum([
    "DRESS",
    "ACCESSORY",
    "SWATCH",
    "EDITORIAL_PRODUCT",
    "RESALE_LISTING",
    "RENTAL_LISTING",
  ]),

  commerceTypes: z
    .array(z.enum(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"]))
    .min(1, "Select at least one commerce type"),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  price: z.coerce.number().min(0, "Price must be 0 or greater"),

  salePrice: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    },
    z.coerce.number().min(0, "Sale price must be 0 or greater").optional()
  ),

  seoTitle: z.string().optional(),

  seoDescription: z.string().optional(),

  taxonomyId: z.string().optional(),
  taxonomy: taxonomySchema,

  productMetafields: z.record(z.string(), metafieldValueSchema).optional(),

  categoryMetafields: z.record(z.string(), metafieldValueSchema).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
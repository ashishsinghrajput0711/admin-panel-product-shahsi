import { z } from "zod";

export const attributeSchema = z.object({
  name: z.string().min(2, "Attribute name required"),
  slug: z.string().min(2, "Slug required"),
  code: z.string().min(2, "Code required"),

  description: z.string().optional(),

  type: z.enum([
    "TEXT",
    "NUMBER",
    "BOOLEAN",
    "SELECT",
    "MULTI_SELECT",
    "COLOR",
    "SIZE",
  ]),

  scope: z.enum(["PRODUCT", "VARIANT", "PRODUCT_AND_VARIANT"]),

  group: z.enum([
    "PRODUCT",
    "VARIANT",
    "FIT",
    "STYLE",
    "SEO",
    "SEARCH",
    "MTO",
    "RENTAL",
    "RESALE",
    "BASIC",
    "SIZE",
    "COLOR",
    "FABRIC",
    "OCCASION",
    "CUSTOM",
  ]),

  isRequired: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),

  isVariantDefining: z.boolean().optional(),
  isVariantOption: z.boolean().optional(),
  isSeoField: z.boolean().optional(),
  isFitEngineField: z.boolean().optional(),
  isStyleEngineField: z.boolean().optional(),
  isBulkUploadField: z.boolean().optional(),

  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;
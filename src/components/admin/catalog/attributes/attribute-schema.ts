import { z } from "zod";

export const attributeOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.string().optional(),
  colorHex: z.string().optional(),
  imageUrl: z.string().optional(),
 sortOrder: z.coerce.number().optional(),
position: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

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

  fieldType: z.string().optional(),

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
  groupId: z.string().optional(),
groupKey: z.string().optional(),
groupSlug: z.string().optional(),

  isRequired: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),

  isVariantLevel: z.boolean().optional(),
  isVariantDefining: z.boolean().optional(),
  isVariantOption: z.boolean().optional(),
  isSeoField: z.boolean().optional(),
  isFitEngineField: z.boolean().optional(),
  isStyleEngineField: z.boolean().optional(),
  isBulkUploadField: z.boolean().optional(),

  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  isActive: z.boolean().optional(),
 sortOrder: z.coerce.number().optional(),

  options: z.array(attributeOptionSchema).optional(),
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;
export type AttributeOptionFormValues = z.infer<typeof attributeOptionSchema>;
import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  },
  z.coerce.number().min(0).optional()
);

const optionalInt = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  },
  z.coerce.number().int().min(0).optional()
);

const requiredNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    return value;
  },
  z.coerce.number().min(0, "Value cannot be negative")
);

const requiredInt = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    return value;
  },
  z.coerce.number().int().min(0, "Value cannot be negative")
);

export const variantTypeSchema = z.enum([
  "SIZE",
  "COLOR",
  "LENGTH",
  "FABRIC",
  "RENTAL_PACKAGE",
  "SUBSCRIPTION_PACKAGE",
]);

export const variantSchema = z
  .object({
    productId: z.string().min(1, "Product is required"),

    sku: z.string().min(2, "Variant SKU is required"),
    variantSku: z.string().optional(),
    barcode: z.string().optional(),

    businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

    commerceTypes: z
      .array(z.enum(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"]))
      .min(1, "Select at least one commerce type"),

    variantType: variantTypeSchema.default("SIZE"),
    rentalPackageName: z.string().optional(),
    subscriptionPackageName: z.string().optional(),

    size: z.string().optional(),
    color: z.string().optional(),
    colorFamily: z.string().optional(),
    fabric: z.string().optional(),

    height: z.string().optional(),
    dressLength: z.string().optional(),
    lengthLabel: z.string().optional(),
    neckline: z.string().optional(),
    sleeveLength: z.string().optional(),
    detail: z.string().optional(),

    price: requiredNumber,
    compareAtPrice: optionalNumber,
    salePrice: optionalNumber,
    rentalPrice: optionalNumber,
    resalePrice: optionalNumber,
    mtoPrice: optionalNumber,

    stock: requiredInt,
    reservedStock: optionalInt,

    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),

    chest: optionalNumber,
    waist: optionalNumber,
    hip: optionalNumber,
    length: optionalNumber,
    sleeve: optionalNumber,
    shoulder: optionalNumber,

    bustMeasurement: optionalNumber,
    waistMeasurement: optionalNumber,
    hipMeasurement: optionalNumber,
    garmentLength: optionalNumber,

    stretchLevel: z.string().optional(),
    fitType: z.string().optional(),

    attributesFabric: z.string().optional(),
    attributesOccasion: z.string().optional(),

    weight: optionalNumber,
    weightUnit: z.string().optional(),

    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isShipsNow: z.boolean().optional(),
    productionType: z.string().optional(),

    customLengthAllowed: z.boolean().optional(),
    minCustomLength: optionalNumber,
    maxCustomLength: optionalNumber,
    productionLeadTimeDays: optionalInt,
    rushEligible: z.boolean().optional(),
    rushFee: optionalNumber,
  })
  .superRefine((values, ctx) => {
    if (
      values.variantType === "RENTAL_PACKAGE" &&
      !values.rentalPackageName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentalPackageName"],
        message: "Rental package name is required",
      });
    }

    if (
      values.variantType === "SUBSCRIPTION_PACKAGE" &&
      !values.subscriptionPackageName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subscriptionPackageName"],
        message: "Subscription package name is required",
      });
    }
  });

export type VariantFormValues = z.infer<typeof variantSchema>;
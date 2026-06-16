import { z } from "zod";

export const inventorySchema = z.object({
  scope: z.enum(["PRODUCT", "VARIANT"]),

  productId: z.string().optional(),
  variantId: z.string().optional(),

  businessType: z.enum(["SHAHSI", "GOWNLOOP"]),

  warehouseName: z.string().min(2, "Warehouse name is required"),
  locationCode: z.string().optional(),

  totalStock: z.coerce.number().int().min(0, "Total stock cannot be negative"),
  reservedStock: z.coerce
    .number()
    .int()
    .min(0, "Reserved stock cannot be negative"),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, "Low stock threshold cannot be negative"),

  rentalAvailableStock: z.coerce
    .number()
    .int()
    .min(0, "Rental available stock cannot be negative")
    .optional(),

  damagedStock: z.coerce
    .number()
    .int()
    .min(0, "Damaged stock cannot be negative")
    .optional(),

  holdStock: z.coerce
    .number()
    .int()
    .min(0, "Hold stock cannot be negative")
    .optional(),

  restockDate: z.string().optional(),

  status: z.enum([
    "IN_STOCK",
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "ON_HOLD",
    "DAMAGED",
    "ARCHIVED",
  ]),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;
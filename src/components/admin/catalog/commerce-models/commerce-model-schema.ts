import { z } from "zod";

export const commerceModelSchema = z.object({
  name: z.string().min(2, "Commerce type name is required"),

  code: z.enum(["SHOP", "RENTAL", "RESALE", "MTO", "SUBSCRIPTION"]),

  description: z.string().optional(),

  isActive: z.boolean().default(true),

  sortOrder: z.coerce.number().int().min(0).default(1),

  configText: z.string().optional(),
});

export type CommerceModelFormValues = z.infer<typeof commerceModelSchema>;
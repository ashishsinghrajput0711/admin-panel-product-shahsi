export type CommerceModelType =
  | "SHOP"
  | "RENTAL"
  | "RESALE"
  | "MTO"
  | "SUBSCRIPTION";

export type CommerceModel = {
  id?: string;
  name: string;
  code: CommerceModelType;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  config?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};
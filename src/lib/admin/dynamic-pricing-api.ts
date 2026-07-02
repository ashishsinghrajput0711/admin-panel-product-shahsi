function getApiRootUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://65.1.135.224:3001";

  return rawUrl.replace(/\/$/, "");
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(`${getApiRootUrl()}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Dynamic Pricing API failed: ${response.status} ${response.statusText}`,
    );
  }

  return data as T;
}

export type CommerceType =
  | "SHOP"
  | "RENTAL"
  | "RESALE"
  | "MTO"
  | "SUBSCRIPTION";

export type PricingScope =
  | "GLOBAL"
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "LOCATION"
  | "WAREHOUSE";

export type AdjustmentType =
  | "PERCENTAGE"
  | "FIXED"
  | "MULTIPLIER"
  | "OVERRIDE";

export type DynamicPricingRule = {
  id: string;
  name: string;
  description?: string | null;
  commerceType: CommerceType;
  scope: PricingScope;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  productId?: string | null;
  productVariantId?: string | null;
  categoryId?: string | null;
  locationId?: string | null;
  warehouseId?: string | null;
  minBasePrice?: number | null;
  maxBasePrice?: number | null;
  priority?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  conditions?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DynamicPricingRulePayload = {
  name: string;
  description?: string | null;
  commerceType: CommerceType;
  scope: PricingScope;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  productId?: string | null;
  productVariantId?: string | null;
  categoryId?: string | null;
  locationId?: string | null;
  warehouseId?: string | null;
  minBasePrice?: number | null;
  maxBasePrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  priority?: number;
  isActive?: boolean;
  conditions?: Record<string, unknown> | null;
};



export type PricingPickerProduct = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
};

export function unwrapPickerProducts(response: any): PricingPickerProduct[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.data?.products)) return response.data.products;

  return [];
}

export async function searchPricingProducts(query: string) {
  const searchParams = new URLSearchParams();

  if (query.trim()) {
    searchParams.set("search", query.trim());
  }

  searchParams.set("limit", "20");

  const queryString = searchParams.toString();

  return adminRequest<any>(
    `/admin/catalog/products/picker${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );
}

export type SimulatePricingPayload = {
  basePrice: number;
  commerceType: CommerceType;
  productId?: string;
  productVariantId?: string;
  categoryId?: string;
  locationId?: string;
  warehouseId?: string;
  pricingDate?: string;
  rentalDays?: number;
  quantity?: number;
};

export function unwrapPricingRules(response: any): DynamicPricingRule[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.rules)) return response.rules;
  if (Array.isArray(response?.data?.rules)) return response.data.rules;

  return [];
}

export function unwrapPricingRule(response: any): DynamicPricingRule | null {
  const rule =
    response?.data?.rule ||
    response?.data?.pricingRule ||
    response?.data ||
    response?.rule ||
    response?.pricingRule ||
    response ||
    null;

  if (!rule || typeof rule !== "object") return null;

  return rule as DynamicPricingRule;
}

export async function getPricingRules(params?: {
  commerceType?: string;
  scope?: string;
  adjustmentType?: string;
  isActive?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return adminRequest<any>(`/admin/pricing/rules${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function getPricingRuleById(id: string) {
  return adminRequest<any>(`/admin/pricing/rules/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function createPricingRule(payload: DynamicPricingRulePayload) {
  return adminRequest<any>("/admin/pricing/rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePricingRule(
  id: string,
  payload: Partial<DynamicPricingRulePayload>,
) {
  return adminRequest<any>(`/admin/pricing/rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePricingRule(id: string) {
  return adminRequest<any>(`/admin/pricing/rules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function simulatePricing(payload: SimulatePricingPayload) {
  return adminRequest<any>("/admin/pricing/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateShopPricing(payload: SimulatePricingPayload) {
  return adminRequest<any>("/admin/pricing/shop", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateRentalPricing(payload: SimulatePricingPayload) {
  return adminRequest<any>("/admin/pricing/rental", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateResalePricing(payload: SimulatePricingPayload) {
  return adminRequest<any>("/admin/pricing/resale", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateMtoPricing(payload: SimulatePricingPayload) {
  return adminRequest<any>("/admin/pricing/mto", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function calculateSubscriptionPricing(
  payload: SimulatePricingPayload,
) {
  return adminRequest<any>("/admin/pricing/subscription", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export type PricingPickerVariant = {
  id: string;
  productId?: string | null;
  title?: string | null;
  name?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  status?: string | null;
  product?: {
    id?: string | null;
    title?: string | null;
    name?: string | null;
    slug?: string | null;
    imageUrl?: string | null;
    thumbnail?: string | null;
    thumbnailUrl?: string | null;
  } | null;
  productTitle?: string | null;
  productName?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
};

export function unwrapPickerVariants(response: any): PricingPickerVariant[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.variants)) return response.variants;
  if (Array.isArray(response?.data?.variants)) return response.data.variants;

  return [];
}

export async function searchPricingVariants(query: string) {
  const searchParams = new URLSearchParams();

  // Backend may not accept q/search, so keep only safe pagination first.
  searchParams.set("limit", "50");

  const queryString = searchParams.toString();

  return adminRequest<any>(
    `/admin/catalog/variants${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );
}



export type PricingPickerCategory = {
  id: string;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  slug?: string | null;
  path?: string | null;
  fullPath?: string | null;
  parentName?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  productCount?: number | null;
  activeProductCount?: number | null;
};

export function unwrapPickerCategories(response: any): PricingPickerCategory[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.categories)) return response.data.categories;

  return [];
}

export async function searchPricingCategories(query: string) {
  const searchParams = new URLSearchParams();

  // Backend may reject q/search params, so only safe params first.
  searchParams.set("limit", "100");

  const queryString = searchParams.toString();

  return adminRequest<any>(
  `/admin/catalog/categories/tree?includeInactive=true&showProductCount=true&showEmpty=true&maxDepth=50`,
  {
    method: "GET",
  },
);
}


export type ProductPricingPayload = {
  basePrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  currency?: string;
  rentalPrice?: number | null;
  resalePrice?: number | null;
  listingPrice?: number | null;
  minOfferPrice?: number | null;
};

export async function updateCatalogProductPricing(
  productId: string,
  payload: ProductPricingPayload,
) {
  return adminRequest<any>(
    `/admin/catalog/${encodeURIComponent(productId)}/pricing`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
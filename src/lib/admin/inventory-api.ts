
type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

type InventoryRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
};

export type InventoryListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type InventoryListResponse<T> = {
  data: T[];
  meta: InventoryListMeta;
};

export type LocationType = "STORE" | "WAREHOUSE" | "HUB" | "POPUP" | string;

export type AdminLocation = {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminLocationPayload = {
  name: string;
  code: string;
  type: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  addressLine1?: string;
  addressLine2?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

export type WarehouseType = "MAIN" | "STORE" | "FULFILLMENT" | "RETURN" | string;

export type AdminWarehouse = {
  id: string;
  locationId: string;
  name: string;
  code: string;
  type: WarehouseType;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  managerEmail?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminWarehousePayload = {
  locationId: string;
  name: string;
  code: string;
  type: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

export type WarehouseBin = {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  zone?: string | null;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  capacity?: number | null;
  currentLoad?: number | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWarehouseBinPayload = {
  name: string;
  code: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  currentLoad?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

export type InventoryAsset = {
  id: string;
  productId: string;
  variantId?: string | null;
  skuCode?: string | null;
  barcode?: string | null;
  assetType?: string;
  title?: string | null;
  notes?: string | null;
  locationId?: string | null;
  warehouseId?: string | null;
  binCode?: string | null;
  condition?: string;
  status?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  allocatedQuantity?: number;
  damagedQuantity?: number;
  lostQuantity?: number;
  unitCost?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInventoryAssetPayload = {
  productId: string;
  variantId?: string;
  skuCode?: string;
  barcode?: string;
  assetType?: string;
  title?: string;
  notes?: string;
  locationId?: string;
  warehouseId?: string;
  binCode?: string;
  condition?: string;
  status?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  allocatedQuantity?: number;
  damagedQuantity?: number;
  lostQuantity?: number;
  unitCost?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

export type UpdateInventoryAssetPayload = Partial<CreateInventoryAssetPayload>;

export type InventoryQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  locationId?: string;
  warehouseId?: string;
  productId?: string;
  variantId?: string;
};


export type AdminProductPickerItem = {
  id: string;
  title: string;
  slug?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  vendor?: string | null;
  brand?: string | null;
  price?: number | null;
  status?: string | null;
  color?: string | null;
  colorFamily?: string | null;
  colorHex?: string | null;
};

export type AdminCatalogVariant = {
  id: string;
  productId: string;
  size?: string | null;
  color?: string | null;
  colorFamily?: string | null;
  variantType?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stock?: number | null;
  reservedStock?: number | null;
  sku?: string | null;
  barcode?: string | null;
  variantSku?: string | null;
  isActive?: boolean | null;
  isAvailable?: boolean | null;
  status?: string | null;
  productionType?: string | null;
};

export type ProductPickerQuery = {
  ids?: string;
  search?: string;
  searchBy?: string;
  category?: string;
  collection?: string;
  type?: string;
  tag?: string;
  vendor?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type ProductPickerResponse = {
  items: AdminProductPickerItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters?: {
      categories?: string[];
      collections?: string[];
      types?: string[];
      vendors?: string[];
      tags?: string[];
    };
  };
};

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function normalizeBaseUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!rawUrl) {
    throw new Error(
      "API base URL missing hai. .env.local me NEXT_PUBLIC_ADMIN_API_URL add karo."
    );
  }

  return rawUrl.replace(/\/$/, "");
}

function buildInventoryQuery(query?: InventoryQuery) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === "") return;
    if (value === "ALL") return;

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}


function buildProductPickerQuery(query?: ProductPickerQuery) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === "") return;
    if (value === "ALL") return;

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function inventoryRequest<T>(
  endpoint: string,
  options: InventoryRequestOptions = {}
): Promise<T> {
  const token = getToken();
  const method = options.method ?? "GET";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${normalizeBaseUrl()}${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const rawText = await response.text();
  const json = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
 console.warn("INVENTORY API WARNING:", {
  method,
  endpoint,
  status: response.status,
  requestBody: options.body,
  response: json,
});

    const message =
      json?.message ||
      json?.error ||
      `Inventory API failed with status ${response.status}`;

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return json as T;
}

function unwrapInventoryList<T>(response: unknown): InventoryListResponse<T> {
  const fallback: InventoryListResponse<T> = {
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };

  if (!response || typeof response !== "object") return fallback;

  const value = response as {
    data?: unknown;
    meta?: Partial<InventoryListMeta>;
  };

  const data = Array.isArray(value.data) ? (value.data as T[]) : [];

  return {
    data,
    meta: {
      page: Number(value.meta?.page ?? 1),
      limit: Number(value.meta?.limit ?? 20),
      total: Number(value.meta?.total ?? data.length),
      totalPages: Number(value.meta?.totalPages ?? 1),
    },
  };
}

export async function getAdminLocations(query?: InventoryQuery) {
  const response = await inventoryRequest<unknown>(
    `/admin/locations${buildInventoryQuery(query)}`
  );

  return unwrapInventoryList<AdminLocation>(response);
}

export async function createAdminLocation(payload: CreateAdminLocationPayload) {
  return inventoryRequest<AdminLocation>("/admin/locations", {
    method: "POST",
    body: payload,
  });
}

export async function getAdminWarehouses(query?: InventoryQuery) {
  const response = await inventoryRequest<unknown>(
    `/admin/warehouses${buildInventoryQuery(query)}`
  );

  return unwrapInventoryList<AdminWarehouse>(response);
}

export async function createAdminWarehouse(
  payload: CreateAdminWarehousePayload
) {
  return inventoryRequest<AdminWarehouse>("/admin/warehouses", {
    method: "POST",
    body: payload,
  });
}

export async function getWarehouseBins(
  warehouseId: string,
  query?: InventoryQuery
) {
  const response = await inventoryRequest<unknown>(
    `/admin/warehouses/${warehouseId}/bins${buildInventoryQuery(query)}`
  );

  return unwrapInventoryList<WarehouseBin>(response);
}

export async function createWarehouseBin(
  warehouseId: string,
  payload: CreateWarehouseBinPayload
) {
  return inventoryRequest<WarehouseBin>(
    `/admin/warehouses/${warehouseId}/bins`,
    {
      method: "POST",
      body: payload,
    }
  );
}

export async function getInventoryAssets(query?: InventoryQuery) {
  const response = await inventoryRequest<unknown>(
    `/admin/inventory/assets${buildInventoryQuery(query)}`
  );

  return unwrapInventoryList<InventoryAsset>(response);
}

export async function createInventoryAsset(
  payload: CreateInventoryAssetPayload
) {
  return inventoryRequest<InventoryAsset>("/admin/inventory/assets", {
    method: "POST",
    body: payload,
  });
}

export async function getInventoryAssetById(assetId: string) {
  const response = await inventoryRequest<{
    success?: boolean;
    data?: InventoryAsset;
    error?: unknown;
  }>(`/admin/inventory/assets/${assetId}`);

  return response.data;
}

export async function updateInventoryAsset(
  assetId: string,
  payload: UpdateInventoryAssetPayload
) {
  const response = await inventoryRequest<{
    success?: boolean;
    data?: InventoryAsset;
    error?: unknown;
  }>(`/admin/inventory/assets/${assetId}`, {
    method: "PATCH",
    body: payload,
  });

  return response.data;
}

export async function deleteInventoryAsset(assetId: string) {
  const response = await inventoryRequest<{
    success?: boolean;
    data?: unknown;
    error?: unknown;
  }>(`/admin/inventory/assets/${assetId}`, {
    method: "DELETE",
  });

  return response.data;
}


export async function getAdminProductPicker(query?: ProductPickerQuery) {
  const response = await inventoryRequest<{
    success?: boolean;
    data?: ProductPickerResponse;
    error?: unknown;
  }>(`/admin/catalog/products/picker${buildProductPickerQuery(query)}`);

  return {
    items: response.data?.items ?? [],
    meta: response.data?.meta ?? {
      total: 0,
      page: 1,
      limit: query?.limit ?? 20,
      totalPages: 0,
    },
  };
}


export async function getAdminProductVariants(productId: string) {
  if (!productId) return [];

  const response = await inventoryRequest<{
    success?: boolean;
    data?: AdminCatalogVariant[];
    error?: unknown;
  }>(`/admin/catalog/${productId}/variants`);

  return response.data ?? [];
}
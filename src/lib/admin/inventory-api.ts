
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
export type CreateRentalInventoryUnitPayload = {
  productId: string;
  variantId?: string;
  skuCode: string;
  condition?: string;
};

export type RentalRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED";

export type RentalRequest = {
  id: string;
  productId: string;
  renterId: string;
  sellerId?: string | null;
  startDate: string;
  endDate: string;
  status: RentalRequestStatus;
  message?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RentalRequestQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type RentalBookingStatus =
  | "PENDING"
  | "RESERVED"
  | "PAID"
  | "SHIPPED"
  | "ACTIVE"
  | "RETURNED"
  | "CLEANING"
  | "COMPLETED"
  | "CANCELLED";

export type RentalBookingPayment = {
  id: string;
  bookingId: string;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceId?: string | null;
  stripeRefundId?: string | null;
  clientSecret?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RentalBookingReturn = {
  id: string;
  bookingId: string;
  receivedAt?: string | null;
  condition?: RentalInventoryCondition | string | null;
  notes?: string | null;
  cleaningStartedAt?: string | null;
  cleaningCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RentalBooking = {
  id: string;
  userId: string;
  orderType: string;
  productId: string;
  variantId?: string | null;
  inventoryUnitId?: string | null;
  subscriptionId?: string | null;
  subscriptionBoxId?: string | null;

  rentalStartDate: string;
  rentalEndDate: string;
  returnDueDate?: string | null;
  cleaningEndDate?: string | null;
  rentalDays: number;

  subtotal: number;
  securityDeposit: number;
  premiumSurcharge: number;
  lateFee: number;
  damageFee: number;
  total: number;

  status: RentalBookingStatus;
  createdAt?: string;
  updatedAt?: string;

  inventoryUnit?: RentalInventoryUnit | null;
  payments?: RentalBookingPayment[];
  shipments?: Array<Record<string, unknown>>;
  returns?: RentalBookingReturn[];
  damageReports?: Array<Record<string, unknown>>;
};

export type RentalBookingQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type RentalBookingTimelineEvent = {
  type: string;
  at: string;
  status?: RentalBookingStatus | string;
  id?: string;
};

export type RentalBookingTimeline = {
  bookingId: string;
  events: RentalBookingTimelineEvent[];
};

export type UpdateRentalBookingStatusPayload = {
  status: RentalBookingStatus;
};

export type ReturnRentalBookingPayload = {
  condition: RentalInventoryCondition;
  notes?: string;
};

export type RentalInventoryUnit = {
  id: string;
  productId: string;
  variantId?: string | null;
  
  skuCode: string;
 status: RentalInventoryUnitStatus;
 condition?: RentalInventoryCondition | null;
  currentBookingId?: string | null;
  createdAt?: string;
  updatedAt?: string;

  product?: {
    id: string;
    title: string;
    sku?: string | null;
    slug?: string | null;
  } | null;

  variant?: {
    id: string;
    sku?: string | null;
    size?: string | null;
    color?: string | null;
  } | null;

  bookings?: Array<{
  id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}>;
};

export type RentalInventoryUnitStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "RENTED"
  | "RETURNED"
  | "CLEANING"
  | "DAMAGED"
  | "LOST";

  export type RentalInventoryCondition =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Needs Repair";

export type UpdateRentalInventoryUnitConditionPayload = {
  condition: RentalInventoryCondition;
};

export type UpdateRentalInventoryUnitStatusPayload = {
  status: RentalInventoryUnitStatus;
};

export type RentalInventoryUnitResponse =
  RentalInventoryUnit;

export type RentalInventoryUnitQuery = {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  variantId?: string;
  status?: string;
  isActive?: boolean;
};

export type RentalOptions = {
  inventoryUnitStatuses: string[];
  inventoryConditions: string[];
  requestStatuses: string[];
  bookingStatuses: string[];
  damageStatuses: string[];
  validBookingTransitions: Record<
    string,
    string[]
  >;
  pricingSourcePriority: string[];
  inventorySource: string;
  pricingRuleCardinality: string;
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
function buildRentalInventoryUnitQuery(
  query?: RentalInventoryUnitQuery,
) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "ALL"
      ) {
        return;
      }

      params.set(key, String(value));
    },
  );

  const queryString = params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}


function buildRentalRequestQuery(
  query?: RentalRequestQuery,
) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}


function buildRentalBookingQuery(
  query?: RentalBookingQuery,
) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

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

 if (!response.ok || json?.success === false) {
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


function unwrapInventoryItem<T>(
  response: unknown,
): T | null {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  const value = response as {
    data?: unknown;
  };

  if ("data" in value) {
    return (value.data ?? null) as T | null;
  }

  return response as T;
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

export async function createRentalInventoryUnit(
  payload: CreateRentalInventoryUnitPayload,
) {
  const response = await inventoryRequest<{
    success?: boolean;
    data?: RentalInventoryUnitResponse;
    error?: unknown;
    message?: string;
  }>("/admin/rental/inventory-unit", {
    method: "POST",
    body: payload,
  });

  return response.data;
}


export async function getRentalOptions() {
  return inventoryRequest<RentalOptions>(
    "/admin/rental/options",
  );
}

export async function getRentalInventoryUnits(
  query?: RentalInventoryUnitQuery,
) {
  const response =
    await inventoryRequest<unknown>(
      `/admin/rental/inventory-units${buildRentalInventoryUnitQuery(
        query,
      )}`,
    );

  return unwrapInventoryList<RentalInventoryUnit>(
    response,
  );
}

export async function getRentalInventoryUnitById(
  unitId: string,
) {
  const response =
    await inventoryRequest<unknown>(
      `/admin/rental/inventory-units/${encodeURIComponent(
        unitId,
      )}`,
    );

  return unwrapInventoryItem<RentalInventoryUnit>(
    response,
  );
}

export async function deleteRentalInventoryUnit(
  unitId: string,
) {
  return inventoryRequest<unknown>(
    `/admin/rental/inventory-units/${encodeURIComponent(
      unitId,
    )}`,
    {
      method: "DELETE",
    },
  );
}


export async function updateRentalInventoryUnitStatus(
  unitId: string,
  payload: UpdateRentalInventoryUnitStatusPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/inventory-units/${encodeURIComponent(unitId)}/status`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalInventoryUnit>(response);
}


export async function updateRentalInventoryUnitCondition(
  unitId: string,
  payload: UpdateRentalInventoryUnitConditionPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/inventory-units/${encodeURIComponent(unitId)}/condition`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalInventoryUnit>(response);
}


export async function archiveRentalInventoryUnit(
  unitId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/inventory-units/${encodeURIComponent(unitId)}/archive`,
    {
      method: "PATCH",
    },
  );

  return unwrapInventoryItem<RentalInventoryUnit>(
    response,
  );
}

export async function getRentalRequests(
  query?: RentalRequestQuery,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/requests${buildRentalRequestQuery(query)}`,
  );

  return unwrapInventoryList<RentalRequest>(response);
}

export async function getRentalRequestById(
  requestId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/requests/${encodeURIComponent(requestId)}`,
  );

  return unwrapInventoryItem<RentalRequest>(response);
}

export async function acceptRentalRequest(
  requestId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/requests/${encodeURIComponent(requestId)}/accept`,
    {
      method: "PATCH",
    },
  );

  return unwrapInventoryItem<RentalRequest>(response);
}

export async function declineRentalRequest(
  requestId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/requests/${encodeURIComponent(requestId)}/decline`,
    {
      method: "PATCH",
      body: {},
    },
  );

  return unwrapInventoryItem<RentalRequest>(response);
}

export async function getRentalBookings(
  query?: RentalBookingQuery,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/bookings${buildRentalBookingQuery(query)}`,
  );

  return unwrapInventoryList<RentalBooking>(response);
}

export async function getRentalBookingById(
  bookingId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/bookings/${encodeURIComponent(bookingId)}`,
  );

  return unwrapInventoryItem<RentalBooking>(response);
}

export async function getRentalBookingTimeline(
  bookingId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/bookings/${encodeURIComponent(
      bookingId,
    )}/timeline`,
  );

  return unwrapInventoryItem<RentalBookingTimeline>(response);
}

export async function updateRentalBookingStatus(
  bookingId: string,
  payload: UpdateRentalBookingStatusPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/bookings/${encodeURIComponent(
      bookingId,
    )}/status`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalBooking>(response);
}

export async function returnRentalBooking(
  bookingId: string,
  payload: ReturnRentalBookingPayload,
) {
  return inventoryRequest<{ message?: string }>(
    `/admin/rental/booking/${encodeURIComponent(
      bookingId,
    )}/return`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export async function completeRentalBookingCleaning(
  bookingId: string,
) {
  return inventoryRequest<{ message?: string }>(
    `/admin/rental/booking/${encodeURIComponent(
      bookingId,
    )}/cleaning-complete`,
    {
      method: "PATCH",
    },
  );
}
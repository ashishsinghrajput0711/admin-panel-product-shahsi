
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
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminLocationPayload = {
  name: string;
  code: string;
  type?: string;
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

export type UpdateAdminLocationPayload =
  Partial<CreateAdminLocationPayload>;

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

  code?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isActive?: boolean;
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

export type SubscriptionAdminPlanStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type SubscriptionBillingInterval =
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEASONAL"
  | "YEARLY";

export type CustomerSubscriptionStatus =
  | "ACTIVE"
  | "PAUSED"
  | "SKIPPED"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type SubscriptionAdminPlan = {
  id: string;
  name: string;
  description?: string | null;
  status: SubscriptionAdminPlanStatus;
  billingInterval: SubscriptionBillingInterval;
  price: string | number;
  currency: string;
  itemsPerCycle: number;
  rentalDaysPerItem: number;
  eligibleProductIds: string[];
  eligibleCategoryIds: string[];
  allowPause: boolean;
  allowSkip: boolean;
  metadata?: Record<string, unknown> | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSubscriptionActionLog = {
  id: string;
  subscriptionId: string;
  actionType: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt: string;
};

export type SubscriptionBillingRetryMode =
  | "MANUAL"
  | "AUTO";

export type CustomerSubscriptionBillingAttempt = {
  id: string;
  subscriptionId: string;
  paymentIntentId?: string | null;
  retryMode: SubscriptionBillingRetryMode;
  status: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BillingRetryPayload = {
  subscriptionId: string;
  paymentIntentId?: string;
  retryMode?: SubscriptionBillingRetryMode;
  note?: string;
  createdBy?: string;
};

export type SubscriptionInventoryForecastPayload = {
  from: string;
  to: string;
  planIds?: string[];
  categoryIds?: string[];
  locationId?: string;
  createdBy?: string;
};

export type SubscriptionInventoryForecastPlan = {
  planId: string;
  planName: string;
  billingInterval: SubscriptionBillingInterval;
  subscriptions: number;
  itemsPerCycle: number;
  itemsRequired: number;
  eligibleProductIds: string[];
  eligibleCategoryIds: string[];
};

export type SubscriptionInventoryForecast = {
  from: string;
  to: string;
  planIds: string[];
  categoryIds: string[];
  totalSubscriptions: number;
  totalItemsRequired: number;
  byPlan: SubscriptionInventoryForecastPlan[];
  forecastRunId: string;
};


export type SubscriptionProrationMode =
  | "IMMEDIATE"
  | "NEXT_CYCLE"
  | "NONE";

export type UpgradeCustomerSubscriptionPayload = {
  newPlanId: string;
  effectiveFrom: string;
  prorationMode?: SubscriptionProrationMode;
  note?: string;
  updatedBy?: string;
};
export type CustomerSubscription = {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  status: CustomerSubscriptionStatus;

  startDate: string;
  endDate?: string | null;

  currentCycleStart: string;
  currentCycleEnd: string;
  nextBillingDate: string;

  pausedUntil?: string | null;
  cancelledAt?: string | null;

  shippingAddressId?: string | null;
  paymentMethodId?: string | null;

  notes?: string | null;
  metadata?: Record<string, unknown> | null;

  createdBy?: string | null;
  updatedBy?: string | null;

  createdAt: string;
  updatedAt: string;

  plan: SubscriptionAdminPlan;

  actionLogs?: CustomerSubscriptionActionLog[];
  billingAttempts?: CustomerSubscriptionBillingAttempt[];
};

export type SubscriptionPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SubscriptionAdminPlanListResponse = {
  items: SubscriptionAdminPlan[];
  meta: SubscriptionPaginationMeta;
};

export type CustomerSubscriptionListResponse = {
  items: CustomerSubscription[];
  meta: SubscriptionPaginationMeta;
};

export type SubscriptionAdminPlanQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionAdminPlanStatus;
  billingInterval?: SubscriptionBillingInterval;
};

export type CustomerSubscriptionListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerSubscriptionStatus;
  customerId?: string;
  planId?: string;
  from?: string;
  to?: string;
};

export type CreateCustomerSubscriptionPayload = {
  customerId: string;
  planId: string;
  status?: CustomerSubscriptionStatus;
  startDate: string;
  nextBillingDate?: string;
  shippingAddressId?: string;
  paymentMethodId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
};

export type PauseCustomerSubscriptionPayload = {
  reason: string;
  pauseUntil?: string;
  note?: string;
  updatedBy?: string;
};

export type SkipCustomerSubscriptionPayload = {
  cycleDate: string;
  reason: string;
  note?: string;
  updatedBy?: string;
};

export type RentalDamageStatus =
  | "OPEN"
  | "CHARGED"
  | "WAIVED"
  | "RESOLVED";

export type RentalDamageBooking = {
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
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RentalDamageReport = {
  id: string;
  bookingId: string;
  inventoryUnitId?: string | null;
  damageType: string;
  notes?: string | null;
  repairCost: number;
  feeCharged: number;
  status: RentalDamageStatus;
  createdAt: string;
  updatedAt: string;
  booking?: RentalDamageBooking | null;
};

export type RentalDamageReportQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateRentalDamageReportPayload = {
  bookingId: string;
  inventoryUnitId?: string;
  damageType: string;
  notes?: string;
  repairCost?: number;
  feeCharged?: number;
};

export type UpdateRentalDamageReportPayload = {
  notes?: string;
  repairCost?: number;
  feeCharged?: number;
};

export type UpdateRentalDamageStatusPayload = {
  status: RentalDamageStatus;
};

export type RentalSubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  itemCreditsPerCycle: number;
  cycle: string;
  pauseAllowed: boolean;
  cancelAllowed: boolean;
  swapAllowed: boolean;
  refillAllowed: boolean;
  shippingIncluded: boolean;
  laundryIncluded: boolean;
  damagePolicy?: string | null;
  lateFeePolicy?: string | null;
  stripePriceId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRentalSubscriptionPlanPayload = {
  name: string;
  price: number;
  currency?: string;
  itemCreditsPerCycle: number;
  cycle?: string;
  pauseAllowed?: boolean;
  cancelAllowed?: boolean;
  swapAllowed?: boolean;
  shippingIncluded?: boolean;
  laundryIncluded?: boolean;
  damagePolicy?: string;
  stripePriceId?: string | null;
};

export type UpdateRentalSubscriptionPlanPayload = {
  name?: string;
  price?: number;
  currency?: string;
  itemCreditsPerCycle?: number;
  cycle?: string;
  pauseAllowed?: boolean;
  cancelAllowed?: boolean;
  swapAllowed?: boolean;
  refillAllowed?: boolean;
  shippingIncluded?: boolean;
  laundryIncluded?: boolean;
  damagePolicy?: string | null;
  lateFeePolicy?: string | null;
  stripePriceId?: string | null;
  isActive?: boolean;
};

export type RentalOptions = {
  inventoryUnitStatuses: string[];
  inventoryConditions: string[];
  requestStatuses: string[];
  bookingStatuses: string[];
damageStatuses: RentalDamageStatus[];
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

function buildRentalDamageReportQuery(
  query?: RentalDamageReportQuery,
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

export async function getAdminLocationById(
  locationId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/locations/${encodeURIComponent(
      locationId,
    )}`,
  );

  return unwrapInventoryItem<AdminLocation>(
    response,
  );
}

export async function updateAdminLocation(
  locationId: string,
  payload: UpdateAdminLocationPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/locations/${encodeURIComponent(
      locationId,
    )}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<AdminLocation>(
    response,
  );
}

export async function deleteAdminLocation(
  locationId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/locations/${encodeURIComponent(
      locationId,
    )}`,
    {
      method: "DELETE",
    },
  );

  return unwrapInventoryItem<AdminLocation>(
    response,
  );
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

export async function createRentalDamageReport(
  payload: CreateRentalDamageReportPayload,
) {
  const response = await inventoryRequest<unknown>(
    "/admin/rental/damage-report",
    {
      method: "POST",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalDamageReport>(
    response,
  );
}

export async function getRentalDamageReports(
  query?: RentalDamageReportQuery,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/damage-reports${buildRentalDamageReportQuery(
      query,
    )}`,
  );

  return unwrapInventoryList<RentalDamageReport>(
    response,
  );
}

export async function getRentalDamageReportById(
  damageReportId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/damage-reports/${encodeURIComponent(
      damageReportId,
    )}`,
  );

  return unwrapInventoryItem<RentalDamageReport>(
    response,
  );
}

export async function updateRentalDamageReport(
  damageReportId: string,
  payload: UpdateRentalDamageReportPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/damage-reports/${encodeURIComponent(
      damageReportId,
    )}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalDamageReport>(
    response,
  );
}

export async function updateRentalDamageReportStatus(
  damageReportId: string,
  payload: UpdateRentalDamageStatusPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/damage-reports/${encodeURIComponent(
      damageReportId,
    )}/status`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalDamageReport>(
    response,
  );
}


export async function createRentalSubscriptionPlan(
  payload: CreateRentalSubscriptionPlanPayload,
) {
  const response = await inventoryRequest<unknown>(
    "/admin/rental/subscription-plan",
    {
      method: "POST",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalSubscriptionPlan>(
    response,
  );
}

export async function getRentalSubscriptionPlans() {
  const response = await inventoryRequest<unknown>(
    "/admin/rental/subscription-plan",
  );

  if (Array.isArray(response)) {
    return response as RentalSubscriptionPlan[];
  }

  if (
    response &&
    typeof response === "object"
  ) {
    const value = response as {
      data?: unknown;
    };

    if (Array.isArray(value.data)) {
      return value.data as RentalSubscriptionPlan[];
    }
  }

  return [];
}

export async function getRentalSubscriptionPlanById(
  planId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/subscription-plan/${encodeURIComponent(
      planId,
    )}`,
  );

  return unwrapInventoryItem<RentalSubscriptionPlan>(
    response,
  );
}

export async function updateRentalSubscriptionPlan(
  planId: string,
  payload: UpdateRentalSubscriptionPlanPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/subscription-plan/${encodeURIComponent(
      planId,
    )}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<RentalSubscriptionPlan>(
    response,
  );
}

export async function archiveRentalSubscriptionPlan(
  planId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/rental/subscription-plan/${encodeURIComponent(
      planId,
    )}`,
    {
      method: "DELETE",
    },
  );

  return unwrapInventoryItem<RentalSubscriptionPlan>(
    response,
  );
}

function buildSubscriptionAdminQuery(
  query:
    | SubscriptionAdminPlanQuery
    | CustomerSubscriptionListQuery,
) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (
    "billingInterval" in query &&
    query.billingInterval
  ) {
    params.set(
      "billingInterval",
      query.billingInterval,
    );
  }

  if ("customerId" in query && query.customerId) {
    params.set("customerId", query.customerId);
  }

  if ("planId" in query && query.planId) {
    params.set("planId", query.planId);
  }

  if ("from" in query && query.from) {
    params.set("from", query.from);
  }

  if ("to" in query && query.to) {
    params.set("to", query.to);
  }

  const value = params.toString();

  return value ? `?${value}` : "";
}

function parseSubscriptionListResponse<T>(
  response: unknown,
  label: string,
): {
  items: T[];
  meta: SubscriptionPaginationMeta;
} {
  if (
    !response ||
    typeof response !== "object"
  ) {
    throw new Error(`${label} response is invalid.`);
  }

  const value = response as {
    items?: unknown;
    meta?: Partial<SubscriptionPaginationMeta>;
  };

  if (!Array.isArray(value.items)) {
    throw new Error(
      `${label} response items are invalid.`,
    );
  }

  if (
    !value.meta ||
    typeof value.meta !== "object"
  ) {
    throw new Error(
      `${label} pagination response is invalid.`,
    );
  }

  return {
    items: value.items as T[],
    meta: {
      total: Number(value.meta.total || 0),
      page: Number(value.meta.page || 1),
      limit: Number(value.meta.limit || 20),
      totalPages: Number(
        value.meta.totalPages || 0,
      ),
    },
  };
}

export async function getSubscriptionAdminPlans(
  query: SubscriptionAdminPlanQuery = {},
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/plans${buildSubscriptionAdminQuery(
      query,
    )}`,
  );

  return parseSubscriptionListResponse<SubscriptionAdminPlan>(
    response,
    "Subscription plans",
  );
}

export async function getCustomerSubscriptions(
  query: CustomerSubscriptionListQuery = {},
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/customers${buildSubscriptionAdminQuery(
      query,
    )}`,
  );

  return parseSubscriptionListResponse<CustomerSubscription>(
    response,
    "Customer subscriptions",
  );
}

export async function getCustomerSubscriptionById(
  subscriptionId: string,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/customers/${encodeURIComponent(
      subscriptionId,
    )}`,
  );

  return unwrapInventoryItem<CustomerSubscription>(
    response,
  );
}

export async function createCustomerSubscription(
  payload: CreateCustomerSubscriptionPayload,
) {
  const response = await inventoryRequest<unknown>(
    "/admin/subscriptions/customers",
    {
      method: "POST",
      body: payload,
    },
  );

  return unwrapInventoryItem<CustomerSubscription>(
    response,
  );
}

export async function pauseCustomerSubscription(
  subscriptionId: string,
  payload: PauseCustomerSubscriptionPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/pause`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<CustomerSubscription>(
    response,
  );
}

export async function skipCustomerSubscriptionCycle(
  subscriptionId: string,
  payload: SkipCustomerSubscriptionPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/skip`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<CustomerSubscription>(
    response,
  );
}

export async function upgradeCustomerSubscription(
  subscriptionId: string,
  payload: UpgradeCustomerSubscriptionPayload,
) {
  const response = await inventoryRequest<unknown>(
    `/admin/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/upgrade`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  return unwrapInventoryItem<CustomerSubscription>(
    response,
  );
}

export async function retryCustomerSubscriptionBilling(
  payload: BillingRetryPayload,
) {
  const response = await inventoryRequest<unknown>(
    "/admin/subscriptions/billing-retry",
    {
      method: "POST",
      body: payload,
    },
  );

  return unwrapInventoryItem<CustomerSubscriptionBillingAttempt>(
    response,
  );
}


export async function forecastSubscriptionInventory(
  payload: SubscriptionInventoryForecastPayload,
) {
  const response = await inventoryRequest<unknown>(
    "/admin/subscriptions/inventory-forecast",
    {
      method: "POST",
      body: payload,
    },
  );

  return unwrapInventoryItem<SubscriptionInventoryForecast>(
    response,
  );
}
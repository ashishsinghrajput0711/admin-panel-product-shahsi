export type ProductCommerceType =
  | "SHOP"
  | "RENTAL"
  | "RESALE"
  | "MTO"
  | "SUBSCRIPTION";

export type ProductCommerceConfigPayload = {
  commerceTypes: ProductCommerceType[];
  defaultCommerceType: ProductCommerceType;
  mode: string;
  isSellable: boolean;
  isRentable: boolean;
  settings: {
    showCommerceTabs: boolean;
    defaultTab: ProductCommerceType;
    allowMixedCheckout: boolean;
  };
};

export type ProductShopConfigPayload = {
  allowCOD: boolean;
  allowReturns: boolean;
  returnWindowDays: number;
  extra: Record<string, unknown>;
};

export type ProductRentalConfigPayload = {
  enabled: boolean;
  dailyRentalEnabled: boolean;
  subscriptionRentalEnabled: boolean;
  dailyPrice: number;
  subscriptionPrice: number;
  securityDeposit: number;
  cleaningBufferDays: number;
  rentalCondition: string;
  extra: Record<string, unknown>;
};

export type ProductResaleConfigPayload = {
  enabled: boolean;
  resaleCondition: string;
  originalPrice: number;
  listingPrice: number;
  allowOffers: boolean;
  minOfferPrice: number;
  verificationStatus: string;
  extra: Record<string, unknown>;
};

export type ProductMtoConfigPayload = {
  enabled: boolean;
  allowCustomSizing: boolean;
  allowRushProduction: boolean;
  standardLeadTimeDays: number;
  rushLeadTimeDays: number;
  rushFee: number;
  customSizingFinalSale: boolean;
  productionType: string;
  extra: Record<string, unknown>;
};

export type ProductSubscriptionConfigPayload = {
  enabled: boolean;
  monthlyPrice: number;
  itemsPerMonth: number;
  swapLimit: number;
  allowedPlans: string[];
  extra: Record<string, unknown>;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | string[] | { message?: string | string[] };
  message?: string | string[];
};

function getErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.error)) return data.error.join(", ");
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    if (Array.isArray(data.error.message)) return data.error.message.join(", ");
    if (typeof data.error.message === "string") return data.error.message;
  }

  return fallback;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne valid JSON response nahi diya.");
  }
}

function getHeaders(token?: string | null) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function postProductCommerceConfig<TPayload>({
  apiRootUrl,
  productId,
  endpoint,
  payload,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  endpoint: string;
  payload: TPayload;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/products/${encodeURIComponent(productId)}/${endpoint}`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const json = await readJson<ApiResponse<unknown>>(response);

if (!response.ok || json.success === false) {
  throw new Error(
    getErrorMessage(
      json,
      `${endpoint} save failed: ${response.status} ${response.statusText}`,
    ),
  );
}

return json;
}

export function saveProductCommerceConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductCommerceConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "commerce-config",
  });
}

export function saveProductShopConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductShopConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "shop-config",
  });
}

export function saveProductRentalConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductRentalConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "rental-config",
  });
}

export function saveProductResaleConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductResaleConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "resale-config",
  });
}

export function saveProductMtoConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductMtoConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "mto-config",
  });
}

export function saveProductSubscriptionConfig(args: {
  apiRootUrl: string;
  productId: string;
  payload: ProductSubscriptionConfigPayload;
  token?: string | null;
}) {
  return postProductCommerceConfig({
    ...args,
    endpoint: "subscription-config",
  });
}

export type RentalPricingRule = {
  id: string;
  productId: string;
  minimumRentalDays: number;
  priceFor4Days: number;
  priceFor7Days: number;
  priceFor28Days: number;
  securityDeposit: number | null;
  lateFeePerDay: number | null;
  allowedInSubscription: boolean;
  monthlyCreditCost: number | null;
  premiumSurcharge: number | null;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id?: string;
    title?: string;
    sku?: string;
    slug?: string;
  } | null;
};

export type RentalPricingRulePayload = {
  productId: string;
  minimumRentalDays: number;
  priceFor4Days: number;
  priceFor7Days: number;
  priceFor28Days: number;
  securityDeposit?: number;
  lateFeePerDay?: number;
  allowedInSubscription?: boolean;
  monthlyCreditCost?: number;
  premiumSurcharge?: number;
};

type RentalPricingRuleListResponse = {
  data: RentalPricingRule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function isApiEnvelope(
  value: unknown,
): value is ApiResponse<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "success" in value,
  );
}

export async function getProductRentalPricingRule({
  apiRootUrl,
  productId,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  token?: string | null;
}) {
  const query = new URLSearchParams({
    page: "1",
    limit: "1",
    productId,
  });

  const response = await fetch(
    `${apiRootUrl}/admin/rental/pricing-rules?${query.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    },
  );

  const raw = await readJson<unknown>(response);

  if (
    !response.ok ||
    (isApiEnvelope(raw) && raw.success === false)
  ) {
    throw new Error(
      getErrorMessage(
        raw as ApiResponse<unknown>,
        `Rental pricing rule load failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  const payload = isApiEnvelope(raw)
    ? raw.data
    : raw;

  const listResponse =
    payload as RentalPricingRuleListResponse;

  if (
    !listResponse ||
    !Array.isArray(listResponse.data)
  ) {
    throw new Error(
      "Rental pricing rules API returned an invalid response.",
    );
  }

  return listResponse.data[0] || null;
}

export async function saveProductRentalPricingRule({
  apiRootUrl,
  payload,
  token,
}: {
  apiRootUrl: string;
  payload: RentalPricingRulePayload;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/rental/pricing-rule`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const raw = await readJson<unknown>(response);

  if (
    !response.ok ||
    (isApiEnvelope(raw) && raw.success === false)
  ) {
    throw new Error(
      getErrorMessage(
        raw as ApiResponse<unknown>,
        `Rental pricing rule save failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return isApiEnvelope(raw)
    ? (raw.data as RentalPricingRule | undefined)
    : (raw as RentalPricingRule);
}
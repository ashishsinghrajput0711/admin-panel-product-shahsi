function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

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
        `Pricing API failed: ${response.status}`,
    );
  }

  return data as T;
}

export type PricingRulePayload = {
  name: string;
  scope: "PRODUCT" | "VARIANT" | "CATEGORY" | "COLLECTION";
  scopeId: string;
  businessType: "SHAHSI" | "GOWNLOOP";
  commerceType: "RETAIL" | "MADE_TO_ORDER" | "RENTAL" | "RESALE";
  ruleType:
    | "BASE_PRICE"
    | "SALE_PRICE"
    | "RENTAL_PRICE"
    | "MTO_PRICE"
    | "RESALE_PRICE"
    | "SUBSCRIPTION_VALUE"
    | "RUSH_FEE"
    | "DEPOSIT"
    | "LATE_FEE"
    | "CLEANING_FEE"
    | "DAMAGE_FEE";
  currency: string;
  amount: number;
  compareAtAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  isTaxable?: boolean;
  taxCode?: string;
  minRentalDays?: number;
  maxRentalDays?: number;
  notes?: string;
};

export async function getPricingRules() {
  return adminRequest<any>("/admin/pricing/rules", {
    method: "GET",
  });
}

export async function getPricingRuleById(id: string) {
  return adminRequest<any>(`/admin/pricing/rules/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function createPricingRule(payload: PricingRulePayload) {
  return adminRequest<any>("/admin/pricing/rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePricingRule(
  id: string,
  payload: Partial<PricingRulePayload>,
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

export async function updateProductPricing(productId: string, payload: any) {
  return adminRequest<any>(
    `/admin/catalog/${encodeURIComponent(productId)}/pricing`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function simulatePricing(payload: any) {
  return adminRequest<any>("/admin/pricing/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
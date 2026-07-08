function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getApiError(data: any, fallback: string) {
  return data?.message || data?.error?.message || data?.error || fallback;
}

export type CatalogFitRuleType =
  | "SILHOUETTE"
  | "FIT_TYPE"
  | "BODY_TYPE"
  | "STRETCH_LEVEL"
  | "SIZE_CHART"
  | "CUSTOM";

export type CatalogFitRule = {
  id: string;
  name: string;
  ruleType: CatalogFitRuleType | string;
  conditions: Record<string, unknown>;
  effect: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CatalogFitRulesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  ruleType?: string;
  isActive?: boolean | string;
};

export type CatalogFitRulesResponse = {
  items: CatalogFitRule[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type CatalogFitRulePayload = {
  name: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  effect: Record<string, unknown>;
  priority: number;
  isActive: boolean;
};

function buildQuery(params: CatalogFitRulesListParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export async function getCatalogFitRules(
  params: CatalogFitRulesListParams = {},
) {
  const query = buildQuery(params);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-rules${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rules load failed: ${response.status}`),
    );
  }

  return (data?.data || data) as CatalogFitRulesResponse;
}

export async function createCatalogFitRule(payload: CatalogFitRulePayload) {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/fit-rules`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rule create failed: ${response.status}`),
    );
  }

  return data?.data || data;
}

export async function updateCatalogFitRule(
  id: string,
  payload: CatalogFitRulePayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-rules/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rule update failed: ${response.status}`),
    );
  }

  return data?.data || data;
}

export async function deleteCatalogFitRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-rules/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rule delete failed: ${response.status}`),
    );
  }

  return data?.data || data;
}

export async function activateCatalogFitRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-rules/${encodeURIComponent(id)}/activate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rule activate failed: ${response.status}`),
    );
  }

  return data?.data || data;
}

export async function deactivateCatalogFitRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-rules/${encodeURIComponent(id)}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Fit rule deactivate failed: ${response.status}`),
    );
  }

  return data?.data || data;
}
function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  return rawUrl.replace(/\/$/, "").replace(/\/admin\/catalog$/, "");
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

async function adminSearchRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${getApiRootUrl()}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const data = text.trim() ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Search admin request failed: ${response.status}`;

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message),
    );
  }

  return data as T;
}

export type SearchAdminStatus = "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";

export type SearchSynonymRule = {
  id: string;
  term: string;
  synonyms: string[];
  status: SearchAdminStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SearchBoostRule = {
  id: string;
  name: string;
  targetType: "PRODUCT" | "CATEGORY" | "COLLECTION" | "BRAND" | "TAG";
  targetId: string;
  query?: string | null;
  boostValue: number;
  status: SearchAdminStatus;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type SearchFilterConfig = {
  id: string;
  context: string;
  filters: SearchFilterItem[];
};

export type SearchFilterItem = {
  key: string;
  label: string;
  type: "MULTI_SELECT" | "SINGLE_SELECT" | "RANGE" | "BOOLEAN";
  source:
    | "CATEGORY"
    | "PRICE"
    | "VARIANT_OPTION"
    | "ATTRIBUTE"
    | "BRAND"
    | "TAG"
    | "COLLECTION";
  enabled: boolean;
  position: number;
};

export type SearchNoResultRule = {
  id: string;
  query: string;
  redirectType: "PRODUCT" | "CATEGORY" | "COLLECTION" | "SEARCH";
  redirectTargetId: string;
  message?: string | null;
  status: SearchAdminStatus;
};

export function getSearchSynonyms() {
  return adminSearchRequest<{ success?: boolean; data?: SearchSynonymRule[] }>(
    "/search/admin/synonyms",
  );
}

export function createSearchSynonym(body: {
  term: string;
  synonyms: string[];
  status: SearchAdminStatus;
}) {
  return adminSearchRequest("/search/admin/synonyms", {
    method: "POST",
    body,
  });
}

export function updateSearchSynonym(
  id: string,
  body: Partial<{
    term: string;
    synonyms: string[];
    status: SearchAdminStatus;
  }>,
) {
  return adminSearchRequest(`/search/admin/synonyms/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteSearchSynonym(id: string) {
  return adminSearchRequest(`/search/admin/synonyms/${id}`, {
    method: "DELETE",
  });
}

export function getSearchBoostRules() {
  return adminSearchRequest<{ success?: boolean; data?: SearchBoostRule[] }>(
    "/search/admin/boost-rules",
  );
}

export function createSearchBoostRule(body: {
  name: string;
  targetType: SearchBoostRule["targetType"];
  targetId: string;
  query?: string;
  boostValue: number;
  status: SearchAdminStatus;
  startsAt?: string;
  endsAt?: string;
}) {
  return adminSearchRequest("/search/admin/boost-rules", {
    method: "POST",
    body,
  });
}

export function updateSearchBoostRule(
  id: string,
  body: Partial<SearchBoostRule>,
) {
  return adminSearchRequest(`/search/admin/boost-rules/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteSearchBoostRule(id: string) {
  return adminSearchRequest(`/search/admin/boost-rules/${id}`, {
    method: "DELETE",
  });
}

export function getSearchFilterConfig(context = "products") {
  const params = new URLSearchParams();

  if (context) {
    params.set("context", context);
  }

  return adminSearchRequest<{
    success?: boolean;
    data?: SearchFilterConfig[] | SearchFilterConfig;
  }>(`/search/admin/filter-config?${params.toString()}`);
}

export function saveSearchFilterConfig(body: {
  context: string;
  filters: SearchFilterItem[];
}) {
  return adminSearchRequest("/search/admin/filter-config", {
    method: "POST",
    body,
  });
}

export function updateSearchFilterConfig(
  id: string,
  body: {
    context: string;
    filters: SearchFilterItem[];
  },
) {
  return adminSearchRequest(`/search/admin/filter-config/${id}`, {
    method: "PATCH",
    body,
  });
}

export function reorderSearchFilters(body: {
  context: string;
  filters: Array<{
    key: string;
    position: number;
  }>;
}) {
  return adminSearchRequest("/search/admin/filter-config/reorder", {
    method: "PATCH",
    body,
  });
}

export function triggerSearchReindex(body: {
  scope: "ALL" | "PRODUCTS" | "CATEGORIES" | "COLLECTIONS";
}) {
  return adminSearchRequest("/search/admin/reindex", {
    method: "POST",
    body,
  });
}

export function reindexSelectedProducts(body: {
  productIds: string[];
}) {
  return adminSearchRequest("/search/admin/reindex/products", {
    method: "POST",
    body,
  });
}

export function getSearchReindexJobs() {
  return adminSearchRequest("/search/admin/reindex/jobs");
}

export function getSearchAnalytics() {
  return adminSearchRequest("/search/analytics");
}

export function getSearchNoResultRules() {
  return adminSearchRequest<{ success?: boolean; data?: SearchNoResultRule[] }>(
    "/search/admin/no-result-rules",
  );
}

export function createSearchNoResultRule(body: {
  query: string;
  redirectType: SearchNoResultRule["redirectType"];
  redirectTargetId: string;
  message?: string;
  status: SearchAdminStatus;
}) {
  return adminSearchRequest("/search/admin/no-result-rules", {
    method: "POST",
    body,
  });
}

export function updateSearchNoResultRule(
  id: string,
  body: Partial<SearchNoResultRule>,
) {
  return adminSearchRequest(`/search/admin/no-result-rules/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteSearchNoResultRule(id: string) {
  return adminSearchRequest(`/search/admin/no-result-rules/${id}`, {
    method: "DELETE",
  });
}
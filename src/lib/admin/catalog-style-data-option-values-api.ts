export type CatalogStyleDataOptionStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type CatalogStyleDataOptionValue = {
  id: string;
  group: string;
  value: string;
  label: string;
  description: string | null;
  status: CatalogStyleDataOptionStatus;
  position: number;

  usageCount: number;
  styleDataUsageCount: number;
  styleRuleUsageCount: number;

  createdBy: string | null;
  updatedBy: string | null;
  activatedBy: string | null;
  deactivatedBy: string | null;
  archivedBy: string | null;
  restoredBy: string | null;

  activatedAt: string | null;
  deactivatedAt: string | null;
  archivedAt: string | null;
  restoredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogStyleDataOptionValuesListResponse = {
  items: CatalogStyleDataOptionValue[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  supportedGroups: string[];
  statuses: CatalogStyleDataOptionStatus[];
};

export type CatalogStyleDataOptionValuesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  group?: string;
  status?: CatalogStyleDataOptionStatus | "";
};

export type CreateCatalogStyleDataOptionValuePayload = {
  group: string;
  value: string;
  label: string;
  description?: string;
  position?: number;
};

export type UpdateCatalogStyleDataOptionValuePayload = {
  label?: string;
  description?: string;
  position?: number;
};

export type ReorderCatalogStyleDataOptionValuesPayload = {
  group: string;
  items: Array<{
    id: string;
    position: number;
  }>;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | null;
  message?: string | string[];
};

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

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getApiError(data: unknown, fallback: string) {
  const response = data as ApiResponse<unknown>;

  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }

  if (typeof response?.message === "string") {
    return response.message;
  }

  if (typeof response?.error === "string") {
    return response.error;
  }

  return fallback;
}

function unwrapData<T>(data: ApiResponse<T> | T | null, fallback: T): T {
  if (!data) return fallback;

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    (data as ApiResponse<T>).data !== undefined
  ) {
    return (data as ApiResponse<T>).data as T;
  }

  return data as T;
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value?: unknown,
) {
  if (value === undefined || value === null || value === "") return;

  const text = String(value).trim();

  if (!text) return;

  params.set(key, text);
}

export async function getCatalogStyleDataOptionValues(
  params: CatalogStyleDataOptionValuesListParams = {},
) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 1);
  appendParam(searchParams, "limit", params.limit ?? 20);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "group", params.group);
  appendParam(searchParams, "status", params.status);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values?${searchParams.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json =
    await parseJson<
      ApiResponse<CatalogStyleDataOptionValuesListResponse>
    >(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option values load failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValuesListResponse>(json, {
    items: [],
    meta: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
    supportedGroups: [],
    statuses: [],
  });
}

export async function getCatalogStyleDataOptionValue(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values/${encodeURIComponent(
      id,
    )}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleDataOptionValue>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option value load failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValue>(
    json,
    {} as CatalogStyleDataOptionValue,
  );
}

export async function createCatalogStyleDataOptionValue(
  payload: CreateCatalogStyleDataOptionValuePayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleDataOptionValue>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option value create failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValue>(
    json,
    {} as CatalogStyleDataOptionValue,
  );
}

export async function updateCatalogStyleDataOptionValue(
  id: string,
  payload: UpdateCatalogStyleDataOptionValuePayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values/${encodeURIComponent(
      id,
    )}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleDataOptionValue>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option value update failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValue>(
    json,
    {} as CatalogStyleDataOptionValue,
  );
}

async function updateOptionStatus(
  id: string,
  action: "activate" | "deactivate" | "archive" | "restore",
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values/${encodeURIComponent(
      id,
    )}/${action}`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleDataOptionValue>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option ${action} failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValue>(
    json,
    {} as CatalogStyleDataOptionValue,
  );
}

export async function activateCatalogStyleDataOptionValue(id: string) {
  return updateOptionStatus(id, "activate");
}

export async function deactivateCatalogStyleDataOptionValue(id: string) {
  return updateOptionStatus(id, "deactivate");
}

export async function archiveCatalogStyleDataOptionValue(id: string) {
  return updateOptionStatus(id, "archive");
}

export async function restoreCatalogStyleDataOptionValue(id: string) {
  return updateOptionStatus(id, "restore");
}

export async function deleteCatalogStyleDataOptionValue(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values/${encodeURIComponent(
      id,
    )}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<unknown>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option value delete failed: ${response.status}`,
      ),
    );
  }

  return json?.data ?? null;
}

export async function reorderCatalogStyleDataOptionValues(
  payload: ReorderCatalogStyleDataOptionValuesPayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/option-values/reorder`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleDataOptionValue[]>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style Data option reorder failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleDataOptionValue[]>(json, []);
}
import type {
  BulkPublishingResult,
  CatalogLifecycleStatus,
  CatalogPublicationStatus,
  PublishProductPayload,
  PublishingActionPayload,
  PublishingActionResult,
  PublishingListParams,
  PublishingListResult,
  PublishingRecord,
  PublishingRelations,
  PublishingStatusHistory,
  PublishingSummary,
  PublishingValidationResult,
} from "@/components/admin/catalog/publishing/publishing-types";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | null;
  message?: string | string[];
};

type ActualCatalogListData = {
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  products?: PublishingRecord[];
};

type DocumentedCatalogListData = {
  items?: PublishingRecord[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export class CatalogPublishingApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "CatalogPublishingApiError";
    this.status = status;
    this.data = data;
  }
}

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

function unwrapData<T>(response: ApiResponse<T> | T | null): T | null {
  if (!response) return null;

  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return (response as ApiResponse<T>).data ?? null;
  }

  return response as T;
}

function getNestedMessages(data: unknown) {
  if (!data || typeof data !== "object") return [];

  const candidate = data as {
    errors?: Array<{ message?: unknown }>;
    validationErrors?: Array<{ message?: unknown }>;
    data?: {
      errors?: Array<{ message?: unknown }>;
      validationErrors?: Array<{ message?: unknown }>;
    };
  };

  const collections = [
    candidate.errors,
    candidate.validationErrors,
    candidate.data?.errors,
    candidate.data?.validationErrors,
  ];

  return collections
    .flatMap((collection) => collection ?? [])
    .map((item) =>
      typeof item?.message === "string" ? item.message.trim() : "",
    )
    .filter(Boolean);
}

function getApiError(data: unknown, fallback: string) {
  const response = data as ApiResponse<unknown> | null;

  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }

  if (typeof response?.message === "string") {
    return response.message;
  }

  const nestedMessages = getNestedMessages(data);

  if (nestedMessages.length > 0) {
    return nestedMessages.join(" ");
  }

  if (typeof response?.error === "string") {
    return response.error;
  }

  return fallback;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiRootUrl()}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = await parseJson<ApiResponse<T> | T>(response);

  if (!response.ok) {
    throw new CatalogPublishingApiError(
      getApiError(json, `Publishing API request failed: ${response.status}`),
      response.status,
      json,
    );
  }

  const data = unwrapData<T>(json);

  if (data === null) {
    throw new CatalogPublishingApiError(
      "Publishing API ne empty response return kiya.",
      response.status,
      json,
    );
  }

  return data;
}

function appendParam(
  searchParams: URLSearchParams,
  key: string,
  value: unknown,
) {
  if (value === undefined || value === null || value === "") return;

  const text = String(value).trim();

  if (!text) return;

  searchParams.set(key, text);
}

export async function getCatalogPublishingProducts(
  params: PublishingListParams,
): Promise<PublishingListResult> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 1);
  appendParam(searchParams, "limit", params.limit ?? 20);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "status", params.status);
  appendParam(
    searchParams,
    "publicationStatus",
    params.publicationStatus,
  );
  appendParam(searchParams, "businessType", params.businessType);
  appendParam(searchParams, "productType", params.productType);
  appendParam(searchParams, "brand", params.brand);
  appendParam(searchParams, "categoryId", params.categoryId);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog?${searchParams.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseJson<
    ApiResponse<ActualCatalogListData | DocumentedCatalogListData>
  >(response);

  if (!response.ok) {
    throw new CatalogPublishingApiError(
      getApiError(json, `Catalog list load failed: ${response.status}`),
      response.status,
      json,
    );
  }

  const data = unwrapData<
    ActualCatalogListData | DocumentedCatalogListData
  >(json);

  if (!data) {
    return {
      products: [],
      meta: {
        count: 0,
        total: 0,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: 0,
      },
    };
  }

  if ("products" in data && Array.isArray(data.products)) {
    return {
      products: data.products,
      meta: {
        count: data.count ?? data.products.length,
        total: data.total ?? data.products.length,
        page: data.page ?? params.page ?? 1,
        limit: data.limit ?? params.limit ?? 20,
        totalPages: data.totalPages ?? 1,
      },
    };
  }

  const documented = data as DocumentedCatalogListData;
  const items = Array.isArray(documented.items) ? documented.items : [];

  return {
    products: items,
    meta: {
      count: items.length,
      total: documented.meta?.total ?? items.length,
      page: documented.meta?.page ?? params.page ?? 1,
      limit: documented.meta?.limit ?? params.limit ?? 20,
      totalPages: documented.meta?.totalPages ?? 1,
    },
  };
}

export function getCatalogPublishingSummary() {
  return apiRequest<PublishingSummary>(
    "/admin/catalog/stats/summary",
    {
      method: "GET",
    },
  );
}

export function getCatalogPublishingValidationErrors(
  productId?: string,
) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "productId", productId);

  const query = searchParams.toString();

  return apiRequest<PublishingValidationResult>(
    `/admin/catalog/validation-errors${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );
}

export function publishCatalogProduct(
  id: string,
  payload: PublishProductPayload,
) {
  return apiRequest<PublishingActionResult>(
    `/admin/catalog/${encodeURIComponent(id)}/publish`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function unpublishCatalogProduct(
  id: string,
  payload: PublishingActionPayload,
) {
  return apiRequest<PublishingActionResult>(
    `/admin/catalog/${encodeURIComponent(id)}/unpublish`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function bulkPublishCatalogProducts(payload: {
  ids: string[];
  publishedAt: string;
  reason: string;
}) {
  return apiRequest<BulkPublishingResult>(
    "/admin/catalog/bulk/publish",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function bulkUnpublishCatalogProducts(payload: {
  ids: string[];
  reason: string;
}) {
  return apiRequest<BulkPublishingResult>(
    "/admin/catalog/bulk/unpublish",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getCatalogProductStatusHistory(id: string) {
  return apiRequest<PublishingStatusHistory>(
    `/admin/catalog/${encodeURIComponent(id)}/status-history`,
    {
      method: "GET",
    },
  );
}

export function getCatalogProductPublishingRelations(id: string) {
  return apiRequest<PublishingRelations>(
    `/admin/catalog/${encodeURIComponent(id)}/relations`,
    {
      method: "GET",
    },
  );
}

export type CatalogPublishingListQuery = {
  status?: CatalogLifecycleStatus | "";
  publicationStatus?: CatalogPublicationStatus | "";
};
import type {
  CatalogStyleDataOptions,
  StyleData,
  StyleDataListResponse,
  StyleDataScope,
  StyleDataStatus,
  BusinessType,
} from "@/components/admin/catalog/style-data/style-data-types";
import type { StyleDataFormValues } from "@/components/admin/catalog/style-data/style-data-schema";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | null;
  message?: string;
};

type ApiErrorShape = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export type CatalogStyleDataListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StyleDataStatus | "";
  scope?: StyleDataScope | "";
  businessType?: BusinessType | "";
  occasion?: string;
  modestyLevel?: string;
  colorFamily?: string;
  fabricFeel?: string;
  neckline?: string;
  sleeveType?: string;
  silhouette?: string;
  season?: string;
  productId?: string;
  variantId?: string;
};

export type CatalogStyleDataBulkAction = {
  ids: string[];
  action: "ARCHIVE" | "RESTORE" | "DELETE" | "ACTIVATE" | "DEACTIVATE";
};

export type CatalogStyleDataBulkUploadResult = {
  importedCount?: number;
  updatedCount?: number;
  createdCount?: number;
  failedCount?: number;
  errors?: Array<{
    row?: number;
    productSku?: string;
    productId?: string;
    message?: string;
  }>;
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

function getHeaders(token?: string | null): HeadersInit {
  const cleanToken = token ?? getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
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
  const response = data as ApiResponse<unknown> & ApiErrorShape;

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

function appendParam(params: URLSearchParams, key: string, value?: unknown) {
  if (value === undefined || value === null || value === "") return;

  const text = String(value).trim();

  if (!text) return;

  params.set(key, text);
}

export async function getCatalogStyleDataOptions() {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-data/options`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  const json = await parseJson<ApiResponse<CatalogStyleDataOptions>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data options load failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleDataOptions>(json, {
    status: [],
    scope: [],
    businessType: [],
    occasion: [],
    colorFamily: [],
    fabricFeel: [],
    neckline: [],
    sleeveType: [],
    silhouette: [],
    modestyLevel: [],
    season: [],
  });
}

export async function getCatalogStyleData(params: CatalogStyleDataListParams = {}) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 1);
  appendParam(searchParams, "limit", params.limit ?? 20);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "scope", params.scope);
  appendParam(searchParams, "businessType", params.businessType);
  appendParam(searchParams, "occasion", params.occasion);
  appendParam(searchParams, "modestyLevel", params.modestyLevel);
  appendParam(searchParams, "colorFamily", params.colorFamily);
  appendParam(searchParams, "fabricFeel", params.fabricFeel);
  appendParam(searchParams, "neckline", params.neckline);
  appendParam(searchParams, "sleeveType", params.sleeveType);
  appendParam(searchParams, "silhouette", params.silhouette);
  appendParam(searchParams, "season", params.season);
  appendParam(searchParams, "productId", params.productId);
  appendParam(searchParams, "variantId", params.variantId);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data?${searchParams.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseJson<ApiResponse<StyleDataListResponse>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data list load failed: ${response.status}`),
    );
  }

  return unwrapData<StyleDataListResponse>(json, {
    items: [],
    meta: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
    summary: {
      total: 0,
      active: 0,
      draft: 0,
      inactive: 0,
      archived: 0,
    },
  });
}

export async function getCatalogStyleDataById(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseJson<ApiResponse<StyleData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data detail load failed: ${response.status}`),
    );
  }

  return unwrapData<StyleData>(json, {} as StyleData);
}

function buildStyleDataPayload(values: StyleDataFormValues) {
  const payload: Record<string, unknown> = {
    productId: values.productId,
    scope: values.scope,
    businessType: values.businessType,
    status: values.status,
    occasion: values.occasion,
    colorFamily: values.colorFamily,
    fabricFeel: values.fabricFeel,
    neckline: values.neckline,
    sleeveType: values.sleeveType,
    silhouette: values.silhouette,
    modestyLevel: values.modestyLevel,
    season: values.season,
    tags: values.tags,
    stylingKeywords: values.stylingKeywords,
    aiStylingNotes: values.aiStylingNotes || "",
  };

  if (values.scope === "VARIANT" && values.variantId?.trim()) {
    payload.variantId = values.variantId.trim();
  }

  return payload;
}

export async function createCatalogStyleData(values: StyleDataFormValues) {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-data`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(buildStyleDataPayload(values)),
  });

  const json = await parseJson<ApiResponse<StyleData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data create failed: ${response.status}`),
    );
  }

  return unwrapData<StyleData>(json, {} as StyleData);
}

export async function updateCatalogStyleData(
  id: string,
  values: StyleDataFormValues,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(buildStyleDataPayload(values)),
    },
  );

  const json = await parseJson<ApiResponse<StyleData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data update failed: ${response.status}`),
    );
  }

  return unwrapData<StyleData>(json, {} as StyleData);
}

export async function archiveCatalogStyleData(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/${encodeURIComponent(id)}/archive`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<StyleData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data archive failed: ${response.status}`),
    );
  }

  return unwrapData<StyleData>(json, {} as StyleData);
}

export async function restoreCatalogStyleData(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/${encodeURIComponent(id)}/restore`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<StyleData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data restore failed: ${response.status}`),
    );
  }

  return unwrapData<StyleData>(json, {} as StyleData);
}

export async function deleteCatalogStyleData(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<{ id?: string }>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data delete failed: ${response.status}`),
    );
  }

  return unwrapData<{ id?: string }>(json, { id });
}

export async function bulkActionCatalogStyleData(action: CatalogStyleDataBulkAction) {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-data/bulk`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(action),
  });

  const json = await parseJson<ApiResponse<unknown>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style data bulk action failed: ${response.status}`),
    );
  }

  return json;
}

export async function downloadCatalogStyleDataTemplate() {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-data/template`, {
    method: "GET",
    headers: {
      Accept: "text/csv, application/octet-stream, */*",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  if (!response.ok) {
    const json = await parseJson<ApiResponse<unknown>>(response);
    throw new Error(
      getApiError(json, `Template download failed: ${response.status}`),
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "style-data-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function exportCatalogStyleData(params: CatalogStyleDataListParams = {}) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 1);
  appendParam(searchParams, "limit", params.limit ?? 20);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "scope", params.scope);
  appendParam(searchParams, "businessType", params.businessType);
  appendParam(searchParams, "occasion", params.occasion);
  appendParam(searchParams, "modestyLevel", params.modestyLevel);
  appendParam(searchParams, "colorFamily", params.colorFamily);
  appendParam(searchParams, "fabricFeel", params.fabricFeel);
  appendParam(searchParams, "neckline", params.neckline);
  appendParam(searchParams, "sleeveType", params.sleeveType);
  appendParam(searchParams, "silhouette", params.silhouette);
  appendParam(searchParams, "season", params.season);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-data/export?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "text/csv, application/octet-stream, */*",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    },
  );

  if (!response.ok) {
    const json = await parseJson<ApiResponse<unknown>>(response);
    throw new Error(getApiError(json, `Export failed: ${response.status}`));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "style-data-export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function bulkUploadCatalogStyleData(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-data/bulk-upload`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
  });

  const json = await parseJson<ApiResponse<CatalogStyleDataBulkUploadResult>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Bulk upload failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleDataBulkUploadResult>(json, {});
}
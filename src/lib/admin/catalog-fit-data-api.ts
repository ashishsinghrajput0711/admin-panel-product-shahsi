export type FitDataStatus = "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";
export type FitDataScope = "PRODUCT" | "VARIANT";

export type CatalogFitDataItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  productSku?: string | null;
  productImage?: string | null;
  businessType?: string | null;
  scope?: FitDataScope | string | null;
  fitType?: string | null;
  silhouette?: string | null;
  lengthType?: string | null;
  stretchLevel?: string | null;
  supportLevel?: string | null;
  hasSizeChart?: boolean;
  sizeChartCount?: number;
  alterationAllowed?: boolean;
  customSizingAvailable?: boolean;
  recommendedForBodyTypes?: string[];
  notRecommendedForBodyTypes?: string[];
  status?: FitDataStatus | string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CatalogFitDataSummary = {
  totalRecords: number;
  activeRecords: number;
  draftRecords: number;
  inactiveRecords: number;
  archivedRecords: number;
  missingFitDataProducts: number;
  productsWithSizeChart: number;
  productsWithoutSizeChart: number;
};

export type CatalogFitDataPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CatalogFitDataListResponse = {
  items: CatalogFitDataItem[];
  pagination: CatalogFitDataPagination;
  summary: CatalogFitDataSummary;
};

export type CatalogFitDataListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  scope?: string;
  businessType?: string;
  fitType?: string;
  stretchLevel?: string;
  silhouette?: string;
  hasSizeChart?: boolean | "";
  alterationAllowed?: boolean | "";
  customSizingAvailable?: boolean | "";
  missingFitData?: boolean | "";
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "";
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | string[] | { message?: string | string[] } | null;
  message?: string | string[];
};

function getApiRootUrl() {
  return "/api/proxy";
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

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne valid JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
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

function unwrapData<T>(json: ApiResponse<T> | T): T {
  if (json && typeof json === "object" && "data" in json) {
    return (json as ApiResponse<T>).data as T;
  }

  return json as T;
}

function buildQuery(params: CatalogFitDataListParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export async function getCatalogFitData(
  params: CatalogFitDataListParams = {},
) {
  const query = buildQuery({
    page: 1,
    limit: 20,
    ...params,
  });

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data${query}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<
    ApiResponse<CatalogFitDataListResponse> | CatalogFitDataListResponse
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Fit data fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData<CatalogFitDataListResponse>(json);
}

export async function archiveCatalogFitData(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/${encodeURIComponent(id)}/archive`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<unknown>>(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Fit data archive failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData(json);
}

export async function restoreCatalogFitData(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/${encodeURIComponent(id)}/restore`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<unknown>>(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Fit data restore failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData(json);
}

export function getCatalogFitDataTemplateUrl() {
  return `${getApiRootUrl()}/admin/catalog/fit-data/template`;
}












export type ProductFitDataPayload = {
  productId?: string;
  scope?: "PRODUCT" | "VARIANT";
  variantId?: string | null;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";
  fitType: string;
  silhouette: string;
  lengthType: string;
  stretchLevel: string;
  supportLevel: string;
  closureType: string;
  neckline: string;
  sleeveLength: string;
  waistline: string;
  fitNotes: string;
  sizeRecommendationNote: string;
  modelInfo: {
    height: string;
    wearingSize: string;
    bust: number | null;
    waist: number | null;
    hips: number | null;
  };
  measurementGuide: {
    bust: string;
    waist: string;
    hips: string;
    length: string;
  };
  sizeChart: Array<{
    size: string;
    bust: number | null;
    waist: number | null;
    hips: number | null;
    length: number | null;
  }>;
  alterationAllowed: boolean;
  customSizingAvailable: boolean;
  recommendedForBodyTypes: string[];
  notRecommendedForBodyTypes: string[];
  isActive: boolean;
};

export type CatalogFitDataDetail = {
  id?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  productSku?: string;
  productImage?: string;
  businessType?: string;
  scope?: "PRODUCT" | "VARIANT" | string;
  variantId?: string | null;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED" | string;
  fitData?: ProductFitDataPayload | null;
} & Partial<ProductFitDataPayload>;

function normalizeFitDataDetail(raw: any): CatalogFitDataDetail {
  const data = unwrapData<any>(raw);

  const product = data?.product || null;

  if (data?.fitData) {
    return {
      ...data,
      ...data.fitData,
      fitData: data.fitData,
      productId: data.productId || data.fitData.productId || product?.id,
      productName: data.productName || product?.name,
      productSlug: data.productSlug || product?.slug,
      productSku: data.productSku || product?.sku,
      productImage: data.productImage || product?.image,
      businessType: data.businessType || product?.businessType,
      scope: data.scope || data.fitData.scope || "PRODUCT",
      variantId: data.variantId || data.fitData.variantId || null,
      status: data.status || data.fitData.status || "ACTIVE",
    };
  }

  return {
    ...data,
    productName: data?.productName || product?.name,
    productSlug: data?.productSlug || product?.slug,
    productSku: data?.productSku || product?.sku,
    productImage: data?.productImage || product?.image,
    businessType: data?.businessType || product?.businessType,
  } as CatalogFitDataDetail;
}

export async function getCatalogFitDataById(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<CatalogFitDataDetail> | CatalogFitDataDetail>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Fit data detail fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return normalizeFitDataDetail(json);
}

export async function createCatalogFitData(payload: ProductFitDataPayload) {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/fit-data`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await parseJson<ApiResponse<CatalogFitDataDetail> | CatalogFitDataDetail>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Fit data create failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return normalizeFitDataDetail(json);
}

export async function updateCatalogFitData(
  id: string,
  payload: ProductFitDataPayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json = await parseJson<ApiResponse<CatalogFitDataDetail> | CatalogFitDataDetail>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Fit data update failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return normalizeFitDataDetail(json);
}


export type CatalogProductPickerItem = {
  id: string;
  name: string;
  sku?: string | null;
  slug?: string | null;
  image?: string | null;
  hasFitData?: boolean;
};

export type CatalogProductPickerResponse = {
  items: CatalogProductPickerItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getCatalogProductsPicker({
  search = "",
  page = 1,
  limit = 50,
}: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = buildQuery({
    page,
    limit,
    search: search.trim() || undefined,
  });

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/products/picker${query}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<
    ApiResponse<CatalogProductPickerResponse> | CatalogProductPickerResponse
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Product picker fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData<CatalogProductPickerResponse>(json);
}


export async function downloadCatalogFitDataTemplate() {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/template`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const json = await parseJson<ApiResponse<unknown>>(response);

    throw new Error(
      getApiErrorMessage(
        json,
        `Template download failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    filename: match?.[1] || "fit-data-template.csv",
  };
}





export type CatalogFitDataBulkUploadResult = {
  importedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  failedCount?: number;
  errors?: Array<{
    row?: number;
    productSku?: string;
    productId?: string;
    message?: string;
  }>;
};

export async function bulkUploadCatalogFitData(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/bulk-upload`,
    {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        data?.error ||
        `Bulk upload failed: ${response.status}`,
    );
  }

  return data?.data || data;
}


export async function exportCatalogFitDataRecords(
  params: CatalogFitDataListParams = {},
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const token = getToken();

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/fit-data/export${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`,
    {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.message ||
        data?.error?.message ||
        data?.error ||
        `Fit data export failed: ${response.status}`,
    );
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);

  const fileName =
    match?.[1] ||
    `fit-data-records-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
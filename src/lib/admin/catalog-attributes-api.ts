import type {
  Attribute,
  AttributeFiltersState,
} from "@/components/admin/catalog/attributes/attribute-types";

export type AttributePagination = {
  total: number;
  page: number;
  limit: number | null;
  totalPages: number;
};

type PaginationShape = {
  total?: number;
  count?: number;
  totalItems?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  pageSize?: number;
  perPage?: number;
  totalPages?: number;
  pages?: number;
};

type AttributesResponse = {
  success?: boolean;
  data?:
    | Attribute[]
    | {
        data?: Attribute[];
        attributes?: Attribute[];
        items?: Attribute[];
        total?: number;
        count?: number;
        totalItems?: number;
        totalCount?: number;
        page?: number;
        currentPage?: number;
        limit?: number;
        pageSize?: number;
        perPage?: number;
        totalPages?: number;
        pages?: number;
        meta?: PaginationShape;
        pagination?: PaginationShape;
      };
  attributes?: Attribute[];
  items?: Attribute[];
  total?: number;
  count?: number;
  totalItems?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  pageSize?: number;
  perPage?: number;
  totalPages?: number;
  pages?: number;
  meta?: PaginationShape;
  pagination?: PaginationShape;
  message?: string | string[];
  error?: unknown;
};

export type FetchAttributesParams = {
  page?: number;
  limit?: number;
  filters?: AttributeFiltersState;
};

export type FetchAttributesResult = {
  attributes: Attribute[];
  pagination: AttributePagination;
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
    "Content-Type": "application/json",
    Accept: "*/*",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const shortText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    throw new Error(
      `${fallbackMessage}. Server ne JSON ke jagah HTML/text return kiya. Status: ${response.status}. Response: ${shortText}`,
    );
  }
}

function getApiErrorMessage(data: AttributesResponse, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (Array.isArray(record.message)) {
      return record.message.join(", ");
    }

    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return fallback;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getPaginationFromSource(
  response: AttributesResponse,
  nested?: AttributesResponse["data"],
) {
  const nestedObject =
    nested && !Array.isArray(nested) && typeof nested === "object"
      ? nested
      : undefined;

  const totalValue =
    nestedObject?.total ??
    nestedObject?.count ??
    nestedObject?.totalItems ??
    nestedObject?.totalCount ??
    nestedObject?.meta?.total ??
    nestedObject?.meta?.count ??
    nestedObject?.meta?.totalItems ??
    nestedObject?.meta?.totalCount ??
    nestedObject?.pagination?.total ??
    nestedObject?.pagination?.count ??
    nestedObject?.pagination?.totalItems ??
    nestedObject?.pagination?.totalCount ??
    response.total ??
    response.count ??
    response.totalItems ??
    response.totalCount ??
    response.meta?.total ??
    response.meta?.count ??
    response.meta?.totalItems ??
    response.meta?.totalCount ??
    response.pagination?.total ??
    response.pagination?.count ??
    response.pagination?.totalItems ??
    response.pagination?.totalCount ??
    0;

  const pageValue =
    nestedObject?.page ??
    nestedObject?.currentPage ??
    nestedObject?.meta?.page ??
    nestedObject?.meta?.currentPage ??
    nestedObject?.pagination?.page ??
    nestedObject?.pagination?.currentPage ??
    response.page ??
    response.currentPage ??
    response.meta?.page ??
    response.meta?.currentPage ??
    response.pagination?.page ??
    response.pagination?.currentPage ??
    1;

  const limitValue =
    nestedObject?.limit ??
    nestedObject?.pageSize ??
    nestedObject?.perPage ??
    nestedObject?.meta?.limit ??
    nestedObject?.meta?.pageSize ??
    nestedObject?.meta?.perPage ??
    nestedObject?.pagination?.limit ??
    nestedObject?.pagination?.pageSize ??
    nestedObject?.pagination?.perPage ??
    response.limit ??
    response.pageSize ??
    response.perPage ??
    response.meta?.limit ??
    response.meta?.pageSize ??
    response.meta?.perPage ??
    response.pagination?.limit ??
    response.pagination?.pageSize ??
    response.pagination?.perPage ??
    null;

  const safeTotal = toNumberOrNull(totalValue) ?? 0;
  const safePage = toNumberOrNull(pageValue) ?? 1;
  const safeLimit = toNumberOrNull(limitValue);

  const totalPagesValue =
    nestedObject?.totalPages ??
    nestedObject?.pages ??
    nestedObject?.meta?.totalPages ??
    nestedObject?.meta?.pages ??
    nestedObject?.pagination?.totalPages ??
    nestedObject?.pagination?.pages ??
    response.totalPages ??
    response.pages ??
    response.meta?.totalPages ??
    response.meta?.pages ??
    response.pagination?.totalPages ??
    response.pagination?.pages ??
    null;

  const safeTotalPages =
    toNumberOrNull(totalPagesValue) ??
    (safeLimit ? Math.max(1, Math.ceil(safeTotal / safeLimit)) : 1);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages: safeTotalPages,
  };
}

function extractAttributes(response: AttributesResponse): FetchAttributesResult {
  if (Array.isArray(response.data)) {
    return {
      attributes: response.data,
      pagination: getPaginationFromSource(response),
    };
  }

  if (response.data && !Array.isArray(response.data)) {
    if (Array.isArray(response.data.data)) {
      return {
        attributes: response.data.data,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.attributes)) {
      return {
        attributes: response.data.attributes,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.items)) {
      return {
        attributes: response.data.items,
        pagination: getPaginationFromSource(response, response.data),
      };
    }
  }

  if (Array.isArray(response.attributes)) {
    return {
      attributes: response.attributes,
      pagination: getPaginationFromSource(response),
    };
  }

  if (Array.isArray(response.items)) {
    return {
      attributes: response.items,
      pagination: getPaginationFromSource(response),
    };
  }

  return {
    attributes: [],
    pagination: getPaginationFromSource(response),
  };
}

function appendFilterParams(
  params: URLSearchParams,
  filters?: AttributeFiltersState,
) {
  if (!filters) return;

  const search = String(filters.search || "").trim();

  if (search) {
    params.set("search", search);
  }

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.type && filters.type !== "ALL") {
    params.set("type", filters.type);
  }

  if (filters.flag && filters.flag !== "ALL") {
    params.set("flag", filters.flag);
  }
}

export async function fetchCatalogAttributes({
  page = 1,
  limit,
  filters,
}: FetchAttributesParams = {}) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (limit) {
    params.set("limit", String(limit));
  }

  appendFilterParams(params, filters);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseApiResponse<AttributesResponse>(
    response,
    "Attributes API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attributes load failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return extractAttributes(json);
}

export async function archiveCatalogAttribute(attributeId: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseApiResponse<AttributesResponse>(
    response,
    "Attribute archive API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute archive failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}
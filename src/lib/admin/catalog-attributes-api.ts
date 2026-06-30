import type {
  Attribute,
  AttributeFiltersState,
  AttributeOption,
} from "@/components/admin/catalog/attributes/attribute-types";
import type { AttributeFormValues } from "@/components/admin/catalog/attributes/attribute-schema";

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
    | Attribute
    | AttributeFormValues
    | {
        data?: Attribute[] | Attribute | AttributeFormValues;
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
  attribute?: Attribute;
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

type AttributeOptionResponse = {
  success?: boolean;
  data?: AttributeOption | AttributeOption[] | { option?: AttributeOption };
  option?: AttributeOption;
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

function getApiErrorMessage(
  data: AttributesResponse | AttributeOptionResponse | null,
  fallback: string,
) {
  if (!data) return fallback;

  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (Array.isArray(data.error)) {
    return data.error.join(", ");
  }

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (Array.isArray(record.message)) {
      return record.message.join(", ");
    }

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    return JSON.stringify(record, null, 2);
  }

  return `${fallback}. Response: ${JSON.stringify(data, null, 2)}`;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toSnakeCase(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapFrontendTypeToBackendType(type: unknown) {
  const value = String(type || "TEXT").toUpperCase();

  if (value === "TEXT") return "text";
  if (value === "NUMBER") return "number";
  if (value === "BOOLEAN") return "boolean";
  if (value === "SELECT") return "dropdown";
  if (value === "MULTI_SELECT") return "multi_select";
  if (value === "COLOR") return "swatch";
  if (value === "SIZE") return "dropdown";

  return String(type || "text").trim().toLowerCase();
}

function getPaginationFromSource(
  response: AttributesResponse,
  nested?: AttributesResponse["data"],
) {
  const nestedObject =
    nested && !Array.isArray(nested) && typeof nested === "object"
      ? (nested as Record<string, any>)
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
    const dataRecord = response.data as Record<string, any>;

    if (Array.isArray(dataRecord.data)) {
      return {
        attributes: dataRecord.data,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(dataRecord.attributes)) {
      return {
        attributes: dataRecord.attributes,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(dataRecord.items)) {
      return {
        attributes: dataRecord.items,
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

function extractSingleAttribute(response: AttributesResponse): AttributeFormValues {
  if (response.data && !Array.isArray(response.data)) {
    const dataRecord = response.data as Record<string, any>;

    if (dataRecord.data && typeof dataRecord.data === "object") {
      return dataRecord.data as AttributeFormValues;
    }

    if (dataRecord.attribute && typeof dataRecord.attribute === "object") {
      return dataRecord.attribute as AttributeFormValues;
    }

    return response.data as AttributeFormValues;
  }

  if (response.attribute) {
    return response.attribute as AttributeFormValues;
  }

  return response as AttributeFormValues;
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

function cleanOptionPayload(option: Partial<AttributeOption>, index = 0) {
  const label = String(option.label || option.value || "").trim();
  const value = toSnakeCase(option.value || option.label || label);
  const colorHex = String(
    option.colorHex ||
      option.hexCode ||
      (option as Record<string, unknown>).colorCode ||
      "",
  ).trim();

  const payload: Record<string, unknown> = {
    label,
    value,
    sortOrder: Number(option.sortOrder ?? option.position ?? index + 1),
    isActive: typeof option.isActive === "boolean" ? option.isActive : true,
  };

  if (colorHex) {
    payload.colorHex = colorHex;
    payload.hexCode = colorHex;
    payload.colorCode = colorHex;
  }

  if (option.imageUrl) {
    payload.imageUrl = String(option.imageUrl).trim();
  }

  return payload;
}

function cleanAttributePayload(values: AttributeFormValues) {
  const record = values as Record<string, any>;

  const name = String(record.name || record.label || "").trim();
  const key = toSnakeCase(record.key || record.code || record.slug || name);
  const backendType = mapFrontendTypeToBackendType(record.type);
  const status = String(record.status || "ACTIVE").toUpperCase();

  return {
    key,
    code: key,
    slug: key,

    name,
    label: String(record.label || name).trim(),
    description: String(record.description || "").trim(),

    fieldType: backendType,
    type: backendType,

    isRequired: Boolean(record.isRequired),
    isFilterable: Boolean(record.isFilterable),
    isSearchable: Boolean(record.isSearchable),

    isVariantLevel: Boolean(
      record.isVariantLevel ||
        record.isVariantDefining ||
        record.isVariantOption,
    ),
    isVariantOption: Boolean(record.isVariantOption),

  

    isActive: status === "ACTIVE",
    status,

    validationRules: {
      requiredMessage: `${name} is required`,
    },

    validations: {
      requiredMessage: `${name} is required`,
    },

    displayRules: {},

    defaultValue: String(record.defaultValue || ""),
    sortOrder: Number(record.sortOrder || 0),

    options: Array.isArray(record.options)
      ? record.options
          .map((option: AttributeOption, index: number) =>
            cleanOptionPayload(option, index),
          )
          .filter(
            (option) =>
              String(option.label || "").trim() &&
              String(option.value || "").trim(),
          )
      : [],
  };
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

export async function fetchCatalogAttributeById(attributeId: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseApiResponse<AttributesResponse>(
    response,
    "Attribute detail API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return extractSingleAttribute(json);
}

export async function createCatalogAttribute(values: AttributeFormValues) {
  const payload = cleanAttributePayload(values);
  const options = Array.isArray(payload.options) ? payload.options : [];

  const response = await fetch(`${getApiRootUrl()}/admin/catalog/attributes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      options: [],
    }),
  });

  const json = await parseApiResponse<AttributesResponse>(
    response,
    "Attribute create API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute create failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  const createdAttribute = extractSingleAttribute(json);
  const attributeId = String(
    (createdAttribute as Record<string, unknown>).id || "",
  );

  if (attributeId && options.length) {
    await Promise.all(
      options.map((option, index) =>
        createCatalogAttributeOption({
          attributeId,
          option: {
            ...option,
            sortOrder: Number(
              (option as Record<string, unknown>).sortOrder ?? index + 1,
            ),
          },
        }),
      ),
    );
  }

  return createdAttribute;
}

export async function updateCatalogAttribute(
  attributeId: string,
  values: AttributeFormValues,
) {
  const originalOptions = Array.isArray(values.options) ? values.options : [];
  const payload = cleanAttributePayload(values);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...payload,
        options: [],
      }),
    },
  );

  const json = await parseApiResponse<AttributesResponse>(
    response,
    "Attribute update API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute update failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  const newOptions = originalOptions
    .filter((option) => !option.id)
    .map((option, index) => cleanOptionPayload(option, index))
    .filter(
      (option) =>
        String(option.label || "").trim() &&
        String(option.value || "").trim(),
    );

  if (attributeId && newOptions.length) {
    await Promise.all(
      newOptions.map((option, index) =>
        createCatalogAttributeOption({
          attributeId,
          option: {
            ...option,
            sortOrder: Number(
              (option as Record<string, unknown>).sortOrder ?? index + 1,
            ),
          },
        }),
      ),
    );
  }

  return extractSingleAttribute(json);
}

export async function archiveCatalogAttribute(attributeId: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}/archive`,
    {
      method: "POST",
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

export async function deleteCatalogAttribute(attributeId: string) {
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
    "Attribute delete API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute delete failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}

export async function createCatalogAttributeOption({
  attributeId,
  option,
}: {
  attributeId: string;
  option: Partial<AttributeOption>;
}) {
  const payload = cleanOptionPayload(option);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}/options`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json = await parseApiResponse<AttributeOptionResponse>(
    response,
    "Attribute option create API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute option create failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}

export async function updateCatalogAttributeOption({
  attributeId,
  optionId,
  option,
}: {
  attributeId: string;
  optionId: string;
  option: AttributeOption;
}) {
  const payload = cleanOptionPayload(option);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}/options/${encodeURIComponent(optionId)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json = await parseApiResponse<AttributeOptionResponse>(
    response,
    "Attribute option update API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute option update failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}

export async function deleteCatalogAttributeOption({
  attributeId,
  optionId,
}: {
  attributeId: string;
  optionId: string;
}) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(
      attributeId,
    )}/options/${encodeURIComponent(optionId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseApiResponse<AttributeOptionResponse>(
    response,
    "Attribute option delete API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Attribute option delete failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}
export type TaxonomyCategory = {
  id?: string | null;
  taxonomyId: string;
  name?: string | null;
  fullPath?: string | null;
  label?: string | null;
  parentName?: string | null;
  level?: number | null;
  isLeaf?: boolean | null;
  childrenCount?: number | null;
  pathSegments?: string[] | null;
  metafieldCount?: number | null;
};

export type CategoryMetafieldDefinition = {
  id?: string | null;
  key: string;
  label: string;
  description?: string | null;
  type:
    | "single_line_text"
    | "multi_line_text"
    | "single_select"
    | "multi_select"
    | "number"
    | "boolean"
    | "color"
    | "url"
    | "product_reference"
    | "list_product_reference"
    | string;
  options?: string[] | null;
  placeholder?: string | null;
  isRequired?: boolean | null;
  isFilterable?: boolean | null;
  isSearchable?: boolean | null;
  isVisibleOnStorefront?: boolean | null;
  sortOrder?: number | null;
  group?: string | null;
  isActive?: boolean | null;
};

export type CategoryMetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export type CategoryMetafieldRecord = Record<string, CategoryMetafieldValue>;

export type CategoryMetafieldOptionUsageDefinition = {
  id: string;
  key: string;
  label: string;
  type: string;
};

export type CategoryMetafieldOptionUsageOption = {
  id: string;
  label: string;
  value: string;
  status: string;
  isActive: boolean;
  usageCount: number;
  canDelete: boolean;
};

export type CategoryMetafieldOptionUsageProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  status: string;
  businessType: string;
  productType: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryMetafieldKey: string;
  savedValue: string | string[] | number | boolean | null;
};

export type CategoryMetafieldOptionUsagePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CategoryMetafieldOptionUsageData = {
  definition: CategoryMetafieldOptionUsageDefinition;
  option: CategoryMetafieldOptionUsageOption;
  products: CategoryMetafieldOptionUsageProduct[];
  pagination: CategoryMetafieldOptionUsagePagination;
};

type ApiSuccessResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: unknown;
};

function getHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(
  response: Response,
  fallbackMessage: string
): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fallbackMessage}. Body: ${text}`);
  }
}

function getApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (Array.isArray(record.error)) {
    return record.error.join(", ");
  }

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}

function extractArray<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];

  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  if (record.data && typeof record.data === "object") {
    return extractArray<T>(record.data, keys);
  }

  return [];
}

export async function searchTaxonomyCategories({
  apiRootUrl,
  search,
  page = 1,
  limit = 20,
  token,
}: {
  apiRootUrl: string;
  search: string;
  page?: number;
  limit?: number;
  token?: string | null;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/taxonomy/categories?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      items?: TaxonomyCategory[];
      categories?: TaxonomyCategory[];
      total?: number;
      page?: number;
      limit?: number;
    }>
  >(response, "Taxonomy categories API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Taxonomy categories load failed: ${response.status}`)
    );
  }

  const responseData =
  data?.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? (data.data as {
        items?: TaxonomyCategory[];
        categories?: TaxonomyCategory[];
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      })
    : null;

const items = extractArray<TaxonomyCategory>(data, ["items", "categories"]);

const total = Number(responseData?.total || items.length || 0);
const currentPage = Number(responseData?.page || page);
const currentLimit = Number(responseData?.limit || limit);
const totalPages =
  Number(responseData?.totalPages || 0) ||
  Math.max(1, Math.ceil(total / currentLimit));

return {
  items,
  page: currentPage,
  limit: currentLimit,
  total,
  totalPages,
  hasMore: currentPage < totalPages,
  raw: data,
};
}




export async function getTaxonomyRootCategories({
  apiRootUrl,
  token,
}: {
  apiRootUrl: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/taxonomy/categories/roots`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      items?: TaxonomyCategory[];
      categories?: TaxonomyCategory[];
      roots?: TaxonomyCategory[];
    }>
  >(response, "Taxonomy roots API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Taxonomy roots load failed: ${response.status}`)
    );
  }

  const items = extractArray<TaxonomyCategory>(data, [
    "items",
    "categories",
    "roots",
  ]);

  return {
    items,
    raw: data,
  };
}

export async function getTaxonomyCategoryChildren({
  apiRootUrl,
  taxonomyId,
  token,
}: {
  apiRootUrl: string;
  taxonomyId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/taxonomy/categories/${encodeURIComponent(
      taxonomyId
    )}/children`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      items?: TaxonomyCategory[];
      categories?: TaxonomyCategory[];
      children?: TaxonomyCategory[];
    }>
  >(response, "Taxonomy children API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Taxonomy children load failed: ${response.status}`)
    );
  }

  const items = extractArray<TaxonomyCategory>(data, [
    "items",
    "categories",
    "children",
  ]);

  return {
    items,
    raw: data,
  };
}

export async function getTaxonomyCategoryMetafields({
  apiRootUrl,
  taxonomyId,
  token,
}: {
  apiRootUrl: string;
  taxonomyId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/taxonomy/categories/${encodeURIComponent(
      taxonomyId
    )}/metafields`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      taxonomy?: TaxonomyCategory;
      metafields?: CategoryMetafieldDefinition[];
      definitions?: CategoryMetafieldDefinition[];
    }>
  >(response, "Taxonomy metafields API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Taxonomy metafields load failed: ${response.status}`)
    );
  }

  const definitions = extractArray<CategoryMetafieldDefinition>(data, [
    "metafields",
    "definitions",
    "items",
  ]);

  const taxonomy =
    data?.data && typeof data.data === "object" && "taxonomy" in data.data
      ? data.data.taxonomy
      : null;

  return {
    taxonomy: taxonomy || null,
    metafields: definitions.sort(
      (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    ),
    raw: data,
  };
}
export async function getCategoryMetafieldOptionUsage({
  apiRootUrl,
  definitionId,
  optionId,
  page = 1,
  limit = 20,
  search,
  status,
  businessType,
  productType,
  token,
}: {
  apiRootUrl: string;
  definitionId: string;
  optionId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  businessType?: string;
  productType?: string;
  token?: string | null;
}) {
  const cleanDefinitionId = String(definitionId || "").trim();
  const cleanOptionId = String(optionId || "").trim();

  if (!cleanDefinitionId) {
    throw new Error(
      "Category metafield option usage load failed: definitionId missing hai."
    );
  }

  if (!cleanOptionId) {
    throw new Error(
      "Category metafield option usage load failed: optionId missing hai."
    );
  }

  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (status?.trim()) {
    params.set("status", status.trim());
  }

  if (businessType?.trim()) {
    params.set("businessType", businessType.trim());
  }

  if (productType?.trim()) {
    params.set("productType", productType.trim());
  }

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/taxonomy/metafield-definitions/${encodeURIComponent(
      cleanDefinitionId
    )}/options/${encodeURIComponent(
      cleanOptionId
    )}/usage?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<
    ApiSuccessResponse<CategoryMetafieldOptionUsageData>
  >(
    response,
    "Category metafield option usage API JSON response nahi de rahi"
  );

  if (!response.ok || data?.success === false) {
    throw new Error(
      getApiError(
        data,
        `Category metafield option usage load failed: ${response.status}`
      )
    );
  }

  const payload = data?.data;

  if (!payload || typeof payload !== "object") {
    throw new Error(
      "Category metafield option usage API response me data missing hai."
    );
  }

  if (!payload.definition?.id) {
    throw new Error(
      "Category metafield option usage API response me definition missing hai."
    );
  }

  if (!payload.option?.id) {
    throw new Error(
      "Category metafield option usage API response me option missing hai."
    );
  }

  if (!Array.isArray(payload.products)) {
    throw new Error(
      "Category metafield option usage API response me products array missing hai."
    );
  }

  if (!payload.pagination) {
    throw new Error(
      "Category metafield option usage API response me pagination missing hai."
    );
  }

  return payload;
}

export async function saveProductTaxonomy({
  apiRootUrl,
  productId,
  taxonomy,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  taxonomy: TaxonomyCategory;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(productId)}/taxonomy`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        taxonomyCategoryId: taxonomy.id || taxonomy.taxonomyId,
        taxonomyId: taxonomy.taxonomyId,
        taxonomyName: taxonomy.name || taxonomy.label || "",
        taxonomyPath: taxonomy.fullPath || taxonomy.label || taxonomy.name || "",
      }),
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      productId?: string;
      taxonomy?: TaxonomyCategory;
    }>
  >(response, "Product taxonomy save API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product taxonomy save failed: ${response.status}`)
    );
  }

  return data;
}

export async function saveProductCategoryMetafields({
  apiRootUrl,
  productId,
  taxonomyId,
  taxonomyCategoryId,
  categoryMetafields,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  taxonomyId: string;
  taxonomyCategoryId?: string | null;
  categoryMetafields: CategoryMetafieldRecord;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(
      productId
    )}/category-metafields`,
    {
      method: "PATCH",
      headers: getHeaders(token),
   body: JSON.stringify({
  taxonomyId,
  taxonomyCategoryId: taxonomyCategoryId || taxonomyId,
  categoryMetafields,
}),
    }
  );

  const data = await readJson<
    ApiSuccessResponse<{
      productId?: string;
      taxonomy?: TaxonomyCategory;
      categoryMetafields?: CategoryMetafieldRecord;
    }>
  >(response, "Category metafields save API JSON response nahi de rahi");

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category metafields save failed: ${response.status}`)
    );
  }

  return data;
}
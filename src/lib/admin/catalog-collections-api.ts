export type CollectionType = "MANUAL" | "AUTOMATED";
export type CollectionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "INACTIVE";

export type CollectionCondition = {
  field?: string | null;
  operator?: string | null;
  value?: string | number | boolean | null;
};

export type CatalogCollection = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status?: CollectionStatus | string | null;
  isActive?: boolean | null;
  type?: CollectionType | string | null;
  collectionType?: CollectionType | string | null;
  matchType?: "ALL" | "ANY" | string | null;
  season?: string | null;
  sortOrder?: number | null;
  productCount?: number | null;
  productsCount?: number | null;
  conditions?: CollectionCondition[] | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  items?: T;
  message?: string;
  error?: unknown;
};

export type CollectionListResult = {
  items: CatalogCollection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function extractCollectionList(data: unknown): CollectionListResult {
  const defaultResult: CollectionListResult = {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  if (!data || typeof data !== "object") return defaultResult;

  const root = data as Record<string, unknown>;
  const payload =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const items =
    Array.isArray(payload.items)
      ? (payload.items as CatalogCollection[])
      : Array.isArray(payload.collections)
        ? (payload.collections as CatalogCollection[])
        : Array.isArray(payload.data)
          ? (payload.data as CatalogCollection[])
          : Array.isArray(root.items)
            ? (root.items as CatalogCollection[])
            : [];

  const page = Number(payload.page || root.page || 1);
  const limit = Number(payload.limit || root.limit || 20);
  const total = Number(payload.total || root.total || items.length);
  const totalPages =
    Number(payload.totalPages || root.totalPages || 0) ||
    Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getCatalogCollections({
  apiRootUrl,
  token,
  page = 1,
  limit = 20,
  search = "",
  status = "",
  type = "",
}: {
  apiRootUrl: string;
  token?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) params.set("search", search.trim());
  if (status.trim()) params.set("status", status.trim());
  if (type.trim()) params.set("type", type.trim());

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collections list API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collections list failed: ${response.status}`)
    );
  }

  return extractCollectionList(data);
}

export async function archiveCatalogCollection({
  apiRootUrl,
  token,
  id,
}: {
  apiRootUrl: string;
  token?: string | null;
  id: string;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(id)}/archive`,
    {
      method: "PATCH",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection archive API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection archive failed: ${response.status}`)
    );
  }

  return data;
}

export async function deleteCatalogCollection({
  apiRootUrl,
  token,
  id,
}: {
  apiRootUrl: string;
  token?: string | null;
  id: string;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection delete API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection delete failed: ${response.status}`)
    );
  }

  return data;
}


export type CatalogCollectionFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  season: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  isActive: boolean;
  sortOrder: number;
  type: "MANUAL" | "AUTOMATED";
  matchType: "ALL" | "ANY";
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  imageName: string;
  imageAltText: string;
  themeTemplate: string;
  metafields: Record<string, unknown>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  conditions: CollectionCondition[];
};

function cleanCollectionPayload(values: CatalogCollectionFormValues) {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    imageUrl: values.imageUrl.trim(),
    season: values.season.trim(),
    status: values.status,
    isActive: values.isActive,
    sortOrder: Number(values.sortOrder || 0),
    type: values.type,
    matchType: values.matchType,
    seoTitle: values.seoTitle.trim(),
    seoDescription: values.seoDescription.trim(),
    seoSlug: values.seoSlug.trim(),
    imageName: values.imageName.trim(),
    imageAltText: values.imageAltText.trim(),
    themeTemplate: values.themeTemplate.trim() || "default",
    metafields: values.metafields || {},
    faqs: Array.isArray(values.faqs)
      ? values.faqs
          .map((faq) => ({
            question: String(faq.question || "").trim(),
            answer: String(faq.answer || "").trim(),
          }))
          .filter((faq) => faq.question || faq.answer)
      : [],
    conditions:
      values.type === "AUTOMATED" && Array.isArray(values.conditions)
        ? values.conditions
            .map((condition) => ({
              field: String(condition.field || "").trim(),
              operator: String(condition.operator || "").trim(),
              value: condition.value ?? "",
            }))
            .filter((condition) => condition.field && condition.operator)
        : [],
  };
}

export async function createCatalogCollection({
  apiRootUrl,
  token,
  values,
}: {
  apiRootUrl: string;
  token?: string | null;
  values: CatalogCollectionFormValues;
}) {
  const response = await fetch(`${apiRootUrl}/admin/catalog/collections`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(cleanCollectionPayload(values)),
  });

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection create API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection create failed: ${response.status}`)
    );
  }

  return data;
}



function extractCollection(data: unknown): CatalogCollection {
  if (!data || typeof data !== "object") {
    throw new Error("Collection detail response empty hai.");
  }

  const root = data as Record<string, unknown>;

  if (root.success === false) {
    throw new Error(
      typeof root.message === "string"
        ? root.message
        : "Collection detail API success false return kar rahi hai."
    );
  }

  if (root.data && typeof root.data === "object") {
    const payload = root.data as Record<string, unknown>;

    if (payload.id) {
      return payload as CatalogCollection;
    }

    if (payload.collection && typeof payload.collection === "object") {
      return payload.collection as CatalogCollection;
    }

    if (payload.data && typeof payload.data === "object") {
      return payload.data as CatalogCollection;
    }
  }

  if (root.collection && typeof root.collection === "object") {
    return root.collection as CatalogCollection;
  }

  if (root.id) {
    return root as CatalogCollection;
  }

  throw new Error("Collection detail response shape unsupported hai.");
}

export async function getCatalogCollectionById({
  apiRootUrl,
  token,
  id,
}: {
  apiRootUrl: string;
  token?: string | null;
  id: string;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection detail API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection detail failed: ${response.status}`)
    );
  }

  return extractCollection(data);
}

export async function updateCatalogCollection({
  apiRootUrl,
  token,
  id,
  values,
}: {
  apiRootUrl: string;
  token?: string | null;
  id: string;
  values: CatalogCollectionFormValues;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(cleanCollectionPayload(values)),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection update API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection update failed: ${response.status}`)
    );
  }

  return data;
}

export function mapCollectionToFormValues(
  collection: CatalogCollection
): CatalogCollectionFormValues {
  const rawCollection = collection as CatalogCollection & {
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoSlug?: string | null;
    imageName?: string | null;
    imageAltText?: string | null;
    themeTemplate?: string | null;
    metafields?: Record<string, unknown> | null;
    faqs?: Array<{ question?: string | null; answer?: string | null }> | null;
  };

  const type = String(
    collection.type || collection.collectionType || "MANUAL"
  ).toUpperCase();

  const status = String(collection.status || "DRAFT").toUpperCase();

  return {
    name: collection.name || collection.title || "",
    slug: collection.slug || "",
    description: collection.description || "",
    imageUrl: collection.imageUrl || "",
    season: collection.season || "",
    status:
      status === "ACTIVE" ||
      status === "INACTIVE" ||
      status === "ARCHIVED" ||
      status === "DRAFT"
        ? status
        : "DRAFT",
    isActive: collection.isActive ?? status === "ACTIVE",
    sortOrder: Number(collection.sortOrder || 0),
    type: type === "AUTOMATED" ? "AUTOMATED" : "MANUAL",
    matchType:
      rawCollection.matchType === "ANY" || rawCollection.matchType === "ALL"
        ? rawCollection.matchType
        : "ALL",
    seoTitle: rawCollection.seoTitle || "",
    seoDescription: rawCollection.seoDescription || "",
    seoSlug: rawCollection.seoSlug || collection.slug || "",
    imageName: rawCollection.imageName || "",
    imageAltText: rawCollection.imageAltText || "",
    themeTemplate: rawCollection.themeTemplate || "default",
    metafields: rawCollection.metafields || {},
    faqs: Array.isArray(rawCollection.faqs)
      ? rawCollection.faqs.map((faq) => ({
          question: faq.question || "",
          answer: faq.answer || "",
        }))
      : [],
    conditions: Array.isArray(collection.conditions)
      ? collection.conditions
      : [],
  };
}



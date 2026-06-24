export type CollectionProductItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  price?: number | null;
  category?: string | null;
  primaryCategory?: string | null;
  position?: number | null;
};

export type ProductPickerItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  price?: number | null;
  category?: string | null;
  primaryCategory?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  items?: T;
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

function extractItems<T>(data: unknown): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const empty = {
    items: [] as T[],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  if (!data || typeof data !== "object") return empty;

  const root = data as Record<string, unknown>;

  const payload =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const meta =
    payload.meta && typeof payload.meta === "object"
      ? (payload.meta as Record<string, unknown>)
      : root.meta && typeof root.meta === "object"
        ? (root.meta as Record<string, unknown>)
        : {};

  const items =
    Array.isArray(payload.items)
      ? (payload.items as T[])
      : Array.isArray(payload.products)
        ? (payload.products as T[])
        : Array.isArray(payload.data)
          ? (payload.data as T[])
          : Array.isArray(root.items)
            ? (root.items as T[])
            : [];

  const page = Number(meta.page || payload.page || root.page || 1);
  const limit = Number(meta.limit || payload.limit || root.limit || 20);

  const total = Number(
    meta.total ||
      payload.total ||
      root.total ||
      payload.count ||
      root.count ||
      items.length
  );

  const totalPages =
    Number(
      meta.totalPages ||
        payload.totalPages ||
        root.totalPages ||
        meta.pages ||
        payload.pages ||
        root.pages ||
        0
    ) || Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getCollectionProducts({
  apiRootUrl,
  token,
  collectionId,
  page = 1,
  limit = 20,
  search = "",
}: {
  apiRootUrl: string;
  token?: string | null;
  collectionId: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(
      collectionId
    )}/products?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection products API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection products load failed: ${response.status}`)
    );
  }

  return extractItems<CollectionProductItem>(data);
}

export async function searchProductsForCollection({
  apiRootUrl,
  token,
  search = "",
  page = 1,
  limit = 20,
}: {
  apiRootUrl: string;
  token?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/products/picker?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Products picker API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Products picker failed: ${response.status}`)
    );
  }

  return extractItems<ProductPickerItem>(data);
}

export async function saveCollectionProducts({
  apiRootUrl,
  token,
  collectionId,
  productIds,
}: {
  apiRootUrl: string;
  token?: string | null;
  collectionId: string;
  productIds: string[];
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(
      collectionId
    )}/products`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        productIds,
      }),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection products save API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection products save failed: ${response.status}`)
    );
  }

  return data;
}

export async function reorderCollectionProducts({
  apiRootUrl,
  token,
  collectionId,
  productIds,
}: {
  apiRootUrl: string;
  token?: string | null;
  collectionId: string;
  productIds: string[];
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(
      collectionId
    )}/products/reorder`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        items: productIds.map((productId, index) => ({
          productId,
          position: index + 1,
        })),
      }),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection products reorder API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection products reorder failed: ${response.status}`)
    );
  }

  return data;
}

export async function removeCollectionProduct({
  apiRootUrl,
  token,
  collectionId,
  productId,
}: {
  apiRootUrl: string;
  token?: string | null;
  collectionId: string;
  productId: string;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/${encodeURIComponent(
      collectionId
    )}/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Collection product remove API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection product remove failed: ${response.status}`)
    );
  }

  return data;
}


export type AutomatedPreviewCondition = {
  field?: string | null;
  operator?: string | null;
  value?: string | number | boolean | null;
};

function normalizeAutomatedPreviewConditions(conditions: unknown[]) {
  return conditions
    .map((item) => {
      const condition = item as {
        field?: unknown;
        operator?: unknown;
        value?: unknown;
      };

      const field = String(condition.field || "").trim();
      const operator = String(condition.operator || "").trim().toUpperCase();

      return {
        field,
        operator,
        value:
          operator === "IS_EMPTY" || operator === "IS_NOT_EMPTY"
            ? ""
            : condition.value ?? "",
      };
    })
    .filter((condition) => condition.field && condition.operator);
}

export async function previewAutomatedCollectionProducts({
  apiRootUrl,
  token,
  matchType,
  conditions,
  page = 1,
  limit = 20,
}: {
  apiRootUrl: string;
  token?: string | null;
  matchType: "ALL" | "ANY";
  conditions: unknown[];
  page?: number;
  limit?: number;
}) {
  const cleanToken = token?.replace(/^Bearer\s+/i, "").trim() || "";

  if (!cleanToken) {
    throw new Error(
      "Admin token missing hai. Logout/login karke dobara preview try karo."
    );
  }

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("_t", String(Date.now()));

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/collections/conditions/preview?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanToken}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        matchType,
        conditions: normalizeAutomatedPreviewConditions(conditions),
        page,
        limit,
      }),
    }
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Automated preview API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Automated preview failed: ${response.status}`)
    );
  }

  return extractItems<ProductPickerItem>(data);
}
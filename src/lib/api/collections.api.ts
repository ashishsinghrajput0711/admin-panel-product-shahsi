export type StorefrontCollectionProduct = {
  id: string;
  title?: string | null;
  slug?: string | null;
  sku?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  price?: number | null;
  salePrice?: number | null;
  category?: string | null;
  primaryCategory?: string | null;
  brand?: string | null;
  vendor?: string | null;
  productType?: string | null;
  productionType?: string | null;
  position?: number | null;
};

export type StorefrontCollection = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  products?: StorefrontCollectionProduct[] | null;
  filters?: Record<string, unknown> | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: unknown;
  message?: string;
};

type CollectionProductsResponse = {
  items?: StorefrontCollectionProduct[];
  products?: StorefrontCollectionProduct[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CollectionProductsResult = {
  items: StorefrontCollectionProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function getApiBaseUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    "http://65.1.135.224:3001";

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
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

function extractCollection(
  data: ApiResponse<StorefrontCollection> | StorefrontCollection | null,
  slug: string
): StorefrontCollection {
  if (!data) {
    throw new Error(`Collection ${slug} API empty response de rahi hai.`);
  }

  if ("success" in data && data.success === false) {
    throw new Error(
      data.message || `Collection ${slug} API success false return kar rahi hai.`
    );
  }

  if ("data" in data && data.data) {
    return data.data;
  }

  if ("id" in data) {
    return data as StorefrontCollection;
  }

  throw new Error(`Collection ${slug} response shape unsupported hai.`);
}

function extractProducts(
  data: ApiResponse<CollectionProductsResponse> | CollectionProductsResponse | null
): CollectionProductsResult {
  const responseData =
    data && typeof data === "object" && "data" in data && data.data
      ? data.data
      : data;

  const record = (responseData || {}) as CollectionProductsResponse;

  const items = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.products)
      ? record.products
      : [];

  const page = Number(record.page || 1);
  const limit = Number(record.limit || 20);
  const total = Number(record.total || items.length || 0);
  const totalPages =
    Number(record.totalPages || 0) || Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getStorefrontCollection(slug: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/catalog/collections/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<StorefrontCollection>>(
    response,
    "Collection detail API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection detail failed: ${response.status}`)
    );
  }

  return extractCollection(data, slug);
}

export async function getStorefrontCollectionProducts({
  slug,
  page = 1,
  limit = 20,
  search,
  status,
  sortBy,
  sortOrder,
  sort,
  priceMin,
  priceMax,
  size,
  color,
  fabric,
}: {
  slug: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  sort?: string;
  priceMin?: string;
  priceMax?: string;
  size?: string;
  color?: string;
  fabric?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);
  if (sort) params.set("sort", sort);
  if (priceMin) params.set("priceMin", priceMin);
  if (priceMax) params.set("priceMax", priceMax);
  if (size) params.set("size", size);
  if (color) params.set("color", color);
  if (fabric) params.set("fabric", fabric);

  const response = await fetch(
    `${getApiBaseUrl()}/catalog/collections/${encodeURIComponent(
      slug
    )}/products?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<CollectionProductsResponse>>(
    response,
    "Collection products API JSON response nahi de rahi"
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collection products failed: ${response.status}`)
    );
  }

  return extractProducts(data);
}
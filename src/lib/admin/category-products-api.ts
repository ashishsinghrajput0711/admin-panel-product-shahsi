import { getAdminApiRootUrl, getAdminToken } from "@/lib/admin/category-api";

export type CategoryProductItem = {
  id: string;
  productId?: string | null;
  catalogProductId?: string | null;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  status?: string | null;
  price?: number | string | null;
  category?: string | null;
  categoryName?: string | null;
  primaryCategory?: string | null;
  productType?: string | null;
  position?: number | null;
};

export type CategoryProductSearchItem = {
  id: string;
  productId?: string | null;
  catalogProductId?: string | null;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  status?: string | null;
  price?: number | string | null;
  category?: string | null;
  categoryName?: string | null;
  primaryCategory?: string | null;
  productType?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  items?: T;
  products?: T;
  message?: string | string[];
  error?: unknown;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function getHeaders(): HeadersInit {
  const token = getAdminToken();

  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(
  response: Response,
  fallbackMessage: string,
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

  if (Array.isArray(record.message)) return record.message.join(", ");
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

function extractItems<T>(data: unknown): PaginatedResult<T> {
  const empty: PaginatedResult<T> = {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  if (!data || typeof data !== "object") return empty;

  const root = data as Record<string, any>;

  const payload =
    root.data && typeof root.data === "object" ? root.data : root;

  const meta =
    payload.meta && typeof payload.meta === "object"
      ? payload.meta
      : payload.pagination && typeof payload.pagination === "object"
        ? payload.pagination
        : root.meta && typeof root.meta === "object"
          ? root.meta
          : root.pagination && typeof root.pagination === "object"
            ? root.pagination
            : {};

  const items =
    Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.products)
        ? payload.products
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(root.items)
            ? root.items
            : Array.isArray(root.products)
              ? root.products
              : [];

  const page = Number(meta.page || payload.page || root.page || 1);
  const limit = Number(meta.limit || payload.limit || root.limit || 20);

  const total = Number(
    meta.total ||
      payload.total ||
      root.total ||
      payload.count ||
      root.count ||
      items.length,
  );

  const totalPages =
    Number(
      meta.totalPages ||
        payload.totalPages ||
        root.totalPages ||
        meta.pages ||
        payload.pages ||
        root.pages ||
        0,
    ) || Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items: items as T[],
    total,
    page,
    limit,
    totalPages,
  };
}

export function getCategoryProductId(product: CategoryProductItem) {
  return String(
    product.productId ||
      product.catalogProductId ||
      product.id ||
      "",
  ).trim();
}

export function getCategoryProductTitle(product: CategoryProductItem) {
  return product.title || product.name || "Untitled product";
}

export function getCategoryProductImage(product: CategoryProductItem) {
  return product.thumbnail || product.imageUrl || product.image || "";
}

export function getCategoryProductCategory(product: CategoryProductItem) {
  return (
    product.primaryCategory ||
    product.categoryName ||
    product.category ||
    product.productType ||
    "—"
  );
}

export function getCategoryProductPrice(product: CategoryProductItem) {
  if (product.price === null || product.price === undefined || product.price === "") {
    return "—";
  }

  const value = Number(product.price);

  if (Number.isNaN(value)) return String(product.price);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCategoryProductStatus(product: CategoryProductItem) {
  return String(product.status || "DRAFT").toUpperCase();
}

export async function getCategoryProducts({
  slug,
  page = 1,
  limit = 100,
}: {
  slug: string;
  page?: number;
  limit?: number;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug,
    )}/products?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Category products API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category products load failed: ${response.status}`),
    );
  }

  return extractItems<CategoryProductItem>(data);
}

export async function searchProductsForCategory({
  search = "",
  page = 1,
  limit = 20,
  status = "ACTIVE",
  excludeCategorySlug = "",
}: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  excludeCategorySlug?: string;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (status.trim()) {
    params.set("status", status.trim());
  }

  if (excludeCategorySlug.trim()) {
    params.set("excludeCategorySlug", excludeCategorySlug.trim());
  }

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/products/search?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Product search API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product search failed: ${response.status}`),
    );
  }

  return extractItems<CategoryProductSearchItem>(data);
}

export async function saveCategoryProducts({
  slug,
  products,
}: {
  slug: string;
  products: Array<{
    productId: string;
    position: number;
  }>;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const payload = {
    items: products.map((item, index) => ({
      productId: item.productId,
      position: item.position || index + 1,
    })),
  };

  console.log("CATEGORY_PRODUCTS_SAVE_PAYLOAD:", payload);

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(slug)}/products`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Category products save API JSON response nahi de rahi",
  );

  console.log("CATEGORY_PRODUCTS_SAVE_RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category products save failed: ${response.status}`),
    );
  }

  return data;
}

export async function removeCategoryProduct({
  slug,
  productId,
}: {
  slug: string;
  productId: string;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug,
    )}/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  const data = await readJson<ApiResponse<unknown>>(
    response,
    "Category product remove API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category product remove failed: ${response.status}`),
    );
  }

  return data;
}
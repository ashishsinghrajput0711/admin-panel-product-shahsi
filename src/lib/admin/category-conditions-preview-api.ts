import { getAdminApiRootUrl, getAdminToken } from "@/lib/admin/category-api";
import type {
  CategoryCondition,
  CategoryConditionMatchType,
} from "@/components/admin/catalog/categories/category-types";

export type AutomatedCategoryPreviewProduct = {
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

  price?: number | string | null;
  salePrice?: number | string | null;
  listingPrice?: number | string | null;
  rentalPrice?: number | string | null;
  resalePrice?: number | string | null;

  status?: string | null;

  category?: string | null;
  categoryName?: string | null;
  primaryCategory?: string | null;
  productType?: string | null;
};

export type AutomatedCategoryPreviewResult = {
  items: AutomatedCategoryPreviewProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PreviewApiResponse = {
  success?: boolean;
  data?:
    | AutomatedCategoryPreviewProduct[]
    | {
        items?: AutomatedCategoryPreviewProduct[];
        products?: AutomatedCategoryPreviewProduct[];
        data?: AutomatedCategoryPreviewProduct[];
        total?: number;
        count?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        pages?: number;
        meta?: {
          total?: number;
          count?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          pages?: number;
        };
        pagination?: {
          total?: number;
          count?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          pages?: number;
        };
      };
  items?: AutomatedCategoryPreviewProduct[];
  products?: AutomatedCategoryPreviewProduct[];
  total?: number;
  count?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pages?: number;
  message?: string | string[];
  error?: unknown;
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

  if (Array.isArray(record.error)) return record.error.join(", ");

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}

function extractPreviewResult(
  response: PreviewApiResponse | null,
): AutomatedCategoryPreviewResult {
  const empty: AutomatedCategoryPreviewResult = {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  if (!response) return empty;

  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      total: response.data.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }

  const payload =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  const meta =
    "meta" in payload && payload.meta && typeof payload.meta === "object"
      ? payload.meta
      : "pagination" in payload &&
          payload.pagination &&
          typeof payload.pagination === "object"
        ? payload.pagination
        : {};

  const items = Array.isArray((payload as any).items)
    ? (payload as any).items
    : Array.isArray((payload as any).products)
      ? (payload as any).products
      : Array.isArray((payload as any).data)
        ? (payload as any).data
        : Array.isArray(response.items)
          ? response.items
          : Array.isArray(response.products)
            ? response.products
            : [];

  const page = Number(
    (meta as any).page || (payload as any).page || response.page || 1,
  );

  const limit = Number(
    (meta as any).limit || (payload as any).limit || response.limit || 20,
  );

  const total = Number(
    (meta as any).total ||
      (meta as any).count ||
      (payload as any).total ||
      (payload as any).count ||
      response.total ||
      response.count ||
      items.length,
  );

  const totalPages =
    Number(
      (meta as any).totalPages ||
        (meta as any).pages ||
        (payload as any).totalPages ||
        (payload as any).pages ||
        response.totalPages ||
        response.pages ||
        0,
    ) || Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

function cleanConditions(conditions: CategoryCondition[]) {
  return conditions
    .map((condition) => ({
      field: String(condition.field || "").trim(),
      operator: String(condition.operator || "").trim().toUpperCase(),
      value: condition.value,
    }))
    .filter((condition) => condition.field && condition.operator);
}

export function getAutomatedPreviewProductId(
  product: AutomatedCategoryPreviewProduct,
) {
  return String(
    product.productId || product.catalogProductId || product.id || "",
  ).trim();
}

export function getAutomatedPreviewProductTitle(
  product: AutomatedCategoryPreviewProduct,
) {
  return product.title || product.name || "Untitled product";
}

export function getAutomatedPreviewProductImage(
  product: AutomatedCategoryPreviewProduct,
) {
  return product.thumbnail || product.imageUrl || product.image || "";
}

export function getAutomatedPreviewProductCategory(
  product: AutomatedCategoryPreviewProduct,
) {
  return (
    product.primaryCategory ||
    product.categoryName ||
    product.category ||
    product.productType ||
    "—"
  );
}

export function getAutomatedPreviewProductStatus(
  product: AutomatedCategoryPreviewProduct,
) {
  return String(product.status || "DRAFT").toUpperCase();
}

export function getAutomatedPreviewProductPrice(
  product: AutomatedCategoryPreviewProduct,
) {
  const price =
    product.price ??
    product.salePrice ??
    product.listingPrice ??
    product.rentalPrice ??
    product.resalePrice ??
    null;

  if (price === null || price === undefined || price === "") return "—";

  const value = Number(price);

  if (Number.isNaN(value)) return String(price);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function previewAutomatedCategoryProducts({
  matchType,
  conditions,
  page = 1,
  limit = 20,
}: {
  matchType: CategoryConditionMatchType;
  conditions: CategoryCondition[];
  page?: number;
  limit?: number;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const payload = {
    matchType,
    conditions: cleanConditions(conditions),
    page,
    limit,
  };

  console.log("CATEGORY_AUTOMATED_PREVIEW_PAYLOAD:", payload);

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/conditions/preview`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await readJson<PreviewApiResponse>(
    response,
    "Automated category preview API JSON response nahi de rahi",
  );

  console.log("CATEGORY_AUTOMATED_PREVIEW_RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Automated category preview failed: ${response.status}`,
      ),
    );
  }

  return extractPreviewResult(data);
}
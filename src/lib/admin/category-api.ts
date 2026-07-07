import type {
  CategoryCondition,
  CategoryDetailResponse,
  CategoryFormValues,
  CategoryNode,
  CategoryProductSourceType,
  CategoryTreeResponse,
  CategoryUpsertResponse,
} from "@/components/admin/catalog/categories/category-types";

export function getAdminApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getJsonHeaders() {
  const token = getAdminToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getAuthHeaders() {
  const token = getAdminToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`API JSON response nahi de rahi. Body: ${text}`);
  }
}

function getApiError(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  if (Array.isArray(record.error)) return record.error.join(", ");
  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return "";
}

function normalizeProductSourceType(
  value?: string | null,
): CategoryProductSourceType {
  const type = String(value || "MANUAL").toUpperCase();

  return type === "AUTOMATED" ? "AUTOMATED" : "MANUAL";
}

function normalizeMatchType(value?: string | null) {
  const type = String(value || "ALL").toUpperCase();

  return type === "ANY" ? "ANY" : "ALL";
}

function normalizeConditions(value: unknown): CategoryCondition[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((condition) => {
      const record = condition as Record<string, unknown>;

      return {
        field: String(record.field || "").trim(),
        operator: String(record.operator || "").trim(),
        value:
          typeof record.value === "boolean" || typeof record.value === "number"
            ? record.value
            : String(record.value ?? "").trim(),
      };
    })
    .filter((condition) => condition.field && condition.operator);
}

function normalizeCategoryNode(category: CategoryNode): CategoryNode {
  const isActive =
    typeof category.isActive === "boolean" ? category.isActive : true;

  return {
    ...category,
    isActive,
    productSourceType: normalizeProductSourceType(
      category.productSourceType as string | null | undefined,
    ),
    matchType: normalizeMatchType(category.matchType as string | null | undefined),
    conditions: normalizeConditions(category.conditions),
    children: Array.isArray(category.children)
      ? category.children.map(normalizeCategoryNode)
      : [],
  };
}

export async function fetchCategoryTree() {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/tree?includeInactive=true&showProductCount=true&showEmpty=true&maxDepth=50`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const data = await readJson<CategoryTreeResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category tree load failed: ${response.status} ${response.statusText}`,
    );
  }

  const categories = data?.data?.data || data?.data?.categories || [];

  // Important:
  // Pehle yahan collection nodes filter ho rahe the.
  // Ab senior ke according collection = category hai,
  // isliye koi collection/category node remove nahi karna.
  return categories.map(normalizeCategoryNode);
}

export async function fetchCategoryBySlug(slug: string) {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const data = await readJson<CategoryDetailResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category detail load failed: ${response.status} ${response.statusText}`,
    );
  }

  if (!data?.data) {
    throw new Error("Category detail response me data missing hai.");
  }

  return normalizeCategoryNode(data.data);
}

export function buildCategoryPayload(values: CategoryFormValues) {
  const isActive = values.isActive === true;

  const productSourceType = normalizeProductSourceType(values.productSourceType);
  const matchType = normalizeMatchType(values.matchType);

  const conditions =
    productSourceType === "AUTOMATED"
      ? normalizeConditions(values.conditions)
      : [];

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    parentId: values.parentId.trim() || null,
    parentSlug: "",
    collectionSlug: "",
    description: values.description.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
    isActive,
    sortOrder: Number(values.sortOrder || 1),

    productSourceType,
    matchType,
    conditions,

    seoTitle: values.seoTitle.trim() || null,
    seoDescription: values.seoDescription.trim() || null,
    seoSlug: values.seoSlug.trim() || values.slug.trim(),

    imageName: values.imageName.trim() || null,
    imageAltText: values.imageAltText.trim() || null,
    themeTemplate: values.themeTemplate.trim() || "default",

    metafields: {
      topMenu: values.metafields.topMenu?.trim() || "",
      fromBlog: values.metafields.fromBlog?.trim() || "",
      subHeading: values.metafields.subHeading?.trim() || "",
      primaryCollection: values.metafields.primaryCollection?.trim() || "",
      secondaryCollection: values.metafields.secondaryCollection?.trim() || "",
    },

    faqs: values.faqs
      .map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      }))
      .filter((faq) => faq.question || faq.answer),
  };
}

export async function upsertCategory(
  values: CategoryFormValues,
  idOrSlug?: string,
) {
  const apiRootUrl = getAdminApiRootUrl();
  const payload = buildCategoryPayload(values);

  const isEdit = Boolean(idOrSlug?.trim());

  console.log("CATEGORY_SAVE_MODE:", isEdit ? "PATCH" : "POST");
  console.log("CATEGORY_SAVE_ID_OR_SLUG:", idOrSlug);
  console.log("CATEGORY_SAVE_PAYLOAD:", payload);

  const response = await fetch(
    isEdit
      ? `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
          idOrSlug!.trim(),
        )}`
      : `${apiRootUrl}/admin/catalog/categories`,
    {
      method: isEdit ? "PATCH" : "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await readJson<CategoryUpsertResponse>(response);

  console.log("CATEGORY_SAVE_RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category save failed: ${response.status} ${response.statusText}`,
    );
  }

  if (!data?.data) {
    throw new Error(
      "Category save ho gayi but response me category data nahi mila.",
    );
  }

  return normalizeCategoryNode(data.data);
}

export async function deleteCategory(slug: string) {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const data = await readJson<{
    success?: boolean;
    message?: string;
    error?: unknown;
  }>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category delete failed: ${response.status} ${response.statusText}`,
    );
  }

  return data;
}

export async function uploadCategoryImage({
  slug,
  file,
}: {
  slug: string;
  file: File;
}) {
  const apiRootUrl = getAdminApiRootUrl();

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(slug)}/image`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    },
  );

  const data = await readJson<{
    success?: boolean;
    data?: CategoryNode;
    message?: string;
    error?: unknown;
  }>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category image upload failed: ${response.status} ${response.statusText}`,
    );
  }

  return data?.data ? normalizeCategoryNode(data.data) : null;
}

export function flattenCategoryTree(
  categories: CategoryNode[],
  options: {
    excludeId?: string;
    excludeSlug?: string;
  } = {},
) {
  const rows: Array<CategoryNode & { depth: number; label: string }> = [];

  function walk(items: CategoryNode[], depth: number) {
    items.forEach((item) => {
      const isExcluded =
        item.id === options.excludeId || item.slug === options.excludeSlug;

      if (!isExcluded) {
        rows.push({
          ...item,
          depth,
          label: `${"— ".repeat(depth)}${item.name}`,
        });
      }

      if (item.children?.length) {
        walk(item.children, depth + 1);
      }
    });
  }

  walk(categories, 0);

  return rows;
}

export function categoryToFormValues(
  category?: CategoryNode | null,
): CategoryFormValues {
  return {
    id: category?.id || "",
    name: category?.name || "",
    slug: category?.slug || "",
    parentId: category?.parentId || "",
    description: category?.description || "",
    imageUrl: category?.imageUrl || "",
    imageName: category?.imageName || "",
    imageAltText: category?.imageAltText || "",
    themeTemplate: category?.themeTemplate || "default",

    seoTitle: category?.seoTitle || "",
    seoDescription: category?.seoDescription || "",
    seoSlug: category?.seoSlug || category?.slug || "",

    metafields: {
      topMenu: category?.metafields?.topMenu || "",
      fromBlog: category?.metafields?.fromBlog || "",
      subHeading: category?.metafields?.subHeading || "",
      primaryCollection: category?.metafields?.primaryCollection || "",
      secondaryCollection: category?.metafields?.secondaryCollection || "",
    },

    faqs: category?.faqs?.length ? category.faqs : [],

    isActive:
      typeof category?.isActive === "boolean" ? category.isActive : true,

    sortOrder: category?.sortOrder ?? 1,

    productSourceType: normalizeProductSourceType(
      category?.productSourceType as string | null | undefined,
    ),
    matchType: normalizeMatchType(category?.matchType as string | null | undefined),
    conditions: normalizeConditions(category?.conditions),
  };
}

function unwrapCategoryProductsResponse(data: any) {
  const items =
    data?.data?.items ||
    data?.data?.products ||
    data?.data?.data ||
    data?.items ||
    data?.products ||
    data?.data ||
    [];

  return Array.isArray(items) ? items : [];
}

export function getCategoryProductId(item: any) {
  return String(
    item?.productId ||
      item?.catalogProductId ||
      item?.id ||
      item?.product?.id ||
      item?.catalogProduct?.id ||
      "",
  ).trim();
}

export async function fetchCategoryProducts(slug: string) {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug,
    )}/products?page=1&limit=500`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const data = await readJson<any>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category products load failed: ${response.status} ${response.statusText}`,
    );
  }

  return unwrapCategoryProductsResponse(data);
}

export async function removeProductFromCategory(slug: string, productId: string) {
  const apiRootUrl = getAdminApiRootUrl();

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug,
    )}/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  const data = await readJson<any>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data) ||
        `Category product remove failed: ${response.status} ${response.statusText}`,
    );
  }

  return data;
}
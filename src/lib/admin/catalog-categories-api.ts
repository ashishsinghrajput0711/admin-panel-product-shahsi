import type {
  CategoryCondition,
  CategoryFormValues,
  CategoryNode,
  CategoryProductSourceType,
  CategoryMatchType,
} from "@/components/admin/catalog/categories/category-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token")
  )?.replace(/^Bearer\s+/i, "");
}

function getApiUrl(path: string) {
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!cleanBase) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  return `${cleanBase}${cleanPath}`;
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

function unwrapData<T>(response: any): T {
  return (response?.data ?? response) as T;
}

function normalizeConditions(value: unknown): CategoryCondition[] {
  if (!Array.isArray(value)) return [];

  const conditions = value
    .map((item): CategoryCondition | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;

      const field = String(record.field || "").trim();
      const operator = String(record.operator || "").trim();
      const conditionValue = String(record.value || "").trim();

      if (!field || !operator || !conditionValue) return null;

      return {
        field,
        operator,
        value: conditionValue,
      };
    })
    .filter((item): item is CategoryCondition => item !== null);

  return conditions;
}

function buildCategoryPayload(values: CategoryFormValues) {
  const productSourceType =
    (values.productSourceType || "MANUAL") as CategoryProductSourceType;

  const matchType = (values.matchType || "ALL") as CategoryMatchType;

return {
  name: values.name?.trim() || "",
  slug: values.slug?.trim() || "",
  parentId: values.parentId || null,
  description: values.description || "",
  imageUrl: values.imageUrl || "",
  isActive: Boolean(values.isActive),
  sortOrder: Number(values.sortOrder || 0),
  productSourceType,
  matchType,
  conditions: normalizeConditions(values.conditions),
  seoTitle: values.seoTitle || "",
  seoDescription: values.seoDescription || "",
  seoSlug: values.seoSlug || values.slug || "",
  imageName: values.imageName || "",
  imageAltText: values.imageAltText || "",
  themeTemplate: values.themeTemplate || "default",
  metafields: values.metafields || {},
  faqs: Array.isArray(values.faqs) ? values.faqs : [],
};
}

export async function fetchCategoryTree() {
  const response = await adminRequest<any>("/admin/catalog/categories/tree", {
    method: "GET",
  });

  const data = unwrapData<any>(response);

  if (Array.isArray(data)) return data as CategoryNode[];
  if (Array.isArray(data?.items)) return data.items as CategoryNode[];
  if (Array.isArray(data?.categories)) return data.categories as CategoryNode[];
  if (Array.isArray(data?.tree)) return data.tree as CategoryNode[];

  return [];
}

export async function fetchCategoryBySlug(slug: string) {
  const response = await adminRequest<any>(
    `/admin/catalog/categories/${encodeURIComponent(slug)}`,
    {
      method: "GET",
    }
  );

  return unwrapData<CategoryNode>(response);
}

export async function upsertCategory(
  values: CategoryFormValues,
  idOrSlug?: string
) {
  const payload = buildCategoryPayload(values);

  if (idOrSlug) {
    const response = await adminRequest<any>(
      `/admin/catalog/categories/${encodeURIComponent(idOrSlug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    return unwrapData<CategoryNode>(response);
  }

  const response = await adminRequest<any>("/admin/catalog/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapData<CategoryNode>(response);
}

export async function deleteCategory(slug: string) {
  return adminRequest<any>(
    `/admin/catalog/categories/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
    }
  );
}

export async function uploadCategoryImage({
  slug,
  file,
}: {
  slug: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await adminRequest<any>(
    `/admin/catalog/categories/${encodeURIComponent(slug)}/image`,
    {
      method: "POST",
      body: formData,
    }
  );

  return unwrapData<any>(response);
}
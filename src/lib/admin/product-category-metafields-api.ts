function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token")
  )?.replace(/^Bearer\s+/i, "").trim();
}

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  return rawUrl.replace(/\/$/, "");
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type TaxonomyMetafieldDefinition = {
  id?: string;
  key?: string;
  namespace?: string;
  name?: string;
  label?: string;
  type?: string;
  fieldType?: string;
  description?: string | null;
  required?: boolean;
  isRequired?: boolean;
  options?: string[];
  allowedValues?: string[];
  validations?: Record<string, unknown> | null;
};

export async function getTaxonomyMetafieldDefinitions(taxonomyId: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/taxonomy/categories/${encodeURIComponent(
      taxonomyId,
    )}/metafield-definitions`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const text = await response.text();
  const data = text.trim() ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.message || `Metafield definitions load failed: ${response.status}`,
    );
  }

  return data?.data || data?.definitions || data || [];
}

export async function saveProductCategoryMetafields({
  productId,
  taxonomyId,
  categoryMetafields,
}: {
  productId: string;
  taxonomyId: string;
  categoryMetafields: Record<string, unknown>;
}) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/${encodeURIComponent(
      productId,
    )}/category-metafields`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        taxonomyId,
        categoryMetafields,
      }),
    },
  );

  const text = await response.text();
  const data = text.trim() ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.message || `Category metafields save failed: ${response.status}`,
    );
  }

  return data?.data || data;
}
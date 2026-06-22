export type ProductSeoPayload = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;

  searchMetadata?: {
    seoTitle?: string | null;
    metaDescription?: string | null;
    primaryKeyword?: string | null;
    secondaryKeywords?: string[] | null;
    slug?: string | null;
    canonicalUrl?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  seo?: T;
  message?: string | string[];
  error?: unknown;
};

function getHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(response: Response, fallbackMessage: string) {
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

  if (typeof record.message === "string") return record.message;
  if (Array.isArray(record.message)) return record.message.join(", ");

  if (typeof record.error === "string") return record.error;

  if (record.error && typeof record.error === "object") {
    const errorRecord = record.error as { message?: unknown };

    if (typeof errorRecord.message === "string") return errorRecord.message;
    if (Array.isArray(errorRecord.message)) {
      return errorRecord.message.join(", ");
    }

    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}

function extractSeo(data: ApiResponse<ProductSeoPayload> | null) {
  if (!data) return null;

  const root = data as unknown as Record<string, unknown>;
  const dataRecord =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : null;

  const seoRecord =
    dataRecord?.seo && typeof dataRecord.seo === "object"
      ? (dataRecord.seo as ProductSeoPayload)
      : root.seo && typeof root.seo === "object"
        ? (root.seo as ProductSeoPayload)
        : data.data && typeof data.data === "object"
          ? (data.data as ProductSeoPayload)
          : null;

  if (!seoRecord) return null;

  const searchMetadata = seoRecord.searchMetadata || null;

  return {
    ...seoRecord,
    seoTitle:
      seoRecord.seoTitle ||
      seoRecord.metaTitle ||
      searchMetadata?.seoTitle ||
      "",
    seoDescription:
      seoRecord.seoDescription ||
      seoRecord.metaDescription ||
      searchMetadata?.metaDescription ||
      "",
    metaTitle:
      seoRecord.metaTitle ||
      seoRecord.seoTitle ||
      searchMetadata?.seoTitle ||
      "",
    metaDescription:
      seoRecord.metaDescription ||
      seoRecord.seoDescription ||
      searchMetadata?.metaDescription ||
      "",
  };
}

function buildSeoPayload(productId: string, values: ProductSeoPayload) {
  const seoTitle = values.seoTitle || values.metaTitle || "";
  const metaDescription =
    values.metaDescription || values.seoDescription || "";

  return {
    productId,
    seoTitle,
    metaDescription,
  };
}

export async function getProductSeo({
  apiRootUrl,
  productId,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/seo/products/${encodeURIComponent(productId)}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<ApiResponse<ProductSeoPayload>>(
    response,
    "Product SEO API JSON response nahi de rahi"
  );

  if (!response.ok) {
    // SEO record missing ho to edit page break na ho
    if (response.status === 404) {
      return null;
    }

    throw new Error(
      getApiError(data, `Product SEO load failed: ${response.status}`)
    );
  }

  return extractSeo(data);
}

export async function saveProductSeo({
  apiRootUrl,
  productId,
  values,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  values: ProductSeoPayload;
  token?: string | null;
}) {
  const payload = buildSeoPayload(productId, values);

  const patchResponse = await fetch(
    `${apiRootUrl}/admin/seo/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    }
  );

  const patchData = await readJson<ApiResponse<ProductSeoPayload>>(
    patchResponse,
    "Product SEO PATCH API JSON response nahi de rahi"
  );

  if (patchResponse.ok) {
    return patchData;
  }

  // Agar SEO record pehle exist nahi karta aur backend PATCH pe 404 deta hai,
  // to create endpoint try karenge.
  if (patchResponse.status === 404) {
    const createResponse = await fetch(`${apiRootUrl}/admin/seo/products`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });

    const createData = await readJson<ApiResponse<ProductSeoPayload>>(
      createResponse,
      "Product SEO POST API JSON response nahi de rahi"
    );

    if (!createResponse.ok) {
      throw new Error(
        getApiError(createData, `Product SEO create failed: ${createResponse.status}`)
      );
    }

    return createData;
  }

  throw new Error(
    getApiError(patchData, `Product SEO save failed: ${patchResponse.status}`)
  );
}
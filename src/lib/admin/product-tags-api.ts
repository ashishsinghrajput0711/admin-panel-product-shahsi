export type ProductTagsPayload = {
  tags?: string[];
  occasionTags?: string[];
  metaKeywords?: string[];
};

type SaveProductTagsArgs = {
  apiRootUrl: string;
  productId: string;
  values: ProductTagsPayload;
  token?: string | null;
};

type ProductTagsApiResponse = {
  success?: boolean;
  data?: unknown;
  message?: string | string[];
  error?: unknown;
};

function cleanTags(values?: string[]) {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function getApiErrorMessage(data: ProductTagsApiResponse | null, fallback: string) {
  if (!data) return fallback;

  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) return record.message.join(", ");
  }

  return fallback;
}

export async function saveProductTags({
  apiRootUrl,
  productId,
  values,
  token,
}: SaveProductTagsArgs) {
  const payload = {
    tags: cleanTags(values.tags),
    occasionTags: cleanTags(values.occasionTags),
    metaKeywords: cleanTags(values.metaKeywords),
  };

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(productId)}/tags`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const text = await response.text();

  let data: ProductTagsApiResponse | null = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text) as ProductTagsApiResponse;
    } catch {
      throw new Error(`Product tags API JSON response nahi de rahi. Body: ${text}`);
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      getApiErrorMessage(
        data,
        `Product tags save failed: ${response.status} ${response.statusText}`
      )
    );
  }

  return data;
}
export type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | null
  | undefined;

export type MetafieldRecord = Record<string, MetafieldValue>;

type ApiSuccessResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: unknown;
};

function getHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Metafields API JSON response nahi de rahi. Body: ${text}`);
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

  if (Array.isArray(record.message)) {
    return record.message.join(", ");
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeTextValue(value: MetafieldValue) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isPlainObject(value)) {
    return String(
      value.value ||
        value.label ||
        value.title ||
        value.name ||
        value.slug ||
        value.handle ||
        value.id ||
        "",
    ).trim();
  }

  return "";
}
function normalizeSingleTextFromValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    const firstValue = value
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (isPlainObject(item)) {
          return String(
            item.value ||
              item.label ||
              item.title ||
              item.name ||
              item.slug ||
              item.handle ||
              item.id ||
              "",
          ).trim();
        }

        return "";
      })
      .find(Boolean);

    return firstValue || "";
  }

  return normalizeTextValue(value);
}

function normalizeReferenceId(value: unknown) {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (isPlainObject(value)) {
    return String(
      value.productId ||
        value.catalogProductId ||
        value.id ||
        value.value ||
        value.slug ||
        value.handle ||
        value.title ||
        value.name ||
        "",
    ).trim();
  }

  return "";
}

function normalizeStringListValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value
      .map(normalizeReferenceId)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (isPlainObject(value)) {
    const singleValue = normalizeReferenceId(value);
    return singleValue ? [singleValue] : [];
  }

  return [];
}

function normalizePageReferenceValue(value: MetafieldValue) {
  if (isPlainObject(value)) {
    return String(
      value.slug ||
        value.handle ||
        value.id ||
        value.value ||
        value.title ||
        value.name ||
        "",
    ).trim();
  }

  return normalizeTextValue(value);
}

function normalizeMediaReferenceValue(value: MetafieldValue) {
  if (isPlainObject(value)) {
    return String(
      value.url ||
        value.secureUrl ||
        value.imageUrl ||
        value.thumbnailUrl ||
        value.src ||
        value.id ||
        value.value ||
        "",
    ).trim();
  }

  return normalizeTextValue(value);
}

function normalizeCategoryReferenceValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value.map(normalizeReferenceId).filter(Boolean).join(",");
  }

  if (isPlainObject(value)) {
    return String(
      value.slug ||
        value.path ||
        value.fullPath ||
        value.value ||
        value.id ||
        value.title ||
        value.name ||
        "",
    ).trim();
  }

  return normalizeTextValue(value);
}

function cleanAllowedProductMetafields(values?: MetafieldRecord | null) {
  const source = values || {};

  return {
    productFaqs: normalizePageReferenceValue(source.productFaqs),
    careInstructions: normalizePageReferenceValue(source.careInstructions),
    compositionOrigin: normalizePageReferenceValue(source.compositionOrigin),

    customBadge: normalizeTextValue(source.customBadge),

    seeMoreFrom: normalizeCategoryReferenceValue(source.seeMoreFrom),
    primaryCollection: normalizeCategoryReferenceValue(source.primaryCollection),
    secondaryCollection: normalizeCategoryReferenceValue(
      source.secondaryCollection,
    ),

    similarColorProducts: normalizeStringListValue(source.similarColorProducts),
    matchWithAccessories: normalizeStringListValue(
      source.matchWithAccessories,
    ),
    completeTheLook: normalizeStringListValue(source.completeTheLook),

    advancedProductTitle: normalizeTextValue(source.advancedProductTitle),
    similarStyleProduct: normalizeStringListValue(source.similarStyleProduct),

 style: normalizeStringListValue(source.style).join(","),
    fabric: normalizeTextValue(source.fabric),
    print: normalizeTextValue(source.print),

    printSwatch: normalizeMediaReferenceValue(source.printSwatch),

    similarPrintTitle: normalizeTextValue(source.similarPrintTitle),
    similarPrintProducts: normalizeStringListValue(source.similarPrintProducts),
  };
}

export async function saveProductMetafields({
  apiRootUrl,
  productId,
  productMetafields,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  productMetafields?: MetafieldRecord | null;
  token?: string | null;
}) {
  const payload = cleanAllowedProductMetafields(productMetafields);

  console.log("PRODUCT_METAFIELDS_PAYLOAD:", payload);

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(productId)}/metafields`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const data = await readJson<ApiSuccessResponse<MetafieldRecord>>(response);

  console.log("PRODUCT_METAFIELDS_RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product metafields save failed: ${response.status}`),
    );
  }

  return data;
}

export async function saveCategoryMetafields({
  apiRootUrl,
  categorySlug,
  categoryName,
  parentId,
  sortOrder,
  isActive,
  metafields,
  token,
}: {
  apiRootUrl: string;
  categorySlug: string;
  categoryName: string;
  parentId?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
  metafields: MetafieldRecord;
  token?: string | null;
}) {
  const response = await fetch(`${apiRootUrl}/admin/catalog/categories`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      name: categoryName,
      slug: categorySlug,
      parentId: parentId || null,
      sortOrder: Number(sortOrder ?? 1),
      isActive: isActive ?? true,
      metafields,
    }),
  });

  const data = await readJson<
    ApiSuccessResponse<{ metafields?: MetafieldRecord }>
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category metafields save failed: ${response.status}`),
    );
  }

  return data;
}
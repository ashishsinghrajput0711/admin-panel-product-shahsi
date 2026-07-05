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

const allowedProductMetafieldKeys = [
  "productFaqs",
  "careInstructions",
  "compositionOrigin",
  "customBadge",
  "seeMoreFrom",
  "primaryCollection",
  "secondaryCollection",
  "similarColorProducts",
  "matchWithAccessories",
  "completeTheLook",
  "advancedProductTitle",
  "similarStyleProduct",
  "style",
  "fabric",
  "print",
  "printSwatch",
  "similarPrintTitle",
  "similarPrintProducts",
] as const;

function getHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
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

  return "";
}

function normalizeStringListValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        if (isPlainObject(item)) {
          return String(item.id || item.slug || item.handle || item.title || "");
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizePageReferenceValue(value: MetafieldValue) {
  if (isPlainObject(value)) {
    return value;
  }

  return normalizeTextValue(value);
}

function normalizeSeeMoreFromValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isPlainObject(item)) {
          return String(item.slug || item.handle || item.id || "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .join(",");
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
    seeMoreFrom: normalizeSeeMoreFromValue(source.seeMoreFrom),
    primaryCollection: normalizeTextValue(source.primaryCollection),
    secondaryCollection: normalizeTextValue(source.secondaryCollection),

    similarColorProducts: normalizeStringListValue(source.similarColorProducts),
    matchWithAccessories: normalizeStringListValue(source.matchWithAccessories),
    completeTheLook: normalizeStringListValue(source.completeTheLook),

    advancedProductTitle: normalizeTextValue(source.advancedProductTitle),
    similarStyleProduct: normalizeStringListValue(source.similarStyleProduct),

    style: normalizeTextValue(source.style),
    fabric: normalizeTextValue(source.fabric),
    print: normalizeTextValue(source.print),
    printSwatch: normalizeTextValue(source.printSwatch),
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
  categoryMetafields?: MetafieldRecord | null;
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
    }
  );

  const data = await readJson<ApiSuccessResponse<MetafieldRecord>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product metafields save failed: ${response.status}`)
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

  const data = await readJson<ApiSuccessResponse<{ metafields?: MetafieldRecord }>>(
    response
  );

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Category metafields save failed: ${response.status}`)
    );
  }

  return data;
}
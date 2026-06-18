export type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
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

function cleanAllowedProductMetafields(values?: MetafieldRecord | null) {
  const source = values || {};

  return {
    productFaqs: String(source.productFaqs ?? ""),
    careInstructions: String(source.careInstructions ?? ""),
    compositionOrigin: String(source.compositionOrigin ?? ""),
    customBadge: String(source.customBadge ?? ""),
    seeMoreFrom: String(source.seeMoreFrom ?? ""),
    primaryCollection: String(source.primaryCollection ?? ""),
    secondaryCollection: String(source.secondaryCollection ?? ""),
    similarColorProducts: Array.isArray(source.similarColorProducts)
      ? source.similarColorProducts.map(String).filter(Boolean)
      : [],
    matchWithAccessories: Array.isArray(source.matchWithAccessories)
      ? source.matchWithAccessories.map(String).filter(Boolean)
      : [],
    completeTheLook: Array.isArray(source.completeTheLook)
      ? source.completeTheLook.map(String).filter(Boolean)
      : [],
    advancedProductTitle: String(source.advancedProductTitle ?? ""),
    similarStyleProduct: Array.isArray(source.similarStyleProduct)
      ? source.similarStyleProduct.map(String).filter(Boolean)
      : [],
    style: String(source.style ?? ""),
    fabric: String(source.fabric ?? ""),
    print: String(source.print ?? ""),
    printSwatch: String(source.printSwatch ?? ""),
    similarPrintTitle: String(source.similarPrintTitle ?? ""),
    similarPrintProducts: Array.isArray(source.similarPrintProducts)
      ? source.similarPrintProducts.map(String).filter(Boolean)
      : [],
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
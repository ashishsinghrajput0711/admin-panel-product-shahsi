import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";

function cleanText(value?: string | null) {
  return String(value ?? "").trim();
}

function cleanOptionalText(value?: string | null) {
  const nextValue = cleanText(value);
  return nextValue || undefined;
}

function uniqueValues(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(values.map((value) => cleanText(value)).filter(Boolean)),
  );
}

function getModeFromCommerceTypes(values: ProductFormValues) {
  if (values.commerceTypes.includes("RENTAL")) return "rental";
  if (values.commerceTypes.includes("RESALE")) return "resale";
  if (values.commerceTypes.includes("MADE_TO_ORDER")) return "made_to_order";

  return "retail";
}

function getProductTypeForBackend(productType: ProductFormValues["productType"]) {
  if (productType === "ACCESSORY") return "accessory";
  if (productType === "SWATCH") return "swatch";
  if (productType === "EDITORIAL_PRODUCT") return "editorial_product";
  if (productType === "RESALE_LISTING") return "resale_listing";
  if (productType === "RENTAL_LISTING") return "rental_listing";

  return "dress";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    cleanText(value),
  );
}

function normalizeOptionText(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getOptionValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (isPlainObject(value)) {
    const optionValue =
      value.value ??
      value.slug ??
      value.code ??
      value.key ??
      value.id ??
      value.label ??
      value.name ??
      "";

    if (typeof optionValue === "boolean" || typeof optionValue === "number") {
      return optionValue;
    }

    return normalizeOptionText(String(optionValue));
  }

  return normalizeOptionText(String(value));
}

function getTextValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (isPlainObject(value)) {
    const optionValue =
      value.value ??
      value.slug ??
      value.code ??
      value.key ??
      value.id ??
      value.label ??
      value.name ??
      "";

    if (typeof optionValue === "boolean" || typeof optionValue === "number") {
      return optionValue;
    }

    return cleanText(String(optionValue));
  }

  return cleanText(String(value));
}

function cleanRecord(value: unknown, options?: { normalizeOptions?: boolean }) {
  if (!isPlainObject(value)) return {};

  const cleaned: Record<string, unknown> = {};
  const shouldNormalizeOptions = options?.normalizeOptions ?? false;

  Object.entries(value).forEach(([key, rawValue]) => {
    const cleanKey = cleanText(key);
    if (!cleanKey) return;

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return;
    }

    if (Array.isArray(rawValue)) {
      const nextValue = rawValue
        .map((item) =>
          shouldNormalizeOptions ? getOptionValue(item) : getTextValue(item),
        )
        .filter((item) => item !== "");

      if (nextValue.length) {
        cleaned[cleanKey] = nextValue;
      }

      return;
    }

    if (isPlainObject(rawValue)) {
      const directValue = shouldNormalizeOptions
        ? getOptionValue(rawValue)
        : getTextValue(rawValue);

      if (directValue !== "") {
        cleaned[cleanKey] = directValue;
      }

      return;
    }

    const nextValue = shouldNormalizeOptions
      ? getOptionValue(rawValue)
      : getTextValue(rawValue);

    if (nextValue !== "") {
      cleaned[cleanKey] = nextValue;
    }
  });

  return cleaned;
}


const CATEGORY_METAFIELD_MULTI_OPTIONS: Record<string, string[]> = {
  clothingFeatures: ["Breathable", "Lightweight", "Stretch", "Lined"],
  dressOccasion: ["Casual", "Everyday", "Wedding", "Bridal", "Party", "Vacation"],
};

const CATEGORY_METAFIELD_ALLOWED_KEYS = new Set([
  "careInstructions",
  "clothingFeatures",
  "dressOccasion",
  "dressStyle",
  "neckline",
  "skirtDressLengthType",
  "sleeveLengthType",
  "topLengthType",
]);

function normalizeCompareValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function getCategoryMetafieldRawValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (isPlainObject(value)) {
    const optionValue =
      value.label ??
      value.name ??
      value.title ??
      value.value ??
      value.slug ??
      value.code ??
      value.key ??
      "";

    if (typeof optionValue === "boolean" || typeof optionValue === "number") {
      return optionValue;
    }

    return cleanText(String(optionValue));
  }

  return cleanText(String(value));
}

function mapAllowedCategoryOption(key: string, value: unknown) {
  const options = CATEGORY_METAFIELD_MULTI_OPTIONS[key];

  if (!options?.length) {
    return getCategoryMetafieldRawValue(value);
  }

  const rawValue = getCategoryMetafieldRawValue(value);
  const matchedOption = options.find(
    (option) => normalizeCompareValue(option) === normalizeCompareValue(rawValue),
  );

  return matchedOption || "";
}

function cleanCategoryMetafields(value: unknown) {
  if (!isPlainObject(value)) return {};

  const cleaned: Record<string, unknown> = {};

  Object.entries(value).forEach(([key, rawValue]) => {
    const cleanKey = cleanText(key);

    if (!cleanKey || !CATEGORY_METAFIELD_ALLOWED_KEYS.has(cleanKey)) {
      return;
    }

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return;
    }

    if (Array.isArray(rawValue)) {
      const nextValue = rawValue
        .map((item) => mapAllowedCategoryOption(cleanKey, item))
        .filter((item) => item !== "");

      if (nextValue.length) {
        cleaned[cleanKey] = nextValue;
      }

      return;
    }

    const nextValue = mapAllowedCategoryOption(cleanKey, rawValue);

    if (nextValue !== "") {
      cleaned[cleanKey] = nextValue;
    }
  });

  return cleaned;
}

function getCategoryMetafieldInput(values: ProductFormValues) {
  const merged: Record<string, unknown> = {};

  const sources = [
    values.categoryMetafields,
    values.productMetafields,
    (values as any).metafields,
  ];

  sources.forEach((source) => {
    if (!isPlainObject(source)) return;

    Object.entries(source).forEach(([key, value]) => {
      if (CATEGORY_METAFIELD_ALLOWED_KEYS.has(key)) {
        merged[key] = value;
      }
    });
  });

  return merged;
}

function omitCategoryMetafieldKeys(value: unknown) {
  if (!isPlainObject(value)) return {};

  const cleaned: Record<string, unknown> = {};

  Object.entries(value).forEach(([key, item]) => {
    if (CATEGORY_METAFIELD_ALLOWED_KEYS.has(key)) return;
    cleaned[key] = item;
  });

  return cleaned;
}



function removeEmptyValues<T extends Record<string, unknown>>(payload: T) {
  const cleaned: Record<string, unknown> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      if (value.length) cleaned[key] = value;
      return;
    }

    if (isPlainObject(value)) {
      if (Object.keys(value).length) cleaned[key] = value;
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
}

export function getSelectedProductCategorySlugs(values: ProductFormValues) {
  return uniqueValues([values.categoryId, ...(values.categories ?? [])]);
}

function getSelectedCatalogCategoryIds(values: ProductFormValues) {
  return uniqueValues([values.categoryId, ...(values.categories ?? [])]).filter(
    (value) => isUuid(value),
  );
}

export function buildCatalogProductPayload(values: ProductFormValues) {
const selectedCategories = getSelectedProductCategorySlugs(values);
const selectedCatalogCategoryIds = getSelectedCatalogCategoryIds(values);
const primaryCategoryValue = cleanText(selectedCatalogCategoryIds[0]);

  const dynamicAttributes = cleanRecord(values.dynamicAttributes, {
    normalizeOptions: true,
  });

const categoryMetafields = cleanCategoryMetafields(
  getCategoryMetafieldInput(values),
);

const googleMerchantData = cleanRecord(values.googleMerchantData);

const productMetafields = cleanRecord(
  omitCategoryMetafieldKeys(values.productMetafields),
);

  const tags = Array.isArray(values.tags)
    ? values.tags.map((tag) => cleanText(tag)).filter(Boolean)
    : [];

  const occasionTags = Array.isArray(values.occasionTags)
    ? values.occasionTags.map((tag) => cleanText(tag)).filter(Boolean)
    : [];

  const metaKeywords = Array.isArray(values.metaKeywords)
    ? values.metaKeywords.map((tag) => cleanText(tag)).filter(Boolean)
    : [];

 const categoryPayload = primaryCategoryValue
  ? {
      categoryId: primaryCategoryValue,
      categories: selectedCatalogCategoryIds,
    }
  : {};

  return removeEmptyValues({
    title: cleanText(values.name),

    description: cleanOptionalText(values.description),
    shortDescription: cleanOptionalText(values.shortDescription),
    slug: cleanText(values.slug),
    sku: cleanText(values.sku),

    mode: getModeFromCommerceTypes(values),
    productType: getProductTypeForBackend(values.productType),

    ...categoryPayload,

    brand: cleanOptionalText(values.brand) || "Shahsi",
    businessType: values.businessType,
    commerceTypes: values.commerceTypes,

    basePrice: Number(values.price ?? 0),
    compareAtPrice:
      values.salePrice === null || values.salePrice === undefined
        ? undefined
        : Number(values.salePrice),
    currency: "USD",

    seoTitle: cleanOptionalText(values.seoTitle),
    seoDescription: cleanOptionalText(values.seoDescription),

    ...(tags.length ? { tags } : {}),
    ...(occasionTags.length ? { occasionTags } : {}),
    ...(metaKeywords.length ? { metaKeywords } : {}),

    ...(Object.keys(dynamicAttributes).length ? { dynamicAttributes } : {}),

    ...(values.taxonomyId
      ? {
          taxonomyId: values.taxonomyId,
          taxonomyCategoryId: values.taxonomyId,
        }
      : {}),

  ...(values.taxonomyId && Object.keys(categoryMetafields).length
  ? { categoryMetafields }
  : {}),

    ...(Object.keys(googleMerchantData).length ? { googleMerchantData } : {}),

    ...(Object.keys(productMetafields).length
      ? {
          metafields: productMetafields,
          productMetafields,
        }
      : {}),
  });
}
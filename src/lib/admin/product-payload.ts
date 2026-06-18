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
    new Set(values.map((value) => cleanText(value)).filter(Boolean))
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

export function getSelectedProductCategorySlugs(values: ProductFormValues) {
  return uniqueValues([values.categoryId, ...(values.categories ?? [])]);
}

export function buildCatalogProductPayload(values: ProductFormValues) {
  const selectedCategories = getSelectedProductCategorySlugs(values);
  const primaryCategory = cleanText(values.categoryId || selectedCategories[0]);

 return {
  title: cleanText(values.name),
  description: cleanText(values.description),
  shortDescription: cleanText(values.shortDescription),
  slug: cleanText(values.slug),
  sku: cleanText(values.sku),

  mode: getModeFromCommerceTypes(values),
  productType: getProductTypeForBackend(values.productType),

  category: primaryCategory,
  primaryCollection: primaryCategory,
  categories: selectedCategories,

    brand: cleanOptionalText(values.brand) || "Shahsi",
    businessType: values.businessType,
    commerceTypes: values.commerceTypes,

    basePrice: Number(values.price ?? 0),
    compareAtPrice:
      values.salePrice === null || values.salePrice === undefined
        ? undefined
        : Number(values.salePrice),
    currency: "USD",

    seoTitle: cleanText(values.seoTitle),
    seoDescription: cleanText(values.seoDescription),
  };
}
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  HelpCircle,
  ImageIcon,
  Layers3,
  Loader2,
  Plus,
  Search,
  Tags,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "./product-schema";
import {
  getTaxonomyCategoryChildren,
  getTaxonomyCategoryMetafields,
  getTaxonomyRootCategories,
  searchTaxonomyCategories,
  type CategoryMetafieldDefinition,
  type TaxonomyCategory,
} from "@/lib/admin/product-taxonomy-metafields-api";

type PageReferenceValue = {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
  handle?: string | null;
  status?: string | null;
  type?: string | null;
  pageType?: string | null;
  isHidden?: boolean | null;
  isActive?: boolean | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | PageReferenceValue
  | PageReferenceValue[]
  | null
  | undefined;

type ProductFieldType =
  | "text"
  | "textarea"
  | "tags"
  | "select"
  | "attribute_option_picker"
  | "media_picker"
  | "product_picker"
  | "collection_picker"
  | "category_list_picker"
  | "page_picker";

type ProductMetafieldField = {
  key: string;
  label: string;
  type: ProductFieldType;
  placeholder?: string;
  options?: string[];
  attributeKey?: string;
};

type ProductPickerItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  sku?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  primaryImage?: string | null;
  category?: string | null;
  brand?: string | null;
  vendor?: string | null;
  status?: string | null;
  adminStatus?: string | null;
  statusLabel?: string | null;
  price?: number | null;
};

type ProductPickerApiResponse = {
  success?: boolean;
  data?:
    | {
        items?: ProductPickerItem[];
        products?: ProductPickerItem[];
        meta?: unknown;
        page?: number;
        limit?: number;
        total?: number;
      }
    | ProductPickerItem[];
  items?: ProductPickerItem[];
  products?: ProductPickerItem[];
  message?: string;
  error?: unknown;
};

type CategoryPickerItem = {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  path?: string | null;
  url?: string | null;
  level?: number | null;
  isActive?: boolean | null;
  productSourceType?: string | null;
  directProductCount?: number | null;
  productCount?: number | null;
  children?: CategoryPickerItem[] | null;
};

type CategoryPickerApiResponse = {
  success?: boolean;
  data?:
    | CategoryPickerItem[]
    | {
        data?: CategoryPickerItem[];
        categories?: CategoryPickerItem[];
      };
  categories?: CategoryPickerItem[];
  message?: string;
  error?: unknown;
};

type CollectionPickerItem = {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  type?: string | null;
  collectionType?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  productsCount?: number | null;
  productCount?: number | null;
};

type CollectionPickerApiResponse = {
  success?: boolean;
  data?:
    | CollectionPickerItem[]
    | {
        data?: CollectionPickerItem[];
        collections?: CollectionPickerItem[];
        items?: CollectionPickerItem[];
      };
  collections?: CollectionPickerItem[];
  items?: CollectionPickerItem[];
  message?: string;
  error?: unknown;
};


type CmsPagePickerItem = {
  id: string;
  title?: string | null;
  slug?: string | null;
  handle?: string | null;
  description?: string | null;
  status?: string | null;
  type?: string | null;
  isHidden?: boolean | null;
  isActive?: boolean | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

type CmsPagePickerApiResponse = {
  success?: boolean;
  data?:
    | CmsPagePickerItem[]
    | {
        data?: CmsPagePickerItem[];
        pages?: CmsPagePickerItem[];
        items?: CmsPagePickerItem[];
      };
  pages?: CmsPagePickerItem[];
  items?: CmsPagePickerItem[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    count?: number;
  };
  message?: string;
  error?: unknown;
};


type AttributeOptionItem = {
  id?: string | null;
  label?: string | null;
  name?: string | null;
  value?: string | null;
  colorHex?: string | null;
  hexCode?: string | null;
  colorCode?: string | null;
  hex?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

type CatalogAttributeItem = {
  id?: string | null;
  name?: string | null;
  label?: string | null;
  code?: string | null;
  slug?: string | null;
  key?: string | null;
  options?: AttributeOptionItem[] | null;
};

type AttributesApiResponse = {
  success?: boolean;
  data?:
    | CatalogAttributeItem[]
    | {
        data?: CatalogAttributeItem[];
        attributes?: CatalogAttributeItem[];
        items?: CatalogAttributeItem[];
      };
  attributes?: CatalogAttributeItem[];
  items?: CatalogAttributeItem[];
  message?: string;
  error?: unknown;
};

type ColorPresetOption = {
  id: string;
  label: string;
  value: string;
  colorHex: string;
};

type ProductAttributeOption = {
  id: string;
  label: string;
  value: string;
  colorHex?: string;
  imageUrl?: string;
};

type MediaLibraryItem = {
  id?: string | null;
  url?: string | null;
  secureUrl?: string | null;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  name?: string | null;
  title?: string | null;
  altText?: string | null;
  type?: string | null;
  resourceType?: string | null;
  status?: string | null;
};

type MediaLibraryApiResponse = {
  success?: boolean;
  data?:
    | MediaLibraryItem[]
    | {
        items?: MediaLibraryItem[];
        data?: MediaLibraryItem[];
      };
  items?: MediaLibraryItem[];
  message?: string;
  error?: unknown;
};

const productMetafieldFields: ProductMetafieldField[] = [
 {
  key: "productFaqs",
  label: "Product FAQs",
  type: "page_picker",
  placeholder: "Select FAQ page",
},
{
  key: "careInstructions",
  label: "Care & Instructions",
  type: "page_picker",
  placeholder: "Select care instructions page",
},
{
  key: "compositionOrigin",
  label: "Composition & Origin",
  type: "page_picker",
  placeholder: "Select composition/origin page",
},
  {
    key: "customBadge",
    label: "Custom Badge",
    type: "text",
    placeholder: "Premium / New / Limited",
  },
 {
  key: "seeMoreFrom",
  label: "See More from",
  type: "category_list_picker",
  placeholder: "Select categories",
},
{
  key: "primaryCollection",
  label: "Primary category",
  type: "collection_picker",
  placeholder: "Select primary category",
},
{
  key: "secondaryCollection",
  label: "Secondary category",
  type: "collection_picker",
  placeholder: "Select secondary category",
},
  {
    key: "similarColorProducts",
    label: "Similar Color Products",
    type: "product_picker",
    placeholder: "Select similar color products",
  },
  {
    key: "matchWithAccessories",
    label: "Match with Accessories",
    type: "product_picker",
    placeholder: "Select accessory products",
  },
  {
    key: "completeTheLook",
    label: "Complete the Look",
    type: "product_picker",
    placeholder: "Select complete the look products",
  },
  {
    key: "advancedProductTitle",
    label: "Advanced Product Title",
    type: "text",
    placeholder: "Premium Bridal Gown With Designer Finish",
  },
  {
    key: "similarStyleProduct",
    label: "Similar Style Product",
    type: "product_picker",
    placeholder: "Select similar style products",
  },
    {
    key: "style",
    label: "Style",
    type: "attribute_option_picker",
    attributeKey: "style",
    placeholder: "Select style",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "attribute_option_picker",
    attributeKey: "fabric",
    placeholder: "Select fabric",
  },
  {
    key: "print",
    label: "Print",
    type: "attribute_option_picker",
    attributeKey: "print",
    placeholder: "Select print",
  },
  {
    key: "printSwatch",
    label: "Print Swatch",
    type: "media_picker",
    placeholder: "Select image",
  },
  {
    key: "similarPrintTitle",
    label: "Similar Print Title",
    type: "text",
    placeholder: "More Solid Silk Styles",
  },
  {
    key: "similarPrintProducts",
    label: "Similar Print Products",
    type: "product_picker",
    placeholder: "Select similar print products",
  },
];

function getApiRootUrl() {
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

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyValue(value: MetafieldValue) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function getValue(
  values: ProductFormValues,
  group: "categoryMetafields" | "productMetafields",
  key: string
) {
  const groupValue = values[group] as Record<string, MetafieldValue> | undefined;
  return groupValue?.[key];
}

function getStringArrayValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return parseTags(value);
  }

  return [];
}

function updateValue(
  values: ProductFormValues,
  group: "categoryMetafields" | "productMetafields",
  key: string,
  value: MetafieldValue,
  onChange: (values: ProductFormValues) => void
) {
  onChange({
    ...values,
    [group]: {
      ...(values[group] || {}),
      [key]: value,
    },
  });
}

function getTaxonomyLabel(taxonomy?: ProductFormValues["taxonomy"] | null) {
  if (!taxonomy) return "";
  return (
    taxonomy.label ||
    taxonomy.name ||
    taxonomy.fullPath ||
    taxonomy.taxonomyId ||
    ""
  );
}

function getTaxonomyParentLabel(taxonomy: TaxonomyCategory) {
  if (taxonomy.parentName) return taxonomy.parentName;

  const fullPath = taxonomy.fullPath || "";
  const parts = fullPath.split(">").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) return parts[parts.length - 2];

  return "";
}

function getTaxonomyDisplayLabel(taxonomy: TaxonomyCategory) {
  if (taxonomy.name) return taxonomy.name;

  if (taxonomy.label) {
    return taxonomy.label.replace(/\s+in\s+.+$/i, "").trim();
  }

  if (taxonomy.fullPath) {
    const parts = taxonomy.fullPath
      .split(">")
      .map((part) => part.trim())
      .filter(Boolean);

    return parts[parts.length - 1] || taxonomy.fullPath;
  }

  return taxonomy.taxonomyId;
}

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [];

  return options.map((option) => String(option)).filter(Boolean);
}

function cleanCategoryMetafieldsForDefinitions({
  values,
  definitions,
}: {
  values: Record<string, MetafieldValue>;
  definitions: CategoryMetafieldDefinition[];
}) {
  const allowedKeys = new Set(definitions.map((definition) => definition.key));

  return Object.entries(values).reduce<Record<string, MetafieldValue>>(
    (acc, [key, value]) => {
      if (allowedKeys.has(key)) {
        acc[key] = value;
      }

      return acc;
    },
    {}
  );
}

function getProductTitle(product: ProductPickerItem) {
  return product.title || product.name || product.sku || product.id;
}

function getProductImage(product: ProductPickerItem) {
  return (
    product.thumbnailUrl ||
    product.thumbnail ||
    product.imageUrl ||
    product.primaryImage ||
    ""
  );
}

function getProductStatus(product: ProductPickerItem) {
  return String(
    product.adminStatus || product.statusLabel || product.status || ""
  )
    .trim()
    .toLowerCase();
}

function getProductStatusLabel(product: ProductPickerItem) {
  const status = getProductStatus(product);

  if (!status) return "Unknown";
  if (status === "active") return "Active";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  if (status === "unlisted") return "Unlisted";
  if (status === "inactive") return "Inactive";

  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getProductStatusClass(product: ProductPickerItem) {
  const status = getProductStatus(product);

  if (status === "active") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (status === "draft") {
    return "bg-yellow-100 text-yellow-800 ring-yellow-200";
  }

  if (status === "archived") {
    return "bg-neutral-200 text-neutral-700 ring-neutral-300";
  }

  if (status === "unlisted" || status === "inactive") {
    return "bg-orange-100 text-orange-800 ring-orange-200";
  }

  return "bg-neutral-100 text-neutral-600 ring-neutral-200";
}

function extractPickerItems(data: ProductPickerApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.products)) return data.products;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.products)) return data.data.products;
  }

  return [];
}


function extractCategoryTreeItems(data: CategoryPickerApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.data)) return data.data.data;
    if (Array.isArray(data.data.categories)) return data.data.categories;
  }

  if (Array.isArray(data.categories)) return data.categories;

  return [];
}


function extractCollectionItems(data: CollectionPickerApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.collections)) return data.collections;
  if (Array.isArray(data.items)) return data.items;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.data)) return data.data.data;
    if (Array.isArray(data.data.collections)) return data.data.collections;
    if (Array.isArray(data.data.items)) return data.data.items;
  }

  return [];
}


function extractCmsPageItems(data: CmsPagePickerApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.pages)) return data.pages;
  if (Array.isArray(data.items)) return data.items;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.data)) return data.data.data;
    if (Array.isArray(data.data.pages)) return data.data.pages;
    if (Array.isArray(data.data.items)) return data.data.items;
  }

  return [];
}


function readText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    const text = value.trim();

    if (!text || text === "[object Object]") return "";

    return text;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (Array.isArray(value)) return "";

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    const directText =
      readText(record.title) ||
      readText(record.name) ||
      readText(record.label) ||
      readText(record.slug) ||
      readText(record.handle) ||
      readText(record.id);

    if (directText) return directText;

    if (
      record.value &&
      typeof record.value === "object" &&
      !Array.isArray(record.value)
    ) {
      return readText(record.value);
    }

    return readText(record.value);
  }

  return "";
}

function normalizePageReferenceValue(value: MetafieldValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;

  const nestedValue =
    record.value && typeof record.value === "object" && !Array.isArray(record.value)
      ? (record.value as Record<string, unknown>)
      : record;

  return {
    id: readText(nestedValue.id),
    title:
      readText(nestedValue.title) ||
      readText(nestedValue.name) ||
      readText(nestedValue.label) ||
      readText(nestedValue.handle) ||
      readText(nestedValue.slug) ||
      readText(nestedValue.id),
    slug: readText(nestedValue.slug) || readText(nestedValue.handle),
    handle: readText(nestedValue.handle) || readText(nestedValue.slug),
    status: readText(nestedValue.status),
    type: "page_reference",
    pageType: readText(nestedValue.pageType) || readText(nestedValue.type) || "PAGE",
    isHidden:
      typeof nestedValue.isHidden === "boolean" ? nestedValue.isHidden : undefined,
    isActive:
      typeof nestedValue.isActive === "boolean" ? nestedValue.isActive : undefined,
    publishedAt: readText(nestedValue.publishedAt),
    updatedAt: readText(nestedValue.updatedAt),
  };
}

function getCmsPageTitle(page: CmsPagePickerItem | PageReferenceValue) {
  return (
    readText(page.title) ||
    readText(page.handle) ||
    readText(page.slug) ||
    readText(page.id)
  );
}

function normalizePageReference(page: CmsPagePickerItem): PageReferenceValue {
  return {
    id: readText(page.id),
    title:
      readText(page.title) ||
      readText(page.handle) ||
      readText(page.slug) ||
      readText(page.id),
    slug: readText(page.slug) || readText(page.handle),
    handle: readText(page.handle) || readText(page.slug),
    status: readText(page.status),
    type: "page_reference",
    pageType: readText(page.type) || "PAGE",
    isHidden: page.isHidden ?? null,
    isActive: page.isActive ?? null,
    publishedAt: readText(page.publishedAt) || null,
    updatedAt: readText(page.updatedAt) || null,
  };
}

function isPageReferenceObject(value: MetafieldValue): value is PageReferenceValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function fetchCmsPagePickerItems({
  search,
  page = 1,
  limit = 20,
}: {
  search: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${getApiRootUrl()}/admin/cms/pages/picker?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const text = await response.text();
  const data = text.trim()
    ? (JSON.parse(text) as CmsPagePickerApiResponse)
    : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `CMS page picker failed: ${response.status}`),
    );
  }

  return {
    items: extractCmsPageItems(data),
    meta: data?.meta || null,
  };
}

function flattenCategoryPickerItems(
  nodes: CategoryPickerItem[],
  depth = 0,
  parentPath = "",
): CategoryPickerItem[] {
  const result: CategoryPickerItem[] = [];

  nodes.forEach((node) => {
    const slug = String(node.slug || "").trim();
    const name = String(node.name || node.title || slug || "").trim();

    if (!slug || !name) return;

    const path = String(node.path || parentPath || slug).trim();

    result.push({
      ...node,
      name,
      slug,
      path,
      level: node.level ?? depth + 1,
    });

    if (Array.isArray(node.children) && node.children.length) {
      result.push(...flattenCategoryPickerItems(node.children, depth + 1, path));
    }
  });

  return result;
}

function getCategoryPickerValue(category: CategoryPickerItem) {
  return String(category.path || category.slug || category.id || "").trim();
}

function getCategoryPickerLabel(category: CategoryPickerItem) {
  const name = String(
    category.name ||
      category.title ||
      category.slug ||
      category.id ||
      "Untitled category",
  ).trim();

  const level = Number(category.level || 1);
  const indent = level > 1 ? `${"— ".repeat(level - 1)}` : "";

  return `${indent}${name}`;
}

function getCategoryPickerSourceLabel(category: CategoryPickerItem) {
  return String(category.productSourceType || "MANUAL").toUpperCase();
}

function getCategoryPickerStatusLabel(category: CategoryPickerItem) {
  if (typeof category.isActive === "boolean") {
    return category.isActive ? "ACTIVE" : "INACTIVE";
  }

  return "ACTIVE";
}

function getCategoryPickerProductsCount(category: CategoryPickerItem) {
  return Number(category.productCount ?? category.directProductCount ?? 0);
}

async function fetchCategoryPickerItems() {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/categories/tree?includeInactive=true&showProductCount=true&showEmpty=true&maxDepth=10`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const text = await response.text();
  const data = text.trim()
    ? (JSON.parse(text) as CategoryPickerApiResponse)
    : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Categories picker failed: ${response.status}`),
    );
  }

  return flattenCategoryPickerItems(extractCategoryTreeItems(data)).filter(
    (category) => Boolean(getCategoryPickerValue(category)),
  );
}

function getCollectionValue(collection: CollectionPickerItem) {
  return String(collection.slug || collection.id || "").trim();
}

function getCollectionLabel(collection: CollectionPickerItem) {
  return String(
    collection.name ||
      collection.title ||
      collection.slug ||
      collection.id ||
      "Untitled collection"
  ).trim();
}

function getCollectionTypeLabel(collection: CollectionPickerItem) {
  return String(
    collection.type || collection.collectionType || "MANUAL"
  ).toUpperCase();
}

function getCollectionStatusLabel(collection: CollectionPickerItem) {
  if (typeof collection.isActive === "boolean") {
    return collection.isActive ? "ACTIVE" : "DRAFT";
  }

  return String(collection.status || "ACTIVE").toUpperCase();
}

function getCollectionProductsCount(collection: CollectionPickerItem) {
  return Number(collection.productsCount ?? collection.productCount ?? 0);
}

async function fetchCollectionPickerItems() {
  const params = new URLSearchParams();

  params.set("page", "1");
  params.set("limit", "100");
  params.set("status", "ACTIVE");

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/collections?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const text = await response.text();
  const data = text.trim()
    ? (JSON.parse(text) as CollectionPickerApiResponse)
    : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Collections picker failed: ${response.status}`)
    );
  }

  return extractCollectionItems(data).filter((collection) =>
    Boolean(getCollectionValue(collection))
  );
}


function extractAttributes(data: AttributesApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.attributes)) return data.attributes;
  if (Array.isArray(data.items)) return data.items;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.data)) return data.data.data;
    if (Array.isArray(data.data.attributes)) return data.data.attributes;
    if (Array.isArray(data.data.items)) return data.data.items;
  }

  return [];
}

function normalizeHexValue(value: unknown) {
  const raw = String(value || "").trim();

  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

  return "";
}

function getAttributeIdentity(attribute: CatalogAttributeItem) {
  return String(
    attribute.code ||
      attribute.slug ||
      attribute.key ||
      attribute.name ||
      attribute.label ||
      ""
  )
    .trim()
    .toLowerCase();
}

function mapColorOptions(attribute: CatalogAttributeItem): ColorPresetOption[] {
  if (!Array.isArray(attribute.options)) return [];

  return attribute.options
    .map((option) => {
      const label = String(option.label || option.name || option.value || "")
        .trim();

      const colorHex = normalizeHexValue(
        option.colorHex || option.hexCode || option.hex
      );

      if (!label || !colorHex) return null;

      return {
        id: String(option.id || option.value || label),
        label,
        value: String(option.value || label),
        colorHex,
      };
    })
    .filter(Boolean) as ColorPresetOption[];
}

async function fetchColorPresetOptions() {
  const params = new URLSearchParams();

  params.set("page", "1");
  params.set("limit", "100");
  params.set("search", "color");

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const text = await response.text();
  const data = text.trim() ? (JSON.parse(text) as AttributesApiResponse) : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Color attributes load failed: ${response.status}`)
    );
  }

  const attributes = extractAttributes(data);

  const colorAttribute =
    attributes.find((attribute) => {
      const identity = getAttributeIdentity(attribute);
      return identity === "color" || identity === "/color";
    }) ||
    attributes.find((attribute) => {
      const identity = getAttributeIdentity(attribute);
      return identity.includes("color") && !identity.includes("family");
    });

  if (!colorAttribute) return [];

  return mapColorOptions(colorAttribute);
}

function mapAttributeOptions(attribute: CatalogAttributeItem): ProductAttributeOption[] {
  if (!Array.isArray(attribute.options)) return [];

  return attribute.options
    .map((option) => {
      const label = String(option.label || option.name || option.value || "").trim();
      const value = String(option.value || label).trim();

      if (!label || !value) return null;

      return {
        id: String(option.id || value),
        label,
        value,
        colorHex: normalizeHexValue(option.colorHex || option.hexCode || option.hex),
        imageUrl: String(option.imageUrl || "").trim(),
      };
    })
    .filter(Boolean) as ProductAttributeOption[];
}

function matchAttributeByKey(attribute: CatalogAttributeItem, key: string) {
  const identity = getAttributeIdentity(attribute);
  const normalizedKey = key.trim().toLowerCase();

  return (
    identity === normalizedKey ||
    identity === normalizedKey.replace(/_/g, "-") ||
    identity === normalizedKey.replace(/-/g, "_") ||
    identity.includes(normalizedKey)
  );
}

async function fetchAttributeOptions(attributeKey: string) {
  const params = new URLSearchParams();

  params.set("page", "1");
  params.set("limit", "100");
  params.set("search", attributeKey);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const text = await response.text();
  const data = text.trim() ? (JSON.parse(text) as AttributesApiResponse) : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `${attributeKey} attributes load failed: ${response.status}`)
    );
  }

  const attributes = extractAttributes(data);

  const matchedAttribute =
    attributes.find((attribute) => matchAttributeByKey(attribute, attributeKey)) ||
    attributes[0];

  if (!matchedAttribute) {
    return {
      attribute: null,
      options: [],
    };
  }

  return {
    attribute: matchedAttribute,
    options: mapAttributeOptions(matchedAttribute),
  };
}

async function createAttributeOption({
  attributeId,
  label,
}: {
  attributeId: string;
  label: string;
}) {
  const cleanLabel = label.trim();

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/attributes/${encodeURIComponent(attributeId)}/options`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        label: cleanLabel,
        value: cleanLabel
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
        colorHex: "",
        hexCode: "",
        colorCode: "",
        imageUrl: "",
        sortOrder: 0,
        isActive: true,
      }),
    }
  );

  const text = await response.text();
  const data = text.trim() ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Attribute option create failed: ${response.status}`)
    );
  }

  return data;
}

function extractMediaLibraryItems(data: MediaLibraryApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.data)) return data.data.data;
  }

  return [];
}

function getMediaUrl(item: MediaLibraryItem) {
  return String(
    item.secureUrl ||
      item.thumbnailUrl ||
      item.thumbnail ||
      item.url ||
      ""
  ).trim();
}

function getMediaTitle(item: MediaLibraryItem) {
  return String(item.title || item.name || item.altText || item.id || "Untitled media").trim();
}

function isValidImageUrl(value: string) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return false;

  return (
    /^https?:\/\//i.test(cleanValue) ||
    cleanValue.startsWith("/") ||
    cleanValue.startsWith("data:image/")
  );
}

async function fetchMediaLibraryItems(search: string) {
  const params = new URLSearchParams();

  params.set("page", "1");
  params.set("limit", "30");

  if (search.trim()) {
    params.set("search", search.trim());
  }

  params.set("type", "IMAGE");

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/media-library?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const text = await response.text();
  const data = text.trim() ? (JSON.parse(text) as MediaLibraryApiResponse) : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Media library load failed: ${response.status}`)
    );
  }

  return extractMediaLibraryItems(data).filter((item) => Boolean(getMediaUrl(item)));
}

function isColorMetafield(definition: CategoryMetafieldDefinition) {
  const key = String(definition.key || "").trim().toLowerCase();
  const label = String(definition.label || "").trim().toLowerCase();

  return definition.type === "color" || key === "color" || label === "color";
}

async function fetchProductPicker({
  search,
  searchBy,
  page = 1,
  limit = 50,
}: {
  search: string;
  searchBy: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("status", "all");

  if (search.trim()) {
    params.set("search", search.trim());
    params.set("searchBy", searchBy || "all");
  }

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/products/picker?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const text = await response.text();
  const data = text.trim()
    ? (JSON.parse(text) as ProductPickerApiResponse)
    : null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product picker failed: ${response.status}`)
    );
  }

  return {
    items: extractPickerItems(data),
    meta:
      data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data) &&
      "meta" in data.data
        ? (data.data as { meta?: unknown }).meta
        : null,
  };
}

async function fetchSelectedProductById(productId: string) {
  const result = await fetchProductPicker({
    search: productId,
    searchBy: "productId",
    page: 1,
    limit: 1,
  });

  return result.items.find((item) => item.id === productId) || result.items[0] || null;
}

function ProductPickerModal({
  fieldLabel,
  selectedIds,
  multiple = true,
  onChange,
  onClose,
}: {
  fieldLabel: string;
  selectedIds: string[];
  multiple?: boolean;
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [items, setItems] = useState<ProductPickerItem[]>([]);
  const [selectedProductsById, setSelectedProductsById] = useState<
    Record<string, ProductPickerItem>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    let ignore = false;

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setPickerError(null);

        const result = await fetchProductPicker({
          search,
          searchBy,
          page: 1,
          limit: 50,
        });

        if (ignore) return;

        setItems(result.items);

        setSelectedProductsById((previous) => {
          const next = { ...previous };

          result.items.forEach((item) => {
            if (selectedSet.has(item.id)) {
              next[item.id] = item;
            }
          });

          return next;
        });
      } catch (error) {
        if (!ignore) {
          setPickerError(
            error instanceof Error
              ? error.message
              : "Product picker load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [search, searchBy, selectedSet]);

  function toggleProduct(product: ProductPickerItem) {
    setSelectedProductsById((previous) => ({
      ...previous,
      [product.id]: product,
    }));

    if (selectedSet.has(product.id)) {
      onChange(selectedIds.filter((id) => id !== product.id));
      return;
    }

    if (!multiple) {
      onChange([product.id]);
      return;
    }

    onChange([...selectedIds, product.id]);
  }

  function clearSelection() {
    onChange([]);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[88vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">
              Edit products
            </h3>
            <p className="text-xs text-neutral-500">{fieldLabel}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="h-full flex-1 bg-transparent text-sm outline-none"
              />
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              ) : null}
            </div>

            <select
              value={searchBy}
              onChange={(event) => setSearchBy(event.target.value)}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none md:w-56"
            >
              <option value="all">Search by All</option>
              <option value="title">Search by Title</option>
              <option value="sku">Search by SKU</option>
              <option value="productId">Search by Product ID</option>
              <option value="barcode">Search by Barcode</option>
            </select>
          </div>

          <button
            type="button"
            disabled
            className="mt-3 rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-500"
          >
            Add filter +
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {pickerError ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {pickerError}
            </div>
          ) : null}

          {!pickerError && isLoading && items.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading products...
            </div>
          ) : null}

          {!pickerError && !isLoading && items.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
              No products found.
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {items.map((product) => {
                const selected = selectedSet.has(product.id);
                const image = getProductImage(product);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-neutral-50"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white"
                      }`}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>

                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={getProductTitle(product)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-neutral-300" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-950">
                        {getProductTitle(product)}
                      </span>

                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {product.sku || product.slug || product.id}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getProductStatusClass(
                        product
                      )}`}
                    >
                      {getProductStatusLabel(product)}
                    </span>

                    {product.price !== undefined && product.price !== null ? (
                      <span className="hidden shrink-0 text-xs text-neutral-500 md:block">
                        ${product.price}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex h-16 shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <p className="text-sm text-neutral-700">
              {selectedIds.length} products selected
            </p>

            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-950"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-neutral-950 px-5 text-white hover:bg-neutral-800"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductReferenceInput({
  label,
  value,
  multiple = true,
  placeholder,
  onChange,
}: {
  label: string;
  value: MetafieldValue;
  multiple?: boolean;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const [draggedId, setDraggedId] = useState<string | null>(null);
const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [selectedProductsById, setSelectedProductsById] = useState<
    Record<string, ProductPickerItem>
  >({});
  const [isSelectedLoading, setIsSelectedLoading] = useState(false);

  const selectedIds = getStringArrayValue(value);
  const activeIds = isEditorOpen ? draftIds : selectedIds;

  useEffect(() => {
    if (!isEditorOpen) {
      setDraftIds(selectedIds);
    }
  }, [isEditorOpen, selectedIds.join("|")]);

  useEffect(() => {
    let ignore = false;

    async function loadSelectedProductDetails() {
      const missingIds = activeIds.filter((id) => !selectedProductsById[id]);

      if (missingIds.length === 0) return;

      try {
        setIsSelectedLoading(true);

        const products = await Promise.all(
          missingIds.map((id) => fetchSelectedProductById(id).catch(() => null))
        );

        if (ignore) return;

        setSelectedProductsById((previous) => {
          const next = { ...previous };

          products.forEach((product, index) => {
            const fallbackId = missingIds[index];

            if (product?.id) {
              next[product.id] = product;
              return;
            }

            next[fallbackId] = {
              id: fallbackId,
              title: fallbackId,
            };
          });

          return next;
        });
      } finally {
        if (!ignore) {
          setIsSelectedLoading(false);
        }
      }
    }

    loadSelectedProductDetails();

    return () => {
      ignore = true;
    };
  }, [activeIds.join("|")]);

  function applyIds(ids: string[]) {
    if (multiple) {
      onChange(ids);
      return;
    }

    onChange(ids[0] || "");
  }

  function openEditor() {
    setDraftIds(selectedIds);
    setIsEditorOpen(true);
  }

  function handleDone() {
    applyIds(draftIds);
    setIsEditorOpen(false);
    setIsPickerOpen(false);
  }

  function handleCancel() {
    setDraftIds(selectedIds);
    setIsEditorOpen(false);
    setIsPickerOpen(false);
  }

  function removeDraftProduct(id: string) {
    setDraftIds((previous) => previous.filter((selectedId) => selectedId !== id));
  }

  function clearDraftProducts() {
    setDraftIds([]);
  }


  function moveDraftProduct(sourceId: string, targetId: string) {
  if (sourceId === targetId) return;

  setDraftIds((previous) => {
    const sourceIndex = previous.indexOf(sourceId);
    const targetIndex = previous.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return previous;

    const next = [...previous];
    const [removed] = next.splice(sourceIndex, 1);

    next.splice(targetIndex, 0, removed);

    return next;
  });
}

function handleDragStart(id: string) {
  setDraggedId(id);
}

function handleDragEnter(id: string) {
  if (!draggedId || draggedId === id) return;

  setDragOverId(id);
  moveDraftProduct(draggedId, id);
}

function handleDragEnd() {
  setDraggedId(null);
  setDragOverId(null);
}

return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {!isEditorOpen ? (
        <button
          type="button"
          onClick={openEditor}
     className="grid w-full grid-cols-1 items-center gap-2 px-3 py-2 text-left transition hover:bg-neutral-50"
        >
         

          <div className="min-w-0">
            {selectedIds.length > 0 ? (
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 py-1.5 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
                {selectedIds.slice(0, 4).map((id) => {
                  const product = selectedProductsById[id];
                  const title = product ? getProductTitle(product) : id;
                  const image = product ? getProductImage(product) : "";

                  return (
                    <span
                      key={id}
                   className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md bg-neutral-100 px-1.5 py-1 text-[13px] text-neutral-900 ring-1 ring-neutral-200/60"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-white ring-1 ring-neutral-200">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                        )}
                      </span>

                      <span className="truncate">{title}</span>
                    </span>
                  );
                })}

                {selectedIds.length > 4 ? (
                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-sm text-neutral-600">
                    +{selectedIds.length - 4} more
                  </span>
                ) : null}

                {isSelectedLoading ? (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-400">
                {placeholder || "Select products"}
              </div>
            )}
          </div>
        </button>
      ) : (
        <div className="animate-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-[220px_1fr] gap-4 border-b border-neutral-200 px-4 py-3">
           

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPickerOpen(true)}
                className="h-9 rounded-xl px-4 text-sm"
              >
                Select products
              </Button>

              {draftIds.length > 0 ? (
                <button
                  type="button"
                  onClick={clearDraftProducts}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          {draftIds.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {draftIds.map((id) => {
                const product = selectedProductsById[id];
                const title = product ? getProductTitle(product) : id;
                const image = product ? getProductImage(product) : "";

                return (
                 <div
  key={id}
  draggable
  onDragStart={() => handleDragStart(id)}
  onDragEnter={() => handleDragEnter(id)}
  onDragOver={(event) => event.preventDefault()}
  onDragEnd={handleDragEnd}
  className={`grid grid-cols-[220px_1fr_32px] items-center gap-4 px-4 py-3 transition-all duration-200 ease-out ${
    draggedId === id
      ? "scale-[0.99] bg-neutral-100 opacity-60"
      : dragOverId === id
        ? "bg-neutral-50"
        : "bg-white"
  }`}
>
                    <div className="flex justify-end pr-3">
                     <button
  type="button"
  draggable
  onDragStart={() => handleDragStart(id)}
  onDragEnd={handleDragEnd}
  className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing"
  aria-label="Drag product"
>
  <span className="text-lg leading-none">⋮⋮</span>
</button>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-950">
                          {title}
                        </p>

                        {product?.sku || product?.slug ? (
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {product.sku || product.slug}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraftProduct(id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                      aria-label={`Remove ${title}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {isSelectedLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-neutral-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading selected product details...
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-[220px_1fr] gap-4 px-4 py-6">
              <div />
              <p className="text-sm text-neutral-500">
                {placeholder || "No products selected"}
              </p>
            </div>
          )}

         <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2">
         <p className="text-[10px] text-neutral-400">
              Product IDs backend me {multiple ? "ordered array" : "single ID"} ke
              form me save honge.
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-9 rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleDone}
                className="h-9 rounded-xl bg-neutral-950 px-5 text-white hover:bg-neutral-800"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPickerOpen ? (
        <ProductPickerModal
          fieldLabel={label}
          selectedIds={draftIds}
          multiple={multiple}
          onChange={setDraftIds}
          onClose={() => setIsPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}


function CategoryPickerInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: MetafieldValue;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [categories, setCategories] = useState<CategoryPickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const textValue = stringifyValue(value);

  const selectedCategory = categories.find(
    (category) => getCategoryPickerValue(category) === textValue,
  );

  const currentValueMissing =
    Boolean(textValue) &&
    !categories.some(
      (category) => getCategoryPickerValue(category) === textValue,
    );

  async function loadCategories() {
    try {
      setIsLoading(true);
      setPickerError(null);

      const items = await fetchCategoryPickerItems();

      setCategories(items);
    } catch (error) {
      setCategories([]);
      setPickerError(
        error instanceof Error ? error.message : "Categories load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialCategories() {
      try {
        setIsLoading(true);
        setPickerError(null);

        const items = await fetchCategoryPickerItems();

        if (ignore) return;

        setCategories(items);
      } catch (error) {
        if (!ignore) {
          setCategories([]);
          setPickerError(
            error instanceof Error ? error.message : "Categories load failed.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialCategories();

    return () => {
      ignore = true;
    };
  }, []);

return (
<div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
      <div className="mb-2 flex items-center justify-between gap-3">
 <p className="truncate text-[11px] text-neutral-400">
  Category path/slug backend me save hoga.
</p>

  <button
    type="button"
    onClick={loadCategories}
    disabled={isLoading}
   className="shrink-0 text-[11px] font-semibold text-neutral-500 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? "Loading..." : "Refresh"}
  </button>
</div>

      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
     className="h-10 w-full cursor-pointer rounded-xl border border-neutral-200 bg-[#fbfaf8] px-3 text-[13px] font-medium text-neutral-950 outline-none transition hover:bg-white focus:border-neutral-950 focus:bg-white disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">
          {isLoading ? "Loading categories..." : placeholder || "Select category"}
        </option>

        {currentValueMissing ? (
          <option value={textValue}>Current saved: {textValue}</option>
        ) : null}

        {categories.map((category) => {
          const optionValue = getCategoryPickerValue(category);
          const optionLabel = getCategoryPickerLabel(category);
          const sourceLabel = getCategoryPickerSourceLabel(category);
          const statusLabel = getCategoryPickerStatusLabel(category);
          const count = getCategoryPickerProductsCount(category);

          return (
            <option key={category.id || optionValue} value={optionValue}>
              {optionLabel} — {sourceLabel} / {statusLabel}
              {count ? ` / ${count} products` : ""}
            </option>
          );
        })}
      </select>

    <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {selectedCategory ? (
          <>
            <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              {String(selectedCategory.name || selectedCategory.slug || "")}
            </span>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700 ring-1 ring-sky-100">
              {getCategoryPickerSourceLabel(selectedCategory)}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
              {getCategoryPickerStatusLabel(selectedCategory)}
            </span>
          </>
        ) : textValue ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">
            Saved old value: {textValue}
          </span>
        ) : (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
            No category selected
          </span>
        )}

        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-500">
          {categories.length} categories loaded
        </span>
      </div>

      {textValue ? (
       <p className="mt-1 truncate text-[11px] text-neutral-400">
          Saved category path/slug:{" "}
          <span className="font-mono font-semibold text-neutral-700">
            {textValue}
          </span>
        </p>
      ) : null}

      {pickerError ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {pickerError}
        </p>
      ) : null}
    </div>
  );
}




function parseCategoryListValue(value: MetafieldValue) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
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


function titleCaseFromSlug(value: string) {
  const lastPart = String(value || "")
    .split("/")
    .filter(Boolean)
    .pop();

  if (!lastPart) return value;

  return lastPart
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getReadableCategoryChipLabel(
  path: string,
  category?: CategoryPickerItem,
) {
  const record = category as unknown as Record<string, unknown> | undefined;

  const categoryName = record
    ? String(record.name || record.title || record.label || "").trim()
    : "";

  if (categoryName) return categoryName;

  return titleCaseFromSlug(path);
}

function CategoryListPickerInput({
  value,
  placeholder,
  onChange,
}: {
  value: MetafieldValue;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryPickerItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const selectedPaths = parseCategoryListValue(value);
  const selectedSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

  const selectedCategories = useMemo(() => {
    return selectedPaths.map((path) => {
  const matched = categories.find((category) => {
  const record = category as unknown as Record<string, unknown>;
  const value = getCategoryPickerValue(category);
  const slug = String(record.slug || "").trim();
  const url = String(record.url || "").replace(/^\//, "").trim();

  return value === path || slug === path || url === path;
});

      return {
        path,
        category: matched,
      };
    });
  }, [categories, selectedPaths]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return categories;

    return categories.filter((category) => {
      const haystack = [
        getCategoryPickerLabel(category),
        getCategoryPickerValue(category),
        category.name,
        category.slug,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [categories, search]);

  async function loadCategories() {
    try {
      setIsLoading(true);
      setPickerError(null);

      const items = await fetchCategoryPickerItems();

      setCategories(items);
    } catch (error) {
      setCategories([]);
      setPickerError(
        error instanceof Error ? error.message : "Categories load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen || categories.length > 0) return;

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function updateSelectedPaths(nextPaths: string[]) {
    onChange(
      Array.from(
        new Set(
          nextPaths.map((path) => String(path || "").trim()).filter(Boolean),
        ),
      ),
    );
  }

  function toggleCategory(category: CategoryPickerItem) {
    const path = getCategoryPickerValue(category);

    if (!path) return;

    if (selectedSet.has(path)) {
      updateSelectedPaths(selectedPaths.filter((item) => item !== path));
      return;
    }

    updateSelectedPaths([...selectedPaths, path]);
  }

  function removeCategory(path: string) {
    updateSelectedPaths(selectedPaths.filter((item) => item !== path));
  }

  function clearAll() {
    updateSelectedPaths([]);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="min-w-0 flex-1 text-left"
        >
          {selectedCategories.length > 0 ? (
            <div className="flex min-h-9 flex-wrap items-center gap-2">
              {selectedCategories.slice(0, 4).map(({ path, category }) => {
               const title = getReadableCategoryChipLabel(path, category);

                return (
                  <span
                    key={path}
                    className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 text-sm text-neutral-900"
                  >
                    <span className="truncate">{title}</span>

                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeCategory(path);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          removeCategory(path);
                        }
                      }}
                      className="rounded-full p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  </span>
                );
              })}

              {selectedCategories.length > 4 ? (
                <span className="rounded-md bg-neutral-100 px-2 py-1 text-sm text-neutral-600">
                  +{selectedCategories.length - 4} more
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">
              {placeholder || "Select categories"}
            </p>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {selectedPaths.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen((previous) => !previous)}
            className="h-8 rounded-xl px-3 text-xs"
          >
            {selectedPaths.length > 0 ? "Change" : "Select categories"}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-neutral-100 p-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              className="h-full flex-1 bg-transparent text-sm outline-none"
            />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              {selectedPaths.length} categories selected
            </p>

            <button
              type="button"
              onClick={loadCategories}
              disabled={isLoading}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-950 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {pickerError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {pickerError}
            </div>
          ) : null}

          {!pickerError && isLoading && categories.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading categories...
            </div>
          ) : null}

          {!pickerError && !isLoading && filteredCategories.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-neutral-500">
              No categories found.
            </div>
          ) : null}

          {filteredCategories.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-neutral-100">
              <div className="divide-y divide-neutral-100">
                {filteredCategories.map((category) => {
                  const path = getCategoryPickerValue(category);
                  const selected = selectedSet.has(path);
                  const label = getCategoryPickerLabel(category);
                  const count = getCategoryPickerProductsCount(category);

                  return (
                    <button
                      key={category.id || path}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50"
                    >
                      <span
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-300 bg-white",
                        ].join(" ")}
                      >
                        {selected ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-950">
                          {label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {path}
                        </span>
                      </span>

                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-500">
                        {count} products
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}



function getDefaultPageSearch(fieldKey: string) {
  if (fieldKey === "productFaqs") return "faq";
  if (fieldKey === "careInstructions") return "care";
  if (fieldKey === "compositionOrigin") return "composition";

  return "";
}

function PageReferenceInput({
  fieldKey,
  value,
  placeholder,
  onChange,
}: {
  fieldKey: string;
  value: MetafieldValue;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(getDefaultPageSearch(fieldKey));
  const [items, setItems] = useState<CmsPagePickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

 const selectedPage = isPageReferenceObject(value)
  ? normalizePageReferenceValue(value)
  : null;
  const oldStringValue =
  typeof value === "string" && readText(value) ? readText(value) : "";

const selectedTitle = selectedPage
  ? getCmsPageTitle(selectedPage)
  : oldStringValue;

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setPickerError(null);

        const result = await fetchCmsPagePickerItems({
          search,
          page: 1,
          limit: 20,
        });

        if (ignore) return;

        setItems(result.items);
      } catch (error) {
        if (!ignore) {
          setItems([]);
          setPickerError(
            error instanceof Error ? error.message : "CMS pages load failed.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen, search]);

  function clearSelection() {
    onChange("");
  }

  function selectPage(page: CmsPagePickerItem) {
    onChange(normalizePageReference(page));
    setIsOpen(false);
  }

  return (
  <div className="rounded-xl border border-neutral-200 bg-white shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="min-w-0 flex-1 text-left"
        >
          {selectedTitle ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-950">
                {selectedTitle}
              </p>

              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {selectedPage?.slug || selectedPage?.handle || "Page reference"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">
              {placeholder || "Select page"}
            </p>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {selectedTitle ? (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen((previous) => !previous)}
            className="h-8 rounded-xl px-3 text-xs"
          >
            {selectedTitle ? "Change" : "Select page"}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-neutral-100 p-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find pages"
              className="h-full flex-1 bg-transparent text-sm outline-none"
            />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : null}
          </div>

          {pickerError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {pickerError}
            </div>
          ) : null}

          {!pickerError && isLoading && items.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading pages...
            </div>
          ) : null}

          {!pickerError && !isLoading && items.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-neutral-500">
              No pages found.
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-neutral-100">
              <div className="divide-y divide-neutral-100">
                {items.map((page) => {
                  const selected = selectedPage?.id === page.id;

                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => selectPage(page)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50"
                    >
                      <span
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-300 bg-white",
                        ].join(" ")}
                      >
                        {selected ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-950">
                          {page.title || page.handle || page.slug || page.id}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {page.slug || page.handle || page.id}
                        </span>
                      </span>

                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                        {page.status || "PAGE"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AttributeOptionPickerInput({
  attributeKey,
  value,
  placeholder,
  onChange,
}: {
  attributeKey: string;
  value: MetafieldValue;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [attribute, setAttribute] = useState<CatalogAttributeItem | null>(null);
  const [options, setOptions] = useState<ProductAttributeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const textValue = stringifyValue(value);

  async function loadOptions() {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchAttributeOptions(attributeKey);

      setAttribute(result.attribute);
      setOptions(result.options);
    } catch (loadError) {
      setAttribute(null);
      setOptions([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : `${attributeKey} options load failed.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeKey]);

  async function handleAddItem() {
    const label = newOptionLabel.trim();

    if (!label) return;

    if (!attribute?.id) {
      setError(`${attributeKey} attribute id missing hai.`);
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      await createAttributeOption({
        attributeId: attribute.id,
        label,
      });

      setNewOptionLabel("");
      await loadOptions();
      onChange(label);
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Option add karte time error aa gaya."
      );
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2">
      <div className="flex gap-2">
        <select
          value={textValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          className="h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-[#fbfaf8] px-3 text-[13px] text-neutral-950 outline-none transition hover:bg-white focus:border-neutral-950 focus:bg-white disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        >
          <option value="">
            {isLoading ? "Loading..." : placeholder || "Select option"}
          </option>

          {textValue && !options.some((option) => option.label === textValue || option.value === textValue) ? (
            <option value={textValue}>Current saved: {textValue}</option>
          ) : null}

          {options.map((option) => (
            <option key={option.id} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>

        {textValue ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-10 rounded-xl px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={newOptionLabel}
          onChange={(event) => setNewOptionLabel(event.target.value)}
          placeholder="Add item"
          className="h-9 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-neutral-950"
        />

        <button
          type="button"
          onClick={handleAddItem}
          disabled={isAdding || !newOptionLabel.trim()}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add item
        </button>
      </div>

      {error ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MediaPickerInput({
  value,
  placeholder,
  onChange,
}: {
  value: MetafieldValue;
  placeholder?: string | null;
  onChange: (value: MetafieldValue) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const textValue = stringifyValue(value);

  const hasValidImage = isValidImageUrl(textValue);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setPickerError(null);

        const result = await fetchMediaLibraryItems(search);

        if (!ignore) {
          setItems(result);
        }
      } catch (error) {
        if (!ignore) {
          setItems([]);
          setPickerError(
            error instanceof Error ? error.message : "Media library load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen, search]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="min-w-0 flex-1 text-left"
        >
         {hasValidImage ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={textValue} alt="Print swatch" className="h-full w-full object-cover" />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-neutral-950">
                  Selected image
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  {textValue}
                </span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">
              {placeholder || "Select image"}
            </p>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2">
     {hasValidImage ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen((previous) => !previous)}
            className="h-8 rounded-xl px-3 text-xs"
          >
         {hasValidImage ? "Change" : "Select image"}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-neutral-100 p-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search media..."
              className="h-full flex-1 bg-transparent text-sm outline-none"
            />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : null}
          </div>

          {pickerError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {pickerError}
            </div>
          ) : null}

          {!pickerError && isLoading && items.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading media...
            </div>
          ) : null}

          {!pickerError && !isLoading && items.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-neutral-500">
              No media found.
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => {
                const mediaUrl = getMediaUrl(item);
                const title = getMediaTitle(item);
                const selected = textValue === mediaUrl;

                return (
                  <button
                    key={item.id || mediaUrl}
                    type="button"
                    onClick={() => {
                      onChange(mediaUrl);
                      setIsOpen(false);
                    }}
                    className={[
                      "overflow-hidden rounded-xl border bg-white text-left transition hover:border-neutral-400",
                      selected ? "border-neutral-950 ring-2 ring-neutral-950/10" : "border-neutral-200",
                    ].join(" ")}
                  >
                    <span className="block aspect-square bg-neutral-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl} alt={title} className="h-full w-full object-cover" />
                    </span>

                    <span className="block truncate px-2 py-1.5 text-xs font-medium text-neutral-800">
                      {title}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductMetafieldInput({
  field,
  value,
  onChange,
}: {
  field: ProductMetafieldField;
  value: MetafieldValue;
  onChange: (value: MetafieldValue) => void;
}) {
  const textValue = stringifyValue(value);

  if (field.type === "page_picker") {
  return (
  <PageReferenceInput
  fieldKey={field.key}
  value={value}
  placeholder={field.placeholder}
  onChange={onChange}
/>
  );
}

if (field.type === "category_list_picker") {
  return (
    <CategoryListPickerInput
      value={value}
      placeholder={field.placeholder}
      onChange={onChange}
    />
  );
}

if (field.type === "collection_picker") {
  return (
    <CategoryPickerInput
      label={field.label}
      value={value}
      placeholder={field.placeholder}
      onChange={onChange}
    />
  );
}

if (field.type === "attribute_option_picker") {
  return (
    <AttributeOptionPickerInput
      attributeKey={field.attributeKey || field.key}
      value={value}
      placeholder={field.placeholder}
      onChange={onChange}
    />
  );
}

if (field.type === "media_picker") {
  return (
    <MediaPickerInput
      value={value}
      placeholder={field.placeholder}
      onChange={onChange}
    />
  );
}

  if (field.type === "product_picker") {
    return (
      <ProductReferenceInput
        label={field.label}
        value={value}
        placeholder={field.placeholder}
        multiple
        onChange={onChange}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        rows={3}
      className="h-10 w-full rounded-xl border border-neutral-200 bg-[#fbfaf8] px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 focus:bg-white"
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-[#fbfaf8] px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white"
      >
        {(field.options || [""]).map((option) => (
          <option key={option || "blank"} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      value={textValue}
      onChange={(event) =>
        onChange(
          field.type === "tags"
            ? parseTags(event.target.value)
            : event.target.value
        )
      }
      placeholder={field.placeholder}
    className="h-10 w-full rounded-xl border border-neutral-200 bg-[#fbfaf8] px-3 text-[13px] text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:bg-white focus:border-neutral-950 focus:bg-white"
    />
  );
}

function ColorAttributeSelect({
  value,
  onChange,
  onColorSelect,
}: {
  value: MetafieldValue;
  onChange: (value: MetafieldValue) => void;
  onColorSelect?: (color: { color: string; colorHex: string }) => void;
}) {
  const [options, setOptions] = useState<ColorPresetOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textValue = stringifyValue(value);
  const selectedOption = options.find(
    (option) =>
      option.colorHex.toLowerCase() === textValue.toLowerCase() ||
      option.label.toLowerCase() === textValue.toLowerCase() ||
      option.value.toLowerCase() === textValue.toLowerCase()
  );

  const selectedHex = selectedOption?.colorHex || normalizeHexValue(textValue);
  const selectedLabel = selectedOption?.label || "";

  useEffect(() => {
    let ignore = false;

    async function loadColors() {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchColorPresetOptions();

        if (!ignore) {
          setOptions(result);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Color options load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadColors();

    return () => {
      ignore = true;
    };
  }, []);

  function handleSelect(optionValue: string) {
    const option = options.find((item) => item.value === optionValue);

    if (!option) {
      onChange("");
      onColorSelect?.({
        color: "",
        colorHex: "",
      });
      return;
    }

   onChange(option.label);

onColorSelect?.({
  color: option.label,
  colorHex: option.colorHex,
});
  }

 function handleManualHex(nextHex: string) {
  onChange(nextHex);

  if (/^#[0-9a-f]{6}$/i.test(nextHex)) {
    const matchedOption = options.find(
      (option) => option.colorHex.toLowerCase() === nextHex.toLowerCase()
    );

    onColorSelect?.({
      color: matchedOption?.label || nextHex,
      colorHex: nextHex.toLowerCase(),
    });
  }
}

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_170px]">
        <div className="relative">
          <select
            value={selectedOption?.value || ""}
            onChange={(event) => handleSelect(event.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-10 text-sm outline-none transition focus:border-neutral-950"
          >
            <option value="">
              {isLoading ? "Loading colors..." : "Select saved color"}
            </option>

            {options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label} · {option.colorHex}
              </option>
            ))}
          </select>

          <div
            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-neutral-300"
            style={{
              backgroundColor: selectedHex || "#ffffff",
            }}
          />
        </div>

        <input
          value={textValue}
          onChange={(event) => handleManualHex(event.target.value)}
          placeholder="#c4abab"
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
        />
      </div>

      {selectedOption ? (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span
            className="h-4 w-4 rounded-full border border-neutral-300"
            style={{ backgroundColor: selectedOption.colorHex }}
          />
          <span>
            Selected:{" "}
            <span className="font-medium text-neutral-800">
              {selectedOption.label}
            </span>{" "}
            {selectedOption.colorHex}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        <p className="text-xs text-neutral-400">
          Saved colors Attributes → Color options se aa rahe hain. New color ho
          to hex manually daalo.
        </p>
      )}
    </div>
  );
}

function DynamicCategoryMetafieldInput({
  definition,
  value,
  onChange,
  onColorSelect,
}: {
  definition: CategoryMetafieldDefinition;
  value: MetafieldValue;
  onChange: (value: MetafieldValue) => void;
  onColorSelect?: (color: { color: string; colorHex: string }) => void;
}) {
  const textValue = stringifyValue(value);
  const options = normalizeOptions(definition.options);

  if (definition.type === "multi_line_text") {
    return (
      <textarea
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={definition.placeholder || undefined}
        rows={3}
        className="min-h-[84px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (definition.type === "single_select") {
    return (
      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (definition.type === "multi_select") {
    const selected = getStringArrayValue(value);

    if (options.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-2">
          {options.map((option) => {
            const checked = selected.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (checked) {
                    onChange(selected.filter((item) => item !== option));
                    return;
                  }

                  onChange([...selected, option]);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  checked
                    ? "bg-neutral-950 text-white ring-neutral-950"
                    : "bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-400"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <input
        value={textValue}
        onChange={(event) => onChange(parseTags(event.target.value))}
        placeholder={definition.placeholder || "Comma separated values"}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (definition.type === "number") {
    return (
      <input
        type="number"
        value={textValue}
        onChange={(event) =>
          onChange(event.target.value === "" ? "" : Number(event.target.value))
        }
        placeholder={definition.placeholder || undefined}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (definition.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        Enabled
      </label>
    );
  }

if (isColorMetafield(definition)) {
  return (
    <ColorAttributeSelect
      value={value}
      onChange={onChange}
      onColorSelect={onColorSelect}
    />
  );
}

  if (definition.type === "url") {
    return (
      <input
        type="url"
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={definition.placeholder || "https://example.com"}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (definition.type === "product_reference") {
    return (
      <ProductReferenceInput
        label={definition.label}
        value={value}
        placeholder={definition.placeholder}
        multiple={false}
        onChange={onChange}
      />
    );
  }

  if (definition.type === "list_product_reference") {
    return (
      <ProductReferenceInput
        label={definition.label}
        value={value}
        placeholder={definition.placeholder}
        multiple
        onChange={onChange}
      />
    );
  }

  return (
    <input
      value={textValue}
      onChange={(event) => onChange(event.target.value)}
      placeholder={definition.placeholder || undefined}
      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
    />
  );
}

function TaxonomySearchModal({
  selectedTaxonomyId,
  onSelect,
  onClose,
}: {
  selectedTaxonomyId?: string;
  onSelect: (taxonomy: TaxonomyCategory) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
 
  const [items, setItems] = useState<TaxonomyCategory[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

  const [pendingTaxonomy, setPendingTaxonomy] =
  useState<TaxonomyCategory | null>(null);

  const [currentParent, setCurrentParent] = useState<TaxonomyCategory | null>(
  null
);
const [breadcrumb, setBreadcrumb] = useState<TaxonomyCategory[]>([]);
const [isBrowseMode, setIsBrowseMode] = useState(true);

  const hasMore = page < totalPages;


  

async function loadRootCategories() {
  const result = await getTaxonomyRootCategories({
    apiRootUrl: getApiRootUrl(),
    token: getToken(),
  });

  setCurrentParent(null);
  setBreadcrumb([]);
  setItems(result.items);
  setPage(1);
  setTotal(result.items.length);
  setTotalPages(1);
}

async function loadChildren(parent: TaxonomyCategory) {
  const result = await getTaxonomyCategoryChildren({
    apiRootUrl: getApiRootUrl(),
    taxonomyId: parent.taxonomyId,
    token: getToken(),
  });

  setCurrentParent(parent);
  setBreadcrumb((previous) => [...previous, parent]);
  setItems(result.items);
  setPage(1);
  setTotal(result.items.length);
  setTotalPages(1);
}

async function goBackOneLevel() {
  const nextBreadcrumb = breadcrumb.slice(0, -1);
  const previousParent = nextBreadcrumb[nextBreadcrumb.length - 1] || null;

  setBreadcrumb(nextBreadcrumb);
  setCurrentParent(previousParent);

  if (!previousParent) {
    await loadRootCategories();
    return;
  }

  const result = await getTaxonomyCategoryChildren({
    apiRootUrl: getApiRootUrl(),
    taxonomyId: previousParent.taxonomyId,
    token: getToken(),
  });

  setItems(result.items);
  setPage(1);
  setTotal(result.items.length);
  setTotalPages(1);
}
  async function loadTaxonomies({
    nextPage,
    append,
    query,
  }: {
    nextPage: number;
    append: boolean;
    query: string;
  }) {
    const normalizedSearch = query.replace(/\s+in\s+.+$/i, "").trim();

    const result = await searchTaxonomyCategories({
      apiRootUrl: getApiRootUrl(),
      search: normalizedSearch,
      page: nextPage,
      limit: 20,
      token: getToken(),
    });

    setItems((previous) => {
      if (!append) return result.items;

      const existingIds = new Set(previous.map((item) => item.taxonomyId));
      const uniqueNextItems = result.items.filter(
        (item) => !existingIds.has(item.taxonomyId)
      );

      return [...previous, ...uniqueNextItems];
    });

    setPage(result.page);
    setTotal(result.total);
    setTotalPages(result.totalPages);
  }

useEffect(() => {
  let ignore = false;

  const timeout = window.setTimeout(async () => {
    try {
      setIsLoading(true);
      setTaxonomyError(null);

      const normalizedSearch = search.replace(/\s+in\s+.+$/i, "").trim();

      if (!normalizedSearch) {
        setIsBrowseMode(true);

        const result = await getTaxonomyRootCategories({
          apiRootUrl: getApiRootUrl(),
          token: getToken(),
        });

        if (ignore) return;

        setCurrentParent(null);
        setBreadcrumb([]);
        setItems(result.items);
        setPage(1);
        setTotal(result.items.length);
        setTotalPages(1);
        return;
      }

      setIsBrowseMode(false);
      setCurrentParent(null);
      setBreadcrumb([]);

      const result = await searchTaxonomyCategories({
        apiRootUrl: getApiRootUrl(),
        search: normalizedSearch,
        page: 1,
        limit: 20,
        token: getToken(),
      });

      if (ignore) return;

      setItems(result.items);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (!ignore) {
        setTaxonomyError(
          error instanceof Error
            ? error.message
            : "Taxonomy categories load failed."
        );
      }
    } finally {
      if (!ignore) {
        setIsLoading(false);
      }
    }
  }, 300);

  return () => {
    ignore = true;
    window.clearTimeout(timeout);
  };
}, [search]);

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      setTaxonomyError(null);

      await loadTaxonomies({
        nextPage: page + 1,
        append: true,
        query: search,
      });
    } catch (error) {
      setTaxonomyError(
        error instanceof Error
          ? error.message
          : "More taxonomy categories load failed."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">
              Select category
            </h3>
            <p className="text-xs text-neutral-500">
              Backend taxonomy se category search karo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 p-4">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search taxonomy categories"
              className="h-full flex-1 bg-transparent text-sm outline-none"
            />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : null}
          </div>
{isBrowseMode && breadcrumb.length > 0 ? (
  <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
    <div className="min-w-0 text-xs text-neutral-500">
      Browsing:{" "}
      <span className="font-medium text-neutral-800">
        {breadcrumb
          .map((item) => item.name || item.label || item.taxonomyId)
          .join(" / ")}
      </span>
    </div>

    <button
      type="button"
      onClick={goBackOneLevel}
      className="shrink-0 text-xs font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
    >
      Back
    </button>
  </div>
) : null}
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
            <span>
              {total > 0
                ? `${items.length} of ${total} categories loaded`
                : "Search or browse taxonomy categories"}
            </span>

            {totalPages > 1 ? (
              <span>
                Page {page} of {totalPages}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {taxonomyError ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {taxonomyError}
            </div>
          ) : null}

          {!taxonomyError && isLoading && items.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading categories...
            </div>
          ) : null}

          {!taxonomyError && !isLoading && items.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-neutral-500">
              No taxonomy categories found.
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="divide-y divide-neutral-200">
             {items.map((taxonomy) => {
  const selected =
    taxonomy.taxonomyId ===
    (pendingTaxonomy?.taxonomyId || selectedTaxonomyId);

  return (
                  <button
                    key={taxonomy.taxonomyId}
                    type="button"
    onClick={async () => {
  setPendingTaxonomy(taxonomy);

  if (isBrowseMode && taxonomy.isLeaf === false) {
    try {
      setIsLoading(true);
      setTaxonomyError(null);
      await loadChildren(taxonomy);
    } catch (error) {
      setTaxonomyError(
        error instanceof Error
          ? error.message
          : "Child categories load failed."
      );
    } finally {
      setIsLoading(false);
    }
  }
}}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-neutral-50"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white"
                      }`}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-neutral-950">
                        {getTaxonomyDisplayLabel(taxonomy)}
                      </span>

                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {taxonomy.fullPath || taxonomy.taxonomyId}
                      </span>
                    </span>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {taxonomy.metafieldCount !== undefined &&
                      taxonomy.metafieldCount !== null ? (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                          {taxonomy.metafieldCount} metafields
                        </span>
                      ) : null}

                      {taxonomy.isLeaf ? (
                        <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                          Leaf
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                          Parent
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {items.length > 0 && hasMore ? (
            <div className="border-t border-neutral-200 p-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-10 w-full rounded-xl"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>Load more categories</>
                )}
              </Button>
            </div>
          ) : null}
        </div>

       <div className="flex h-14 shrink-0 items-center justify-between border-t border-neutral-200 px-5">
  <p className="text-xs text-neutral-500">
   {pendingTaxonomy?.isLeaf === false
  ? "Parent category selected hai. Final leaf category select karo."
  : pendingTaxonomy
    ? `Selected: ${getTaxonomyDisplayLabel(pendingTaxonomy)}`
    : total > 0
      ? `${items.length} loaded out of ${total}`
      : "No category selected"}
  </p>

  <div className="flex items-center gap-2">
    <Button
      type="button"
      variant="outline"
      onClick={onClose}
      className="rounded-xl"
    >
      Cancel
    </Button>

    <Button
      type="button"
      disabled={!pendingTaxonomy || pendingTaxonomy.isLeaf === false}
      onClick={() => {
        if (!pendingTaxonomy) return;

        onSelect(pendingTaxonomy);
        onClose();
      }}
      className="rounded-xl bg-neutral-950 px-5 text-white hover:bg-neutral-800"
    >
      Done
    </Button>
  </div>
</div>
      </div>
    </div>
  );
}


function ShopifyMetafieldRow({
  label,
  description,
  required,
  children,
}: {
  label: string;
  description?: string | null;
  required?: boolean | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-t border-neutral-200/70 px-4 py-3 first:border-t-0 md:grid-cols-[230px_minmax(0,1fr)] md:items-center lg:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-neutral-900">
            {label}
          </p>

          {required ? (
            <span className="text-xs font-semibold text-red-500">*</span>
          ) : null}
        </div>

        {description ? (
          <p className="mt-0.5 truncate text-[11px] leading-4 text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ShopifyMetafieldsHeader({
  title,
  subtitle,
  badge,
  filledCount,
  totalCount,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  filledCount?: number;
  totalCount?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-200/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between lg:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-neutral-950">
            {title}
          </h2>

          {badge ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 ring-1 ring-neutral-200/70">
              {badge}
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-neutral-500">
            {subtitle}
          </p>
        ) : null}

        {filledCount !== undefined && totalCount !== undefined ? (
          <p className="mt-1 text-[11px] font-medium text-neutral-400">
            {filledCount} of {totalCount} fields filled
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function CategoryMetafieldsCard({
  values,
  definitions,
  isLoading,
  error,
  onChange,
}: {
  values: ProductFormValues;
  definitions: CategoryMetafieldDefinition[];
  isLoading: boolean;
  error: string | null;
  onChange: (values: ProductFormValues) => void;
}) {
  const filledCount = useMemo(() => {
    return definitions.filter((definition) => {
      const value = getValue(values, "categoryMetafields", definition.key);

      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;

      if (typeof value === "object") {
  return Boolean(readText(value));
}

      return String(value).trim().length > 0;
    }).length;
  }, [definitions, values]);

  const taxonomyBadge = getTaxonomyLabel(values.taxonomy) || "Category fields";

  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-neutral-200">
      <ShopifyMetafieldsHeader
        title="Category metafields"
        subtitle="Selected taxonomy category ke according backend se dynamic product details."
        badge={taxonomyBadge}
        filledCount={filledCount}
        totalCount={definitions.length}
      />

      {isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center text-sm text-neutral-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading category metafields...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && definitions.length === 0 ? (
        <div className="m-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
          Is taxonomy category ke liye backend se koi active metafield definition nahi aayi.
        </div>
      ) : null}

      {!isLoading && !error && definitions.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {definitions.map((definition) => {
            const value = isColorMetafield(definition)
              ? getValue(values, "categoryMetafields", "color") ||
                getValue(values, "categoryMetafields", definition.key)
              : getValue(values, "categoryMetafields", definition.key);

            return (
              <ShopifyMetafieldRow
                key={definition.key}
                label={definition.label}
                description={definition.description}
                required={definition.isRequired}
              >
                <DynamicCategoryMetafieldInput
                  definition={definition}
                  value={value}
                  onChange={(nextValue) =>
                    updateValue(
                      values,
                      "categoryMetafields",
                      definition.key,
                      nextValue,
                      onChange
                    )
                  }
                  onColorSelect={
                    isColorMetafield(definition)
                      ? (colorOption) => {
                          onChange({
                            ...values,
                            categoryMetafields: {
                              ...(values.categoryMetafields || {}),
                              color: colorOption.color,
                              colorHex: colorOption.colorHex,
                            },
                          });
                        }
                      : undefined
                  }
                />
              </ShopifyMetafieldRow>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ProductMetafieldsCard({
  values,
  onChange,
}: {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
}) {
  const filledCount = useMemo(() => {
    return productMetafieldFields.filter((field) => {
      const value = getValue(values, "productMetafields", field.key);

      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;

      if (typeof value === "object") {
        return Boolean(readText(value));
      }

      return String(value).trim().length > 0;
    }).length;
  }, [values]);

  return (
    <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200">
      <ShopifyMetafieldsHeader
        title="Product metafields"
        subtitle="Product-level content for merchandising, recommendations and extra storefront blocks."
        filledCount={filledCount}
        totalCount={productMetafieldFields.length}
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-9 rounded-full border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-500 shadow-sm"
            >
              View all
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled
              className="h-9 rounded-full border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-500 shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add definition
            </Button>
          </div>
        }
      />

      <div className="divide-y divide-neutral-200/70">
        {productMetafieldFields.map((field) => (
          <ShopifyMetafieldRow
            key={field.key}
            label={field.label}
            description={
              field.type === "product_picker"
                ? "Product reference list"
                : field.type === "collection_picker"
                  ? "Category reference"
                  : field.type === "category_list_picker"
                    ? "Category reference list"
                    : field.type === "page_picker"
                      ? "Page reference"
                      : undefined
            }
          >
            <ProductMetafieldInput
              field={field}
              value={getValue(values, "productMetafields", field.key)}
              onChange={(value) =>
                updateValue(
                  values,
                  "productMetafields",
                  field.key,
                  value,
                  onChange
                )
              }
            />

            {field.type === "tags" ? (
              <p className="mt-1 text-[11px] text-neutral-400">
                Comma separated values use karo.
              </p>
            ) : null}
          </ShopifyMetafieldRow>
        ))}
      </div>
    </section>
  );
}

export function ProductShopifyMetafieldsSection({
  values,
  onChange,
  primaryCategoryLabel,
}: {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  primaryCategoryLabel?: string;
}) {
  const [isTaxonomyModalOpen, setIsTaxonomyModalOpen] = useState(false);
  const [definitions, setDefinitions] = useState<CategoryMetafieldDefinition[]>(
    []
  );
  const [isDefinitionsLoading, setIsDefinitionsLoading] = useState(false);
  const [definitionsError, setDefinitionsError] = useState<string | null>(null);

  const selectedTaxonomyId = values.taxonomyId || values.taxonomy?.taxonomyId || "";
  const selectedTaxonomyLabel = getTaxonomyLabel(values.taxonomy);

  useEffect(() => {
    let ignore = false;

    async function loadDefinitions() {
      if (!selectedTaxonomyId) {
        setDefinitions([]);
        setDefinitionsError(null);
        return;
      }

      try {
        setIsDefinitionsLoading(true);
        setDefinitionsError(null);

        const result = await getTaxonomyCategoryMetafields({
          apiRootUrl: getApiRootUrl(),
          taxonomyId: selectedTaxonomyId,
          token: getToken(),
        });

        if (ignore) return;

        setDefinitions(result.metafields);

        if (result.taxonomy && !values.taxonomy) {
          onChange({
            ...values,
            taxonomy: result.taxonomy,
            taxonomyId: result.taxonomy.taxonomyId || selectedTaxonomyId,
          });
        }
      } catch (error) {
        if (!ignore) {
          setDefinitionsError(
            error instanceof Error
              ? error.message
              : "Category metafield definitions load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsDefinitionsLoading(false);
        }
      }
    }

    loadDefinitions();

    return () => {
      ignore = true;
    };
  }, [selectedTaxonomyId]);

  function handleTaxonomySelect(taxonomy: TaxonomyCategory) {
    const nextDefinitions = definitions;
    const previousCategoryMetafields =
      (values.categoryMetafields as Record<string, MetafieldValue>) || {};

    const shouldKeepValues = taxonomy.taxonomyId === selectedTaxonomyId;

    onChange({
      ...values,
      taxonomyId: taxonomy.taxonomyId,
      taxonomy: {
        id: taxonomy.id || null,
        taxonomyId: taxonomy.taxonomyId,
        name: taxonomy.name || "",
        fullPath: taxonomy.fullPath || "",
        label: getTaxonomyDisplayLabel(taxonomy),
        parentName: taxonomy.parentName || getTaxonomyParentLabel(taxonomy) || null,
        metafieldCount: taxonomy.metafieldCount || null,
      },
      categoryMetafields: shouldKeepValues
        ? cleanCategoryMetafieldsForDefinitions({
            values: previousCategoryMetafields,
            definitions: nextDefinitions,
          })
        : {},
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-neutral-700 shadow-sm ring-1 ring-neutral-200">
              <HelpCircle className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Shopify-style metafields
              </h2>

              <p className="mt-1 max-w-3xl text-sm text-neutral-600">
                Category taxonomy aur category metafields backend se dynamic
                aate hain. Product metafields merchandising aur storefront blocks
                ke liye save hote hain.
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                Admin category:{" "}
                <span className="font-medium text-neutral-900">
                  {primaryCategoryLabel || "Selected category"}
                </span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full text-xs"
            disabled
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Custom field later
          </Button>
        </div>
      </div>

      <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700">
              <Layers3 className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Product taxonomy category
              </h2>

              <p className="mt-0.5 text-xs text-neutral-500">
                Shopify-style taxonomy category select karo. Iske according
                category metafields load honge.
              </p>

              {values.taxonomy?.fullPath ? (
                <p className="mt-1 text-[11px] text-neutral-400">
                  {values.taxonomy.fullPath}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTaxonomyModalOpen(true)}
            className="h-9 rounded-full text-xs"
          >
            {selectedTaxonomyLabel ? "Change category" : "Select category"}
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-4">
          {selectedTaxonomyLabel ? (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800">
              <span className="truncate">{selectedTaxonomyLabel}</span>
              {definitions.length > 0 ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-neutral-500 ring-1 ring-neutral-200">
                  {definitions.length} metafields
                </span>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              Abhi taxonomy category select nahi hui hai.
            </div>
          )}
        </div>
      </section>

      <CategoryMetafieldsCard
        values={values}
        definitions={definitions}
        isLoading={isDefinitionsLoading}
        error={definitionsError}
        onChange={onChange}
      />

      <ProductMetafieldsCard values={values} onChange={onChange} />

      {isTaxonomyModalOpen ? (
        <TaxonomySearchModal
          selectedTaxonomyId={selectedTaxonomyId}
          onSelect={handleTaxonomySelect}
          onClose={() => setIsTaxonomyModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
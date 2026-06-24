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

type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

type ProductFieldType =
  | "text"
  | "textarea"
  | "tags"
  | "select"
  | "product_picker"
  | "collection_picker";

type ProductMetafieldField = {
  key: string;
  label: string;
  type: ProductFieldType;
  placeholder?: string;
  options?: string[];
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

type CollectionPickerItem = {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  type?: string | null;
  collectionType?: string | null;
  isActive?: boolean | null;
  productsCount?: number | null;
  productCount?: number | null;
};

type CollectionPickerApiResponse = {
  success?: boolean;
  data?:
    | CollectionPickerItem[]
    | {
        items?: CollectionPickerItem[];
        collections?: CollectionPickerItem[];
        data?: CollectionPickerItem[];
        meta?: unknown;
        total?: number;
      };
  items?: CollectionPickerItem[];
  collections?: CollectionPickerItem[];
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
  hex?: string | null;
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

const productMetafieldFields: ProductMetafieldField[] = [
  {
    key: "productFaqs",
    label: "Product FAQs",
    type: "textarea",
    placeholder: "Add product FAQs",
  },
  {
    key: "careInstructions",
    label: "Care & Instructions",
    type: "text",
    placeholder: "Dry clean only",
  },
  {
    key: "compositionOrigin",
    label: "Composition & Origin",
    type: "text",
    placeholder: "Made in India. Fabric: premium silk blend.",
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
    type: "text",
    placeholder: "Shahida",
  },
{
  key: "primaryCollection",
  label: "Primary collection",
  type: "collection_picker",
  placeholder: "Select primary collection",
},
{
  key: "secondaryCollection",
  label: "Secondary collection",
  type: "collection_picker",
  placeholder: "Select secondary collection",
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
    type: "text",
    placeholder: "Bridal",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "text",
    placeholder: "Silk Blend",
  },
  {
    key: "print",
    label: "Print",
    type: "text",
    placeholder: "Solid",
  },
  {
    key: "printSwatch",
    label: "Print Swatch",
    type: "text",
    placeholder: "https://cdn.example.com/swatches/silk-solid.jpg",
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


function extractCollectionItems(data: CollectionPickerApiResponse | null) {
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.collections)) return data.collections;

  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.collections)) return data.data.collections;
    if (Array.isArray(data.data.data)) return data.data.data;
  }

  return [];
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
    <div className="rounded-xl border border-neutral-200 bg-white">
      {!isEditorOpen ? (
        <button
          type="button"
          onClick={openEditor}
          className="grid w-full grid-cols-[220px_1fr] items-center gap-4 px-4 py-3 text-left transition hover:bg-neutral-50"
        >
          <div>
            <p className="text-sm font-medium text-neutral-950">{label}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Product {multiple ? "(List)" : ""}
            </p>
          </div>

          <div className="min-w-0">
            {selectedIds.length > 0 ? (
              <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 py-1.5">
                {selectedIds.slice(0, 4).map((id) => {
                  const product = selectedProductsById[id];
                  const title = product ? getProductTitle(product) : id;
                  const image = product ? getProductImage(product) : "";

                  return (
                    <span
                      key={id}
                      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md bg-neutral-100 px-1.5 py-1 text-sm text-neutral-900"
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
            <div>
              <p className="text-sm font-medium text-neutral-950">{label}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Product {multiple ? "(List)" : ""}
              </p>
            </div>

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

          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
            <p className="text-[11px] text-neutral-400">
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


function CollectionPickerInput({
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
  const [collections, setCollections] = useState<CollectionPickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const textValue = stringifyValue(value);

  const selectedCollection = collections.find(
    (collection) => getCollectionValue(collection) === textValue
  );

  const currentValueMissing =
    Boolean(textValue) &&
    !collections.some(
      (collection) => getCollectionValue(collection) === textValue
    );

  async function loadCollections() {
    try {
      setIsLoading(true);
      setPickerError(null);

      const items = await fetchCollectionPickerItems();

      setCollections(items);
    } catch (error) {
      setCollections([]);
      setPickerError(
        error instanceof Error
          ? error.message
          : "Collections load failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialCollections() {
      try {
        setIsLoading(true);
        setPickerError(null);

        const items = await fetchCollectionPickerItems();

        if (ignore) return;

        setCollections(items);
      } catch (error) {
        if (!ignore) {
          setCollections([]);
          setPickerError(
            error instanceof Error
              ? error.message
              : "Collections load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialCollections();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-950">{label}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Collection slug backend me save hoga.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCollections}
          disabled={isLoading}
          className="w-fit rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
        className="mt-3 h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-[#fbfaf6] px-3 text-sm font-medium text-neutral-950 outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">
          {isLoading ? "Loading collections..." : placeholder || "Select collection"}
        </option>

        {currentValueMissing ? (
          <option value={textValue}>Current saved: {textValue}</option>
        ) : null}

        {collections.map((collection) => {
          const optionValue = getCollectionValue(collection);
          const optionLabel = getCollectionLabel(collection);
          const typeLabel = getCollectionTypeLabel(collection);
          const statusLabel = getCollectionStatusLabel(collection);
          const count = getCollectionProductsCount(collection);

          return (
            <option key={collection.id || optionValue} value={optionValue}>
              {optionLabel} — {typeLabel} / {statusLabel}
              {count ? ` / ${count} products` : ""}
            </option>
          );
        })}
      </select>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {selectedCollection ? (
          <>
            <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              {getCollectionLabel(selectedCollection)}
            </span>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700 ring-1 ring-sky-100">
              {getCollectionTypeLabel(selectedCollection)}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
              {getCollectionStatusLabel(selectedCollection)}
            </span>
          </>
        ) : textValue ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">
            Saved old value: {textValue}
          </span>
        ) : (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
            No collection selected
          </span>
        )}

        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-500">
          {collections.length} collections loaded
        </span>
      </div>

      {textValue ? (
        <p className="mt-2 text-xs text-neutral-400">
          Saved slug:{" "}
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

  if (field.type === "collection_picker") {
  return (
    <CollectionPickerInput
      label={field.label}
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
        className="min-h-[84px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
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
      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
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

      return String(value).trim().length > 0;
    }).length;
  }, [definitions, values]);

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700">
          <Layers3 className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Category metafields
          </h2>

          <p className="mt-0.5 text-xs text-neutral-500">
            Selected taxonomy category ke according backend se dynamic fields.
          </p>

          <p className="mt-1 text-[11px] text-neutral-400">
            {filledCount} of {definitions.length} fields filled
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading category metafields...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && definitions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
          Is taxonomy category ke liye backend se koi active metafield definition
          nahi aayi.
        </div>
      ) : null}

      {!isLoading && !error && definitions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {definitions.map((definition) => (
            <div
              key={definition.key}
              className={
                definition.type === "multi_line_text" ||
                definition.type === "product_reference" ||
                definition.type === "list_product_reference"
                  ? "space-y-1.5 md:col-span-2"
                  : "space-y-1.5"
              }
            >
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {definition.label}
                {definition.isRequired ? (
                  <span className="ml-1 text-red-500">*</span>
                ) : null}
              </label>

            <DynamicCategoryMetafieldInput
  definition={definition}
  value={
  isColorMetafield(definition)
    ? getValue(values, "categoryMetafields", "color") ||
      getValue(values, "categoryMetafields", definition.key)
    : getValue(values, "categoryMetafields", definition.key)
}
  onChange={(value) =>
    updateValue(
      values,
      "categoryMetafields",
      definition.key,
      value,
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

              {definition.description ? (
                <p className="text-[11px] text-neutral-400">
                  {definition.description}
                </p>
              ) : null}
            </div>
          ))}
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

      return String(value).trim().length > 0;
    }).length;
  }, [values]);

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700">
          <Tags className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Product metafields
          </h2>

          <p className="mt-0.5 text-xs text-neutral-500">
            Product-level content for merchandising, recommendations and extra
            storefront blocks.
          </p>

          <p className="mt-1 text-[11px] text-neutral-400">
            {filledCount} of {productMetafieldFields.length} fields filled
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {productMetafieldFields.map((field) => (
          <div
            key={field.key}
            className={
              field.type === "textarea" || field.type === "product_picker"
                ? "space-y-1.5 md:col-span-2"
                : "space-y-1.5"
            }
          >
         {field.type !== "product_picker" ? (
  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
    {field.label}
  </label>
) : null}

            <ProductMetafieldInput
              field={field}
              value={getValue(values, "productMetafields", field.key)}
              onChange={(value) =>
                updateValue(values, "productMetafields", field.key, value, onChange)
              }
            />

            {field.type === "tags" ? (
              <p className="text-[11px] text-neutral-400">
                Comma separated values use karo.
              </p>
            ) : null}
          </div>
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
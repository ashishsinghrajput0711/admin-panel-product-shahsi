"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HelpCircle,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "./product-schema";

type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

type FieldType = "text" | "textarea" | "tags" | "select";

type MetafieldField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
};

type CategoryPickerItem = {
  id: string;
  name: string;
  slug: string;
  path?: string | null;
  label: string;
  level?: number | null;
  isActive?: boolean | null;
  productSourceType?: string | null;
  productCount?: number | null;
  children?: CategoryPickerItem[];
};

type CategoryTreeNode = {
  id?: string;
  name?: string;
  slug?: string;
  path?: string | null;
  level?: number | null;
  isActive?: boolean | null;
  productSourceType?: string | null;
  productCount?: number | null;
  children?: CategoryTreeNode[];
};

type CategoryTreeResponse = {
  success?: boolean;
  data?:
    | CategoryTreeNode[]
    | {
        data?: CategoryTreeNode[];
        categories?: CategoryTreeNode[];
      };
  categories?: CategoryTreeNode[];
  error?: unknown;
  message?: string | string[];
};

const categoryMetafieldFields: MetafieldField[] = [
  {
    key: "color",
    label: "Color",
    type: "text",
    placeholder: "Dusty Rose",
  },
  {
    key: "size",
    label: "Size",
    type: "tags",
    placeholder: "S, M, L, XL, Custom",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "text",
    placeholder: "Cotton",
  },
  {
    key: "ageGroup",
    label: "Age group",
    type: "select",
    options: ["", "Adults", "Kids", "Teens", "Unisex"],
  },
  {
    key: "careInstructions",
    label: "Care instructions",
    type: "text",
    placeholder: "Dry clean only",
  },
  {
    key: "clothingFeatures",
    label: "Clothing features",
    type: "tags",
    placeholder: "Breathable, Lightweight",
  },
  {
    key: "dressOccasion",
    label: "Dress occasion",
    type: "tags",
    placeholder: "Casual, Everyday",
  },
  {
    key: "dressStyle",
    label: "Dress style",
    type: "text",
    placeholder: "Flared",
  },
  {
    key: "neckline",
    label: "Neckline",
    type: "text",
    placeholder: "V-neck",
  },
  {
    key: "skirtDressLengthType",
    label: "Skirt/Dress length type",
    type: "text",
    placeholder: "Mini",
  },
  {
    key: "sleeveLengthType",
    label: "Sleeve length type",
    type: "text",
    placeholder: "Sleeveless",
  },
  {
    key: "targetGender",
    label: "Target gender",
    type: "select",
    options: ["", "Female", "Male", "Unisex"],
  },
  {
    key: "topLengthType",
    label: "Top length type",
    type: "text",
    placeholder: "Crop",
  },
];

const productMetafieldFields: MetafieldField[] = [
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
    placeholder: "Care instructions Cotton",
  },
  {
    key: "compositionOrigin",
    label: "Composition & Origin",
    type: "text",
    placeholder: "Cotton Composition & Origin",
  },
  {
    key: "customBadge",
    label: "Custom Badge",
    type: "text",
    placeholder: "Preorder / New / Limited",
  },
  {
    key: "seeMoreFrom",
    label: "See More from",
    type: "tags",
    placeholder: "Tiered Dress, Mini Dresses for Women",
  },
  {
    key: "primaryCollection",
    label: "Primary category",
    type: "text",
    placeholder: "Select primary category",
  },
  {
    key: "secondaryCollection",
    label: "Secondary category",
    type: "text",
    placeholder: "Select secondary category",
  },
  {
    key: "advancedProductTitle",
    label: "Advanced Product Title",
    type: "text",
    placeholder: "Travel-Ready Dusty Rose Gathered Waist Mini Dress",
  },
  {
    key: "similarColorProducts",
    label: "Similar Color Products",
    type: "tags",
    placeholder: "Blush Pink, Dusty Rose",
  },
  {
    key: "matchWithAccessories",
    label: "Match with Accessories",
    type: "tags",
    placeholder: "Clutch, Earrings, Sandals",
  },
  {
    key: "similarStyleProduct",
    label: "Similar Style Product",
    type: "text",
    placeholder: "Day Dresses",
  },
  {
    key: "style",
    label: "Style",
    type: "text",
    placeholder: "Day Dresses",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "text",
    placeholder: "Cotton",
  },
  {
    key: "print",
    label: "Print",
    type: "text",
    placeholder: "Solid Color",
  },
  {
    key: "printSwatch",
    label: "Print Swatch",
    type: "text",
    placeholder: "Swatch URL or label",
  },
  {
    key: "similarPrintTitle",
    label: "Similar Print Title",
    type: "text",
    placeholder: "Similar prints",
  },
  {
    key: "similarPrintProducts",
    label: "Similar Print Products",
    type: "tags",
    placeholder: "Product handles or titles",
  },
  {
    key: "disclosures",
    label: "Disclosures",
    type: "textarea",
    placeholder: "Any disclosure text",
  },
];

function getApiRootUrl() {
  return "/api/proxy";
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

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fallbackMessage}. Backend ne JSON response nahi diya.`);
  }
}

function getApiErrorMessage(data: CategoryTreeResponse, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (Array.isArray(record.message)) return record.message.join(", ");
    if (typeof record.message === "string") return record.message;
  }

  return fallback;
}

function extractCategoryTree(response: CategoryTreeResponse) {
  if (Array.isArray(response.data)) return response.data;

  if (response.data && typeof response.data === "object") {
    if (Array.isArray(response.data.data)) return response.data.data;
    if (Array.isArray(response.data.categories)) return response.data.categories;
  }

  if (Array.isArray(response.categories)) return response.categories;

  return [];
}

async function fetchCategoryTree() {
  const params = new URLSearchParams();

  params.set("includeInactive", "true");
  params.set("showProductCount", "true");
  params.set("showEmpty", "true");
  params.set("maxDepth", "10");

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/categories/tree?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseApiResponse<CategoryTreeResponse>(
    response,
    "Category tree API JSON response nahi de rahi",
  );

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Category tree load failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return extractCategoryTree(json);
}

function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  parentPath = "",
): CategoryPickerItem[] {
  const result: CategoryPickerItem[] = [];

  nodes.forEach((node) => {
    const id = String(node.id || node.slug || "").trim();
    const name = String(node.name || node.slug || "Untitled category").trim();
    const slug = String(node.slug || "").trim();

    if (!id || !slug) return;

    const path = String(node.path || parentPath || slug).trim();
    const indent = depth > 0 ? `${"— ".repeat(depth)}` : "";

    result.push({
      id,
      name,
      slug,
      path,
      label: `${indent}${name}`,
      level: node.level ?? depth + 1,
      isActive: node.isActive,
      productSourceType: node.productSourceType,
      productCount: node.productCount,
      children: [],
    });

    if (Array.isArray(node.children) && node.children.length) {
      result.push(...flattenCategoryTree(node.children, depth + 1, path));
    }
  });

  return result;
}

function getCategoryValue(category: CategoryPickerItem) {
  return String(category.path || category.slug || "").trim();
}

function getCategoryBadge(category: CategoryPickerItem) {
  const source = String(category.productSourceType || "MANUAL").toUpperCase();
  const status = category.isActive === false ? "INACTIVE" : "ACTIVE";
  const count =
    typeof category.productCount === "number"
      ? `${category.productCount} products`
      : "products";

  return `${source} / ${status} / ${count}`;
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
  key: string,
) {
  const groupValue = values[group] as Record<string, MetafieldValue> | undefined;
  return groupValue?.[key];
}

function updateValue(
  values: ProductFormValues,
  group: "categoryMetafields" | "productMetafields",
  key: string,
  value: MetafieldValue,
  onChange: (values: ProductFormValues) => void,
) {
  onChange({
    ...values,
    [group]: {
      ...(values[group] || {}),
      [key]: value,
    },
  });
}

function MetafieldInput({
  field,
  value,
  onChange,
}: {
  field: MetafieldField;
  value: MetafieldValue;
  onChange: (value: MetafieldValue) => void;
}) {
  const textValue = stringifyValue(value);

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
            : event.target.value,
        )
      }
      placeholder={field.placeholder}
      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
    />
  );
}

function CategoryReferenceInput({
  field,
  value,
  categories,
  isLoading,
  error,
  onRefresh,
  onChange,
}: {
  field: MetafieldField;
  value: MetafieldValue;
  categories: CategoryPickerItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onChange: (value: MetafieldValue) => void;
}) {
  const textValue = stringifyValue(value);

  const selectedCategory = categories.find(
    (category) => getCategoryValue(category) === textValue,
  );

  const savedValueMissing =
    Boolean(textValue) &&
    !categories.some((category) => getCategoryValue(category) === textValue);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            {field.label}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Category path/slug backend me save hoga.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
        className="h-11 w-full rounded-xl border border-neutral-200 bg-[#fbfaf6] px-3 text-sm font-medium text-neutral-950 outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        <option value="">
          {isLoading ? "Loading categories..." : field.placeholder}
        </option>

        {savedValueMissing ? (
          <option value={textValue}>Current saved: {textValue}</option>
        ) : null}

        {categories.map((category) => {
          const optionValue = getCategoryValue(category);

          return (
            <option key={category.id || optionValue} value={optionValue}>
              {category.label} — {getCategoryBadge(category)}
            </option>
          );
        })}
      </select>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {selectedCategory ? (
          <>
            <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
              {selectedCategory.name}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-emerald-100">
              {getCategoryBadge(selectedCategory)}
            </span>
          </>
        ) : textValue ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
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
        <p className="mt-2 text-xs text-neutral-400">
          Saved category path/slug:{" "}
          <span className="font-mono font-semibold text-neutral-700">
            {textValue}
          </span>
        </p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function MetafieldSectionCard({
  icon,
  title,
  subtitle,
  fields,
  values,
  group,
  onChange,
  rightSlot,
  categoryOptions,
  isCategoryLoading,
  categoryError,
  onRefreshCategories,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  fields: MetafieldField[];
  values: ProductFormValues;
  group: "categoryMetafields" | "productMetafields";
  onChange: (values: ProductFormValues) => void;
  rightSlot?: React.ReactNode;
  categoryOptions?: CategoryPickerItem[];
  isCategoryLoading?: boolean;
  categoryError?: string | null;
  onRefreshCategories?: () => void;
}) {
  const filledCount = useMemo(() => {
    return fields.filter((field) => {
      const value = getValue(values, group, field.key);
      if (Array.isArray(value)) return value.length > 0;
      return String(value || "").trim().length > 0;
    }).length;
  }, [fields, group, values]);

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700">
            {icon}
          </div>

          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              {filledCount} of {fields.length} fields filled
            </p>
          </div>
        </div>

        {rightSlot}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const isCategoryReferenceField =
            group === "productMetafields" &&
            (field.key === "primaryCollection" ||
              field.key === "secondaryCollection");

          return (
            <div
              key={field.key}
              className={
                isCategoryReferenceField
                  ? "space-y-1.5 md:col-span-1"
                  : "space-y-1.5"
              }
            >
              {!isCategoryReferenceField ? (
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  {field.label}
                </label>
              ) : null}

              {isCategoryReferenceField ? (
                <CategoryReferenceInput
                  field={field}
                  value={getValue(values, group, field.key)}
                  categories={categoryOptions || []}
                  isLoading={Boolean(isCategoryLoading)}
                  error={categoryError || null}
                  onRefresh={onRefreshCategories || (() => undefined)}
                  onChange={(value) =>
                    updateValue(values, group, field.key, value, onChange)
                  }
                />
              ) : (
                <MetafieldInput
                  field={field}
                  value={getValue(values, group, field.key)}
                  onChange={(value) =>
                    updateValue(values, group, field.key, value, onChange)
                  }
                />
              )}
            </div>
          );
        })}
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
  const [categoryOptions, setCategoryOptions] = useState<CategoryPickerItem[]>(
    [],
  );
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setIsCategoryLoading(true);
      setCategoryError(null);

      const tree = await fetchCategoryTree();
      const options = flattenCategoryTree(tree);

      setCategoryOptions(options);
    } catch (error) {
      setCategoryOptions([]);
      setCategoryError(
        error instanceof Error
          ? error.message
          : "Categories load nahi ho paayi.",
      );
    } finally {
      setIsCategoryLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="space-y-4">
      <MetafieldSectionCard
        icon={<Layers3 className="h-4 w-4" />}
        title="Category metafields"
        subtitle="Category based filter/search fields. Ye selected category ke context me use honge."
        fields={categoryMetafieldFields}
        values={values}
        group="categoryMetafields"
        onChange={onChange}
        rightSlot={
          <div className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600">
            {primaryCategoryLabel || "Selected category"}
          </div>
        }
      />

      <MetafieldSectionCard
        icon={<Tags className="h-4 w-4" />}
        title="Product metafields"
        subtitle="Additional Shopify-style product details for merchandising, SEO, categories and recommendations."
        fields={productMetafieldFields}
        values={values}
        group="productMetafields"
        onChange={onChange}
        categoryOptions={categoryOptions}
        isCategoryLoading={isCategoryLoading}
        categoryError={categoryError}
        onRefreshCategories={loadCategories}
        rightSlot={
          <Button type="button" variant="outline" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add definition
          </Button>
        }
      />

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Category metafields category-level data hain. Product metafields
          product-specific data hain. Primary/Secondary category fields me ab
          collection API nahi, category tree use ho raha hai. Existing product
          fields ko touch nahi kiya gaya hai.
        </p>
      </div>
    </div>
  );
}
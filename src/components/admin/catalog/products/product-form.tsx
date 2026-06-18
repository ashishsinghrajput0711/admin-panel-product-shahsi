"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";

import { ProductShopifyMetafieldsSection } from "@/components/admin/catalog/products/product-shopify-metafields-section";

import { ProductMediaSection } from "@/components/admin/catalog/products/product-media-section";
import type { ProductMediaItem } from "@/lib/admin/product-media-upload";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code2,
  Eraser,
  Eye,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PaintBucket,
  Pilcrow,
  Quote,
  Redo2,
  Search,
  Settings2,
  Sparkles,
  Strikethrough,
  Table2,
  Tag,
  Type,
  UnderlineIcon,
  Undo2,
  Unlink,
  Upload,
  Video,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Youtube } from "@tiptap/extension-youtube";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "./product-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const commerceTypeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "Made-to-Order",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  path?: string | null;
  breadcrumb?: string[];
  level?: number;
  productCount?: number;
  isActive?: boolean;
  children?: CategoryNode[];
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  path: string;
  label: string;
  level: number;
  productCount?: number;
  isActive?: boolean;
};

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  if (!rawUrl) throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");

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

function getDefaultFormValues(
  defaultValues?: Partial<ProductFormValues>
): ProductFormValues {
  return {
    name: "",
    sku: "",
    slug: "",
    description: "",
    shortDescription: "",
    brand: "",
   categoryId: "",
subcategoryId: "",
categories: [],
    businessType: "SHAHSI",
    commerceTypes: ["RETAIL"],
    productType: "DRESS",
    status: "DRAFT",
    price: 0,
    salePrice: undefined,
  seoTitle: "",
seoDescription: "",
productMetafields: {},
categoryMetafields: {},
...defaultValues,
  };
}

function extractCategoryTree(response: unknown): CategoryNode[] {
  const data = response as {
    data?: { data?: CategoryNode[]; categories?: CategoryNode[] };
    categories?: CategoryNode[];
  };

  if (Array.isArray(data.data?.data)) return data.data.data;
  if (Array.isArray(data.data?.categories)) return data.data.categories;
  if (Array.isArray(data.categories)) return data.categories;

  return [];
}

function flattenCategories(
  categories: CategoryNode[],
  parentLabel = ""
): CategoryOption[] {
  return categories.flatMap((category) => {
    const label =
      category.breadcrumb && category.breadcrumb.length > 0
        ? category.breadcrumb.join(" / ")
        : parentLabel
          ? `${parentLabel} / ${category.name}`
          : category.name;

    const option: CategoryOption = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      path: category.path || category.slug,
      label,
      level: category.level || 1,
      productCount: category.productCount,
      isActive: category.isActive,
    };

    return [option, ...flattenCategories(category.children || [], label)];
  });
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findMediaUrl(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMediaUrl(item);
      if (found) return found;
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["secureUrl", "url", "src", "location", "path"]) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }

    for (const key of ["data", "file", "files", "media", "uploaded", "result"]) {
      const found = findMediaUrl(record[key]);
      if (found) return found;
    }
  }

  return null;
}

function hasHtmlTags(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function formatDescriptionHtml(rawText: string) {
  const text = rawText.trim();
  if (!text) return "";

  const headingWords = [
    "Details",
    "Features",
    "Product Features",
    "Comfortable Smocked Waist",
    "Flowing Tiered Maxi Silhouette",
    "Taupe Cotton Travel Dress",
    "Easy to Pack and Easy to Style",
    "Relaxed Yet Refined Fit",
    "Best Cotton Travel Dress",
    "Ideal for Weekend Escapes",
  ];

  let formatted = text;

  headingWords.forEach((heading) => {
    const pattern = new RegExp(`\\s+(${heading})\\s+`, "gi");
    formatted = formatted.replace(pattern, "\n\n$1\n");
  });

  formatted = formatted
    .replace(/\s+(Product Features)\s+/gi, "\n\nProduct Features\n")
    .replace(/\s+(Premium Breathable Cotton Fabric)\s+/gi, "\n- Premium Breathable Cotton Fabric")
    .replace(/\s+(Strapless Neckline)\s+/gi, "\n- Strapless Neckline")
    .replace(/\s+(Comfortable Smocked Waist)\s+/gi, "\n- Comfortable Smocked Waist")
    .replace(/\s+(Flowing Tiered Maxi Silhouette)\s+/gi, "\n- Flowing Tiered Maxi Silhouette")
    .replace(/\s+(Lightweight Construction)\s+/gi, "\n- Lightweight Construction")
    .replace(/\s+(Elegant Taupe Color)\s+/gi, "\n- Elegant Taupe Color")
    .replace(/\s+(Relaxed Feminine Fit)\s+/gi, "\n- Relaxed Feminine Fit")
    .replace(/\s+(Travel-Friendly Design)\s+/gi, "\n- Travel-Friendly Design")
    .replace(/\s+(Easy Day-to-Night Styling)\s+/gi, "\n- Easy Day-to-Night Styling")
    .replace(/\s+(Full-Length Maxi Dress)\s*/gi, "\n- Full-Length Maxi Dress");

  const lines = formatted
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let html = "";
  let listItems: string[] = [];

  function flushList() {
    if (!listItems.length) return;
    html += `<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    listItems = [];
  }

  lines.forEach((line, index) => {
    if (line.startsWith("- ")) {
      listItems.push(line.replace(/^- /, ""));
      return;
    }

    flushList();

    const isHeading =
      index > 0 &&
      (headingWords.some(
        (heading) => heading.toLowerCase() === line.toLowerCase()
      ) ||
        line.toLowerCase() === "product features");

    html += isHeading ? `<h3>${line}</h3>` : `<p>${line}</p>`;
  });

  flushList();

  return html;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  productId,
  mediaItems = [],
  pendingMediaFiles = [],
  onPendingMediaFilesChange,
  onMediaChanged,
}: {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting?: boolean;
  productId?: string;
  mediaItems?: ProductMediaItem[];
  pendingMediaFiles?: File[];
  onPendingMediaFilesChange?: (files: File[]) => void;
  onMediaChanged?: () => void;
}) {
const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
const [isCategoryLoading, setIsCategoryLoading] = useState(true);
const [categoryError, setCategoryError] = useState<string | null>(null);
const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

const form = useForm<ProductFormValues>({
  resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
  defaultValues: getDefaultFormValues(defaultValues),
});

  const name = form.watch("name");
  const sku = form.watch("sku");
  const categoryId = form.watch("categoryId");
  const selectedCategorySlugs = form.watch("categories") ?? [];
  const commerceTypes = form.watch("commerceTypes") ?? [];
  const descriptionValue = form.watch("description") ?? "";

  const formValues = form.watch();

const selectedCategoryLabel =
  categoryOptions.find((category) => category.slug === categoryId)?.label ||
  categoryId ||
  "Selected category";

  useEffect(() => {
    form.reset(getDefaultFormValues(defaultValues));
  }, [defaultValues, form]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        setIsCategoryLoading(true);
        setCategoryError(null);

        const response = await fetch(
          `${getApiRootUrl()}/catalog/categories/tree?includeInactive=true&showProductCount=true&showEmpty=true&maxDepth=50`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Category tree API failed.");
        }

        const options = flattenCategories(extractCategoryTree(data));

        if (!ignore) setCategoryOptions(options);
      } catch (error) {
        if (!ignore) {
          setCategoryError(
            error instanceof Error ? error.message : "Category tree load failed."
          );
        }
      } finally {
        if (!ignore) setIsCategoryLoading(false);
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  function toggleCommerceType(type: ProductFormValues["commerceTypes"][number]) {
    const exists = commerceTypes.includes(type);

    form.setValue(
      "commerceTypes",
      exists
        ? commerceTypes.filter((item) => item !== type)
        : [...commerceTypes, type],
      { shouldValidate: true, shouldDirty: true }
    );
  }

  function generateSlug() {
    const generated = makeSlug(name || "");

    if (generated) {
      form.setValue("slug", generated, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }


 function handleMetafieldsChange(nextValues: ProductFormValues) {
  form.setValue("taxonomyId", nextValues.taxonomyId || "", {
    shouldDirty: true,
    shouldValidate: true,
  });

  form.setValue("taxonomy", nextValues.taxonomy ?? null, {
    shouldDirty: true,
    shouldValidate: true,
  });

  form.setValue("productMetafields", nextValues.productMetafields || {}, {
    shouldDirty: true,
    shouldValidate: true,
  });

  form.setValue("categoryMetafields", nextValues.categoryMetafields || {}, {
    shouldDirty: true,
    shouldValidate: true,
  });
}

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pb-20">
      <FormSection
        icon={<Sparkles className="h-4 w-4" />}
        title="Product identity"
        description="Core catalog information and storefront description."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Product name" error={form.formState.errors.name?.message}>
            <Input
              {...form.register("name")}
              placeholder="Mira Chiffon Dress"
              className="h-9 text-sm"
            />
          </Field>

          <Field label="SKU" error={form.formState.errors.sku?.message}>
            <Input
              {...form.register("sku")}
              placeholder="MIRA-CHIFFON-001"
              className="h-9 text-sm"
            />
          </Field>

          <Field label="Slug" error={form.formState.errors.slug?.message}>
            <div className="flex gap-2">
              <Input
                {...form.register("slug")}
                placeholder="mira-chiffon-dress"
                className="h-9 text-sm"
              />

              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md px-3 text-xs"
                onClick={generateSlug}
              >
                Generate
              </Button>
            </div>
          </Field>

          <Field label="Brand">
            <Input
              {...form.register("brand")}
              placeholder="Shahsi"
              className="h-9 text-sm"
            />
          </Field>

          <Field
            label="Short description"
            error={form.formState.errors.shortDescription?.message}
          >
            <Input
              {...form.register("shortDescription")}
              placeholder="Short product summary"
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Description" error={form.formState.errors.description?.message}>
            <RichTextEditor
              value={descriptionValue}
              onChange={(html) =>
                form.setValue("description", html, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </Field>
        </div>
      </FormSection>

      <ProductMediaSection
  productId={productId}
  mediaItems={mediaItems}
  pendingFiles={pendingMediaFiles}
  onPendingFilesChange={onPendingMediaFilesChange}
  onMediaChanged={onMediaChanged}
/>

      <FormSection
        icon={<Settings2 className="h-4 w-4" />}
        title="Category and settings"
        description="Category, business type and product status."
      >
        {categoryError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <p className="font-semibold">Category API error</p>
            <p className="mt-1">{categoryError}</p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
         <Field
  label="Categories"
  error={form.formState.errors.categoryId?.message}
>
  <button
    type="button"
    disabled={isCategoryLoading || Boolean(categoryError)}
    onClick={() => setIsCategoryModalOpen(true)}
    className="min-h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
  >
    {isCategoryLoading ? (
      "Loading categories..."
    ) : selectedCategorySlugs.length > 0 ? (
      <span className="flex flex-wrap gap-1">
        {selectedCategorySlugs.slice(0, 3).map((slug) => {
          const category = categoryOptions.find((item) => item.slug === slug);

          return (
            <span
              key={slug}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800"
            >
              {category?.name || slug}
            </span>
          );
        })}

        {selectedCategorySlugs.length > 3 ? (
          <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-xs font-medium text-white">
            +{selectedCategorySlugs.length - 3}
          </span>
        ) : null}
      </span>
    ) : (
      "Select categories"
    )}
  </button>

  <p className="mt-1 text-[11px] text-neutral-500">
    Primary category:{" "}
    <span className="font-medium text-neutral-800">
      {categoryOptions.find((item) => item.slug === categoryId)?.label ||
        categoryId ||
        "Not selected"}
    </span>
  </p>
</Field>

          <Field label="Business type">
            <select
              {...form.register("businessType")}
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>
          </Field>

          <Field label="Product type">
            <select
              {...form.register("productType")}
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRESS">Dress</option>
              <option value="ACCESSORY">Accessory</option>
              <option value="SWATCH">Swatch</option>
              <option value="EDITORIAL_PRODUCT">Editorial Product</option>
              <option value="RENTAL_LISTING">Rental Listing</option>
              <option value="RESALE_LISTING">Resale Listing</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>
      </FormSection>

 <ProductShopifyMetafieldsSection
  values={formValues}
  onChange={handleMetafieldsChange}
  primaryCategoryLabel={selectedCategoryLabel}
/>

      <div className="grid gap-3 xl:grid-cols-2">
        <FormSection
          icon={<Tag className="h-4 w-4" />}
          title="Pricing"
          description="Primary price and optional sale price."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Price" error={form.formState.errors.price?.message}>
              <Input
                type="number"
                step="0.01"
                {...form.register("price", { valueAsNumber: true })}
                className="h-9 text-sm"
              />
            </Field>

            <Field
              label="Sale price"
              error={form.formState.errors.salePrice?.message}
            >
              <Input
                type="number"
                step="0.01"
                {...form.register("salePrice", { valueAsNumber: true })}
                className="h-9 text-sm"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          icon={<Tag className="h-4 w-4" />}
          title="Commerce"
          description="Select applicable commerce models."
        >
          <div className="grid gap-2 sm:grid-cols-4">
            {(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"] as const).map(
              (type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleCommerceType(type)}
                  className={`h-9 rounded-md border px-3 text-left text-xs font-semibold transition ${
                    commerceTypes.includes(type)
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {commerceTypeLabels[type]}
                </button>
              )
            )}
          </div>

          {form.formState.errors.commerceTypes?.message ? (
            <p className="mt-2 text-xs text-red-600">
              {form.formState.errors.commerceTypes.message}
            </p>
          ) : null}
        </FormSection>
      </div>

      <FormSection
        icon={<Search className="h-4 w-4" />}
        title="SEO"
        description="Search title and meta description."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="SEO title"
            error={form.formState.errors.seoTitle?.message}
          >
            <Input
              {...form.register("seoTitle")}
              placeholder="Plum Velvet Engagement Gown"
              className="h-9 text-sm"
            />
          </Field>

          <Field
            label="SEO description"
            error={form.formState.errors.seoDescription?.message}
          >
            <textarea
              {...form.register("seoDescription")}
              className="min-h-20 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="SEO description"
            />
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-3 z-20 rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 text-xs text-white">
            <span className="block truncate font-medium">
              {name || "Untitled product"}
            </span>
            <span className="text-white/60">{sku ? `SKU ${sku}` : "SKU not set"}</span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 rounded-md bg-white px-5 text-sm text-neutral-950 hover:bg-white/90"
          >
            {isSubmitting ? "Saving..." : "Save product"}
          </Button>
        </div>
      </div>

      <CategoryTreeSelectorModal
  open={isCategoryModalOpen}
  categories={categoryOptions}
  selectedSlugs={selectedCategorySlugs}
  primarySlug={categoryId || ""}
  onClose={() => setIsCategoryModalOpen(false)}
  onApply={({ selectedSlugs, primarySlug }) => {
    form.setValue("categories", selectedSlugs, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("categoryId", primarySlug, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("subcategoryId", selectedSlugs[1] || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    setIsCategoryModalOpen(false);
  }}
/>
    </form>
  );
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const [didAutoFormat, setDidAutoFormat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const highlightInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-700 underline underline-offset-2",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md",
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Write product description...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] max-h-[520px] overflow-y-auto px-4 py-4 text-[13px] leading-6 text-neutral-950 outline-none [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-700 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mb-1.5 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mb-1.5 [&_h6]:text-sm [&_h6]:font-semibold [&_hr]:my-4 [&_hr]:border-neutral-200 [&_img]:my-3 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-100 [&_th]:p-2 [&_ul]:list-disc",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || "";

    if (currentHtml !== nextHtml) {
   editor.commands.setContent(nextHtml, {
  emitUpdate: false,
});
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor || didAutoFormat) return;

    const rawValue = value || "";
    const isLongPlainText = rawValue.length > 500 && !hasHtmlTags(rawValue);

    if (!isLongPlainText) return;

    const timer = window.setTimeout(() => {
      const html = formatDescriptionHtml(rawValue);
     editor.commands.setContent(html, {
  emitUpdate: false,
});
      onChange(html);
      setDidAutoFormat(true);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [didAutoFormat, editor, onChange, value]);

  if (!editor) return null;

  async function uploadEditorFile(file: File) {
    const formData = new FormData();

    formData.append("files", file);
    formData.append("folder", "product-descriptions");

    const token = getToken();

    const response = await fetch(`${getApiRootUrl()}/admin/editor-media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(json?.message || "Editor media upload failed.");
    }

    const url = findMediaUrl(json);

    if (!url) {
      throw new Error("Upload response me media URL nahi mila.");
    }

    return url;
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return;

    try {
      for (const file of Array.from(files)) {
        const url = await uploadEditorFile(file);
        if (!editor) {
  return;
}

        if (file.type.startsWith("video/")) {
          editor
            .chain()
            .focus()
            .insertContent(
              `<video controls src="${url}" style="max-width:100%;border-radius:8px;"></video>`
            )
            .run();
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

 function setLink() {
  if (!editor) {
    return;
  }

  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

 function insertImageUrl() {
  if (!editor) {
    return;
  }

  const url = window.prompt("Image URL");

  if (!url) return;

  editor.chain().focus().setImage({ src: url }).run();
}

function insertVideoUrl() {
  if (!editor) {
    return;
  }

  const url = window.prompt("Video URL");

  if (!url) return;

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    editor.commands.setYoutubeVideo({ src: url });
    return;
  }

  editor
    .chain()
    .focus()
    .insertContent(
      `<video src="${url}" controls style="max-width: 100%; border-radius: 12px;"></video>`
    )
    .run();
}

 function smartFormat() {
  if (!editor) {
    return;
  }

  const html = formatDescriptionHtml(editor.getText());

  if (!html) return;

    editor.commands.setContent(html, {
  emitUpdate: false,
});
    onChange(editor.getHTML());
  }

  return (
    <div className="relative rounded-md border border-neutral-300 bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => handleFileUpload(event.target.files)}
      />

      <input
        ref={colorInputRef}
        type="color"
        className="hidden"
        onChange={(event) =>
          editor.chain().focus().setColor(event.target.value).run()
        }
      />

      <input
        ref={highlightInputRef}
        type="color"
        className="hidden"
        onChange={(event) =>
          editor
            .chain()
            .focus()
            .setHighlight({ color: event.target.value })
            .run()
        }
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <BlockStyleDropdown editor={editor} />

        <ToolbarButton
          active={editor.isActive("bold")}
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("italic")}
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("underline")}
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("strike")}
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Text color"
          onClick={() => colorInputRef.current?.click()}
        >
          <Type className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Highlight"
          onClick={() => highlightInputRef.current?.click()}
        >
          <PaintBucket className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("bulletList")}
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("orderedList")}
          title="Number list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Link" onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Unlink"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Upload image/video"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Image URL" onClick={insertImageUrl}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Video URL" onClick={insertVideoUrl}>
          <Video className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Horizontal line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("blockquote")}
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Clear format"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton title="Smart format" onClick={smartFormat}>
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="HTML"
          onClick={() => setMode(mode === "html" ? "visual" : "html")}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          title="Preview"
          onClick={() => setMode(mode === "preview" ? "visual" : "preview")}
        >
          <Eye className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {mode === "html" ? (
        <textarea
          value={value || ""}
          onChange={(event) => {
      onChange(event.target.value);

editor.commands.setContent(event.target.value, {
  emitUpdate: false,
});
          }}
          className="min-h-[280px] max-h-[520px] w-full overflow-y-auto rounded-b-md bg-neutral-950 p-4 font-mono text-sm leading-6 text-white outline-none"
          spellCheck={false}
        />
      ) : mode === "preview" ? (
        <div
          className="min-h-[280px] max-h-[520px] overflow-y-auto px-4 py-4 text-[13px] leading-6 text-neutral-950 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mb-1.5 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mb-1.5 [&_h6]:text-sm [&_h6]:font-semibold [&_hr]:my-4 [&_img]:max-w-full [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function BlockStyleDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const headingItems = ([1, 2, 3, 4, 5, 6] as const).map((level) => ({
    key: `h${level}`,
    label: `Heading ${level}`,
    previewClass:
      level === 1
        ? "text-4xl font-bold"
        : level === 2
          ? "text-3xl font-bold"
          : level === 3
            ? "text-2xl font-semibold"
            : level === 4
              ? "text-xl font-semibold"
              : level === 5
                ? "text-lg font-semibold"
                : "text-base font-semibold",
    active: editor.isActive("heading", { level }),
    action: () => {
      if (!editor.isActive("heading", { level })) {
        editor.chain().focus().toggleHeading({ level }).run();
      }
    },
  }));

  const items = [
    {
      key: "paragraph",
      label: "Paragraph",
      previewClass: "text-base font-medium",
      active: editor.isActive("paragraph"),
      action: () => editor.chain().focus().setParagraph().run(),
    },
    ...headingItems,
    {
      key: "blockquote",
      label: "Blockquote",
      previewClass:
        "border-l-4 border-neutral-300 pl-4 text-xl font-medium text-neutral-700",
      active: editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  const activeItem =
    items.find((item) => item.active) ||
    items.find((item) => item.key === "paragraph") ||
    items[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        className="inline-flex h-8 min-w-[135px] items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50"
      >
        {activeItem.label}
        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
      </button>

      {open ? (
        <div className="absolute left-0 top-9 z-[80] max-h-[420px] w-[300px] overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-2xl">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                item.action();
                setOpen(false);
              }}
              className={`block w-full border-b border-neutral-100 px-5 py-3 text-left text-neutral-900 last:border-b-0 hover:bg-neutral-50 ${
                item.active ? "bg-neutral-100" : ""
              }`}
            >
              <span className={item.previewClass}>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
        active
          ? "bg-neutral-950 text-white"
          : "text-neutral-700 hover:bg-white hover:text-neutral-950"
      }`}
    >
      {children}
    </button>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
          {icon}
        </span>

        <div>
          <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-700">
        {label}
      </span>

      {children}

      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </div>
  );
}


function CategoryTreeSelectorModal({
  open,
  categories,
  selectedSlugs,
  primarySlug,
  onClose,
  onApply,
}: {
  open: boolean;
  categories: CategoryOption[];
  selectedSlugs: string[];
  primarySlug: string;
  onClose: () => void;
  onApply: (values: { selectedSlugs: string[]; primarySlug: string }) => void;
}) {
  const [draftSelectedSlugs, setDraftSelectedSlugs] = useState<string[]>([]);
  const [draftPrimarySlug, setDraftPrimarySlug] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) return;

    setDraftSelectedSlugs(selectedSlugs);
    setDraftPrimarySlug(primarySlug || selectedSlugs[0] || "");
    setSearchTerm("");
  }, [open, selectedSlugs, primarySlug]);

  if (!open) return null;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleCategories = normalizedSearch
    ? categories.filter((category) => {
        const target = [
          category.name,
          category.slug,
          category.path,
          category.label,
        ]
          .join(" ")
          .toLowerCase();

        return target.includes(normalizedSearch);
      })
    : categories;

  function toggleCategory(slug: string) {
    setDraftSelectedSlugs((current) => {
      const exists = current.includes(slug);

      if (exists) {
        const next = current.filter((item) => item !== slug);

        if (draftPrimarySlug === slug) {
          setDraftPrimarySlug(next[0] || "");
        }

        return next;
      }

      if (!draftPrimarySlug) {
        setDraftPrimarySlug(slug);
      }

      return [...current, slug];
    });
  }

  function removeCategory(slug: string) {
    setDraftSelectedSlugs((current) => {
      const next = current.filter((item) => item !== slug);

      if (draftPrimarySlug === slug) {
        setDraftPrimarySlug(next[0] || "");
      }

      return next;
    });
  }

  function applySelection() {
    const finalPrimarySlug = draftPrimarySlug || draftSelectedSlugs[0] || "";

    onApply({
      selectedSlugs: draftSelectedSlugs,
      primarySlug: finalPrimarySlug,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto flex h-[88vh] max-w-6xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">
              Associated Categories
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Select multiple categories and choose one primary category.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-2xl leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            ×
          </button>
        </div>

        <div className="border-b border-neutral-200 px-5 py-4">
          <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
            {draftSelectedSlugs.length > 0 ? (
              draftSelectedSlugs.map((slug) => {
                const category = categories.find((item) => item.slug === slug);
                const isPrimary = draftPrimarySlug === slug;

                return (
                  <span
                    key={slug}
                    className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold ${
                      isPrimary
                        ? "bg-neutral-950 text-white"
                        : "bg-white text-neutral-800 ring-1 ring-neutral-200"
                    }`}
                  >
                    {category?.name || slug}
                    {isPrimary ? "Primary" : null}

                    <button
                      type="button"
                      onClick={() => removeCategory(slug)}
                      className="text-current opacity-70 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="px-1 py-1 text-sm text-neutral-400">
                No category selected
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-neutral-200 px-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search categories"
              className="h-10 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Category tree
          </p>

          <div className="space-y-1">
            {visibleCategories.map((category) => {
              const isChecked = draftSelectedSlugs.includes(category.slug);
              const isPrimary = draftPrimarySlug === category.slug;

              return (
                <div
                  key={category.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-neutral-50"
                  style={{
                    paddingLeft: `${Math.max(category.level - 1, 0) * 24 + 8}px`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(category.slug)}
                    className="h-4 w-4"
                  />

                  <button
                    type="button"
                    onClick={() => toggleCategory(category.slug)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {category.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {category.path}
                      {typeof category.productCount === "number"
                        ? ` • ${category.productCount} products`
                        : ""}
                    </span>
                  </button>

                  {isChecked ? (
                    <button
                      type="button"
                      onClick={() => setDraftPrimarySlug(category.slug)}
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        isPrimary
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {isPrimary ? "Primary" : "Set primary"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="rounded-md bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={applySelection}
            disabled={draftSelectedSlugs.length === 0}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
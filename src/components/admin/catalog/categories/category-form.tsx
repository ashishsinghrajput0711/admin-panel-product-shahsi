"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Grid2X2,
  ImagePlus,
  List,
  Loader2,
  Plus,
  Search,
  SortAsc,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  fetchMediaLibrary,
  type MediaLibraryFilterType,
  type ProductMediaItem,
} from "@/lib/admin/product-media-upload";

import { RichTextEditor } from "@/components/admin/catalog/products/rich-text-editor";

import { AutomatedCategoryPreview } from "@/components/admin/catalog/categories/automated-category-preview";

import { CategoryProductsSection } from "@/components/admin/catalog/categories/category-products-section";

import type {
  CategoryCondition,
  CategoryFaq,
  CategoryFormValues,
  CategoryNode,
} from "@/components/admin/catalog/categories/category-types";
import { flattenCategoryTree } from "@/lib/admin/category-api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}



function getMediaApiRootUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!rawUrl) {
    throw new Error(
      "API base URL missing hai. .env.local me NEXT_PUBLIC_ADMIN_API_URL add karo.",
    );
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

function getMediaToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getCategoryMediaSrc(item: ProductMediaItem) {
  return item.thumbnailUrl || item.secureUrl || item.url || "";
}

function getCategoryMediaTitle(item: ProductMediaItem) {
  const mediaRecord = item as ProductMediaItem & {
    originalFilename?: string | null;
    publicId?: string | null;
  };

  return (
    mediaRecord.name ||
    mediaRecord.title ||
    mediaRecord.altText ||
    mediaRecord.originalFilename ||
    mediaRecord.publicId ||
    "Untitled image"
  );
}

function getCategoryMediaFileName(item: ProductMediaItem) {
  const mediaRecord = item as ProductMediaItem & {
    originalFilename?: string | null;
    publicId?: string | null;
  };

  return (
    mediaRecord.name ||
    mediaRecord.originalFilename ||
    mediaRecord.publicId ||
    mediaRecord.title ||
    "category-image"
  );
}


type CategoryMediaProductPickerItem = {
  id: string;
  title: string;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
};

function getMediaSizeBytes(item: ProductMediaItem) {
  const record = item as ProductMediaItem & {
    fileSize?: number | null;
    fileSizeBytes?: number | null;
    size?: number | null;
  };

  return Number(record.fileSizeBytes || record.fileSize || record.size || 0) || 0;
}

function getMediaUsedInProductId(item: ProductMediaItem) {
  const record = item as ProductMediaItem & {
    productId?: string | null;
    usedInProductId?: string | null;
    ownerProductId?: string | null;
  };

  return record.productId || record.usedInProductId || record.ownerProductId || "";
}

async function fetchCategoryProductMedia(productId: string) {
  const response = await fetch(
    `${getMediaApiRootUrl()}/admin/catalog/${encodeURIComponent(productId)}/media`,
    {
      method: "GET",
      headers: {
        ...(getMediaToken()
          ? { Authorization: `Bearer ${getMediaToken()}` }
          : {}),
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Product media load failed: ${response.status}`;

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  const rawItems =
    data?.data?.items ||
    data?.data?.media ||
    data?.data?.images ||
    data?.items ||
    data?.media ||
    data?.images ||
    data?.data ||
    [];

  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item: any) => ({
    id: String(
  item.id ||
    item.mediaId ||
    item.imageId ||
    item.url ||
    item.secureUrl ||
    item.imageUrl ||
    `${productId}-${item.position || item.name || item.title || "media"}`
),
      url: item.url || item.secureUrl || item.imageUrl || item.src || "",
      secureUrl: item.secureUrl || item.url || item.imageUrl || "",
      thumbnailUrl:
        item.thumbnailUrl ||
        item.thumbnail ||
        item.url ||
        item.secureUrl ||
        item.imageUrl ||
        "",
      name:
        item.name ||
        item.title ||
        item.originalFilename ||
        item.fileName ||
        "Product image",
      title:
        item.title ||
        item.name ||
        item.originalFilename ||
        item.fileName ||
        "Product image",
      altText: item.altText || item.alt || item.name || item.title || "",
      type: item.type || item.mediaType || "IMAGE",
      productId,
      createdAt: item.createdAt || item.updatedAt || null,
      fileSizeBytes: item.fileSizeBytes || item.fileSize || item.size || 0,
    }))
    .filter((item: ProductMediaItem) => getCategoryMediaSrc(item));
}

function isMediaUsedInProduct(item: ProductMediaItem) {
  const record = item as ProductMediaItem & {
    productId?: string | null;
    usedIn?: string[] | null;
    usageType?: string | null;
    attachedTo?: string | null;
  };

  return Boolean(
    record.productId ||
      record.usageType === "PRODUCT" ||
      record.attachedTo === "PRODUCT" ||
      record.usedIn?.some((value) =>
        String(value).toLowerCase().includes("product"),
      ),
  );
}

async function fetchCategoryMediaProducts(search = "") {
  const params = new URLSearchParams({
    page: "1",
    limit: "50",
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${getMediaApiRootUrl()}/admin/catalog/products/picker?${params.toString()}`,
    {
      method: "GET",
      headers: {
        ...(getMediaToken() ? { Authorization: `Bearer ${getMediaToken()}` } : {}),
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Products load failed: ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  const rawItems =
    data?.data?.items ||
    data?.data?.products ||
    data?.items ||
    data?.products ||
    data?.data ||
    [];

  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item: any) => ({
    id: String(item.id || item.productId || ""),
    title: String(item.title || item.name || "Untitled product"),
    name: item.name || null,
    slug: item.slug || null,
    sku: item.sku || null,
    imageUrl: item.imageUrl || item.thumbnail || item.thumbnailUrl || null,
    thumbnail: item.thumbnail || item.thumbnailUrl || item.imageUrl || null,
  })) as CategoryMediaProductPickerItem[];
}


function InputLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
    />
  );
}

type CategoryPickerItem = CategoryNode & {
  depth: number;
  label: string;
};

function getCategoryReferenceValue(category: CategoryNode) {
  return String(category.path || category.slug || "").trim();
}

function getCategoryReferenceBadge(category: CategoryNode) {
  const productSourceType = String(
    category.productSourceType || "MANUAL",
  ).toUpperCase();

  const status = category.isActive === false ? "DRAFT" : "ACTIVE";

  const count =
    typeof category.productCount === "number"
      ? `${category.productCount} products`
      : "products";

  return `${productSourceType} / ${status} / ${count}`;
}

function normalizeConditionValue(value: string) {
  const cleanValue = value.trim();

  if (cleanValue.toLowerCase() === "true") return true;
  if (cleanValue.toLowerCase() === "false") return false;

  const numericValue = Number(cleanValue);

  if (cleanValue && Number.isFinite(numericValue)) {
    return numericValue;
  }

  return cleanValue;
}

function getDefaultCondition(): CategoryCondition {
  return {
    field: "status",
    operator: "EQUALS",
    value: "ACTIVE",
  };
}

function CategoryReferenceSelect({
  value,
  label,
  placeholder,
  categories,
  isLoading,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  categories: CategoryPickerItem[];
  isLoading: boolean;
  onChange: (value: string) => void;
}) {
  const selectedCategory = categories.find(
    (category) => getCategoryReferenceValue(category) === value,
  );

  const hasCurrentValue = Boolean(value);
  const currentValueMissing =
    hasCurrentValue &&
    !categories.some(
      (category) => getCategoryReferenceValue(category) === value,
    );

  return (
    <div>
      <InputLabel>{label}</InputLabel>

      <div className="mt-2 rounded-2xl border border-neutral-200 bg-white p-3 transition focus-within:border-neutral-950">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          className="h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-[#fbfaf6] px-3 text-sm font-medium text-neutral-950 outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        >
          <option value="">
            {isLoading ? "Loading categories..." : placeholder}
          </option>

          {currentValueMissing ? (
            <option value={value}>Current saved: {value}</option>
          ) : null}

          {categories.map((category) => {
            const optionValue = getCategoryReferenceValue(category);
            const optionLabel = category.label || category.name;

            return (
              <option key={category.id || optionValue} value={optionValue}>
                {optionLabel} — {getCategoryReferenceBadge(category)}
              </option>
            );
          })}
        </select>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedCategory ? (
            <>
              <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                {selectedCategory.label || selectedCategory.name}
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                {getCategoryReferenceBadge(selectedCategory)}
              </span>
            </>
          ) : value ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">
              Saved old value: {value}
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

        {value ? (
          <p className="mt-2 text-xs text-neutral-400">
            Saved path/slug:{" "}
            <span className="font-mono font-semibold text-neutral-700">
              {value}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}


function CategoryImageMediaPicker({
  open,
  selectedUrl,
  onClose,
  onSelect,
  onLocalFileSelect,
}: {
  open: boolean;
  selectedUrl?: string;
  onClose: () => void;
  onSelect: (item: ProductMediaItem) => void;
  onLocalFileSelect: (file: File) => void;
}) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ProductMediaItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState("Date added (newest first)");
  const [isLoading, setIsLoading] = useState(false);

  const [openFilter, setOpenFilter] = useState<
  "fileSize" | "usedIn" | "product" | null
>(null);

const [minSizeMb, setMinSizeMb] = useState("");
const [maxSizeMb, setMaxSizeMb] = useState("");
const [usedInFilter, setUsedInFilter] = useState<"PRODUCT" | "OTHER" | "">("");

const [productSearch, setProductSearch] = useState("");
const [productItems, setProductItems] = useState<CategoryMediaProductPickerItem[]>(
  [],
);
const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
const [isProductsLoading, setIsProductsLoading] = useState(false);

const [productMediaItems, setProductMediaItems] = useState<ProductMediaItem[]>(
  [],
);
const [isProductMediaLoading, setIsProductMediaLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

function handleLocalFile(file: File | null) {
  if (!file) return;

  const previewUrl = URL.createObjectURL(file);
  setLocalPreviewUrl(previewUrl);
  setSelectedId("__local__");
  onLocalFileSelect(file);
}

  async function loadMedia(options: { nextPage?: number; append?: boolean } = {}) {
    const nextPage = options.nextPage || 1;
    const append = Boolean(options.append);

    try {
      append ? setIsLoadingMore(true) : setIsLoading(true);
      setError("");

      const result = await fetchMediaLibrary({
        apiRootUrl: getMediaApiRootUrl(),
        token: getMediaToken(),
        page: nextPage,
        limit: 30,
        search,
        type: "IMAGE" as MediaLibraryFilterType,
      });

      setItems((current) => {
        if (!append) return result.items;

        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...result.items.filter((item) => !existingIds.has(item.id)),
        ];
      });

      setPage(result.meta.page || nextPage);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Media library load karte time error aa gaya.",
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    setSelectedId("");
    setIsSortOpen(false);
    setIsViewMenuOpen(false);
    void loadMedia({ nextPage: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
  if (!open) return;

  let cancelled = false;

  async function loadSelectedProductMedia() {
    if (!selectedProductIds.length) {
      setProductMediaItems([]);
      return;
    }

    try {
      setIsProductMediaLoading(true);

      const results = await Promise.all(
        selectedProductIds.map((productId) => fetchCategoryProductMedia(productId)),
      );

      if (cancelled) return;

      const merged = results.flat();
      const seen = new Set<string>();

      const uniqueItems = merged.filter((item) => {
        const key = item.id || getCategoryMediaSrc(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setProductMediaItems(uniqueItems);
    } catch (err) {
      if (!cancelled) {
        setProductMediaItems([]);
        setError(
          err instanceof Error
            ? err.message
            : "Selected product media load karte time error aa gaya.",
        );
      }
    } finally {
      if (!cancelled) {
        setIsProductMediaLoading(false);
      }
    }
  }

  void loadSelectedProductMedia();

  return () => {
    cancelled = true;
  };
}, [open, selectedProductIds]);


  useEffect(() => {
  if (!open || openFilter !== "product") return;

  let cancelled = false;

  async function loadProducts() {
    try {
      setIsProductsLoading(true);
      const products = await fetchCategoryMediaProducts(productSearch);

      if (!cancelled) {
        setProductItems(products);
      }
    } catch (err) {
      if (!cancelled) {
        setProductItems([]);
      }
    } finally {
      if (!cancelled) {
        setIsProductsLoading(false);
      }
    }
  }

  const timer = window.setTimeout(() => {
    void loadProducts();
  }, 250);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}, [open, openFilter, productSearch]);

  if (!open) return null;

  const baseMediaItems = selectedProductIds.length ? productMediaItems : items;

const filteredItems = baseMediaItems.filter((item) => {
  const sizeBytes = getMediaSizeBytes(item);
  const sizeMb = sizeBytes / (1024 * 1024);

  const min = Number(minSizeMb || 0);
  const max = Number(maxSizeMb || 0);

  if (minSizeMb.trim() && sizeMb < min) return false;
  if (maxSizeMb.trim() && sizeMb > max) return false;

  if (usedInFilter === "PRODUCT" && !isMediaUsedInProduct(item)) {
    return false;
  }

  if (usedInFilter === "OTHER" && isMediaUsedInProduct(item)) {
    return false;
  }



  return true;
});

const sortedItems = [...filteredItems].sort((a, b) => {
  const titleA = getCategoryMediaTitle(a).toLowerCase();
  const titleB = getCategoryMediaTitle(b).toLowerCase();

  const sizeA = getMediaSizeBytes(a);
  const sizeB = getMediaSizeBytes(b);

  const dateA = new Date(
    String((a as ProductMediaItem & { createdAt?: string | null }).createdAt || ""),
  ).getTime();

  const dateB = new Date(
    String((b as ProductMediaItem & { createdAt?: string | null }).createdAt || ""),
  ).getTime();

  if (sortLabel === "Date added (oldest first)") return dateA - dateB;
  if (sortLabel === "File name (A-Z)") return titleA.localeCompare(titleB);
  if (sortLabel === "File name (Z-A)") return titleB.localeCompare(titleA);
  if (sortLabel === "File size (smallest first)") return sizeA - sizeB;
  if (sortLabel === "File size (largest first)") return sizeB - sizeA;

  return dateB - dateA;
});

const selectedItem = sortedItems.find((item) => {
  const itemKey = item.id || getCategoryMediaSrc(item);
  return itemKey === selectedId;
});
const hasLocalSelection = selectedId === "__local__" && Boolean(localPreviewUrl);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6">
      <input
  id="category-image-local-upload"
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(event) => {
    const file = event.target.files?.[0] || null;
    handleLocalFile(file);
    event.currentTarget.value = "";
  }}
/>
      <div className="flex h-[88vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-neutral-950">
            Select image
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="relative max-w-[620px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void loadMedia({ nextPage: 1, append: false });
                    }
                  }}
                  placeholder="Search files"
                  className="h-12 w-full rounded-xl border border-neutral-400 bg-white pl-12 pr-4 text-base outline-none transition focus:border-neutral-950"
                />
              </div>

     
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((current) => !current)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
                >
                  <SortAsc className="h-4 w-4" />
                  Sort
                </button>

                {isSortOpen ? (
                  <div className="absolute right-0 top-12 z-20 w-[270px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                    {[
                      "Date added (newest first)",
                      "Date added (oldest first)",
                      "File name (A-Z)",
                      "File name (Z-A)",
                      "File size (smallest first)",
                      "File size (largest first)",
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setSortLabel(label);
                          setIsSortOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                      >
                        <span
                          className={`h-5 w-5 rounded-full border ${
                            sortLabel === label
                              ? "border-neutral-950 bg-neutral-950 shadow-[inset_0_0_0_5px_white]"
                              : "border-neutral-300"
                          }`}
                        />
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsViewMenuOpen((current) => !current)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
                >
                  {viewMode === "grid" ? (
                    <Grid2X2 className="h-5 w-5" />
                  ) : (
                    <List className="h-5 w-5" />
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isViewMenuOpen ? (
                  <div className="absolute right-0 top-12 z-20 w-[180px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("list");
                        setIsViewMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List view
                      </span>
                      {viewMode === "list" ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("grid");
                        setIsViewMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Grid2X2 className="h-4 w-4" />
                        Grid view
                      </span>
                      {viewMode === "grid" ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>
                  </div>
                ) : null}
              </div>

           <label
  htmlFor="category-image-local-upload"
  className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
>
  Upload image
</label>

              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-white text-purple-600 shadow-sm hover:bg-purple-50"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-6 flex h-[150px] items-center justify-center rounded-xl border border-dashed border-neutral-400 bg-white">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
              <label
  htmlFor="category-image-local-upload"
  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
>
  <Plus className="h-4 w-4" />
  Add files
</label>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-purple-50"
                >
                  <ImagePlus className="h-4 w-4 text-purple-600" />
                  Generate image
                </button>
              </div>

              <p className="mt-3 text-sm text-neutral-500">
                Drag and drop images
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}

      {isLoading || isProductMediaLoading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {isProductMediaLoading ? "Loading product images..." : "Loading media library..."}
            </div>
         ) : sortedItems.length ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">

                {hasLocalSelection ? (
  <button type="button" className="group relative text-center">
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[132px] overflow-hidden rounded-xl border border-neutral-950 bg-neutral-100 p-1 ring-2 ring-neutral-950/10">
      <img
        src={localPreviewUrl}
        alt="Selected local image"
        className="h-full w-full rounded-lg object-contain"
      />

      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border border-neutral-950 bg-white text-neutral-950">
        <Check className="h-4 w-4" />
      </span>
    </div>

    <p className="mx-auto mt-3 line-clamp-2 max-w-[150px] text-sm font-medium leading-tight text-neutral-800">
      Selected image
    </p>
    <p className="mt-1 text-sm text-neutral-500">LOCAL</p>
  </button>
) : null}
            {sortedItems.map((item) => {
                  const src = getCategoryMediaSrc(item);
                  const title = getCategoryMediaTitle(item);
              const itemKey = item.id || src;
const isSelected =
  selectedId === itemKey ||
  (!selectedId && selectedUrl === src);

                  return (
                    <button
                      key={item.id}
                      type="button"
                  onClick={() => setSelectedId(item.id || getCategoryMediaSrc(item))}
                      className="group relative text-center"
                    >
                      <div
                        className={`relative mx-auto aspect-[4/5] w-full max-w-[132px] overflow-hidden rounded-xl border bg-neutral-100 p-1 transition ${
                          isSelected
                            ? "border-neutral-950 ring-2 ring-neutral-950/10"
                            : "border-neutral-200"
                        }`}
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={item.altText || title}
                            className="h-full w-full rounded-lg object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                            No preview
                          </div>
                        )}

                        <span
                          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border bg-white ${
                            isSelected
                              ? "border-neutral-950 text-neutral-950"
                              : "border-neutral-300 text-transparent"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </div>

                      <p className="mx-auto mt-3 line-clamp-2 max-w-[150px] text-sm font-medium leading-tight text-neutral-800">
                        {title}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">JPG</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
             {sortedItems.map((item) => {
                  const src = getCategoryMediaSrc(item);
                  const title = getCategoryMediaTitle(item);
                 const itemKey = item.id || src;
const isSelected =
  selectedId === itemKey ||
  (!selectedId && selectedUrl === src);

                  return (
                    <button
                      key={item.id}
                      type="button"
                   onClick={() => setSelectedId(item.id || getCategoryMediaSrc(item))}
                      className={`flex w-full items-center gap-4 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50 ${
                        isSelected ? "bg-neutral-50" : "bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md border bg-white ${
                          isSelected
                            ? "border-neutral-950 text-neutral-950"
                            : "border-neutral-300 text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>

                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
                        {src ? (
                          <img
                            src={src}
                            alt={item.altText || title}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {item.altText || "No alt text"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-sm text-neutral-500">
         No images found for selected filters.
            </div>
          )}

          {!isLoading && page < totalPages ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => loadMedia({ nextPage: page + 1, append: true })}
                disabled={isLoadingMore}
                className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedItem && !hasLocalSelection}
           onClick={() => {
  if (hasLocalSelection) {
    onClose();
    return;
  }

  if (!selectedItem) return;
  onSelect(selectedItem);
  onClose();
}}
            className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryForm({
  mode,
  initialValues,
  categoryTree,
  currentCategoryId,
  currentCategorySlug,
  isSubmitting,
  error,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues: CategoryFormValues;
  categoryTree: CategoryNode[];
  currentCategoryId?: string;
  currentCategorySlug?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: CategoryFormValues, imageFile: File | null) => void;
}) {
const [values, setValues] = useState<CategoryFormValues>(initialValues);
const [imageFile, setImageFile] = useState<File | null>(null);
const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
const [autoSlug, setAutoSlug] = useState(mode === "create");

  const parentOptions = useMemo(() => {
    return flattenCategoryTree(categoryTree, {
      excludeId: currentCategoryId,
      excludeSlug: currentCategorySlug,
    });
  }, [categoryTree, currentCategoryId, currentCategorySlug]);

  const categoryReferenceOptions = useMemo<CategoryPickerItem[]>(() => {
    return flattenCategoryTree(categoryTree, {
      excludeId: currentCategoryId,
      excludeSlug: currentCategorySlug,
    });
  }, [categoryTree, currentCategoryId, currentCategorySlug]);

  function updateValue<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMetafield(key: string, value: string) {
    setValues((current) => ({
      ...current,
      metafields: {
        ...current.metafields,
        [key]: value,
      },
    }));
  }

  function updateFaq(index: number, key: keyof CategoryFaq, value: string) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.map((faq, faqIndex) =>
        faqIndex === index
          ? {
              ...faq,
              [key]: value,
            }
          : faq,
      ),
    }));
  }

  function addFaq() {
    setValues((current) => ({
      ...current,
      faqs: [...current.faqs, { question: "", answer: "" }],
    }));
  }

  function removeFaq(index: number) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index),
    }));
  }

  function updateCondition(
    index: number,
    key: keyof CategoryCondition,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      conditions: current.conditions.map((condition, conditionIndex) => {
        if (conditionIndex !== index) return condition;

        if (key === "value") {
          return {
            ...condition,
            value: normalizeConditionValue(value),
          };
        }

        if (key === "operator") {
          return {
            ...condition,
            operator: value.toUpperCase(),
          };
        }

        return {
          ...condition,
          field: value,
        };
      }),
    }));
  }

  function addCondition() {
    setValues((current) => ({
      ...current,
      conditions: [...current.conditions, getDefaultCondition()],
    }));
  }

  function removeCondition(index: number) {
    setValues((current) => ({
      ...current,
      conditions: current.conditions.filter(
        (_, conditionIndex) => conditionIndex !== index,
      ),
    }));
  }

  function handleNameChange(name: string) {
    const nextSlug = slugify(name);

    setValues((current) => ({
      ...current,
      name,
      slug: autoSlug ? nextSlug : current.slug,
      seoSlug: autoSlug ? nextSlug : current.seoSlug,
    }));
  }

function handleSlugChange(slug: string) {
  setAutoSlug(false);
  updateValue("slug", slug);
}

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) return;
    if (!values.slug.trim()) return;

   onSubmit(
  {
    ...values,
    slug: values.slug.trim(),
    seoSlug: values.seoSlug.trim() || values.slug.trim(),
    conditions:
      values.productSourceType === "AUTOMATED"
        ? values.conditions
        : [],
  },
  imageFile,
);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-full overflow-x-hidden space-y-5">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/catalog/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to categories
          </Link>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Admin / Catalog / Categories
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {mode === "create" ? "Create Category" : "Edit Category"}
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Category tree dynamic backend se manage hoga.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create category"
              : "Save category"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Category save failed</p>
          <p className="mt-1 whitespace-pre-wrap">{error}</p>
        </div>
      ) : null}

  <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="min-w-0 space-y-5">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Basic information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel>Name</InputLabel>
                <TextInput
                  value={values.name}
                  onChange={handleNameChange}
                  placeholder="Bridesmaid"
                />
              </div>

              <div>
                <InputLabel>Slug</InputLabel>
                <TextInput
                  value={values.slug}
                  onChange={handleSlugChange}
                  placeholder="bridesmaid"
                />
              </div>

              <div>
                <InputLabel>Parent category</InputLabel>
                <select
                  value={values.parentId}
                  onChange={(event) =>
                    updateValue("parentId", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                >
                  <option value="">Top-level category</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <InputLabel>Sort order</InputLabel>
                <TextInput
                  type="number"
                  value={values.sortOrder}
                  onChange={(value) => updateValue("sortOrder", Number(value))}
                  placeholder="1"
                />
              </div>
            </div>

          <div className="mt-4 min-w-0">
  <InputLabel>Description</InputLabel>

  <div className="mt-2 min-w-0 max-w-full overflow-hidden rounded-lg">
    <RichTextEditor
      value={values.description || ""}
      onChange={(value) =>
        updateValue("description", value)
      }
      minHeightClass="min-h-[260px]"
      maxHeightClass="max-h-[420px]"
    />
  </div>
</div>
          </section>

       <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
  <h2 className="text-base font-semibold text-neutral-950">
    Category type
  </h2>

  <div className="mt-5 space-y-4">
    <label className="flex cursor-pointer items-start gap-4">
      <input
        type="radio"
        name="categoryType"
        checked={values.productSourceType === "MANUAL"}
        onChange={() =>
          setValues((current) => ({
            ...current,
            productSourceType: "MANUAL",
            conditions: [],
          }))
        }
        className="mt-1 h-5 w-5 accent-neutral-950"
      />

      <span>
        <span className="block text-sm font-semibold text-neutral-950">
          Manual
        </span>
        <span className="mt-1 block text-sm leading-6 text-neutral-500">
          Add products to this category one by one.
        </span>
      </span>
    </label>

    <label className="flex cursor-pointer items-start gap-4">
      <input
        type="radio"
        name="categoryType"
        checked={values.productSourceType === "AUTOMATED"}
        onChange={() =>
          setValues((current) => ({
            ...current,
            productSourceType: "AUTOMATED",
            conditions: current.conditions.length
              ? current.conditions
              : [getDefaultCondition()],
          }))
        }
        className="mt-1 h-5 w-5 accent-neutral-950"
      />

      <span>
        <span className="block text-sm font-semibold text-neutral-950">
          Smart
        </span>
        <span className="mt-1 block text-sm leading-6 text-neutral-500">
          Existing and future products that match the conditions you set will
          automatically be added to this category.
        </span>
      </span>
    </label>
  </div>
</section>

{values.productSourceType === "AUTOMATED" ? (
  <>
    <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
      <h2 className="text-base font-semibold text-neutral-950">
        Conditions
      </h2>

      <div className="mt-5 flex flex-wrap items-center gap-6">
        <span className="text-sm text-neutral-700">
          Products must match:
        </span>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
          <input
            type="radio"
            name="smartMatchType"
            checked={values.matchType === "ALL"}
            onChange={() => updateValue("matchType", "ALL")}
            className="h-5 w-5 accent-neutral-950"
          />
          all conditions
        </label>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
          <input
            type="radio"
            name="smartMatchType"
            checked={values.matchType === "ANY"}
            onChange={() => updateValue("matchType", "ANY")}
            className="h-5 w-5 accent-neutral-950"
          />
          any condition
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {values.conditions.map((condition, index) => (
          <div
            key={index}
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <select
              value={condition.field}
              onChange={(event) =>
                updateCondition(index, "field", event.target.value)
              }
              className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            >
              <option value="tag">Tag</option>
              <option value="title">Product title</option>
              <option value="productType">Product type</option>
              <option value="vendor">Vendor</option>
              <option value="category">Category</option>
              <option value="price">Price</option>
              <option value="status">Status</option>
              <option value="sku">SKU</option>
            </select>

            <select
              value={condition.operator}
              onChange={(event) =>
                updateCondition(index, "operator", event.target.value)
              }
              className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            >
              <option value="EQUALS">is equal to</option>
              <option value="NOT_EQUALS">is not equal to</option>
              <option value="CONTAINS">contains</option>
              <option value="NOT_CONTAINS">does not contain</option>
              <option value="GREATER_THAN">is greater than</option>
              <option value="LESS_THAN">is less than</option>
              <option value="IS_EMPTY">is empty</option>
              <option value="IS_NOT_EMPTY">is not empty</option>
            </select>

            <input
              value={String(condition.value ?? "")}
              onChange={(event) =>
                updateCondition(index, "value", event.target.value)
              }
              className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
            />

            {values.conditions.length > 1 ? (
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                title="Remove condition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={addCondition}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" />
          Add another condition
        </button>
      </div>
    </section>

    <AutomatedCategoryPreview
      matchType={values.matchType}
      conditions={values.conditions}
    />
  </>
) : null}

          <CategoryProductsSection
  categorySlug={values.slug}
  enabled={values.productSourceType === "MANUAL" && Boolean(values.slug)}
/>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">SEO</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel>SEO title</InputLabel>
                <TextInput
                  value={values.seoTitle}
                  onChange={(value) => updateValue("seoTitle", value)}
                  placeholder="Bridesmaid | Shahsi"
                />
              </div>

              <div>
                <InputLabel>SEO slug</InputLabel>
                <TextInput
  value={values.seoSlug}
  onChange={(value) => updateValue("seoSlug", value)}
  placeholder="bridesmaid"
/>
              </div>
            </div>

            <div className="mt-4">
              <InputLabel>SEO description</InputLabel>
              <TextArea
                value={values.seoDescription}
                onChange={(value) => updateValue("seoDescription", value)}
                placeholder="Shop bridesmaid dresses"
                rows={4}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">
                  Metafields
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Primary/secondary category reference category tree se select
                  karo.
                </p>
              </div>
            </div>

        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
              <div>
                <InputLabel>Top menu</InputLabel>
                <TextInput
                  value={values.metafields.topMenu || ""}
                  onChange={(value) => updateMetafield("topMenu", value)}
                />
              </div>

              <div>
                <InputLabel>From blog</InputLabel>
                <TextInput
                  value={values.metafields.fromBlog || ""}
                  onChange={(value) => updateMetafield("fromBlog", value)}
                />
              </div>

              <div>
                <InputLabel>Sub heading</InputLabel>
                <TextInput
                  value={values.metafields.subHeading || ""}
                  onChange={(value) => updateMetafield("subHeading", value)}
                />
              </div>

              <CategoryReferenceSelect
                label="Primary category reference"
                placeholder="Select primary category"
                value={values.metafields.primaryCollection || ""}
                categories={categoryReferenceOptions}
                isLoading={false}
                onChange={(value) => updateMetafield("primaryCollection", value)}
              />

              <CategoryReferenceSelect
                label="Secondary category reference"
                placeholder="Select secondary category"
                value={values.metafields.secondaryCollection || ""}
                categories={categoryReferenceOptions}
                isLoading={false}
                onChange={(value) =>
                  updateMetafield("secondaryCollection", value)
                }
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">
                  FAQs
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Category page ke questions/answers.
                </p>
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {values.faqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
                  No FAQs added.
                </div>
              ) : null}

              {values.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-950">
                      FAQ #{index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-full p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <InputLabel>Question</InputLabel>
                      <TextInput
                        value={faq.question}
                        onChange={(value) =>
                          updateFaq(index, "question", value)
                        }
                        placeholder="Question"
                      />
                    </div>

                    <div>
                      <InputLabel>Answer</InputLabel>
                      <TextArea
                        value={faq.answer}
                        onChange={(value) => updateFaq(index, "answer", value)}
                        placeholder="Answer"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

       <aside className="min-w-0 space-y-5">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">Status</h2>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-950">Active</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Frontend tree me category visible rahegi.
                </p>
              </div>

              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) =>
                  updateValue("isActive", event.target.checked)
                }
                className="h-5 w-5 accent-neutral-950"
              />
            </label>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Category image
            </h2>

            {values.imageUrl ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                <img
                  src={values.imageUrl}
                  alt={values.imageAltText || values.name}
                  className="h-48 w-full object-contain"
                />
              </div>
            ) : null}

          

            <div className="mt-4">
              <InputLabel>Alt text</InputLabel>
              <TextInput
                value={values.imageAltText}
                onChange={(value) => updateValue("imageAltText", value)}
                placeholder="Lehenga category image"
              />
            </div>

           <button
  type="button"
  onClick={() => setIsImagePickerOpen(true)}
  className="mt-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 hover:bg-neutral-100"
>
  <Upload className="h-6 w-6" />
  <span className="mt-2 font-medium text-neutral-700">
    Select category image
  </span>
  <span className="mt-1 text-xs">
    Media library se Cloudinary image select hogi.
  </span>
</button>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Template
            </h2>

            <div className="mt-5">
              <InputLabel>Theme template</InputLabel>
              <TextInput
                value={values.themeTemplate}
                onChange={(value) => updateValue("themeTemplate", value)}
                placeholder="default"
              />
            </div>
          </section>
        </aside>
           </div>

      <CategoryImageMediaPicker
        open={isImagePickerOpen}
        selectedUrl={values.imageUrl}
        onClose={() => setIsImagePickerOpen(false)}
        onLocalFileSelect={(file) => {
  const previewUrl = URL.createObjectURL(file);

  setImageFile(file);
  updateValue("imageUrl", previewUrl);
  updateValue("imageName", file.name);
  updateValue("imageAltText", values.imageAltText || values.name || file.name);
}}
        onSelect={(item) => {
          const imageUrl = getCategoryMediaSrc(item);
          const imageName = getCategoryMediaFileName(item);
          const imageAltText =
            item.altText || item.title || imageName || values.name;

          updateValue("imageUrl", imageUrl);
          updateValue("imageName", imageName);
          updateValue("imageAltText", imageAltText);
          setImageFile(null);
        }}
      />
    </form>
  );
}
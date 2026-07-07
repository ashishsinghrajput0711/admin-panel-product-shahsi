"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";

import {
  getCategoryProductCategory,
  getCategoryProductId,
  getCategoryProductImage,
  getCategoryProductPrice,
  getCategoryProductStatus,
  getCategoryProductTitle,
  getCategoryProducts,
  removeCategoryProduct,
  saveCategoryProducts,
  type CategoryProductItem,
  type CategoryProductSearchItem,
} from "@/lib/admin/category-products-api";
import { CategoryProductPicker } from "./category-product-picker";

type CategoryProductsSectionProps = {
  categorySlug: string;
  enabled: boolean;
};

type ProductSortMode =
  | "MOST_RELEVANT"
  | "BEST_SELLING"
  | "TITLE_ASC"
  | "TITLE_DESC"
  | "HIGHEST_PRICE"
  | "LOWEST_PRICE"
  | "NEWEST"
  | "OLDEST"
  | "MANUAL";

function getProductSortablePrice(product: CategoryProductItem) {
  const rawPrice = String(getCategoryProductPrice(product) || "");
  const cleanPrice = rawPrice.replace(/[^0-9.]/g, "");
  return Number(cleanPrice || 0);
}

function getProductSortableDate(product: CategoryProductItem) {
  const record = product as CategoryProductItem & {
    createdAt?: string | null;
    updatedAt?: string | null;
  };

  const dateValue = record.createdAt || record.updatedAt || "";
  const timestamp = new Date(String(dateValue)).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getProductSoldCount(product: CategoryProductItem) {
  const record = product as CategoryProductItem & {
    soldCount?: number | null;
    salesCount?: number | null;
    orderCount?: number | null;
    totalSold?: number | null;
  };

  return Number(
    record.soldCount ||
      record.salesCount ||
      record.orderCount ||
      record.totalSold ||
      0,
  );
}

function getSortLabel(sortMode: ProductSortMode) {
  if (sortMode === "BEST_SELLING") return "Best selling";
  if (sortMode === "TITLE_ASC") return "Product title A-Z";
  if (sortMode === "TITLE_DESC") return "Product title Z-A";
  if (sortMode === "HIGHEST_PRICE") return "Highest price";
  if (sortMode === "LOWEST_PRICE") return "Lowest price";
  if (sortMode === "NEWEST") return "Newest";
  if (sortMode === "OLDEST") return "Oldest";
  if (sortMode === "MANUAL") return "Manually";

  return "Most relevant";
}

export function CategoryProductsSection({
  categorySlug,
  enabled,
}: CategoryProductsSectionProps) {
  const [items, setItems] = useState<CategoryProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
const [sortMode, setSortMode] = useState<ProductSortMode>("MOST_RELEVANT");

  const selectedProductIds = useMemo(
    () => items.map(getCategoryProductId).filter(Boolean),
    [items],
  );
  const visibleItems = useMemo(() => {
  const cleanSearch = searchTerm.trim().toLowerCase();

  const filteredItems = cleanSearch
    ? items.filter((product) => {
        const productId = getCategoryProductId(product);
        const title = getCategoryProductTitle(product);
        const category = getCategoryProductCategory(product);

        const sku =
          (product as CategoryProductItem & { sku?: string | null }).sku ||
          "";

        const slug =
          (product as CategoryProductItem & { slug?: string | null }).slug ||
          "";

        return [productId, title, category, sku, slug]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(cleanSearch);
      })
    : items;

  const sortedItems = [...filteredItems];

  sortedItems.sort((a, b) => {
    const titleA = getCategoryProductTitle(a).toLowerCase();
    const titleB = getCategoryProductTitle(b).toLowerCase();

    if (sortMode === "TITLE_ASC") return titleA.localeCompare(titleB);
    if (sortMode === "TITLE_DESC") return titleB.localeCompare(titleA);
    if (sortMode === "HIGHEST_PRICE") {
      return getProductSortablePrice(b) - getProductSortablePrice(a);
    }
    if (sortMode === "LOWEST_PRICE") {
      return getProductSortablePrice(a) - getProductSortablePrice(b);
    }
    if (sortMode === "NEWEST") {
      return getProductSortableDate(b) - getProductSortableDate(a);
    }
    if (sortMode === "OLDEST") {
      return getProductSortableDate(a) - getProductSortableDate(b);
    }
    if (sortMode === "BEST_SELLING") {
      return getProductSoldCount(b) - getProductSoldCount(a);
    }

    return Number(a.position || 0) - Number(b.position || 0);
  });

  return sortedItems;
}, [items, searchTerm, sortMode]);

  async function loadProducts() {
    if (!enabled || !categorySlug.trim()) return;

    try {
      setIsLoading(true);
      setApiError(null);

      const result = await getCategoryProducts({
        slug: categorySlug,
        page: 1,
        limit: 200,
      });

      const sortedItems = result.items
        .map((item, index) => ({
          ...item,
          position: Number(item.position || index + 1),
        }))
        .sort(
          (a, b) => Number(a.position || 0) - Number(b.position || 0),
        );

      setItems(sortedItems);
      setIsDirty(false);
    } catch (error) {
      setItems([]);
      setApiError(
        error instanceof Error
          ? error.message
          : "Category products load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) return;

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, categorySlug]);

  function moveItem(index: number, direction: "up" | "down") {
    setItems((current) => {
      const next = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= next.length) return current;

      const currentItem = next[index];
      const targetItem = next[targetIndex];

      next[index] = targetItem;
      next[targetIndex] = currentItem;

      return next.map((item, itemIndex) => ({
        ...item,
        position: itemIndex + 1,
      }));
    });

    setIsDirty(true);
  }

  function addProducts(products: CategoryProductSearchItem[]) {
    setItems((current) => {
      const existingIds = new Set(current.map(getCategoryProductId));

      const newItems = products
        .filter((product) => {
          const productId = getCategoryProductId(product);
          return productId && !existingIds.has(productId);
        })
        .map((product, index) => ({
          ...product,
          position: current.length + index + 1,
        }));

      return [...current, ...newItems];
    });

    setIsDirty(true);
  }

  async function handleRemove(product: CategoryProductItem) {
    const productId = getCategoryProductId(product);

    if (!productId) return;

    const confirmed = window.confirm(
      `Remove "${getCategoryProductTitle(product)}" from this category?`,
    );

    if (!confirmed) return;

    try {
      setApiError(null);

      await removeCategoryProduct({
        slug: categorySlug,
        productId,
      });

      setItems((current) =>
        current
          .filter((item) => getCategoryProductId(item) !== productId)
          .map((item, index) => ({
            ...item,
            position: index + 1,
          })),
      );

      setIsDirty(false);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Product remove failed.",
      );
    }
  }

  async function handleSaveProducts() {
    try {
      setIsSaving(true);
      setApiError(null);

      const products = items
        .map((item, index) => ({
          productId: getCategoryProductId(item),
          position: index + 1,
        }))
        .filter((item) => item.productId);

      await saveCategoryProducts({
        slug: categorySlug,
        products,
      });

      setItems((current) =>
        current.map((item, index) => ({
          ...item,
          position: index + 1,
        })),
      );

      setIsDirty(false);
      await loadProducts();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Category products save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!enabled) return null;

  return (
  <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
    <h2 className="text-base font-semibold text-neutral-950">Products</h2>

    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_320px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search products"
          className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
      >
        Browse
      </button>

      <select
        value={sortMode}
        onChange={(event) => setSortMode(event.target.value as ProductSortMode)}
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-950"
      >
        <option value="MOST_RELEVANT">Sort: Most relevant</option>
        <option value="BEST_SELLING">Best selling</option>
        <option value="TITLE_ASC">Product title A-Z</option>
        <option value="TITLE_DESC">Product title Z-A</option>
        <option value="HIGHEST_PRICE">Highest price</option>
        <option value="LOWEST_PRICE">Lowest price</option>
        <option value="NEWEST">Newest</option>
        <option value="OLDEST">Oldest</option>
        <option value="MANUAL">Manually</option>
      </select>
    </div>

    {apiError ? (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {apiError}
      </div>
    ) : null}

    {items.length ? (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {items.length} product{items.length === 1 ? "" : "s"} selected
          </span>

          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold",
              isDirty
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
            ].join(" ")}
          >
            {isDirty ? "Unsaved changes" : "Synced"}
          </span>

          {sortMode !== "MOST_RELEVANT" ? (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
              {getSortLabel(sortMode)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSaveProducts}
          disabled={isSaving || !isDirty}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save products"}
        </button>
      </div>
    ) : null}

    <div className="mt-4 border-t border-neutral-200">
      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading category products...
        </div>
      ) : visibleItems.length ? (
        <div className="divide-y divide-neutral-100">
          {visibleItems.map((product, index) => {
            const productId = getCategoryProductId(product);
            const title = getCategoryProductTitle(product);
            const image = getCategoryProductImage(product);
            const category = getCategoryProductCategory(product);
            const price = getCategoryProductPrice(product);
            const status = getCategoryProductStatus(product);

            const realIndex = items.findIndex(
              (item) => getCategoryProductId(item) === productId,
            );

            const isFirst = realIndex <= 0;
            const isLast = realIndex === items.length - 1;

            return (
              <div
                key={productId || `${title}-${index}`}
                className="flex items-center gap-4 py-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                  {image ? (
                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-neutral-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {title}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="truncate">
                      {(product as CategoryProductItem & { sku?: string | null }).sku ||
                        (product as CategoryProductItem & { slug?: string | null }).slug ||
                        productId}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="truncate">{category}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="font-semibold text-neutral-900">
                      {price}
                    </span>
                  </div>
                </div>

                <span
                  className={[
                    "hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 sm:inline-flex",
                    status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : "bg-neutral-100 text-neutral-600 ring-neutral-200",
                  ].join(" ")}
                >
                  {status}
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(realIndex, "up")}
                    disabled={isFirst}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveItem(realIndex, "down")}
                    disabled={isLast}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                    title="Remove product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
          <ImageIcon className="h-14 w-14 text-neutral-300" />

          <p className="mt-6 text-base font-medium text-neutral-800">
            {items.length
              ? "No products match your search."
              : "There are no products in this category."}
          </p>

          <p className="mt-1 text-base text-neutral-700">
            {items.length
              ? "Try changing your search or sort option."
              : "Search or browse to add products."}
          </p>
        </div>
      )}
    </div>

    <CategoryProductPicker
      open={isPickerOpen}
      categorySlug={categorySlug}
      selectedProductIds={selectedProductIds}
      onClose={() => setIsPickerOpen(false)}
      onAddProducts={addProducts}
    />
  </section>
);
}
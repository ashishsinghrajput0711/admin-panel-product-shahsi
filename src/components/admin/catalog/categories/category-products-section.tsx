"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Loader2,
  RefreshCcw,
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

  const selectedProductIds = useMemo(
    () => items.map(getCategoryProductId).filter(Boolean),
    [items],
  );

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
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-neutral-950">
              Products in this category
            </h2>

            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
              Manual listing
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Manual category ke products assign aur reorder karo. Final order
            save karne ke baad storefront me same order dikhega.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Search className="h-4 w-4" />
            Browse products
          </button>

          <button
            type="button"
            onClick={handleSaveProducts}
            disabled={isSaving || !isDirty}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save products"}
          </button>
        </div>
      </div>

      {apiError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {apiError}
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-[24px] border border-neutral-200 bg-neutral-50 p-8 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading category products...
          </div>
        ) : items.length ? (
          <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
            <div className="max-h-[520px] overflow-y-auto">
              <div className="divide-y divide-neutral-100">
                {items.map((product, index) => {
                  const productId = getCategoryProductId(product);
                  const title = getCategoryProductTitle(product);
                  const image = getCategoryProductImage(product);
                  const category = getCategoryProductCategory(product);
                  const price = getCategoryProductPrice(product);
                  const status = getCategoryProductStatus(product);
                  const isFirst = index === 0;
                  const isLast = index === items.length - 1;

                  return (
                    <div
                      key={productId || `${title}-${index}`}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-neutral-50/80"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
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
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-neutral-950">
                              {title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                              <span className="truncate">
                                {product.sku || product.slug || productId}
                              </span>
                              <span className="text-neutral-300">•</span>
                              <span className="truncate">{category}</span>
                              <span className="text-neutral-300">•</span>
                              <span className="font-semibold text-neutral-900">
                                {price}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-3">
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1",
                                status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                  : "bg-neutral-100 text-neutral-600 ring-neutral-200",
                              ].join(" ")}
                            >
                              {status}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moveItem(index, "up")}
                                disabled={isFirst}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Move up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => moveItem(index, "down")}
                                disabled={isLast}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Move down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemove(product)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                                title="Remove product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3">
              <p className="text-xs text-neutral-500">
                Tip: Reorder/remove ke baad{" "}
                <span className="font-semibold text-neutral-800">
                  Save products
                </span>{" "}
                click karna zaroori hai, tabhi final order backend me persist
                hoga.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
              <Search className="h-6 w-6 text-neutral-400" />
            </div>

            <h3 className="text-base font-semibold text-neutral-900">
              No products assigned yet
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Browse products par click karke products select karo. Save karne
              ke baad storefront par ye category ke under show honge.
            </p>

            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Search className="h-4 w-4" />
              Browse products
            </button>
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
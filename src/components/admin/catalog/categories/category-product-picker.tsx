"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, Search, X } from "lucide-react";

import {
  getCategoryProductCategory,
  getCategoryProductId,
  getCategoryProductImage,
  getCategoryProductPrice,
  getCategoryProductStatus,
  getCategoryProductTitle,
  searchProductsForCategory,
  type CategoryProductSearchItem,
} from "@/lib/admin/category-products-api";

type CategoryProductPickerProps = {
  open: boolean;
  categorySlug: string;
  selectedProductIds: string[];
  onClose: () => void;
  onAddProducts: (products: CategoryProductSearchItem[]) => void;
};

export function CategoryProductPicker({
  open,
  categorySlug,
  selectedProductIds,
  onClose,
  onAddProducts,
}: CategoryProductPickerProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CategoryProductSearchItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const alreadySelectedSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds],
  );

  async function loadProducts(nextPage = 1, nextSearch = search) {
    try {
      setIsLoading(true);
      setApiError(null);

      const result = await searchProductsForCategory({
        search: nextSearch,
        page: nextPage,
        limit: 20,
        status: "ACTIVE",
        excludeCategorySlug: categorySlug,
      });

      setItems(result.items);
      setPage(result.page || nextPage);
      setTotal(result.total);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setApiError(
        error instanceof Error
          ? error.message
          : "Products search failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    setSelectedIds([]);
    loadProducts(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categorySlug]);

  function toggleProduct(product: CategoryProductSearchItem) {
    const productId = getCategoryProductId(product);

    if (!productId || alreadySelectedSet.has(productId)) return;

    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function handleAddSelected() {
    const selectedProducts = items.filter((item) =>
      selectedSet.has(getCategoryProductId(item)),
    );

    onAddProducts(selectedProducts);
    setSelectedIds([]);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950">
              Browse products
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Manual category me assign karne ke liye products select karo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadProducts(1, search);
                  }
                }}
                placeholder="Search title, SKU, slug..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <button
              type="button"
              onClick={() => loadProducts(1, search)}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Search
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>{total} products found</span>
            <span>•</span>
            <span>{selectedIds.length} selected</span>
          </div>
        </div>

        {apiError ? (
          <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {apiError}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading products...
            </div>
          ) : items.length ? (
            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
              {items.map((product) => {
                const productId = getCategoryProductId(product);
                const title = getCategoryProductTitle(product);
                const image = getCategoryProductImage(product);
                const alreadySelected = alreadySelectedSet.has(productId);
                const selected = selectedSet.has(productId);

                return (
                  <button
                    key={productId || title}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    disabled={alreadySelected}
                    className={[
                      "grid w-full gap-4 p-4 text-left transition md:grid-cols-[44px_1fr_120px_120px_110px] md:items-center",
                      selected ? "bg-neutral-950 text-white" : "bg-white",
                      alreadySelected
                        ? "cursor-not-allowed opacity-45"
                        : "hover:bg-neutral-50",
                    ].join(" ")}
                  >
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {title}
                      </p>
                      <p
                        className={[
                          "mt-1 truncate text-xs",
                          selected ? "text-white/60" : "text-neutral-500",
                        ].join(" ")}
                      >
                        {product.sku || product.slug || productId}
                      </p>
                    </div>

                    <p className="truncate text-sm">
                      {getCategoryProductCategory(product)}
                    </p>

                    <p className="text-sm font-semibold">
                      {getCategoryProductPrice(product)}
                    </p>

                    <span
                      className={[
                        "w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                        selected
                          ? "bg-white/15 text-white"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
                      ].join(" ")}
                    >
                      {alreadySelected
                        ? "Added"
                        : selected
                          ? "Selected"
                          : getCategoryProductStatus(product)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-500">
              No products found.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <button
              type="button"
              onClick={() => loadProducts(Math.max(1, page - 1), search)}
              disabled={page <= 1 || isLoading}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => loadProducts(page + 1, search)}
              disabled={page >= totalPages || isLoading}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddSelected}
            disabled={!selectedIds.length}
            className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add {selectedIds.length || ""} product
            {selectedIds.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
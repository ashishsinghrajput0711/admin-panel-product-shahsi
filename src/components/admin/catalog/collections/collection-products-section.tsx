"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";

import {
  getCollectionProducts,
  removeCollectionProduct,
  reorderCollectionProducts,
  saveCollectionProducts,
  searchProductsForCollection,
  type CollectionProductItem,
  type ProductPickerItem,
} from "@/lib/admin/catalog-collection-products-api";

type CollectionProductsSectionProps = {
  collectionId: string;
  apiRootUrl: string;
  token?: string | null;
  pickerPageSize?: number;
};

const DEFAULT_PRODUCT_PICKER_PAGE_SIZE = 50;

function getProductTitle(product: CollectionProductItem | ProductPickerItem) {
  return product.title || product.name || "Untitled product";
}

function getProductImage(product: CollectionProductItem | ProductPickerItem) {
  return product.thumbnail || product.imageUrl || "";
}

function getProductCategory(product: CollectionProductItem | ProductPickerItem) {
  return product.primaryCategory || product.category || "—";
}

function getProductStatus(product: CollectionProductItem | ProductPickerItem) {
  return String(product.status || "DRAFT").toUpperCase();
}

function getProductSubline(product: CollectionProductItem | ProductPickerItem) {
  return product.sku || product.slug || product.id;
}

function getPrice(product: CollectionProductItem | ProductPickerItem) {
  if (product.price === null || product.price === undefined) return "—";

  const value = Number(product.price);

  if (Number.isNaN(value)) {
    return String(product.price);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapPickerProductToAssignedProduct(
  product: ProductPickerItem,
  position: number
): CollectionProductItem {
  return {
    id: product.id,
    title: product.title,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    thumbnail: product.thumbnail,
    imageUrl: product.imageUrl,
    status: product.status,
    price: product.price,
    category: product.category,
    primaryCategory: product.primaryCategory,
    position,
  };
}

export function CollectionProductsSection({
  collectionId,
  apiRootUrl,
  token,
  pickerPageSize = DEFAULT_PRODUCT_PICKER_PAGE_SIZE,
}: CollectionProductsSectionProps) {
  const [assignedProducts, setAssignedProducts] = useState<
    CollectionProductItem[]
  >([]);

  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(
    () => new Set()
  );

  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerItems, setPickerItems] = useState<ProductPickerItem[]>([]);
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerLimit, setPickerLimit] = useState(pickerPageSize);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [pickerTotalPages, setPickerTotalPages] = useState(1);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const assignedIds = useMemo(() => {
    return new Set(assignedProducts.map((item) => item.id));
  }, [assignedProducts]);

  const hasUnsavedChanges = useMemo(() => {
    if (assignedProducts.length !== savedProductIds.size) {
      return true;
    }

    return assignedProducts.some((product) => !savedProductIds.has(product.id));
  }, [assignedProducts, savedProductIds]);

  const pickerRangeText = useMemo(() => {
    if (!pickerTotal || !pickerItems.length) {
      return "";
    }

    const start = (pickerPage - 1) * pickerLimit + 1;
    const end = Math.min(start + pickerItems.length - 1, pickerTotal);

    return `${start}-${end} of ${pickerTotal} products`;
  }, [pickerItems.length, pickerLimit, pickerPage, pickerTotal]);

  const loadAssignedProducts = useCallback(async () => {
    try {
      setIsLoadingAssigned(true);
      setSectionError(null);

      const result = await getCollectionProducts({
        apiRootUrl,
        token,
        collectionId,
        page: 1,
        limit: 100,
      });

      const nextProducts = result.items || [];

      setAssignedProducts(nextProducts);
      setSavedProductIds(new Set(nextProducts.map((product) => product.id)));
    } catch (error) {
      setSectionError(
        error instanceof Error
          ? error.message
          : "Collection products load failed."
      );
    } finally {
      setIsLoadingAssigned(false);
    }
  }, [apiRootUrl, collectionId, token]);

  const loadPickerProducts = useCallback(
    async (nextPage = 1) => {
      try {
        setIsPickerLoading(true);
        setSectionError(null);

        const result = await searchProductsForCollection({
          apiRootUrl,
          token,
          search: pickerSearch,
          page: nextPage,
          limit: pickerPageSize,
        });

        setPickerItems(result.items || []);
        setPickerPage(result.page || nextPage || 1);
        setPickerLimit(result.limit || pickerPageSize);
        setPickerTotal(result.total || 0);
        setPickerTotalPages(result.totalPages || 1);
      } catch (error) {
        setSectionError(
          error instanceof Error
            ? error.message
            : "Products picker load failed."
        );
      } finally {
        setIsPickerLoading(false);
      }
    },
    [apiRootUrl, pickerPageSize, pickerSearch, token]
  );

  useEffect(() => {
    loadAssignedProducts();
  }, [loadAssignedProducts]);

  useEffect(() => {
    if (!pickerOpen) return;

    const timeout = window.setTimeout(() => {
      loadPickerProducts(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [pickerOpen, pickerSearch, loadPickerProducts]);

  function addProduct(product: ProductPickerItem) {
    if (assignedIds.has(product.id)) return;

    setSuccessMessage(null);
    setSectionError(null);

    setAssignedProducts((current) => [
      ...current,
      mapPickerProductToAssignedProduct(product, current.length + 1),
    ]);
  }

  function removeProductFromLocal(productId: string) {
    setAssignedProducts((current) =>
      current
        .filter((product) => product.id !== productId)
        .map((product, index) => ({
          ...product,
          position: index + 1,
        }))
    );
  }

  function reorderLocalProducts(nextProducts: CollectionProductItem[]) {
    setSuccessMessage(null);
    setSectionError(null);

    setAssignedProducts(
      nextProducts.map((product, index) => ({
        ...product,
        position: index + 1,
      }))
    );
  }

  function moveProduct(productId: string, direction: "up" | "down") {
    const currentIndex = assignedProducts.findIndex(
      (product) => product.id === productId
    );

    if (currentIndex === -1) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= assignedProducts.length) return;

    const nextProducts = [...assignedProducts];
    const currentProduct = nextProducts[currentIndex];
    const targetProduct = nextProducts[nextIndex];

    nextProducts[currentIndex] = targetProduct;
    nextProducts[nextIndex] = currentProduct;

    reorderLocalProducts(nextProducts);
  }

  function shuffleProducts() {
    if (assignedProducts.length <= 1) return;

    const nextProducts = [...assignedProducts];

    for (let index = nextProducts.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const currentProduct = nextProducts[index];

      nextProducts[index] = nextProducts[randomIndex];
      nextProducts[randomIndex] = currentProduct;
    }

    reorderLocalProducts(nextProducts);
  }

  async function handleSaveAssignments() {
    try {
      setIsSaving(true);
      setSectionError(null);
      setSuccessMessage(null);

      const productIds = assignedProducts.map((product) => product.id);

      await saveCollectionProducts({
        apiRootUrl,
        token,
        collectionId,
        productIds,
      });

      if (productIds.length) {
        await reorderCollectionProducts({
          apiRootUrl,
          token,
          collectionId,
          productIds,
        });
      }

      setSuccessMessage("Collection products saved and reordered successfully.");
      await loadAssignedProducts();

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);
    } catch (error) {
      setSectionError(
        error instanceof Error
          ? error.message
          : "Collection products save failed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveProduct(product: CollectionProductItem) {
    const isAlreadySaved = savedProductIds.has(product.id);

    if (!isAlreadySaved) {
      removeProductFromLocal(product.id);
      return;
    }

    const confirmed = window.confirm(
      `"${getProductTitle(product)}" ko collection se remove karna hai?`
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      setSectionError(null);
      setSuccessMessage(null);

      await removeCollectionProduct({
        apiRootUrl,
        token,
        collectionId,
        productId: product.id,
      });

      setSuccessMessage("Product removed from collection.");
      await loadAssignedProducts();

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);
    } catch (error) {
      setSectionError(
        error instanceof Error
          ? error.message
          : "Collection product remove failed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-neutral-950">
            Products in this collection
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Manual collection ke products assign aur remove karo.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-neutral-400">
              {assignedProducts.length} product
              {assignedProducts.length === 1 ? "" : "s"} selected
            </p>

            {hasUnsavedChanges ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={loadAssignedProducts}
            disabled={isLoadingAssigned || isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoadingAssigned ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Browse products
          </button>

          <button
            type="button"
            onClick={shuffleProducts}
            disabled={assignedProducts.length <= 1 || isSaving || isLoadingAssigned}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </button>

          <button
            type="button"
            onClick={handleSaveAssignments}
            disabled={isSaving || isLoadingAssigned}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save products"
            )}
          </button>
        </div>
      </div>

      {sectionError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {sectionError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200">
        {isLoadingAssigned ? (
          <div className="flex items-center justify-center gap-2 p-8 text-center text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products...
          </div>
        ) : assignedProducts.length ? (
          <div className="divide-y divide-neutral-100">
            {assignedProducts.map((product) => {
              const title = getProductTitle(product);
              const image = getProductImage(product);
              const isUnsavedProduct = !savedProductIds.has(product.id);

              return (
                <div
                  key={product.id}
                  className="grid gap-4 p-4 md:grid-cols-[70px_minmax(0,1fr)_140px_120px_120px_auto] md:items-center"
                >
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-neutral-300" />

                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveProduct(product.id, "up")}
                        disabled={isSaving || assignedProducts[0]?.id === product.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveProduct(product.id, "down")}
                        disabled={
                          isSaving ||
                          assignedProducts[assignedProducts.length - 1]?.id === product.id
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {title}
                        </p>

                        {isUnsavedProduct ? (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
                            New
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {getProductSubline(product)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600">
                    {getProductCategory(product)}
                  </p>

                  <p className="text-sm font-semibold text-neutral-900">
                    {getPrice(product)}
                  </p>

                  <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-100">
                    {getProductStatus(product)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product)}
                    disabled={isSaving}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    title={
                      isUnsavedProduct
                        ? "Remove from selection"
                        : "Remove product"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-neutral-800">
              No products assigned yet.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Browse products click karke products add karo.
            </p>
          </div>
        )}
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 p-5">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">
                  Browse products
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Collection me add karne ke liye products select karo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-neutral-200 p-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={pickerSearch}
                  onChange={(event) => setPickerSearch(event.target.value)}
                  placeholder="Search products by title, SKU, category"
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isPickerLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-center text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : pickerItems.length ? (
                <div className="divide-y divide-neutral-100">
                  {pickerItems.map((product) => {
                    const title = getProductTitle(product);
                    const image = getProductImage(product);
                    const alreadyAdded = assignedIds.has(product.id);

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-neutral-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {title}
                            </p>
                            <p className="mt-1 truncate text-xs text-neutral-500">
                              {getProductSubline(product)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              {getProductCategory(product)} •{" "}
                              {getPrice(product)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addProduct(product)}
                          disabled={alreadyAdded}
                          className="inline-flex h-10 min-w-[92px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-950 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:opacity-100"
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Added
                            </>
                          ) : (
                            "Add"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No products found.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 p-5">
              <button
                type="button"
                onClick={() => loadPickerProducts(Math.max(1, pickerPage - 1))}
                disabled={pickerPage <= 1 || isPickerLoading}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700">
                  Page {pickerPage} of {pickerTotalPages}
                </p>

                {pickerRangeText ? (
                  <p className="mt-1 text-xs text-neutral-400">
                    {pickerRangeText}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() =>
                  loadPickerProducts(Math.min(pickerTotalPages, pickerPage + 1))
                }
                disabled={pickerPage >= pickerTotalPages || isPickerLoading}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="border-t border-neutral-200 bg-[#fbfaf7] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-neutral-500">
                  {assignedProducts.length} products selected. Click Save
                  products after closing this picker.
                </p>

                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
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

type PickerSortOption =
  | "most-relevant"
  | "best-selling"
  | "title-asc"
  | "title-desc"
  | "highest-price"
  | "lowest-price"
  | "newest"
  | "oldest"
  | "manually";

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

function reorderProductsByDrag(
  products: CollectionProductItem[],
  fromIndex: number,
  toIndex: number
) {
  if (fromIndex === toIndex) return products;
  if (fromIndex < 0 || toIndex < 0) return products;
  if (fromIndex >= products.length || toIndex >= products.length) return products;

  const nextProducts = [...products];
  const [movedProduct] = nextProducts.splice(fromIndex, 1);

  if (!movedProduct) return products;

  nextProducts.splice(toIndex, 0, movedProduct);

  return nextProducts.map((product, index) => ({
    ...product,
    position: index + 1,
  }));
}

function sortPickerProducts(
  items: ProductPickerItem[],
  sortBy: PickerSortOption
): ProductPickerItem[] {
  const nextItems = [...items];

  switch (sortBy) {
    case "title-asc":
      return nextItems.sort((a, b) =>
        getProductTitle(a).localeCompare(getProductTitle(b))
      );

    case "title-desc":
      return nextItems.sort((a, b) =>
        getProductTitle(b).localeCompare(getProductTitle(a))
      );

    case "highest-price":
      return nextItems.sort(
        (a, b) => Number(b.price || 0) - Number(a.price || 0)
      );

    case "lowest-price":
      return nextItems.sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0)
      );

    case "newest":
      return nextItems.reverse();

    case "oldest":
      return nextItems;

    case "best-selling":
    case "most-relevant":
    case "manually":
    default:
      return nextItems;
  }
}

function getStatusBadgeClasses(status: string) {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  if (normalizedStatus === "DRAFT") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
  }

  return "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200";
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
  const [pickerSort, setPickerSort] =
    useState<PickerSortOption>("best-selling");

  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(
    null
  );

  const assignedIds = useMemo(() => {
    return new Set(assignedProducts.map((item) => item.id));
  }, [assignedProducts]);

  const savedOrderKey = useMemo(() => {
    return Array.from(savedProductIds).join("|");
  }, [savedProductIds]);

  const currentOrderKey = useMemo(() => {
    return assignedProducts.map((product) => product.id).join("|");
  }, [assignedProducts]);

  const hasUnsavedChanges = useMemo(() => {
    if (assignedProducts.length !== savedProductIds.size) {
      return true;
    }

    if (savedOrderKey && currentOrderKey !== savedOrderKey) {
      return true;
    }

    return assignedProducts.some((product) => !savedProductIds.has(product.id));
  }, [assignedProducts, currentOrderKey, savedOrderKey, savedProductIds]);

  const pickerRangeText = useMemo(() => {
    if (!pickerTotal || !pickerItems.length) return "";

    const start = (pickerPage - 1) * pickerLimit + 1;
    const end = Math.min(start + pickerItems.length - 1, pickerTotal);

    return `${start}-${end} of ${pickerTotal} products`;
  }, [pickerItems.length, pickerLimit, pickerPage, pickerTotal]);

  const sortedPickerItems = useMemo(() => {
    return sortPickerProducts(pickerItems, pickerSort);
  }, [pickerItems, pickerSort]);

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

      const nextProducts = (result.items || []).map((product, index) => ({
        ...product,
        position: index + 1,
      }));

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
    }, 250);

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
    setSuccessMessage(null);
    setSectionError(null);

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

  function handleDragStart(productId: string) {
    if (isSaving || isLoadingAssigned) return;

    setDraggedProductId(productId);
    setDragOverProductId(productId);
    setSuccessMessage(null);
    setSectionError(null);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    targetProductId: string
  ) {
    event.preventDefault();

    if (!draggedProductId || draggedProductId === targetProductId) return;

    setDragOverProductId(targetProductId);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetProductId: string
  ) {
    event.preventDefault();

    if (!draggedProductId) return;

    const fromIndex = assignedProducts.findIndex(
      (product) => product.id === draggedProductId
    );
    const toIndex = assignedProducts.findIndex(
      (product) => product.id === targetProductId
    );

    if (fromIndex === -1 || toIndex === -1) return;

    reorderLocalProducts(
      reorderProductsByDrag(assignedProducts, fromIndex, toIndex)
    );

    setDraggedProductId(null);
    setDragOverProductId(null);
  }

  function handleDragEnd() {
    setDraggedProductId(null);
    setDragOverProductId(null);
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

      setSuccessMessage("Collection products saved successfully.");
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
    <>
      <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="rounded-[24px] border border-neutral-100 bg-[#fbfaf7] p-4">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-neutral-950 sm:text-2xl">
                  Products in this collection
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Drag handle se products reorder karo. Final order save karne
                  ke liye Save products click karo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                  {assignedProducts.length} product
                  {assignedProducts.length === 1 ? "" : "s"} selected
                </span>

                {hasUnsavedChanges ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                    Unsaved changes
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Synced
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={loadAssignedProducts}
                  disabled={isLoadingAssigned || isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${
                      isLoadingAssigned ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />
                  Browse products
                </button>

                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={isSaving || isLoadingAssigned}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-950 bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>

          {sectionError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {sectionError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <div className="space-y-2.5">
            {isLoadingAssigned ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading products...
              </div>
            ) : assignedProducts.length ? (
              assignedProducts.map((product, index) => {
                const title = getProductTitle(product);
                const image = getProductImage(product);
                const status = getProductStatus(product);
                const category = getProductCategory(product);
                const subline = getProductSubline(product);
                const isUnsavedProduct = !savedProductIds.has(product.id);
                const isDragging = draggedProductId === product.id;
                const isDropTarget =
                  dragOverProductId === product.id &&
                  draggedProductId !== product.id;

                return (
                  <div
                    key={product.id}
                    draggable={!isSaving && !isLoadingAssigned}
                    onDragStart={() => handleDragStart(product.id)}
                    onDragOver={(event) => handleDragOver(event, product.id)}
                    onDrop={(event) => handleDrop(event, product.id)}
                    onDragEnd={handleDragEnd}
                    className={[
                      "group rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all duration-200",
                      "hover:border-neutral-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]",
                      isDragging
                        ? "scale-[0.99] border-neutral-900 bg-neutral-50 opacity-60"
                        : "border-neutral-200",
                      isDropTarget ? "ring-2 ring-neutral-950 ring-offset-2" : "",
                    ].join(" ")}
                  >
                    <div className="grid grid-cols-[42px_38px_70px_minmax(0,1fr)_44px] items-center gap-3">
                      <button
                        type="button"
                        className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-neutral-400 hover:bg-white hover:text-neutral-700 active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
                        {index + 1}
                      </span>

                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
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
                        <div className="flex min-w-0 items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-neutral-950">
                            {title}
                          </h3>

                          {isUnsavedProduct ? (
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700 ring-1 ring-amber-100">
                              New
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {subline}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="max-w-[160px] truncate rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            {category}
                          </span>

                          <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">
                            {getPrice(product)}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${getStatusBadgeClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product)}
                        disabled={isSaving}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title={
                          isUnsavedProduct
                            ? "Remove from selection"
                            : "Remove product"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-neutral-900">
                  No products assigned yet
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Browse products karke collection me products add karo.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[9999] bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="mx-auto flex h-[90vh] max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  Products
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Search, sort aur select karke collection me products add karo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-neutral-200 px-6 py-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <label className="relative block flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={pickerSearch}
                    onChange={(event) => setPickerSearch(event.target.value)}
                    placeholder="Search products"
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => loadPickerProducts(1)}
                  disabled={isPickerLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-60"
                >
                  {isPickerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Browse
                </button>

                <div className="relative min-w-[240px]">
                  <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                  <select
                    value={pickerSort}
                    onChange={(event) =>
                      setPickerSort(event.target.value as PickerSortOption)
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-neutral-200 bg-white pl-11 pr-10 text-sm text-neutral-800 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                  >
                    <option value="most-relevant">Sort: Most relevant</option>
                    <option value="best-selling">Sort: Best selling</option>
                    <option value="title-asc">Product title A-Z</option>
                    <option value="title-desc">Product title Z-A</option>
                    <option value="highest-price">Highest price</option>
                    <option value="lowest-price">Lowest price</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="manually">Manually</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isPickerLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : sortedPickerItems.length ? (
                <div>
                  <div className="hidden grid-cols-[70px_92px_minmax(0,1fr)_120px_130px_88px] items-center gap-4 border-b border-neutral-200 bg-neutral-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 lg:grid">
                    <div>#</div>
                    <div>Image</div>
                    <div>Product</div>
                    <div>Price</div>
                    <div>Status</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {sortedPickerItems.map((product, index) => {
                      const title = getProductTitle(product);
                      const image = getProductImage(product);
                      const alreadyAdded = assignedIds.has(product.id);
                      const status = getProductStatus(product);

                      return (
                        <div
                          key={product.id}
                          className="grid gap-4 px-6 py-4 transition hover:bg-neutral-50 lg:grid-cols-[70px_92px_minmax(0,1fr)_120px_130px_88px] lg:items-center"
                        >
                          <div className="text-sm font-semibold text-neutral-700">
                            {(pickerPage - 1) * pickerLimit + index + 1}.
                          </div>

                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
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
                            <p className="line-clamp-2 text-sm font-medium leading-6 text-neutral-900">
                              {title}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {getProductCategory(product)} •{" "}
                              {getProductSubline(product)}
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-neutral-900">
                            {getPrice(product)}
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="flex justify-start lg:justify-end">
                            <button
                              type="button"
                              onClick={() => addProduct(product)}
                              disabled={alreadyAdded}
                              className={`inline-flex h-10 min-w-[76px] items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                                alreadyAdded
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              {alreadyAdded ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Check className="h-4 w-4" />
                                  Added
                                </span>
                              ) : (
                                "Add"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-center">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      No products found
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Search change karke dobara try karo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-neutral-200 bg-[#fcfbf8] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  Page {pickerPage} of {pickerTotalPages}
                </p>

                {pickerRangeText ? (
                  <p className="mt-1 text-xs text-neutral-400">
                    {pickerRangeText}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadPickerProducts(Math.max(1, pickerPage - 1))}
                  disabled={pickerPage <= 1 || isPickerLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadPickerProducts(
                      Math.min(pickerTotalPages, pickerPage + 1)
                    )
                  }
                  disabled={pickerPage >= pickerTotalPages || isPickerLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="ml-2 inline-flex h-10 items-center rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
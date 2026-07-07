"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ImageIcon, Loader2, Plus, Search, X } from "lucide-react";

import {
  getCategoryProductId,
  getCategoryProductImage,
  getCategoryProductStatus,
  getCategoryProductTitle,
  searchProductsForCategory,
  type CategoryProductSearchFilters,
  type CategoryProductSearchItem,
} from "@/lib/admin/category-products-api";

type CategoryProductPickerProps = {
  open: boolean;
  categorySlug: string;
  selectedProductIds: string[];
  onClose: () => void;
  onAddProducts: (products: CategoryProductSearchItem[]) => void;
};

type ProductSearchBy = "all" | "title" | "productId" | "barcode" | "sku";
type ActiveFilterType = "categories" | "types" | "tags" | "vendors" | null;

const emptyFilters: CategoryProductSearchFilters = {
  categories: [],
  types: [],
  vendors: [],
  tags: [],
};

function getFilterLabel(filter: ActiveFilterType) {
  if (filter === "categories") return "Categories";
  if (filter === "types") return "Types";
  if (filter === "tags") return "Tags";
  if (filter === "vendors") return "Vendors";

  return "";
}

function getFilterOptions(
  filter: ActiveFilterType,
  filters: CategoryProductSearchFilters,
) {
  if (filter === "categories") return filters.categories;
  if (filter === "types") return filters.types;
  if (filter === "tags") return filters.tags;
  if (filter === "vendors") return filters.vendors;

  return [];
}

export function CategoryProductPicker({
  open,
  categorySlug,
  selectedProductIds,
  onClose,
  onAddProducts,
}: CategoryProductPickerProps) {
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState<ProductSearchBy>("all");

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterType>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const [availableFilters, setAvailableFilters] =
    useState<CategoryProductSearchFilters>(emptyFilters);

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

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    selectedVendors.length > 0;

  function toggleValue(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function clearAllFilters() {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedTags([]);
    setSelectedVendors([]);
    setActiveFilter(null);
    setIsFilterMenuOpen(false);
  }

  async function loadProducts(
    nextPage = 1,
    nextSearch = search,
    nextSearchBy = searchBy,
    nextCategories = selectedCategories,
    nextTypes = selectedTypes,
    nextTags = selectedTags,
    nextVendors = selectedVendors,
  ) {
    try {
      setIsLoading(true);
      setApiError(null);

      const result = await searchProductsForCategory({
        search: nextSearch,
        searchBy: nextSearchBy,
        category: nextCategories.join(","),
        type: nextTypes.join(","),
        tags: nextTags.join(","),
        vendor: nextVendors.join(","),
        page: nextPage,
        limit: 20,
        status: "ACTIVE",
        excludeCategorySlug: categorySlug,
      });

      setItems(result.items);
      setPage(result.page || nextPage);
      setTotal(result.total);
      setTotalPages(result.totalPages || 1);
      setAvailableFilters(result.filters || emptyFilters);
    } catch (error) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setApiError(
        error instanceof Error ? error.message : "Products search failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    setSelectedIds([]);
    setSearch("");
    setSearchBy("all");
    setIsFilterMenuOpen(false);
    setActiveFilter(null);
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedTags([]);
    setSelectedVendors([]);
    void loadProducts(1, "", "all", [], [], [], []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categorySlug]);

  useEffect(() => {
    if (!open) return;

    void loadProducts(
      1,
      search,
      searchBy,
      selectedCategories,
      selectedTypes,
      selectedTags,
      selectedVendors,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedTypes, selectedTags, selectedVendors]);

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

  function renderFilterChip(
    label: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    if (!values.length) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2">
        <span className="text-xs font-semibold text-neutral-700">{label}</span>

        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
          >
            {value}
            <button
              type="button"
              onClick={() =>
                setter((current) => current.filter((item) => item !== value))
              }
              className="text-neutral-400 hover:text-neutral-950"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  }

  if (!open) return null;

  const activeFilterOptions = getFilterOptions(activeFilter, availableFilters);

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-neutral-950">
            Add products
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();

                    void loadProducts(
                      1,
                      search,
                      searchBy,
                      selectedCategories,
                      selectedTypes,
                      selectedTags,
                      selectedVendors,
                    );
                  }
                }}
                placeholder="Search products"
                className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <select
              value={searchBy}
              onChange={(event) => {
                const nextValue = event.target.value as ProductSearchBy;
                setSearchBy(nextValue);

                void loadProducts(
                  1,
                  search,
                  nextValue,
                  selectedCategories,
                  selectedTypes,
                  selectedTags,
                  selectedVendors,
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 outline-none focus:border-neutral-950"
            >
              <option value="all">Search by All</option>
              <option value="title">Product title</option>
              <option value="productId">Product ID</option>
              <option value="barcode">Barcode</option>
              <option value="sku">SKU</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {activeFilter ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveFilter(null)}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {getFilterLabel(activeFilter)}
                  <span className="text-neutral-400">⌄</span>
                </button>

                <div className="absolute left-0 top-11 z-20 max-h-80 w-80 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-2 text-sm shadow-xl">
                  {activeFilterOptions.length ? (
                    activeFilterOptions.map((option) => {
                      const checked =
                        activeFilter === "categories"
                          ? selectedCategories.includes(option)
                          : activeFilter === "types"
                            ? selectedTypes.includes(option)
                            : activeFilter === "tags"
                              ? selectedTags.includes(option)
                              : selectedVendors.includes(option);

                      return (
                        <button
                          key={`${activeFilter}-${option}`}
                          type="button"
                          onClick={() => {
                            if (activeFilter === "categories") {
                              toggleValue(option, setSelectedCategories);
                            }

                            if (activeFilter === "types") {
                              toggleValue(option, setSelectedTypes);
                            }

                            if (activeFilter === "tags") {
                              toggleValue(option, setSelectedTags);
                            }

                            if (activeFilter === "vendors") {
                              toggleValue(option, setSelectedVendors);
                            }
                          }}
                          className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                        >
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                              checked
                                ? "border-neutral-950 bg-neutral-950 text-white"
                                : "border-neutral-300 bg-white text-transparent",
                            ].join(" ")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>

                          <span className="leading-5">{option}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-sm text-neutral-500">
                      No filter options found.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen((current) => !current)}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-dashed border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Add filter
                <Plus className="h-4 w-4" />
              </button>

              {isFilterMenuOpen ? (
                <div className="absolute left-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 text-sm shadow-xl">
                  {[
                    { label: "Categories", value: "categories" },
                    { label: "Types", value: "types" },
                    { label: "Tags", value: "tags" },
                    { label: "Vendors", value: "vendors" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => {
                        setActiveFilter(filter.value as ActiveFilterType);
                        setIsFilterMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {renderFilterChip("Categories", selectedCategories, setSelectedCategories)}
            {renderFilterChip("Types", selectedTypes, setSelectedTypes)}
            {renderFilterChip("Tags", selectedTags, setSelectedTags)}
            {renderFilterChip("Vendors", selectedVendors, setSelectedVendors)}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-950"
              >
                Clear all
              </button>
            ) : null}

            <span className="text-xs text-neutral-500">
              {total} products found
            </span>

            <span className="text-xs text-neutral-400">•</span>

            <span className="text-xs text-neutral-500">
              {selectedIds.length} selected
            </span>
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
                const status = getCategoryProductStatus(product);
                const alreadySelected = alreadySelectedSet.has(productId);
                const selected = selectedSet.has(productId);

                return (
                  <button
                    key={productId || title}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    disabled={alreadySelected}
                    className={[
                      "flex w-full items-center gap-4 px-5 py-3 text-left transition",
                      selected ? "bg-neutral-50" : "bg-white",
                      alreadySelected
                        ? "cursor-not-allowed opacity-45"
                        : "hover:bg-neutral-50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-4 w-4" />
                    </span>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-200">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {title}
                        </p>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            alreadySelected
                              ? "bg-neutral-100 text-neutral-500"
                              : status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-neutral-100 text-neutral-600",
                          ].join(" ")}
                        >
                          {alreadySelected ? "Added" : status}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {product.sku || product.slug || productId}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center text-center text-sm text-neutral-500">
              No products found.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void loadProducts(
                  Math.max(1, page - 1),
                  search,
                  searchBy,
                  selectedCategories,
                  selectedTypes,
                  selectedTags,
                  selectedVendors,
                )
              }
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
              onClick={() =>
                void loadProducts(
                  page + 1,
                  search,
                  searchBy,
                  selectedCategories,
                  selectedTypes,
                  selectedTags,
                  selectedVendors,
                )
              }
              disabled={page >= totalPages || isLoading}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAddSelected}
              disabled={!selectedIds.length}
              className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
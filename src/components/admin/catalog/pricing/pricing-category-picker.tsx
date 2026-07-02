"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FolderTree, Loader2, Search, X } from "lucide-react";

import {
  searchPricingCategories,
  unwrapPickerCategories,
  type PricingPickerCategory,
} from "@/lib/admin/dynamic-pricing-api";

function getCategoryLabel(category: PricingPickerCategory) {
  return (
    category.fullPath ||
    category.path ||
    category.label ||
    category.title ||
    category.name ||
    category.slug ||
    category.id
  );
}

function getCategoryTargetValue(category: PricingPickerCategory) {
  // Backend Swagger says categoryId can be slug or id.
  // Prefer id if available; if backend expects slug, change this to category.slug first.
  return category.id || category.slug || "";
}

function categoryMatchesQuery(category: PricingPickerCategory, query: string) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) return true;

  const haystack = [
    category.id,
    category.name,
    category.title,
    category.label,
    category.slug,
    category.path,
    category.fullPath,
    category.parentName,
    category.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(cleanQuery);
}

export function PricingCategoryPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (category: PricingPickerCategory) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<PricingPickerCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      setIsLoading(true);
      setError("");

      const response = await searchPricingCategories("");
      setCategories(unwrapPickerCategories(response));
    } catch (err: any) {
      console.error("Category picker load failed:", err);
      setError(err?.message || "Category picker load failed.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    loadCategories();
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      categoryMatchesQuery(category, query),
    );
  }, [categories, query]);

  const selectedLabel = useMemo(() => {
    const selected = categories.find((item) => {
      const target = getCategoryTargetValue(item);
      return target === value || item.id === value || item.slug === value;
    });

    return selected ? getCategoryLabel(selected) : "";
  }, [categories, value]);

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          <FolderTree className="mr-2 h-4 w-4" />
          Pick Category
        </button>

        {value ? (
          <div className="flex min-w-0 flex-1 items-center rounded-xl bg-[#fbfaf6] px-3 text-xs text-neutral-600">
            <span className="truncate">
              {selectedLabel ? `${selectedLabel} · ` : ""}
              {value}
            </span>
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[1.5rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-neutral-950">
                  Select Category
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Search category by name, slug, path or category ID.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:text-neutral-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search category name, slug or path..."
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-neutral-950"
                  autoFocus
                />
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 max-h-[420px] overflow-y-auto rounded-2xl border border-neutral-200">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : null}

                {!isLoading && !filteredCategories.length ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No categories found.
                  </div>
                ) : null}

                {!isLoading
                  ? filteredCategories.map((category) => {
                      const targetValue = getCategoryTargetValue(category);
                      const isSelected =
                        targetValue === value ||
                        category.id === value ||
                        category.slug === value;

                      return (
                        <button
                          key={category.id || category.slug}
                          type="button"
                          onClick={() => {
                            onSelect(category);
                            setIsOpen(false);
                          }}
                          className="flex w-full items-center gap-4 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fbfaf6]"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7f2ea] text-neutral-700">
                            <FolderTree className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-950">
                              {getCategoryLabel(category)}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                              {category.slug ? (
                                <span>Slug: {category.slug}</span>
                              ) : null}

                              {category.parentName ? (
                                <span>Parent: {category.parentName}</span>
                              ) : null}

                              {category.status ? (
                                <span>Status: {category.status}</span>
                              ) : null}

                              {category.productCount !== undefined &&
                              category.productCount !== null ? (
                                <span>Products: {category.productCount}</span>
                              ) : null}
                            </div>

                            <p className="mt-1 truncate text-xs text-neutral-400">
                              ID: {category.id}
                            </p>
                          </div>

                          {isSelected ? (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
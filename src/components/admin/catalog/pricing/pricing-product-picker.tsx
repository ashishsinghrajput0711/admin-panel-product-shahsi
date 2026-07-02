"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import {
  searchPricingProducts,
  unwrapPickerProducts,
  type PricingPickerProduct,
} from "@/lib/admin/dynamic-pricing-api";

function getProductTitle(product: PricingPickerProduct) {
  return product.title || product.name || product.slug || product.id;
}

function getProductImage(product: PricingPickerProduct) {
  return product.imageUrl || product.thumbnailUrl || product.thumbnail || "";
}

export function PricingProductPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (product: PricingPickerProduct) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<PricingPickerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts(searchText: string) {
    try {
      setIsLoading(true);
      setError("");

      const response = await searchPricingProducts(searchText);
      setProducts(unwrapPickerProducts(response));
    } catch (err: any) {
      console.error("Product picker search failed:", err);
      setError(err?.message || "Product search failed.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      loadProducts(query);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, isOpen]);

  const selectedLabel = useMemo(() => {
    const selected = products.find((item) => item.id === value);
    return selected ? getProductTitle(selected) : "";
  }, [products, value]);

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          <Search className="mr-2 h-4 w-4" />
          Pick Product
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
                  Select Product
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Search product and attach it to this pricing rule.
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
                  placeholder="Search by product name, SKU or slug..."
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
                    Searching products...
                  </div>
                ) : null}

                {!isLoading && !products.length ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No products found.
                  </div>
                ) : null}

                {!isLoading
                  ? products.map((product) => {
                      const image = getProductImage(product);
                      const isSelected = product.id === value;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            onSelect(product);
                            setIsOpen(false);
                          }}
                          className="flex w-full items-center gap-4 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fbfaf6]"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image}
                                alt={getProductTitle(product)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-neutral-400">
                                No image
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-950">
                              {getProductTitle(product)}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                              {product.sku ? <span>SKU: {product.sku}</span> : null}
                              {product.slug ? <span>Slug: {product.slug}</span> : null}
                              {product.status ? <span>Status: {product.status}</span> : null}
                            </div>

                            <p className="mt-1 truncate text-xs text-neutral-400">
                              ID: {product.id}
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
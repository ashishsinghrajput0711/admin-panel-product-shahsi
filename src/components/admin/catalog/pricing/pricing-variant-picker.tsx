"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import {
  searchPricingVariants,
  unwrapPickerVariants,
  type PricingPickerVariant,
} from "@/lib/admin/dynamic-pricing-api";

function getVariantTitle(variant: PricingPickerVariant) {
  const productName =
    variant.product?.title ||
    variant.product?.name ||
    variant.productTitle ||
    variant.productName ||
    "";

  const parts = [
    productName,
    variant.title || variant.name,
    variant.size ? `Size ${variant.size}` : "",
    variant.color,
  ].filter(Boolean);

  return parts.join(" · ") || variant.sku || variant.id;
}

function getVariantImage(variant: PricingPickerVariant) {
  return (
    variant.imageUrl ||
    variant.thumbnailUrl ||
    variant.thumbnail ||
    variant.product?.imageUrl ||
    variant.product?.thumbnailUrl ||
    variant.product?.thumbnail ||
    ""
  );
}

function variantMatchesQuery(variant: PricingPickerVariant, query: string) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) return true;

  const haystack = [
    variant.id,
    variant.productId,
    variant.title,
    variant.name,
    variant.sku,
    variant.size,
    variant.color,
    variant.status,
    variant.product?.title,
    variant.product?.name,
    variant.product?.slug,
    variant.productTitle,
    variant.productName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(cleanQuery);
}

export function PricingVariantPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (variant: PricingPickerVariant) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [variants, setVariants] = useState<PricingPickerVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVariants() {
    try {
      setIsLoading(true);
      setError("");

      const response = await searchPricingVariants("");
      setVariants(unwrapPickerVariants(response));
    } catch (err: any) {
      console.error("Variant picker load failed:", err);
      setError(err?.message || "Variant picker load failed.");
      setVariants([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    loadVariants();
  }, [isOpen]);

  const filteredVariants = useMemo(() => {
    return variants.filter((variant) => variantMatchesQuery(variant, query));
  }, [variants, query]);

  const selectedLabel = useMemo(() => {
    const selected = variants.find((item) => item.id === value);
    return selected ? getVariantTitle(selected) : "";
  }, [variants, value]);

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          <Search className="mr-2 h-4 w-4" />
          Pick Variant
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
                  Select Variant
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Search variant by product, SKU, size, color or variant ID.
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
                  placeholder="Search by product name, SKU, size, color..."
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
                    Loading variants...
                  </div>
                ) : null}

                {!isLoading && !filteredVariants.length ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No variants found.
                  </div>
                ) : null}

                {!isLoading
                  ? filteredVariants.map((variant) => {
                      const image = getVariantImage(variant);
                      const isSelected = variant.id === value;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            onSelect(variant);
                            setIsOpen(false);
                          }}
                          className="flex w-full items-center gap-4 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fbfaf6]"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image}
                                alt={getVariantTitle(variant)}
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
                              {getVariantTitle(variant)}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                              {variant.sku ? <span>SKU: {variant.sku}</span> : null}
                              {variant.size ? <span>Size: {variant.size}</span> : null}
                              {variant.color ? <span>Color: {variant.color}</span> : null}
                              {variant.status ? <span>Status: {variant.status}</span> : null}
                            </div>

                            <p className="mt-1 truncate text-xs text-neutral-400">
                              Variant ID: {variant.id}
                            </p>

                            {variant.productId ? (
                              <p className="mt-1 truncate text-xs text-neutral-400">
                                Product ID: {variant.productId}
                              </p>
                            ) : null}
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
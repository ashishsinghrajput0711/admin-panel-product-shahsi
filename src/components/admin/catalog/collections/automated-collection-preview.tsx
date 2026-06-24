"use client";

import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, RefreshCcw } from "lucide-react";

import {
  previewAutomatedCollectionProducts,
  type ProductPickerItem,
} from "@/lib/admin/catalog-collection-products-api";

import type { CollectionCondition } from "@/lib/admin/catalog-collections-api";

type AutomatedCollectionPreviewProps = {
  apiRootUrl?: string;
  token?: string | null;
  matchType: "ALL" | "ANY";
  conditions: CollectionCondition[];
};

function getProductTitle(product: ProductPickerItem) {
  return product.title || product.name || "Untitled product";
}

function getProductImage(product: ProductPickerItem) {
  return product.thumbnail || product.imageUrl || "";
}

function getProductCategory(product: ProductPickerItem) {
  return product.primaryCategory || product.category || "—";
}

function getProductStatus(product: ProductPickerItem) {
  return String(product.status || "DRAFT").toUpperCase();
}

function getProductSubline(product: ProductPickerItem) {
  return product.sku || product.slug || product.id;
}

function getPrice(product: ProductPickerItem) {
  if (product.price === null || product.price === undefined) return "—";

  const value = Number(product.price);

  if (Number.isNaN(value)) return String(product.price);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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

export function AutomatedCollectionPreview({
  apiRootUrl,
  token,
  matchType,
  conditions,
}: AutomatedCollectionPreviewProps) {
  const requestRef = useRef(0);

  const [items, setItems] = useState<ProductPickerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState("empty");

  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const validConditions = useMemo(() => {
    return conditions.filter(
      (condition) =>
        String(condition.field || "").trim() &&
        String(condition.operator || "").trim(),
    );
  }, [conditions]);

  async function loadPreview(nextPage = 1) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!apiRootUrl) {
      setPreviewError("API root URL missing hai.");
      return;
    }

    if (!validConditions.length) {
      setPreviewError("Preview ke liye kam se kam ek condition add karo.");
      setItems([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setLoadedKey("empty");
      return;
    }

    try {
      setIsLoading(true);
      setPreviewError(null);

      const result = await previewAutomatedCollectionProducts({
        apiRootUrl,
        token,
        matchType,
        conditions: validConditions,
        page: nextPage,
        limit: 20,
      });

      if (requestRef.current !== requestId) {
        return;
      }

      const nextItems = Array.isArray(result.items) ? result.items : [];
      const nextLimit = Number(result.limit || 20);
      const nextTotal = Number(result.total || nextItems.length || 0);
      const nextTotalPages =
        Number(result.totalPages || 0) ||
        Math.max(1, Math.ceil(nextTotal / Math.max(1, nextLimit)));

      const resolvedPage = Number(result.page || nextPage || 1);

      setItems(nextItems);
      setPage(resolvedPage);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      setLoadedKey(
        `${resolvedPage}-${nextItems.map((product) => product.id).join("|")}`,
      );
    } catch (error) {
      if (requestRef.current !== requestId) {
        return;
      }

      setPreviewError(
        error instanceof Error
          ? error.message
          : "Automated preview load failed.",
      );
    } finally {
      if (requestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="mt-5 rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">
            Matching products preview
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Conditions ke basis par matching products preview karo. Ye collection
            save nahi karta.
          </p>

          <p className="mt-2 text-sm text-neutral-400">
            {total} product{total === 1 ? "" : "s"} matched
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPreview(1)}
          disabled={isLoading || !validConditions.length}
          className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-neutral-950 bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {isLoading ? "Previewing..." : "Preview products"}
        </button>
      </div>

      {previewError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {previewError}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-center text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading matching products...
          </div>
        ) : items.length ? (
          <div key={loadedKey} className="divide-y divide-neutral-100">
            {items.map((product) => {
              const title = getProductTitle(product);
              const image = getProductImage(product);
              const status = getProductStatus(product);

              return (
                <div
                  key={`${page}-${product.id}`}
                  className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_120px_110px_100px] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
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
                      <p className="truncate text-sm font-semibold text-neutral-950">
                        {title}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {getProductSubline(product)}
                      </p>
                    </div>
                  </div>

                  <p className="truncate text-sm text-neutral-600">
                    {getProductCategory(product)}
                  </p>

                  <p className="text-sm font-semibold text-neutral-900">
                    {getPrice(product)}
                  </p>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getStatusBadgeClasses(
                      status,
                    )}`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-neutral-800">
              No preview loaded yet.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Conditions set karke Preview products click karo.
            </p>
          </div>
        )}
      </div>

      {items.length ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => loadPreview(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>

          <button
            type="button"
            onClick={() => loadPreview(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
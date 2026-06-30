"use client";

import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, RefreshCcw } from "lucide-react";

import type {
  CategoryCondition,
  CategoryConditionMatchType,
} from "@/components/admin/catalog/categories/category-types";
import {
  getAutomatedPreviewProductCategory,
  getAutomatedPreviewProductImage,
  getAutomatedPreviewProductPrice,
  getAutomatedPreviewProductStatus,
  getAutomatedPreviewProductTitle,
  previewAutomatedCategoryProducts,
  type AutomatedCategoryPreviewProduct,
} from "@/lib/admin/category-conditions-preview-api";

type AutomatedCategoryPreviewProps = {
  matchType: CategoryConditionMatchType;
  conditions: CategoryCondition[];
};

function getStatusBadgeClass(status: string) {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  if (normalizedStatus === "DRAFT") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
  }

  if (normalizedStatus === "INACTIVE" || normalizedStatus === "ARCHIVED") {
    return "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200";
  }

  return "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200";
}

function getValidConditions(conditions: CategoryCondition[]) {
  return conditions.filter(
    (condition) =>
      String(condition.field || "").trim() &&
      String(condition.operator || "").trim(),
  );
}

export function AutomatedCategoryPreview({
  matchType,
  conditions,
}: AutomatedCategoryPreviewProps) {
  const requestRef = useRef(0);

  const [items, setItems] = useState<AutomatedCategoryPreviewProduct[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const validConditions = useMemo(
    () => getValidConditions(conditions),
    [conditions],
  );

  async function loadPreview(nextPage = 1) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!validConditions.length) {
      setPreviewError("Preview ke liye kam se kam ek condition add karo.");
      setItems([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setHasLoadedOnce(false);
      return;
    }

    try {
      setIsLoading(true);
      setPreviewError(null);

      const result = await previewAutomatedCategoryProducts({
        matchType,
        conditions: validConditions,
        page: nextPage,
        limit,
      });

      if (requestRef.current !== requestId) return;

      setItems(Array.isArray(result.items) ? result.items : []);
      setPage(Number(result.page || nextPage || 1));
      setLimit(Number(result.limit || limit || 20));
      setTotal(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      setHasLoadedOnce(true);
    } catch (error) {
      if (requestRef.current !== requestId) return;

      setItems([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Automated category preview failed.",
      );
    } finally {
      if (requestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            Matching products preview
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Automated conditions ke basis par matching products preview karo.
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Ye category save nahi karta.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              {validConditions.length} condition
              {validConditions.length === 1 ? "" : "s"}
            </span>

            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              Match {matchType === "ANY" ? "any" : "all"}
            </span>

            {hasLoadedOnce ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {total} products matched
              </span>
            ) : null}
          </div>
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
          <>
            {/* Scrollable list */}
            <div className="max-h-[700px] overflow-y-auto">
              <div className="divide-y divide-neutral-100">
                {items.map((product, index) => {
                  const title = getAutomatedPreviewProductTitle(product);
                  const image = getAutomatedPreviewProductImage(product);
                  const status = getAutomatedPreviewProductStatus(product);

                  return (
                    <div
                      key={`${product.id || product.slug || title}-${index}`}
                      className="grid gap-4 p-4 md:grid-cols-[44px_minmax(0,1fr)_140px_110px_100px] md:items-center"
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
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {title}
                        </p>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {product.sku || product.slug || product.id}
                        </p>
                      </div>

                      <p className="truncate text-sm text-neutral-600">
                        {getAutomatedPreviewProductCategory(product)}
                      </p>

                      <p className="text-sm font-semibold text-neutral-900">
                        {getAutomatedPreviewProductPrice(product)}
                      </p>

                      <span
                        className={[
                          "w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                          getStatusBadgeClass(status),
                        ].join(" ")}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination fixed below scroll area */}
            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-4">
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
          </>
        ) : hasLoadedOnce ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-neutral-900">
              No matching products found.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Conditions change karke dobara preview karo.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-neutral-900">
              No preview loaded yet.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Conditions set karke Preview products click karo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
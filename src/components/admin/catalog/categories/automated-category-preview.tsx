"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, Tag } from "lucide-react";

import { getAdminApiRootUrl, getAdminToken } from "@/lib/admin/category-api";
import type { CategoryFormValues } from "@/components/admin/catalog/categories/category-types";

type PreviewProduct = {
  id?: string | null;
  productId?: string | null;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  category?: string | null;
  categoryName?: string | null;
  productType?: string | null;
  price?: number | string | null;
};

type PreviewResponse = {
  success?: boolean;
  data?: {
    products?: PreviewProduct[];
    items?: PreviewProduct[];
    total?: number;
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
  products?: PreviewProduct[];
  items?: PreviewProduct[];
  total?: number;
  message?: string | string[];
  error?: unknown;
};

function getPreviewProductId(product: PreviewProduct) {
  return String(product.productId || product.id || "").trim();
}

function getPreviewProductTitle(product: PreviewProduct) {
  return product.title || product.name || "Untitled product";
}

function getPreviewProductImage(product: PreviewProduct) {
  return product.thumbnail || product.imageUrl || product.image || "";
}

function getPreviewProductStatus(product: PreviewProduct) {
  return String(product.statusLabel || product.status || "DRAFT").toUpperCase();
}

function getPreviewProductCategory(product: PreviewProduct) {
  return product.categoryName || product.category || product.productType || "—";
}

function getPreviewProductPrice(product: PreviewProduct) {
  if (
    product.price === null ||
    product.price === undefined ||
    product.price === ""
  ) {
    return "—";
  }

  const value = Number(product.price);

  if (Number.isNaN(value)) return String(product.price);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRawPreviewProductPrice(product: PreviewProduct) {
  const value = Number(product.price || 0);
  return Number.isFinite(value) ? value : 0;
}

function getRawPreviewProductDate(product: PreviewProduct) {
  const record = product as PreviewProduct & {
    createdAt?: string | null;
    updatedAt?: string | null;
  };

  const timestamp = new Date(
    String(record.createdAt || record.updatedAt || ""),
  ).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortPreviewProducts(products: PreviewProduct[], sortMode: string) {
  const sortedProducts = [...products];

  sortedProducts.sort((a, b) => {
    const titleA = getPreviewProductTitle(a).toLowerCase();
    const titleB = getPreviewProductTitle(b).toLowerCase();

    if (sortMode === "TITLE_ASC") {
      return titleA.localeCompare(titleB);
    }

    if (sortMode === "TITLE_DESC") {
      return titleB.localeCompare(titleA);
    }

    if (sortMode === "HIGHEST_PRICE") {
      return getRawPreviewProductPrice(b) - getRawPreviewProductPrice(a);
    }

    if (sortMode === "LOWEST_PRICE") {
      return getRawPreviewProductPrice(a) - getRawPreviewProductPrice(b);
    }

    if (sortMode === "NEWEST") {
      return getRawPreviewProductDate(b) - getRawPreviewProductDate(a);
    }

    if (sortMode === "OLDEST") {
      return getRawPreviewProductDate(a) - getRawPreviewProductDate(b);
    }

    return 0;
  });

  return sortedProducts;
}

function getApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (Array.isArray(record.message)) return record.message.join(", ");
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (Array.isArray(record.error)) {
    return record.error.join(", ");
  }

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}



async function fetchAutomatedCategoryPreview({
  matchType,
  conditions,
  page,
}: {
  matchType: CategoryFormValues["matchType"];
  conditions: CategoryFormValues["conditions"];
  page: number;
}) {
  const apiRootUrl = getAdminApiRootUrl();
  const token = getAdminToken();
 

 const payload = {
  matchType,
  conditions,
  page: String(page),
  limit: "20",
};

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/conditions/preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    },
  );

  const data = (await response.json().catch(() => null)) as
    | PreviewResponse
    | null;

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Automated category preview failed: ${response.status}`),
    );
  }

  const products =
    data?.data?.products ||
    data?.data?.items ||
    data?.products ||
    data?.items ||
    [];

  const meta = data?.data?.meta;

  return {
    products: Array.isArray(products) ? products : [],
    total:
      Number(meta?.total || data?.data?.total || data?.total || products.length) ||
      0,
    page: Number(meta?.page || page) || page,
    totalPages:
      Number(meta?.totalPages || Math.ceil((products.length || 0) / 20)) || 1,
  };
}

export function AutomatedCategoryPreview({
  matchType,
  conditions,
}: {
  matchType: CategoryFormValues["matchType"];
  conditions: CategoryFormValues["conditions"];
}) {
  const [sortMode, setSortMode] = useState("MOST_RELEVANT");
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validConditions = useMemo(() => {
    return conditions.filter((condition) => {
      const field = String(condition.field || "").trim();
      const operator = String(condition.operator || "").trim();
      const value = condition.value;

      const operatorDoesNotNeedValue =
        operator === "IS_EMPTY" || operator === "IS_NOT_EMPTY";

      return (
        field &&
        operator &&
        (operatorDoesNotNeedValue ||
          String(value ?? "")
            .trim()
            .length > 0)
      );
    });
  }, [conditions]);

  const hasUsefulConditions = validConditions.length > 0;

  const sortedProducts = useMemo(() => {
  return sortPreviewProducts(products, sortMode);
}, [products, sortMode]);

  async function loadPreview(nextPage = 1) {
    if (!hasUsefulConditions) {
      setProducts([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setApiError(null);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

     const result = await fetchAutomatedCategoryPreview({
  matchType,
  conditions: validConditions,
  page: nextPage,
});

      setProducts(result.products);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      setProducts([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
      setApiError(
        error instanceof Error
          ? error.message
          : "Matching products preview failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
   void loadPreview(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [matchType, validConditions]);

  return (
    <section className="rounded-[1.5rem] bg-white shadow-sm ring-1 ring-neutral-200">
      <div className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-neutral-950">
            Products
          </h2>

          {hasUsefulConditions ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {total} products matched
            </span>
          ) : null}
        </div>

        <select
          value={sortMode}
     onChange={(event) => {
  setSortMode(event.target.value);
}}
          className="mt-5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 outline-none transition focus:border-neutral-950"
        >
          <option value="MOST_RELEVANT">Sort: Most relevant</option>
          <option value="BEST_SELLING">Best selling</option>
          <option value="TITLE_ASC">Product title A-Z</option>
          <option value="TITLE_DESC">Product title Z-A</option>
          <option value="HIGHEST_PRICE">Highest price</option>
          <option value="LOWEST_PRICE">Lowest price</option>
          <option value="NEWEST">Newest</option>
          <option value="OLDEST">Oldest</option>
        </select>
      </div>

      <div className="border-t border-neutral-200">
        {apiError ? (
          <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {apiError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading matching products...
          </div>
    ) : sortedProducts.length ? (
          <div className="divide-y divide-neutral-100">
        {sortedProducts.map((product) => {
              const productId = getPreviewProductId(product);
              const title = getPreviewProductTitle(product);
              const image = getPreviewProductImage(product);
              const status = getPreviewProductStatus(product);
              const category = getPreviewProductCategory(product);
              const price = getPreviewProductPrice(product);

              return (
                <div
                  key={productId || title}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
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
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span>{product.sku || product.slug || productId}</span>
                      <span className="text-neutral-300">•</span>
                      <span>{category}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="font-semibold text-neutral-900">
                        {price}
                      </span>
                    </div>
                  </div>

                  <span
                    className={[
                      "hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 sm:inline-flex",
                      status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-neutral-100 text-neutral-600 ring-neutral-200",
                    ].join(" ")}
                  >
                    {status}
                  </span>
                </div>
              );
            })}

            <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
              <button
                type="button"
                onClick={() => void loadPreview(Math.max(1, page - 1))}
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
                onClick={() => void loadPreview(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
            <Tag className="h-14 w-14 text-neutral-300" />

            <p className="mt-6 text-base font-medium text-neutral-800">
              There are no products in this category.
            </p>

            <p className="mt-1 text-base text-neutral-700">
              {hasUsefulConditions
                ? "Add or change conditions to add products."
                : "Add conditions to add products."}
            </p>

            <p className="mt-3 text-xs text-neutral-400">
              {matchType === "ALL"
                ? "Matching all conditions"
                : "Matching any condition"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
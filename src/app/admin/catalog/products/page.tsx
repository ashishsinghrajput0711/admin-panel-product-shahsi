"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductTable } from "@/components/admin/catalog/products/product-table";
import type { Product } from "@/components/admin/catalog/products/product-types";

const PAGE_SIZE = 20;

type ProductsApiResponse = {
  success?: boolean;
  data?: {
    data?: Product[];
    products?: Product[];
    count?: number;
    total?: number;
    totalPages?: number;
  };
  products?: Product[];
  count?: number;
  total?: number;
  totalPages?: number;
  error?: unknown;
  message?: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";
type ModeFilter = "ALL" | "retail" | "rental" | "resale" | "made_to_order";

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error(
      "NEXT_PUBLIC_ADMIN_API_URL missing hai. .env.local me real backend URL set karo."
    );
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

function buildProductsUrl({
  page,
  search,
  status,
  mode,
}: {
  page: number;
  search: string;
  status: StatusFilter;
  mode: ModeFilter;
}) {
  const url = new URL(`${getApiRootUrl()}/admin/catalog`);

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("sortBy", "updatedAt");
  url.searchParams.set("sortOrder", "desc");

  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  if (status !== "ALL") {
    url.searchParams.set("status", status);
  }

  if (mode !== "ALL") {
    url.searchParams.set("mode", mode);
  }

  return url.toString();
}

function extractProductsPayload(response: ProductsApiResponse) {
  const dataRoot = response.data;

  const products =
    dataRoot && Array.isArray(dataRoot.data)
      ? dataRoot.data
      : dataRoot && Array.isArray(dataRoot.products)
        ? dataRoot.products
        : Array.isArray(response.products)
          ? response.products
          : [];

  const total =
    typeof dataRoot?.total === "number"
      ? dataRoot.total
      : typeof response.total === "number"
        ? response.total
        : typeof dataRoot?.count === "number"
          ? dataRoot.count
          : typeof response.count === "number"
            ? response.count
            : products.length;

  const totalPages =
    typeof dataRoot?.totalPages === "number"
      ? dataRoot.totalPages
      : typeof response.totalPages === "number"
        ? response.totalPages
        : Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { products, total, totalPages };
}

function productStatus(product: Product) {
  return String(
    product.adminStatus || product.statusLabel || product.status || "MISSING"
  ).toUpperCase();
}

function productHasMissingData(product: Product) {
  const title = product.title || product.name;
  const category =
    product.category ||
    product.primaryCategory ||
    product.categoryName ||
    product.categories?.[0];

  const price =
    product.basePrice ??
    product.listingPrice ??
    product.price ??
    product.salePrice ??
    null;

  return !product.id || !title || !product.sku || !category || price == null;
}

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");

  const totalPages = useMemo(() => {
    return Math.max(1, apiTotalPages || Math.ceil(total / PAGE_SIZE));
  }, [apiTotalPages, total]);

  const stats = useMemo(() => {
    const active = products.filter((item) =>
      ["ACTIVE", "PUBLISHED"].includes(productStatus(item))
    ).length;

    const draft = products.filter((item) => productStatus(item) === "DRAFT")
      .length;

    const missing = products.filter(productHasMissingData).length;

    const media = products.filter((item) => (item.images?.length ?? 0) > 0)
      .length;

    return { active, draft, missing, media };
  }, [products]);

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);

  async function loadProducts(options?: { refresh?: boolean }) {
    try {
      if (options?.refresh) setIsRefreshing(true);
      else setIsLoading(true);

      setApiError(null);

      const token = getToken();

      const url = buildProductsUrl({
        page: currentPage,
        search: searchQuery,
        status: statusFilter,
        mode: modeFilter,
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const text = await response.text();
      let json: ProductsApiResponse;

      try {
        json = JSON.parse(text) as ProductsApiResponse;
      } catch {
        throw new Error(`Products API JSON response nahi de rahi. Body: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          json.message ||
            `Products API failed: ${response.status} ${response.statusText}`
        );
      }

      const payload = extractProductsPayload(json);

      setProducts(payload.products);
      setTotal(payload.total);
      setApiTotalPages(payload.totalPages);
    } catch (error) {
      setProducts([]);
      setTotal(0);
      setApiTotalPages(1);
      setApiError(error instanceof Error ? error.message : "Products API failed.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter, modeFilter]);

  function resetFilters() {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("ALL");
    setModeFilter("ALL");
    setCurrentPage(1);
  }

  function setStatus(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function setMode(value: ModeFilter) {
    setModeFilter(value);
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] p-4 text-neutral-950 md:p-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Admin / Catalog
            </p>

            <div className="mt-2 flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-semibold text-neutral-950 md:text-4xl">
                Products
              </h1>

              <span className="mb-1 inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                {total} matching products
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg"
              onClick={() => loadProducts({ refresh: true })}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </Button>

            <Button asChild className="h-9 rounded-lg bg-neutral-950 text-white">
              <Link href="/admin/catalog/products/new">
                <Plus className="mr-2 h-4 w-4" />
                New product
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<Package className="h-4 w-4" />} label="Loaded page" value={products.length} tone="neutral" />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Active on page" value={stats.active} tone="green" />
        <MetricCard icon={<Package className="h-4 w-4" />} label="Draft on page" value={stats.draft} tone="blue" />
        <MetricCard icon={<ImageIcon className="h-4 w-4" />} label="With media" value={stats.media} tone="neutral" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Needs review" value={stats.missing} tone="amber" />
      </section>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto] xl:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search all products by title, SKU, category, brand"
              className="h-10 rounded-lg pl-9"
            />
          </label>

          <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
            {(["ALL", "ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(status)}
                  className={`h-8 rounded-md px-3 text-xs font-medium transition ${
                    statusFilter === status
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-950"
                  }`}
                >
                  {status === "ALL" ? "All status" : status}
                </button>
              )
            )}
          </div>

          <select
            value={modeFilter}
            onChange={(event) => setMode(event.target.value as ModeFilter)}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none focus:ring-2 focus:ring-neutral-950/10"
          >
            <option value="ALL">All modes</option>
            <option value="retail">Retail</option>
            <option value="made_to_order">Made-to-order</option>
            <option value="rental">Rental</option>
            <option value="resale">Resale</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
          <span>
            Backend result:{" "}
            <span className="font-semibold text-neutral-950">{total}</span>{" "}
            matching products · current page has{" "}
            <span className="font-semibold text-neutral-950">{products.length}</span>
          </span>

          {searchInput || statusFilter !== "ALL" || modeFilter !== "ALL" ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {apiError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Products API error</p>
            <p className="mt-1">
              Real backend data fetch fail hua. Fallback/mock data use nahi kiya gaya.
            </p>
            <div className="mt-3 rounded-md bg-white/70 px-4 py-3 text-xs">
              {apiError}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <ProductTable products={products} isLoading={isLoading} />
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-4 md:flex-row md:items-center">
          <p className="text-sm text-neutral-500">
            Showing {startItem}-{endItem} of {total} matching products · Page{" "}
            {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={isLoading || currentPage <= 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="rounded-lg border border-neutral-200 px-4 py-2 text-sm">
              {currentPage}
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={isLoading || currentPage >= totalPages}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "green" | "blue" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "blue"
        ? "bg-sky-50 text-sky-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-neutral-100 text-neutral-700";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}
        >
          {icon}
        </span>
        <span className="text-2xl font-semibold text-neutral-950">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-600">{label}</p>
    </div>
  );
}
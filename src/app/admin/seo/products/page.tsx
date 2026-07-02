"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

type ProductStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED" | "UNLISTED";
type SortBy = "title" | "productType" | "createdAt" | "updatedAt" | "inventory" | "vendor";
type SortOrder = "asc" | "desc";

type ProductSeoListItem = {
  id: string | null;
  productId: string;
  name: string;
  slug: string | null;
  image: string | null;
  productType: string | null;
  vendor: string | null;
  inventory: number | null;
  productStatus: string | null;
  seoScore: number;
  updatedAt: string | null;
  createdAt: string | null;
  hasSeoRecord: boolean;
};

type LegacyProductSeoListItem = {
  id?: string | null;
  productId?: string;
  seoRecordId?: string | null;
  name?: string;
  title?: string;
  productName?: string;
  productTitle?: string;
  slug?: string | null;
  productSlug?: string | null;
  image?: string | null;
  productImage?: string | null;
  thumbnail?: string | null;
  productType?: string | null;
  type?: string | null;
  vendor?: string | null;
  inventory?: number | string | null;
  inventoryCount?: number | string | null;
  productStatus?: string | null;
  status?: string | null;
  seoScore?: number | string | null;
  score?: number | string | null;
  overallScore?: number | string | null;
  onPageScore?: number | string | null;
  seoScoreBreakdown?: {
    overallScore?: number | string | null;
  } | null;
  scores?: {
    overallScore?: number | string | null;
    seoScore?: number | string | null;
    score?: number | string | null;
  } | null;
  seo?: {
    seoScore?: number | string | null;
    score?: number | string | null;
    overallScore?: number | string | null;
    seoScoreBreakdown?: {
      overallScore?: number | string | null;
    } | null;
  } | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  hasSeoRecord?: boolean;
};

type ProductSeoListResponse = {
  data?:
    | LegacyProductSeoListItem[]
    | {
        products?: LegacyProductSeoListItem[];
        data?: LegacyProductSeoListItem[];
        items?: LegacyProductSeoListItem[];
        results?: LegacyProductSeoListItem[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
  products?: LegacyProductSeoListItem[];
  items?: LegacyProductSeoListItem[];
  results?: LegacyProductSeoListItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  message?: string;
};

type FilterMetadataResponse = {
  data?: {
    vendors?: string[];
    productTypes?: string[];
    types?: string[];
  };
  vendors?: string[];
  productTypes?: string[];
  types?: string[];
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

function clampScore(value: unknown) {
  return Math.max(0, Math.min(100, Math.round(toNumber(value, 0))));
}

function getSeoScore(item: LegacyProductSeoListItem) {
  const possibleScores = [
    item.seoScore,
    item.score,
    item.overallScore,
    item.onPageScore,
    item.seoScoreBreakdown?.overallScore,
    item.scores?.overallScore,
    item.scores?.seoScore,
    item.scores?.score,
    item.seo?.seoScore,
    item.seo?.score,
    item.seo?.overallScore,
    item.seo?.seoScoreBreakdown?.overallScore,
  ];

  const firstValid = possibleScores.find((value) => {
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") return value.trim() && Number.isFinite(Number(value));
    return false;
  });

  return clampScore(firstValid);
}

function normalizeProduct(item: LegacyProductSeoListItem): ProductSeoListItem {
  const productId = item.productId || "";
  const seoRecordId = item.seoRecordId ?? item.id ?? null;

  return {
    id: seoRecordId,
    productId,
    name:
      item.name ||
      item.productName ||
      item.productTitle ||
      item.title ||
      "Untitled product",
    slug: item.slug ?? item.productSlug ?? null,
    image: item.image ?? item.productImage ?? item.thumbnail ?? null,
    productType: item.productType ?? item.type ?? null,
    vendor: item.vendor ?? null,
    inventory:
      item.inventory == null && item.inventoryCount == null
        ? null
        : toNumber(item.inventory ?? item.inventoryCount, 0),
    productStatus: item.productStatus ?? item.status ?? null,
    seoScore: getSeoScore(item),
    updatedAt: item.updatedAt ?? null,
    createdAt: item.createdAt ?? null,
    hasSeoRecord: Boolean(item.hasSeoRecord ?? seoRecordId),
  };
}

function extractListPayload(response: ProductSeoListResponse) {
  const dataObject =
    response.data && !Array.isArray(response.data) ? response.data : undefined;

  const rawProducts = Array.isArray(response.data)
    ? response.data
    : dataObject?.products ||
      dataObject?.data ||
      dataObject?.items ||
      dataObject?.results ||
      response.products ||
      response.items ||
      response.results ||
      [];

  const products = rawProducts.map(normalizeProduct).filter((item) => item.productId);
  const total = dataObject?.total ?? response.total ?? products.length;
  const page = dataObject?.page ?? response.page ?? 1;
  const limit = dataObject?.limit ?? response.limit ?? PAGE_SIZE;
  const totalPages =
    dataObject?.totalPages ??
    response.totalPages ??
    Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return { products, total, page, limit, totalPages };
}

function extractFiltersPayload(response: FilterMetadataResponse) {
  const vendors = response.data?.vendors || response.vendors || [];
  const productTypes =
    response.data?.productTypes ||
    response.productTypes ||
    response.data?.types ||
    response.types ||
    [];

  return {
    vendors: Array.from(new Set(vendors.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    productTypes: Array.from(new Set(productTypes.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  };
}

function buildProductsSeoPath({
  page,
  search,
  status,
  vendor,
  productType,
  sortBy,
  sortOrder,
}: {
  page: number;
  search: string;
  status: ProductStatusFilter;
  vendor: string;
  productType: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));
  params.set("sortBy", sortBy);
  params.set("sortOrder", sortOrder);

  if (search.trim()) params.set("search", search.trim());
  if (status !== "ALL") params.set("status", status);
  if (vendor !== "ALL") params.set("vendor", vendor);
  if (productType !== "ALL") params.set("productType", productType);

  return `/api/proxy/admin/seo/products?${params.toString()}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not updated";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSortByLabel(sortBy: SortBy) {
  switch (sortBy) {
    case "title":
      return "Product title";
    case "productType":
      return "Product type";
    case "createdAt":
      return "Created";
    case "updatedAt":
      return "Last updated";
    case "inventory":
      return "Inventory";
    case "vendor":
      return "Vendor";
    default:
      return "Last updated";
  }
}

function getSortOrderLabel(sortOrder: SortOrder) {
  return sortOrder === "asc" ? "Oldest first" : "Newest first";
}

function getScoreTone(score: number) {
  if (score < 50) return "red";
  if (score <= 80) return "amber";
  return "green";
}

export default function ProductSeoListPage() {
  const [products, setProducts] = useState<ProductSeoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<ProductStatusFilter>("ALL");
  const [vendor, setVendor] = useState("ALL");
  const [productType, setProductType] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([]);

  const [openMenu, setOpenMenu] = useState<"status" | "vendor" | "productType" | "sort" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: Array<{ value: ProductStatusFilter; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "DRAFT", label: "Draft" },
    { value: "ARCHIVED", label: "Archived" },
    { value: "UNLISTED", label: "Unlisted" },
  ];

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: "title", label: "Product title" },
    { value: "productType", label: "Product type" },
    { value: "createdAt", label: "Created" },
    { value: "updatedAt", label: "Last updated" },
    { value: "inventory", label: "Inventory" },
    { value: "vendor", label: "Vendor" },
  ];

  const hasActiveFilters = Boolean(
    searchQuery || status !== "ALL" || vendor !== "ALL" || productType !== "ALL",
  );

  const sortSummary = useMemo(
    () => `${getSortByLabel(sortBy)} · ${getSortOrderLabel(sortOrder)}`,
    [sortBy, sortOrder],
  );

  const scoreOverview = useMemo(() => {
    const scored = products.filter((product) => product.seoScore > 0);
    const average = products.length
      ? Math.round(products.reduce((sum, product) => sum + product.seoScore, 0) / products.length)
      : 0;

    return {
      average,
      scoredCount: scored.length,
      weakCount: products.filter((product) => product.seoScore < 50).length,
    };
  }, [products]);

  async function getToken() {
    const token = getAdminToken();
    if (!token) throw new Error("Admin token missing hai. Please login again.");
    return token;
  }

  async function loadFilters() {
    try {
      const token = await getToken();
      const response = await fetch("/api/proxy/admin/seo/products/filters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const text = await response.text();
      const json = text ? (JSON.parse(text) as FilterMetadataResponse) : {};

      if (!response.ok) return;

      const payload = extractFiltersPayload(json);
      setVendorOptions(payload.vendors);
      setProductTypeOptions(payload.productTypes);
    } catch {
      setVendorOptions([]);
      setProductTypeOptions([]);
    }
  }

  async function loadProducts(options?: { refresh?: boolean }) {
    try {
      if (options?.refresh) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);

      const token = await getToken();
      const response = await fetch(
        buildProductsSeoPath({
          page: currentPage,
          search: searchQuery,
          status,
          vendor,
          productType,
          sortBy,
          sortOrder,
        }),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const text = await response.text();
      let json: ProductSeoListResponse;

      try {
        json = JSON.parse(text) as ProductSeoListResponse;
      } catch {
        throw new Error(`Product SEO list API JSON nahi de rahi. Body: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          json.message ||
            `Product SEO list API failed: ${response.status} ${response.statusText}`,
        );
      }

      const payload = extractListPayload(json);
      setProducts(payload.products);
      setTotal(payload.total);
      setTotalPages(payload.totalPages);
    } catch (err) {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
      setError(
        err instanceof Error
          ? err.message
          : "Product SEO products load nahi ho paaye.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function clearAllFilters() {
    setSearchInput("");
    setSearchQuery("");
    setStatus("ALL");
    setVendor("ALL");
    setProductType("ALL");
    setCurrentPage(1);
    setOpenMenu(null);
  }

  useEffect(() => {
    loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, status, vendor, productType, sortBy, sortOrder]);

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-[#f6f2ea] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-neutral-900 bg-neutral-950 px-8 py-9 text-white shadow-[0_24px_80px_rgba(20,20,20,0.18)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-72 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                Admin / SEO / Products
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
                Product SEO
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
                Search, filter, sort, and manage on-page SEO for catalog products.
              </p>
            </div>

            
          </div>
        </section>

        <Card className="overflow-visible rounded-[2rem] border-neutral-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(29,24,19,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search in all"
                  className="h-12 rounded-2xl border-neutral-200 bg-[#fbfaf6] pl-11 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl bg-white px-5"
                disabled={isLoading || isRefreshing}
                onClick={() => loadProducts({ refresh: true })}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh products"}
              </Button>
            </div>

            <div className="relative z-30 flex flex-wrap items-center gap-2">
              

              <DropdownButton
                activeLabel={status === "ALL" ? "Status" : statusOptions.find((item) => item.value === status)?.label || "Status"}
                isOpen={openMenu === "status"}
                onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
              />
              <DropdownButton
                activeLabel={vendor === "ALL" ? "Product vendor" : vendor}
                isOpen={openMenu === "vendor"}
                onClick={() => setOpenMenu(openMenu === "vendor" ? null : "vendor")}
              />
              <DropdownButton
                activeLabel={productType === "ALL" ? "Product type" : productType}
                isOpen={openMenu === "productType"}
                onClick={() => setOpenMenu(openMenu === "productType" ? null : "productType")}
              />
              <DropdownButton
                activeLabel={sortSummary}
                isOpen={openMenu === "sort"}
                onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
              />

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              ) : null}

              {openMenu === "status" ? (
                <RadioDropdown
                  className="left-20 top-11 w-56"
                  options={statusOptions}
                  value={status}
                  onChange={(value) => {
                    setStatus(value as ProductStatusFilter);
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                  onClear={() => {
                    setStatus("ALL");
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                />
              ) : null}

              {openMenu === "vendor" ? (
                <RadioDropdown
                  className="left-44 top-11 w-72"
                  options={[{ value: "ALL", label: "All" }, ...vendorOptions.map((item) => ({ value: item, label: item }))]}
                  value={vendor}
                  maxHeightClass="max-h-96"
                  onChange={(value) => {
                    setVendor(value);
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                  onClear={() => {
                    setVendor("ALL");
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                />
              ) : null}

              {openMenu === "productType" ? (
                <RadioDropdown
                  className="left-[330px] top-11 w-80"
                  options={[{ value: "ALL", label: "All" }, ...productTypeOptions.map((item) => ({ value: item, label: item }))]}
                  value={productType}
                  maxHeightClass="max-h-96"
                  onChange={(value) => {
                    setProductType(value);
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                  onClear={() => {
                    setProductType("ALL");
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                />
              ) : null}

              {openMenu === "sort" ? (
                <SortDropdown
                  sortOptions={sortOptions}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}
                  onSortOrderChange={(value) => {
                    setSortOrder(value);
                    setCurrentPage(1);
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-[#fbfaf6] px-4 py-3 text-sm text-neutral-500">
            <p>
              Showing <span className="font-semibold text-neutral-950">{products.length}</span> products on this page from <span className="font-semibold text-neutral-950">{total}</span> total.
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Product SEO API error</p>
              <p className="mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <ProductsTable products={products} isLoading={isLoading} />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-4 md:flex-row md:items-center">
            <p className="text-sm text-neutral-500">
              Showing {startItem}-{endItem} of {total} products
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-white"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={isLoading || currentPage <= 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="rounded-xl border border-neutral-200 bg-[#fbfaf6] px-4 py-2 text-sm font-semibold text-neutral-950">
                {currentPage}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-white"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={isLoading || currentPage >= totalPages}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DropdownButton({
  activeLabel,
  isOpen,
  onClick,
}: {
  activeLabel: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 max-w-[250px] items-center gap-2 rounded-full border px-3 text-sm font-medium shadow-sm transition ${
        isOpen
          ? "border-neutral-300 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <span className="truncate">{activeLabel}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );
}

function RadioDropdown({
  options,
  value,
  onChange,
  onClear,
  className = "",
  maxHeightClass = "max-h-72",
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  maxHeightClass?: string;
}) {
  return (
    <Card className={`absolute z-50 overflow-hidden rounded-2xl border-neutral-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,15,15,0.18)] ${className}`}>
      <div className={`${maxHeightClass} overflow-y-auto pr-1`}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => onChange(option.value)}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-neutral-950" : "border-neutral-300"
                }`}
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-neutral-950" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-1 w-full rounded-xl px-2.5 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-50 hover:text-neutral-600"
        onClick={onClear}
      >
        Clear
      </button>
    </Card>
  );
}

function SortDropdown({
  sortOptions,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: {
  sortOptions: Array<{ value: SortBy; label: string }>;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (value: SortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
}) {
  return (
    <Card className="absolute left-[530px] top-11 z-50 w-60 overflow-hidden rounded-2xl border-neutral-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,15,15,0.18)]">
      <p className="px-2.5 pb-1 pt-1 text-sm font-semibold text-neutral-700">Sort by</p>
      <div>
        {sortOptions.map((option) => {
          const selected = option.value === sortBy;

          return (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => onSortByChange(option.value)}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-neutral-950" : "border-neutral-300"
                }`}
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-neutral-950" /> : null}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 border-t border-neutral-100 pt-2">
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-neutral-50 ${
            sortOrder === "asc" ? "bg-neutral-100 font-semibold text-neutral-950" : "text-neutral-700"
          }`}
          onClick={() => onSortOrderChange("asc")}
        >
          <ArrowUp className="h-4 w-4" />
          Oldest first
        </button>
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-neutral-50 ${
            sortOrder === "desc" ? "bg-neutral-100 font-semibold text-neutral-950" : "text-neutral-700"
          }`}
          onClick={() => onSortOrderChange("desc")}
        >
          <ArrowDown className="h-4 w-4" />
          Newest first
        </button>
      </div>
    </Card>
  );
}

function ProductsTable({
  products,
  isLoading,
}: {
  products: ProductSeoListItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-[1.5rem] border border-neutral-200 bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-4 rounded-2xl bg-[#fbfaf6] p-4">
            <div className="h-20 w-16 rounded-2xl bg-neutral-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/5 rounded-full bg-neutral-200" />
              <div className="h-3 w-1/3 rounded-full bg-neutral-200" />
            </div>
            <div className="h-8 w-24 rounded-full bg-neutral-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">No products found</h3>
        <p className="mt-2 text-sm text-neutral-500">Filters/search ke hisaab se products nahi mile.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
      <table className="w-full text-left">
        <thead className="bg-[#f4f0e8]">
          <tr>
            <th className="w-[42%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Product</th>
            <th className="w-[25%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Slug</th>
            <th className="w-[16%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">SEO score</th>
            <th className="w-[12%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Last updated</th>
            <th className="w-[5%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-100">
          {products.map((product) => (
            <tr key={product.productId} className="group transition hover:bg-[#fbfaf6]">
              <td className="px-5 py-5 align-top">
                <div className="flex min-w-0 items-start gap-4">
                  {product.image ? (
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                      <ImageOff className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pt-1">
                    <Link
                      href={`/admin/seo/products/${product.productId}`}
                      className="whitespace-normal break-words text-[16px] font-semibold leading-7 text-neutral-950 transition hover:text-neutral-700 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </div>
                </div>
              </td>

              <td className="px-5 py-5 align-top">
                <p className="rounded-2xl bg-neutral-50 px-3 py-2 font-mono text-[13px] leading-6 text-neutral-700 break-all">
                  {product.slug ? `/${product.slug}` : "No slug"}
                </p>
              </td>

              <td className="px-5 py-5 align-top">
                <ScoreBadge score={product.seoScore} />
              </td>

              <td className="px-5 py-5 align-top">
                <p className="max-w-36 text-sm leading-6 text-neutral-700">{formatDate(product.updatedAt)}</p>
              </td>

              <td className="px-5 py-5 text-right align-top">
                <Button asChild size="sm" className="rounded-full bg-neutral-950 px-4 shadow-sm transition group-hover:scale-[1.02]">
                  <Link href={`/admin/seo/products/${product.productId}`}>
                    Edit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = getScoreTone(score);

  const styles = {
    red: {
      pill: "border-red-100 bg-red-50 text-red-700",
      bar: "bg-red-500",
      track: "bg-red-100",
      label: "Needs work",
    },
    amber: {
      pill: "border-amber-100 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      track: "bg-amber-100",
      label: "Improving",
    },
    green: {
      pill: "border-emerald-100 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      track: "bg-emerald-100",
      label: "Healthy",
    },
  }[tone];

  return (
    <div className="min-w-[150px]">
      <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${styles.pill}`}>
        {score}/100
      </div>
      <div className={`mt-2 h-2 overflow-hidden rounded-full ${styles.track}`}>
        <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-1 text-xs font-medium text-neutral-400">{styles.label}</p>
    </div>
  );
}

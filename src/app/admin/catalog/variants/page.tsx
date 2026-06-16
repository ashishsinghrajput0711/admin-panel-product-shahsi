"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VariantTable } from "@/components/admin/catalog/variants/variant-table";
import type { Variant } from "@/components/admin/catalog/variants/variant-types";

const PAGE_LIMIT = 20;

type PaginationShape = {
  total?: number;
  count?: number;
  totalItems?: number;
  totalCount?: number;

  page?: number;
  currentPage?: number;

  limit?: number;
  pageSize?: number;
  perPage?: number;

  totalPages?: number;
  pages?: number;
};

type GlobalVariantsResponse = {
  success?: boolean;
  data?:
    | Variant[]
    | {
        data?: Variant[];
        variants?: Variant[];
        items?: Variant[];

        total?: number;
        count?: number;
        totalItems?: number;
        totalCount?: number;

        page?: number;
        currentPage?: number;

        limit?: number;
        pageSize?: number;
        perPage?: number;

        totalPages?: number;
        pages?: number;

        meta?: PaginationShape;
        pagination?: PaginationShape;
      };

  variants?: Variant[];
  items?: Variant[];

  total?: number;
  count?: number;
  totalItems?: number;
  totalCount?: number;

  page?: number;
  currentPage?: number;

  limit?: number;
  pageSize?: number;
  perPage?: number;

  totalPages?: number;
  pages?: number;

  meta?: PaginationShape;
  pagination?: PaginationShape;

  message?: string | string[];
  error?: unknown;
};

type VariantStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED";

type VariantTypeFilter =
  | "ALL"
  | "SIZE"
  | "COLOR"
  | "LENGTH"
  | "FABRIC"
  | "RENTAL_PACKAGE"
  | "SUBSCRIPTION_PACKAGE";

function getApiRootUrl() {
  return "/api/proxy";
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const shortText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    throw new Error(
      `${fallbackMessage}. Server ne JSON ke jagah HTML/text return kiya. Status: ${response.status}. Response: ${shortText}`
    );
  }
}

function getApiErrorMessage(data: GlobalVariantsResponse, fallback: string) {
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (Array.isArray(record.message)) {
      return record.message.join(", ");
    }
  }

  return fallback;
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getPaginationFromSource(
  response: GlobalVariantsResponse,
  nested?: GlobalVariantsResponse["data"]
) {
  const nestedObject =
    nested && !Array.isArray(nested) && typeof nested === "object"
      ? nested
      : undefined;

  const totalValue =
    nestedObject?.total ??
    nestedObject?.count ??
    nestedObject?.totalItems ??
    nestedObject?.totalCount ??
    nestedObject?.meta?.total ??
    nestedObject?.meta?.count ??
    nestedObject?.meta?.totalItems ??
    nestedObject?.meta?.totalCount ??
    nestedObject?.pagination?.total ??
    nestedObject?.pagination?.count ??
    nestedObject?.pagination?.totalItems ??
    nestedObject?.pagination?.totalCount ??
    response.total ??
    response.count ??
    response.totalItems ??
    response.totalCount ??
    response.meta?.total ??
    response.meta?.count ??
    response.meta?.totalItems ??
    response.meta?.totalCount ??
    response.pagination?.total ??
    response.pagination?.count ??
    response.pagination?.totalItems ??
    response.pagination?.totalCount ??
    0;

  const pageValue =
    nestedObject?.page ??
    nestedObject?.currentPage ??
    nestedObject?.meta?.page ??
    nestedObject?.meta?.currentPage ??
    nestedObject?.pagination?.page ??
    nestedObject?.pagination?.currentPage ??
    response.page ??
    response.currentPage ??
    response.meta?.page ??
    response.meta?.currentPage ??
    response.pagination?.page ??
    response.pagination?.currentPage ??
    1;

  const limitValue =
    nestedObject?.limit ??
    nestedObject?.pageSize ??
    nestedObject?.perPage ??
    nestedObject?.meta?.limit ??
    nestedObject?.meta?.pageSize ??
    nestedObject?.meta?.perPage ??
    nestedObject?.pagination?.limit ??
    nestedObject?.pagination?.pageSize ??
    nestedObject?.pagination?.perPage ??
    response.limit ??
    response.pageSize ??
    response.perPage ??
    response.meta?.limit ??
    response.meta?.pageSize ??
    response.meta?.perPage ??
    response.pagination?.limit ??
    response.pagination?.pageSize ??
    response.pagination?.perPage ??
    null;

  const safeTotal = toNumberOrNull(totalValue) ?? 0;
  const safePage = toNumberOrNull(pageValue) ?? 1;
  const safeLimit = toNumberOrNull(limitValue);

  const totalPagesValue =
    nestedObject?.totalPages ??
    nestedObject?.pages ??
    nestedObject?.meta?.totalPages ??
    nestedObject?.meta?.pages ??
    nestedObject?.pagination?.totalPages ??
    nestedObject?.pagination?.pages ??
    response.totalPages ??
    response.pages ??
    response.meta?.totalPages ??
    response.meta?.pages ??
    response.pagination?.totalPages ??
    response.pagination?.pages ??
    null;

  const safeTotalPages =
    toNumberOrNull(totalPagesValue) ??
    (safeLimit ? Math.max(1, Math.ceil(safeTotal / safeLimit)) : 1);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages: safeTotalPages,
  };
}

function extractVariants(response: GlobalVariantsResponse) {
  if (Array.isArray(response.data)) {
    return {
      variants: response.data,
      pagination: getPaginationFromSource(response),
    };
  }

  if (response.data && !Array.isArray(response.data)) {
    if (Array.isArray(response.data.data)) {
      return {
        variants: response.data.data,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.variants)) {
      return {
        variants: response.data.variants,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.items)) {
      return {
        variants: response.data.items,
        pagination: getPaginationFromSource(response, response.data),
      };
    }
  }

  if (Array.isArray(response.variants)) {
    return {
      variants: response.variants,
      pagination: getPaginationFromSource(response),
    };
  }

  if (Array.isArray(response.items)) {
    return {
      variants: response.items,
      pagination: getPaginationFromSource(response),
    };
  }

  return {
    variants: [],
    pagination: getPaginationFromSource(response),
  };
}

function getVariantStatus(variant: Variant) {
  const status = String(variant.status ?? "").toUpperCase();

  if (status) return status;

  if (variant.isActive === false) return "INACTIVE";
  if (variant.isActive === true) return "ACTIVE";

  return "";
}

function countByStatus(variants: Variant[], status: string) {
  return variants.filter((variant) => getVariantStatus(variant) === status)
    .length;
}

function buildVariantsUrl({
  page,
  searchTerm,
  statusFilter,
  variantTypeFilter,
}: {
  page: number;
  searchTerm: string;
  statusFilter: VariantStatusFilter;
  variantTypeFilter: VariantTypeFilter;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(PAGE_LIMIT));
  params.set("sortBy", "updatedAt");
  params.set("sortOrder", "desc");

  const cleanedSearch = searchTerm.trim();

  if (cleanedSearch) {
    params.set("search", cleanedSearch);
  }

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }

  if (variantTypeFilter !== "ALL") {
    params.set("variantType", variantTypeFilter);
  }

  return `${getApiRootUrl()}/admin/catalog/variants?${params.toString()}`;
}

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [totalVariants, setTotalVariants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VariantStatusFilter>("ALL");
  const [variantTypeFilter, setVariantTypeFilter] =
    useState<VariantTypeFilter>("ALL");

  async function loadGlobalVariants(
    page = currentPage,
    options?: {
      searchTerm?: string;
      statusFilter?: VariantStatusFilter;
      variantTypeFilter?: VariantTypeFilter;
    }
  ) {
    const nextSearchTerm = options?.searchTerm ?? searchTerm;
    const nextStatusFilter = options?.statusFilter ?? statusFilter;
    const nextVariantTypeFilter = options?.variantTypeFilter ?? variantTypeFilter;

    try {
      setIsLoading(true);
      setApiError(null);

      const url = buildVariantsUrl({
        page,
        searchTerm: nextSearchTerm,
        statusFilter: nextStatusFilter,
        variantTypeFilter: nextVariantTypeFilter,
      });

      console.log("GLOBAL_VARIANTS_REQUEST:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      const json = await parseApiResponse<GlobalVariantsResponse>(
        response,
        "Global variants API JSON response nahi de rahi"
      );

      console.log("GLOBAL_VARIANTS_RESPONSE:", json);

      if (!response.ok) {
        setVariants([]);
        setTotalVariants(0);
        setCurrentPage(1);
        setPageSize(null);
        setTotalPages(1);

        throw new Error(
          getApiErrorMessage(
            json,
            `Variants load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      const extracted = extractVariants(json);
      const backendTotal =
        extracted.pagination.total || extracted.variants.length;
      const backendLimit = extracted.pagination.limit ?? PAGE_LIMIT;

      const backendTotalPages =
        extracted.pagination.totalPages ||
        (backendLimit
          ? Math.max(1, Math.ceil(backendTotal / backendLimit))
          : 1);

      setVariants(extracted.variants);
      setTotalVariants(backendTotal);
      setCurrentPage(extracted.pagination.page || page);
      setPageSize(backendLimit);
      setTotalPages(backendTotalPages);
    } catch (error) {
      setVariants([]);
      setTotalVariants(0);
      setCurrentPage(1);
      setPageSize(null);
      setTotalPages(1);
      setApiError(
        error instanceof Error
          ? error.message
          : "Backend se variants load nahi ho paaye."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadGlobalVariants(1, {
        searchTerm,
        statusFilter,
        variantTypeFilter,
      });
    }, 400);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, variantTypeFilter]);

  const activeOnPage = useMemo(
    () => countByStatus(variants, "ACTIVE"),
    [variants]
  );

  const draftOnPage = useMemo(
    () => countByStatus(variants, "DRAFT"),
    [variants]
  );

  const inactiveOnPage = useMemo(
    () => countByStatus(variants, "INACTIVE"),
    [variants]
  );

  const archivedOnPage = useMemo(
    () => countByStatus(variants, "ARCHIVED"),
    [variants]
  );

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Global Variants
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Global Variant Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage catalog/product variants using backend-driven global
              variant APIs. Search, status, type and pagination are controlled
              by backend query params.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() =>
                loadGlobalVariants(currentPage, {
                  searchTerm,
                  statusFilter,
                  variantTypeFilter,
                })
              }
              disabled={isLoading}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/variants/new">
                <Plus className="mr-2 h-4 w-4" />
                New Variant
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {apiError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Variants API error</p>
              <p className="mt-1">
                Real backend operation fail hui. Fallback/mock data use nahi
                kiya gaya.
              </p>
              <p className="mt-2 rounded-xl bg-white/70 p-3 text-xs">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total matching variants" value={totalVariants} />
        <StatCard label="Loaded on page" value={variants.length} />
        <StatCard label="Active on page" value={activeOnPage} />
        <StatCard label="Draft on page" value={draftOnPage} />
        <StatCard
          label="Inactive / Archived on page"
          value={inactiveOnPage + archivedOnPage}
        />
      </section>

      <Card className="mb-6 rounded-[1.5rem] border-neutral-200 bg-white p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_180px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search all backend variants by SKU, product, color, size..."
              className="pl-9"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as VariantStatusFilter);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
          >
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={variantTypeFilter}
            onChange={(event) => {
              setVariantTypeFilter(event.target.value as VariantTypeFilter);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
          >
            <option value="ALL">All variant types</option>
            <option value="SIZE">Size</option>
            <option value="COLOR">Color</option>
            <option value="LENGTH">Length</option>
            <option value="FABRIC">Fabric</option>
            <option value="RENTAL_PACKAGE">Rental Package</option>
            <option value="SUBSCRIPTION_PACKAGE">
              Subscription Package
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <span className="text-sm text-neutral-600">
            Showing{" "}
            <span className="font-semibold text-neutral-950">
              {variants.length}
            </span>{" "}
            of {totalVariants} matching backend variants
            <span className="ml-2 text-neutral-500">
              Page {currentPage} of {totalPages}
              {pageSize ? ` · ${pageSize} per page` : ""}
            </span>
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!canGoPrevious || isLoading}
              onClick={() =>
                loadGlobalVariants(currentPage - 1, {
                  searchTerm,
                  statusFilter,
                  variantTypeFilter,
                })
              }
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Badge variant="outline" className="rounded-full px-4 py-2">
              Page {currentPage} / {totalPages}
            </Badge>

            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!canGoNext || isLoading}
              onClick={() =>
                loadGlobalVariants(currentPage + 1, {
                  searchTerm,
                  statusFilter,
                  variantTypeFilter,
                })
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Search/status/type filters backend se all matching variants par apply
          hote hain. Current page me sirf backend-returned paginated records
          dikh rahe hain.
        </p>
      </Card>

      <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-neutral-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading variants from backend...
          </div>
        ) : (
          <VariantTable
            variants={variants}
            isLoading={false}
            onActionComplete={() =>
              loadGlobalVariants(currentPage, {
                searchTerm,
                statusFilter,
                variantTypeFilter,
              })
            }
          />
        )}
      </Card>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}
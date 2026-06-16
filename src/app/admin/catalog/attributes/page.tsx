"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Copy,
  Library,
  Plus,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AttributeFilters } from "@/components/admin/catalog/attributes/attribute-filters";
import { AttributeTable } from "@/components/admin/catalog/attributes/attribute-table";
import type {
  Attribute,
  AttributeFiltersState,
} from "@/components/admin/catalog/attributes/attribute-types";

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

type AttributesResponse = {
  success?: boolean;
  data?:
    | Attribute[]
    | {
        data?: Attribute[];
        attributes?: Attribute[];
        items?: Attribute[];
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
  attributes?: Attribute[];
  items?: Attribute[];
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

const initialFilters: AttributeFiltersState = {
  search: "",
  status: "ALL",
  type: "ALL",
  flag: "ALL",
};

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

function getApiErrorMessage(data: AttributesResponse, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (Array.isArray(record.message)) {
      return record.message.join(", ");
    }

    if (typeof record.message === "string") {
      return record.message;
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
  response: AttributesResponse,
  nested?: AttributesResponse["data"]
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

function extractAttributes(response: AttributesResponse) {
  if (Array.isArray(response.data)) {
    return {
      attributes: response.data,
      pagination: getPaginationFromSource(response),
    };
  }

  if (response.data && !Array.isArray(response.data)) {
    if (Array.isArray(response.data.data)) {
      return {
        attributes: response.data.data,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.attributes)) {
      return {
        attributes: response.data.attributes,
        pagination: getPaginationFromSource(response, response.data),
      };
    }

    if (Array.isArray(response.data.items)) {
      return {
        attributes: response.data.items,
        pagination: getPaginationFromSource(response, response.data),
      };
    }
  }

  if (Array.isArray(response.attributes)) {
    return {
      attributes: response.attributes,
      pagination: getPaginationFromSource(response),
    };
  }

  if (Array.isArray(response.items)) {
    return {
      attributes: response.items,
      pagination: getPaginationFromSource(response),
    };
  }

  return {
    attributes: [],
    pagination: getPaginationFromSource(response),
  };
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getAttributeStatus(attribute: Attribute) {
  if (attribute.status) return String(attribute.status).toUpperCase();
  if (attribute.isActive === false) return "INACTIVE";
  if (attribute.isActive === true) return "ACTIVE";
  return "ACTIVE";
}

function getAttributeType(attribute: Attribute) {
  const raw = String(attribute.type || attribute.fieldType || "").toLowerCase();

  if (raw === "text") return "TEXT";
  if (raw === "number") return "NUMBER";
  if (raw === "boolean") return "BOOLEAN";
  if (raw === "dropdown") return "SELECT";
  if (raw === "multi_select") return "MULTI_SELECT";
  if (raw === "swatch") return "COLOR";

  return String(attribute.type || attribute.fieldType || "").toUpperCase();
}

function getAttributeSearchText(attribute: Attribute) {
  return [
    attribute.id,
    attribute.name,
    attribute.label,
    attribute.code,
    attribute.slug,
    attribute.key,
    attribute.description,
    attribute.type,
    attribute.fieldType,
    attribute.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesFlag(attribute: Attribute, flag: AttributeFiltersState["flag"]) {
  if (flag === "ALL") return true;
  if (flag === "REQUIRED") return Boolean(attribute.isRequired);
  if (flag === "FILTERABLE") return Boolean(attribute.isFilterable);
  if (flag === "SEARCHABLE") return Boolean(attribute.isSearchable);

  if (flag === "VARIANT") {
    return Boolean(
      attribute.isVariantLevel ||
        attribute.isVariantOption ||
        attribute.isVariantDefining
    );
  }

  if (flag === "SEO") return Boolean(attribute.isSeoField);
  if (flag === "FIT") return Boolean(attribute.isFitEngineField);
  if (flag === "STYLE") return Boolean(attribute.isStyleEngineField);
  if (flag === "BULK_UPLOAD") return Boolean(attribute.isBulkUploadField);

  return true;
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [totalAttributes, setTotalAttributes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [filters, setFilters] =
    useState<AttributeFiltersState>(initialFilters);

  async function loadAttributes(page = currentPage) {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/attributes?page=${page}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      const json = await parseApiResponse<AttributesResponse>(
        response,
        "Attributes API JSON response nahi de rahi"
      );

      if (!response.ok) {
        setAttributes([]);
        setTotalAttributes(0);
        setCurrentPage(1);
        setPageSize(null);
        setTotalPages(1);

        throw new Error(
          getApiErrorMessage(
            json,
            `Attributes load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      const extracted = extractAttributes(json);
      const backendTotal =
        extracted.pagination.total || extracted.attributes.length;
      const backendLimit = extracted.pagination.limit;
      const backendTotalPages =
        extracted.pagination.totalPages ||
        (backendLimit
          ? Math.max(1, Math.ceil(backendTotal / backendLimit))
          : 1);

      setAttributes(extracted.attributes);
      setTotalAttributes(backendTotal);
      setCurrentPage(extracted.pagination.page || page);
      setPageSize(backendLimit);
      setTotalPages(backendTotalPages);
    } catch (error) {
      setAttributes([]);
      setTotalAttributes(0);
      setCurrentPage(1);
      setPageSize(null);
      setTotalPages(1);
      setApiError(
        error instanceof Error
          ? error.message
          : "Backend se attributes load nahi ho paaye."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleArchive(attribute: Attribute) {
    const confirmed = window.confirm(
      `Archive attribute "${attribute.name || attribute.label || attribute.code}"?`
    );

    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      setApiError(null);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/attributes/${attribute.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const json = await parseApiResponse<AttributesResponse>(
        response,
        "Attribute archive API JSON response nahi de rahi"
      );

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Attribute archive failed: ${response.status} ${response.statusText}`
          )
        );
      }

      await loadAttributes(currentPage);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Attribute archive failed."
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  useEffect(() => {
    loadAttributes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAttributes = useMemo(() => {
    const query = normalizeText(filters.search);

    return attributes.filter((attribute) => {
      const matchesSearch = query
        ? getAttributeSearchText(attribute).includes(query)
        : true;

      const matchesStatus =
        filters.status === "ALL"
          ? true
          : getAttributeStatus(attribute) === filters.status;

      const matchesType =
        filters.type === "ALL"
          ? true
          : getAttributeType(attribute) === filters.type;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesFlag(attribute, filters.flag)
      );
    });
  }, [attributes, filters]);

  const activeOnPage = useMemo(
    () =>
      attributes.filter((attribute) => getAttributeStatus(attribute) === "ACTIVE")
        .length,
    [attributes]
  );

  const variantOnPage = useMemo(
    () =>
      attributes.filter((attribute) => matchesFlag(attribute, "VARIANT")).length,
    [attributes]
  );

  const filterableOnPage = useMemo(
    () =>
      attributes.filter((attribute) => Boolean(attribute.isFilterable)).length,
    [attributes]
  );

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Attributes
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Attribute Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage backend-driven catalog attributes for products and variants
              including color, size, fabric, style, occasion, fit and filters.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled
            >
              <Archive className="mr-2 h-4 w-4" />
              Bulk Archive
            </Button>

            <Button
              asChild
              type="button"
              variant="secondary"
              className="rounded-full"
            >
              <Link href="/admin/catalog/attributes/library">
                <Library className="mr-2 h-4 w-4" />
                Global Library
              </Link>
            </Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/attributes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Attribute
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
              <p className="font-semibold">Attributes API error</p>
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

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total attributes" value={totalAttributes} />
        <StatCard label="Loaded on page" value={attributes.length} />
        <StatCard label="Active on page" value={activeOnPage} />
        <StatCard
          label="Variant / Filterable"
          value={variantOnPage + filterableOnPage}
        />
      </section>

      <section className="space-y-6">
        <AttributeFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
        />

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm text-neutral-600">
              Showing{" "}
              <span className="font-semibold text-neutral-950">
                {filteredAttributes.length}
              </span>{" "}
              of {totalAttributes} backend attributes
              <span className="ml-2 text-neutral-500">
                Page {currentPage} of {totalPages}
                {pageSize ? ` · ${pageSize} per page` : ""}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={isLoading}
                onClick={() => loadAttributes(currentPage)}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={!canGoPrevious || isLoading}
                onClick={() => loadAttributes(currentPage - 1)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={!canGoNext || isLoading}
                onClick={() => loadAttributes(currentPage + 1)}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <AttributeTable
            attributes={filteredAttributes}
            isLoading={isLoading}
            isActionLoading={isActionLoading}
            onArchive={handleArchive}
          />
        </Card>
      </section>
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
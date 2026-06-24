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

import {
  archiveCatalogAttribute,
  fetchCatalogAttributes,
} from "@/lib/admin/catalog-attributes-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AttributeFilters } from "@/components/admin/catalog/attributes/attribute-filters";
import { AttributeTable } from "@/components/admin/catalog/attributes/attribute-table";
import type {
  Attribute,
  AttributeFiltersState,
} from "@/components/admin/catalog/attributes/attribute-types";

const initialFilters: AttributeFiltersState = {
  search: "",
  status: "ALL",
  type: "ALL",
  flag: "ALL",
};

function getAttributeStatus(attribute: Attribute) {
  if (attribute.status) return String(attribute.status).toUpperCase();
  if (attribute.isActive === false) return "INACTIVE";
  if (attribute.isActive === true) return "ACTIVE";
  return "ACTIVE";
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
        attribute.isVariantDefining,
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

  async function loadAttributes(page = currentPage, nextFilters = filters) {
    try {
      setIsLoading(true);
      setApiError(null);

      const result = await fetchCatalogAttributes({
        page,
        filters: nextFilters,
      });

      const backendTotal = result.pagination.total || result.attributes.length;
      const backendLimit = result.pagination.limit;
      const backendTotalPages =
        result.pagination.totalPages ||
        (backendLimit
          ? Math.max(1, Math.ceil(backendTotal / backendLimit))
          : 1);

      setAttributes(result.attributes);
      setTotalAttributes(backendTotal);
      setCurrentPage(result.pagination.page || page);
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
          : "Backend se attributes load nahi ho paaye.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleArchive(attribute: Attribute) {
    const confirmed = window.confirm(
      `Archive attribute "${
        attribute.name || attribute.label || attribute.code
      }"?`,
    );

    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      setApiError(null);

      await archiveCatalogAttribute(attribute.id);
      await loadAttributes(currentPage);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Attribute archive failed.",
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  useEffect(() => {
    loadAttributes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOnPage = useMemo(
    () =>
      attributes.filter((attribute) => getAttributeStatus(attribute) === "ACTIVE")
        .length,
    [attributes],
  );

  const variantOnPage = useMemo(
    () =>
      attributes.filter((attribute) => matchesFlag(attribute, "VARIANT")).length,
    [attributes],
  );

  const filterableOnPage = useMemo(
    () =>
      attributes.filter((attribute) => Boolean(attribute.isFilterable)).length,
    [attributes],
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
          onChange={(nextFilters) => {
            setFilters(nextFilters);
            loadAttributes(1, nextFilters);
          }}
          onClear={() => {
            setFilters(initialFilters);
            loadAttributes(1, initialFilters);
          }}
        />

       <Card className="overflow-hidden rounded-[1.5rem] border-neutral-200 bg-white p-0">
  <div className="flex flex-col gap-4 border-b border-neutral-100 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
            <p className="text-sm text-neutral-600">
              Showing{" "}
              <span className="font-semibold text-neutral-950">
                {attributes.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-neutral-950">
                {totalAttributes}
              </span>{" "}
              backend attributes
              <span className="ml-2 text-neutral-500">
                Page {currentPage} of {totalPages}
                {pageSize ? ` · ${pageSize} per page` : ""}
              </span>
            </p>

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
            attributes={attributes}
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
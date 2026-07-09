"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, Download, Plus, RefreshCcw, Shirt, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StyleDataFilters } from "@/components/admin/catalog/style-data/style-data-filters";
import { StyleDataTable } from "@/components/admin/catalog/style-data/style-data-table";
import type {
  CatalogStyleDataOptions,
  StyleData,
  StyleDataSummary,
} from "@/components/admin/catalog/style-data/style-data-types";
import {
  downloadCatalogStyleDataTemplate,
  exportCatalogStyleData,
  getCatalogStyleData,
  getCatalogStyleDataOptions,
  type CatalogStyleDataListParams,
} from "@/lib/admin/catalog-style-data-api";

const emptyOptions: CatalogStyleDataOptions = {
  status: [],
  scope: [],
  businessType: [],
  occasion: [],
  colorFamily: [],
  fabricFeel: [],
  neckline: [],
  sleeveType: [],
  silhouette: [],
  modestyLevel: [],
  season: [],
};

const emptySummary: StyleDataSummary = {
  total: 0,
  active: 0,
  draft: 0,
  inactive: 0,
  archived: 0,
};

export default function StyleDataPage() {
  const [items, setItems] = useState<StyleData[]>([]);
  const [summary, setSummary] = useState<StyleDataSummary>(emptySummary);
  const [options, setOptions] = useState<CatalogStyleDataOptions>(emptyOptions);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<CatalogStyleDataListParams>({
    search: "",
    status: "",
    scope: "",
    businessType: "",
    occasion: "",
    modestyLevel: "",
    colorFamily: "",
    fabricFeel: "",
    neckline: "",
    sleeveType: "",
    silhouette: "",
    season: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [error, setError] = useState("");

  const queryParams = useMemo<CatalogStyleDataListParams>(
    () => ({
      page,
      limit,
      ...filters,
    }),
    [filters, limit, page],
  );

  async function loadOptions() {
    try {
      setOptionsLoading(true);
      const result = await getCatalogStyleDataOptions();
      setOptions(result);
    } catch {
      setOptions(emptyOptions);
    } finally {
      setOptionsLoading(false);
    }
  }

  async function loadStyleData() {
    try {
      setIsLoading(true);
      setError("");

      const result = await getCatalogStyleData(queryParams);

      setItems(result.items || []);
      setSummary(result.summary || emptySummary);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Style data load failed.",
      );
      setItems([]);
      setSummary(emptySummary);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadStyleData();
  }, [queryParams]);

  function updateFilter(key: keyof CatalogStyleDataListParams, value: string) {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({
      search: "",
      status: "",
      scope: "",
      businessType: "",
      occasion: "",
      modestyLevel: "",
      colorFamily: "",
      fabricFeel: "",
      neckline: "",
      sleeveType: "",
      silhouette: "",
      season: "",
    });
  }

  async function handleDownloadTemplate() {
    try {
      setIsDownloadingTemplate(true);
      setError("");
      await downloadCatalogStyleDataTemplate();
    } catch (templateError) {
      setError(
        templateError instanceof Error
          ? templateError.message
          : "Template download failed.",
      );
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      setError("");
      await exportCatalogStyleData(queryParams);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Style data export failed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Style Data
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Style Data Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage backend-driven fashion styling metadata including occasion,
              color family, fabric feel, neckline, sleeve type, silhouette,
              modesty level, season, tags, styling keywords and AI styling notes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloadingTemplate ? "Downloading..." : "Template"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <Shirt className="mr-2 h-4 w-4" />
              Style Rules
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={loadStyleData}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/style-data/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Style Data
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Active" value={summary.active} />
        <SummaryCard label="Draft" value={summary.draft} />
        <SummaryCard label="Inactive" value={summary.inactive} />
        <SummaryCard label="Archived" value={summary.archived} />
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <StyleDataFilters
          options={options}
          filters={filters}
          isLoading={optionsLoading}
          onChange={updateFilter}
          onClear={clearFilters}
        />

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
          <StyleDataTable styleDataItems={items} isLoading={isLoading} />

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4 text-sm">
            <p className="text-neutral-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={page >= totalPages || isLoading}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-[1.25rem] border-neutral-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-neutral-950">{value}</p>
    </Card>
  );
}
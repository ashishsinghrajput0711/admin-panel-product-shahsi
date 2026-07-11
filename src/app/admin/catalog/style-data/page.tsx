"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Download,
  Plus,
  RefreshCcw,
  Settings2,
  Shirt,
  Upload,
  X,
} from "lucide-react";

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
  archiveCatalogStyleData,
  bulkUploadCatalogStyleData,
  deleteCatalogStyleData,
  downloadCatalogStyleDataTemplate,
  exportCatalogStyleData,
  getCatalogStyleData,
  getCatalogStyleDataOptions,
  restoreCatalogStyleData,
  type CatalogStyleDataBulkUploadResult,
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

  const [actionId, setActionId] = useState("");
  const [summary, setSummary] = useState<StyleDataSummary>(emptySummary);
  const [options, setOptions] = useState<CatalogStyleDataOptions>(emptyOptions);

  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
const [bulkUploadResult, setBulkUploadResult] =
  useState<CatalogStyleDataBulkUploadResult | null>(null);
const [isBulkUploading, setIsBulkUploading] = useState(false);

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


  async function handleBulkUpload() {
  if (!bulkUploadFile) {
    setError("Bulk upload ke liye CSV/XLSX file select karo.");
    return;
  }

  try {
    setIsBulkUploading(true);
    setError("");
    setBulkUploadResult(null);

    const result = await bulkUploadCatalogStyleData(bulkUploadFile);

    setBulkUploadResult(result);
    setBulkUploadFile(null);

    await loadStyleData();
  } catch (uploadError) {
    setError(
      uploadError instanceof Error
        ? uploadError.message
        : "Style data bulk upload failed.",
    );
  } finally {
    setIsBulkUploading(false);
  }
}

function closeBulkUploadModal() {
  if (isBulkUploading) return;

  setBulkUploadOpen(false);
  setBulkUploadFile(null);
  setBulkUploadResult(null);
}
  async function handleArchive(item: StyleData) {
  const confirmed = window.confirm(
    `Archive style data for "${item.productName || item.productSku || item.id}"?`,
  );

  if (!confirmed) return;

  try {
    setActionId(item.id);
    setError("");

    await archiveCatalogStyleData(item.id);
    await loadStyleData();
  } catch (archiveError) {
    setError(
      archiveError instanceof Error
        ? archiveError.message
        : "Style data archive failed.",
    );
  } finally {
    setActionId("");
  }
}

async function handleRestore(item: StyleData) {
  try {
    setActionId(item.id);
    setError("");

    await restoreCatalogStyleData(item.id);
    await loadStyleData();
  } catch (restoreError) {
    setError(
      restoreError instanceof Error
        ? restoreError.message
        : "Style data restore failed.",
    );
  } finally {
    setActionId("");
  }
}

async function handleDelete(item: StyleData) {
  const confirmed = window.confirm(
    `Delete style data for "${item.productName || item.productSku || item.id}"? Ye action permanent ho sakta hai.`,
  );

  if (!confirmed) return;

  try {
    setActionId(item.id);
    setError("");

    await deleteCatalogStyleData(item.id);
    await loadStyleData();
  } catch (deleteError) {
    setError(
      deleteError instanceof Error
        ? deleteError.message
        : "Style data delete failed.",
    );
  } finally {
    setActionId("");
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
  onClick={() => {
    setBulkUploadOpen(true);
    setBulkUploadResult(null);
    setError("");
  }}
>
  <Upload className="mr-2 h-4 w-4" />
  Bulk Upload
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

           <Button asChild variant="secondary" className="rounded-full">
  <Link href="/admin/catalog/style-data/rules">
    <Shirt className="mr-2 h-4 w-4" />
    Style Rules
  </Link>
</Button>

<Button asChild variant="secondary" className="rounded-full">
  <Link href="/admin/catalog/style-data/options">
    <Settings2 className="mr-2 h-4 w-4" />
    Manage Options
  </Link>
</Button>

<Button type="button" variant="secondary" className="rounded-full">
  <Archive className="mr-2 h-4 w-4" />
  Archive
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

     <section className="space-y-6">
  <StyleDataFilters
    options={options}
    filters={filters}
    isLoading={optionsLoading}
    onChange={updateFilter}
    onClear={clearFilters}
  />

  <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
<StyleDataTable
  styleDataItems={items}
  isLoading={isLoading}
  actionId={actionId}
  onArchive={handleArchive}
  onRestore={handleRestore}
  onDelete={handleDelete}
/>

    <div className="mt-5 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4 text-sm">
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

{bulkUploadOpen ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Catalog / Style Data
          </p>

          <h2 className="mt-2 text-3xl font-medium text-neutral-950">
            Bulk Upload Style Data
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Template download karke same format me file upload karo.
          </p>
        </div>

        <button
          type="button"
          onClick={closeBulkUploadModal}
          disabled={isBulkUploading}
          className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-800">
            Upload File
          </span>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            disabled={isBulkUploading}
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setBulkUploadFile(file);
              setBulkUploadResult(null);
              setError("");
            }}
            className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:text-white disabled:opacity-50"
          />
        </label>

        {bulkUploadFile ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
            <p className="font-medium text-neutral-950">
              {bulkUploadFile.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {(bulkUploadFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : null}
      </div>

      {bulkUploadResult ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-medium text-emerald-800">Upload Result</h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <ResultBox
              label="Imported"
              value={bulkUploadResult.importedCount}
            />
            <ResultBox
              label="Created"
              value={bulkUploadResult.createdCount}
            />
            <ResultBox
              label="Updated"
              value={bulkUploadResult.updatedCount}
            />
            <ResultBox
              label="Failed"
              value={bulkUploadResult.failedCount}
            />
          </div>

          {bulkUploadResult.errors?.length ? (
            <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-red-200 bg-white p-3">
              <p className="mb-2 text-sm font-medium text-red-700">
                Failed Rows
              </p>

              <div className="space-y-2">
                {bulkUploadResult.errors.map((item, index) => (
                  <div
                    key={`${item.row || index}-${item.message || index}`}
                    className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                  >
                    <p>
                      <span className="font-medium">Row:</span>{" "}
                      {item.row || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Product:</span>{" "}
                      {item.productSku || item.productId || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Error:</span>{" "}
                      {item.message || "Unknown error"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate || isBulkUploading}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloadingTemplate ? "Downloading..." : "Download Template"}
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={closeBulkUploadModal}
            disabled={isBulkUploading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={handleBulkUpload}
            disabled={!bulkUploadFile || isBulkUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isBulkUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>
    </div>
  </div>
) : null}
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

function ResultBox({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-neutral-950">
        {value ?? 0}
      </p>
    </div>
  );
}
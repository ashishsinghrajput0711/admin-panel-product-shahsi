"use client";

import Image from "next/image";
import {
  activateCatalogFitRule,
  createCatalogFitRule,
  deactivateCatalogFitRule,
  deleteCatalogFitRule,
  getCatalogFitRules,
  updateCatalogFitRule,
  type CatalogFitRule,
  type CatalogFitRulePayload,
} from "@/lib/admin/catalog-fit-rules-api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RefreshCcw,
  Ruler,
  Search,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  archiveCatalogFitData,
  getCatalogFitData,
downloadCatalogFitDataTemplate,
  restoreCatalogFitData,
  bulkUploadCatalogFitData,
  exportCatalogFitDataRecords,
  type CatalogFitDataItem,
  type CatalogFitDataListParams,
  type CatalogFitDataSummary,
} from "@/lib/admin/catalog-fit-data-api";

const emptySummary: CatalogFitDataSummary = {
  totalRecords: 0,
  activeRecords: 0,
  draftRecords: 0,
  inactiveRecords: 0,
  archivedRecords: 0,
  missingFitDataProducts: 0,
  productsWithSizeChart: 0,
  productsWithoutSizeChart: 0,
};

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function statusClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (normalized === "ARCHIVED") {
    return "bg-neutral-100 text-neutral-600 ring-neutral-200";
  }

  if (normalized === "DRAFT") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
}

function booleanSelectValue(value: boolean | "") {
  if (value === "") return "";
  return value ? "true" : "false";
}

function parseBooleanSelect(value: string): boolean | "" {
  if (value === "true") return true;
  if (value === "false") return false;
  return "";
}

export default function FitDataPage() {
  const [items, setItems] = useState<CatalogFitDataItem[]>([]);
  const [isFitRulesOpen, setIsFitRulesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
const [isBulkUploading, setIsBulkUploading] = useState(false);
const [bulkUploadMessage, setBulkUploadMessage] = useState<string | null>(null);
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false);
  const [summary, setSummary] = useState<CatalogFitDataSummary>(emptySummary);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("");
  const [fitType, setFitType] = useState("");
  const [stretchLevel, setStretchLevel] = useState("");
  const [silhouette, setSilhouette] = useState("");
  const [hasSizeChart, setHasSizeChart] = useState<boolean | "">("");
  const [alterationAllowed, setAlterationAllowed] = useState<boolean | "">("");
  const [customSizingAvailable, setCustomSizingAvailable] = useState<
    boolean | ""
  >("");
  const [missingFitData, setMissingFitData] = useState<boolean | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo<CatalogFitDataListParams>(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      status: status || undefined,
      scope: scope || undefined,
      fitType: fitType || undefined,
      stretchLevel: stretchLevel || undefined,
      silhouette: silhouette || undefined,
      hasSizeChart,
      alterationAllowed,
      customSizingAvailable,
      missingFitData,
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    [
      page,
      limit,
      search,
      status,
      scope,
      fitType,
      stretchLevel,
      silhouette,
      hasSizeChart,
      alterationAllowed,
      customSizingAvailable,
      missingFitData,
    ],
  );

  const loadFitData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getCatalogFitData(params);

      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary || emptySummary);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Fit data load nahi ho paaya.",
      );
      setItems([]);
      setSummary(emptySummary);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadFitData();
  }, [loadFitData]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setScope("");
    setFitType("");
    setStretchLevel("");
    setSilhouette("");
    setHasSizeChart("");
    setAlterationAllowed("");
    setCustomSizingAvailable("");
    setMissingFitData("");
    setPage(1);
  }

  async function handleArchiveToggle(item: CatalogFitDataItem) {
    if (!item.id) return;

    try {
      setActionId(item.id);
      setError(null);

      if (String(item.status || "").toUpperCase() === "ARCHIVED") {
        await restoreCatalogFitData(item.id);
      } else {
        await archiveCatalogFitData(item.id);
      }

      await loadFitData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Fit data action fail ho gaya.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDownloadTemplate() {
  try {
    setIsTemplateDownloading(true);
    setError(null);

    const { blob, filename } = await downloadCatalogFitDataTemplate();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (downloadError) {
    setError(
      downloadError instanceof Error
        ? downloadError.message
        : "Template download failed.",
    );
  } finally {
    setIsTemplateDownloading(false);
  }
}


async function handleExportRecords() {
  try {
    setIsExporting(true);
    setError(null);

   await exportCatalogFitDataRecords({
  page,
  limit,
  search,
  status,
  scope,
  fitType,
  stretchLevel,
  silhouette,
  hasSizeChart,
  alterationAllowed,
  customSizingAvailable,
  missingFitData,
});
  } catch (error) {
    setError(error instanceof Error ? error.message : "Fit data export failed.");
  } finally {
    setIsExporting(false);
  }
}
async function handleBulkUploadFile(file?: File | null) {
  if (!file) return;

  try {
    setIsBulkUploading(true);
    setError(null);
    setBulkUploadMessage(null);

    const result = await bulkUploadCatalogFitData(file);

    const created = result.createdCount ?? 0;
    const updated = result.updatedCount ?? 0;
    const imported = result.importedCount ?? created + updated;
    const failed = result.failedCount ?? result.errors?.length ?? 0;

    setBulkUploadMessage(
      `Bulk upload complete. Imported: ${imported}, Created: ${created}, Updated: ${updated}, Failed: ${failed}.`,
    );

    await loadFitData();
  } catch (uploadError) {
    setError(
      uploadError instanceof Error
        ? uploadError.message
        : "Bulk upload failed.",
    );
  } finally {
    setIsBulkUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
}

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Fit Data
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Fit Data Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage garment measurements, body compatibility ranges, fit type,
              stretch level, silhouettes, size charts and alteration rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={loadFitData}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

          <>
  <input
    ref={fileInputRef}
    type="file"
    accept=".csv,.xlsx"
    className="hidden"
    onChange={(event) => handleBulkUploadFile(event.target.files?.[0])}
  />

  <Button
    type="button"
    variant="secondary"
    className="rounded-full"
    disabled={isBulkUploading}
    onClick={() => fileInputRef.current?.click()}
  >
    <Upload className="mr-2 h-4 w-4" />
    {isBulkUploading ? "Uploading..." : "Bulk Upload"}
  </Button>
</>

           <Button
  type="button"
  variant="secondary"
  className="rounded-full"
  onClick={handleDownloadTemplate}
  disabled={isTemplateDownloading}
>
  <Download className="mr-2 h-4 w-4" />
  {isTemplateDownloading ? "Downloading..." : "Template"}
</Button>

<Button
  type="button"
  variant="secondary"
  className="rounded-full"
  disabled={isExporting}
  onClick={handleExportRecords}
>
  <Download className="mr-2 h-4 w-4" />
  {isExporting ? "Exporting..." : "Export"}
</Button>

         <Button
  type="button"
  variant="secondary"
  className="rounded-full"
  onClick={() => setIsFitRulesOpen(true)}
>
  <Ruler className="mr-2 h-4 w-4" />
  Fit Rules
</Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/fit-data/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Fit Data
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}


      {bulkUploadMessage ? (
  <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
    {bulkUploadMessage}
  </div>
) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Total Records</p>
          <p className="mt-3 text-4xl font-semibold">{summary.totalRecords}</p>
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Active Records</p>
          <p className="mt-3 text-4xl font-semibold">{summary.activeRecords}</p>
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Missing Fit Data</p>
          <p className="mt-3 text-4xl font-semibold">
            {summary.missingFitDataProducts}
          </p>
        </Card>

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Products With Size Chart</p>
          <p className="mt-3 text-4xl font-semibold">
            {summary.productsWithSizeChart}
          </p>
        </Card>
      </section>

      <Card className="mb-6 rounded-[1.5rem] border-neutral-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-medium">Filters</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Search and filter product fit data records.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm underline underline-offset-4"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Search</span>
            <div className="flex items-center rounded-2xl border border-neutral-200 bg-white px-3">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Product name, SKU, slug"
                className="h-12 w-full bg-transparent px-2 outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Scope</span>
            <select
              value={scope}
              onChange={(event) => {
                setScope(event.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Fit Type</span>
            <select
              value={fitType}
              onChange={(event) => {
                setFitType(event.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="SLIM">Slim</option>
              <option value="REGULAR">Regular</option>
              <option value="RELAXED">Relaxed</option>
              <option value="OVERSIZED">Oversized</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Stretch Level</span>
            <select
              value={stretchLevel}
              onChange={(event) => {
                setStretchLevel(event.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="NONE">None</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Silhouette</span>
            <select
              value={silhouette}
              onChange={(event) => {
                setSilhouette(event.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="A_LINE">A Line</option>
              <option value="MERMAID">Mermaid</option>
              <option value="BALL_GOWN">Ball Gown</option>
              <option value="SHEATH">Sheath</option>
              <option value="FIT_AND_FLARE">Fit And Flare</option>
              <option value="STRAIGHT">Straight</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Has Size Chart</span>
            <select
              value={booleanSelectValue(hasSizeChart)}
              onChange={(event) => {
                setHasSizeChart(parseBooleanSelect(event.target.value));
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Missing Fit Data</span>
            <select
              value={booleanSelectValue(missingFitData)}
              onChange={(event) => {
                setMissingFitData(parseBooleanSelect(event.target.value));
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="true">Missing only</option>
              <option value="false">Existing only</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Alteration Allowed</span>
            <select
              value={booleanSelectValue(alterationAllowed)}
              onChange={(event) => {
                setAlterationAllowed(parseBooleanSelect(event.target.value));
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Custom Sizing</span>
            <select
              value={booleanSelectValue(customSizingAvailable)}
              onChange={(event) => {
                setCustomSizingAvailable(parseBooleanSelect(event.target.value));
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 outline-none"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[1.5rem] border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div>
            <h2 className="text-2xl font-medium">Fit Data Records</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {total} record{total === 1 ? "" : "s"} found.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#f3eee6] text-xs uppercase tracking-[0.18em] text-neutral-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Fit</th>
                <th className="px-5 py-4">Stretch</th>
                <th className="px-5 py-4">Size Chart</th>
                <th className="px-5 py-4">Body Types</th>
                <th className="px-5 py-4">Rules</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    Fit data load ho raha hai...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-neutral-100 align-top"
                  >
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName || "Product"}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>

                        <div>
                          <p className="font-medium">
                            {item.productName || "Untitled Product"}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            SKU: {item.productSku || "—"}
                          </p>
                          <p className="mt-1 max-w-[260px] truncate text-xs text-neutral-400">
                            {item.productSlug || item.productId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">{formatLabel(item.fitType)}</p>
                      <p className="text-xs text-neutral-500">
                        {formatLabel(item.silhouette)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatLabel(item.lengthType)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p>{formatLabel(item.stretchLevel)}</p>
                      <p className="text-xs text-neutral-500">
                        Support: {formatLabel(item.supportLevel)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {item.hasSizeChart ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.sizeChartCount || 0} row
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {(item.recommendedForBodyTypes || []).length ? (
                          item.recommendedForBodyTypes?.map((type) => (
                            <span
                              key={type}
                              className="rounded-full border border-neutral-200 px-2 py-1 text-xs"
                            >
                              {formatLabel(type)}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs">
                        <p>
                          Alteration:{" "}
                          <span className="font-medium">
                            {item.alterationAllowed ? "Yes" : "No"}
                          </span>
                        </p>
                        <p>
                          Custom sizing:{" "}
                          <span className="font-medium">
                            {item.customSizingAvailable ? "Yes" : "No"}
                          </span>
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClass(
                          item.status,
                        )}`}
                      >
                        {formatLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/catalog/fit-data/${item.id}/edit`}>
                            Edit
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionId === item.id}
                          onClick={() => handleArchiveToggle(item)}
                        >
                          {String(item.status || "").toUpperCase() ===
                          "ARCHIVED"
                            ? "Restore"
                            : "Archive"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-neutral-500"
                  >
                    No fit data records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 p-5 sm:flex-row">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <FitRulesModal
  open={isFitRulesOpen}
  onClose={() => setIsFitRulesOpen(false)}
/>
    </main>
  );
}

type FitRuleFormState = {
  name: string;
  ruleType: string;
  conditionKey: string;
  conditionValue: string;
  recommendationNote: string;
  confidenceAdjustment: string;
  priority: string;
  isActive: boolean;
};

const defaultFitRuleForm: FitRuleFormState = {
  name: "",
  ruleType: "SILHOUETTE",
  conditionKey: "silhouette",
  conditionValue: "",
  recommendationNote: "",
  confidenceAdjustment: "0",
  priority: "10",
  isActive: true,
};

function parseRuleForm(rule: CatalogFitRule): FitRuleFormState {
  const conditions = rule.conditions || {};
  const effect = rule.effect || {};
  const firstConditionKey = Object.keys(conditions)[0] || "silhouette";

  return {
    name: rule.name || "",
    ruleType: String(rule.ruleType || "SILHOUETTE"),
    conditionKey: firstConditionKey,
    conditionValue: String(conditions[firstConditionKey] || ""),
    recommendationNote: String(effect.recommendationNote || ""),
    confidenceAdjustment: String(effect.confidenceAdjustment ?? 0),
    priority: String(rule.priority ?? 10),
    isActive: rule.isActive !== false,
  };
}

function buildRulePayload(form: FitRuleFormState): CatalogFitRulePayload {
  return {
    name: form.name.trim(),
    ruleType: form.ruleType,
    conditions: {
      [form.conditionKey.trim() || "silhouette"]: form.conditionValue.trim(),
    },
    effect: {
      recommendationNote: form.recommendationNote.trim(),
      confidenceAdjustment: Number(form.confidenceAdjustment || 0),
    },
    priority: Number(form.priority || 0),
    isActive: form.isActive,
  };
}

function FitRulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [rules, setRules] = useState<CatalogFitRule[]>([]);
  const [search, setSearch] = useState("");
  const [ruleType, setRuleType] = useState("");
  const [isActive, setIsActive] = useState<boolean | "">(true);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<FitRuleFormState>(defaultFitRuleForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedRule =
    editingRuleId && rules.find((rule) => rule.id === editingRuleId)
      ? rules.find((rule) => rule.id === editingRuleId)
      : null;

  const loadRules = useCallback(async () => {
    if (!open) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getCatalogFitRules({
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
        ruleType: ruleType || undefined,
        isActive,
      });

      setRules(Array.isArray(data.items) ? data.items : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Fit rules load nahi ho paaye.",
      );
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [open, search, ruleType, isActive]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    if (!open) return;

    setForm(defaultFitRuleForm);
    setEditingRuleId(null);
    setMessage(null);
    setError(null);
    setSearch("");
    setRuleType("");
    setIsActive(true);
  }, [open]);

  if (!open) return null;

  function updateForm<K extends keyof FitRuleFormState>(
    key: K,
    value: FitRuleFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startEdit(rule: CatalogFitRule) {
    setEditingRuleId(rule.id);
    setForm(parseRuleForm(rule));
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingRuleId(null);
    setForm(defaultFitRuleForm);
    setMessage(null);
    setError(null);
  }

  async function handleSaveRule() {
    try {
      setError(null);
      setMessage(null);

      const payload = buildRulePayload(form);

      if (!payload.name) {
        setError("Rule name required hai.");
        return;
      }

      if (!Object.values(payload.conditions).some((value) => String(value).trim())) {
        setError("Condition value required hai.");
        return;
      }

      setActionId(editingRuleId || "create");

      if (editingRuleId) {
        await updateCatalogFitRule(editingRuleId, payload);
        setMessage("Fit rule updated successfully.");
      } else {
        await createCatalogFitRule(payload);
        setMessage("Fit rule created successfully.");
      }

      resetForm();
      await loadRules();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Fit rule save failed.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteRule(rule: CatalogFitRule) {
    const confirmed = window.confirm(
      `Delete fit rule "${rule.name}"? Ye action undo nahi hoga.`,
    );

    if (!confirmed) return;

    try {
      setActionId(rule.id);
      setError(null);
      setMessage(null);

      await deleteCatalogFitRule(rule.id);
      setMessage("Fit rule deleted successfully.");

      if (editingRuleId === rule.id) {
        resetForm();
      }

      await loadRules();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Fit rule delete failed.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleActive(rule: CatalogFitRule) {
    try {
      setActionId(rule.id);
      setError(null);
      setMessage(null);

      if (rule.isActive) {
        await deactivateCatalogFitRule(rule.id);
        setMessage("Fit rule deactivated.");
      } else {
        await activateCatalogFitRule(rule.id);
        setMessage("Fit rule activated.");
      }

      await loadRules();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Fit rule status update failed.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="mx-auto flex max-h-[92vh] max-w-6xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Admin / Catalog / Fit Rules
            </p>
            <h2 className="mt-2 text-3xl font-medium">Fit Rules</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Recommendation engine ke fit logic rules manage karo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-2xl leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            ×
          </button>
        </div>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-y-auto p-6">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium">Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rule name"
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Rule Type</span>
                <select
                  value={ruleType}
                  onChange={(event) => setRuleType(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="">All</option>
                  <option value="SILHOUETTE">Silhouette</option>
                  <option value="FIT_TYPE">Fit Type</option>
                  <option value="BODY_TYPE">Body Type</option>
                  <option value="STRETCH_LEVEL">Stretch Level</option>
                  <option value="SIZE_CHART">Size Chart</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Status</span>
                <select
                  value={booleanSelectValue(isActive)}
                  onChange={(event) =>
                    setIsActive(parseBooleanSelect(event.target.value))
                  }
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <p className="text-sm font-semibold">
                  Rules ({rules.length})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={loadRules}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  Fit rules load ho rahe hain...
                </div>
              ) : rules.length ? (
                <div className="divide-y divide-neutral-100">
                  {rules.map((rule) => (
                    <div key={rule.id} className="px-4 py-4">
                      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-neutral-950">
                              {rule.name}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                                rule.isActive
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                              }`}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                            <span>Type: {formatLabel(rule.ruleType)}</span>
                            <span>Priority: {rule.priority}</span>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="font-semibold text-neutral-700">
                                Conditions
                              </p>
                              <pre className="mt-1 whitespace-pre-wrap break-words text-neutral-600">
                                {JSON.stringify(rule.conditions || {}, null, 2)}
                              </pre>
                            </div>
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="font-semibold text-neutral-700">
                                Effect
                              </p>
                              <pre className="mt-1 whitespace-pre-wrap break-words text-neutral-600">
                                {JSON.stringify(rule.effect || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(rule)}
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionId === rule.id}
                            onClick={() => handleToggleActive(rule)}
                          >
                            {rule.isActive ? "Deactivate" : "Activate"}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionId === rule.id}
                            onClick={() => handleDeleteRule(rule)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  No fit rules found. Right side se first rule create karo.
                </div>
              )}
            </div>
          </div>

          <aside className="overflow-y-auto border-t border-neutral-200 bg-[#fbfaf6] p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-medium">
                  {selectedRule ? "Edit Fit Rule" : "Create Fit Rule"}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Conditions match hone par effect recommendation engine me use hoga.
                </p>
              </div>

              {selectedRule ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  New
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              <label className="space-y-2 block">
                <span className="text-sm font-medium">Rule name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Mermaid gowns fit tighter at hips"
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-medium">Rule Type</span>
                <select
                  value={form.ruleType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    updateForm("ruleType", nextType);

                    if (nextType === "SILHOUETTE") updateForm("conditionKey", "silhouette");
                    if (nextType === "FIT_TYPE") updateForm("conditionKey", "fitType");
                    if (nextType === "BODY_TYPE") updateForm("conditionKey", "bodyType");
                    if (nextType === "STRETCH_LEVEL") updateForm("conditionKey", "stretchLevel");
                    if (nextType === "SIZE_CHART") updateForm("conditionKey", "hasSizeChart");
                  }}
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="SILHOUETTE">Silhouette</option>
                  <option value="FIT_TYPE">Fit Type</option>
                  <option value="BODY_TYPE">Body Type</option>
                  <option value="STRETCH_LEVEL">Stretch Level</option>
                  <option value="SIZE_CHART">Size Chart</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <label className="space-y-2 block">
                  <span className="text-sm font-medium">Condition key</span>
                  <input
                    value={form.conditionKey}
                    onChange={(event) =>
                      updateForm("conditionKey", event.target.value)
                    }
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                  />
                </label>

                <label className="space-y-2 block">
                  <span className="text-sm font-medium">Condition value</span>
                  <input
                    value={form.conditionValue}
                    onChange={(event) =>
                      updateForm("conditionValue", event.target.value)
                    }
                    placeholder="MERMAID"
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-medium">Recommendation note</span>
                <textarea
                  value={form.recommendationNote}
                  onChange={(event) =>
                    updateForm("recommendationNote", event.target.value)
                  }
                  placeholder="Size up if between hip measurements."
                  className="min-h-24 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <label className="space-y-2 block">
                  <span className="text-sm font-medium">
                    Confidence adjustment
                  </span>
                  <input
                    type="number"
                    value={form.confidenceAdjustment}
                    onChange={(event) =>
                      updateForm("confidenceAdjustment", event.target.value)
                    }
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                  />
                </label>

                <label className="space-y-2 block">
                  <span className="text-sm font-medium">Priority</span>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(event) => updateForm("priority", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                  className="h-4 w-4"
                />
                Active rule
              </label>

              <Button
                type="button"
                className="w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
          disabled={Boolean(actionId)}
                onClick={handleSaveRule}
              >
             {actionId
  ? "Saving..."
  : selectedRule
    ? "Update Fit Rule"
    : "Create Fit Rule"}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
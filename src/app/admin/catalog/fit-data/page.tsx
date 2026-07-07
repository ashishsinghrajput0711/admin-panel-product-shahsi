"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

            <Button type="button" variant="secondary" className="rounded-full">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

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

            <Button type="button" variant="secondary" className="rounded-full">
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
    </main>
  );
}
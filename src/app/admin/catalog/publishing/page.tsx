"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Send,
  ShieldAlert,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublishingFilters } from "@/components/admin/catalog/publishing/publishing-filters";
import { PublishingTable } from "@/components/admin/catalog/publishing/publishing-table";
import type {
  BulkPublishingResult,
  PublishingListFilters,
  PublishingRecord,
  PublishingRelations,
  PublishingStatusHistory,
  PublishingSummary,
  PublishingValidationResult,
} from "@/components/admin/catalog/publishing/publishing-types";
import {
  bulkPublishCatalogProducts,
  bulkUnpublishCatalogProducts,
  getCatalogProductPublishingRelations,
  getCatalogProductStatusHistory,
  getCatalogPublishingProducts,
  getCatalogPublishingSummary,
  getCatalogPublishingValidationErrors,
  publishCatalogProduct,
  unpublishCatalogProduct,
} from "@/lib/admin/catalog-publishing-api";

const defaultFilters: PublishingListFilters = {
  search: "",
  status: "",
  publicationStatus: "",
  businessType: "",
  productType: "",
  brand: "",
  categoryId: "",
};

export default function PublishingPage() {
  const [records, setRecords] = useState<PublishingRecord[]>([]);
  const [summary, setSummary] = useState<PublishingSummary | null>(
    null,
  );

  const [filters, setFilters] =
    useState<PublishingListFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [actionProductId, setActionProductId] = useState("");

  const [error, setError] = useState("");
  const [bulkResult, setBulkResult] =
    useState<BulkPublishingResult | null>(null);

  const [validationData, setValidationData] =
    useState<PublishingValidationResult | null>(null);
  const [validationModalOpen, setValidationModalOpen] =
    useState(false);
  const [validationLoading, setValidationLoading] = useState(false);

  const [detailsRecord, setDetailsRecord] =
    useState<PublishingRecord | null>(null);
  const [detailsRelations, setDetailsRelations] =
    useState<PublishingRelations | null>(null);
  const [detailsHistory, setDetailsHistory] =
    useState<PublishingStatusHistory | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const result = await getCatalogPublishingProducts({
        page,
        limit,
        search: debouncedSearch,
        status: filters.status,
        publicationStatus: filters.publicationStatus,
        businessType: filters.businessType,
        productType: filters.productType.trim(),
        brand: filters.brand.trim(),
        categoryId: filters.categoryId.trim(),
      });

      setRecords(result.products);
      setTotal(result.meta.total);
      setTotalPages(Math.max(1, result.meta.totalPages));
      setSelectedIds(new Set());
    } catch (loadError) {
      setRecords([]);
      setTotal(0);
      setTotalPages(1);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Catalog publishing records load nahi ho paaye.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    filters.status,
    filters.publicationStatus,
    filters.businessType,
    filters.productType,
    filters.brand,
    filters.categoryId,
  ]);

  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);

      const result = await getCatalogPublishingSummary();
      setSummary(result);
    } catch (summaryError) {
      setError(
        summaryError instanceof Error
          ? summaryError.message
          : "Publishing summary load nahi ho paayi.",
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const selectedRecords = useMemo(
    () =>
      records.filter((record) => selectedIds.has(record.id)),
    [records, selectedIds],
  );

  function handleFiltersChange(nextFilters: PublishingListFilters) {
    setPage(1);
    setFilters(nextFilters);
    setBulkResult(null);
  }

  function clearFilters() {
    setPage(1);
    setFilters(defaultFilters);
    setDebouncedSearch("");
    setBulkResult(null);
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(records.map((record) => record.id)));
  }

  async function refreshPage() {
    setBulkResult(null);

    await Promise.all([loadProducts(), loadSummary()]);
  }

  async function handlePublish(record: PublishingRecord) {
    const reason = window.prompt(
      `Publish "${record.title}"?\n\nPublishing reason enter karo:`,
      "Publishing after catalog review",
    );

    if (reason === null) return;

    try {
      setActionProductId(record.id);
      setError("");
      setBulkResult(null);

      await publishCatalogProduct(record.id, {
        publishedAt: new Date().toISOString(),
        reason:
          reason.trim() || "Publishing after catalog review",
      });

      await refreshPage();
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Product publish failed.",
      );
    } finally {
      setActionProductId("");
    }
  }

  async function handleUnpublish(record: PublishingRecord) {
    const reason = window.prompt(
      `Unpublish "${record.title}"?\n\nUnpublish reason enter karo:`,
      "Product temporarily removed from storefront",
    );

    if (reason === null) return;

    try {
      setActionProductId(record.id);
      setError("");
      setBulkResult(null);

      await unpublishCatalogProduct(record.id, {
        reason:
          reason.trim() ||
          "Product temporarily removed from storefront",
      });

      await refreshPage();
    } catch (unpublishError) {
      setError(
        unpublishError instanceof Error
          ? unpublishError.message
          : "Product unpublish failed.",
      );
    } finally {
      setActionProductId("");
    }
  }

  async function handleBulkPublish() {
    if (selectedIds.size === 0) return;

    const reason = window.prompt(
      `Publish ${selectedIds.size} selected product(s)?\n\nReason enter karo:`,
      "Publishing selected products after catalog review",
    );

    if (reason === null) return;

    try {
      setIsBulkLoading(true);
      setError("");
      setBulkResult(null);

      const result = await bulkPublishCatalogProducts({
        ids: Array.from(selectedIds),
        publishedAt: new Date().toISOString(),
        reason:
          reason.trim() ||
          "Publishing selected products after catalog review",
      });

      setBulkResult(result);

      await Promise.all([loadProducts(), loadSummary()]);
    } catch (bulkError) {
      setError(
        bulkError instanceof Error
          ? bulkError.message
          : "Bulk publish failed.",
      );
    } finally {
      setIsBulkLoading(false);
    }
  }

  async function handleBulkUnpublish() {
    if (selectedIds.size === 0) return;

    const reason = window.prompt(
      `Unpublish ${selectedIds.size} selected product(s)?\n\nReason enter karo:`,
      "Selected products temporarily unpublished",
    );

    if (reason === null) return;

    try {
      setIsBulkLoading(true);
      setError("");
      setBulkResult(null);

      const result = await bulkUnpublishCatalogProducts({
        ids: Array.from(selectedIds),
        reason:
          reason.trim() ||
          "Selected products temporarily unpublished",
      });

      setBulkResult(result);

      await Promise.all([loadProducts(), loadSummary()]);
    } catch (bulkError) {
      setError(
        bulkError instanceof Error
          ? bulkError.message
          : "Bulk unpublish failed.",
      );
    } finally {
      setIsBulkLoading(false);
    }
  }

  async function openValidationModal() {
    try {
      setValidationModalOpen(true);
      setValidationLoading(true);
      setError("");

      const result =
        await getCatalogPublishingValidationErrors();

      setValidationData(result);
    } catch (validationError) {
      setValidationData(null);

      setError(
        validationError instanceof Error
          ? validationError.message
          : "Validation issues load nahi hue.",
      );
    } finally {
      setValidationLoading(false);
    }
  }

  async function openDetails(record: PublishingRecord) {
    try {
      setDetailsRecord(record);
      setDetailsRelations(null);
      setDetailsHistory(null);
      setDetailsError("");
      setDetailsLoading(true);

      const [relations, history] = await Promise.all([
        getCatalogProductPublishingRelations(record.id),
        getCatalogProductStatusHistory(record.id),
      ]);

      setDetailsRelations(relations);
      setDetailsHistory(history);
    } catch (detailError) {
      setDetailsError(
        detailError instanceof Error
          ? detailError.message
          : "Publishing details load nahi hui.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Publishing
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Publishing Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage lifecycle and storefront publication separately,
              review backend-owned readiness issues, and publish or
              unpublish catalog products safely.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={isLoading || isSummaryLoading}
              onClick={refreshPage}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={openValidationModal}
              disabled={validationLoading}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Validation Issues
            </Button>

            <Button
              type="button"
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
              disabled={selectedIds.size === 0 || isBulkLoading}
              onClick={handleBulkPublish}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish Selected ({selectedIds.size})
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={selectedIds.size === 0 || isBulkLoading}
              onClick={handleBulkUnpublish}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Unpublish Selected
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total Products"
          value={summary?.total}
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Published"
          value={summary?.published}
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Unpublished"
          value={summary?.unpublished}
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Publish Blocked"
          value={summary?.publishBlocked}
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Validation Errors"
          value={summary?.validationErrorProducts}
          loading={isSummaryLoading}
        />

        <SummaryCard
          label="Warnings"
          value={summary?.warningProducts}
          loading={isSummaryLoading}
        />
      </section>

      <div className="mb-6">
        <PublishingFilters
          value={filters}
          disabled={isLoading}
          onChange={handleFiltersChange}
          onClear={clearFilters}
        />
      </div>

      {selectedIds.size > 0 ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>{selectedIds.size}</strong> product
          {selectedIds.size === 1 ? "" : "s"} selected on current page.

          {selectedRecords.some(
            (record) => !record.publishReadiness.canPublish,
          ) ? (
            <p className="mt-1 text-xs">
              Selected products mein blocked products bhi hain. Backend
              bulk API partial success return karegi.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {bulkResult ? (
        <BulkResultAlert
          result={bulkResult}
          onClose={() => setBulkResult(null)}
        />
      ) : null}

      <PublishingTable
        records={records}
        isLoading={isLoading}
        selectedIds={selectedIds}
        actionProductId={actionProductId}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onOpenDetails={openDetails}
      />

      <div className="mt-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </p>

          <p className="mt-1 text-xs text-neutral-400">
            {total} total products
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={page <= 1 || isLoading}
            onClick={() =>
              setPage((current) => Math.max(1, current - 1))
            }
          >
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={page >= totalPages || isLoading}
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      {validationModalOpen ? (
        <ValidationModal
          loading={validationLoading}
          data={validationData}
          onClose={() => setValidationModalOpen(false)}
        />
      ) : null}

      {detailsRecord ? (
        <ProductDetailsModal
          record={detailsRecord}
          relations={detailsRelations}
          history={detailsHistory}
          loading={detailsLoading}
          error={detailsError}
          onClose={() => {
            setDetailsRecord(null);
            setDetailsRelations(null);
            setDetailsHistory(null);
            setDetailsError("");
          }}
        />
      ) : null}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="rounded-[1.25rem] border-neutral-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-neutral-950">
        {loading ? "—" : (value ?? 0)}
      </p>
    </Card>
  );
}

function BulkResultAlert({
  result,
  onClose,
}: {
  result: BulkPublishingResult;
  onClose: () => void;
}) {
  const failedResults = result.results.filter(
    (item) => !item.success,
  );

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-neutral-950">
            Bulk action result
          </h3>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span>Requested: {result.requested}</span>
            <span className="text-emerald-700">
              Succeeded: {result.succeeded}
            </span>
            <span className="text-red-700">
              Failed: {result.failed}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {failedResults.length > 0 ? (
        <div className="mt-4 space-y-3">
          {failedResults.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <p className="font-medium">
                Product ID: {item.id}
              </p>

              <p className="mt-1">
                {item.error || "Publishing action failed."}
              </p>

              {item.validationErrors?.map((issue) => (
                <p
                  key={`${item.id}-${issue.code}`}
                  className="mt-1 text-xs"
                >
                  {issue.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ValidationModal({
  loading,
  data,
  onClose,
}: {
  loading: boolean;
  data: PublishingValidationResult | null;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title="Catalog Validation Issues"
      description="Backend-owned errors block publishing. Warnings are informational."
      onClose={onClose}
    >
      {loading ? (
        <p className="p-6 text-sm text-neutral-500">
          Loading validation issues...
        </p>
      ) : data ? (
        <div>
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricBox
              label="Products Scanned"
              value={data.totalProductsScanned}
            />

            <MetricBox
              label="Blocked Products"
              value={data.productsWithBlockingErrors}
            />

            <MetricBox
              label="Total Errors"
              value={data.totalErrors}
            />

            <MetricBox
              label="Total Warnings"
              value={data.totalWarnings}
            />
          </div>

    <div className="mt-5 max-h-[48vh] space-y-2 overflow-y-auto pr-2">
            {[...data.errors, ...data.warnings].map(
              (issue, index) => (
                <div
                  key={`${issue.productId}-${issue.code}-${index}`}
                  className={
                    issue.severity === "ERROR"
                ? "rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
: "rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {formatLabel(issue.code)}
                    </p>

                    <span className="text-xs">
                      {issue.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">{issue.message}</p>

                  <p className="mt-2 text-xs opacity-70">
                    Product: {issue.productId} · Field: {issue.field}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      ) : (
        <p className="p-6 text-sm text-neutral-500">
          No validation response available.
        </p>
      )}
    </ModalShell>
  );
}

function ProductDetailsModal({
  record,
  relations,
  history,
  loading,
  error,
  onClose,
}: {
  record: PublishingRecord;
  relations: PublishingRelations | null;
  history: PublishingStatusHistory | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title={record.title}
      description="Publishing readiness, relations summary and audit timeline."
      onClose={onClose}
    >
      {loading ? (
        <p className="p-6 text-sm text-neutral-500">
          Loading publishing details...
        </p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div>
          {relations ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <MetricBox
                  label="Variants"
                  value={relations.readinessSummary.variantCount}
                />

                <MetricBox
                  label="Active Variants"
                  value={
                    relations.readinessSummary.activeVariantCount
                  }
                />

                <MetricBox
                  label="Media"
                  value={relations.readinessSummary.mediaCount}
                />

                <MetricBox
                  label="Blocking Errors"
                  value={
                    relations.readinessSummary.blockingErrorCount
                  }
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <BooleanStatus
                  label="Primary Image"
                  value={
                    relations.readinessSummary
                      .primaryImageAvailable
                  }
                />

                <BooleanStatus
                  label="Category"
                  value={
                    relations.readinessSummary.categoryAvailable
                  }
                />
              </div>

              {relations.publishReadiness.issues.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-neutral-950">
                    Readiness issues
                  </h3>

                  <div className="mt-3 space-y-2">
                    {relations.publishReadiness.issues.map(
                      (issue, index) => (
                        <div
                          key={`${issue.code}-${index}`}
                          className={
                            issue.severity === "ERROR"
                              ? "rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                              : "rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
                          }
                        >
                          <p className="font-medium">
                            {formatLabel(issue.code)}
                          </p>

                          <p className="mt-1">{issue.message}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Product has no current publishing issues.
                </div>
              )}
            </>
          ) : null}

          <div className="mt-7">
            <h3 className="text-lg font-medium text-neutral-950">
              Status and publication history
            </h3>

            <div className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-2">
              {history?.history?.length ? (
                history.history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-200 bg-[#fbfaf6] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-neutral-900">
                        {formatLabel(item.action)}
                      </p>

                      <span className="text-xs text-neutral-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-neutral-600">
                      {item.reason || "No reason provided."}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                      {item.fromStatus || item.toStatus ? (
                        <span>
                          Lifecycle: {item.fromStatus || "—"} →{" "}
                          {item.toStatus || "—"}
                        </span>
                      ) : null}

                      {item.fromPublicationStatus ||
                      item.toPublicationStatus ? (
                        <span>
                          Publication:{" "}
                          {item.fromPublicationStatus || "—"} →{" "}
                          {item.toPublicationStatus || "—"}
                        </span>
                      ) : null}

                      <span>
                        By:{" "}
                        {item.createdBy?.name ||
                          item.createdBy?.email ||
                          item.createdBy?.id ||
                          "Unknown"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">
                  No history records found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
    <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Admin / Catalog / Publishing
            </p>

          <h2 className="mt-2 text-2xl font-medium text-neutral-950">
              {title}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-[#fbfaf6] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function BooleanStatus({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div
      className={
        value
          ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
          : "rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
      }
    >
      {value ? (
        <CheckCircle2 className="mr-2 inline h-4 w-4" />
      ) : (
        <AlertTriangle className="mr-2 inline h-4 w-4" />
      )}

      {label}: {value ? "Available" : "Missing"}
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
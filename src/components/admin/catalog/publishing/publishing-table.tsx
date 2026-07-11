"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  ImageIcon,
  Pencil,
  Send,
  Undo2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  CatalogLifecycleStatus,
  CatalogPublicationStatus,
  PublishingIssue,
  PublishingRecord,
} from "./publishing-types";

type PublishingTableProps = {
  records: PublishingRecord[];
  isLoading: boolean;

  selectedIds: Set<string>;
  actionProductId: string;

  onToggleSelected: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;

  onPublish: (record: PublishingRecord) => void;
  onUnpublish: (record: PublishingRecord) => void;
  onOpenDetails: (record: PublishingRecord) => void;
};

export function PublishingTable({
  records,
  isLoading,
  selectedIds,
  actionProductId,
  onToggleSelected,
  onToggleAll,
  onPublish,
  onUnpublish,
  onOpenDetails,
}: PublishingTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(),
  );

  if (isLoading) {
    return (
      <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        Loading catalog publishing records...
      </Card>
    );
  }

  if (!records.length) {
    return (
      <Card className="rounded-[1.5rem] border-dashed border-neutral-300 bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No products found
        </h3>

        <p className="mt-2 text-sm text-neutral-500">
          Search ya filters change karke dobara check karo.
        </p>
      </Card>
    );
  }

  const allSelected = records.every((record) =>
    selectedIds.has(record.id),
  );

  const someSelected = records.some((record) =>
    selectedIds.has(record.id),
  );

  function toggleIssues(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-[#f7f2ea] px-4 py-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-700">
          <Checkbox
            checked={
              allSelected
                ? true
                : someSelected
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              onToggleAll(checked === true)
            }
          />

          Select all on this page
        </label>

        <span className="text-xs text-neutral-500">
          {records.length} products
        </span>
      </div>

      {records.map((record) => {
        const isSelected = selectedIds.has(record.id);
        const isActionLoading = actionProductId === record.id;
        const issuesExpanded = expandedIds.has(record.id);

        const allIssues =
          record.publishReadiness?.issues?.length > 0
            ? record.publishReadiness.issues
            : [
                ...(record.publishReadiness?.errors ?? []),
                ...(record.publishReadiness?.warnings ?? []),
                ...(record.publishReadiness?.info ?? []),
              ];

        const canPublish =
          record.status === "ACTIVE" &&
          record.publishReadiness?.canPublish === true &&
          !record.isPublished;

        const imageUrl =
          record.thumbnailUrl ||
          record.primaryImage?.thumbnailUrl ||
          record.primaryImage?.url ||
          null;

        return (
          <Card
            key={record.id}
            className={`rounded-[1.25rem] border bg-white p-4 transition ${
              isSelected
                ? "border-blue-300 ring-2 ring-blue-100"
                : "border-neutral-200"
            }`}
          >
            <div className="grid gap-4 xl:grid-cols-[auto_minmax(260px,1.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_auto] xl:items-start">
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onToggleSelected(record.id, checked === true)
                  }
                  aria-label={`Select ${record.title}`}
                />
              </div>

              <div className="flex min-w-0 gap-3">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-[#fbfaf6]">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={
                        record.thumbnailAlt ||
                        record.primaryImage?.altText ||
                        record.title
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-neutral-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-medium leading-5 text-neutral-950">
                    {record.title}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    SKU: {record.sku || "—"}
                  </p>

                  <p className="mt-1 truncate text-xs text-neutral-400">
                    /{record.slug}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {record.businessType ? (
                      <Badge variant="outline">
                        {formatLabel(record.businessType)}
                      </Badge>
                    ) : null}

                    {record.productType ? (
                      <Badge variant="outline">
                        {formatLabel(record.productType)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <InfoSection label="Catalog">
                <p className="font-medium text-neutral-800">
                  {record.categorySummary?.name || "No category"}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {record.brand || "No brand"}
                </p>
              </InfoSection>

              <InfoSection label="Status">
                <div className="flex flex-wrap gap-2">
                  <LifecycleBadge status={record.status} />

                  <PublicationBadge
                    status={record.publicationStatus}
                  />
                </div>

                <p className="mt-2 text-xs text-neutral-500">
                  {record.isPublished
                    ? "Visible on storefront"
                    : "Not visible on storefront"}
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Published: {formatDate(record.publishedAt)}
                </p>
              </InfoSection>

              <InfoSection label="Readiness">
                {record.publishReadiness?.canPublish ? (
                  <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
           {record.isPublished ? "No validation issues" : "Ready to publish"}
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                    {record.isPublished
                      ? "Published with issues"
                      : "Publish blocked"}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span className="text-red-700">
                    {record.publishReadiness?.blockingErrorCount ?? 0}{" "}
                    errors
                  </span>

                  <span className="text-amber-700">
                    {record.publishReadiness?.warningCount ?? 0}{" "}
                    warnings
                  </span>
                </div>

                {allIssues.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleIssues(record.id)}
                    className="mt-2 inline-flex items-center text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
                  >
                    {issuesExpanded ? (
                      <ChevronUp className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="mr-1 h-3.5 w-3.5" />
                    )}

                    {issuesExpanded ? "Hide issues" : "View issues"}
                  </button>
                ) : null}
              </InfoSection>

              <div className="flex flex-wrap gap-2 xl:max-w-[190px] xl:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={isActionLoading}
                  onClick={() => onOpenDetails(record)}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  Details
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Link
                    href={`/admin/catalog/products/${record.id}/edit`}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>

                {record.isPublished ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    disabled={isActionLoading}
                    onClick={() => onUnpublish(record)}
                  >
                    <Undo2 className="mr-2 h-3.5 w-3.5" />

                    {isActionLoading
                      ? "Unpublishing..."
                      : "Unpublish"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={!canPublish || isActionLoading}
                    title={
                      record.status !== "ACTIVE"
                        ? "Only ACTIVE products can be published."
                        : !record.publishReadiness?.canPublish
                          ? "Resolve blocking validation errors before publishing."
                          : "Publish product"
                    }
                    onClick={() => onPublish(record)}
                  >
                    <Send className="mr-2 h-3.5 w-3.5" />

                    {isActionLoading
                      ? "Publishing..."
                      : "Publish"}
                  </Button>
                )}
              </div>
            </div>

            {issuesExpanded ? (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {allIssues.map((issue, index) => (
                    <IssueRow
                      key={`${record.id}-${issue.code}-${index}`}
                      issue={issue}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}

function InfoSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-[#fbfaf6] p-3 xl:border-0 xl:bg-transparent xl:p-0">
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>

      {children}
    </div>
  );
}

function IssueRow({ issue }: { issue: PublishingIssue }) {
  const className =
    issue.severity === "ERROR"
      ? "border-red-200 bg-red-50 text-red-700"
      : issue.severity === "WARNING"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-xl border p-3 text-xs ${className}`}>
      <p className="font-semibold">{formatLabel(issue.code)}</p>
      <p className="mt-1 leading-5">{issue.message}</p>
      <p className="mt-1 opacity-70">Field: {issue.field}</p>
    </div>
  );
}

function LifecycleBadge({
  status,
}: {
  status: CatalogLifecycleStatus;
}) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700"
        : status === "INACTIVE"
          ? "bg-neutral-100 text-neutral-700"
          : "bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function PublicationBadge({
  status,
}: {
  status: CatalogPublicationStatus;
}) {
  const className =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PUBLISH_BLOCKED"
        ? "bg-red-50 text-red-700"
        : "bg-neutral-100 text-neutral-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {formatLabel(status)}
    </span>
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
  }).format(date);
}
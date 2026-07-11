"use client";

import Link from "next/link";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StyleData } from "./style-data-types";

export function StyleDataTable({
  styleDataItems,
  isLoading,
  actionId,
  onArchive,
  onRestore,
  onDelete,
}: {
  styleDataItems: StyleData[];
  isLoading: boolean;
  actionId?: string;
  onArchive?: (item: StyleData) => void;
  onRestore?: (item: StyleData) => void;
  onDelete?: (item: StyleData) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-8 text-sm text-neutral-500">
        Loading style data...
      </div>
    );
  }

  if (!styleDataItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No style data records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Create style data record ya filters clear karke dobara check karo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {styleDataItems.map((item) => {
        const isActionLoading = actionId === item.id;
        const isArchived = item.status === "ARCHIVED";

        return (
          <article
            key={item.id}
            className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start">
              <div className="flex min-w-0 flex-1 gap-4">
                <ProductImage item={item} />

                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      {formatLabel(item.scope)}
                    </Badge>

                    <Badge variant="outline" className="bg-white">
                      {formatLabel(item.businessType)}
                    </Badge>

                    <StatusBadge status={item.status} />
                  </div>

                  <h3 className="max-w-[360px] text-lg font-semibold leading-snug text-neutral-950">
                    {item.productName || "Untitled product"}
                  </h3>

                  <div className="mt-2 space-y-1 text-sm text-neutral-600">
                    <p>
                      <span className="font-medium text-neutral-800">SKU:</span>{" "}
                      {item.productSku || "—"}
                    </p>

                    <p className="max-w-[420px] break-words text-xs text-neutral-400">
                      {item.productSlug || item.productId}
                    </p>
                  </div>

                  {item.variantId ? (
                    <div className="mt-3 max-w-[420px] rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-3 text-xs text-neutral-600">
                      <p className="font-medium text-neutral-800">Variant</p>
                      <p className="mt-1">
                        {item.variantTitle || item.variantSku || item.variantId}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid flex-[1.35] gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoBlock label="Color Family" value={item.colorFamily} />
                <InfoBlock label="Fabric Feel" value={item.fabricFeel} />
                <InfoBlock label="Neckline" value={item.neckline} />
                <InfoBlock label="Sleeve Type" value={item.sleeveType} />
                <InfoBlock label="Silhouette" value={item.silhouette} />
                <InfoBlock label="Modesty Level" value={item.modestyLevel} />
              </div>

              <div className="flex-[1.05] rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
                  <ChipBlock title="Occasion" values={item.occasion} />
                  <ChipBlock title="Season" values={item.season} />
                  <ChipBlock title="Tags" values={item.tags} />
                  <ChipBlock
                    title="Styling Keywords"
                    values={item.stylingKeywords}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-row flex-wrap gap-2 2xl:w-[120px] 2xl:flex-col">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={isActionLoading}
                >
                  <Link href={`/admin/catalog/style-data/${item.id}/edit`}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>

                {isArchived ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={isActionLoading}
                    onClick={() => onRestore?.(item)}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    {isActionLoading ? "Restoring..." : "Restore"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={isActionLoading}
                    onClick={() => onArchive?.(item)}
                  >
                    <Archive className="mr-2 h-3.5 w-3.5" />
                    {isActionLoading ? "Archiving..." : "Archive"}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isActionLoading}
                  onClick={() => onDelete?.(item)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {isActionLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>

            {item.aiStylingNotes ? (
              <div className="mt-5 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                  AI Styling Notes
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  {item.aiStylingNotes}
                </p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function ProductImage({ item }: { item: StyleData }) {
  if (!item.productImage) {
    return (
      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
        IMG
      </div>
    );
  }

  return (
    <img
      src={item.productImage}
      alt={item.productName || "Product"}
      className="h-24 w-24 shrink-0 rounded-2xl object-cover"
    />
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="min-h-[82px] rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-950">
        {value || "—"}
      </p>
    </div>
  );
}

function ChipBlock({
  title,
  values,
}: {
  title: string;
  values?: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
        {title}
      </p>

      {values?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.slice(0, 5).map((value) => (
            <Badge key={value} variant="outline" className="bg-white">
              {value}
            </Badge>
          ))}

          {values.length > 5 ? (
            <Badge variant="outline" className="bg-white">
              +{values.length - 5}
            </Badge>
          ) : null}
        </div>
      ) : (
        <span className="text-sm text-neutral-400">—</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700"
        : status === "INACTIVE"
          ? "bg-neutral-100 text-neutral-700"
          : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
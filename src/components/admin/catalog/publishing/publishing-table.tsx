"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublishingRecord } from "./publishing-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
  CATEGORY: "Category",
} as const;

const channelLabels = {
  WEBSITE: "Website",
  MOBILE_APP: "Mobile App",
  BRIDAL_PARTY: "Bridal Party",
  RENTAL: "Rental",
  RESALE: "Resale",
  MARKETPLACE: "Marketplace",
} as const;

export function PublishingTable({
  records,
  isLoading,
}: {
  records: PublishingRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">
        Loading publishing records...
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No publishing records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend publishing data ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1250px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Target</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Channels</th>
            <th className="p-4 font-medium">Readiness</th>
            <th className="p-4 font-medium">Approval</th>
            <th className="p-4 font-medium">Schedule</th>
            <th className="p-4 font-medium">Flags</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">
                  {record.productName ||
                    record.variantSku ||
                    record.categoryName ||
                    "Publishing Target"}
                </p>
                <p className="text-xs text-neutral-500">
                  {record.productId ||
                    record.variantId ||
                    record.categoryId ||
                    record.id}
                </p>
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {scopeLabels[record.scope] ?? record.scope}
                </Badge>
              </td>

              <td className="p-4">{record.businessType}</td>

              <td className="p-4">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {record.channels.map((channel) => (
                    <Badge key={channel} variant="outline">
                      {channelLabels[channel] ?? channel}
                    </Badge>
                  ))}
                </div>
              </td>

              <td className="p-4">
                <div className="space-y-1">
                  <ReadinessBadge label="SEO" value={record.seoReady} />
                  <ReadinessBadge label="Media" value={record.mediaReady} />
                  <ReadinessBadge label="Inventory" value={record.inventoryReady} />
                  <ReadinessBadge label="Pricing" value={record.pricingReady} />
                </div>
              </td>

              <td className="p-4">
                <ApprovalBadge status={record.approvalStatus} />
                {record.reviewerName && (
                  <p className="mt-1 text-xs text-neutral-500">
                    By {record.reviewerName}
                  </p>
                )}
              </td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Scheduled: {record.scheduledPublishAt || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Published: {record.publishedAt || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Unpublished: {record.unpublishedAt || "—"}
                </p>
              </td>

              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {record.isVisible && <Badge variant="outline">Visible</Badge>}
                  {record.isFeatured && <Badge variant="outline">Featured</Badge>}
                  {!record.isVisible && !record.isFeatured && (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <StatusBadge status={record.status} />
              </td>

              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/catalog/publishing/${record.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Publish
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Review
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadinessBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const className =
    value === "READY"
      ? "bg-emerald-50 text-emerald-700"
      : value === "WARNING"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${className}`}
    >
      {label}: {value}
    </span>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const className =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PENDING"
        ? "bg-blue-50 text-blue-700"
        : status === "REJECTED"
          ? "bg-red-50 text-red-700"
          : "bg-neutral-100 text-neutral-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "SCHEDULED"
        ? "bg-blue-50 text-blue-700"
        : status === "IN_REVIEW"
          ? "bg-purple-50 text-purple-700"
          : status === "DRAFT"
            ? "bg-amber-50 text-amber-700"
            : status === "UNPUBLISHED"
              ? "bg-neutral-100 text-neutral-700"
              : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FitData } from "./fit-data-types";

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (normalized === "DRAFT") return "bg-amber-50 text-amber-700";
  if (normalized === "INACTIVE") return "bg-neutral-100 text-neutral-700";
  if (normalized === "ARCHIVED") return "bg-red-50 text-red-700";

  return "bg-neutral-100 text-neutral-700";
}

export function FitDataTable({
  fitDataItems,
  isLoading,
}: {
  fitDataItems: FitData[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Loading fit data...</div>
    );
  }

  if (!fitDataItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No fit data records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend fit data ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Product</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Fit</th>
            <th className="p-4 font-medium">Stretch</th>
            <th className="p-4 font-medium">Size Chart</th>
            <th className="p-4 font-medium">Body Types</th>
            <th className="p-4 font-medium">Rules</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {fitDataItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">
                  {item.productName || item.productSku || "Fit Data"}
                </p>
                <p className="text-xs text-neutral-500">
                  SKU: {item.productSku || "—"}
                </p>
                <p className="max-w-[240px] truncate text-xs text-neutral-400">
                  {item.productSlug || item.productId || item.id}
                </p>
              </td>

              <td className="p-4">
                <Badge variant="outline">{formatLabel(item.scope)}</Badge>
              </td>

              <td className="p-4">{item.businessType || "—"}</td>

              <td className="p-4">
                <p>{formatLabel(item.fitType)}</p>
                <p className="text-xs text-neutral-500">
                  {formatLabel(item.silhouette)}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatLabel(item.lengthType)}
                </p>
              </td>

              <td className="p-4">
                <p>{formatLabel(item.stretchLevel)}</p>
                <p className="text-xs text-neutral-500">
                  Support: {formatLabel(item.supportLevel)}
                </p>
              </td>

              <td className="p-4">
                {item.hasSizeChart ? (
                  <Badge variant="outline">
                    {item.sizeChartCount || 0} row
                    {(item.sizeChartCount || 0) === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <span className="text-neutral-400">Missing</span>
                )}
              </td>

              <td className="p-4">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {(item.recommendedForBodyTypes || []).length ? (
                    item.recommendedForBodyTypes?.map((type) => (
                      <Badge key={type} variant="outline">
                        {formatLabel(type)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {item.alterationAllowed ? (
                    <Badge variant="outline">Alteration</Badge>
                  ) : null}

                  {item.customSizingAvailable ? (
                    <Badge variant="outline">Custom Sizing</Badge>
                  ) : null}

                  {!item.alterationAllowed && !item.customSizingAvailable ? (
                    <span className="text-neutral-400">—</span>
                  ) : null}
                </div>
              </td>

              <td className="p-4">
                <StatusBadge status={item.status} />
              </td>

              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/catalog/fit-data/${item.id}/edit`}>
                      Edit
                    </Link>
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

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
        status,
      )}`}
    >
      {formatLabel(status)}
    </span>
  );
}
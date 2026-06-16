"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StyleData } from "./style-data-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
} as const;

const modestyLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

const seasonLabels = {
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
  WINTER: "Winter",
  ALL_SEASON: "All Season",
} as const;

export function StyleDataTable({
  styleDataItems,
  isLoading,
}: {
  styleDataItems: StyleData[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Loading style data...</div>
    );
  }

  if (!styleDataItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No style data records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend style data ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Target</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Occasion</th>
            <th className="p-4 font-medium">Style Details</th>
            <th className="p-4 font-medium">Season</th>
            <th className="p-4 font-medium">Tags</th>
            <th className="p-4 font-medium">Flags</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {styleDataItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">
                  {item.productName || item.variantSku || "Style Data"}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.variantId || item.productId || item.id}
                </p>
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {scopeLabels[item.scope] ?? item.scope}
                </Badge>
              </td>

              <td className="p-4">{item.businessType}</td>

              <td className="p-4">
                <p>{item.occasion || "—"}</p>
                <p className="text-xs text-neutral-500">
                  {item.styleCategory || "No category"}
                </p>
              </td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Color: {item.colorFamily || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Fabric: {item.fabricFeel || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Neckline: {item.neckline || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Sleeve: {item.sleeveType || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Silhouette: {item.silhouette || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Modesty: {modestyLabels[item.modestyLevel] ?? item.modestyLevel}
                </p>
              </td>

              <td className="p-4">
                {seasonLabels[item.season] ?? item.season}
              </td>

              <td className="p-4">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {item.styleTags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}

                  {item.trendTags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} className="bg-neutral-950 text-white">
                      {tag}
                    </Badge>
                  ))}

                  {!item.styleTags?.length && !item.trendTags?.length && (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {item.isFeatured && <Badge variant="outline">Featured</Badge>}
                  {item.isTrendItem && <Badge variant="outline">Trend</Badge>}
                  {!item.isFeatured && !item.isTrendItem && (
                    <span className="text-neutral-400">—</span>
                  )}
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
                    <Link href={`/admin/catalog/style-data/${item.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Feature
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    More
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
      {status}
    </span>
  );
}
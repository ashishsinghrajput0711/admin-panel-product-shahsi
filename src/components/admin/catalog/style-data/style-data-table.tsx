"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StyleData } from "./style-data-types";

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
          Create style data record ya filters clear karke dobara check karo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1250px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Product</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Occasion</th>
            <th className="p-4 font-medium">Style Attributes</th>
            <th className="p-4 font-medium">Season</th>
            <th className="p-4 font-medium">Tags / Keywords</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {styleDataItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200 align-top">
              <td className="p-4">
                <div className="flex gap-3">
                  <ProductImage item={item} />

                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium text-neutral-950">
                      {item.productName || "Untitled product"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      SKU: {item.productSku || "—"}
                    </p>

                    <p className="mt-1 max-w-[260px] truncate text-xs text-neutral-400">
                      {item.productSlug || item.productId}
                    </p>

                    {item.variantId ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Variant: {item.variantTitle || item.variantSku || item.variantId}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>

              <td className="p-4">
                <Badge variant="outline">{formatLabel(item.scope)}</Badge>
              </td>

              <td className="p-4">{formatLabel(item.businessType)}</td>

              <td className="p-4">
                <ChipList values={item.occasion} emptyText="No occasion" />
              </td>

              <td className="p-4">
                <div className="space-y-1 text-xs text-neutral-600">
                  <p>
                    <span className="font-medium text-neutral-800">Color:</span>{" "}
                    {item.colorFamily || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Fabric:</span>{" "}
                    {item.fabricFeel || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Neckline:</span>{" "}
                    {item.neckline || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Sleeve:</span>{" "}
                    {item.sleeveType || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">
                      Silhouette:
                    </span>{" "}
                    {item.silhouette || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Modesty:</span>{" "}
                    {item.modestyLevel || "—"}
                  </p>
                </div>
              </td>

              <td className="p-4">
                <ChipList values={item.season} emptyText="No season" />
              </td>

              <td className="p-4">
                <div className="max-w-[260px] space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-500">
                      Tags
                    </p>
                    <ChipList values={item.tags} emptyText="—" />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-neutral-500">
                      Keywords
                    </p>
                    <ChipList values={item.stylingKeywords} emptyText="—" />
                  </div>
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

function ProductImage({ item }: { item: StyleData }) {
  if (!item.productImage) {
    return (
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
        IMG
      </div>
    );
  }

  return (
    <img
      src={item.productImage}
      alt={item.productName || "Product"}
      className="h-14 w-14 shrink-0 rounded-xl object-cover"
    />
  );
}

function ChipList({
  values,
  emptyText,
}: {
  values?: string[];
  emptyText: string;
}) {
  if (!values?.length) {
    return <span className="text-neutral-400">{emptyText}</span>;
  }

  return (
    <div className="flex max-w-[240px] flex-wrap gap-1">
      {values.slice(0, 4).map((value) => (
        <Badge key={value} variant="outline" className="bg-white">
          {value}
        </Badge>
      ))}

      {values.length > 4 ? (
        <Badge variant="outline" className="bg-white">
          +{values.length - 4}
        </Badge>
      ) : null}
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
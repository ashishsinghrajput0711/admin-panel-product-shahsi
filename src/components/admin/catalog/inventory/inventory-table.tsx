"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "./inventory-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
} as const;

export function InventoryTable({
  inventoryItems,
  isLoading,
}: {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Loading inventory...</div>
    );
  }

  if (!inventoryItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No inventory records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend inventory ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1150px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Item</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Warehouse</th>
            <th className="p-4 font-medium">Stock</th>
            <th className="p-4 font-medium">Rental / Hold</th>
            <th className="p-4 font-medium">Threshold</th>
            <th className="p-4 font-medium">Restock</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {inventoryItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">
                  {item.productName || item.variantSku || "Inventory Item"}
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
                <p>{item.warehouseName}</p>
                <p className="text-xs text-neutral-500">
                  {item.locationCode || "No location code"}
                </p>
              </td>

              <td className="p-4">
                <p className="font-medium">{item.availableStock} available</p>
                <p className="text-xs text-neutral-500">
                  {item.reservedStock} reserved / {item.totalStock} total
                </p>
              </td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Rental: {item.rentalAvailableStock ?? 0}
                </p>
                <p className="text-xs text-neutral-500">
                  Hold: {item.holdStock ?? 0}
                </p>
                <p className="text-xs text-neutral-500">
                  Damaged: {item.damagedStock ?? 0}
                </p>
              </td>

              <td className="p-4">{item.lowStockThreshold}</td>

              <td className="p-4">
                {item.restockDate || (
                  <span className="text-neutral-400">No date</span>
                )}
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
                    <Link href={`/admin/catalog/inventory/${item.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Adjust
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
    status === "IN_STOCK"
      ? "bg-emerald-50 text-emerald-700"
      : status === "LOW_STOCK"
        ? "bg-amber-50 text-amber-700"
        : status === "OUT_OF_STOCK"
          ? "bg-red-50 text-red-700"
          : status === "ON_HOLD"
            ? "bg-blue-50 text-blue-700"
            : status === "DAMAGED"
              ? "bg-orange-50 text-orange-700"
              : "bg-neutral-100 text-neutral-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
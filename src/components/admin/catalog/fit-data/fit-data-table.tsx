"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FitData } from "./fit-data-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
} as const;

const fitTypeLabels = {
  RELAXED: "Relaxed",
  REGULAR: "Regular",
  FITTED: "Fitted",
  BODYCON: "Bodycon",
  OVERSIZED: "Oversized",
} as const;

const stretchLabels = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

const silhouetteLabels = {
  A_LINE: "A-Line",
  MERMAID: "Mermaid",
  SHEATH: "Sheath",
  BALL_GOWN: "Ball Gown",
  EMPIRE: "Empire",
  STRAIGHT: "Straight",
  FIT_AND_FLARE: "Fit and Flare",
} as const;

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
      <table className="w-full min-w-[1250px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Target</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Size</th>
            <th className="p-4 font-medium">Measurements</th>
            <th className="p-4 font-medium">Body Range</th>
            <th className="p-4 font-medium">Fit</th>
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
                  {item.productName || item.variantSku || "Fit Data"}
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

              <td className="p-4">{item.sizeLabel || "—"}</td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Bust: {item.bustMeasurement ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Waist: {item.waistMeasurement ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Hip: {item.hipMeasurement ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Length: {item.garmentLength ?? "—"}
                </p>
              </td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Bust: {item.minBust ?? "—"} - {item.maxBust ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Waist: {item.minWaist ?? "—"} - {item.maxWaist ?? "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Hip: {item.minHip ?? "—"} - {item.maxHip ?? "—"}
                </p>
              </td>

              <td className="p-4">
                <p>{fitTypeLabels[item.fitType] ?? item.fitType}</p>
                <p className="text-xs text-neutral-500">
                  Stretch: {stretchLabels[item.stretchLevel] ?? item.stretchLevel}
                </p>
                <p className="text-xs text-neutral-500">
                  {silhouetteLabels[item.silhouette] ?? item.silhouette}
                </p>
              </td>

              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {item.customLengthAllowed && (
                    <Badge variant="outline">Custom Length</Badge>
                  )}
                  {item.alterationAllowed && (
                    <Badge variant="outline">Alteration</Badge>
                  )}
                  {!item.customLengthAllowed && !item.alterationAllowed && (
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
                    <Link href={`/admin/catalog/fit-data/${item.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Test Fit
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
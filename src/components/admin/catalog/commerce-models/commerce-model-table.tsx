"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommerceModel } from "./commerce-model-types";

const typeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "Made-to-Order",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
  CATEGORY: "Category",
} as const;

export function CommerceModelTable({
  models,
  isLoading,
}: {
  models: CommerceModel[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">
        Loading commerce models...
      </div>
    );
  }

  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No commerce models found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend commerce models ready hone ke baad yahan show honge.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Model</th>
            <th className="p-4 font-medium">Type</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Target</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Availability</th>
            <th className="p-4 font-medium">Rules</th>
            <th className="p-4 font-medium">Enabled</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {models.map((model) => (
            <tr key={model.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">{model.name}</p>
                <code className="mt-1 inline-block rounded-md bg-neutral-100 px-2 py-1 text-xs">
                  {model.code}
                </code>
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {typeLabels[model.type] ?? model.type}
                </Badge>
              </td>

              <td className="p-4">
                {scopeLabels[model.scope] ?? model.scope}
              </td>

              <td className="p-4">
                <p>
                  {model.productName ||
                    model.variantSku ||
                    model.categoryName ||
                    "No target"}
                </p>
                <p className="text-xs text-neutral-500">
                  {model.productId || model.variantId || model.categoryId || model.id}
                </p>
              </td>

              <td className="p-4">{model.businessType}</td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  Return: {model.returnWindowDays ?? 0} days
                </p>
                <p className="text-xs text-neutral-500">
                  Min Qty: {model.minOrderQuantity ?? 1}
                </p>
                <p className="text-xs text-neutral-500">
                  Max Qty: {model.maxOrderQuantity ?? "No limit"}
                </p>
              </td>

              <td className="p-4">
                <RuleSummary model={model} />
              </td>

              <td className="p-4">
                {model.isEnabled ? (
                  <Badge className="bg-neutral-950 text-white">Enabled</Badge>
                ) : (
                  <Badge variant="outline">Disabled</Badge>
                )}
              </td>

              <td className="p-4">
                <StatusBadge status={model.status} />
              </td>

              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/catalog/commerce-models/${model.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Enable
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

function RuleSummary({ model }: { model: CommerceModel }) {
  if (model.type === "MADE_TO_ORDER") {
    return (
      <div className="text-xs text-neutral-500">
        <p>Lead: {model.productionLeadTimeDays ?? 0} days</p>
        <p>Rush: {model.rushAllowed ? `Yes / ${model.rushFee ?? 0}` : "No"}</p>
      </div>
    );
  }

  if (model.type === "RENTAL") {
    return (
      <div className="text-xs text-neutral-500">
        <p>Duration: {model.rentalDurationDays ?? 0} days</p>
        <p>Deposit: {model.rentalDepositAmount ?? 0}</p>
        <p>Late Fee: {model.lateFeePerDay ?? 0}/day</p>
      </div>
    );
  }

  if (model.type === "RESALE") {
    return (
      <div className="text-xs text-neutral-500">
        <p>Commission: {model.resaleCommissionPercent ?? 0}%</p>
        <p>Seller Payout: {model.sellerPayoutPercent ?? 0}%</p>
      </div>
    );
  }

  return (
    <div className="text-xs text-neutral-500">
      <p>Retail enabled</p>
      <p>Return: {model.returnWindowDays ?? 0} days</p>
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
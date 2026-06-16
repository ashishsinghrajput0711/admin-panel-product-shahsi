"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PricingRule } from "./pricing-types";

const commerceTypeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "Made-to-Order",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
} as const;

const discountTypeLabels = {
  NONE: "No Discount",
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed Amount",
} as const;

export function PricingTable({
  pricingRules,
  isLoading,
}: {
  pricingRules: PricingRule[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Loading pricing rules...</div>
    );
  }

  if (!pricingRules.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No pricing rules found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend pricing rules ready hone ke baad yahan show honge.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1150px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Pricing Rule</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Commerce</th>
            <th className="p-4 font-medium">Currency</th>
            <th className="p-4 font-medium">Prices</th>
            <th className="p-4 font-medium">Discount</th>
            <th className="p-4 font-medium">Effective Dates</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {pricingRules.map((rule) => (
            <tr key={rule.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">{rule.name}</p>
                <code className="mt-1 inline-block rounded-md bg-neutral-100 px-2 py-1 text-xs">
                  {rule.code}
                </code>
                <p className="mt-1 text-xs text-neutral-500">
                  {rule.productName || rule.variantSku || "No product/variant"}
                </p>
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {scopeLabels[rule.scope] ?? rule.scope}
                </Badge>
              </td>

              <td className="p-4">
                {commerceTypeLabels[rule.commerceType] ?? rule.commerceType}
              </td>

              <td className="p-4">{rule.currency}</td>

              <td className="p-4">
                <p className="font-medium">
                  Base: {rule.currency} {rule.basePrice}
                </p>

                {rule.salePrice != null && (
                  <p className="text-xs text-neutral-500">
                    Sale: {rule.currency} {rule.salePrice}
                  </p>
                )}

                {rule.rentalPrice != null && (
                  <p className="text-xs text-neutral-500">
                    Rental: {rule.currency} {rule.rentalPrice}
                  </p>
                )}

                {rule.resalePrice != null && (
                  <p className="text-xs text-neutral-500">
                    Resale: {rule.currency} {rule.resalePrice}
                  </p>
                )}

                {rule.mtoPrice != null && (
                  <p className="text-xs text-neutral-500">
                    MTO: {rule.currency} {rule.mtoPrice}
                  </p>
                )}
              </td>

              <td className="p-4">
                <p>{discountTypeLabels[rule.discountType] ?? rule.discountType}</p>
                {rule.discountValue != null && rule.discountType !== "NONE" && (
                  <p className="text-xs text-neutral-500">
                    Value: {rule.discountValue}
                    {rule.discountType === "PERCENTAGE" ? "%" : ""}
                  </p>
                )}
              </td>

              <td className="p-4">
                <p className="text-xs text-neutral-500">
                  From: {rule.effectiveFrom || "Immediately"}
                </p>
                <p className="text-xs text-neutral-500">
                  To: {rule.effectiveTo || "No end date"}
                </p>
              </td>

              <td className="p-4">
                <StatusBadge status={rule.status} />
              </td>

              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/catalog/pricing/${rule.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Activate
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
      : status === "SCHEDULED"
        ? "bg-blue-50 text-blue-700"
        : status === "DRAFT"
          ? "bg-amber-50 text-amber-700"
          : status === "EXPIRED"
            ? "bg-neutral-100 text-neutral-700"
            : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}
"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import type { DynamicPricingRule } from "./pricing-types";
import { formatPricingLabel } from "./pricing-types";

function formatDate(value?: string | null) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRuleTargetId(rule: DynamicPricingRule) {
  return (
    rule.productId ||
    rule.productVariantId ||
    rule.categoryId ||
    rule.locationId ||
    rule.warehouseId ||
    ""
  );
}

function formatAdjustment(rule: DynamicPricingRule) {
  const value = Number(rule.adjustmentValue || 0);

  if (rule.adjustmentType === "PERCENTAGE") return `${value}%`;
  if (rule.adjustmentType === "MULTIPLIER") return `${value}x`;

  return value.toLocaleString("en-IN");
}

export function PricingTable({
  rules,
  isLoading,
  onDelete,
}: {
  rules: DynamicPricingRule[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
        Loading pricing rules...
      </div>
    );
  }

  if (!rules.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-neutral-950">
          No pricing rules found
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Create your first dynamic pricing rule.
        </p>
      </div>
    );
  }

  return (
  <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
<div className="w-full overflow-x-auto">
<table className="w-full min-w-[1050px] table-fixed border-collapse text-sm">
          <thead className="bg-[#f7f2ea] text-left text-xs uppercase tracking-[0.16em] text-neutral-500">
 <tr>
  <th className="w-[24%] px-5 py-4">Rule</th>
  <th className="w-[11%] px-5 py-4">Commerce</th>
  <th className="w-[9%] px-5 py-4">Scope</th>
  <th className="w-[13%] px-5 py-4">Adjustment</th>
  <th className="w-[8%] px-5 py-4">Priority</th>
  <th className="w-[16%] px-5 py-4">Schedule</th>
  <th className="w-[9%] px-5 py-4">Status</th>
  <th className="w-[10%] px-5 py-4 text-right">Action</th>
</tr>
          </thead>

          <tbody className="divide-y divide-neutral-200">
            {rules.map((rule) => (
              <tr key={rule.id} className="align-top hover:bg-[#fbfaf6]">
          <td className="px-5 py-4">
  <p className="line-clamp-2 font-semibold leading-6 text-neutral-950">
    {rule.name}
  </p>
                  {getRuleTargetId(rule) ? (
  <p className="mt-1 max-w-[260px] truncate text-xs text-neutral-500">
    ID: {getRuleTargetId(rule)}
  </p>
) : null}
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    {formatPricingLabel(rule.commerceType)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700">
                    {formatPricingLabel(rule.scope)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-neutral-950">
                    {formatPricingLabel(rule.adjustmentType)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatAdjustment(rule)}
                  </p>
                </td>

                <td className="px-5 py-4 text-neutral-700">
                  {rule.priority ?? 0}
                </td>

                <td className="px-5 py-4 text-xs text-neutral-600">
                  <p>Start: {formatDate(rule.startsAt)}</p>
                  <p className="mt-1">End: {formatDate(rule.endsAt)}</p>
                </td>

               <td className="px-5 py-4">
  <span
    className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${
      rule.isActive === false
        ? "bg-neutral-100 text-neutral-600"
        : "bg-emerald-50 text-emerald-700"
    }`}
  >
    {rule.isActive === false ? "Inactive" : "Active"}
  </span>
</td>
<td className="px-5 py-4">
  <div className="flex justify-end gap-2">
    <Link
      href={`/admin/catalog/pricing/${rule.id}`}
      title="Edit pricing rule"
      aria-label="Edit pricing rule"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
    >
      <Pencil className="h-4 w-4" />
    </Link>

    <button
      type="button"
      onClick={() => onDelete(rule.id)}
      title="Delete pricing rule"
      aria-label="Delete pricing rule"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
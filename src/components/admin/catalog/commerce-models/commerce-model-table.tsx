"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommerceModel } from "./commerce-model-types";

function getConfigLabels(config?: Record<string, unknown> | null) {
  if (!config) return [];

  const labels: string[] = [];

  if (config.allowCOD) labels.push("COD");
  if (config.allowReturns) labels.push("Returns");
  if (config.requiresDeposit) labels.push("Deposit");
  if (config.allowDailyRental) labels.push("Daily Rental");
  if (config.allowSubscriptionRental) labels.push("Subscription Rental");
  if (config.allowOffers) labels.push("Offers");
  if (config.requiresVerification) labels.push("Verification");
  if (config.allowCustomSizing) labels.push("Custom Sizing");
  if (config.allowRushProduction) labels.push("Rush Production");
  if (config.measurementRequired) labels.push("Measurements");
  if (config.designerApprovalRequired) labels.push("Designer Approval");
  if (config.allowPlanSwap) labels.push("Plan Swap");
  if (config.freeCleaningIncluded) labels.push("Free Cleaning");
  if (config.priorityDelivery) labels.push("Priority Delivery");

  return labels;
}

export function CommerceModelTable({
  models,
  isLoading,
  onToggleStatus,
  togglingId,
}: {
  models: CommerceModel[];
  isLoading: boolean;
  onToggleStatus?: (model: CommerceModel) => void;
  togglingId?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">
        Loading commerce types...
      </div>
    );
  }

  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No commerce types found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend me commerce types create karne ke baad yahan show honge.
        </p>
      </div>
    );
  }

  return (
   <div className="w-full overflow-hidden rounded-2xl border border-neutral-200">
  <table className="w-full table-fixed text-sm">
       <thead className="bg-[#f7f2ea] text-left">
  <tr>
    <th className="w-[17%] p-4 font-medium">Name</th>
    <th className="w-[10%] p-4 font-medium">Code</th>
    <th className="w-[22%] p-4 font-medium">Description</th>
    <th className="w-[8%] p-4 font-medium">Sort</th>
  <th className="w-[22%] p-4 font-medium">Config</th>
    <th className="w-[8%] p-4 font-medium">Active</th>
  <th className="w-[13%] p-4 text-right font-medium">Actions</th>
  </tr>
</thead>

        <tbody>
          {models.map((model) => (
            <tr
              key={model.id || model.code}
              className="border-t border-neutral-200"
            >
              <td className="p-4">
                <p className="font-medium text-neutral-950">{model.name}</p>

                {model.id ? (
             <p className="mt-1 break-all text-xs leading-relaxed text-neutral-500">
  {model.id}
</p>
                ) : null}
              </td>

              <td className="p-4">
                <Badge variant="outline">{model.code}</Badge>
              </td>

            <td className="p-4 text-neutral-600">
  <p className="line-clamp-4 leading-relaxed">
    {model.description || "No description"}
  </p>
</td>

              <td className="p-4">{model.sortOrder ?? 0}</td>

            <td className="p-4">
  <div className="flex flex-wrap gap-2">
    {getConfigLabels(model.config).length ? (
      getConfigLabels(model.config).map((label) => (
        <Badge
          key={label}
          variant="outline"
          className="rounded-full bg-white"
        >
          {label}
        </Badge>
      ))
    ) : (
      <span className="text-sm text-neutral-400">No config</span>
    )}
  </div>
</td>

              <td className="p-4">
                {model.isActive ? (
                  <Badge className="bg-neutral-950 text-white">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </td>

              <td className="p-4 text-right">
            <div className="flex flex-wrap justify-end gap-2">
                  {model.id ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <Link href={`/admin/catalog/commerce-models/${model.id}`}>
                        Edit
                      </Link>
                    </Button>
                  ) : null}

                  {model.id && onToggleStatus ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={togglingId === model.id}
                      onClick={() => onToggleStatus(model)}
                    >
                      {togglingId === model.id
                        ? "Updating..."
                        : model.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
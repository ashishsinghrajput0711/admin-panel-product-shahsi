"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useOne, useUpdate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { PricingForm } from "@/components/admin/catalog/pricing/pricing-form";
import type { PricingFormValues } from "@/components/admin/catalog/pricing/pricing-schema";

export default function EditPricingPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const oneResult = useOne<PricingFormValues>({
    resource: "pricing",
    id,
    queryOptions: {
      enabled: Boolean(id),
    },
  });

  const data = oneResult.result;
  const isLoading = oneResult.query?.isLoading ?? false;

  const updateMutation = useUpdate();
  const { mutate } = updateMutation;

  const isSubmitting =
    "isLoading" in updateMutation
      ? Boolean(updateMutation.isLoading)
      : "isPending" in updateMutation
        ? Boolean(updateMutation.isPending)
        : false;

  function handleSubmit(values: PricingFormValues) {
    mutate({
      resource: "pricing",
      id,
      values,
      successNotification: {
        message: "Pricing rule updated successfully",
        description: "The pricing rule changes have been saved.",
        type: "success",
      },
      errorNotification: {
        message: "Pricing rule update failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading pricing rule...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/pricing"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Pricing
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Edit Pricing Rule
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update product or variant pricing, discount and effective dates.
        </p>
      </div>

      <PricingForm
        defaultValues={data}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { PricingForm } from "@/components/admin/catalog/pricing/pricing-form";
import type { PricingFormValues } from "@/components/admin/catalog/pricing/pricing-schema";

export default function NewPricingPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: PricingFormValues) {
    mutate({
      resource: "pricing",
      values,
      successNotification: {
        message: "Pricing rule created successfully",
        description: "The pricing rule has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Pricing rule create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
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
          Create Pricing Rule
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add a pricing rule for product or variant commerce models, discounts
          and scheduled effective dates.
        </p>
      </div>

      <PricingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
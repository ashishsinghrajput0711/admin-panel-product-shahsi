"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { CommerceModelForm } from "@/components/admin/catalog/commerce-models/commerce-model-form";
import type { CommerceModelFormValues } from "@/components/admin/catalog/commerce-models/commerce-model-schema";

export default function NewCommerceModelPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: CommerceModelFormValues) {
    mutate({
      resource: "commerce-models",
      values,
      successNotification: {
        message: "Commerce model created successfully",
        description: "The commerce model has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Commerce model create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/commerce-models"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to commerce models
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Commerce Models
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Commerce Model
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add retail, made-to-order, rental or resale rules for products,
          variants or categories.
        </p>
      </div>

      <CommerceModelForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
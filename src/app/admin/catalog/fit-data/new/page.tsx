"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { FitDataForm } from "@/components/admin/catalog/fit-data/fit-data-form";
import type { FitDataFormValues } from "@/components/admin/catalog/fit-data/fit-data-schema";

export default function NewFitDataPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: FitDataFormValues) {
    mutate({
      resource: "fit-data",
      values,
      successNotification: {
        message: "Fit data created successfully",
        description: "The fit data record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Fit data create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/fit-data"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fit data
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Fit Data
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Fit Data
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add garment measurements, fit classification, recommended body ranges
          and alteration rules.
        </p>
      </div>

      <FitDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
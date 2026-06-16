"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { StyleDataForm } from "@/components/admin/catalog/style-data/style-data-form";
import type { StyleDataFormValues } from "@/components/admin/catalog/style-data/style-data-schema";

export default function NewStyleDataPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: StyleDataFormValues) {
    mutate({
      resource: "style-data",
      values,
      successNotification: {
        message: "Style data created successfully",
        description: "The style data record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Style data create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/style-data"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to style data
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Style Data
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Style Data
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add styling metadata, tags, trend flags and AI styling notes for a
          product or variant.
        </p>
      </div>

      <StyleDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
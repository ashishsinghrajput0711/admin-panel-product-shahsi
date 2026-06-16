"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { SearchDataForm } from "@/components/admin/catalog/search-data/search-data-form";
import type { SearchDataFormValues } from "@/components/admin/catalog/search-data/search-data-schema";

export default function NewSearchDataPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: SearchDataFormValues) {
    mutate({
      resource: "search",
      values,
      successNotification: {
        message: "Search data created successfully",
        description: "The search data record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Search data create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/search"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search data
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Search Data
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Search Data
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add keywords, synonyms, boost terms and target mapping for catalog
          search discovery.
        </p>
      </div>

      <SearchDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
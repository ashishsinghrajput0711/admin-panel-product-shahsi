"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { PublishingForm } from "@/components/admin/catalog/publishing/publishing-form";
import type { PublishingFormValues } from "@/components/admin/catalog/publishing/publishing-schema";

export default function NewPublishingPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: PublishingFormValues) {
    mutate({
      resource: "publishing",
      values,
      successNotification: {
        message: "Publishing record created successfully",
        description: "The publishing record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Publishing create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/publishing"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to publishing
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Publishing
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Publishing
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add publishing workflow, approval status, channel visibility and
          readiness checks for catalog items.
        </p>
      </div>

      <PublishingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
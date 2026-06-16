"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useOne, useUpdate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { PublishingForm } from "@/components/admin/catalog/publishing/publishing-form";
import type { PublishingFormValues } from "@/components/admin/catalog/publishing/publishing-schema";

export default function EditPublishingPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const oneResult = useOne<PublishingFormValues>({
    resource: "publishing",
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

  function handleSubmit(values: PublishingFormValues) {
    mutate({
      resource: "publishing",
      id,
      values,
      successNotification: {
        message: "Publishing record updated successfully",
        description: "The publishing changes have been saved.",
        type: "success",
      },
      errorNotification: {
        message: "Publishing update failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading publishing record...
        </div>
      </main>
    );
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
          Edit Publishing
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update publishing status, approval, readiness checks, schedule and
          storefront visibility.
        </p>
      </div>

      <PublishingForm
        defaultValues={data}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
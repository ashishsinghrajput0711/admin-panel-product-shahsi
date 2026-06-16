"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { MediaForm } from "@/components/admin/catalog/media/media-form";
import type { MediaFormValues } from "@/components/admin/catalog/media/media-schema";

export default function NewMediaPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: MediaFormValues) {
    mutate({
      resource: "media",
      values,
      successNotification: {
        message: "Media created successfully",
        description: "The media record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Media create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/media"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to media
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Media
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Media
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add media for product or variant catalog assets with alt text,
          ordering and primary media settings.
        </p>
      </div>

      <MediaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
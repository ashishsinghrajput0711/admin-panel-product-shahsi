"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { AttributeForm } from "@/components/admin/catalog/attributes/attribute-form";
import type { AttributeFormValues } from "@/components/admin/catalog/attributes/attribute-schema";

export default function NewAttributePage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: AttributeFormValues) {
    mutate({
      resource: "attributes",
      values,
      successNotification: {
        message: "Attribute created successfully",
        description: "The attribute has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Attribute create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/attributes"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attributes
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Attributes
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Attribute
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add an attribute for product or variant data, filters, search and
          variant-defining options.
        </p>
      </div>

      <AttributeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
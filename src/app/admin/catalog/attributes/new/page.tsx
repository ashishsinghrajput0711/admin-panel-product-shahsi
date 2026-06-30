"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useState } from "react";

import { AttributeForm } from "@/components/admin/catalog/attributes/attribute-form";
import type { AttributeFormValues } from "@/components/admin/catalog/attributes/attribute-schema";
import { createCatalogAttribute } from "@/lib/admin/catalog-attributes-api";

export default function NewAttributePage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(values: AttributeFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await createCatalogAttribute(values);

      router.push("/admin/catalog/attributes");
      router.refresh();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Attribute create failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
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

      {apiError ? (
        <section className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Attribute create failed</p>
              <p className="mt-2 rounded-xl bg-white/70 p-3 text-xs">
                {apiError}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <AttributeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
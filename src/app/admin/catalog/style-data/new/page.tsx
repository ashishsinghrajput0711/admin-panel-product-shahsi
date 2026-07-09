"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { StyleDataForm } from "@/components/admin/catalog/style-data/style-data-form";
import type { StyleDataFormValues } from "@/components/admin/catalog/style-data/style-data-schema";
import { createCatalogStyleData } from "@/lib/admin/catalog-style-data-api";

export default function NewStyleDataPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(values: StyleDataFormValues) {
    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      await createCatalogStyleData(values);

      setSuccessMessage("Style data created successfully.");

      router.push("/admin/catalog/style-data");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Style data create failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          Add fashion styling metadata for a product or product variant.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <StyleDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
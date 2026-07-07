"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { FitDataForm } from "@/components/admin/catalog/fit-data/fit-data-form";
import {
  createCatalogFitData,
  type ProductFitDataPayload,
} from "@/lib/admin/catalog-fit-data-api";

export default function NewFitDataPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(values: ProductFitDataPayload) {
    try {
      setIsSubmitting(true);
      setMessage(null);
      setErrorMessage(null);

      await createCatalogFitData(values);

      setMessage("Fit data create ho gaya.");
      router.push("/admin/catalog/fit-data");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Fit data create failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          Add product fit classification, model info, size chart and body type
          recommendations.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <FitDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
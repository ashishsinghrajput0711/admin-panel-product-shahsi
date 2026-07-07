"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  CommerceModelForm,
  parseCommerceModelConfig,
} from "@/components/admin/catalog/commerce-models/commerce-model-form";
import type { CommerceModelFormValues } from "@/components/admin/catalog/commerce-models/commerce-model-schema";
import { saveCommerceType } from "@/lib/admin/commerce-types-api";

export default function NewCommerceModelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(values: CommerceModelFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await saveCommerceType({
        name: values.name,
        code: values.code,
        description: values.description || "",
        isActive: Boolean(values.isActive),
        sortOrder: Number(values.sortOrder || 0),
        config: parseCommerceModelConfig(values),
      });

      router.push("/admin/catalog/commerce-models");
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Commerce type save failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/commerce-models"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to commerce models
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Commerce Models
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Commerce Type
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add SHOP, RENTAL, RESALE, MTO or SUBSCRIPTION commerce type master.
        </p>
      </div>

      {apiError ? (
        <section className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Commerce Type API error</p>
          <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs">{apiError}</p>
        </section>
      ) : null}

      <CommerceModelForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
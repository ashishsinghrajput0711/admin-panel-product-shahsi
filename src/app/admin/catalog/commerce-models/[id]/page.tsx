"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommerceModelForm,
  parseCommerceModelConfig,
} from "@/components/admin/catalog/commerce-models/commerce-model-form";
import type { CommerceModelFormValues } from "@/components/admin/catalog/commerce-models/commerce-model-schema";
import {
  getCommerceTypeById,
  updateCommerceType,
} from "@/lib/admin/commerce-types-api";

export default function EditCommerceModelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");

  const [commerceModel, setCommerceModel] =
    useState<
      | (Partial<CommerceModelFormValues> & {
          config?: Record<string, unknown> | null;
        })
      | undefined
    >();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommerceModel() {
      try {
        setIsLoading(true);
        setApiError(null);

        const item = await getCommerceTypeById(id);

        if (!cancelled) {
          setCommerceModel({
            name: item.name || "",
            code: item.code,
            description: item.description || "",
            isActive: Boolean(item.isActive),
            sortOrder: Number(item.sortOrder || 0),
            config: item.config || {},
          });
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Commerce type fetch failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (id) {
      loadCommerceModel();
    } else {
      setApiError("Commerce type ID missing hai.");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(values: CommerceModelFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);

    await updateCommerceType(id, {
  name: values.name,
  description: values.description || "",
  isActive: Boolean(values.isActive),
  sortOrder: Number(values.sortOrder || 0),
  config: parseCommerceModelConfig(values),
});

      router.push("/admin/catalog/commerce-models");
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Commerce type update failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading commerce type...
        </div>
      </main>
    );
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
          Edit Commerce Type
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update commerce type master details, active status, sort order and
          dynamic config.
        </p>
      </div>

      {apiError ? (
        <section className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Commerce Type API error</p>
          <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs">
            {apiError}
          </p>
        </section>
      ) : null}

     <CommerceModelForm
  defaultValues={commerceModel}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  isEditMode
/>
    </main>
  );
}
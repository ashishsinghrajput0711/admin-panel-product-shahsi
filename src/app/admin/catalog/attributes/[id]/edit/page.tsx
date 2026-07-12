"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { AttributeForm } from "@/components/admin/catalog/attributes/attribute-form";
import type { AttributeFormValues } from "@/components/admin/catalog/attributes/attribute-schema";
import {
  fetchCatalogAttributeById,
  updateCatalogAttribute,
} from "@/lib/admin/catalog-attributes-api";

export default function EditAttributePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = String(params?.id ?? "");

  const [attribute, setAttribute] = useState<AttributeFormValues | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAttribute() {
      try {
        setIsLoading(true);
        setApiError(null);

        const result = await fetchCatalogAttributeById(id);

        if (!cancelled) {
          setAttribute(result);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Attribute fetch failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (id) {
      loadAttribute();
    } else {
      setApiError("Attribute ID missing hai.");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(values: AttributeFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await updateCatalogAttribute(id, values);

      router.push("/admin/catalog/attributes");
      router.refresh();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Attribute update failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading attribute...
        </div>
      </main>
    );
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
          Edit Attribute
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update attribute type, scope, group, rules, options and status.
        </p>
      </div>

      {apiError ? (
        <section className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Attribute API error</p>
              <p className="mt-2 rounded-xl bg-white/70 p-3 text-xs">
                {apiError}
              </p>
            </div>
          </div>
        </section>
      ) : null}

    <AttributeForm
  attributeId={id}
  defaultValues={attribute}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>
    </main>
  );
}
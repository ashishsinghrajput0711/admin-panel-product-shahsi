"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { StyleDataForm } from "@/components/admin/catalog/style-data/style-data-form";
import type { StyleDataFormValues } from "@/components/admin/catalog/style-data/style-data-schema";
import type { StyleData } from "@/components/admin/catalog/style-data/style-data-types";
import {
  getCatalogStyleDataById,
  updateCatalogStyleData,
} from "@/lib/admin/catalog-style-data-api";

export default function EditStyleDataPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = String(params?.id ?? "");

  const [styleData, setStyleData] = useState<StyleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadStyleData() {
      if (!id) return;

      try {
        setIsLoading(true);
        setError("");

        const result = await getCatalogStyleDataById(id);

        if (!ignore) {
          setStyleData(result);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Style data detail load failed.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadStyleData();

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleSubmit(values: StyleDataFormValues) {
    if (!id) return;

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      await updateCatalogStyleData(id, values);

      setSuccessMessage("Style data updated successfully.");

      router.push("/admin/catalog/style-data");
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Style data update failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading style data...
        </div>
      </main>
    );
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
          Edit Style Data
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update fashion styling metadata for selected product or variant.
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

      {styleData ? (
        <StyleDataForm
          defaultValues={styleData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Style data record nahi mila.
        </div>
      )}
    </main>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { CollectionForm } from "@/components/admin/catalog/collections/collection-form";
import {
  createCatalogCollection,
  type CatalogCollectionFormValues,
} from "@/lib/admin/catalog-collections-api";

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

export default function NewCatalogCollectionPage() {
  const router = useRouter();
  const apiRootUrl = useMemo(() => getApiRootUrl(), []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(values: CatalogCollectionFormValues) {
    try {
      setIsSubmitting(true);
      setPageError(null);
      setSuccessMessage(null);

      await createCatalogCollection({
        apiRootUrl,
        token: getToken(),
        values,
      });

      setSuccessMessage("Collection created successfully.");

      window.setTimeout(() => {
        router.push("/admin/catalog/collections");
      }, 600);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Collection create failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/catalog/collections"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to collections
            </Link>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
              Add collection
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Manual ya automated catalog collection create karo.
            </p>
          </div>

          <button
            type="submit"
            form="catalog-collection-form"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Creating..." : "Create collection"}
          </button>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Collection error</p>
            <p className="mt-1">{pageError}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <CollectionForm
          isSubmitting={isSubmitting}
          submitLabel="Create collection"
          onSubmit={handleSubmit}
        />

        <div className="sticky bottom-4 z-20 mt-6 flex justify-end">
          <div className="rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-neutral-200 backdrop-blur">
            <button
              type="submit"
              form="catalog-collection-form"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Creating..." : "Create collection"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
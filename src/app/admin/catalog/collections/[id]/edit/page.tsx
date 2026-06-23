"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Save,
} from "lucide-react";

import { CollectionForm } from "@/components/admin/catalog/collections/collection-form";
import {
  getCatalogCollectionById,
  mapCollectionToFormValues,
  updateCatalogCollection,
  type CatalogCollection,
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

function isCatalogCollection(value: unknown): value is CatalogCollection {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    ("slug" in value || "title" in value || "name" in value)
  );
}

function getCollectionFromUnknown(value: unknown): CatalogCollection | null {
  if (isCatalogCollection(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as {
    data?: unknown;
    collection?: unknown;
  };

  if (isCatalogCollection(record.data)) {
    return record.data;
  }

  if (isCatalogCollection(record.collection)) {
    return record.collection;
  }

  if (
    record.data &&
    typeof record.data === "object" &&
    "data" in record.data
  ) {
    const nested = record.data as { data?: unknown };

    if (isCatalogCollection(nested.data)) {
      return nested.data;
    }
  }

  if (
    record.data &&
    typeof record.data === "object" &&
    "collection" in record.data
  ) {
    const nested = record.data as { collection?: unknown };

    if (isCatalogCollection(nested.collection)) {
      return nested.collection;
    }
  }

  return null;
}

function getCollectionTitle(collection: CatalogCollection | null) {
  return collection?.name || collection?.title || "Edit collection";
}

function getCollectionSlug(collection: CatalogCollection | null) {
  return collection?.slug || "";
}

function getCollectionStatus(collection: CatalogCollection | null) {
  const rawStatus =
    collection?.status ||
    (collection as CatalogCollection & { isActive?: boolean })?.isActive;

  if (typeof rawStatus === "boolean") {
    return rawStatus ? "ACTIVE" : "DRAFT";
  }

  return String(rawStatus || "DRAFT").toUpperCase();
}

function getCollectionType(collection: CatalogCollection | null) {
  const rawType =
    collection?.type ||
    (collection as CatalogCollection & { collectionType?: string })
      ?.collectionType;

  return String(rawType || "MANUAL").replace(/_/g, " ").toUpperCase();
}

function getStorefrontHref(collection: CatalogCollection | null) {
  const slug = getCollectionSlug(collection);

  if (!slug) return "";

  return `/collections/${slug}`;
}

export default function EditCatalogCollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const collectionId = String(params?.id || "");
  const apiRootUrl = useMemo(() => getApiRootUrl(), []);

  const [collection, setCollection] = useState<CatalogCollection | null>(null);
  const [defaultValues, setDefaultValues] =
    useState<CatalogCollectionFormValues | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const storefrontHref = useMemo(() => {
    return getStorefrontHref(collection);
  }, [collection]);

  const formKey = useMemo(() => {
    return `${collectionId}-${collection?.slug || ""}-${
      collection?.updatedAt || ""
    }`;
  }, [collectionId, collection]);

  const loadCollection = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        if (options?.silent) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setPageError(null);

        const response = await getCatalogCollectionById({
          apiRootUrl,
          token: getToken(),
          id: collectionId,
        });

        const nextCollection = getCollectionFromUnknown(response);

        if (!nextCollection) {
          throw new Error("Collection detail response me collection data missing hai.");
        }

        setCollection(nextCollection);
        setDefaultValues(mapCollectionToFormValues(nextCollection));
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Collection detail load failed.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [apiRootUrl, collectionId],
  );

  useEffect(() => {
    if (collectionId) {
      loadCollection();
    }
  }, [collectionId, loadCollection]);

  async function handleSubmit(values: CatalogCollectionFormValues) {
    try {
      setIsSubmitting(true);
      setPageError(null);
      setSuccessMessage(null);

      const response = await updateCatalogCollection({
        apiRootUrl,
        token: getToken(),
        id: collectionId,
        values,
      });

      const updatedCollection = getCollectionFromUnknown(response);

      if (updatedCollection) {
        setCollection(updatedCollection);
        setDefaultValues(mapCollectionToFormValues(updatedCollection));
      } else if (collection) {
        await loadCollection({ silent: true });
      } else {
        await loadCollection({ silent: true });
      }

      setSuccessMessage("Collection updated successfully.");

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);

      router.refresh();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Collection update failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1280px]">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading collection...
            </div>
          </div>
        </div>
      </main>
    );
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

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                Edit collection
              </h1>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600 ring-1 ring-neutral-200">
                {getCollectionStatus(collection)}
              </span>

              <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                {getCollectionType(collection)}
              </span>
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              {getCollectionTitle(collection)}
            </p>

            {getCollectionSlug(collection) ? (
              <p className="mt-1 text-xs text-neutral-400">
                /collections/{getCollectionSlug(collection)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadCollection({ silent: true })}
              disabled={isRefreshing || isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {storefrontHref ? (
              <Link
                href={storefrontHref}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
              >
                <ExternalLink className="h-4 w-4" />
                View storefront
              </Link>
            ) : null}

            <button
              type="submit"
              form="catalog-collection-form"
              disabled={isSubmitting || !defaultValues}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
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

        {defaultValues ? (
          <CollectionForm
            key={formKey}
            defaultValues={defaultValues}
            isSubmitting={isSubmitting}
            submitLabel="Update collection"
            collectionId={collectionId}
            apiRootUrl={apiRootUrl}
            token={getToken()}
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
            Collection default values nahi mil paayi.
          </div>
        )}
      </div>
    </main>
  );
}
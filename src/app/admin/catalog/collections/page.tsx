"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import {
  archiveCatalogCollection,
  deleteCatalogCollection,
  getCatalogCollections,
  type CatalogCollection,
  type CollectionCondition,
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

function getCollectionTitle(collection: CatalogCollection) {
  return collection.name || collection.title || "Untitled collection";
}

function getCollectionType(collection: CatalogCollection) {
  return String(
    collection.type || collection.collectionType || "MANUAL"
  ).toUpperCase();
}

function getCollectionStatus(collection: CatalogCollection) {
  if (collection.status) return String(collection.status).toUpperCase();

  if (collection.isActive === true) return "ACTIVE";
  if (collection.isActive === false) return "INACTIVE";

  return "DRAFT";
}

function getProductCount(collection: CatalogCollection) {
  return Number(collection.productCount ?? collection.productsCount ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function humanizeField(value: string) {
  const map: Record<string, string> = {
    title: "Title",
    tag: "Tag",
    category: "Category",
    primaryCategory: "Primary category",
    collection: "Collection",
    price: "Price",
    salePrice: "Sale price",
    status: "Status",
    brand: "Brand",
    vendor: "Vendor",
    productType: "Product type",
    commerceType: "Commerce type",
    inventoryStock: "Inventory stock",
    productionType: "Production type",
    createdAt: "Created date",
    updatedAt: "Updated date",
  };

  return map[value] || value.replace(/_/g, " ");
}

function humanizeOperator(value: string) {
  const map: Record<string, string> = {
    EQUALS: "is equal to",
    NOT_EQUALS: "is not equal to",
    CONTAINS: "contains",
    NOT_CONTAINS: "does not contain",
    STARTS_WITH: "starts with",
    ENDS_WITH: "ends with",
    GREATER_THAN: "is greater than",
    LESS_THAN: "is less than",
    GREATER_THAN_OR_EQUAL: "is greater than or equal to",
    LESS_THAN_OR_EQUAL: "is less than or equal to",
    IS_EMPTY: "is empty",
    IS_NOT_EMPTY: "is not empty",
  };

  return map[value] || value.replace(/_/g, " ").toLowerCase();
}

function formatCondition(condition: CollectionCondition) {
  const field = humanizeField(String(condition.field || ""));
  const operator = humanizeOperator(String(condition.operator || ""));
  const rawValue = condition.value;

  const value =
    rawValue === null || rawValue === undefined || rawValue === ""
      ? ""
      : String(rawValue);

  return [field, operator, value].filter(Boolean).join(" ");
}

function getConditionSummary(collection: CatalogCollection) {
  const conditions = Array.isArray(collection.conditions)
    ? collection.conditions
    : [];

  if (!conditions.length) return "—";

  return conditions.slice(0, 2).map(formatCondition).join(" • ");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const className =
    normalized === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : normalized === "ARCHIVED"
        ? "bg-neutral-100 text-neutral-500 ring-neutral-200"
        : normalized === "DRAFT"
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-neutral-50 text-neutral-600 ring-neutral-200";

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ring-1",
        className,
      ].join(" ")}
    >
      {normalized}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const normalized = type.toUpperCase();

  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 ring-1 ring-neutral-200">
      {normalized}
    </span>
  );
}

export default function AdminCatalogCollectionsPage() {
  const [items, setItems] = useState<CatalogCollection[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiRootUrl = useMemo(() => getApiRootUrl(), []);

  const loadCollections = useCallback(
    async (nextPage = page) => {
      try {
        setIsLoading(true);
        setPageError(null);

        const result = await getCatalogCollections({
          apiRootUrl,
          token: getToken(),
          page: nextPage,
          limit,
          search,
          status,
          type,
        });

        setItems(result.items);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Collections load failed."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiRootUrl, limit, page, search, status, type]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadCollections(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, status, type]);

  useEffect(() => {
    loadCollections(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleArchive(collection: CatalogCollection) {
    const title = getCollectionTitle(collection);

    const confirmed = window.confirm(
      `"${title}" collection archive karni hai?`
    );

    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      setPageError(null);
      setSuccessMessage(null);

      await archiveCatalogCollection({
        apiRootUrl,
        token: getToken(),
        id: collection.id,
      });

      setSuccessMessage("Collection archived successfully.");
      await loadCollections(page);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Collection archive failed."
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleDelete(collection: CatalogCollection) {
    const title = getCollectionTitle(collection);

    const confirmed = window.confirm(
      `"${title}" collection delete karni hai? Ye soft delete/archive behavior backend ke hisaab se hoga.`
    );

    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      setPageError(null);
      setSuccessMessage(null);

      await deleteCatalogCollection({
        apiRootUrl,
        token: getToken(),
        id: collection.id,
      });

      setSuccessMessage("Collection deleted successfully.");
      await loadCollections(page);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Collection delete failed."
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-500 ring-1 ring-neutral-200">
              <Tags className="h-3.5 w-3.5" />
              Admin / Catalog
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
              Collections
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Shopify-style manual aur automated catalog collections manage karo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadCollections(page)}
              disabled={isLoading || isActionLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/admin/catalog/collections/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add collection
            </Link>
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

        <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
          <div className="border-b border-neutral-200 bg-white p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search collections"
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </label>

              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value);
                }}
                className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={type}
                onChange={(event) => {
                  setPage(1);
                  setType(event.target.value);
                }}
                className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              >
                <option value="">All types</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATED">Automated</option>
              </select>
            </div>
          </div>

        <div className="overflow-x-auto">
  <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-[#fbfaf7] text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              <th className="w-[30%] px-5 py-4">Collection</th>
<th className="w-[8%] px-4 py-4">Products</th>
<th className="w-[10%] px-4 py-4">Type</th>
<th className="w-[20%] px-4 py-4">Conditions</th>
<th className="w-[10%] px-4 py-4">Status</th>
<th className="w-[9%] px-4 py-4">Season</th>
<th className="w-[9%] px-4 py-4">Updated</th>
<th className="w-[7%] px-4 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-neutral-500"
                    >
                      Loading collections...
                    </td>
                  </tr>
                ) : items.length ? (
                  items.map((collection) => {
                    const title = getCollectionTitle(collection);
                    const collectionType = getCollectionType(collection);
                    const statusLabel = getCollectionStatus(collection);
                    const productCount = getProductCount(collection);
                    const conditionSummary = getConditionSummary(collection);

                    return (
                      <tr
                        key={collection.id}
                        className="border-b border-neutral-100 transition hover:bg-neutral-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
                              {collection.imageUrl ? (
                                <img
                                  src={collection.imageUrl}
                                  alt={title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-neutral-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/admin/catalog/collections/${collection.id}/edit`}
                                className="line-clamp-2 text-sm font-semibold text-neutral-950 hover:underline"
                              >
                                {title}
                              </Link>

                              <p className="mt-1 truncate text-xs text-neutral-500">
                                {collection.slug || "no-slug"}
                              </p>

                              {collection.description ? (
                            <p className="mt-1 line-clamp-1 max-w-[260px] text-xs text-neutral-400">
                                  {collection.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-neutral-900">
                          {productCount}
                        </td>

                        <td className="px-5 py-4">
                          <TypeBadge type={collectionType} />
                        </td>

                        <td className="px-5 py-4">
                          <p className="line-clamp-2 max-w-[280px] text-sm text-neutral-600">
                            {collectionType === "AUTOMATED"
                              ? conditionSummary
                              : "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={statusLabel} />
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-600">
                          {collection.season || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-neutral-500">
                          {formatDate(collection.updatedAt)}
                        </td>

                     <td className="px-5 py-4">
  <div className="flex justify-end gap-2">
    {collection.slug ? (
      <Link
        href={`/collections/${collection.slug}`}
        target="_blank"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        title="View storefront collection"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    ) : null}

    <Link
      href={`/admin/catalog/collections/${collection.id}/edit`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
      title="Edit collection"
    >
      <Pencil className="h-4 w-4" />
    </Link>
  </div>
</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-neutral-500"
                    >
                      No collections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-200 bg-[#fbfaf7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Showing{" "}
              <span className="font-medium text-neutral-800">
                {showingFrom}
              </span>{" "}
              to{" "}
              <span className="font-medium text-neutral-800">
                {showingTo}
              </span>{" "}
              of{" "}
              <span className="font-medium text-neutral-800">{total}</span>{" "}
              collections
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadCollections(Math.max(1, page - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="rounded-xl bg-white px-3 py-2 text-sm text-neutral-600 ring-1 ring-neutral-200">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  loadCollections(Math.min(totalPages, page + 1))
                }
                disabled={page >= totalPages || isLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
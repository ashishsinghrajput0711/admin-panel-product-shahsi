"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { ProductPageMotion } from "@/components/admin/catalog/products/product-page-motion";
import {
  createCatalogAttributeGroup,
  deleteCatalogAttributeGroup,
  fetchCatalogAttributeGroupById,
  fetchCatalogAttributeGroups,
  updateCatalogAttributeGroup,
  type CatalogAttributeGroup,
  type CatalogAttributeGroupPayload,
  type CatalogAttributeGroupPagination,
} from "@/lib/admin/catalog-attributes-api";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

type GroupFormState = {
  name: string;
  label: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: GroupFormState = {
  name: "",
  label: "",
  slug: "",
  description: "",
  sortOrder: 1,
  isActive: true,
};

const EMPTY_PAGINATION: CatalogAttributeGroupPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
};

function makeGroupSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function groupToForm(
  group: CatalogAttributeGroup,
): GroupFormState {
  return {
    name: String(group.name || ""),
    label: String(group.label || group.name || ""),
    slug: String(
      group.slug ||
        group.key ||
        group.code ||
        "",
    ),
    description: String(group.description || ""),
    sortOrder: Number(group.sortOrder || 0),
    isActive: group.isActive !== false,
  };
}

function getGroupUsageCount(
  group: CatalogAttributeGroup,
) {
  if (
    typeof group.usageCount === "number"
  ) {
    return group.usageCount;
  }

  if (
    typeof group.attributeCount === "number"
  ) {
    return group.attributeCount;
  }

  return Array.isArray(group.attributes)
    ? group.attributes.length
    : 0;
}

function getAttributeName(
  attribute: Record<string, unknown>,
) {
  return String(
    attribute.label ||
      attribute.name ||
      attribute.code ||
      attribute.key ||
      attribute.id ||
      "Attribute",
  );
}

export default function AttributeGroupsPage() {
  const [groups, setGroups] = useState<
    CatalogAttributeGroup[]
  >([]);

  const [pagination, setPagination] =
    useState<CatalogAttributeGroupPagination>(
      EMPTY_PAGINATION,
    );

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<ActiveFilter>("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isEditorLoading, setIsEditorLoading] =
    useState(false);

  const [deletingGroupId, setDeletingGroupId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] =
    useState(false);

  const [editingGroupId, setEditingGroupId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<GroupFormState>(EMPTY_FORM);

  const [slugTouched, setSlugTouched] =
    useState(false);

  const currentPageActiveCount = useMemo(
    () =>
      groups.filter(
        (group) => group.isActive !== false,
      ).length,
    [groups],
  );

  const currentPageUsageCount = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total + getGroupUsageCount(group),
        0,
      ),
    [groups],
  );

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

    const result =
  await fetchCatalogAttributeGroups({
    page,
    limit: 20,
    search: debouncedSearch,
    isActive:
      activeFilter === "ALL"
        ? undefined
        : activeFilter === "ACTIVE",
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

const groupsWithAttributes = await Promise.all(
  result.groups.map(async (group) => {
    const usageCount = getGroupUsageCount(group);

    // List response mein attributes already available hain to
    // detail request ki zarurat nahi.
    if (
      usageCount <= 0 ||
      (Array.isArray(group.attributes) &&
        group.attributes.length > 0)
    ) {
      return group;
    }

    try {
      const groupDetail =
        await fetchCatalogAttributeGroupById(group.id);

      return {
        ...group,
        ...groupDetail,
        attributes: Array.isArray(groupDetail.attributes)
          ? groupDetail.attributes
          : group.attributes,
      };
    } catch {
      // Ek detail request fail hone par poori list fail nahi hogi.
      return group;
    }
  }),
);

setGroups(groupsWithAttributes);
setPagination(result.pagination);
    } catch (loadError) {
      setGroups([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Attribute groups load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    activeFilter,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  function openCreateEditor() {
    setEditingGroupId(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder:
        pagination.total > 0
          ? pagination.total + 1
          : 1,
    });

    setSlugTouched(false);
    setError(null);
    setMessage(null);
    setIsEditorOpen(true);
  }

  async function openEditEditor(
    group: CatalogAttributeGroup,
  ) {
    setEditingGroupId(group.id);
    setForm(groupToForm(group));
    setSlugTouched(true);
    setError(null);
    setMessage(null);
    setIsEditorOpen(true);

    try {
      setIsEditorLoading(true);

      const detail =
        await fetchCatalogAttributeGroupById(
          group.id,
        );

      setForm(groupToForm(detail));
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Attribute group detail load failed.",
      );
    } finally {
      setIsEditorLoading(false);
    }
  }

  function closeEditor() {
    if (isSaving) return;

    setIsEditorOpen(false);
    setEditingGroupId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = form.name.trim();

    const slug = makeGroupSlug(
      form.slug || name,
    );

    if (!name) {
      setError("Group name required hai.");
      return;
    }

    if (!slug) {
      setError("Group slug required hai.");
      return;
    }

    const payload: CatalogAttributeGroupPayload = {
      key: slug,
      code: slug,
      slug,

      name,
      label:
        form.label.trim() ||
        name,

      description:
        form.description.trim(),

      sortOrder: Number(
        form.sortOrder || 0,
      ),

      isActive: form.isActive,
      status: form.isActive
        ? "ACTIVE"
        : "INACTIVE",
    };

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      if (editingGroupId) {
        await updateCatalogAttributeGroup({
          groupId: editingGroupId,
          values: payload,
        });

        setMessage(
          `"${name}" group update ho gaya.`,
        );
      } else {
        await createCatalogAttributeGroup(
          payload,
        );

        setMessage(
          `"${name}" group create ho gaya.`,
        );
      }

      closeEditor();
      await loadGroups();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Attribute group save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(
    group: CatalogAttributeGroup,
  ) {
    const confirmed = window.confirm(
      `"${group.name}" group delete karna hai?\n\nAssigned attributes delete nahi honge. Woh ungrouped ho jayenge.`,
    );

    if (!confirmed) return;

    try {
      setDeletingGroupId(group.id);
      setError(null);
      setMessage(null);

      await deleteCatalogAttributeGroup(
        group.id,
      );

      setMessage(
        `"${group.name}" group delete ho gaya. Assigned attributes preserve rahe hain.`,
      );

      if (
        groups.length === 1 &&
        page > 1
      ) {
        setPage((current) =>
          Math.max(1, current - 1),
        );
      } else {
        await loadGroups();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Attribute group delete failed.",
      );
    } finally {
      setDeletingGroupId(null);
    }
  }

  return (
    <ProductPageMotion className="min-h-screen">
      <main className="min-h-screen bg-[#fbfaf6] p-4 sm:p-6">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/admin/catalog/attributes/library"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to attribute library
          </Link>

          <section
            data-product-section
            className="mt-5 overflow-hidden rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">
              Admin / Catalog / Attributes / Groups
            </p>

            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                  <Layers3 className="h-9 w-9" />
                  Attribute Groups
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">
                  Related attributes ko groups mein organize
                  karo. Group delete hone par attributes
                  preserve rahenge aur ungrouped ho jayenge.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void loadGroups()
                  }
                  disabled={isLoading}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${
                      isLoading
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openCreateEditor}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                >
                  <Plus className="h-4 w-4" />
                  New group
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">
                Attribute group error
              </p>

              <p className="mt-1 whitespace-pre-wrap">
                {error}
              </p>
            </div>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {message}
            </div>
          ) : null}

          <section
            data-product-section
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            <StatCard
              label="Total groups"
              value={pagination.total}
            />

            <StatCard
              label="Active on this page"
              value={currentPageActiveCount}
            />

            <StatCard
              label="Attribute usage"
              value={currentPageUsageCount}
            />
          </section>

          <section
            data-product-section
            className="mt-5 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search group name, label or slug..."
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
                />
              </label>

              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(
                    event.target.value as ActiveFilter,
                  );

                  setPage(1);
                }}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setActiveFilter("ALL");
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Clear filters
              </button>
            </div>
          </section>

          {isLoading ? (
            <div className="mt-5 flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-neutral-200 bg-white text-sm text-neutral-500 shadow-sm">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading attribute groups...
            </div>
          ) : groups.length === 0 ? (
            <section
              data-product-section
              className="mt-5 rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-12 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                <Layers3 className="h-7 w-7 text-neutral-500" />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-neutral-950">
                No attribute groups found
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Naya group create karke related attributes
                organize karo.
              </p>

              <button
                type="button"
                onClick={openCreateEditor}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Create first group
              </button>
            </section>
          ) : (
            <section className="mt-5 grid gap-4 xl:grid-cols-2">
              {groups.map((group) => {
                const active =
                  group.isActive !== false;

                const usageCount =
                  getGroupUsageCount(group);

                return (
                  <article
                    key={group.id}
                    data-product-section
                    className="group rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-neutral-950">
                            {group.label ||
                              group.name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                              active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        {group.label &&
                        group.label !== group.name ? (
                          <p className="mt-1 text-sm font-medium text-neutral-700">
                            {group.name}
                          </p>
                        ) : null}

                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                          {group.description ||
                            "No group description."}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void openEditEditor(
                              group,
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-sm"
                          title="Edit group"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              group,
                            )
                          }
                          disabled={
                            deletingGroupId ===
                            group.id
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete group"
                        >
                          {deletingGroupId ===
                          group.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        Slug: {group.slug}
                      </span>

                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        Order:{" "}
                        {Number(
                          group.sortOrder || 0,
                        )}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        Attributes: {usageCount}
                      </span>
                    </div>

                    {Array.isArray(
                      group.attributes,
                    ) &&
                    group.attributes.length > 0 ? (
                      <div className="mt-5 border-t border-neutral-100 pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                          Assigned attributes
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.attributes
                            .slice(0, 6)
                            .map(
                              (
                                attribute,
                                index,
                              ) => (
                                <span
                                  key={
                                    String(
                                      attribute.id ||
                                        index,
                                    )
                                  }
                                  className="rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs text-neutral-700"
                                >
                                  {getAttributeName(
                                    attribute as unknown as Record<
                                      string,
                                      unknown
                                    >,
                                  )}
                                </span>
                              ),
                            )}

                          {group.attributes.length >
                          6 ? (
                            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
                              +
                              {group.attributes
                                .length - 6}{" "}
                              more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                        Abhi is group mein koi attribute
                        assigned nahi hai.
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {!isLoading &&
          pagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between rounded-[1.25rem] border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-neutral-500">
                Page{" "}
                <span className="font-semibold text-neutral-950">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-neutral-950">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                    )
                  }
                  disabled={page <= 1}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        pagination.totalPages,
                        current + 1,
                      ),
                    )
                  }
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {isEditorOpen ? (
          <div
            data-no-page-motion
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeEditor();
              }
            }}
          >
            <form
              onSubmit={handleSave}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
              className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-5 py-5">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-950">
                    {editingGroupId
                      ? "Edit attribute group"
                      : "Create attribute group"}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Group information backend mein
                    dynamically save hogi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={isSaving}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isEditorLoading ? (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-neutral-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading group details...
                </div>
              ) : (
                <>
                  <div className="space-y-5 p-5">
                    <label className="block text-sm font-medium text-neutral-800">
                      Group name

                      <input
                        value={form.name}
                        onChange={(event) => {
                          const nextName =
                            event.target.value;

                          setForm(
                            (current) => ({
                              ...current,
                              name: nextName,
                              label:
                                current.label ||
                                nextName,
                              slug:
                                slugTouched
                                  ? current.slug
                                  : makeGroupSlug(
                                      nextName,
                                    ),
                            }),
                          );
                        }}
                        placeholder="Style"
                        className="mt-2 h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>

                    <label className="block text-sm font-medium text-neutral-800">
                      Display label

                      <input
                        value={form.label}
                        onChange={(event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              label:
                                event.target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Style & Occasion"
                        className="mt-2 h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>

                    <label className="block text-sm font-medium text-neutral-800">
                      Group slug / key

                      <input
                        value={form.slug}
                        onChange={(event) => {
                          setSlugTouched(true);

                          setForm(
                            (current) => ({
                              ...current,
                              slug: makeGroupSlug(
                                event.target.value,
                              ),
                            }),
                          );
                        }}
                        placeholder="style"
                        className="mt-2 h-11 w-full rounded-xl border border-neutral-300 px-3 font-mono text-sm outline-none focus:border-neutral-950"
                      />

                      <span className="mt-1 block text-xs text-neutral-400">
                        Backend key, code aur slug isi
                        normalized value se save honge.
                      </span>
                    </label>

                    <label className="block text-sm font-medium text-neutral-800">
                      Description

                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              description:
                                event.target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Style, silhouette, neckline and occasion attributes."
                        className="mt-2 min-h-[120px] w-full resize-y rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-neutral-800">
                        Sort order

                        <input
                          type="number"
                          min={0}
                          value={form.sortOrder}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                sortOrder:
                                  Number(
                                    event.target
                                      .value,
                                  ) || 0,
                              }),
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                        />
                      </label>

                      <label className="flex min-h-[72px] items-center gap-3 rounded-xl border border-neutral-300 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                isActive:
                                  event.target
                                    .checked,
                              }),
                            )
                          }
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-neutral-900">
                            Active group
                          </span>

                          <span className="mt-0.5 block text-xs text-neutral-500">
                            Inactive karne par group
                            archived list mein visible
                            rahega.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-200 bg-white px-5 py-4">
                    <button
                      type="button"
                      onClick={closeEditor}
                      disabled={isSaving}
                      className="h-11 rounded-full border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSaving ||
                        !form.name.trim() ||
                        !form.slug.trim()
                      }
                      className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}

                      {editingGroupId
                        ? "Save changes"
                        : "Create group"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        ) : null}
      </main>
    </ProductPageMotion>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
}
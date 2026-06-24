"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";

import type {
  CategoryFaq,
  CategoryFormValues,
  CategoryNode,
} from "@/components/admin/catalog/categories/category-types";
import { flattenCategoryTree } from "@/lib/admin/category-api";

type CollectionPickerItem = {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  type?: string | null;
  collectionType?: string | null;
  isActive?: boolean | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractCollections(data: unknown): CollectionPickerItem[] {
  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;

  if (Array.isArray(root.data)) {
    return root.data as CollectionPickerItem[];
  }

  if (Array.isArray(root.items)) {
    return root.items as CollectionPickerItem[];
  }

  if (Array.isArray(root.collections)) {
    return root.collections as CollectionPickerItem[];
  }

  if (root.data && typeof root.data === "object") {
    const payload = root.data as Record<string, unknown>;

    if (Array.isArray(payload.items)) {
      return payload.items as CollectionPickerItem[];
    }

    if (Array.isArray(payload.collections)) {
      return payload.collections as CollectionPickerItem[];
    }

    if (Array.isArray(payload.data)) {
      return payload.data as CollectionPickerItem[];
    }
  }

  return [];
}

function getCollectionValue(collection: CollectionPickerItem) {
  return String(collection.slug || collection.id || "").trim();
}

function getCollectionLabel(collection: CollectionPickerItem) {
  return String(
    collection.name ||
      collection.title ||
      collection.slug ||
      collection.id ||
      "Untitled collection",
  ).trim();
}

function getCollectionBadge(collection: CollectionPickerItem) {
  const type = String(
    collection.type || collection.collectionType || "MANUAL",
  ).toUpperCase();

  const status =
    typeof collection.isActive === "boolean"
      ? collection.isActive
        ? "ACTIVE"
        : "DRAFT"
      : String(collection.status || "ACTIVE").toUpperCase();

  return `${type} / ${status}`;
}

async function fetchCollectionPickerItems() {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "100");
  params.set("status", "ACTIVE");

  const response = await fetch(
    `/api/proxy/admin/catalog/collections?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const text = await response.text();
  const data = text.trim() ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : `Collections load failed: ${response.status}`;

    throw new Error(message);
  }

  return extractCollections(data).filter((collection) =>
    Boolean(getCollectionValue(collection)),
  );
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
    />
  );
}

function CollectionSelect({
  value,
  label,
  placeholder,
  collections,
  isLoading,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  collections: CollectionPickerItem[];
  isLoading: boolean;
  onChange: (value: string) => void;
}) {
  const selectedCollection = collections.find(
    (collection) => getCollectionValue(collection) === value,
  );

  const hasCurrentValue = Boolean(value);
  const currentValueMissing =
    hasCurrentValue &&
    !collections.some((collection) => getCollectionValue(collection) === value);

  return (
    <div>
      <InputLabel>{label}</InputLabel>

      <div className="mt-2 rounded-2xl border border-neutral-200 bg-white p-3 transition focus-within:border-neutral-950">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          className="h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-[#fbfaf6] px-3 text-sm font-medium text-neutral-950 outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        >
          <option value="">
            {isLoading ? "Loading collections..." : placeholder}
          </option>

          {currentValueMissing ? (
            <option value={value}>Current saved: {value}</option>
          ) : null}

          {collections.map((collection) => {
            const optionValue = getCollectionValue(collection);
            const optionLabel = getCollectionLabel(collection);

            return (
              <option key={collection.id || optionValue} value={optionValue}>
                {optionLabel} — {getCollectionBadge(collection)}
              </option>
            );
          })}
        </select>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedCollection ? (
            <>
              <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                {getCollectionLabel(selectedCollection)}
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                {getCollectionBadge(selectedCollection)}
              </span>
            </>
          ) : value ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">
              Saved old value: {value}
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
              No collection selected
            </span>
          )}

          <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-500">
            {collections.length} collections loaded
          </span>
        </div>

        {value ? (
          <p className="mt-2 text-xs text-neutral-400">
            Saved slug:{" "}
            <span className="font-mono font-semibold text-neutral-700">
              {value}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CategoryForm({
  mode,
  initialValues,
  categoryTree,
  currentCategoryId,
  currentCategorySlug,
  isSubmitting,
  error,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues: CategoryFormValues;
  categoryTree: CategoryNode[];
  currentCategoryId?: string;
  currentCategorySlug?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: CategoryFormValues, imageFile: File | null) => void;
}) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [autoSlug, setAutoSlug] = useState(mode === "create");

  const [collections, setCollections] = useState<CollectionPickerItem[]>([]);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState("");

  const parentOptions = useMemo(() => {
    return flattenCategoryTree(categoryTree, {
      excludeId: currentCategoryId,
      excludeSlug: currentCategorySlug,
    });
  }, [categoryTree, currentCategoryId, currentCategorySlug]);

  useEffect(() => {
    let mounted = true;

    async function loadCollections() {
      try {
        setIsCollectionsLoading(true);
        setCollectionsError("");

        const items = await fetchCollectionPickerItems();

        if (!mounted) return;

        setCollections(items);
      } catch (loadError) {
        if (!mounted) return;

        setCollections([]);
        setCollectionsError(
          loadError instanceof Error
            ? loadError.message
            : "Collections load nahi ho paayi.",
        );
      } finally {
        if (mounted) {
          setIsCollectionsLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  function updateValue<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMetafield(key: string, value: string) {
    setValues((current) => ({
      ...current,
      metafields: {
        ...current.metafields,
        [key]: value,
      },
    }));
  }

  function updateFaq(index: number, key: keyof CategoryFaq, value: string) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.map((faq, faqIndex) =>
        faqIndex === index
          ? {
              ...faq,
              [key]: value,
            }
          : faq,
      ),
    }));
  }

  function addFaq() {
    setValues((current) => ({
      ...current,
      faqs: [...current.faqs, { question: "", answer: "" }],
    }));
  }

  function removeFaq(index: number) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index),
    }));
  }

  function handleNameChange(name: string) {
    const nextSlug = slugify(name);

    setValues((current) => ({
      ...current,
      name,
      slug: autoSlug ? nextSlug : current.slug,
      seoSlug: autoSlug ? nextSlug : current.seoSlug,
    }));
  }

  function handleSlugChange(slug: string) {
    setAutoSlug(false);
    updateValue("slug", slugify(slug));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) return;
    if (!values.slug.trim()) return;

    onSubmit(
      {
        ...values,
        slug: slugify(values.slug),
        seoSlug: values.seoSlug.trim() || slugify(values.slug),
      },
      imageFile,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/catalog/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to categories
          </Link>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Admin / Catalog / Categories
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {mode === "create" ? "Create Category" : "Edit Category"}
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Category tree dynamic backend se manage hoga.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create category"
              : "Save category"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Category save failed</p>
          <p className="mt-1 whitespace-pre-wrap">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Basic information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel>Name</InputLabel>
                <TextInput
                  value={values.name}
                  onChange={handleNameChange}
                  placeholder="Bridesmaid"
                />
              </div>

              <div>
                <InputLabel>Slug</InputLabel>
                <TextInput
                  value={values.slug}
                  onChange={handleSlugChange}
                  placeholder="bridesmaid"
                />
              </div>

              <div>
                <InputLabel>Parent category</InputLabel>
                <select
                  value={values.parentId}
                  onChange={(event) =>
                    updateValue("parentId", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                >
                  <option value="">Top-level category</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <InputLabel>Sort order</InputLabel>
                <TextInput
                  type="number"
                  value={values.sortOrder}
                  onChange={(value) => updateValue("sortOrder", Number(value))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mt-4">
              <InputLabel>Description</InputLabel>
              <TextArea
                value={values.description}
                onChange={(value) => updateValue("description", value)}
                placeholder="Category description"
                rows={5}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">SEO</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel>SEO title</InputLabel>
                <TextInput
                  value={values.seoTitle}
                  onChange={(value) => updateValue("seoTitle", value)}
                  placeholder="Bridesmaid | Shahsi"
                />
              </div>

              <div>
                <InputLabel>SEO slug</InputLabel>
                <TextInput
                  value={values.seoSlug}
                  onChange={(value) => updateValue("seoSlug", slugify(value))}
                  placeholder="bridesmaid"
                />
              </div>
            </div>

            <div className="mt-4">
              <InputLabel>SEO description</InputLabel>
              <TextArea
                value={values.seoDescription}
                onChange={(value) => updateValue("seoDescription", value)}
                placeholder="Shop bridesmaid dresses"
                rows={4}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">
                  Metafields
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Primary/secondary collection backend collection picker se
                  select karo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCollectionsLoading(true);
                  setCollectionsError("");

                  fetchCollectionPickerItems()
                    .then((items) => setCollections(items))
                    .catch((refreshError) =>
                      setCollectionsError(
                        refreshError instanceof Error
                          ? refreshError.message
                          : "Collections refresh failed.",
                      ),
                    )
                    .finally(() => setIsCollectionsLoading(false));
                }}
                className="w-fit rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCollectionsLoading}
              >
                {isCollectionsLoading ? "Loading..." : "Refresh collections"}
              </button>
            </div>

            {collectionsError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {collectionsError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel>Top menu</InputLabel>
                <TextInput
                  value={values.metafields.topMenu || ""}
                  onChange={(value) => updateMetafield("topMenu", value)}
                />
              </div>

              <div>
                <InputLabel>From blog</InputLabel>
                <TextInput
                  value={values.metafields.fromBlog || ""}
                  onChange={(value) => updateMetafield("fromBlog", value)}
                />
              </div>

              <div>
                <InputLabel>Sub heading</InputLabel>
                <TextInput
                  value={values.metafields.subHeading || ""}
                  onChange={(value) => updateMetafield("subHeading", value)}
                />
              </div>

          <CollectionSelect
  label="Primary collection"
  placeholder="Select primary collection"
  value={values.metafields.primaryCollection || ""}
  collections={collections}
  isLoading={isCollectionsLoading}
  onChange={(value) => updateMetafield("primaryCollection", value)}
/>

             <CollectionSelect
  label="Secondary collection"
  placeholder="Select secondary collection"
  value={values.metafields.secondaryCollection || ""}
  collections={collections}
  isLoading={isCollectionsLoading}
  onChange={(value) => updateMetafield("secondaryCollection", value)}
/>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">
                  FAQs
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Category page ke questions/answers.
                </p>
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {values.faqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-500">
                  No FAQs added.
                </div>
              ) : null}

              {values.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-950">
                      FAQ #{index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-full p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <InputLabel>Question</InputLabel>
                      <TextInput
                        value={faq.question}
                        onChange={(value) =>
                          updateFaq(index, "question", value)
                        }
                        placeholder="Question"
                      />
                    </div>

                    <div>
                      <InputLabel>Answer</InputLabel>
                      <TextArea
                        value={faq.answer}
                        onChange={(value) => updateFaq(index, "answer", value)}
                        placeholder="Answer"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">Status</h2>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-950">Active</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Frontend tree me category visible rahegi.
                </p>
              </div>

              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) =>
                  updateValue("isActive", event.target.checked)
                }
                className="h-5 w-5 accent-neutral-950"
              />
            </label>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Category image
            </h2>

            {values.imageUrl ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                <img
                  src={values.imageUrl}
                  alt={values.imageAltText || values.name}
                  className="h-48 w-full object-contain"
                />
              </div>
            ) : null}

            <div className="mt-5">
              <InputLabel>Image URL</InputLabel>
              <TextInput
                value={values.imageUrl}
                onChange={(value) => updateValue("imageUrl", value)}
                placeholder="https://..."
              />
            </div>

            <div className="mt-4">
              <InputLabel>Image name</InputLabel>
              <TextInput
                value={values.imageName}
                onChange={(value) => updateValue("imageName", value)}
                placeholder="lehenga-cover"
              />
            </div>

            <div className="mt-4">
              <InputLabel>Alt text</InputLabel>
              <TextInput
                value={values.imageAltText}
                onChange={(value) => updateValue("imageAltText", value)}
                placeholder="Lehenga category image"
              />
            </div>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 hover:bg-neutral-100">
              <Upload className="h-6 w-6" />
              <span className="mt-2 font-medium text-neutral-700">
                {imageFile ? imageFile.name : "Upload category image"}
              </span>
              <span className="mt-1 text-xs">
                Save ke baad image backend API par upload hogi.
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setImageFile(file);
                }}
              />
            </label>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-950">
              Template
            </h2>

            <div className="mt-5">
              <InputLabel>Theme template</InputLabel>
              <TextInput
                value={values.themeTemplate}
                onChange={(value) => updateValue("themeTemplate", value)}
                placeholder="default"
              />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
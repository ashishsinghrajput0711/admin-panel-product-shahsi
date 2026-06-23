"use client";

import { FormEvent, useMemo, useState } from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { AutomatedCollectionPreview } from "./automated-collection-preview";
import { CollectionProductsSection } from "./collection-products-section";

import type {
  CatalogCollectionFormValues,
  CollectionCondition,
} from "@/lib/admin/catalog-collections-api";

type CollectionFormProps = {
  defaultValues?: Partial<CatalogCollectionFormValues>;
  isSubmitting?: boolean;
  submitLabel?: string;
  collectionId?: string;
  apiRootUrl?: string;
  token?: string | null;
  onSubmit: (values: CatalogCollectionFormValues) => Promise<void> | void;
};

const emptyCondition: CollectionCondition = {
  field: "price",
  operator: "LESS_THAN",
  value: "",
};

const conditionFields = [
  { label: "Title", value: "title" },
  { label: "Tag", value: "tag" },
  { label: "Category", value: "category" },
  { label: "Primary Category", value: "primaryCategory" },
  { label: "Collection", value: "collection" },
  { label: "Price", value: "price" },
  { label: "Sale Price", value: "salePrice" },
  { label: "Status", value: "status" },
  { label: "Brand", value: "brand" },
  { label: "Vendor", value: "vendor" },
  { label: "Product Type", value: "productType" },
  { label: "Commerce Type", value: "commerceType" },
  { label: "Inventory Stock", value: "inventoryStock" },
  { label: "Production Type", value: "productionType" },
  { label: "Created At", value: "createdAt" },
  { label: "Updated At", value: "updatedAt" },
];

const operators = [
  { label: "Equals", value: "EQUALS" },
  { label: "Not equals", value: "NOT_EQUALS" },
  { label: "Contains", value: "CONTAINS" },
  { label: "Not contains", value: "NOT_CONTAINS" },
  { label: "Starts with", value: "STARTS_WITH" },
  { label: "Ends with", value: "ENDS_WITH" },
  { label: "Greater than", value: "GREATER_THAN" },
  { label: "Less than", value: "LESS_THAN" },
  { label: "Greater than or equal", value: "GREATER_THAN_OR_EQUAL" },
  { label: "Less than or equal", value: "LESS_THAN_OR_EQUAL" },
  { label: "Is empty", value: "IS_EMPTY" },
  { label: "Is not empty", value: "IS_NOT_EMPTY" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialValues(
  defaultValues?: Partial<CatalogCollectionFormValues>
): CatalogCollectionFormValues {
  return {
    name: defaultValues?.name || "",
    slug: defaultValues?.slug || "",
    description: defaultValues?.description || "",
    imageUrl: defaultValues?.imageUrl || "",
    season: defaultValues?.season || "",
    status: defaultValues?.status || "DRAFT",
    isActive: defaultValues?.isActive ?? true,
    sortOrder: Number(defaultValues?.sortOrder || 0),
    type: defaultValues?.type || "MANUAL",
    matchType: defaultValues?.matchType || "ALL",
    seoTitle: defaultValues?.seoTitle || "",
    seoDescription: defaultValues?.seoDescription || "",
    seoSlug: defaultValues?.seoSlug || "",
    imageName: defaultValues?.imageName || "",
    imageAltText: defaultValues?.imageAltText || "",
    themeTemplate: defaultValues?.themeTemplate || "default",
    metafields: defaultValues?.metafields || {},
    faqs: Array.isArray(defaultValues?.faqs) ? defaultValues.faqs : [],
    conditions: Array.isArray(defaultValues?.conditions)
      ? defaultValues.conditions
      : [],
  };
}

export function CollectionForm({
  defaultValues,
  isSubmitting = false,
  submitLabel: _submitLabel = "Save collection",
  collectionId,
  apiRootUrl,
  token,
  onSubmit,
}: CollectionFormProps) {
  const [values, setValues] = useState<CatalogCollectionFormValues>(() =>
    getInitialValues(defaultValues)
  );

  const totalFaqs = values.faqs.length;
  const totalConditions = values.conditions.length;

  const previewImage = useMemo(() => {
    const url = values.imageUrl.trim();
    if (!url) return "";
    return url;
  }, [values.imageUrl]);

  function updateValue<K extends keyof CatalogCollectionFormValues>(
    key: K,
    value: CatalogCollectionFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleNameChange(nextName: string) {
    setValues((current) => {
      const shouldAutoSlug =
        !current.slug || current.slug === slugify(current.name);

      const nextSlug = shouldAutoSlug ? slugify(nextName) : current.slug;

      return {
        ...current,
        name: nextName,
        slug: nextSlug,
        seoSlug: current.seoSlug || nextSlug,
        seoTitle: current.seoTitle || `${nextName} | Shahsi`,
      };
    });
  }

  function addFaq() {
    setValues((current) => ({
      ...current,
      faqs: [...current.faqs, { question: "", answer: "" }],
    }));
  }

  function updateFaq(
    index: number,
    key: "question" | "answer",
    value: string
  ) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.map((faq, faqIndex) =>
        faqIndex === index ? { ...faq, [key]: value } : faq
      ),
    }));
  }

  function removeFaq(index: number) {
    setValues((current) => ({
      ...current,
      faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index),
    }));
  }

  function addCondition() {
    setValues((current) => ({
      ...current,
      conditions: [...current.conditions, { ...emptyCondition }],
    }));
  }

  function updateCondition(
    index: number,
    key: keyof CollectionCondition,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      conditions: current.conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, [key]: value } : condition
      ),
    }));
  }

  function removeCondition(index: number) {
    setValues((current) => ({
      ...current,
      conditions: current.conditions.filter(
        (_, conditionIndex) => conditionIndex !== index
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
  <form
  id="catalog-collection-form"
  onSubmit={handleSubmit}
  className="space-y-6 pb-10"
>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-neutral-800">
                  Title
                </label>
                <input
                  value={values.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Women's Clothing – Luxurious Fashion in Signature Prints & Styles"
                  className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-800">
                  Description
                </label>
                <textarea
                  value={values.description}
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  placeholder="Explore this curated collection..."
                  className="mt-2 min-h-[220px] w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>
            </div>
          </section>

          {values.type === "MANUAL" ? (
            collectionId && apiRootUrl ? (
              <CollectionProductsSection
                collectionId={collectionId}
                apiRootUrl={apiRootUrl}
                token={token}
              />
            ) : (
              <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
                <h2 className="text-lg font-semibold text-neutral-950">
                  Products
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Collection create hone ke baad edit page se products
                  assign/reorder karenge.
                </p>
              </section>
            )
          ) : (
            <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    Conditions
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Automated collection ke products conditions ke basis par
                    match honge.
                  </p>
                  <p className="mt-2 text-sm text-neutral-400">
                    {totalConditions} condition
                    {totalConditions === 1 ? "" : "s"} added
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={values.matchType}
                    onChange={(event) =>
                      updateValue(
                        "matchType",
                        event.target
                          .value as CatalogCollectionFormValues["matchType"]
                      )
                    }
                    className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none"
                  >
                    <option value="ALL">Match all</option>
                    <option value="ANY">Match any</option>
                  </select>

                  <button
                    type="button"
                    onClick={addCondition}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-3 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add condition
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {values.conditions.length ? (
                  values.conditions.map((condition, index) => (
                    <div
                      key={`${condition.field}-${condition.operator}-${index}`}
                      className="grid gap-3 rounded-2xl bg-[#fbfaf7] p-3 ring-1 ring-neutral-200 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <select
                        value={String(condition.field || "")}
                        onChange={(event) =>
                          updateCondition(index, "field", event.target.value)
                        }
                        className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none"
                      >
                        {conditionFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={String(condition.operator || "")}
                        onChange={(event) =>
                          updateCondition(index, "operator", event.target.value)
                        }
                        className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none"
                      >
                        {operators.map((operator) => (
                          <option key={operator.value} value={operator.value}>
                            {operator.label}
                          </option>
                        ))}
                      </select>

                      <input
                        value={String(condition.value ?? "")}
                        onChange={(event) =>
                          updateCondition(index, "value", event.target.value)
                        }
                        placeholder="Value"
                        className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#fbfaf7] p-5 text-sm text-neutral-500 ring-1 ring-neutral-200">
                    No conditions added yet.
                  </div>
                )}
              </div>


              {apiRootUrl ? (
  <AutomatedCollectionPreview
    apiRootUrl={apiRootUrl}
    token={token}
    matchType={values.matchType}
    conditions={values.conditions}
  />
) : null}
            </section>
          )}

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  Metafields
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Collection extra storefront fields.
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-950"
              >
                Add definition
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#fbfaf7] p-5 text-sm text-neutral-500 ring-1 ring-neutral-200">
              Metafields UI backend definitions ke saath baad me connect hoga.
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-neutral-950">
              Search engine listing
            </h2>

            <div className="mt-5 rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-5">
              <p className="text-sm text-neutral-500">Shahsi</p>
              <p className="mt-1 text-lg font-semibold text-blue-700">
                {values.seoTitle || values.name || "Collection SEO title"}
              </p>
              <p className="mt-1 text-sm text-green-700">
                https://www.shahsi.com/collections/
                {values.seoSlug || values.slug || "collection-slug"}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                {values.seoDescription ||
                  "SEO description will appear here."}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  SEO title
                </label>
                <input
                  value={values.seoTitle}
                  onChange={(event) =>
                    updateValue("seoTitle", event.target.value)
                  }
                  placeholder="Bridal Whites | Shahsi"
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  SEO slug
                </label>
                <input
                  value={values.seoSlug}
                  onChange={(event) =>
                    updateValue("seoSlug", slugify(event.target.value))
                  }
                  placeholder="bridal-whites"
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                SEO description
              </label>
              <textarea
                value={values.seoDescription}
                onChange={(event) =>
                  updateValue("seoDescription", event.target.value)
                }
                placeholder="Explore curated bridal white outfits on Shahsi."
                className="mt-2 min-h-[110px] w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  FAQs
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {totalFaqs} FAQ{totalFaqs === 1 ? "" : "s"} added
                </p>
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:border-neutral-950"
              >
                <Plus className="h-4 w-4" />
                Add FAQ
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {values.faqs.length ? (
                values.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-neutral-200"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        value={faq.question}
                        onChange={(event) =>
                          updateFaq(index, "question", event.target.value)
                        }
                        placeholder="Question"
                        className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      value={faq.answer}
                      onChange={(event) =>
                        updateFaq(index, "answer", event.target.value)
                      }
                      placeholder="Answer"
                      className="mt-3 min-h-[90px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-950 outline-none"
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-[#fbfaf7] p-5 text-sm text-neutral-500 ring-1 ring-neutral-200">
                  No FAQs added yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-950">
                Publishing
              </h2>
              <span className="text-sm font-medium text-blue-600">Manage</span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Status
                </label>
                <select
                  value={values.status}
                  onChange={(event) =>
                    updateValue(
                      "status",
                      event.target.value as CatalogCollectionFormValues["status"]
                    )
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <label className="flex items-center justify-between rounded-2xl bg-[#fbfaf7] px-4 py-3 ring-1 ring-neutral-200">
                <span className="text-sm font-medium text-neutral-700">
                  Active
                </span>
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    updateValue("isActive", event.target.checked)
                  }
                  className="h-4 w-4 accent-neutral-950"
                />
              </label>

              <div className="rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-neutral-200">
                <p className="text-sm font-semibold text-neutral-800">
                  Sales channels
                </p>
                <div className="mt-3 space-y-2 text-sm text-neutral-600">
                  <p>● Online Store</p>
                  <p>● Shop</p>
                  <p>○ TikTok</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-neutral-950">Image</h2>

            <div className="mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf7]">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={values.imageAltText || values.name || "Collection"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-400">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">Image preview</span>
                </div>
              )}
            </div>

            <input
              value={values.imageUrl}
              onChange={(event) => updateValue("imageUrl", event.target.value)}
              placeholder="https://cdn.example.com/collection.jpg"
              className="mt-4 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />

            <div className="mt-4 grid gap-3">
              <input
                value={values.imageName}
                onChange={(event) => updateValue("imageName", event.target.value)}
                placeholder="Image name"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />

              <input
                value={values.imageAltText}
                onChange={(event) =>
                  updateValue("imageAltText", event.target.value)
                }
                placeholder="Image alt text"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-neutral-950">
              Theme template
            </h2>

            <select
              value={values.themeTemplate}
              onChange={(event) =>
                updateValue("themeTemplate", event.target.value)
              }
              className="mt-4 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="default">default</option>
              <option value="women-s-clothing">women-s-clothing</option>
              <option value="bridal-whites">bridal-whites</option>
              <option value="landing">landing</option>
            </select>
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-neutral-950">
              Collection settings
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Collection type
                </label>
                <select
                  value={values.type}
                  onChange={(event) =>
                    updateValue(
                      "type",
                      event.target
                        .value as CatalogCollectionFormValues["type"]
                    )
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATED">Automated</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Slug
                </label>
                <input
                  value={values.slug}
                  onChange={(event) =>
                    updateValue("slug", slugify(event.target.value))
                  }
                  placeholder="bridal-whites"
                  className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Season
                </label>
                <input
                  value={values.season}
                  onChange={(event) => updateValue("season", event.target.value)}
                  placeholder="Summer 2026"
                  className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Sort order
                </label>
                <input
                  type="number"
                  value={values.sortOrder}
                  onChange={(event) =>
                    updateValue("sortOrder", Number(event.target.value))
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

     {/* <div className="flex items-center justify-end rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div> */}
    </form>
  );
}
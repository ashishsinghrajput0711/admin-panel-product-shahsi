"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  searchDataSchema,
  type SearchDataFormValues,
} from "./search-data-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchDataForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<SearchDataFormValues>;
  onSubmit: (values: SearchDataFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<SearchDataFormValues>({
    resolver: zodResolver(searchDataSchema) as Resolver<SearchDataFormValues>,
    defaultValues: {
      keyword: "",
      normalizedKeyword: "",
      scope: "GLOBAL",
      productId: "",
      variantId: "",
      categoryId: "",
      attributeId: "",
      businessType: "BOTH",
      intent: "GENERAL",
      synonyms: "",
      misspellings: "",
      boostTerms: "",
      rankingWeight: 50,
      isVisible: true,
      isTrending: false,
      resultUrl: "",
      notes: "",
      status: "DRAFT",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const isVisible = Boolean(form.watch("isVisible"));
  const isTrending = Boolean(form.watch("isTrending"));

  function handleSubmit(values: SearchDataFormValues) {
    onSubmit({
      ...values,
      synonyms: normalizeTags(values.synonyms),
      misspellings: normalizeTags(values.misspellings),
      boostTerms: normalizeTags(values.boostTerms),
    } as unknown as SearchDataFormValues);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Search Keyword</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Keyword" error={form.formState.errors.keyword?.message}>
            <Input
              {...form.register("keyword")}
              placeholder="bridesmaid sage dress"
            />
          </Field>

          <Field
            label="Normalized Keyword"
            error={form.formState.errors.normalizedKeyword?.message}
          >
            <Input
              {...form.register("normalizedKeyword")}
              placeholder="bridesmaid-sage-dress"
            />
          </Field>

          <Field label="Business Type">
            <select
              {...form.register("businessType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="BOTH">Both</option>
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Search Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="GLOBAL">Global</option>
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="CATEGORY">Category</option>
              <option value="ATTRIBUTE">Attribute</option>
            </select>
          </Field>

          <Field label="Intent">
            <select
              {...form.register("intent")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="GENERAL">General</option>
              <option value="CATEGORY_DISCOVERY">Category Discovery</option>
              <option value="PRODUCT_DISCOVERY">Product Discovery</option>
              <option value="OCCASION">Occasion</option>
              <option value="COLOR">Color</option>
              <option value="STYLE">Style</option>
              <option value="FIT">Fit</option>
              <option value="BRIDAL_PARTY">Bridal Party</option>
            </select>
          </Field>

          {scope === "PRODUCT" && (
            <Field label="Product ID">
              <Input {...form.register("productId")} placeholder="product_cuid" />
            </Field>
          )}

          {scope === "VARIANT" && (
            <Field label="Variant ID">
              <Input {...form.register("variantId")} placeholder="variant_cuid" />
            </Field>
          )}

          {scope === "CATEGORY" && (
            <Field label="Category ID">
              <Input {...form.register("categoryId")} placeholder="category_cuid" />
            </Field>
          )}

          {scope === "ATTRIBUTE" && (
            <Field label="Attribute ID">
              <Input
                {...form.register("attributeId")}
                placeholder="attribute_cuid"
              />
            </Field>
          )}

          <Field
            label="Result URL"
            error={form.formState.errors.resultUrl?.message}
          >
            <Input
              {...form.register("resultUrl")}
              placeholder="/bridesmaid?color=sage"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Synonyms & Aliases</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Synonyms">
            <Input
              {...form.register("synonyms")}
              placeholder="sage dress, green bridesmaid"
            />
          </Field>

          <Field label="Misspellings">
            <Input
              {...form.register("misspellings")}
              placeholder="bridesmade, bridsmaid"
            />
          </Field>

          <Field label="Boost Terms">
            <Input
              {...form.register("boostTerms")}
              placeholder="bridesmaid, wedding, sage"
            />
          </Field>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Comma separated values daalo. Example: sage dress, green bridesmaid
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Ranking & Visibility</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Ranking Weight"
            error={form.formState.errors.rankingWeight?.message}
          >
            <Input type="number" {...form.register("rankingWeight")} />
          </Field>

          <CheckboxField
            label="Visible in Search"
            checked={isVisible}
            onChange={(checked) =>
              form.setValue("isVisible", checked, { shouldValidate: true })
            }
          />

          <CheckboxField
            label="Trending Keyword"
            checked={isTrending}
            onChange={(checked) =>
              form.setValue("isTrending", checked, { shouldValidate: true })
            }
          />
        </div>

        <div className="mt-6">
          <Field label="Notes">
            <textarea
              {...form.register("notes")}
              className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Internal search tuning notes..."
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Search Data"}
        </Button>
      </div>
    </form>
  );
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) return value;

  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      {children}

      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

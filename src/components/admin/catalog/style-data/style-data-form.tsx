"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { styleDataSchema, type StyleDataFormValues } from "./style-data-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StyleDataForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<StyleDataFormValues>;
  onSubmit: (values: StyleDataFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<StyleDataFormValues>({
    resolver: zodResolver(styleDataSchema) as Resolver<StyleDataFormValues>,
    defaultValues: {
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      businessType: "SHAHSI",
      occasion: "",
      styleCategory: "",
      colorFamily: "",
      fabricFeel: "",
      neckline: "",
      sleeveType: "",
      silhouette: "",
      modestyLevel: "MEDIUM",
      season: "ALL_SEASON",
      styleTags: "",
      trendTags: "",
      aiStylingNotes: "",
      merchandisingNotes: "",
      isFeatured: false,
      isTrendItem: false,
      status: "DRAFT",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const isFeatured = Boolean(form.watch("isFeatured"));
  const isTrendItem = Boolean(form.watch("isTrendItem"));

  function handleSubmit(values: StyleDataFormValues) {
    onSubmit({
      ...values,
      styleTags: normalizeTags(values.styleTags),
      trendTags: normalizeTags(values.trendTags),
    } as unknown as StyleDataFormValues);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Style Data Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
            </select>
          </Field>

          {scope === "PRODUCT" ? (
            <Field label="Product ID">
              <Input {...form.register("productId")} placeholder="product_cuid" />
            </Field>
          ) : (
            <Field label="Variant ID">
              <Input {...form.register("variantId")} placeholder="variant_cuid" />
            </Field>
          )}

          <Field label="Business Type">
            <select
              {...form.register("businessType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Style Classification</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Occasion">
            <Input {...form.register("occasion")} placeholder="Bridesmaid / Wedding / Cocktail" />
          </Field>

          <Field label="Style Category">
            <Input {...form.register("styleCategory")} placeholder="Modern / Classic / Minimal" />
          </Field>

          <Field label="Color Family">
            <Input {...form.register("colorFamily")} placeholder="Sage / Blue / Pink" />
          </Field>

          <Field label="Fabric Feel">
            <Input {...form.register("fabricFeel")} placeholder="Soft / Flowy / Structured" />
          </Field>

          <Field label="Neckline">
            <Input {...form.register("neckline")} placeholder="V-Neck / Square / Halter" />
          </Field>

          <Field label="Sleeve Type">
            <Input {...form.register("sleeveType")} placeholder="Sleeveless / Long Sleeve" />
          </Field>

          <Field label="Silhouette">
            <Input {...form.register("silhouette")} placeholder="A-Line / Mermaid / Sheath" />
          </Field>

          <Field label="Modesty Level">
            <select
              {...form.register("modestyLevel")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>

          <Field label="Season">
            <select
              {...form.register("season")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
              <option value="FALL">Fall</option>
              <option value="WINTER">Winter</option>
              <option value="ALL_SEASON">All Season</option>
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
        <h2 className="text-2xl font-medium">Tags</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Style Tags">
            <Input
              {...form.register("styleTags")}
              placeholder="bridesmaid, elegant, flowy"
            />
          </Field>

          <Field label="Trend Tags">
            <Input
              {...form.register("trendTags")}
              placeholder="2026-trend, sage-green, viral"
            />
          </Field>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Tags comma separated daalo. Example: bridesmaid, elegant, flowy
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Merchandising Flags</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <CheckboxField
            label="Featured Item"
            checked={isFeatured}
            onChange={(checked) =>
              form.setValue("isFeatured", checked, { shouldValidate: true })
            }
          />

          <CheckboxField
            label="Trend Item"
            checked={isTrendItem}
            onChange={(checked) =>
              form.setValue("isTrendItem", checked, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Notes</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="AI Styling Notes">
            <textarea
              {...form.register("aiStylingNotes")}
              className="min-h-32 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="AI styling recommendation notes..."
            />
          </Field>

          <Field label="Merchandising Notes">
            <textarea
              {...form.register("merchandisingNotes")}
              className="min-h-32 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Internal merchandising notes..."
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
          {isSubmitting ? "Saving..." : "Save Style Data"}
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

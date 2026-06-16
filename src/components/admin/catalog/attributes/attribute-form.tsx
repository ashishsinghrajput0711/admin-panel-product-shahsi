"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { attributeSchema, type AttributeFormValues } from "./attribute-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttributeForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<AttributeFormValues>;
  onSubmit: (values: AttributeFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema) as Resolver<AttributeFormValues>,
    defaultValues: {
      name: "",
      slug: "",
      code: "",
      description: "",
      type: "TEXT",
      scope: "PRODUCT_AND_VARIANT",
      group: "PRODUCT",
      isRequired: false,
      isFilterable: false,
      isSearchable: false,
      isVariantDefining: false,
      isVariantOption: false,
      isSeoField: false,
      isFitEngineField: false,
      isStyleEngineField: false,
      isBulkUploadField: false,
      status: "ACTIVE",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-28">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Basic Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Attribute Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Color Family" />
          </Field>

          <Field label="Slug" error={form.formState.errors.slug?.message}>
            <Input {...form.register("slug")} placeholder="color-family" />
          </Field>

          <Field label="Code" error={form.formState.errors.code?.message}>
            <Input {...form.register("code")} placeholder="COLOR_FAMILY" />
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                {...form.register("description")}
                className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Attribute description..."
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Attribute Settings</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Type">
            <select
              {...form.register("type")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="SELECT">Select</option>
              <option value="MULTI_SELECT">Multi Select</option>
              <option value="COLOR">Color</option>
              <option value="SIZE">Size</option>
            </select>
          </Field>

          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="PRODUCT_AND_VARIANT">Product + Variant</option>
            </select>
          </Field>

          <Field label="Group">
            <select
              {...form.register("group")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="FIT">Fit</option>
              <option value="STYLE">Style</option>
              <option value="SEO">SEO</option>
              <option value="SEARCH">Search</option>
              <option value="MTO">MTO</option>
              <option value="RENTAL">Rental</option>
              <option value="RESALE">Resale</option>
              <option value="BASIC">Basic</option>
              <option value="SIZE">Size</option>
              <option value="COLOR">Color</option>
              <option value="FABRIC">Fabric</option>
              <option value="OCCASION">Occasion</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Usage Flags</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <CheckboxField
            label="Required"
            checked={Boolean(form.watch("isRequired"))}
            onChange={(checked) =>
              form.setValue("isRequired", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Filterable"
            checked={Boolean(form.watch("isFilterable"))}
            onChange={(checked) =>
              form.setValue("isFilterable", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Searchable"
            checked={Boolean(form.watch("isSearchable"))}
            onChange={(checked) =>
              form.setValue("isSearchable", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Variant Option"
            checked={Boolean(form.watch("isVariantOption"))}
            onChange={(checked) => {
              form.setValue("isVariantOption", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
              form.setValue("isVariantDefining", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />

          <CheckboxField
            label="SEO Field"
            checked={Boolean(form.watch("isSeoField"))}
            onChange={(checked) =>
              form.setValue("isSeoField", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Fit Engine Field"
            checked={Boolean(form.watch("isFitEngineField"))}
            onChange={(checked) =>
              form.setValue("isFitEngineField", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Style Engine Field"
            checked={Boolean(form.watch("isStyleEngineField"))}
            onChange={(checked) =>
              form.setValue("isStyleEngineField", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Bulk Upload Field"
            checked={Boolean(form.watch("isBulkUploadField"))}
            onChange={(checked) =>
              form.setValue("isBulkUploadField", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Ye flags decide karenge ki attribute filters, search, variants, SEO,
          fit engine, style engine aur bulk upload me use hoga ya nahi.
        </p>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Attribute"}
        </Button>
      </div>
    </form>
  );
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

      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
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

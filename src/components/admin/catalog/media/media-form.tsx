"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaSchema, type MediaFormValues } from "./media-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MediaForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<MediaFormValues>;
  onSubmit: (values: MediaFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema) as Resolver<MediaFormValues>,
    defaultValues: {
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      businessType: "SHAHSI",
      type: "IMAGE",
      url: "",
      thumbnailUrl: "",
      title: "",
      altText: "",
      fileName: "",
      mimeType: "",
      position: 0,
      isPrimary: false,
      status: "DRAFT",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const type = form.watch("type");
  const isPrimary = Boolean(form.watch("isPrimary"));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Media Target</h2>

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
        <h2 className="text-2xl font-medium">Media Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Media Type">
            <select
              {...form.register("type")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="THUMBNAIL">Thumbnail</option>
              <option value="LOOKBOOK">Lookbook</option>
              <option value="SIZE_GUIDE">Size Guide</option>
              <option value="FABRIC_SWATCH">Fabric Swatch</option>
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

          <Field label="Title">
            <Input {...form.register("title")} placeholder="Front view image" />
          </Field>

          <Field label="Position" error={form.formState.errors.position?.message}>
            <Input
              type="number"
              {...form.register("position", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Alt Text" error={form.formState.errors.altText?.message}>
              <Input
                {...form.register("altText")}
                placeholder="Sage green chiffon bridesmaid dress front view"
              />
            </Field>
          </div>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Selected media type:{" "}
          <span className="font-medium text-neutral-800">
            {type.replaceAll("_", " ")}
          </span>
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Media URL</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Media URL" error={form.formState.errors.url?.message}>
              <Input
                {...form.register("url")}
                placeholder="https://res.cloudinary.com/.../image.jpg"
              />
            </Field>
          </div>

          <Field
            label="Thumbnail URL"
            error={form.formState.errors.thumbnailUrl?.message}
          >
            <Input
              {...form.register("thumbnailUrl")}
              placeholder="https://res.cloudinary.com/.../thumb.jpg"
            />
          </Field>

          <Field label="File Name">
            <Input
              {...form.register("fileName")}
              placeholder="sage-dress-front.jpg"
            />
          </Field>

          <Field label="MIME Type">
            <Input {...form.register("mimeType")} placeholder="image/jpeg" />
          </Field>

          <CheckboxField
            label="Set as Primary Media"
            checked={isPrimary}
            onChange={(checked) =>
              form.setValue("isPrimary", checked, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Media"}
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

      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : null}
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
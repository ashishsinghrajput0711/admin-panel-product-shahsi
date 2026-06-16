"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fitDataSchema, type FitDataFormValues } from "./fit-data-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FitDataForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<FitDataFormValues>;
  onSubmit: (values: FitDataFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<FitDataFormValues>({
    resolver: zodResolver(fitDataSchema) as Resolver<FitDataFormValues>,
    defaultValues: {
      scope: "VARIANT",
      productId: "",
      variantId: "",
      businessType: "SHAHSI",
      sizeLabel: "",
      bustMeasurement: undefined,
      waistMeasurement: undefined,
      hipMeasurement: undefined,
      shoulderMeasurement: undefined,
      sleeveLength: undefined,
      garmentLength: undefined,
      inseamLength: undefined,
      minBust: undefined,
      maxBust: undefined,
      minWaist: undefined,
      maxWaist: undefined,
      minHip: undefined,
      maxHip: undefined,
      fitType: "REGULAR",
      stretchLevel: "NONE",
      silhouette: "A_LINE",
      customLengthAllowed: false,
      alterationAllowed: false,
      fitNotes: "",
      status: "DRAFT",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const customLengthAllowed = Boolean(form.watch("customLengthAllowed"));
  const alterationAllowed = Boolean(form.watch("alterationAllowed"));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Fit Data Target</h2>

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
        <h2 className="text-2xl font-medium">Garment Measurements</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field label="Size Label">
            <Input {...form.register("sizeLabel")} placeholder="XS / S / M / L" />
          </Field>

          <Field label="Bust">
            <Input
              type="number"
              step="0.01"
              {...form.register("bustMeasurement", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Waist">
            <Input
              type="number"
              step="0.01"
              {...form.register("waistMeasurement", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Hip">
            <Input
              type="number"
              step="0.01"
              {...form.register("hipMeasurement", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Shoulder">
            <Input
              type="number"
              step="0.01"
              {...form.register("shoulderMeasurement", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Sleeve Length">
            <Input
              type="number"
              step="0.01"
              {...form.register("sleeveLength", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Garment Length">
            <Input
              type="number"
              step="0.01"
              {...form.register("garmentLength", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Inseam Length">
            <Input
              type="number"
              step="0.01"
              {...form.register("inseamLength", {
                valueAsNumber: true,
              })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Recommended Body Range</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <Field label="Min Bust">
            <Input
              type="number"
              step="0.01"
              {...form.register("minBust", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Max Bust">
            <Input
              type="number"
              step="0.01"
              {...form.register("maxBust", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Min Waist">
            <Input
              type="number"
              step="0.01"
              {...form.register("minWaist", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Max Waist">
            <Input
              type="number"
              step="0.01"
              {...form.register("maxWaist", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Min Hip">
            <Input
              type="number"
              step="0.01"
              {...form.register("minHip", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Max Hip">
            <Input
              type="number"
              step="0.01"
              {...form.register("maxHip", {
                valueAsNumber: true,
              })}
            />
          </Field>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Ye ranges fit recommendation engine ke liye use hongi.
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Fit Classification</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field label="Fit Type">
            <select
              {...form.register("fitType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="RELAXED">Relaxed</option>
              <option value="REGULAR">Regular</option>
              <option value="FITTED">Fitted</option>
              <option value="BODYCON">Bodycon</option>
              <option value="OVERSIZED">Oversized</option>
            </select>
          </Field>

          <Field label="Stretch Level">
            <select
              {...form.register("stretchLevel")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="NONE">None</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>

          <Field label="Silhouette">
            <select
              {...form.register("silhouette")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="A_LINE">A-Line</option>
              <option value="MERMAID">Mermaid</option>
              <option value="SHEATH">Sheath</option>
              <option value="BALL_GOWN">Ball Gown</option>
              <option value="EMPIRE">Empire</option>
              <option value="STRAIGHT">Straight</option>
              <option value="FIT_AND_FLARE">Fit and Flare</option>
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
        <h2 className="text-2xl font-medium">Fit Rules</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <CheckboxField
            label="Custom Length Allowed"
            checked={customLengthAllowed}
            onChange={(checked) =>
              form.setValue("customLengthAllowed", checked, {
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Alteration Allowed"
            checked={alterationAllowed}
            onChange={(checked) =>
              form.setValue("alterationAllowed", checked, {
                shouldValidate: true,
              })
            }
          />
        </div>

        <div className="mt-6">
          <Field label="Fit Notes">
            <textarea
              {...form.register("fitNotes")}
              className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Example: Runs slightly small around waist, recommend one size up."
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
          {isSubmitting ? "Saving..." : "Save Fit Data"}
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
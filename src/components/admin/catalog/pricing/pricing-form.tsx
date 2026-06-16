"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pricingSchema, type PricingFormValues } from "./pricing-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const commerceTypeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "Made-to-Order",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

export function PricingForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<PricingFormValues>;
  onSubmit: (values: PricingFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema) as Resolver<PricingFormValues>,
    defaultValues: {
      name: "",
      code: "",
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      commerceType: "RETAIL",
      currency: "USD",
      basePrice: 0,
      discountType: "NONE",
      status: "DRAFT",
      effectiveFrom: "",
      effectiveTo: "",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const discountType = form.watch("discountType");
  const commerceType = form.watch("commerceType");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Basic Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Pricing Rule Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Summer Sale Pricing" />
          </Field>

          <Field label="Code" error={form.formState.errors.code?.message}>
            <Input {...form.register("code")} placeholder="SUMMER_SALE_2026" />
          </Field>

          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXPIRED">Expired</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {scope === "PRODUCT" ? (
            <Field label="Product ID">
              <Input {...form.register("productId")} placeholder="product_cuid" />
            </Field>
          ) : (
            <Field label="Variant ID">
              <Input {...form.register("variantId")} placeholder="variant_cuid" />
            </Field>
          )}

          <Field label="Commerce Type">
            <select
              {...form.register("commerceType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="RETAIL">Retail</option>
              <option value="MADE_TO_ORDER">Made-to-Order</option>
              <option value="RENTAL">Rental</option>
              <option value="RESALE">Resale</option>
            </select>
          </Field>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Selected commerce type:{" "}
          <span className="font-medium text-neutral-800">
            {commerceTypeLabels[commerceType]}
          </span>
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Prices</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Currency">
            <select
              {...form.register("currency")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>

          <Field label="Base Price" error={form.formState.errors.basePrice?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("basePrice", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Sale Price" error={form.formState.errors.salePrice?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("salePrice", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field
            label="Rental Price"
            error={form.formState.errors.rentalPrice?.message}
          >
            <Input
              type="number"
              step="0.01"
              {...form.register("rentalPrice", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field
            label="Resale Price"
            error={form.formState.errors.resalePrice?.message}
          >
            <Input
              type="number"
              step="0.01"
              {...form.register("resalePrice", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="MTO Price" error={form.formState.errors.mtoPrice?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("mtoPrice", {
                valueAsNumber: true,
              })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Discount</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Discount Type">
            <select
              {...form.register("discountType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="NONE">No Discount</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
            </select>
          </Field>

          {discountType !== "NONE" && (
            <Field
              label="Discount Value"
              error={form.formState.errors.discountValue?.message}
            >
              <Input
                type="number"
                step="0.01"
                {...form.register("discountValue", {
                  valueAsNumber: true,
                })}
                placeholder={discountType === "PERCENTAGE" ? "10" : "50"}
              />
            </Field>
          )}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Effective Dates</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Effective From">
            <Input type="date" {...form.register("effectiveFrom")} />
          </Field>

          <Field label="Effective To">
            <Input type="date" {...form.register("effectiveTo")} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Pricing Rule"}
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
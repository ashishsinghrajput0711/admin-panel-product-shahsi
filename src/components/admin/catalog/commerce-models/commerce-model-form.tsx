"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  commerceModelSchema,
  type CommerceModelFormValues,
} from "./commerce-model-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommerceModelForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<CommerceModelFormValues>;
  onSubmit: (values: CommerceModelFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<CommerceModelFormValues>({
    resolver: zodResolver(
      commerceModelSchema
    ) as Resolver<CommerceModelFormValues>,
    defaultValues: {
      name: "",
      code: "",
      type: "RETAIL",
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      categoryId: "",
      businessType: "SHAHSI",
      isEnabled: true,
      returnWindowDays: 7,
      productionLeadTimeDays: 0,
      rushAllowed: false,
      rushFee: 0,
      rentalDurationDays: 4,
      rentalDepositAmount: 0,
      lateFeePerDay: 0,
      cleaningFee: 0,
      resaleCommissionPercent: 0,
      sellerPayoutPercent: 0,
      minOrderQuantity: 1,
      maxOrderQuantity: 0,
      status: "DRAFT",
      ...defaultValues,
    },
  });

  const type = form.watch("type");
  const scope = form.watch("scope");
  const isEnabled = Boolean(form.watch("isEnabled"));
  const rushAllowed = Boolean(form.watch("rushAllowed"));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Basic Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Model Name" error={form.formState.errors.name?.message}>
            <Input
              {...form.register("name")}
              placeholder="Standard Rental Rules"
            />
          </Field>

          <Field label="Code" error={form.formState.errors.code?.message}>
            <Input {...form.register("code")} placeholder="RENTAL_STANDARD" />
          </Field>

          <Field label="Commerce Type">
            <select
              {...form.register("type")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="RETAIL">Retail</option>
              <option value="MADE_TO_ORDER">Made-to-Order</option>
              <option value="RENTAL">Rental</option>
              <option value="RESALE">Resale</option>
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

          <Field label="Business Type">
            <select
              {...form.register("businessType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>
          </Field>

          <CheckboxField
            label="Enable Commerce Model"
            checked={isEnabled}
            onChange={(checked) =>
              form.setValue("isEnabled", checked, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="CATEGORY">Category</option>
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
              <Input
                {...form.register("categoryId")}
                placeholder="category_cuid"
              />
            </Field>
          )}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Availability Rules</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Return Window Days">
            <Input
              type="number"
              {...form.register("returnWindowDays", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Min Order Quantity">
            <Input
              type="number"
              {...form.register("minOrderQuantity", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Max Order Quantity">
            <Input
              type="number"
              {...form.register("maxOrderQuantity", {
                valueAsNumber: true,
              })}
            />
          </Field>
        </div>
      </section>

      {type === "MADE_TO_ORDER" && (
        <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-medium">Made-to-Order Rules</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Production Lead Time Days">
              <Input
                type="number"
                {...form.register("productionLeadTimeDays", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <CheckboxField
              label="Rush Allowed"
              checked={rushAllowed}
              onChange={(checked) =>
                form.setValue("rushAllowed", checked, { shouldValidate: true })
              }
            />

            {rushAllowed && (
              <Field label="Rush Fee">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("rushFee", {
                    valueAsNumber: true,
                  })}
                />
              </Field>
            )}
          </div>
        </section>
      )}

      {type === "RENTAL" && (
        <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-medium">Rental Rules</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Field label="Rental Duration Days">
              <Input
                type="number"
                {...form.register("rentalDurationDays", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field label="Rental Deposit Amount">
              <Input
                type="number"
                step="0.01"
                {...form.register("rentalDepositAmount", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field label="Late Fee Per Day">
              <Input
                type="number"
                step="0.01"
                {...form.register("lateFeePerDay", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field label="Cleaning Fee">
              <Input
                type="number"
                step="0.01"
                {...form.register("cleaningFee", {
                  valueAsNumber: true,
                })}
              />
            </Field>
          </div>
        </section>
      )}

      {type === "RESALE" && (
        <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-medium">Resale Rules</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Resale Commission %">
              <Input
                type="number"
                step="0.01"
                {...form.register("resaleCommissionPercent", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field label="Seller Payout %">
              <Input
                type="number"
                step="0.01"
                {...form.register("sellerPayoutPercent", {
                  valueAsNumber: true,
                })}
              />
            </Field>
          </div>
        </section>
      )}

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Commerce Model"}
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
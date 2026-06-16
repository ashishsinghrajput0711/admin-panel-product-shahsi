"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventorySchema, type InventoryFormValues } from "./inventory-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InventoryForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<InventoryFormValues>;
  onSubmit: (values: InventoryFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema) as Resolver<InventoryFormValues>,
    defaultValues: {
      scope: "VARIANT",
      productId: "",
      variantId: "",
      businessType: "SHAHSI",
      warehouseName: "",
      locationCode: "",
      totalStock: 0,
      reservedStock: 0,
      lowStockThreshold: 5,
      rentalAvailableStock: 0,
      damagedStock: 0,
      holdStock: 0,
      restockDate: "",
      status: "IN_STOCK",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const totalStock = Number(form.watch("totalStock") ?? 0);
  const reservedStock = Number(form.watch("reservedStock") ?? 0);
  const damagedStock = Number(form.watch("damagedStock") ?? 0);
  const holdStock = Number(form.watch("holdStock") ?? 0);

  const availableStock = Math.max(
    totalStock - reservedStock - damagedStock - holdStock,
    0
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Inventory Target</h2>

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
        <h2 className="text-2xl font-medium">Warehouse Location</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Warehouse Name"
            error={form.formState.errors.warehouseName?.message}
          >
            <Input
              {...form.register("warehouseName")}
              placeholder="Main Warehouse"
            />
          </Field>

          <Field label="Location Code">
            <Input {...form.register("locationCode")} placeholder="A1-R2-B05" />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Stock Levels</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field
            label="Total Stock"
            error={form.formState.errors.totalStock?.message}
          >
            <Input
              type="number"
              {...form.register("totalStock", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field
            label="Reserved Stock"
            error={form.formState.errors.reservedStock?.message}
          >
            <Input
              type="number"
              {...form.register("reservedStock", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Damaged Stock">
            <Input
              type="number"
              {...form.register("damagedStock", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Hold Stock">
            <Input
              type="number"
              {...form.register("holdStock", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Rental Available Stock">
            <Input
              type="number"
              {...form.register("rentalAvailableStock", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field
            label="Low Stock Threshold"
            error={form.formState.errors.lowStockThreshold?.message}
          >
            <Input
              type="number"
              {...form.register("lowStockThreshold", {
                valueAsNumber: true,
              })}
            />
          </Field>

          <Field label="Calculated Available Stock">
            <Input value={availableStock} readOnly />
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="DAMAGED">Damaged</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Available stock auto calculate ho raha hai: total - reserved - damaged
          - hold.
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Restock Planning</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Restock Date">
            <Input type="date" {...form.register("restockDate")} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Inventory"}
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
"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { InventoryForm } from "@/components/admin/catalog/inventory/inventory-form";
import type { InventoryFormValues } from "@/components/admin/catalog/inventory/inventory-schema";

export default function NewInventoryPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: InventoryFormValues) {
    mutate({
      resource: "inventory",
      values,
      successNotification: {
        message: "Inventory created successfully",
        description: "The inventory record has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Inventory create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/inventory"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Inventory
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Create Inventory
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Add inventory stock, warehouse location, reserved quantities, rental
          availability and restock planning.
        </p>
      </div>

      <InventoryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
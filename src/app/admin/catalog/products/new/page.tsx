"use client";

import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/catalog/products/product-form";
import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";

export default function NewProductPage() {
  const createMutation = useCreate();
  const { mutate } = createMutation;

  const isSubmitting =
    "isLoading" in createMutation
      ? Boolean(createMutation.isLoading)
      : "isPending" in createMutation
        ? Boolean(createMutation.isPending)
        : false;

  function handleSubmit(values: ProductFormValues) {
    mutate({
      resource: "products",
      values,
      successNotification: {
        message: "Product created successfully",
        description: "The product has been saved in catalog.",
        type: "success",
      },
      errorNotification: {
        message: "Product create failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

    return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/catalog/products"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to products
            </Link>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Admin / Catalog / Products
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Create Product
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Add product identity, category, commerce, pricing and SEO data.
            </p>
          </div>
        </div>

        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </main>
  );
}
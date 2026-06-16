"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductVariantsSection } from "@/components/admin/catalog/variants/product-variants-section";

export default function ProductVariantsPage() {
  const params = useParams<{ productId: string }>();
  const productId = String(params?.productId ?? "");

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <section className="mt-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Admin / Catalog / Product Variants
          </p>

          <h1 className="mt-4 text-5xl font-medium tracking-tight text-neutral-950">
            Product Variants
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            Selected product ke variants manage karo.
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Product ID: <span className="font-medium">{productId}</span>
          </p>
        </section>

        <div className="mt-8">
          <ProductVariantsSection productId={productId} />
        </div>
      </div>
    </main>
  );
}
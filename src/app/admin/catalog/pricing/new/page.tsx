"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductPageMotion } from "@/components/admin/catalog/products/product-page-motion";
import {
  createPricingRule,
  type DynamicPricingRulePayload,
} from "@/lib/admin/dynamic-pricing-api";
import { PricingForm } from "@/components/admin/catalog/pricing/pricing-form";

export default function NewPricingRulePage() {
  const router = useRouter();

  async function handleSubmit(values: DynamicPricingRulePayload) {
    await createPricingRule(values);
    router.push("/admin/catalog/pricing");
    router.refresh();
  }

 return (
  <ProductPageMotion className="min-h-screen">
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pricing
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Pricing
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          New Pricing Rule
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Create a dynamic pricing rule for Shop, Rental, Resale, MTO or
          Subscription commerce flows.
        </p>
      </div>

      <PricingForm submitLabel="Create Pricing Rule" onSubmit={handleSubmit} />
       </main>
  </ProductPageMotion>
);
}
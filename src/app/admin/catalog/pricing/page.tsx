"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, SlidersHorizontal } from "lucide-react";

import { ProductPageMotion } from "@/components/admin/catalog/products/product-page-motion";

import { PricingSimulator } from "@/components/admin/catalog/pricing/pricing-simulator";

import {
  deletePricingRule,
  getPricingRules,
  unwrapPricingRules,
} from "@/lib/admin/dynamic-pricing-api";
import type { DynamicPricingRule } from "@/components/admin/catalog/pricing/pricing-types";
import {
  ADJUSTMENT_TYPES,
  COMMERCE_TYPES,
  PRICING_SCOPES,
  formatPricingLabel,
} from "@/components/admin/catalog/pricing/pricing-types";
import { PricingTable } from "@/components/admin/catalog/pricing/pricing-table";

export default function PricingPage() {
  const [rules, setRules] = useState<DynamicPricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [commerceType, setCommerceType] = useState("");
  const [scope, setScope] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("");
  const [isActive, setIsActive] = useState("");

  async function loadPricingRules() {
    try {
      setIsLoading(true);
      setError("");

      const response = await getPricingRules({
        commerceType,
        scope,
        adjustmentType,
        isActive,
      });

      setRules(unwrapPricingRules(response));
    } catch (err: any) {
      console.error("Pricing rules load failed:", err);
      setError(err?.message || "Pricing rules load failed.");
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPricingRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commerceType, scope, adjustmentType, isActive]);

  const stats = useMemo(() => {
    const active = rules.filter((rule) => rule.isActive !== false).length;
    const rental = rules.filter((rule) => rule.commerceType === "RENTAL").length;
    const shop = rules.filter((rule) => rule.commerceType === "SHOP").length;

    return {
      total: rules.length,
      active,
      rental,
      shop,
    };
  }, [rules]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete / soft delete this pricing rule?",
    );

    if (!confirmed) return;

    try {
      await deletePricingRule(id);
      await loadPricingRules();
    } catch (err: any) {
      console.error("Pricing rule delete failed:", err);
      alert(err?.message || "Pricing rule delete failed.");
    }
  }

  function clearFilters() {
    setCommerceType("");
    setScope("");
    setAdjustmentType("");
    setIsActive("");
  }

  return (
  <ProductPageMotion className="min-h-screen">
    <main className="min-h-screen bg-[#fbfaf6] p-6">
   <section
  data-product-section
  className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white"
>
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Pricing
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Dynamic Pricing
            </h1>

            <p className="mt-4 max-w-2xl text-white/70">
              Manage pricing rules for Shop, Rental, Resale, Made-to-Order and
              Subscription flows.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadPricingRules}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/admin/catalog/pricing/new"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-neutral-950 transition hover:bg-white/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Pricing Rule
            </Link>
          </div>
        </div>
      </section>

<section
  data-product-section
  className="mb-6 grid gap-4 md:grid-cols-4"
>
        <StatCard label="Total Rules" value={stats.total} />
        <StatCard label="Active Rules" value={stats.active} />
        <StatCard label="Rental Rules" value={stats.rental} />
        <StatCard label="Shop Rules" value={stats.shop} />
      </section>

     <section
  data-product-section
  className="mb-6 rounded-[1.5rem] border border-neutral-200 bg-white p-5"
>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 text-lg font-medium text-neutral-950">
      <SlidersHorizontal className="h-4 w-4" />
      Filters
    </h2>

    <button
      type="button"
      onClick={clearFilters}
      className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
    >
      Clear Filters
    </button>
  </div>

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <FilterSelect
      label="Commerce Type"
      value={commerceType}
      onChange={setCommerceType}
      options={COMMERCE_TYPES}
    />

    <FilterSelect
      label="Scope"
      value={scope}
      onChange={setScope}
      options={PRICING_SCOPES}
    />

    <FilterSelect
      label="Adjustment Type"
      value={adjustmentType}
      onChange={setAdjustmentType}
      options={ADJUSTMENT_TYPES}
    />

    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        Status
      </span>

      <select
        value={isActive}
        onChange={(event) => setIsActive(event.target.value)}
        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
      >
        <option value="">All</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </label>
  </div>
</section>

<div data-product-section>
  <PricingSimulator />
</div>

<section data-product-section className="w-full">
  {error ? (
    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  ) : null}

  <PricingTable
    rules={rules}
    isLoading={isLoading}
    onDelete={handleDelete}
  />
</section>
      </main>
  </ProductPageMotion>
);
}

function StatCard({ label, value }: { label: string; value: number }) {
return (
  <article
    data-product-section
    className="group rounded-[1.5rem] border border-neutral-200 bg-white p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_18px_45px_rgba(15,15,15,0.08)]"
  >
    <p className="text-sm text-neutral-500 transition-colors duration-300 group-hover:text-neutral-700">
      {label}
    </p>

    <p className="mt-2 text-3xl font-semibold text-neutral-950 transition-transform duration-300 group-hover:translate-x-1">
      {value}
    </p>
  </article>
);
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatPricingLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import {
  deletePricingRule,
  getPricingRuleById,
  unwrapPricingRule,
  updatePricingRule,
  type DynamicPricingRule,
  type DynamicPricingRulePayload,
} from "@/lib/admin/dynamic-pricing-api";
import {
  PricingForm,
  type PricingFormValues,
} from "@/components/admin/catalog/pricing/pricing-form";

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function getTargetId(rule: DynamicPricingRule | null) {
  if (!rule) return "";

  return (
    rule.productId ||
    rule.productVariantId ||
    rule.categoryId ||
    rule.locationId ||
    rule.warehouseId ||
    ""
  );
}

function mapRuleToFormValues(
  rule: DynamicPricingRule,
): Partial<PricingFormValues> {
  return {
    name: rule.name || "",
    description: rule.description || "",
    commerceType: rule.commerceType || "SHOP",
    scope: rule.scope || "GLOBAL",
    targetId: getTargetId(rule),
    adjustmentType: rule.adjustmentType || "FIXED",
    adjustmentValue:
      rule.adjustmentValue !== undefined && rule.adjustmentValue !== null
        ? String(rule.adjustmentValue)
        : "",
    minBasePrice:
      rule.minBasePrice !== undefined && rule.minBasePrice !== null
        ? String(rule.minBasePrice)
        : "",
    maxBasePrice:
      rule.maxBasePrice !== undefined && rule.maxBasePrice !== null
        ? String(rule.maxBasePrice)
        : "",
    priority:
      rule.priority !== undefined && rule.priority !== null
        ? String(rule.priority)
        : "0",
    isActive: rule.isActive !== false,
    startsAt: toDateTimeLocal(rule.startsAt),
    endsAt: toDateTimeLocal(rule.endsAt),
    conditionsText: rule.conditions
      ? JSON.stringify(rule.conditions, null, 2)
      : "",
  };
}

export default function EditPricingRulePage() {
  const params = useParams();
  const router = useRouter();

  const pricingRuleId = String(params?.id || "").trim();

  const [rule, setRule] = useState<DynamicPricingRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRule() {
    if (!pricingRuleId) {
      setError("Pricing rule ID missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await getPricingRuleById(pricingRuleId);
      const pricingRule = unwrapPricingRule(response);

      if (!pricingRule?.id) {
        throw new Error("Pricing rule detail response invalid hai.");
      }

      setRule(pricingRule);
    } catch (err: any) {
      console.error("Pricing rule detail load failed:", err);
      setError(err?.message || "Pricing rule detail load failed.");
      setRule(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingRuleId]);

  const formValues = useMemo(() => {
    if (!rule) return undefined;
    return mapRuleToFormValues(rule);
  }, [rule]);

  async function handleSubmit(values: DynamicPricingRulePayload) {
    if (!pricingRuleId) return;

    await updatePricingRule(pricingRuleId, values);

    router.push("/admin/catalog/pricing");
    router.refresh();
  }

  async function handleDelete() {
    if (!pricingRuleId) return;

    const confirmed = window.confirm(
      "Delete / soft delete this pricing rule?",
    );

    if (!confirmed) return;

    try {
      await deletePricingRule(pricingRuleId);
      router.push("/admin/catalog/pricing");
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Pricing rule delete failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
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
            Edit Pricing Rule
          </h1>

          <p className="mt-3 max-w-2xl text-neutral-500">
            Update dynamic pricing rule configuration.
          </p>
        </div>

        {rule ? (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-11 items-center justify-center rounded-full border border-red-200 bg-white px-5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Rule
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
          Loading pricing rule...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && rule && formValues ? (
        <PricingForm
          initialValues={formValues}
          submitLabel="Update Pricing Rule"
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  );
}
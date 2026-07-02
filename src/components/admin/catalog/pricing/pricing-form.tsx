"use client";

import { useState } from "react";

import { PricingVariantPicker } from "./pricing-variant-picker";
import {
  ADJUSTMENT_TYPES,
  COMMERCE_TYPES,
  PRICING_SCOPES,
  formatPricingLabel,
  type AdjustmentType,
  type CommerceType,
  type PricingScope,
} from "./pricing-types";
import type { DynamicPricingRulePayload } from "@/lib/admin/dynamic-pricing-api";

import { PricingCategoryPicker } from "./pricing-category-picker";

import { PricingProductPicker } from "./pricing-product-picker";

export type PricingFormValues = {
  name: string;
  description: string;
  commerceType: CommerceType;
  scope: PricingScope;
  targetId: string;
  adjustmentType: AdjustmentType;
  adjustmentValue: string;
  minBasePrice: string;
  maxBasePrice: string;
  priority: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  conditionsText: string;
};

const defaultValues: PricingFormValues = {
  name: "",
  description: "",
  commerceType: "SHOP",
  scope: "GLOBAL",
  targetId: "",
  adjustmentType: "FIXED",
  adjustmentValue: "",
  minBasePrice: "",
  maxBasePrice: "",
  priority: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
  conditionsText: "",
};

export function PricingForm({
  initialValues,
  submitLabel = "Save Pricing Rule",
  onSubmit,
}: {
  initialValues?: Partial<PricingFormValues>;
  submitLabel?: string;
  onSubmit: (values: DynamicPricingRulePayload) => Promise<void> | void;
}) {
  const [values, setValues] = useState<PricingFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateValue<K extends keyof PricingFormValues>(
    key: K,
    value: PricingFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

function buildPayload(): DynamicPricingRulePayload {
  const adjustmentValue = Number(values.adjustmentValue);
  const priority = Number(values.priority || 0);

  if (!values.name.trim()) {
    throw new Error("Rule name required hai.");
  }

  if (!Number.isFinite(adjustmentValue)) {
    throw new Error("Adjustment value valid number hona chahiye.");
  }

  if (values.scope !== "GLOBAL" && !values.targetId.trim()) {
    throw new Error(`${values.scope} scope ke liye target ID required hai.`);
  }

 let conditions: Record<string, unknown> = {};

if (values.conditionsText.trim()) {
  try {
    const parsed = JSON.parse(values.conditionsText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }

    conditions = parsed as Record<string, unknown>;
  } catch {
    throw new Error("Conditions JSON valid object hona chahiye.");
  }
}

  const minBasePrice = values.minBasePrice.trim()
    ? Number(values.minBasePrice)
    : null;

  const maxBasePrice = values.maxBasePrice.trim()
    ? Number(values.maxBasePrice)
    : null;

  const payload: DynamicPricingRulePayload = {
    name: values.name.trim(),
    description: values.description.trim() || null,
    commerceType: values.commerceType,
    scope: values.scope,
    adjustmentType: values.adjustmentType,
    adjustmentValue,
    priority: Number.isFinite(priority) ? priority : 0,
    isActive: values.isActive,
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    minBasePrice:
      minBasePrice !== null && Number.isFinite(minBasePrice)
        ? minBasePrice
        : null,
    maxBasePrice:
      maxBasePrice !== null && Number.isFinite(maxBasePrice)
        ? maxBasePrice
        : null,
    conditions,
  };

  if (values.scope === "PRODUCT") {
    payload.productId = values.targetId.trim();
  }

  if (values.scope === "VARIANT") {
    payload.productVariantId = values.targetId.trim();
  }

  if (values.scope === "CATEGORY") {
    payload.categoryId = values.targetId.trim();
  }

  if (values.scope === "LOCATION") {
    payload.locationId = values.targetId.trim();
  }

  if (values.scope === "WAREHOUSE") {
    payload.warehouseId = values.targetId.trim();
  }

Object.keys(payload).forEach((key) => {
  const value = payload[key as keyof typeof payload];

  if (key === "conditions") {
    return;
  }

  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      value &&
      Object.keys(value).length === 0)
  ) {
    delete payload[key as keyof typeof payload];
  }
});

return payload;

  
}

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");

      const payload = buildPayload();

      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || "Pricing rule save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-medium">Basic Rule</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Rule Name">
            <input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder="Weekend Rental Price Increase"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </Field>

          <Field label="Priority">
            <input
              type="number"
              value={values.priority}
              onChange={(event) => updateValue("priority", event.target.value)}
              placeholder="10"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </Field>
        </div>
      </section>

      <Field label="Description">
  <input
    value={values.description}
    onChange={(event) => updateValue("description", event.target.value)}
    placeholder="Increase rental price for weekends"
    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
  />
</Field>

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-medium">Commerce + Scope</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Commerce Type">
            <select
              value={values.commerceType}
              onChange={(event) =>
                updateValue("commerceType", event.target.value as CommerceType)
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              {COMMERCE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {formatPricingLabel(item)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scope">
            <select
              value={values.scope}
              onChange={(event) =>
                updateValue("scope", event.target.value as PricingScope)
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              {PRICING_SCOPES.map((item) => (
                <option key={item} value={item}>
                  {formatPricingLabel(item)}
                </option>
              ))}
            </select>
          </Field>

       <Field label="Target ID">
  <div className="space-y-2">
    <input
      value={values.targetId}
      onChange={(event) => updateValue("targetId", event.target.value)}
      disabled={values.scope === "GLOBAL"}
      placeholder={
        values.scope === "GLOBAL"
          ? "Not required for global"
          : values.scope === "PRODUCT"
            ? "Product ID"
            : values.scope === "VARIANT"
              ? "Product Variant ID"
              : values.scope === "CATEGORY"
                ? "Category ID or slug"
                : values.scope === "LOCATION"
                  ? "Location ID"
                  : "Warehouse ID"
      }
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"
    />

    {values.scope === "PRODUCT" ? (
      <PricingProductPicker
        value={values.targetId}
        onSelect={(product) => updateValue("targetId", product.id)}
      />
    ) : null}

  


    {values.scope === "VARIANT" ? (
  <PricingVariantPicker
    value={values.targetId}
    onSelect={(variant) => updateValue("targetId", variant.id)}
  />
) : null}


  {values.scope === "CATEGORY" ? (
  <PricingCategoryPicker
    value={values.targetId}
    onSelect={(category) =>
      updateValue("targetId", category.id || category.slug || "")
    }
  />
) : null}
  </div>
</Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-medium">Adjustment</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Adjustment Type">
            <select
              value={values.adjustmentType}
              onChange={(event) =>
                updateValue(
                  "adjustmentType",
                  event.target.value as AdjustmentType,
                )
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              {ADJUSTMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {formatPricingLabel(item)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Adjustment Value">
            <input
              type="number"
              step="0.01"
              value={values.adjustmentValue}
              onChange={(event) =>
                updateValue("adjustmentValue", event.target.value)
              }
              placeholder={
                values.adjustmentType === "PERCENTAGE"
                  ? "15 means 15%"
                  : values.adjustmentType === "MULTIPLIER"
                    ? "1.2 means 1.2x"
                    : "Amount"
              }
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </Field>


          <Field label="Min Base Price">
  <input
    type="number"
    step="0.01"
    value={values.minBasePrice}
    onChange={(event) => updateValue("minBasePrice", event.target.value)}
    placeholder="1000"
    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
  />
</Field>

<Field label="Max Base Price">
  <input
    type="number"
    step="0.01"
    value={values.maxBasePrice}
    onChange={(event) => updateValue("maxBasePrice", event.target.value)}
    placeholder="100000"
    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
  />
</Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-medium">Schedule + Status</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Starts At">
            <input
              type="datetime-local"
              value={values.startsAt}
              onChange={(event) => updateValue("startsAt", event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </Field>

          <Field label="Ends At">
            <input
              type="datetime-local"
              value={values.endsAt}
              onChange={(event) => updateValue("endsAt", event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </Field>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-medium">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => updateValue("isActive", event.target.checked)}
            className="h-4 w-4"
          />
          Active Rule
        </label>
      </section>

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
        <h2 className="text-2xl font-medium">Conditions JSON</h2>

        <p className="mt-2 text-sm text-neutral-500">
          Weekend / rental duration conditions yahan JSON format me daal sakte ho.
        </p>

        <textarea
          value={values.conditionsText}
          onChange={(event) => updateValue("conditionsText", event.target.value)}
          placeholder={`{\n  "daysOfWeek": ["SATURDAY", "SUNDAY"]\n}`}
          className="mt-5 min-h-40 w-full rounded-xl border border-neutral-200 px-3 py-3 font-mono text-sm outline-none focus:border-neutral-950"
        />
      </section>

      <div className="sticky bottom-4 rounded-full bg-neutral-950 p-3 text-right shadow-xl">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-neutral-950 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  );
}
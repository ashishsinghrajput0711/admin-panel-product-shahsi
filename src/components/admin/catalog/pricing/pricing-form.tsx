"use client";

import { useState } from "react";

import { CalendarDays, Plus, Tag, X } from "lucide-react";

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

conditionDays: PricingDay[];
conditionTags: string[];

/*
 * Edit page se existing backend conditions JSON isi field mein aati rahegi.
 * UI mein raw JSON show nahi karenge.
 */
conditionsText: string;
};

const PRICING_DAYS = [
  { value: "MONDAY", label: "Mon", fullLabel: "Monday" },
  { value: "TUESDAY", label: "Tue", fullLabel: "Tuesday" },
  { value: "WEDNESDAY", label: "Wed", fullLabel: "Wednesday" },
  { value: "THURSDAY", label: "Thu", fullLabel: "Thursday" },
  { value: "FRIDAY", label: "Fri", fullLabel: "Friday" },
  { value: "SATURDAY", label: "Sat", fullLabel: "Saturday" },
  { value: "SUNDAY", label: "Sun", fullLabel: "Sunday" },
] as const;

type PricingDay = (typeof PRICING_DAYS)[number]["value"];

function parseConditionsText(value?: string) {
  if (!value?.trim()) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(value);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Existing invalid JSON ko structured UI mein expose nahi karenge.
  }

  return {} as Record<string, unknown>;
}

function getConditionDays(
  conditions: Record<string, unknown>,
): PricingDay[] {
  const rawDays = Array.isArray(conditions.daysOfWeek)
    ? conditions.daysOfWeek
    : [];

  const allowedDays = new Set<string>(
    PRICING_DAYS.map((day) => day.value),
  );

  return rawDays
    .map((day) => String(day).trim().toUpperCase())
    .filter(
      (day): day is PricingDay =>
        allowedDays.has(day),
    );
}

function getConditionTags(
  conditions: Record<string, unknown>,
) {
  const rawTags = Array.isArray(conditions.tags)
    ? conditions.tags
    : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

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
conditionDays: [],
conditionTags: [],
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
const [values, setValues] = useState<PricingFormValues>(() => {
  const mergedValues = {
    ...defaultValues,
    ...initialValues,
  };

  const savedConditions = parseConditionsText(
    mergedValues.conditionsText,
  );

  return {
    ...mergedValues,
    conditionDays: getConditionDays(savedConditions),
    conditionTags: getConditionTags(savedConditions),
  };
});

const [conditionTagInput, setConditionTagInput] = useState("");
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
function toggleConditionDay(day: PricingDay) {
  setValues((current) => {
    const alreadySelected =
      current.conditionDays.includes(day);

    return {
      ...current,
      conditionDays: alreadySelected
        ? current.conditionDays.filter(
            (selectedDay) => selectedDay !== day,
          )
        : [...current.conditionDays, day],
    };
  });
}

function addConditionTag() {
  const cleanTag = conditionTagInput.trim();

  if (!cleanTag) {
    return;
  }

  setValues((current) => {
    const alreadyExists = current.conditionTags.some(
      (tag) =>
        tag.toLowerCase() === cleanTag.toLowerCase(),
    );

    if (alreadyExists) {
      return current;
    }

    return {
      ...current,
      conditionTags: [
        ...current.conditionTags,
        cleanTag,
      ],
    };
  });

  setConditionTagInput("");
}

function removeConditionTag(tagToRemove: string) {
  setValues((current) => ({
    ...current,
    conditionTags: current.conditionTags.filter(
      (tag) => tag !== tagToRemove,
    ),
  }));
}

function clearConditions() {
  setValues((current) => ({
    ...current,
    conditionDays: [],
    conditionTags: [],
  }));

  setConditionTagInput("");
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

/*
 * Existing backend object ke unknown keys preserve rahenge.
 * Sirf daysOfWeek aur tags clean UI controls se manage honge.
 */
const savedConditions = parseConditionsText(
  values.conditionsText,
);

const {
  daysOfWeek: _savedDays,
  tags: _savedTags,
  ...preservedConditions
} = savedConditions;

const conditions: Record<string, unknown> = {
  ...preservedConditions,
};

if (values.conditionDays.length > 0) {
  conditions.daysOfWeek = values.conditionDays;
}

if (values.conditionTags.length > 0) {
  conditions.tags = values.conditionTags;
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

    <section
  data-product-section
  className="rounded-[1.5rem] border border-neutral-200 bg-white p-6"
>
  <div>
    <h2 className="text-2xl font-medium text-neutral-950">
      Rule Conditions
    </h2>

    <p className="mt-2 text-sm leading-6 text-neutral-500">
      Optional conditions select karo. Koi condition select nahi hogi to
      rule selected scope par normally apply hoga.
    </p>
  </div>

  <div className="mt-6">
    <p className="text-sm font-medium text-neutral-800">
      Apply on specific days
    </p>

    <p className="mt-1 text-xs text-neutral-500">
      Selected days par hi pricing rule apply hoga.
    </p>

   <div className="mt-3 flex flex-wrap gap-2">
  {PRICING_DAYS.map((day) => {
    const isSelected = values.conditionDays.includes(day.value);

    return (
      <button
        key={day.value}
        type="button"
        onClick={() => toggleConditionDay(day.value)}
        aria-pressed={isSelected}
        title={day.fullLabel}
        className={[
          "inline-flex h-10 min-w-14 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all duration-200 active:scale-95",
          isSelected
            ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50",
        ].join(" ")}
      >
        {day.label}
      </button>
    );
  })}
</div>
  </div>

  <div className="mt-7 border-t border-neutral-100 pt-6">
    <p className="text-sm font-medium text-neutral-800">
      Required product tags
    </p>

    <p className="mt-1 text-xs text-neutral-500">
      Rule sirf matching product tags ke liye apply hoga.
    </p>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        value={conditionTagInput}
        onChange={(event) => setConditionTagInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addConditionTag();
          }
        }}
        placeholder="Example: bridal, premium"
        className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-950"
      />

      <button
        type="button"
        onClick={addConditionTag}
        disabled={!conditionTagInput.trim()}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add tag
      </button>
    </div>

  {values.conditionTags.length > 0 ? (
  <div className="mt-4 flex flex-wrap gap-2">
    {values.conditionTags.map((tag) => (
      <span
        key={tag}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfaf6] pl-4 pr-2 text-sm text-neutral-700"
      >
        {tag}

        <button
          type="button"
          onClick={() => removeConditionTag(tag)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white hover:text-red-600"
          aria-label={`Remove ${tag} tag`}
          title={`Remove ${tag}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    ))}
  </div>
) : (
  <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-[#fbfaf6] px-4 py-3 text-sm text-neutral-500">
    No product tags selected.
  </div>
)}
  </div>

{values.conditionDays.length === 0 &&
values.conditionTags.length === 0 ? (
    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      No conditions selected — rule selected scope ke sab eligible records par
      apply hoga.
    </div>
  ) : null}
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
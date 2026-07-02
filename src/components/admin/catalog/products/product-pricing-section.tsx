"use client";

import { useMemo, useState } from "react";

import {
  updateCatalogProductPricing,
  type ProductPricingPayload,
} from "@/lib/admin/dynamic-pricing-api";

type ProductPricingSectionProps = {
  productId: string;
  values: any;
  onSaved?: (pricing: ProductPricingPayload) => void;
};

function getInitialNumberValue(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;

    const numberValue = Number(value);

    if (Number.isFinite(numberValue)) {
      return String(numberValue);
    }
  }

  return "";
}

function getNumberOrNull(value: string) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : null;
}

export function ProductPricingSection({
  productId,
  values,
  onSaved,
}: ProductPricingSectionProps) {
  const initialPricing = useMemo(() => {
    const pricing = values?.pricing || values?.productPricing || {};

    return {
      currency: String(
        pricing?.currency || values?.currency || "INR",
      ).toUpperCase(),

      basePrice: getInitialNumberValue(
        pricing?.basePrice,
        pricing?.price,
        values?.basePrice,
        values?.price,
      ),

      compareAtPrice: getInitialNumberValue(
        pricing?.compareAtPrice,
        pricing?.comparePrice,
        values?.compareAtPrice,
        values?.comparePrice,
      ),

      discountPercent: getInitialNumberValue(
        pricing?.discountPercent,
        values?.discountPercent,
      ),

      rentalPrice: getInitialNumberValue(
        pricing?.rentalPrice,
        values?.rentalPrice,
      ),

      resalePrice: getInitialNumberValue(
        pricing?.resalePrice,
        values?.resalePrice,
      ),

      listingPrice: getInitialNumberValue(
        pricing?.listingPrice,
        values?.listingPrice,
      ),

      minOfferPrice: getInitialNumberValue(
        pricing?.minOfferPrice,
        values?.minOfferPrice,
      ),
    };
  }, [values]);

  const [currency, setCurrency] = useState(initialPricing.currency);
  const [basePrice, setBasePrice] = useState(initialPricing.basePrice);
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialPricing.compareAtPrice,
  );
  const [discountPercent, setDiscountPercent] = useState(
    initialPricing.discountPercent,
  );
  const [rentalPrice, setRentalPrice] = useState(initialPricing.rentalPrice);
  const [resalePrice, setResalePrice] = useState(initialPricing.resalePrice);
  const [listingPrice, setListingPrice] = useState(initialPricing.listingPrice);
  const [minOfferPrice, setMinOfferPrice] = useState(
    initialPricing.minOfferPrice,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function buildPayload(): ProductPricingPayload {
    const payload: ProductPricingPayload = {
      currency: currency.trim().toUpperCase() || "INR",
      basePrice: getNumberOrNull(basePrice),
      compareAtPrice: getNumberOrNull(compareAtPrice),
      discountPercent: getNumberOrNull(discountPercent),
      rentalPrice: getNumberOrNull(rentalPrice),
      resalePrice: getNumberOrNull(resalePrice),
      listingPrice: getNumberOrNull(listingPrice),
      minOfferPrice: getNumberOrNull(minOfferPrice),
    };

    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof ProductPricingPayload];

      if (value === null || value === undefined || value === "") {
        delete payload[key as keyof ProductPricingPayload];
      }
    });

    return payload;
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      console.log("PRODUCT_PRICING_SAVE_PAYLOAD:", payload);

      const response = await updateCatalogProductPricing(productId, payload);

      console.log("PRODUCT_PRICING_SAVE_RESPONSE:", response);

      setMessage("Product pricing saved successfully.");
      onSaved?.(payload);
    } catch (err: any) {
      console.error("Product pricing save failed:", err);
      setError(err?.message || "Product pricing save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
            Catalog Pricing
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
            Product Pricing
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Save direct product pricing. Dynamic pricing rules are managed from
            Catalog → Pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !productId}
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Pricing"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Field label="Currency">
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </Field>

        <Field label="Base Price">
          <MoneyInput value={basePrice} onChange={setBasePrice} />
        </Field>

        <Field label="Compare At Price">
          <MoneyInput value={compareAtPrice} onChange={setCompareAtPrice} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Discount Percent">
          <MoneyInput value={discountPercent} onChange={setDiscountPercent} />
        </Field>

        <Field label="Rental Price">
          <MoneyInput value={rentalPrice} onChange={setRentalPrice} />
        </Field>

        <Field label="Resale Price">
          <MoneyInput value={resalePrice} onChange={setResalePrice} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Listing Price">
          <MoneyInput value={listingPrice} onChange={setListingPrice} />
        </Field>

        <Field label="Min Offer Price">
          <MoneyInput value={minOfferPrice} onChange={setMinOfferPrice} />
        </Field>
      </div>
    </section>
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

function MoneyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      step="0.01"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="0"
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />
  );
}
"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

import { PricingProductPicker } from "./pricing-product-picker";
import { PricingVariantPicker } from "./pricing-variant-picker";
import { PricingCategoryPicker } from "./pricing-category-picker";

import {
  simulatePricing,
  type CommerceType,
  type SimulatePricingPayload,
} from "@/lib/admin/dynamic-pricing-api";
import { COMMERCE_TYPES, formatPricingLabel } from "./pricing-types";

type SimulatorValues = {
  commerceType: CommerceType;
  basePrice: string;
  quantity: string;
  productId: string;
  productVariantId: string;
  categoryId: string;
  locationId: string;
  warehouseId: string;
  rentalDays: string;
  pricingDate: string;
};

const defaultValues: SimulatorValues = {
  commerceType: "SHOP",
  basePrice: "",
  quantity: "1",
  productId: "",
  productVariantId: "",
  categoryId: "",
  locationId: "",
  warehouseId: "",
  rentalDays: "",
  pricingDate: "",
};

function unwrapSimulationResult(response: any) {
  return response?.data || response?.result || response?.simulation || response;
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value || "");
  }
}

function formatMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "";

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function pickResultValue(result: any, keys: string[]) {
  for (const key of keys) {
    const value = result?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}


function getTotalAdjustment(result: any) {
  const directAdjustment = pickResultValue(result, [
    "adjustment",
    "adjustmentAmount",
    "totalAdjustment",
    "totalAdjustmentAmount",
    "appliedAdjustment",
    "priceAdjustment",
    "discount",
    "discountAmount",
    "increase",
  ]);

  if (
    directAdjustment !== "" &&
    directAdjustment !== null &&
    directAdjustment !== undefined
  ) {
    return directAdjustment;
  }

  const appliedRules =
    result?.appliedRules ||
    result?.rules ||
    result?.matchedRules ||
    result?.pricingRules ||
    [];

  if (Array.isArray(appliedRules) && appliedRules.length) {
    return appliedRules.reduce((total: number, rule: any) => {
      const beforePrice = Number(rule?.beforePrice);
      const afterPrice = Number(rule?.afterPrice);

      if (!Number.isFinite(beforePrice) || !Number.isFinite(afterPrice)) {
        return total;
      }

      return total + (afterPrice - beforePrice);
    }, 0);
  }

  const basePrice = Number(result?.basePrice);
  const finalPrice = Number(result?.finalPrice || result?.totalPrice);

  if (Number.isFinite(basePrice) && Number.isFinite(finalPrice)) {
    return finalPrice - basePrice;
  }

  return "";
}

export function PricingSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<SimulatorValues>(defaultValues);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  function updateValue<K extends keyof SimulatorValues>(
    key: K,
    value: SimulatorValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function buildPayload(): SimulatePricingPayload {
  const basePrice = Number(values.basePrice);
  const quantity = Number(values.quantity || 1);
  const rentalDays = values.rentalDays.trim()
    ? Number(values.rentalDays)
    : undefined;

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error("Base price valid number hona chahiye.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity valid number hona chahiye.");
  }

  const payload: SimulatePricingPayload = {
    basePrice,
    commerceType: values.commerceType,
    quantity,
    ...(values.productId.trim()
      ? { productId: values.productId.trim() }
      : {}),
    ...(values.productVariantId.trim()
      ? { productVariantId: values.productVariantId.trim() }
      : {}),
    ...(values.categoryId.trim()
      ? { categoryId: values.categoryId.trim() }
      : {}),
    ...(values.locationId.trim()
      ? { locationId: values.locationId.trim() }
      : {}),
    ...(values.warehouseId.trim()
      ? { warehouseId: values.warehouseId.trim() }
      : {}),
    ...(rentalDays && Number.isFinite(rentalDays) ? { rentalDays } : {}),
    ...(values.pricingDate
      ? { pricingDate: new Date(values.pricingDate).toISOString() }
      : {}),
  };

  return payload;
}

  async function handleSimulate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSimulating(true);
      setError("");
      setResult(null);

      const payload = buildPayload();
      const response = await simulatePricing(payload);

      setResult(unwrapSimulationResult(response));
    } catch (err: any) {
      console.error("Pricing simulation failed:", err);
      setError(err?.message || "Pricing simulation failed.");
    } finally {
      setIsSimulating(false);
    }
  }

  const basePrice = pickResultValue(result, [
    "basePrice",
    "originalPrice",
    "inputPrice",
    "subtotal",
  ]);

  const finalPrice = pickResultValue(result, [
    "finalPrice",
    "calculatedPrice",
    "totalPrice",
    "price",
    "amount",
  ]);

const adjustment = getTotalAdjustment(result);

  const appliedRules =
    result?.appliedRules ||
    result?.rules ||
    result?.matchedRules ||
    result?.pricingRules ||
    [];

  return (
    <section className="mb-6 rounded-[1.5rem] border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span>
          <span className="flex items-center gap-2 text-xl font-medium text-neutral-950">
            <Calculator className="h-5 w-5" />
            Pricing Simulator
          </span>

          <span className="mt-1 block text-sm text-neutral-500">
            Test final price before applying rules to checkout or rental flow.
          </span>
        </span>

        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-neutral-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-500" />
        )}
      </button>

      {isOpen ? (
        <div className="border-t border-neutral-200 p-6">
          <form onSubmit={handleSimulate} className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Commerce Type">
                <select
                  value={values.commerceType}
                  onChange={(event) =>
                    updateValue(
                      "commerceType",
                      event.target.value as CommerceType,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                >
                  {COMMERCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatPricingLabel(type)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Base Price">
                <input
                  type="number"
                  step="0.01"
                  value={values.basePrice}
                  onChange={(event) =>
                    updateValue("basePrice", event.target.value)
                  }
                  placeholder="10000"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                />
              </Field>

              <Field label="Quantity">
                <input
                  type="number"
                  value={values.quantity}
                  onChange={(event) =>
                    updateValue("quantity", event.target.value)
                  }
                  placeholder="1"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
             <Field label="Product ID">
  <div className="space-y-2">
    <input
      value={values.productId}
      onChange={(event) =>
        updateValue("productId", event.target.value)
      }
      placeholder="Optional product id"
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />

    <PricingProductPicker
      value={values.productId}
      onSelect={(product) => updateValue("productId", product.id)}
    />
  </div>
</Field>

        <Field label="Product Variant ID">
  <div className="space-y-2">
    <input
      value={values.productVariantId}
      onChange={(event) =>
        updateValue("productVariantId", event.target.value)
      }
      placeholder="Optional product variant id"
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />

    <PricingVariantPicker
      value={values.productVariantId}
      onSelect={(variant) => updateValue("productVariantId", variant.id)}
    />
  </div>
</Field>

            <Field label="Category ID / Slug">
  <div className="space-y-2">
    <input
      value={values.categoryId}
      onChange={(event) =>
        updateValue("categoryId", event.target.value)
      }
      placeholder="Optional category id or slug"
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />

    <PricingCategoryPicker
      value={values.categoryId}
      onSelect={(category) =>
        updateValue("categoryId", category.id || category.slug || "")
      }
    />
  </div>
</Field>
            </div>

           <div className="grid gap-4 md:grid-cols-2">
  <Field label="Rental Days">
    <input
      type="number"
      value={values.rentalDays}
      onChange={(event) =>
        updateValue("rentalDays", event.target.value)
      }
      placeholder="Optional"
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />
  </Field>

  <Field label="Pricing Date">
    <input
      type="datetime-local"
      value={values.pricingDate}
      onChange={(event) =>
        updateValue("pricingDate", event.target.value)
      }
      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
    />
  </Field>
</div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Location ID">
                <input
                  value={values.locationId}
                  onChange={(event) =>
                    updateValue("locationId", event.target.value)
                  }
                  placeholder="Optional location id"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                />
              </Field>

              <Field label="Warehouse ID">
                <input
                  value={values.warehouseId}
                  onChange={(event) =>
                    updateValue("warehouseId", event.target.value)
                  }
                  placeholder="Optional warehouse id"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                />
              </Field>
            </div>

            

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSimulating}
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {isSimulating ? "Simulating..." : "Run Simulation"}
              </button>
            </div>
          </form>

          {result ? (
            <div className="mt-6 rounded-[1.25rem] border border-neutral-200 bg-[#fbfaf6] p-5">
              <h3 className="text-lg font-medium text-neutral-950">
                Simulation Result
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <ResultCard
                  label="Base Price"
                  value={formatMoney(basePrice) || "—"}
                />

                <ResultCard
                  label="Adjustment"
                  value={formatMoney(adjustment) || "—"}
                />

                <ResultCard
                  label="Final Price"
                  value={formatMoney(finalPrice) || "—"}
                />
              </div>

              {Array.isArray(appliedRules) && appliedRules.length ? (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium text-neutral-700">
                    Applied Rules
                  </p>

                  <div className="space-y-2">
                    {appliedRules.map((rule: any, index: number) => (
                      <div
                        key={rule?.id || index}
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-neutral-950">
                          {rule?.name || rule?.ruleName || `Rule ${index + 1}`}
                        </p>

                     <p className="mt-1 text-xs text-neutral-500">
  {rule?.adjustmentType || rule?.type || ""}{" "}
  {rule?.adjustmentValue || rule?.value || ""}
  {rule?.beforePrice !== undefined && rule?.afterPrice !== undefined
    ? ` • ${rule.beforePrice} → ${rule.afterPrice}`
    : ""}
</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                  Raw response
                </summary>

                <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-neutral-950 p-4 text-xs text-white">
                  {formatJson(result)}
                </pre>
              </details>
            </div>
          ) : null}
        </div>
      ) : null}
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

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}
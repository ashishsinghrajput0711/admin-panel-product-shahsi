"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  PackagePlus,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createRentalInventoryUnit,
  getProductRentalVariants,
  type RentalInventoryVariant,
} from "@/lib/admin/rental-inventory-api";

function getVariantLabel(
  variant: RentalInventoryVariant,
) {
  const identity = [
    variant.size,
    variant.color,
    variant.variantSku || variant.sku,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" · ");

  const state = [
    variant.status,
    variant.isAvailable === false
      ? "Unavailable"
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return state
    ? `${identity || variant.id} — ${state}`
    : identity || variant.id;
}

export function ProductRentalInventorySection({
  productId,
  apiRootUrl,
  token,
}: {
  productId: string;
  apiRootUrl: string;
  token?: string | null;
}) {
  const [variants, setVariants] = useState<
    RentalInventoryVariant[]
  >([]);

  const [selectedVariantId, setSelectedVariantId] =
    useState("");

  const [skuCode, setSkuCode] = useState("");
  const [condition, setCondition] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    return (
      variants.find(
        (variant) =>
          variant.id === selectedVariantId,
      ) || null
    );
  }, [variants, selectedVariantId]);

  async function loadVariants() {
    try {
      setIsLoading(true);
      setError(null);

      const items =
        await getProductRentalVariants({
          apiRootUrl,
          productId,
          token,
        });

      setVariants(items);
    } catch (loadError) {
      setVariants([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Product variants load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, [apiRootUrl, productId, token]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedSkuCode =
      skuCode.trim();

    const normalizedCondition =
      condition.trim();

    if (!productId.trim()) {
      setError("Product ID missing hai.");
      return;
    }

    if (!normalizedSkuCode) {
      setError(
        "Inventory Unit SKU required hai.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      await createRentalInventoryUnit({
        apiRootUrl,
        token,
        payload: {
          productId,
          skuCode: normalizedSkuCode,
          ...(selectedVariantId
            ? {
                variantId: selectedVariantId,
              }
            : {}),
          ...(normalizedCondition
            ? {
                condition:
                  normalizedCondition,
              }
            : {}),
        },
      });

      setMessage(
        "Rental inventory unit successfully create ho gaya.",
      );

      setSkuCode("");
      setCondition("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Rental inventory unit create failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Rental Inventory
          </p>

          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Create Physical Inventory Unit
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-neutral-500">
            Register an individual physical rental item against this
            product or one of its variants.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadVariants}
          disabled={isLoading || isSaving}
          className="rounded-full"
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          Refresh Variants
        </Button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Product ID
          </span>

          <Input
            value={productId}
            readOnly
            className="bg-neutral-50 text-neutral-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Variant
          </span>

          <select
            value={selectedVariantId}
            onChange={(event) =>
              setSelectedVariantId(
                event.target.value,
              )
            }
            disabled={isLoading}
            className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
          >
            <option value="">
              Product-level unit — no variant
            </option>

            {variants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
              >
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Inventory Unit SKU *
          </span>

          <Input
            value={skuCode}
            onChange={(event) =>
              setSkuCode(event.target.value)
            }
            placeholder={
              selectedVariant?.variantSku ||
              selectedVariant?.sku ||
              "Enter a unique physical unit SKU"
            }
            disabled={isSaving}
          />

          <span className="mt-1 block text-xs text-neutral-400">
            This must identify one physical rental item and should be
            unique.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Condition
          </span>

          <Input
            value={condition}
            onChange={(event) =>
              setCondition(event.target.value)
            }
            placeholder="Example: Excellent"
            disabled={isSaving}
          />

          <span className="mt-1 block text-xs text-neutral-400">
            Backend currently accepts this as an optional text value.
          </span>
        </label>

        {selectedVariant ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm md:col-span-2">
            <p className="font-semibold text-neutral-900">
              Selected variant
            </p>

            <div className="mt-2 grid gap-2 text-neutral-600 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                Size:{" "}
                <strong>
                  {selectedVariant.size || "—"}
                </strong>
              </p>

              <p>
                Color:{" "}
                <strong>
                  {selectedVariant.color || "—"}
                </strong>
              </p>

              <p>
                SKU:{" "}
                <strong>
                  {selectedVariant.variantSku ||
                    selectedVariant.sku ||
                    "—"}
                </strong>
              </p>

              <p>
                Status:{" "}
                <strong>
                  {selectedVariant.status || "—"}
                </strong>
              </p>
            </div>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
            className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 h-4 w-4" />
                Create Inventory Unit
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
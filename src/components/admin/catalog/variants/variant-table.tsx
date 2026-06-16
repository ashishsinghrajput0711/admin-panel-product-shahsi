"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive,
  Copy,
  Edit3,
  PackageCheck,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  BusinessType,
  CommerceType,
  DataQualityStatus,
  Variant,
  VariantStatus,
} from "./variant-types";

const commerceTypeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "MTO",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

type NormalizedVariant = {
  id: string;
  productId: string;
  productName: string | null;
  sku: string | null;
  barcode: string | null;
  businessType: BusinessType | string | null;
  commerceTypes: Array<CommerceType | string>;

  variantType: string | null;
  rentalPackageName: string | null;
  subscriptionPackageName: string | null;

  size: string | null;
  color: string | null;
  fabric: string | null;
  length: string | null;
  neckline: string | null;
  sleeveLength: string | null;
  fitType: string | null;

  price: number | null;
  compareAtPrice: number | null;
  salePrice: number | null;

  stock: number | null;
  reservedStock: number;
  availableStock: number | null;

  status: VariantStatus | string;
  fitDataStatus: DataQualityStatus | string;
  seoStatus: DataQualityStatus | string;

  isAvailable: boolean | null;
  isShipsNow: boolean | null;
  productionType: string | null;
};

function getApiRootUrl() {
  return "/api/proxy";
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function parseApiError(response: Response) {
  const text = await response.text();
  if (!text) return `${response.status} ${response.statusText}`;

  try {
    const data = JSON.parse(text) as {
      message?: string | string[];
      error?: string | { message?: string | string[] };
    };

    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;

    if (data.error && typeof data.error === "object") {
      if (Array.isArray(data.error.message)) {
        return data.error.message.join(", ");
      }

      if (typeof data.error.message === "string") {
        return data.error.message;
      }
    }

    return text;
  } catch {
    return text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstString(values: unknown[]) {
  const value = values.find(isString);
  return typeof value === "string" ? value.trim() : null;
}

function firstNumber(values: unknown[]) {
  const value = values.find(
    (item) => typeof item === "number" && Number.isFinite(item)
  );

  return typeof value === "number" ? value : null;
}

function formatSlugLabel(value: unknown, fallback = "Missing") {
  if (value === null || value === undefined) return fallback;

  const raw = String(value).trim();
  if (!raw) return fallback;

  const upperRaw = raw.toUpperCase();

  const keepUpperCaseValues = new Set([
    "ACTIVE",
    "INACTIVE",
    "DRAFT",
    "ARCHIVED",
    "SHAHSI",
    "GOWNLOOP",
    "READY_STOCK",
    "MADE_TO_ORDER",
    "RETAIL",
    "RENTAL",
    "RESALE",
    "SIZE",
    "COLOR",
    "LENGTH",
    "FABRIC",
    "RENTAL_PACKAGE",
    "SUBSCRIPTION_PACKAGE",
    "COMPLETE",
    "PARTIAL",
    "MISSING",
  ]);

  if (keepUpperCaseValues.has(upperRaw)) return upperRaw;

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return word;

      const lower = word.toLowerCase();

      if (lower === "v") return "V";
      if (lower === "mto") return "MTO";
      if (lower === "seo") return "SEO";
      if (lower === "sku") return "SKU";

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function formatVariantType(value: string | null) {
  if (!value) return "Missing Variant type";
  return formatSlugLabel(value, "Missing Variant type");
}

function formatMoney(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function normalizeStatus(variant: Variant): VariantStatus | string {
  if (variant.status) return String(variant.status).toUpperCase();
  if (variant.isActive === true) return "ACTIVE";
  if (variant.isActive === false) return "INACTIVE";
  return "MISSING";
}

function getFitDataStatus(variant: Variant): DataQualityStatus | string {
  const hasMeasurements =
    typeof variant.chest === "number" ||
    typeof variant.waist === "number" ||
    typeof variant.hip === "number" ||
    typeof variant.length === "number";

  const hasFitInfo = Boolean(variant.fitType || variant.size);

  if (hasMeasurements && hasFitInfo) return "COMPLETE";
  if (hasMeasurements || hasFitInfo) return "PARTIAL";

  return "MISSING";
}

function getSeoStatus(variant: Variant): DataQualityStatus | string {
  const hasSku = Boolean(variant.sku || variant.variantSku);
  const hasOption = Boolean(variant.size || variant.color);

  if (hasSku && hasOption) return "COMPLETE";
  if (hasSku || hasOption) return "PARTIAL";

  return "MISSING";
}

function normalizeCommerceTypes(variant: Variant) {
  if (Array.isArray(variant.commerceTypes) && variant.commerceTypes.length > 0) {
    return variant.commerceTypes;
  }

  if (variant.productionType === "MADE_TO_ORDER") return ["MADE_TO_ORDER"];

  return ["RETAIL"];
}

function normalizeVariant(variant: Variant): NormalizedVariant {
  return {
    id: variant.id,
    productId: variant.productId,
    productName: variant.productName ?? null,

    sku: firstString([variant.sku, variant.variantSku]),
    barcode: variant.barcode ?? null,

    businessType: variant.businessType ?? "SHAHSI",
    commerceTypes: normalizeCommerceTypes(variant),

    variantType: variant.variantType ?? null,
    rentalPackageName: variant.rentalPackageName ?? null,
    subscriptionPackageName: variant.subscriptionPackageName ?? null,

    size: variant.size ?? null,
    color: variant.color ?? variant.colorFamily ?? null,
    fabric: variant.fabric ?? variant.attributes?.fabric ?? null,

    length:
      typeof variant.length === "number"
        ? String(variant.length)
        : firstString([variant.length, variant.dressLength, variant.lengthLabel]),

    neckline: variant.neckline ?? null,
    sleeveLength: variant.sleeveLength ?? null,
    fitType: variant.fitType ?? null,

    price: firstNumber([variant.price]),
    compareAtPrice: firstNumber([variant.compareAtPrice]),
    salePrice: firstNumber([variant.salePrice]),

    stock: firstNumber([variant.stock]),
    reservedStock: firstNumber([variant.reservedStock]) ?? 0,
    availableStock:
      firstNumber([variant.availableStock]) ??
      firstNumber([variant.stock]) ??
      null,

    status: normalizeStatus(variant),
    fitDataStatus: variant.fitDataStatus || getFitDataStatus(variant),
    seoStatus: variant.seoStatus || getSeoStatus(variant),

    isAvailable:
      typeof variant.isAvailable === "boolean" ? variant.isAvailable : null,
    isShipsNow:
      typeof variant.isShipsNow === "boolean" ? variant.isShipsNow : null,
    productionType: variant.productionType ?? null,
  };
}

function getNextStatus(status: string) {
  return status.toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
}

function getStatusBadgeClass(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "DRAFT") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "INACTIVE") {
    return "border-neutral-200 bg-neutral-50 text-neutral-600";
  }

  if (normalized === "ARCHIVED") {
    return "border-neutral-300 bg-neutral-100 text-neutral-500";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getQualityBadgeClass(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "COMPLETE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "PARTIAL") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getVariantOptionLine(variant: NormalizedVariant) {
  const color = formatSlugLabel(variant.color, "No color");
  const size = formatSlugLabel(variant.size, "No size");
  const fabric = formatSlugLabel(variant.fabric, "No fabric");
  const length = formatSlugLabel(variant.length, "0");

  return {
    primary: color,
    secondary: `${size} / ${fabric} / ${length}`,
  };
}

function getVariantChips(variant: NormalizedVariant) {
  const chips: string[] = [];

  if (variant.businessType) chips.push(formatSlugLabel(variant.businessType));

  for (const type of variant.commerceTypes) {
    const key = String(type).toUpperCase() as CommerceType;
    chips.push(commerceTypeLabels[key] ?? formatSlugLabel(type));
  }

  chips.push(formatVariantType(variant.variantType));

  if (variant.rentalPackageName) {
    chips.push(`Rental: ${formatSlugLabel(variant.rentalPackageName)}`);
  }

  if (variant.subscriptionPackageName) {
    chips.push(`Subscription: ${formatSlugLabel(variant.subscriptionPackageName)}`);
  }

  if (variant.productionType) chips.push(formatSlugLabel(variant.productionType));
  if (variant.neckline) chips.push(formatSlugLabel(variant.neckline));
  if (variant.sleeveLength) chips.push(formatSlugLabel(variant.sleeveLength));
  if (variant.fitType) chips.push(formatSlugLabel(variant.fitType));

  if (variant.isAvailable === true) chips.push("Available");
  if (variant.isAvailable === false) chips.push("Unavailable");

  if (variant.isShipsNow === true) chips.push("Ships now");

  return chips.filter(Boolean);
}

export function VariantTable({
  variants,
  isLoading,
  onActionComplete,
  editHrefBuilder,
}: {
  variants: Variant[];
  isLoading: boolean;
  onActionComplete?: () => void;
  editHrefBuilder?: (variant: NormalizedVariant) => string;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  async function runAction({
    actionKey,
    url,
    method,
    body,
    successMessage,
  }: {
    actionKey: string;
    url: string;
    method: "POST" | "PATCH" | "DELETE";
    body?: unknown;
    successMessage: string;
  }) {
    try {
      setActionError(null);
      setActiveActionKey(actionKey);

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const message = await parseApiError(response);
        throw new Error(message);
      }

      console.info(successMessage);
      onActionComplete?.();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Variant action failed."
      );
    } finally {
      setActiveActionKey(null);
    }
  }

  function handleToggleStatus(variant: NormalizedVariant) {
    const nextStatus = getNextStatus(String(variant.status));

    runAction({
      actionKey: `${variant.id}-status`,
      url: `${getApiRootUrl()}/admin/catalog/variants/${variant.id}/status`,
      method: "PATCH",
      body: { status: nextStatus },
      successMessage: `Variant status changed to ${nextStatus}`,
    });
  }

  function handleArchive(variant: NormalizedVariant) {
    runAction({
      actionKey: `${variant.id}-archive`,
      url: `${getApiRootUrl()}/admin/catalog/variants/${variant.id}/status`,
      method: "PATCH",
      body: { status: "ARCHIVED" },
      successMessage: "Variant archived",
    });
  }

  function handleDuplicate(variant: NormalizedVariant) {
    runAction({
      actionKey: `${variant.id}-duplicate`,
      url: `${getApiRootUrl()}/admin/catalog/variants/${variant.id}/duplicate`,
      method: "POST",
      successMessage: "Variant duplicated",
    });
  }

  function handleDelete(variant: NormalizedVariant) {
    const confirmed = window.confirm(
      `Delete variant "${variant.sku || variant.id}"?`
    );

    if (!confirmed) return;

    runAction({
      actionKey: `${variant.id}-delete`,
      url: `${getApiRootUrl()}/admin/catalog/variants/${variant.id}`,
      method: "DELETE",
      successMessage: "Variant deleted",
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
        Loading variants...
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center">
        <PackageCheck className="mx-auto h-10 w-10 text-neutral-300" />
        <h3 className="mt-4 text-lg font-semibold text-neutral-950">
          No variants found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend se current page par koi variant nahi mila.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {variants.map((rawVariant) => {
        const variant = normalizeVariant(rawVariant);
        const optionLine = getVariantOptionLine(variant);
        const chips = getVariantChips(variant);

        const status = String(variant.status || "MISSING").toUpperCase();
        const fitStatus = String(variant.fitDataStatus || "MISSING").toUpperCase();
        const seoStatus = String(variant.seoStatus || "MISSING").toUpperCase();

        const availableStock = variant.availableStock ?? 0;
        const stock = variant.stock ?? 0;
        const reservedStock = variant.reservedStock ?? 0;

        return (
          <article
            key={variant.id}
            className="rounded-[1.35rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          >
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.75fr_0.65fr_0.75fr_auto] xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-neutral-950">
                    {variant.sku || variant.id}
                  </h3>

                  <Badge
                    variant="outline"
                    className={`rounded-full ${getStatusBadgeClass(status)}`}
                  >
                    {formatSlugLabel(status)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full ${getQualityBadgeClass(fitStatus)}`}
                  >
                    Fit: {formatSlugLabel(fitStatus)}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`rounded-full ${getQualityBadgeClass(seoStatus)}`}
                  >
                    SEO: {formatSlugLabel(seoStatus)}
                  </Badge>

                  {variant.productionType ? (
                    <Badge variant="outline" className="rounded-full">
                      {formatSlugLabel(variant.productionType)}
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-4 max-w-md truncate text-sm text-neutral-500">
                  Product: {variant.productName || variant.productId || "No product"}
                </p>

                {variant.barcode ? (
                  <p className="mt-1 text-xs text-neutral-400">
                    Barcode: {variant.barcode}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Options
                </p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {optionLine.primary}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {optionLine.secondary}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Price
                </p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {formatMoney(variant.price)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Sale {formatMoney(variant.salePrice)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Stock
                </p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {availableStock} available
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {reservedStock} reserved / {stock} total
                </p>
              </div>

              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  title="Edit variant"
                >
              <Link
  href={
    editHrefBuilder
      ? editHrefBuilder(variant)
      : `/admin/catalog/variants/${variant.id}/edit`
  }
>
                    <Edit3 className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  title="Toggle active/inactive"
                  disabled={activeActionKey === `${variant.id}-status`}
                  onClick={() => handleToggleStatus(variant)}
                >
                  <Power className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  title="Duplicate variant"
                  disabled={activeActionKey === `${variant.id}-duplicate`}
                  onClick={() => handleDuplicate(variant)}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  title="Archive variant"
                  disabled={activeActionKey === `${variant.id}-archive`}
                  onClick={() => handleArchive(variant)}
                >
                  <Archive className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="rounded-xl"
                  title="Delete variant"
                  disabled={activeActionKey === `${variant.id}-delete`}
                  onClick={() => handleDelete(variant)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Badge
                    key={`${variant.id}-${chip}`}
                    variant="outline"
                    className={
                      chip === "Missing Variant type"
                        ? "rounded-full border-amber-200 bg-amber-50 text-amber-700"
                        : "rounded-full"
                    }
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
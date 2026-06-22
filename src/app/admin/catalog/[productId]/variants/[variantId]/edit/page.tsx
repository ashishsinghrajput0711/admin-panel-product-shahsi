"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { VariantForm } from "@/components/admin/catalog/variants/variant-form";
import type { Variant } from "@/components/admin/catalog/variants/variant-types";
import type { VariantFormValues } from "@/components/admin/catalog/variants/variant-schema";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  variant?: T;
  message?: string | string[];
  error?: unknown;
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

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanOptionalString(value: unknown) {
  const cleaned = String(value ?? "").trim();

  if (!cleaned) return undefined;
  if (cleaned.toLowerCase() === "string") return undefined;

  return cleaned;
}

function toDisplayLabel(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return "";

  return cleaned
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "v") return "V";
      if (lower === "mto") return "MTO";
      if (lower === "sku") return "SKU";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRequiredNumber(value: unknown, fallback = 0) {
  return toOptionalNumber(value) ?? fallback;
}

function removeUndefinedFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function normalizeVariantType(value: unknown) {
  const type = cleanString(value).toUpperCase();

  if (type === "COLOR") return "COLOR";
  if (type === "LENGTH") return "LENGTH";
  if (type === "FABRIC") return "FABRIC";
  if (type === "RENTAL_PACKAGE") return "RENTAL_PACKAGE";
  if (type === "SUBSCRIPTION_PACKAGE") return "SUBSCRIPTION_PACKAGE";

  return "SIZE";
}

function normalizeStatus(value: unknown) {
  const status = cleanString(value).toUpperCase();

  if (status === "DRAFT") return "DRAFT";
  if (status === "INACTIVE") return "INACTIVE";
  if (status === "ARCHIVED") return "ARCHIVED";

  return "ACTIVE";
}

function normalizeFitType(value: unknown) {
  const normalized = cleanOptionalString(value)
    ?.toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return undefined;

  const allowed = ["slim", "regular", "oversized", "relaxed", "fitted"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function normalizeCommerceTypes(variant: Variant): VariantFormValues["commerceTypes"] {
  if (Array.isArray(variant.commerceTypes) && variant.commerceTypes.length > 0) {
    return variant.commerceTypes as VariantFormValues["commerceTypes"];
  }

  if (variant.productionType === "MADE_TO_ORDER") {
    return ["MADE_TO_ORDER"];
  }

  return ["RETAIL"];
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;

    if (Array.isArray(record.message)) return record.message.join(", ");
    if (typeof record.message === "string") return record.message;
  }

  return fallback;
}

function extractVariant(response: ApiResponse<Variant>) {
  return response.data || response.variant || null;
}

function mapVariantToFormValues(
  variant: Variant,
  productId: string
): Partial<VariantFormValues> {
  const fabric = cleanString(variant.attributes?.fabric || variant.fabric);
  const occasion = cleanString(variant.attributes?.occasion);

  return {
    productId,
    sku: cleanString(variant.sku),
    variantSku: cleanString(variant.variantSku),
    barcode: cleanString(variant.barcode),

    businessType: "SHAHSI",
    commerceTypes: normalizeCommerceTypes(variant),

    variantType: normalizeVariantType(variant.variantType),
    rentalPackageName: cleanString(variant.rentalPackageName),
    subscriptionPackageName: cleanString(variant.subscriptionPackageName),

    size: cleanString(variant.size),
    color: cleanString(variant.color),
    colorFamily: cleanString(variant.colorFamily),

    fabric,
    height: cleanString(variant.height),
    dressLength: cleanString(variant.dressLength),
    lengthLabel: cleanString(variant.lengthLabel || variant.dressLength),
    neckline: cleanString(variant.neckline),
    sleeveLength: cleanString(variant.sleeveLength),
    detail: cleanString(variant.detail),

    price: toRequiredNumber(variant.price),
    compareAtPrice: toOptionalNumber(variant.compareAtPrice),
    salePrice: toOptionalNumber(variant.salePrice),
    rentalPrice: toOptionalNumber(variant.rentalPrice),
    resalePrice: toOptionalNumber(variant.resalePrice),
    mtoPrice: toOptionalNumber(variant.mtoPrice),

    stock: toRequiredNumber(variant.stock),
    reservedStock: toRequiredNumber(variant.reservedStock),

    status: normalizeStatus(variant.status),

    chest: toOptionalNumber(variant.chest),
    waist: toOptionalNumber(variant.waist),
    hip: toOptionalNumber(variant.hip),
    length: toOptionalNumber(variant.length),
    sleeve: toOptionalNumber(variant.sleeve),
    shoulder: toOptionalNumber(variant.shoulder),

    bustMeasurement: toOptionalNumber(variant.chest),
    waistMeasurement: toOptionalNumber(variant.waist),
    hipMeasurement: toOptionalNumber(variant.hip),
    garmentLength: toOptionalNumber(variant.length),

    fitType: toDisplayLabel(variant.fitType),
    stretchLevel: cleanString(variant.stretchLevel),

    attributesFabric: fabric,
    attributesOccasion: occasion,

    weight: toRequiredNumber(variant.weight),
    weightUnit: cleanString(variant.weightUnit) || "kg",

    isAvailable:
      typeof variant.isAvailable === "boolean" ? variant.isAvailable : true,
    isActive: typeof variant.isActive === "boolean" ? variant.isActive : true,
    isShipsNow:
      typeof variant.isShipsNow === "boolean" ? variant.isShipsNow : true,

    productionType: cleanString(variant.productionType) || "READY_STOCK",
  };
}

function buildProductVariantPatchPayload(values: VariantFormValues) {
  const size = cleanString(values.size);
  const color = cleanString(values.color);

  if (!size) throw new Error("Size required hai. Size dropdown se value select karo.");
  if (!color) throw new Error("Color required hai. Color dropdown se value select karo.");

  const variantType = normalizeVariantType(values.variantType);
  const status = normalizeStatus(values.status);

  const attributesPayload = removeUndefinedFields({
    fabric: cleanOptionalString(values.attributesFabric || values.fabric),
    occasion: cleanOptionalString(values.attributesOccasion),
  });

  const productionType =
    cleanOptionalString(values.productionType) ||
    (values.commerceTypes.includes("MADE_TO_ORDER")
      ? "MADE_TO_ORDER"
      : "READY_STOCK");

  const payload = {
    variantType,

    size,
    color,
    colorFamily: cleanOptionalString(values.colorFamily),

    rentalPackageName:
      variantType === "RENTAL_PACKAGE"
        ? cleanOptionalString(values.rentalPackageName)
        : undefined,

    subscriptionPackageName:
      variantType === "SUBSCRIPTION_PACKAGE"
        ? cleanOptionalString(values.subscriptionPackageName)
        : undefined,

    height: cleanOptionalString(values.height),
    dressLength: cleanOptionalString(values.dressLength),
    lengthLabel: cleanOptionalString(values.lengthLabel || values.dressLength),
    neckline: cleanOptionalString(values.neckline),
    sleeveLength: cleanOptionalString(values.sleeveLength),
    detail: cleanOptionalString(values.detail),

    chest: toOptionalNumber(values.chest ?? values.bustMeasurement),
    waist: toOptionalNumber(values.waist ?? values.waistMeasurement),
    hip: toOptionalNumber(values.hip ?? values.hipMeasurement),
    length: toOptionalNumber(values.length ?? values.garmentLength),
    sleeve: toOptionalNumber(values.sleeve),
    shoulder: toOptionalNumber(values.shoulder),

    fitType: normalizeFitType(values.fitType),
    stretchLevel: cleanOptionalString(values.stretchLevel),

    price: toRequiredNumber(values.price),
    compareAtPrice: toOptionalNumber(values.compareAtPrice),
    salePrice: toOptionalNumber(values.salePrice),
    rentalPrice: toOptionalNumber(values.rentalPrice),
    resalePrice: toOptionalNumber(values.resalePrice),
    mtoPrice: toOptionalNumber(values.mtoPrice),

    stock: toRequiredNumber(values.stock),
    reservedStock: toRequiredNumber(values.reservedStock),

    attributes:
      Object.keys(attributesPayload).length > 0 ? attributesPayload : undefined,

  

    weight: toOptionalNumber(values.weight),
    weightUnit: cleanOptionalString(values.weightUnit) || "kg",

    status,
    isActive: Boolean(values.isActive),
    isAvailable: Boolean(values.isAvailable),
    isShipsNow: Boolean(values.isShipsNow),

    productionType,
  };

  return removeUndefinedFields(payload);
}

export default function EditProductVariantPage() {
  const params = useParams<{ productId: string; variantId: string }>();
  const router = useRouter();

  const productId = String(params?.productId ?? "");
  const variantId = String(params?.variantId ?? "");

  const [variant, setVariant] = useState<Variant | null>(null);
  const [defaultValues, setDefaultValues] =
    useState<Partial<VariantFormValues> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  async function loadVariant() {
    try {
      setIsLoading(true);
      setApiError(null);
      setApiSuccess(null);

    const response = await fetch(
  `${getApiRootUrl()}/admin/catalog/variants/${variantId}`,
  {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  }
);

      const json = await parseApiResponse<ApiResponse<Variant>>(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Variant load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      const foundVariant = extractVariant(json);

      if (!foundVariant) {
        throw new Error("Backend response me variant data nahi mila.");
      }

      setVariant(foundVariant);
      setDefaultValues(mapVariantToFormValues(foundVariant, productId));
    } catch (error) {
      setVariant(null);
      setDefaultValues(null);
      setApiError(
        error instanceof Error ? error.message : "Variant load nahi ho paaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: VariantFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setApiSuccess(null);

      const payload = buildProductVariantPatchPayload(values);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/${productId}/variants/${variantId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const json = await parseApiResponse<ApiResponse<Variant>>(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Variant update failed: ${response.status} ${response.statusText}`
          )
        );
      }

      setApiSuccess("Product variant updated successfully.");
      await loadVariant();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Variant update failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!productId || !variantId) return;
    loadVariant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, variantId]);

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-6 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/admin/catalog/${productId}/variants`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to product variants
        </Link>

        <section className="mt-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Admin / Catalog / Product Variant
          </p>

          <h1 className="mt-4 text-5xl font-medium tracking-tight text-neutral-950">
            Edit Product Variant
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            Update selected product variant using{" "}
            <span className="font-semibold text-neutral-950">
              PATCH /admin/catalog/{"{productId}"}/variants/{"{variantId}"}
            </span>
            .
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Product ID: <span className="font-medium">{productId}</span>
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Variant ID: <span className="font-medium">{variantId}</span>
          </p>
        </section>

        {apiError ? (
          <section className="mt-8 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">Product Variant API error</p>
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs">
              {apiError}
            </p>
          </section>
        ) : null}

        {apiSuccess ? (
          <section className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            {apiSuccess}
          </section>
        ) : null}

        {isLoading ? (
          <section className="mt-8 rounded-[1.5rem] border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
            Loading product variant...
          </section>
        ) : defaultValues ? (
          <div className="mt-8">
            <VariantForm
              key={variant?.id || variantId}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
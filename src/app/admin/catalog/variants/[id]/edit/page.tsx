"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VariantForm } from "@/components/admin/catalog/variants/variant-form";
import type { VariantFormValues } from "@/components/admin/catalog/variants/variant-schema";

type BackendVariant = {
  id: string;
  productId: string;

  sku?: string | null;
  variantSku?: string | null;
  barcode?: string | null;

  variantType?: string | null;
  rentalPackageName?: string | null;
  subscriptionPackageName?: string | null;

  size?: string | null;
  color?: string | null;
  colorFamily?: string | null;
  fabric?: string | null;
  stretchLevel?: string | null;

  height?: string | null;
  dressLength?: string | null;
  lengthLabel?: string | null;
  neckline?: string | null;
  sleeveLength?: string | null;
  detail?: string | null;

  chest?: number | string | null;
  waist?: number | string | null;
  hip?: number | string | null;
  length?: number | string | null;
  sleeve?: number | string | null;
  shoulder?: number | string | null;
  fitType?: string | null;

  price?: number | string | null;
  compareAtPrice?: number | string | null;
  salePrice?: number | string | null;
  rentalPrice?: number | string | null;
  resalePrice?: number | string | null;
  mtoPrice?: number | string | null;

  stock?: number | string | null;
  reservedStock?: number | string | null;
  availableStock?: number | string | null;

  attributes?: {
    fabric?: string | null;
    occasion?: string | null;
    [key: string]: unknown;
  } | null;

  weight?: number | string | null;
  weightUnit?: string | null;

  isActive?: boolean | null;
  isAvailable?: boolean | null;
  isShipsNow?: boolean | null;

  productionType?: string | null;
  status?: string | null;
};

type VariantDetailResponse = {
  success?: boolean;
  data?: BackendVariant | { variant?: BackendVariant };
  variant?: BackendVariant;
  error?:
    | string
    | string[]
    | {
        message?: string | string[];
      };
  message?: string | string[];
};

type VariantPatchResponse = {
  success?: boolean;
  data?: unknown;
  error?:
    | string
    | string[]
    | {
        message?: string | string[];
      };
  message?: string | string[];
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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const shortText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    throw new Error(
      `${fallbackMessage}. Server ne JSON ke jagah HTML/text return kiya. Status: ${response.status}. Response: ${shortText}`
    );
  }
}

function getApiErrorMessage(
  data: VariantDetailResponse | VariantPatchResponse,
  fallback: string
) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.error)) {
    return data.error
      .map((item) => String(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    if (Array.isArray(data.error.message)) {
      return data.error.message.join(", ");
    }

    if (typeof data.error.message === "string") {
      return data.error.message;
    }
  }

  return fallback;
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

function normalizeVariantType(value: unknown): VariantFormValues["variantType"] {
  const type = cleanString(value).toUpperCase();

  if (type === "COLOR") return "COLOR";
  if (type === "LENGTH") return "LENGTH";
  if (type === "FABRIC") return "FABRIC";
  if (type === "RENTAL_PACKAGE") return "RENTAL_PACKAGE";
  if (type === "SUBSCRIPTION_PACKAGE") return "SUBSCRIPTION_PACKAGE";

  return "SIZE";
}

function normalizeStatus(value: unknown): VariantFormValues["status"] {
  const status = cleanString(value).toUpperCase();

  if (status === "DRAFT") return "DRAFT";
  if (status === "INACTIVE") return "INACTIVE";
  if (status === "ARCHIVED") return "ARCHIVED";

  return "ACTIVE";
}

function normalizeFitType(value: unknown) {
  const normalized = cleanOptionalString(value)
    ?.toLowerCase()
    .replace(/[_\s-]+/g, "_");

  if (!normalized) return undefined;

  const allowed = ["slim", "regular", "oversized", "relaxed", "fitted"];

  if (allowed.includes(normalized)) return normalized;

  return undefined;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRequiredNumber(value: unknown, fallback = 0) {
  const parsed = toOptionalNumber(value);
  return parsed ?? fallback;
}

function removeUndefinedFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function extractVariant(response: VariantDetailResponse) {
  if (response.variant) return response.variant;

  if (response.data && "variant" in response.data) {
    return response.data.variant ?? null;
  }

  if (response.data && "id" in response.data) {
    return response.data;
  }

  return null;
}

function normalizeCommerceTypes(
  variant: BackendVariant
): VariantFormValues["commerceTypes"] {
  if (variant.productionType === "MADE_TO_ORDER") return ["MADE_TO_ORDER"];
  return ["RETAIL"];
}

function mapVariantToFormValues(
  variant: BackendVariant
): Partial<VariantFormValues> {
  const fabric = cleanString(variant.fabric || variant.attributes?.fabric);
  const occasion = cleanString(variant.attributes?.occasion);

  return {
    productId: cleanString(variant.productId),

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

    customLengthAllowed: false,
    minCustomLength: undefined,
    maxCustomLength: undefined,
    productionLeadTimeDays: undefined,
    rushEligible: false,
    rushFee: undefined,
  };
}

function buildVariantPatchPayload(values: VariantFormValues) {
  const size = cleanString(values.size);
  const color = cleanString(values.color);

  if (!size) {
    throw new Error("Size required hai. Size dropdown se value select karo.");
  }

  if (!color) {
    throw new Error("Color required hai. Color dropdown se value select karo.");
  }

  const variantType = normalizeVariantType(values.variantType);
  const status = normalizeStatus(values.status);

  const productionType =
    cleanOptionalString(values.productionType) ||
    (values.commerceTypes.includes("MADE_TO_ORDER")
      ? "MADE_TO_ORDER"
      : "READY_STOCK");

  const attributesPayload = removeUndefinedFields({
    fabric: cleanOptionalString(values.attributesFabric || values.fabric),
    occasion: cleanOptionalString(values.attributesOccasion),
  });

  const payload = {
    variantType,

    size,
    color,
    colorFamily: cleanOptionalString(values.colorFamily),
    fabric: cleanOptionalString(values.fabric || values.attributesFabric),

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
    reservedStock: toOptionalNumber(values.reservedStock),

    attributes:
      Object.keys(attributesPayload).length > 0 ? attributesPayload : undefined,

    sku: cleanOptionalString(values.sku),
    variantSku: cleanOptionalString(values.variantSku),
    barcode: cleanOptionalString(values.barcode),

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

export default function EditVariantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const variantId = useMemo(() => String(params?.id ?? ""), [params?.id]);

  const [defaultValues, setDefaultValues] =
    useState<Partial<VariantFormValues> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadVariant() {
    try {
      setIsLoading(true);
      setApiError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/variants/${variantId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      const json = await parseApiResponse<VariantDetailResponse>(
        response,
        "Variant detail API JSON response nahi de rahi"
      );

      console.log("GLOBAL_VARIANT_DETAIL_RESPONSE:", json);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Variant detail failed: ${response.status} ${response.statusText}`
          )
        );
      }

      const variant = extractVariant(json);

      if (!variant) {
        throw new Error("Variant detail response me variant data nahi mila.");
      }

      setDefaultValues(mapVariantToFormValues(variant));
    } catch (error) {
      setDefaultValues(null);
      setApiError(
        error instanceof Error
          ? error.message
          : "Variant detail load nahi ho paaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: VariantFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setSuccessMessage(null);

      const payload = buildVariantPatchPayload(values);
      const url = `${getApiRootUrl()}/admin/catalog/variants/${variantId}`;

      console.log("GLOBAL_VARIANT_PATCH_FORM_VALUES:", values);
      console.log("GLOBAL_VARIANT_PATCH_REQUEST:", {
        url,
        payload,
      });

      const response = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await parseApiResponse<VariantPatchResponse>(
        response,
        "Variant update API JSON response nahi de rahi"
      );

      console.log("GLOBAL_VARIANT_PATCH_RESPONSE:", json);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Variant update failed: ${response.status} ${response.statusText}`
          )
        );
      }
setSuccessMessage("Variant successfully update ho gaya.");

setTimeout(() => {
  router.push("/admin/catalog/variants");
}, 700);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Variant update failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!variantId) return;
    loadVariant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/catalog/variants"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to global variants
        </Link>

        <section className="mt-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
            Admin / Catalog / Global Variants
          </p>

          <h1 className="mt-4 text-5xl font-medium tracking-tight text-neutral-950">
            Edit Global Variant
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            Update variant using global API{" "}
            <span className="font-semibold text-neutral-950">
              PATCH /admin/catalog/variants/{"{id}"}
            </span>
            .
          </p>
        </section>

        {apiError ? (
          <section className="mt-8 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">Variant API error</p>
            <p className="mt-2">
              Real backend operation fail hui. Fallback/mock data use nahi kiya
              gaya.
            </p>
            <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs">
              {apiError}
            </p>

            {apiError.toLowerCase().includes("duplicate") ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">Duplicate unique field</p>
                <p className="mt-1">
                  SKU, Variant SKU ya Barcode already database me exist karta
                  hai. New unique value daalo.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {successMessage ? (
          <section className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            {successMessage}
          </section>
        ) : null}

        <div className="mt-8">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[1.5rem] border border-neutral-200 bg-white text-sm text-neutral-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading variant detail from backend...
            </div>
          ) : defaultValues ? (
            <VariantForm
  key={variantId}
  defaultValues={defaultValues}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
              Variant detail load nahi hua.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
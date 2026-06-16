"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { VariantForm } from "@/components/admin/catalog/variants/variant-form";
import type { VariantFormValues } from "@/components/admin/catalog/variants/variant-schema";

type VariantCreateResponse = {
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

function getApiErrorMessage(data: VariantCreateResponse, fallback: string) {
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

function buildVariantCreatePayload(values: VariantFormValues) {
  const productId = cleanString(values.productId);
  const size = cleanString(values.size);
  const color = cleanString(values.color);
  const sku = cleanString(values.sku);

  if (!productId) {
    throw new Error("Product ID required hai.");
  }

  if (!sku) {
    throw new Error("SKU required hai. Unique SKU daalo.");
  }

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

const payload = {
  productId,
  variantType,

  sku,
  variantSku: cleanOptionalString(values.variantSku),
  barcode: cleanOptionalString(values.barcode),

  size,
  color,

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

   price: toRequiredNumber(values.price),
compareAtPrice: toOptionalNumber(values.compareAtPrice),
salePrice: toOptionalNumber(values.salePrice),

stock: toRequiredNumber(values.stock),

attributes: removeUndefinedFields({
  fabric: cleanOptionalString(values.attributesFabric || values.fabric),
  occasion: cleanOptionalString(values.attributesOccasion),
}),

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

export default function NewVariantPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(values: VariantFormValues) {
    try {
      setIsSubmitting(true);
      setApiError(null);
      setSuccessMessage(null);

      const payload = buildVariantCreatePayload(values);
      const url = `${getApiRootUrl()}/admin/catalog/variants`;

      console.log("GLOBAL_VARIANT_CREATE_FORM_VALUES:", values);
      console.log("GLOBAL_VARIANT_CREATE_REQUEST:", {
        url,
        payload,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await parseApiResponse<VariantCreateResponse>(
        response,
        "Global variant create API JSON response nahi de rahi"
      );

      console.log("GLOBAL_VARIANT_CREATE_RESPONSE:", json);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Variant create failed: ${response.status} ${response.statusText}`
          )
        );
      }

      setSuccessMessage("Global variant successfully create ho gaya.");

      setTimeout(() => {
        router.push("/admin/catalog/variants");
      }, 700);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Variant create failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
            Create Global Variant
          </h1>

          <p className="mt-4 text-lg text-neutral-600">
            Create a catalog/product variant using global API{" "}
            <span className="font-semibold text-neutral-950">
              POST /admin/catalog/variants
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
          <VariantForm
            defaultValues={{
              productId: "",
              sku: "",
              variantSku: "",
              barcode: "",

              businessType: "SHAHSI",
              commerceTypes: ["RETAIL"],

              variantType: "SIZE",
              rentalPackageName: "",
              subscriptionPackageName: "",

              size: "",
              color: "",
              colorFamily: "",
              fabric: "",

              height: "",
              dressLength: "",
              lengthLabel: "",
              neckline: "",
              sleeveLength: "",
              detail: "",

              price: 0,
              compareAtPrice: undefined,
              salePrice: undefined,
              rentalPrice: undefined,
              resalePrice: undefined,
              mtoPrice: undefined,

              stock: 0,
              reservedStock: 0,

              status: "ACTIVE",

              chest: undefined,
              waist: undefined,
              hip: undefined,
              length: undefined,
              sleeve: undefined,
              shoulder: undefined,

              bustMeasurement: undefined,
              waistMeasurement: undefined,
              hipMeasurement: undefined,
              garmentLength: undefined,

              stretchLevel: "",
              fitType: "",

              attributesFabric: "",
              attributesOccasion: "",

              weight: 0,
              weightUnit: "kg",

              isAvailable: true,
              isActive: true,
              isShipsNow: true,
              productionType: "READY_STOCK",

              customLengthAllowed: false,
              minCustomLength: undefined,
              maxCustomLength: undefined,
              productionLeadTimeDays: undefined,
              rushEligible: false,
              rushFee: undefined,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </main>
  );
}
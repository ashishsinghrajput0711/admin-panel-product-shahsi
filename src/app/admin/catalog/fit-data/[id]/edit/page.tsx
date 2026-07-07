"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { FitDataForm } from "@/components/admin/catalog/fit-data/fit-data-form";
import type { FitDataFormValues } from "@/components/admin/catalog/fit-data/fit-data-schema";
import {
  getCatalogFitDataById,
  updateCatalogFitData,
  type CatalogFitDataDetail,
  type ProductFitDataPayload,
  type CatalogProductPickerItem,
} from "@/lib/admin/catalog-fit-data-api";

function numberText(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function mapDetailToFormValues(
  detail: CatalogFitDataDetail,
): Partial<FitDataFormValues> {
  const source = detail.fitData || detail;

  return {
    productId: source.productId || detail.productId || "",
    scope: (source.scope as "PRODUCT" | "VARIANT") || "PRODUCT",
    variantId: source.variantId || detail.variantId || "",
    status:
      (source.status as "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED") ||
      (detail.status as "ACTIVE" | "DRAFT" | "INACTIVE" | "ARCHIVED") ||
      "ACTIVE",

    fitType: source.fitType || "REGULAR",
    silhouette: source.silhouette || "A_LINE",
    lengthType: source.lengthType || "FLOOR_LENGTH",
    stretchLevel: source.stretchLevel || "LOW",
    supportLevel: source.supportLevel || "MEDIUM",
    closureType: source.closureType || "ZIPPER",
    neckline: source.neckline || "SWEETHEART",
    sleeveLength: source.sleeveLength || "SLEEVELESS",
    waistline: source.waistline || "NATURAL",

    fitNotes: source.fitNotes || "",
    sizeRecommendationNote: source.sizeRecommendationNote || "",

    modelHeight: source.modelInfo?.height || "",
    modelWearingSize: source.modelInfo?.wearingSize || "",
    modelBust: numberText(source.modelInfo?.bust),
    modelWaist: numberText(source.modelInfo?.waist),
    modelHips: numberText(source.modelInfo?.hips),

    guideBust: source.measurementGuide?.bust || "",
    guideWaist: source.measurementGuide?.waist || "",
    guideHips: source.measurementGuide?.hips || "",
    guideLength: source.measurementGuide?.length || "",

    sizeChart:
      Array.isArray(source.sizeChart) && source.sizeChart.length
        ? source.sizeChart.map((row) => ({
            size: row.size || "",
            bust: numberText(row.bust),
            waist: numberText(row.waist),
            hips: numberText(row.hips),
            length: numberText(row.length),
          }))
        : [
            {
              size: "S",
              bust: "",
              waist: "",
              hips: "",
              length: "",
            },
          ],

    alterationAllowed: Boolean(source.alterationAllowed),
    customSizingAvailable: Boolean(source.customSizingAvailable),
    isActive: source.isActive !== false,

    recommendedForBodyTypes: Array.isArray(source.recommendedForBodyTypes)
      ? source.recommendedForBodyTypes
      : [],
    notRecommendedForBodyTypes: Array.isArray(source.notRecommendedForBodyTypes)
      ? source.notRecommendedForBodyTypes
      : [],
  };
}

export default function EditFitDataPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = String(params?.id ?? "");

  const [detail, setDetail] = useState<CatalogFitDataDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFitData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await getCatalogFitDataById(id);

      setDetail(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Fit data detail load nahi ho paaya.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFitData();
  }, [loadFitData]);

  const defaultValues = useMemo(() => {
    if (!detail) return undefined;

    return mapDetailToFormValues(detail);
  }, [detail]);


    const selectedProduct = useMemo<CatalogProductPickerItem | null>(() => {
    if (!detail?.productId) return null;

    return {
      id: detail.productId,
      name: detail.productName || "Selected product",
      sku: detail.productSku || null,
      slug: detail.productSlug || null,
      image: detail.productImage || null,
      hasFitData: true,
    };
  }, [detail]);

  async function handleSubmit(values: ProductFitDataPayload) {
    try {
      setIsSubmitting(true);
      setMessage(null);
      setErrorMessage(null);

      await updateCatalogFitData(id, values);

      setMessage("Fit data update ho gaya.");
      await loadFitData();
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Fit data update failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading fit data...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/fit-data"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fit data
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Fit Data
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Edit Fit Data
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update product fit classification, model info, size chart and body
          type recommendations.
        </p>

        {detail?.productName ? (
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Product: {detail.productName}
          </p>
        ) : null}
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {defaultValues ? (
       <FitDataForm
  defaultValues={defaultValues}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  submitLabel="Update Fit Data"
  isEditMode
  selectedProduct={selectedProduct}
/>
      ) : null}
    </main>
  );
}
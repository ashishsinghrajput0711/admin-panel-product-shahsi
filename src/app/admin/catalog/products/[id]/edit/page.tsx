"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/catalog/products/product-form";
import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";


type CommerceType = "RENTAL" | "RESALE" | "RETAIL" | "MADE_TO_ORDER";

type BackendProduct = {
  id: string;

  title?: string;
name?: string;
description?: string | null;
shortDescription?: string | null;
tabDescription?: string | null;
slug?: string;
sku?: string;

  mode?: string | null;
  productType?: string | null;
  commerceTypes?: string[] | null;
  masterSku?: string | null;

  collection?: string | null;
  season?: string | null;
  gender?: string | null;
  styleTags?: string[] | null;
  dynamicAttributes?: unknown;
  metafields?: Record<string, unknown> | null;

  shopSettings?: unknown;
  rentalSettings?: unknown;
  resaleSettings?: unknown;
  madeToOrderSettings?: unknown;
  subscriptionSettings?: unknown;

  category?: string | null;
  primaryCategory?: string | null;
  brand?: string | null;
  vendor?: string | null;
  color?: string | null;
  fabric?: string | null;
  occasion?: string | null;
  composition?: string | null;
  style?: string | null;
  print?: string | null;
  badge?: string | null;
  primaryCollection?: string | null;
  secondaryCollection?: string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  careInstructions?: string[] | null;
  highlights?: string[] | null;
  serviceHighlights?: Record<string, unknown> | null;
  materialDetails?: string | null;
  fitDetails?: string | null;
  modelInfo?: string | null;
  warrantyText?: string | null;
  authenticityText?: string | null;

  basePrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  currency?: string | null;

  productionType?: string | null;
  isMadeToOrder?: boolean | null;
  allowCustomSizing?: boolean | null;
  allowRushProduction?: boolean | null;
  standardLeadTimeDays?: number | null;
  rushLeadTimeDays?: number | null;
  rushFee?: number | null;
  customSizingFinalSale?: boolean | null;

  availabilityStatus?: string | null;
  availabilityLabel?: string | null;
  lowStockThreshold?: number | null;
  soldInLastHours?: number | null;
  soldHoursWindow?: number | null;
  viewingNow?: number | null;

  estimatedDomestic?: string | null;
  estimatedInternational?: string | null;
  pickupAvailable?: boolean | null;
  shippingAvailable?: boolean | null;
  pickupReadyIn?: string | null;
  returnWindowDays?: number | null;
  returnText?: string | null;
  isFinalSale?: boolean | null;
  storeName?: string | null;
  storeLocation?: string | null;
  storeAddress?: string | null;
  storePickupAvailable?: boolean | null;

  status?: string;
  adminStatus?: string;
  statusLabel?: string;

  seoTitle?: string | null;
  seoDescription?: string | null;
  metaKeywords?: string[] | null;

  printSwatch?: string | null;
  adminNotes?: string | null;

  availableForSubscription?: boolean | null;
  availableForDailyRent?: boolean | null;
  rentalCondition?: string | null;
  cleaningBufferDays?: number | null;
  sellerId?: string | null;
  eventType?: string | null;
  sizeLabel?: string | null;
  rentalPrice?: number | null;
  resalePrice?: number | null;
  isRentable?: boolean | null;
  isSellable?: boolean | null;

  listingType?: string | null;
  resaleCondition?: string | null;
  originalPrice?: number | null;
  listingPrice?: number | null;
  allowOffers?: boolean | null;
  minOfferPrice?: number | null;
  occasionTags?: string[] | null;
  verificationStatus?: string | null;
  resaleStatus?: string | null;
  resaleColors?: string[] | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  patternColor?: string | null;
  conditionPhotoUrls?: string[] | null;

  variants?: unknown[];
  images?: unknown[];
  colors?: unknown[];
  reviews?: unknown[];
  sizeGuides?: unknown[];
  relatedProducts?: unknown[];
  attributeValues?: unknown[];
};

type ProductDetailApiResponse = {
  success: boolean;
  data?: BackendProduct | { product?: BackendProduct; data?: BackendProduct };
  product?: BackendProduct;
  error?: unknown;
  message?: string;
};

type ProductUpdateApiResponse = {
  success?: boolean;
  data?: unknown;
  product?: unknown;
  error?: unknown;
  message?: string;
};

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_ADMIN_API_URL missing hai. .env.local me backend URL set karo."
    );
  }

  return baseUrl.replace(/\/$/, "");
}

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function requireString(
  value: string | null | undefined,
  fieldName: string,
  productId: string
) {
  if (!value || !value.trim()) {
    throw new Error(`Product ${productId} me "${fieldName}" missing hai.`);
  }

  return value;
}

function extractProduct(response: ProductDetailApiResponse, id: string) {
  if (!response.success) {
    throw new Error(
      response.message || `Product ${id} detail API success false return kar rahi hai.`
    );
  }

  if (response.product) return response.product;

  if (response.data && "id" in response.data) {
    return response.data as BackendProduct;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "product" in response.data &&
    response.data.product
  ) {
    return response.data.product as BackendProduct;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    response.data.data
  ) {
    return response.data.data as BackendProduct;
  }

  throw new Error(
    `Product ${id} detail response me product object nahi mila. Expected response.data ya response.data.product.`
  );
}

function isUsableString(value: unknown) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();

  if (!trimmed) return false;

  const blockedValues = [
    "string",
    "category_cuid",
    "subcategory_cuid",
    "undefined",
    "null",
  ];

  return !blockedValues.includes(trimmed.toLowerCase());
}

function firstUsableString(values: unknown[]) {
  const value = values.find(isUsableString);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(product: BackendProduct, productId: string) {
  const rawStatus = firstUsableString([
    product.adminStatus,
    product.statusLabel,
    product.status,
  ]);

  if (!rawStatus) {
    throw new Error(`Product ${productId} me "status/adminStatus" missing hai.`);
  }

  const status = rawStatus.toUpperCase();

  if (
    status === "ACTIVE" ||
    status === "INACTIVE" ||
    status === "ARCHIVED" ||
    status === "DRAFT"
  ) {
    return status as ProductFormValues["status"];
  }

  throw new Error(`Product ${productId} me unsupported status "${status}" mila.`);
}

function normalizeProductType(product: BackendProduct) {
  const productType = firstUsableString([product.productType]).toUpperCase();

  if (
    productType === "DRESS" ||
    productType === "ACCESSORY" ||
    productType === "SWATCH" ||
    productType === "EDITORIAL_PRODUCT" ||
    productType === "RESALE_LISTING" ||
    productType === "RENTAL_LISTING"
  ) {
    return productType as ProductFormValues["productType"];
  }

  return "DRESS";
}

function normalizeCommerceTypes(product: BackendProduct): CommerceType[] {
  const rawTypes = Array.isArray(product.commerceTypes)
    ? product.commerceTypes
    : [];

  const allowedCommerceTypes: CommerceType[] = [
    "RETAIL",
    "RENTAL",
    "RESALE",
    "MADE_TO_ORDER",
  ];

  const normalizedTypes = rawTypes
    .map((item) => String(item ?? "").trim().toUpperCase())
    .filter((item): item is CommerceType =>
      allowedCommerceTypes.includes(item as CommerceType)
    );

  if (normalizedTypes.length > 0) {
    return Array.from(new Set(normalizedTypes));
  }

  const mode = String(product.mode ?? product.productType ?? "")
    .trim()
    .toUpperCase();

  if (mode === "RENTAL") return ["RENTAL"];
  if (mode === "RESALE") return ["RESALE"];
  if (mode === "MADE_TO_ORDER" || mode === "MTO") return ["MADE_TO_ORDER"];

  return ["RETAIL"];
}

function mapBackendProductToForm(product: BackendProduct): Partial<ProductFormValues> {
  const id = requireString(product.id, "id", "UNKNOWN_PRODUCT");

  const name = requireString(product.title || product.name, "title/name", id);
  const sku = requireString(product.sku, "sku", id);
  const slug = requireString(product.slug, "slug", id);

  const categoryId = firstUsableString([
    product.category,
    product.primaryCategory,
    product.categories?.[0],
    product.collection,
  ]);

  if (!categoryId) {
    throw new Error(`Product ${id} me valid "category" missing hai.`);
  }

  const price =
    product.basePrice ??
    product.listingPrice ??
    product.originalPrice ??
    product.resalePrice ??
    product.rentalPrice;

  if (typeof price !== "number" || !Number.isFinite(price)) {
    throw new Error(`Product ${id} me "basePrice/price" missing hai.`);
  }

  const shortDescription = firstUsableString([
    product.shortDescription,
    product.tabDescription,
  ]);

  const description = firstUsableString([
    product.description,
    product.tabDescription,
    product.materialDetails,
  ]);

  const brand = firstUsableString([product.brand, product.vendor, "Shahsi"]);

  return {
    name,
    sku,
    slug,

    description,
    shortDescription,
    brand,

    categoryId,
    subcategoryId: "",

    businessType: "SHAHSI",
    commerceTypes: normalizeCommerceTypes(product),
    productType: normalizeProductType(product),
    status: normalizeStatus(product, id),

    price,
    salePrice:
      product.compareAtPrice ??
      product.originalPrice ??
      product.listingPrice ??
      undefined,

    seoTitle: firstUsableString([product.seoTitle]),
    seoDescription: firstUsableString([product.seoDescription]),
  };
}

function buildBasicInfoPayload(
  values: ProductFormValues,
  product: BackendProduct
) {
  const extendedValues = values as ProductFormValues & {
    shortDescription?: string;
    brand?: string;
    productType?: string;
  };

  return {
    title: values.name,
    description: values.description ?? "",
    shortDescription:
      extendedValues.shortDescription ?? product.shortDescription ?? "",

    category: values.categoryId,
    productType: extendedValues.productType ?? product.productType ?? "",

    brand: extendedValues.brand ?? product.brand ?? "",
    vendor: extendedValues.brand ?? product.vendor ?? "",

  color: product.color ?? "",
  fabric: product.fabric || "",
  occasion: product.occasion ?? "",
  };
}

function buildCommerceSettingsPayload(
  values: ProductFormValues,
  product: BackendProduct
) {
  const isRetailSelected = values.commerceTypes.includes("RETAIL");
  const isRentalSelected = values.commerceTypes.includes("RENTAL");
  const isResaleSelected = values.commerceTypes.includes("RESALE");
  const isMtoSelected = values.commerceTypes.includes("MADE_TO_ORDER");

  return {
    isSellable: isRetailSelected || isResaleSelected,
    isRentable: isRentalSelected,
    availableForDailyRent: isRentalSelected,
    availableForSubscription: product.availableForSubscription ?? false,
    isMadeToOrder: isMtoSelected,
    allowCustomSizing: product.allowCustomSizing ?? false,
    allowRushProduction: product.allowRushProduction ?? false,
  };
}

function buildPricingPayload(
  values: ProductFormValues,
  product: BackendProduct
) {
  return {
    basePrice: values.price,
    compareAtPrice: values.salePrice ?? product.compareAtPrice ?? 0,
    discountPercent: product.discountPercent ?? 0,
    currency: product.currency ?? "USD",
    rentalPrice: product.rentalPrice ?? 0,
    resalePrice: product.resalePrice ?? 0,
    listingPrice: product.listingPrice ?? values.price,
    minOfferPrice: product.minOfferPrice ?? 0,
  };
}

function buildAvailabilityPayload(
  values: ProductFormValues,
  product: BackendProduct
) {
  return {
    availabilityStatus: product.availabilityStatus ?? "in_stock",
    availabilityLabel: product.availabilityLabel ?? "In stock",
    lowStockThreshold: product.lowStockThreshold ?? 0,
    pickupAvailable: product.pickupAvailable ?? false,
    shippingAvailable: product.shippingAvailable ?? true,
  };
}

function buildSeoPayload(values: ProductFormValues, product: BackendProduct) {
  return {
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    metaKeywords: product.metaKeywords,
    slug: values.slug,
  };
}

function buildStatusPayload(values: ProductFormValues) {
  return {
    status: values.status.toLowerCase(),
  };
}

function buildMetafieldsPayload(
  values: ProductFormValues,
  product: BackendProduct
) {
  const metafields = product.metafields ?? {};

  return {
    productFaqs:
      typeof metafields.productFaqs === "string"
        ? metafields.productFaqs
        : "",

    careInstructions:
      typeof metafields.careInstructions === "string"
        ? metafields.careInstructions
        : Array.isArray(product.careInstructions)
          ? product.careInstructions.join(", ")
          : "",

    compositionOrigin:
      typeof metafields.compositionOrigin === "string"
        ? metafields.compositionOrigin
        : product.composition ?? "",

    customBadge:
      typeof metafields.customBadge === "string"
        ? metafields.customBadge
        : product.badge ?? "",

    seeMoreFrom:
      typeof metafields.seeMoreFrom === "string"
        ? metafields.seeMoreFrom
        : "",

    primaryCollection:
      typeof metafields.primaryCollection === "string"
        ? metafields.primaryCollection
        : product.primaryCollection ?? "",

    secondaryCollection:
      typeof metafields.secondaryCollection === "string"
        ? metafields.secondaryCollection
        : product.secondaryCollection ?? "",

    similarColorProducts: Array.isArray(metafields.similarColorProducts)
      ? metafields.similarColorProducts
      : [],

    matchWithAccessories: Array.isArray(metafields.matchWithAccessories)
      ? metafields.matchWithAccessories
      : [],

    completeTheLook: Array.isArray(metafields.completeTheLook)
      ? metafields.completeTheLook
      : [],

    advancedProductTitle:
      typeof metafields.advancedProductTitle === "string"
        ? metafields.advancedProductTitle
        : "",

    similarStyleProduct: Array.isArray(metafields.similarStyleProduct)
      ? metafields.similarStyleProduct
      : [],

    style:
      typeof metafields.style === "string"
        ? metafields.style
        : product.style ?? "",

  fabric: product.fabric ?? "",

    print:
      typeof metafields.print === "string"
        ? metafields.print
        : product.print ?? "",

    printSwatch:
      typeof metafields.printSwatch === "string"
        ? metafields.printSwatch
        : product.printSwatch ?? "",

    similarPrintTitle:
      typeof metafields.similarPrintTitle === "string"
        ? metafields.similarPrintTitle
        : "",

    similarPrintProducts: Array.isArray(metafields.similarPrintProducts)
      ? metafields.similarPrintProducts
      : [],
  };
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
    throw new Error(`${fallbackMessage}. Non JSON body: ${text}`);
  }
}

function getApiErrorMessage(data: ProductUpdateApiResponse, fallback: string) {
  if (typeof data.message === "string") {
    return data.message;
  }

  if (Array.isArray((data as Record<string, unknown>).message)) {
    return ((data as Record<string, unknown>).message as string[]).join(", ");
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (data.error && typeof data.error === "object") {
    const errorRecord = data.error as Record<string, unknown>;

    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }

    if (Array.isArray(errorRecord.message)) {
      return errorRecord.message.join(", ");
    }
  }

  return fallback;
}



export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [defaultValues, setDefaultValues] =
    useState<Partial<ProductFormValues> | null>(null);
  const [productTitle, setProductTitle] = useState("Edit Product");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [originalProduct, setOriginalProduct] =
  useState<BackendProduct | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const detailUrl = useMemo(() => {
    if (!id) return null;
    return `${getApiBaseUrl()}/admin/catalog/${id}/detail`;
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        if (!id || !detailUrl) {
          throw new Error("Product id missing hai.");
        }

        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);

        console.log("PRODUCT_DETAIL_FETCH_URL:", detailUrl);

        const response = await fetch(detailUrl, {
          method: "GET",
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        const text = await response.text();

        let json: ProductDetailApiResponse;

        try {
          json = JSON.parse(text) as ProductDetailApiResponse;
        } catch {
          throw new Error(`Product detail API JSON response nahi de rahi. Body: ${text}`);
        }

        console.log("PRODUCT_DETAIL_FETCH_RESPONSE:", json);

        if (!response.ok) {
          throw new Error(
            json.message ||
              `Product detail API failed: ${response.status} ${response.statusText}`
          );
        }

     const product = extractProduct(json, id);
const mappedValues = mapBackendProductToForm(product);

if (!ignore) {
  setOriginalProduct(product);
  setDefaultValues(mappedValues);
  setProductTitle(mappedValues.name || "Edit Product");
}
      } catch (error) {
        if (!ignore) {
          setDefaultValues(null);
          setApiError(
            error instanceof Error
              ? error.message
              : "Product detail load failed."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id, detailUrl]);

 async function handleSubmit(values: ProductFormValues) {
  try {
    if (!id) {
      throw new Error("Product id missing hai.");
    }

    if (!originalProduct) {
      throw new Error(
        "Original product data missing hai. Save se pehle detail API data required hai."
      );
    }

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    const baseUrl = getApiBaseUrl();

    const endpoints = [
      {
        name: "basic-info",
        url: `${baseUrl}/admin/catalog/${id}/basic-info`,
        payload: buildBasicInfoPayload(values, originalProduct),
      },
      {
        name: "commerce-settings",
        url: `${baseUrl}/admin/catalog/${id}/commerce-settings`,
        payload: buildCommerceSettingsPayload(values, originalProduct),
      },
      {
        name: "pricing",
        url: `${baseUrl}/admin/catalog/${id}/pricing`,
        payload: buildPricingPayload(values, originalProduct),
      },
      {
        name: "availability",
        url: `${baseUrl}/admin/catalog/${id}/availability`,
        payload: buildAvailabilityPayload(values, originalProduct),
      },
      {
        name: "seo",
        url: `${baseUrl}/admin/catalog/${id}/seo`,
        payload: buildSeoPayload(values, originalProduct),
      },
      {
        name: "status",
        url: `${baseUrl}/admin/catalog/${id}/status`,
        payload: buildStatusPayload(values),
      },
      {
        name: "metafields",
        url: `${baseUrl}/admin/catalog/${id}/metafields`,
        payload: buildMetafieldsPayload(values, originalProduct),
      },
    ];

    for (const endpoint of endpoints) {
      console.log(`PRODUCT_${endpoint.name.toUpperCase()}_UPDATE:`, {
        url: endpoint.url,
        payload: endpoint.payload,
      });

      const response = await fetch(endpoint.url, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(endpoint.payload),
      });

      const json = await parseApiResponse<ProductUpdateApiResponse>(
        response,
        `${endpoint.name} update API JSON response nahi de rahi`
      );

      console.log(`PRODUCT_${endpoint.name.toUpperCase()}_UPDATE_RESPONSE:`, json);

      if (!response.ok) {
        throw new Error(
          `${endpoint.name} failed: ${getApiErrorMessage(
            json,
            `${response.status} ${response.statusText}`
          )}`
        );
      }
    }

    setSuccessMessage("Product successfully update ho gaya.");
    setProductTitle(values.name);
  } catch (error) {
    setApiError(
      error instanceof Error ? error.message : "Product update failed."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
          Loading product...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/catalog/products"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to products
            </Link>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Admin / Catalog / Products
            </p>

            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              {productTitle}
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Backend connected product editing for identity, category, commerce, pricing and SEO.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Real API mode
          </div>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Product API error</p>
            <p className="mt-1 text-xs">
              Real backend data operation fail hui. Fallback/mock data use nahi kiya gaya.
            </p>
            <p className="mt-2 rounded-md bg-white/70 p-2 text-xs">{apiError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        {!defaultValues ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Product form load nahi hua</p>
            <p className="mt-1 text-sm">
              Backend detail response valid nahi mila. Form fallback values ke saath open nahi kiya gaya.
            </p>
          </div>
        ) : (
          <ProductForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </main>
  );
}
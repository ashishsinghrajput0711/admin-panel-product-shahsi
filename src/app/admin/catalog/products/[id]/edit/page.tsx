"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { syncProductCategories } from "@/lib/admin/category-product-sync";
import { useParams, useRouter } from "next/navigation";

import { ProductPricingSection } from "@/components/admin/catalog/products/product-pricing-section";


import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink,
  RotateCcw,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { ProductForm } from "@/components/admin/catalog/products/product-form";
import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";

import type { ProductMediaItem } from "@/lib/admin/product-media-upload";
import { saveProductMetafields } from "@/lib/admin/product-metafields-api";

import { saveProductTags } from "@/lib/admin/product-tags-api";
import {
  getProductSeo,
  saveProductSeo,
} from "@/lib/admin/product-seo-api";

import { saveProductCategoryMetafields } from "@/lib/admin/product-taxonomy-metafields-api";
import { buildCatalogProductPayload } from "@/lib/admin/product-payload";

type ProductFormRecordValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

function normalizeProductFormRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const cleaned: Record<string, ProductFormRecordValue> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    if (!key) return;

    if (
      item === undefined ||
      item === null ||
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      cleaned[key] = item as ProductFormRecordValue;
      return;
    }

    if (Array.isArray(item)) {
      const list = item
        .map((entry) => {
          if (
            typeof entry === "string" ||
            typeof entry === "number"
          ) {
            return entry;
          }

          if (entry && typeof entry === "object") {
            const option = entry as Record<string, unknown>;
            const value =
              option.value ??
              option.label ??
              option.name ??
              option.slug ??
              option.code ??
              option.id ??
              "";

            if (typeof value === "string" || typeof value === "number") {
              return value;
            }
          }

          return "";
        })
        .filter((entry): entry is string | number => entry !== "");

     if (list.length) {
  cleaned[key] = list.map(String);
}

      return;
    }

    if (item && typeof item === "object") {
      const option = item as Record<string, unknown>;
      const value =
        option.value ??
        option.label ??
        option.name ??
        option.slug ??
        option.code ??
        option.id ??
        "";

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        cleaned[key] = value;
      }
    }
  });

  return cleaned;
}

type CommerceType = "RENTAL" | "RESALE" | "RETAIL" | "MADE_TO_ORDER";

type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

type MetafieldRecord = Record<string, MetafieldValue>;

type BackendProduct = {
  taxonomyId?: string | null;
  googleMerchantData?: Record<string, unknown> | null;
  dynamicAttributes?: Record<string, unknown> | null;
taxonomyCategoryId?: string | null;
taxonomyName?: string | null;
taxonomyPath?: string | null;
taxonomy?: {
  id?: string | null;
  taxonomyId?: string | null;
  name?: string | null;
  fullPath?: string | null;
  label?: string | null;
  parentName?: string | null;
  metafieldCount?: number | null;
} | null;
categoryMetafields?: MetafieldRecord | null;
  id: string;
  title?: string | null;
  media?: ProductMediaItem[] | null;
  images?: ProductMediaItem[] | null;
  name?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  slug?: string | null;
  sku?: string | null;
  category?: string | null;
  primaryCategory?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  categories?: string[] | null;
  brand?: string | null;
  status?: string | null;
  adminStatus?: string | null;
  statusLabel?: string | null;
  productType?: string | null;
  mode?: string | null;
  commerceTypes?: string[] | null;
  businessType?: string | null;
  basePrice?: number | null;
  price?: number | null;
  compareAtPrice?: number | null;
  salePrice?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  pinterestTitle?: string | null;
  pinterestDescription?: string | null;
  pinterestImage?: string | null;
  socialTitle?: string | null;
  socialCaption?: string | null;
  socialImage?: string | null;
  image?: string | null;



  tags?: string[] | null;
occasionTags?: string[] | null;
metaKeywords?: string[] | null;
  metafields?: {
    productMetafields?: MetafieldRecord | null;
    data?: {
  metafields?: MetafieldRecord | null;
} | null;
    categoryMetafields?: MetafieldRecord | null;
    [key: string]: unknown;
  } | null;
  productMetafields?: MetafieldRecord | null;
  data?: {
    metafields?: MetafieldRecord | null;
  } | null;

};

type ProductDetailApiResponse = {
  success?: boolean;
  data?: BackendProduct | { product?: BackendProduct; data?: BackendProduct };
  product?: BackendProduct;
  message?: string;
  error?: unknown;
};

type ProductUpdateApiResponse = {
  success?: boolean;
  data?: unknown;
  product?: unknown;
  message?: string;
  error?: unknown;
};

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
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


async function updateProductStatus(productId: string, status: string) {
  const token = getToken();

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/${encodeURIComponent(productId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Product status update failed: ${response.status} ${response.statusText}`,
    );
  }

  return data;
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

async function readJson<T>(
  response: Response,
  fallbackMessage: string
): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fallbackMessage}. Body: ${text}`);
  }
}

function extractProduct(response: ProductDetailApiResponse | null, id: string) {
  if (!response) {
    throw new Error(`Product ${id} detail API empty response de rahi hai.`);
  }

  if (response.success === false) {
    throw new Error(
      response.message ||
        `Product ${id} detail API success false return kar rahi hai.`
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

  throw new Error(`Product ${id} detail response shape unsupported hai.`);
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

function normalizeStatus(product: BackendProduct): ProductFormValues["status"] {
  const status = String(
    product.adminStatus || product.statusLabel || product.status || "DRAFT"
  ).toUpperCase();

  if (status === "ACTIVE") return "ACTIVE";
  if (status === "INACTIVE") return "INACTIVE";
  if (status === "ARCHIVED") return "ARCHIVED";

  return "DRAFT";
}

function normalizeProductType(
  product: BackendProduct
): ProductFormValues["productType"] {
  const productType = String(product.productType || "").toUpperCase();

  if (productType === "ACCESSORY") return "ACCESSORY";
  if (productType === "SWATCH") return "SWATCH";
  if (productType === "EDITORIAL_PRODUCT") return "EDITORIAL_PRODUCT";
  if (productType === "RESALE_LISTING") return "RESALE_LISTING";
  if (productType === "RENTAL_LISTING") return "RENTAL_LISTING";

  return "DRESS";
}

function normalizeBusinessType(
  product: BackendProduct
): ProductFormValues["businessType"] {
  const businessType = String(product.businessType || "").toUpperCase();

  if (businessType === "GOWNLOOP") return "GOWNLOOP";

  return "SHAHSI";
}

function getProductCategorySlugs(product: BackendProduct) {
  return Array.from(
    new Set(
      [
        ...(Array.isArray(product.categories) ? product.categories : []),
        product.primaryCategory || "",
        product.category || "",
        product.categoryId || "",
      ]
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );
}

function getProductMetafields(product: BackendProduct): MetafieldRecord {
  const allowedKeys = [
    "productFaqs",
    "careInstructions",
    "compositionOrigin",
    "customBadge",
    "seeMoreFrom",
    "primaryCollection",
    "secondaryCollection",
    "similarColorProducts",
    "matchWithAccessories",
    "completeTheLook",
    "advancedProductTitle",
    "similarStyleProduct",
    "style",
    "fabric",
    "print",
    "printSwatch",
    "similarPrintTitle",
    "similarPrintProducts",
  ];

  const possibleSources = [
    product.metafields,
    product.productMetafields,
    product.data && typeof product.data === "object"
      ? (product.data as { metafields?: MetafieldRecord }).metafields
      : null,
  ];

  for (const source of possibleSources) {
    if (!source || typeof source !== "object") continue;

    const sourceRecord = source as MetafieldRecord;

    const extracted = allowedKeys.reduce<MetafieldRecord>((acc, key) => {
      if (sourceRecord[key] !== undefined) {
        acc[key] = sourceRecord[key];
      }

      return acc;
    }, {});

    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
  }

  const productRecord = product as unknown as MetafieldRecord;

  return allowedKeys.reduce<MetafieldRecord>((acc, key) => {
    if (productRecord[key] !== undefined) {
      acc[key] = productRecord[key];
    }

    return acc;
  }, {});
}

function getCategoryMetafields(product: BackendProduct): MetafieldRecord {
  if (
    product.metafields &&
    typeof product.metafields === "object" &&
    product.metafields.categoryMetafields &&
    typeof product.metafields.categoryMetafields === "object"
  ) {
    return product.metafields.categoryMetafields;
  }

  if (
    product.categoryMetafields &&
    typeof product.categoryMetafields === "object"
  ) {
    return product.categoryMetafields;
  }

  return {};
}

function mapProductToFormValues(product: BackendProduct): ProductFormValues {
  const categories = getProductCategorySlugs(product);
  const primaryCategory =
    product.categoryId ||
    product.primaryCategory ||
    product.category ||
    categories[0] ||
    "";

  return {

    taxonomyId:
  product.taxonomy?.taxonomyId ||
  product.taxonomyId ||
  "",

taxonomy: product.taxonomy
  ? {
      id: product.taxonomy.id || product.taxonomyCategoryId || null,
      taxonomyId: product.taxonomy.taxonomyId || product.taxonomyId || "",
      name: product.taxonomy.name || product.taxonomyName || "",
      fullPath: product.taxonomy.fullPath || product.taxonomyPath || "",
      label:
        product.taxonomy.label ||
        (product.taxonomyName ? `${product.taxonomyName}` : ""),
      parentName: product.taxonomy.parentName || null,
      metafieldCount: product.taxonomy.metafieldCount || null,
    }
  : product.taxonomyId
    ? {
        id: product.taxonomyCategoryId || null,
        taxonomyId: product.taxonomyId,
        name: product.taxonomyName || "",
        fullPath: product.taxonomyPath || "",
        label: product.taxonomyName || product.taxonomyId,
        parentName: null,
        metafieldCount: null,
      }
    : null,

    name: product.name || product.title || "",
    sku: product.sku || "",
    slug: product.slug || "",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    brand: product.brand || "",
    categoryId: primaryCategory,
    subcategoryId: product.subcategoryId || categories[1] || "",
    categories,
    businessType: normalizeBusinessType(product),
    commerceTypes: normalizeCommerceTypes(product),
    productType: normalizeProductType(product),
    status: normalizeStatus(product),
    price: Number(product.price ?? product.basePrice ?? 0),
    salePrice:
      product.salePrice !== null && product.salePrice !== undefined
        ? Number(product.salePrice)
        : product.compareAtPrice !== null && product.compareAtPrice !== undefined
          ? Number(product.compareAtPrice)
          : undefined,
seoTitle: product.seoTitle || "",
seoDescription: product.seoDescription || "",
tags: Array.isArray(product.tags) ? product.tags : [],
occasionTags: [],
metaKeywords: [],
productMetafields: normalizeProductFormRecord(getProductMetafields(product)),
categoryMetafields: normalizeProductFormRecord(getCategoryMetafields(product)),
dynamicAttributes: normalizeProductFormRecord(product.dynamicAttributes),

googleMerchantData: normalizeProductFormRecord(product.googleMerchantData),
  };
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = String(params?.id ?? "");

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [defaultValues, setDefaultValues] =
    useState<ProductFormValues | null>(null);
  const [previousCategorySlugs, setPreviousCategorySlugs] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formKey = useMemo(() => {
    return `${productId}-${product?.id || ""}-${product?.slug || ""}`;
  }, [productId, product]);

  const loadProduct = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }

        setPageError(null);

        const response = await fetch(
          `${getApiRootUrl()}/admin/catalog/${productId}/detail`,
          {
            method: "GET",
            headers: getAuthHeaders(),
            cache: "no-store",
          }
        );

        const data = await readJson<ProductDetailApiResponse>(
          response,
          "Product detail API JSON response nahi de rahi"
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Product detail failed: ${response.status} ${response.statusText}`
          );
        }

      const nextProduct = extractProduct(data, productId);
const mappedValues = mapProductToFormValues(nextProduct);
const nextCategorySlugs = getProductCategorySlugs(nextProduct);

let seoData: Awaited<ReturnType<typeof getProductSeo>> | null = null;
let seoRecord: any = null;

try {
  seoData = await getProductSeo({
    apiRootUrl: getApiRootUrl(),
    productId,
    token: getToken(),
  });
  seoRecord = seoData as any;
} catch (seoError) {
  console.warn("PRODUCT_SEO_LOAD_FAILED:", seoError);
}

const nextDefaultValues: ProductFormValues = {
  ...mappedValues,
  seoTitle:
    seoData?.seoTitle ||
    seoData?.metaTitle ||
    mappedValues.seoTitle ||
    "",
  seoDescription:
    seoData?.seoDescription ||
    seoData?.metaDescription ||
    mappedValues.seoDescription ||
    "",
};

setProduct({
  ...nextProduct,
  seoTitle: nextDefaultValues.seoTitle,
  seoDescription: nextDefaultValues.seoDescription,
  metaTitle: seoData?.metaTitle || nextDefaultValues.seoTitle || nextProduct.seoTitle || null,
  metaDescription:
    seoData?.metaDescription ||
    nextDefaultValues.seoDescription ||
    nextProduct.seoDescription ||
    null,
  ogTitle: seoRecord?.ogTitle || nextDefaultValues.seoTitle || nextProduct.seoTitle || null,
  ogDescription:
    seoRecord?.ogDescription ||
    nextDefaultValues.seoDescription ||
    nextProduct.seoDescription ||
    null,
  ogImage: seoRecord?.ogImage || null,
  pinterestTitle:
    seoRecord?.pinterestTitle || nextDefaultValues.seoTitle || nextProduct.seoTitle || null,
  pinterestDescription:
    seoRecord?.pinterestDescription ||
    nextDefaultValues.seoDescription ||
    nextProduct.seoDescription ||
    null,
  pinterestImage: seoRecord?.pinterestImage || null,
  socialTitle: seoRecord?.socialTitle || nextDefaultValues.seoTitle || null,
  socialCaption: seoRecord?.socialCaption || nextDefaultValues.seoDescription || null,
  socialImage: seoRecord?.socialImage || null,
});
setDefaultValues(nextDefaultValues);
setPreviousCategorySlugs(nextCategorySlugs);
      } catch (error) {
        setPageError(
          error instanceof Error ? error.message : "Product detail load failed."
        );
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [productId]
  );

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId, loadProduct]);

  async function handleSubmit(values: ProductFormValues) {
    console.log("PRODUCT_EDIT_SUBMIT_START:", values);
    try {
      setIsSubmitting(true);
      setPageError(null);
      setSuccessMessage(null);

      const apiRootUrl = getApiRootUrl();
      const token = getToken();

      const response = await fetch(`${apiRootUrl}/catalog/${productId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildCatalogProductPayload(values)),
      });

      const data = await readJson<ProductUpdateApiResponse>(
        response,
        "Product update API JSON response nahi de rahi"
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Product update failed: ${response.status} ${response.statusText}`
        );
      }

      await updateProductStatus(productId, String(values.status).toUpperCase());
      try {
  await saveProductSeo({
    apiRootUrl,
    productId,
    values: {
      seoTitle: values.seoTitle || "",
      seoDescription: values.seoDescription || "",
    },
    token,
  });
} catch (seoError) {
  console.warn("PRODUCT_SEO_SAVE_FAILED:", seoError);

  setSuccessMessage(
    "Product update ho gaya, but SEO save me backend error aaya. SEO API response check karni hogi."
  );

  return;
}

try {
  await saveProductTags({
    apiRootUrl,
    productId,
    values: {
      tags: values.tags || [],
      occasionTags: values.occasionTags || [],
      metaKeywords: values.metaKeywords || [],
    },
    token,
  });
} catch (tagsError) {
  console.warn("PRODUCT_TAGS_SAVE_FAILED:", tagsError);

  setSuccessMessage(
    "Product update aur SEO save ho gaya, but tags save me backend error aaya. Tags API response check karni hogi."
  );

  return;
}

      console.log("PRODUCT_METAFIELDS_BEFORE_SAVE:", values.productMetafields);
console.log("CATEGORY_METAFIELDS_BEFORE_SAVE:", values.categoryMetafields);

      try {
  await saveProductMetafields({
    apiRootUrl,
    productId,
    productMetafields: values.productMetafields,
    categoryMetafields: values.categoryMetafields,
    token,
  });
} catch (metafieldsError) {
  console.warn("PRODUCT_METAFIELDS_SAVE_FAILED:", metafieldsError);

 setSuccessMessage(
  "Product update aur SEO save ho gaya, but product metafields save me backend error aaya. Metafields API response check karni hogi."
);

  return;
}

try {
  if (values.taxonomyId) {
    await saveProductCategoryMetafields({
      apiRootUrl,
      productId,
      taxonomyId: values.taxonomyId,
      categoryMetafields: values.categoryMetafields || {},
      token,
    });
  }
  setSuccessMessage(
  "Product update ho gaya. SEO, tags, product metafields, category metafields, associated categories aur Google Merchant data save ho gaye.",
);
} catch (categoryMetafieldsError) {
  console.warn("CATEGORY_METAFIELDS_SAVE_FAILED:", categoryMetafieldsError);

  setSuccessMessage(
    "Product update aur product metafields save ho gaye, but category metafields save me backend error aaya. Category metafields API response check karni hogi."
  );

  return;
}

console.log("CATEGORY_SYNC_VALUES:", {
  categoryId: values.categoryId,
  categories: values.categories,
});

const selectedCategoryIds = Array.from(
  new Set(
    [
      values.categoryId,
      ...(Array.isArray(values.categories) ? values.categories : []),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ),
);

console.log("CATEGORY_SYNC_PAYLOAD:", {
  productId,
  categoryIds: selectedCategoryIds,
  primaryCategoryId: values.categoryId || selectedCategoryIds[0],
});

if (selectedCategoryIds.length) {
  try {
    console.log("CATEGORY_SYNC_CALL_START");

const categorySlugsForSync = Array.isArray((values as any).categorySlugsForSync)
  ? ((values as any).categorySlugsForSync as string[])
  : [];

console.log("CATEGORY_SYNC_SLUGS_FROM_FORM:", categorySlugsForSync);

const categorySyncResponse = await syncProductCategories({
  apiRootUrl: getApiRootUrl(),
  productId,
  selectedCategorySlugs: categorySlugsForSync,
  previousCategorySlugs: [],
  token: getToken(),
});

    console.log("CATEGORY_SYNC_CALL_SUCCESS:", categorySyncResponse);
  } catch (categorySyncError) {
    console.warn("PRODUCT_CATEGORY_SYNC_FAILED:", categorySyncError);

    setSuccessMessage(
      "Product update ho gaya, but associated categories sync me backend error aaya. Category sync API response check karni hogi.",
    );

    return;
  }
}

setPreviousCategorySlugs(selectedCategoryIds);

setSuccessMessage(
  "Product update ho gaya. SEO, tags, product metafields, category metafields, associated categories aur Google Merchant data save ho gaye.",
);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Product update failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
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

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Update product identity, category, commerce, pricing, metafields
              and SEO data.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
  {product ? (
    <ProductMoreActions
      product={product}
      productId={productId}
      onDuplicated={(newProductId) => {
        if (newProductId) {
          router.push(`/admin/catalog/products/${newProductId}/edit`);
          return;
        }

        loadProduct({ silent: true });
      }}
      onArchived={() => {
        loadProduct({ silent: true });
      }}
      onDeleted={() => {
        router.push("/admin/catalog/products");
      }}
    />
  ) : null}
</div>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Product error</p>
            <p className="mt-1">{pageError}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

      {defaultValues ? (
  <div className="space-y-5">
    <ProductPricingSection
      productId={productId}
      values={product ?? defaultValues}
      onSaved={() => loadProduct({ silent: true })}
    />

    <ProductForm
      key={formKey}
      productId={productId}
      mediaItems={product?.media ?? product?.images ?? []}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onMediaChanged={() => loadProduct({ silent: true })}
    />
  </div>
) : (
  <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
    Product default values nahi mil paayi.
  </div>
)}
      </div>
    </main>
  );
}


function getNestedId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  const directId = record.id || record.productId;
  if (typeof directId === "string" && directId.trim()) {
    return directId;
  }

  for (const key of ["data", "product", "result"]) {
    const found = getNestedId(record[key]);

    if (found) {
      return found;
    }
  }

  return null;
}

function getFrontendProductUrl(product: BackendProduct, productId: string) {
  const siteUrl = "https://frontend-shahsi-2-0.vercel.app";
  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  const slug = String(product.slug || productId).trim();

  return `${cleanSiteUrl}/products/${encodeURIComponent(slug)}`;
}

function ProductMoreActions({
  product,
  productId,
  onDuplicated,
  onArchived,
  onDeleted,
}: {
  product: BackendProduct;
  productId: string;
  onDuplicated: (newProductId?: string | null) => void;
  onArchived: () => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const productTitle = product.name || product.title || "Shahsi product";
  const productUrl = getFrontendProductUrl(product, productId);

  function firstText(...values: Array<string | null | undefined>) {
    return (
      values.find((value) => typeof value === "string" && value.trim())?.trim() ||
      ""
    );
  }

  function stripHtml(value?: string | null) {
    return (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function withUtm(url: string, source: string) {
    const nextUrl = new URL(url);

    nextUrl.searchParams.set("utm_source", source);
    nextUrl.searchParams.set("utm_medium", "product-links");
    nextUrl.searchParams.set("utm_content", "web");

    return nextUrl.toString();
  }

  function getShareTitle() {
    const productRecord = product as any;

    return firstText(
      productRecord.seoTitle,
      productRecord.metaTitle,
      productRecord.ogTitle,
      productRecord.pinterestTitle,
      productRecord.socialTitle,
      productRecord.title,
      productRecord.name,
      productTitle,
    );
  }

  function getShareDescription() {
    const productRecord = product as any;

    return stripHtml(
      firstText(
        productRecord.seoDescription,
        productRecord.metaDescription,
        productRecord.ogDescription,
        productRecord.pinterestDescription,
        productRecord.socialCaption,
        productRecord.shortDescription,
        productRecord.description,
      ),
    );
  }

  function getPrimaryCatalogImage(currentProduct: BackendProduct) {
    const productRecord = currentProduct as any;

    const items = [
      ...(Array.isArray(productRecord.images) ? productRecord.images : []),
      ...(Array.isArray(productRecord.media) ? productRecord.media : []),
    ];

    const imageItems = items.filter((item: any) => {
      const type = `${item?.type || item?.resourceType || ""}`.toLowerCase();
      return !type || type.includes("image");
    });

    const sorted = [...imageItems].sort((a: any, b: any) => {
      if (a?.isPrimary && !b?.isPrimary) return -1;
      if (!a?.isPrimary && b?.isPrimary) return 1;

      const aPosition = a?.position ?? a?.sortOrder ?? 999;
      const bPosition = b?.position ?? b?.sortOrder ?? 999;

      return aPosition - bPosition;
    });

    const first = sorted[0] || imageItems[0];

    return (
      productRecord.ogImage?.trim?.() ||
      productRecord.pinterestImage?.trim?.() ||
      productRecord.socialImage?.trim?.() ||
      first?.secureUrl?.trim?.() ||
      first?.url?.trim?.() ||
      first?.thumbnailUrl?.trim?.() ||
      first?.thumbnail?.trim?.() ||
      productRecord.image?.trim?.() ||
      ""
    );
  }

  function getShareTags() {
    const productTags = Array.isArray(product.tags) ? product.tags : [];

    return Array.from(
      new Set(
        productTags
          .map((tag) => String(tag).replace(/^#/, "").trim())
          .filter(Boolean),
      ),
    );
  }

  function getHashtagText() {
    return getShareTags()
      .map((tag) => `#${tag.replace(/\s+/g, "")}`)
      .join(" ");
  }

  function buildFacebookShareUrl() {
    const params = new URLSearchParams();
    params.set("u", withUtm(productUrl, "Facebook"));

    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  }

  function buildRedditShareUrl() {
    const params = new URLSearchParams();
    params.set("url", withUtm(productUrl, "Reddit"));

    const title = getShareTitle();
    if (title) {
      params.set("title", title);
    }

    return `https://www.reddit.com/submit?${params.toString()}`;
  }

  function buildLinkedInShareUrl() {
    const params = new URLSearchParams();
    params.set("url", withUtm(productUrl, "LinkedIn"));

    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  }

  function buildPinterestShareUrl() {
    const params = new URLSearchParams();

    const title = getShareTitle() || productTitle;
    const description = getShareDescription();
    const image = getPrimaryCatalogImage(product);
    const hashtagText = getHashtagText();

    const pinterestDescription = [title, description, hashtagText]
      .filter(Boolean)
      .join("\n\n");

    params.set("url", withUtm(productUrl, "Pinterest"));

    if (image) {
      params.set("media", image);
    }

    if (title) {
      params.set("title", title);
    }

    if (pinterestDescription) {
      params.set("description", pinterestDescription);
    }

    return `https://in.pinterest.com/pin-builder/?${params.toString()}`;
  }

  function buildTwitterShareUrl() {
    const params = new URLSearchParams();
    const title = getShareTitle();

    params.set("url", withUtm(productUrl, "X"));

    if (title) {
      params.set("text", title);
    }

    return `https://x.com/intent/post?${params.toString()}`;
  }

  function closeMenu() {
    setOpen(false);
    setSearchTerm("");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(withUtm(productUrl, "CopyLink"));
    closeMenu();
  }

  function openUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
    closeMenu();
  }

  async function duplicateProduct() {
    try {
      setIsWorking(true);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/${productId}/duplicate`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );

      const data = await readJson<ProductUpdateApiResponse>(
        response,
        "Duplicate product API JSON response nahi de rahi",
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Duplicate product failed: ${response.status} ${response.statusText}`,
        );
      }

      const newProductId = getNestedId(data);

      closeMenu();
      onDuplicated(newProductId);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Duplicate product failed.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function archiveProduct() {
    const confirmed = window.confirm(
      "Kya tum is product ko archive karna chahte ho?",
    );

    if (!confirmed) return;

    try {
      setIsWorking(true);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/${productId}/status`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: "ARCHIVED",
          }),
        },
      );

      const data = await readJson<ProductUpdateApiResponse>(
        response,
        "Archive product API JSON response nahi de rahi",
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Archive product failed: ${response.status} ${response.statusText}`,
        );
      }

      closeMenu();
      onArchived();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Archive product failed.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteProduct() {
    const confirmed = window.confirm(
      "Delete product permanently? Ye action undo nahi hoga.",
    );

    if (!confirmed) return;

    try {
      setIsWorking(true);

   const response = await fetch(`${getApiRootUrl()}/admin/catalog/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await readJson<ProductUpdateApiResponse>(
        response,
        "Delete product API JSON response nahi de rahi",
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Delete product failed: ${response.status} ${response.statusText}`,
        );
      }

      closeMenu();
      onDeleted();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Delete product failed.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  function isVisible(label: string) {
    if (!normalizedSearch) return true;

    return label.toLowerCase().includes(normalizedSearch);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isWorking}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isWorking ? "Working..." : "More actions"}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close actions menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={closeMenu}
          />

          <div className="absolute right-0 top-12 z-50 max-h-[78vh] w-[360px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl">
            <div className="mb-2 flex h-11 items-center gap-2 rounded-xl border border-neutral-300 px-3">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search actions"
                className="h-full flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            {isVisible("Duplicate") ? (
              <button
                type="button"
                onClick={duplicateProduct}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
                <RotateCcw className="h-4 w-4 text-neutral-500" />
                Duplicate
              </button>
            ) : null}

            {isVisible("View") ? (
              <button
                type="button"
                onClick={() => openUrl(productUrl)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
                <ExternalLink className="h-4 w-4 text-neutral-500" />
                View
              </button>
            ) : null}

            <div className="my-2 border-t border-neutral-200" />

            <p className="px-3 py-1.5 text-sm font-bold text-neutral-700">
              Share
            </p>

            {isVisible("Copy link") ? (
              <button
                type="button"
                onClick={copyLink}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
                <Copy className="h-4 w-4 text-neutral-500" />
                Copy link
              </button>
            ) : null}

            {isVisible("Facebook") ? (
              <button
                type="button"
                onClick={() =>
                openUrl(buildFacebookShareUrl())
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
               <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
                  f
                </span>
                Facebook
              </button>
            ) : null}

            {isVisible("Reddit") ? (
              <button
                type="button"
                onClick={() =>
                  openUrl(buildRedditShareUrl())
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-[9px] font-bold text-white">
                  r
                </span>
                Reddit
              </button>
            ) : null}

            {isVisible("LinkedIn") ? (
              <button
                type="button"
                onClick={() =>
                openUrl(buildLinkedInShareUrl())
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
               <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-neutral-700 text-[9px] font-bold text-white">
                  in
                </span>
                LinkedIn
              </button>
            ) : null}

            {isVisible("Pinterest") ? (
              <button
                type="button"
                onClick={() =>
                openUrl(buildPinterestShareUrl())
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
               <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
                  p
                </span>
                Pinterest
              </button>
            ) : null}

            {isVisible("X") ? (
              <button
                type="button"
                onClick={() =>
                openUrl(buildTwitterShareUrl())
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center text-sm font-bold text-neutral-700">
                  𝕏
                </span>
                X
              </button>
            ) : null}

            <div className="my-2 border-t border-neutral-200" />

            <p className="px-3 py-1.5 text-sm font-bold text-neutral-700">
              More actions
            </p>

            {isVisible("Archive product") ? (
              <button
                type="button"
                onClick={archiveProduct}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
              >
                <Archive className="h-4 w-4 text-neutral-500" />
                Archive product
              </button>
            ) : null}

            {isVisible("Delete product") ? (
              <button
                type="button"
                onClick={deleteProduct}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete product
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}




"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/catalog/products/product-form";
import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";
import { syncProductCategories } from "@/lib/admin/category-product-sync";
import type { ProductMediaItem } from "@/lib/admin/product-media-upload";
import { saveProductMetafields } from "@/lib/admin/product-metafields-api";

import { saveProductCategoryMetafields } from "@/lib/admin/product-taxonomy-metafields-api";
import {
  buildCatalogProductPayload,
  getSelectedProductCategorySlugs,
} from "@/lib/admin/product-payload";

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
  metafields?: {
    productMetafields?: MetafieldRecord | null;
    categoryMetafields?: MetafieldRecord | null;
    [key: string]: unknown;
  } | null;
  productMetafields?: MetafieldRecord | null;

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
  if (
    product.metafields &&
    typeof product.metafields === "object" &&
    product.metafields.productMetafields &&
    typeof product.metafields.productMetafields === "object"
  ) {
    return product.metafields.productMetafields;
  }

  if (
    product.productMetafields &&
    typeof product.productMetafields === "object"
  ) {
    return product.productMetafields;
  }

  return {};
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
    productMetafields: getProductMetafields(product),
    categoryMetafields: getCategoryMetafields(product),
  };
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
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
        const nextDefaultValues = mapProductToFormValues(nextProduct);
        const nextCategorySlugs = getProductCategorySlugs(nextProduct);

        setProduct(nextProduct);
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
    "Product update ho gaya, but metafields save me backend error aaya. Metafields API response check karni hogi."
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
} catch (categoryMetafieldsError) {
  console.warn("CATEGORY_METAFIELDS_SAVE_FAILED:", categoryMetafieldsError);

  setSuccessMessage(
    "Product update aur product metafields save ho gaye, but category metafields save me backend error aaya. Category metafields API response check karni hogi."
  );

  return;
}

const selectedCategorySlugs = getSelectedProductCategorySlugs(values);

      try {
        await syncProductCategories({
          apiRootUrl,
          productId,
          selectedCategorySlugs,
          previousCategorySlugs,
          token,
        });

        setPreviousCategorySlugs(selectedCategorySlugs);
        setSuccessMessage(
          "Product update ho gaya, metafields save ho gaye aur category assignment sync ho gayi."
        );
      } catch (categorySyncError) {
        console.warn("CATEGORY_SYNC_FAILED:", categorySyncError);

        setPreviousCategorySlugs(selectedCategorySlugs);
        setSuccessMessage(
          "Product update aur metafields save ho gaye, but category assignment sync me backend error aaya. Category-products API backend se check karni hogi."
        );
      }
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
          <ProductForm
            key={formKey}
            productId={productId}
            mediaItems={product?.media ?? product?.images ?? []}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onMediaChanged={() => loadProduct({ silent: true })}
          />
        ) : (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200">
            Product default values nahi mil paayi.
          </div>
        )}
      </div>
    </main>
  );
}

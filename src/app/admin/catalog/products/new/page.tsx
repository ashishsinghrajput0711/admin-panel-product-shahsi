"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/catalog/products/product-form";
import type { ProductFormValues } from "@/components/admin/catalog/products/product-schema";
import { syncProductCategories } from "@/lib/admin/category-product-sync";
import { uploadProductMedia } from "@/lib/admin/product-media-upload";
import {
  buildCatalogProductPayload,
  getSelectedProductCategorySlugs,
} from "@/lib/admin/product-payload";

type ProductCreateResponse = {
  success?: boolean;
  data?: {
    id?: string;
    product?: {
      id?: string;
    };
    data?: {
      id?: string;
    };
  };
  product?: {
    id?: string;
  };
  id?: string;
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

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Product create API JSON response nahi de rahi. Body: ${text}`
    );
  }
}

function extractCreatedProductId(response: ProductCreateResponse | null) {
  return (
    response?.data?.id ||
    response?.data?.product?.id ||
    response?.data?.data?.id ||
    response?.product?.id ||
    response?.id ||
    ""
  );
}

function getReadableBackendError(data: ProductCreateResponse | null) {
  if (!data) return "";

  if (data.message) return data.message;

  if (typeof data.error === "string") {
    return data.error;
  }

  if (Array.isArray(data.error)) {
    return data.error.join(", ");
  }

  if (data.error && typeof data.error === "object") {
    return JSON.stringify(data.error, null, 2);
  }

  return "";
}

export default function NewProductPage() {
  const router = useRouter();

  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  async function handleSubmit(values: ProductFormValues) {
    try {
      setIsSubmitting(true);
      setPageError(null);

      const apiRootUrl = getApiRootUrl();
      const token = getToken();

      const response = await fetch(`${apiRootUrl}/catalog`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildCatalogProductPayload(values)),
      });

      const data = await readJson<ProductCreateResponse>(response);

      if (!response.ok) {
        const backendMessage = getReadableBackendError(data);

        throw new Error(
          backendMessage ||
            `Product create failed: ${response.status} ${response.statusText}`
        );
      }

      const productId = extractCreatedProductId(data);

      if (!productId) {
        throw new Error(
          "Product create ho gaya, but response me product id nahi mila. Backend response check karo."
        );
      }

      if (pendingMediaFiles.length > 0) {
        try {
        await uploadProductMedia({
  apiRootUrl,
  productId,
  files: pendingMediaFiles,
  token,
});
        } catch (mediaUploadError) {
          console.warn("PRODUCT_MEDIA_UPLOAD_FAILED:", mediaUploadError);
        }
      }

      const selectedCategorySlugs = getSelectedProductCategorySlugs(values);

      if (selectedCategorySlugs.length > 0) {
        try {
          await syncProductCategories({
            apiRootUrl,
            productId,
            selectedCategorySlugs,
            previousCategorySlugs: [],
            token,
          });
        } catch (categorySyncError) {
          console.warn("CATEGORY_SYNC_FAILED:", categorySyncError);
        }
      }

      router.push(`/admin/catalog/products/${productId}/edit`);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Product create failed."
      );
    } finally {
      setIsSubmitting(false);
    }
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
              Create Product
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Add product identity, category, commerce, pricing and SEO data.
            </p>
          </div>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Product create failed</p>
            <p className="mt-1 whitespace-pre-wrap">{pageError}</p>
          </div>
        ) : null}

        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          pendingMediaFiles={pendingMediaFiles}
          onPendingMediaFilesChange={setPendingMediaFiles}
        />
      </div>
    </main>
  );
}
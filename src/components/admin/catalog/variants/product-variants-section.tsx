"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VariantTable } from "@/components/admin/catalog/variants/variant-table";
import type { Variant } from "@/components/admin/catalog/variants/variant-types";

type ProductVariantsResponse = {
  success?: boolean;
  data?: Variant[] | { data?: Variant[]; variants?: Variant[]; items?: Variant[] };
  variants?: Variant[];
  items?: Variant[];
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

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ProductVariantsResponse, fallback: string) {
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

function extractVariants(response: ProductVariantsResponse) {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data?.variants)) return response.data.variants;
  if (Array.isArray(response.data?.items)) return response.data.items;
  if (Array.isArray(response.variants)) return response.variants;
  if (Array.isArray(response.items)) return response.items;

  return [];
}

export function ProductVariantsSection({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  async function loadProductVariants() {
    try {
      setIsLoading(true);
      setApiError(null);

     const response = await fetch(
  `${getApiRootUrl()}/admin/catalog/${productId}/variants`,
  {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  }
);

      const json = await parseApiResponse<ProductVariantsResponse>(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Product variants load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      setVariants(extractVariants(json));
    } catch (error) {
      setVariants([]);
      setApiError(
        error instanceof Error
          ? error.message
          : "Product variants load nahi ho paaye."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!productId) return;
    loadProductVariants();
  }, [productId]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-medium text-neutral-950">
            Product Variants
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Is product ke size, color, fabric, package aur stock variants manage
            karo.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={loadProductVariants}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button asChild className="rounded-full">
            <Link href={`/admin/catalog/${productId}/variants/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Link>
          </Button>
        </div>
      </div>

      {apiError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {apiError}
        </div>
      ) : null}

      <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
     <VariantTable
  variants={variants}
  isLoading={isLoading}
  onActionComplete={loadProductVariants}
  editHrefBuilder={(variant) =>
    `/admin/catalog/${productId}/variants/${variant.id}/edit`
  }
/>
      </Card>
    </section>
  );
}
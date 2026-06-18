"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Edit3,
  ImageOff,
  Loader2,
  PackageCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "./product-types";

type ProductRow = {
  id: string;
  title: string;
  sku: string | null;
  slug: string | null;
  vendor: string | null;
  brand: string | null;
  productType: string | null;
  mode: string | null;
  category: string | null;
  price: number | null;
  compareAtPrice: number | null;
  currency: string | null;
  status: string;
  imagesCount: number;
  variantsCount: number;
  primaryImageUrl: string | null;
  primaryImageAlt: string;
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
  const headers: HeadersInit = {};

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
    return null;
  }
}

type DeleteProductResponse = {
  success?: boolean;
  message?: string;
  error?: unknown;
};

async function deleteProduct(productId: string) {
  const response = await fetch(`${getApiRootUrl()}/catalog/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readJson<DeleteProductResponse>(response);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        String(data?.error || "") ||
        `Product delete failed: ${response.status}`
    );
  }

  return data;
}

function firstString(values: Array<string | null | undefined>) {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0
  );

  return value?.trim() || null;
}

function firstNumber(values: Array<number | null | undefined>) {
  const value = values.find(
    (item) => typeof item === "number" && Number.isFinite(item)
  );

  return typeof value === "number" ? value : null;
}

function normalizeProduct(product: Product): ProductRow {
  const id = product.id || "missing-product-id";
  const title = firstString([product.title, product.name]) || "Untitled product";

  const category =
    firstString([
      product.category,
      product.primaryCategory,
      product.categoryName,
      product.categories?.[0],
    ]) || null;

  const price = firstNumber([
    product.basePrice,
    product.listingPrice,
    product.price,
    product.salePrice,
  ]);

  const status =
    firstString([product.adminStatus, product.statusLabel, product.status]) ||
    "MISSING";

  const primaryImage =
    product.images?.find((image) => image.isPrimary) || product.images?.[0];

  return {
    id,
    title,
    sku: firstString([product.sku]),
    slug: product.slug || null,
    vendor: product.vendor || null,
    brand: product.brand || null,
    productType: product.productType || null,
    mode: product.mode || null,
    category,
    price,
    compareAtPrice: product.compareAtPrice ?? null,
    currency: product.currency || "$",
    status: status.toUpperCase(),
    imagesCount: product.images?.length ?? 0,
    variantsCount: product.variants?.length ?? 0,
    primaryImageUrl: primaryImage?.secureUrl || primaryImage?.url || null,
    primaryImageAlt: primaryImage?.altText || title,
  };
}

function formatMoney(value: number | null, currency: string | null) {
  if (value == null) return null;

  const prefix = currency && currency !== "$" ? `${currency} ` : "$";
  return `${prefix}${value}`;
}

function MissingBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="max-w-full truncate border-amber-200 bg-amber-50 px-1.5 py-0 text-[9px] text-amber-800"
      title={label}
    >
      {label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  const statusClass =
    normalizedStatus === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : normalizedStatus === "DRAFT"
        ? "bg-neutral-100 text-neutral-700"
        : normalizedStatus === "ARCHIVED"
          ? "bg-red-50 text-red-700"
          : "bg-amber-50 text-amber-700";

  return (
    <span
      title={normalizedStatus}
      className={`inline-flex max-w-full justify-center truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-4 ${statusClass}`}
    >
      {normalizedStatus}
    </span>
  );
}

export function ProductTable({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) {
  const [visibleProducts, setVisibleProducts] = useState<Product[]>(products);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setVisibleProducts(products);
  }, [products]);

  async function handleDelete(product: ProductRow) {
    const confirmed = window.confirm(
      `Are you sure you want to delete this product?\n\n${product.title}\nSKU: ${
        product.sku || "N/A"
      }`
    );

    if (!confirmed) return;

    try {
      setDeletingProductId(product.id);
      setDeleteError(null);

      await deleteProduct(product.id);

      setVisibleProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Product delete failed."
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
        Loading products...
      </div>
    );
  }

  if (!visibleProducts.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-950">
          No products found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Search/filter ke hisaab se products nahi mile.
        </p>
      </div>
    );
  }

  const rows = visibleProducts.map(normalizeProduct);

  return (
    <div className="space-y-3">
      {deleteError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">Product delete failed</p>
          <p className="mt-1">{deleteError}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-neutral-50">
            <TableRow className="hover:bg-neutral-50">
              <TableHead className="w-[34%] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Product
              </TableHead>
              <TableHead className="w-[13%] px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                SKU
              </TableHead>
              <TableHead className="w-[17%] px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Category
              </TableHead>
              <TableHead className="w-[12%] px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Price
              </TableHead>
              <TableHead className="w-[9%] px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Status
              </TableHead>
              <TableHead className="w-[15%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((product) => {
              const isDeleting = deletingProductId === product.id;

              return (
                <TableRow
                  key={product.id}
                  className="border-neutral-100 hover:bg-[#fbfaf6]"
                >
                  <TableCell className="px-3 py-2.5 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {product.primaryImageUrl ? (
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.primaryImageUrl}
                            alt={product.primaryImageAlt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          title={product.title}
                          className="truncate text-[13px] font-semibold leading-5 text-neutral-950"
                        >
                          {product.title}
                        </p>

                        <p
                          title={product.slug || product.id}
                          className="truncate text-[11px] leading-4 text-neutral-500"
                        >
                          {product.slug || product.id}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.vendor || product.brand ? (
                            <Badge
                              variant="outline"
                              className="max-w-[86px] truncate px-1.5 py-0 text-[9px]"
                              title={product.vendor || product.brand || ""}
                            >
                              {product.vendor || product.brand}
                            </Badge>
                          ) : (
                            <MissingBadge label="Missing brand" />
                          )}

                          {product.productType ? (
                            <Badge
                              variant="outline"
                              className="max-w-[62px] truncate px-1.5 py-0 text-[9px]"
                              title={product.productType}
                            >
                              {product.productType}
                            </Badge>
                          ) : null}

                          {product.mode ? (
                            <Badge
                              variant="outline"
                              className="max-w-[48px] truncate px-1.5 py-0 text-[9px]"
                              title={product.mode}
                            >
                              {product.mode}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-2.5 align-middle">
                    {product.sku ? (
                      <p
                        title={product.sku}
                        className="line-clamp-2 break-words text-[11px] font-medium leading-4 text-neutral-800"
                      >
                        {product.sku}
                      </p>
                    ) : (
                      <MissingBadge label="Missing SKU" />
                    )}
                  </TableCell>

                  <TableCell className="px-2 py-2.5 align-middle">
                    {product.category ? (
                      <p
                        title={product.category}
                        className="truncate text-[13px] font-medium leading-5 text-neutral-900"
                      >
                        {product.category}
                      </p>
                    ) : (
                      <MissingBadge label="Missing category" />
                    )}

                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0 text-[9px]"
                      >
                        <PackageCheck className="h-3 w-3" />
                        {product.imagesCount}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="whitespace-nowrap px-1.5 py-0 text-[9px]"
                      >
                        {product.variantsCount} var
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-2.5 align-middle">
                    <div className="truncate text-[13px] font-semibold leading-5 text-neutral-950">
                      {formatMoney(product.price, product.currency) || (
                        <MissingBadge label="Missing price" />
                      )}
                    </div>

                    {product.compareAtPrice ? (
                      <p className="truncate text-[10px] leading-4 text-neutral-500">
                        Compare{" "}
                        {formatMoney(product.compareAtPrice, product.currency)}
                      </p>
                    ) : null}
                  </TableCell>

                  <TableCell className="px-2 py-2.5 align-middle">
                    <StatusBadge status={product.status} />
                  </TableCell>

                  <TableCell className="px-2 py-2.5 align-middle">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 shrink-0 rounded-full p-0"
                        title="Edit product"
                      >
                        <Link href={`/admin/catalog/products/${product.id}/edit`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(product)}
                        className="h-7 w-7 shrink-0 rounded-full border-red-200 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete product"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 rounded-full px-2 text-[11px]"
                        title="Product variants"
                      >
                        <Link
                          href={`/admin/catalog/products/${product.id}/variants`}
                        >
                          Var
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
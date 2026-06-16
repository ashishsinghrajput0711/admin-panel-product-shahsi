"use client";

import Link from "next/link";
import { Edit3, ImageOff, PackageCheck } from "lucide-react";
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

export function ProductTable({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-500">
        Loading products...
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No products found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Search/filter ke hisaab se products nahi mile.
        </p>
      </div>
    );
  }

  const rows = products.map(normalizeProduct);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Table className="w-full table-fixed">
        <TableHeader className="bg-neutral-100">
          <TableRow>
            <TableHead className="w-[36%] px-4 py-3">Product</TableHead>
            <TableHead className="w-[16%] px-3 py-3">SKU</TableHead>
            <TableHead className="w-[16%] px-3 py-3">Category</TableHead>
            <TableHead className="w-[12%] px-3 py-3">Price</TableHead>
            <TableHead className="w-[10%] px-3 py-3">Status</TableHead>
            <TableHead className="w-[10%] px-3 py-3 text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((product) => (
            <TableRow key={product.id} className="hover:bg-neutral-50/80">
              <TableCell className="px-4 py-3 align-middle">
                <div className="flex min-w-0 items-center gap-3">
                  {product.primaryImageUrl ? (
                    <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.primaryImageUrl}
                        alt={product.primaryImageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {product.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {product.slug || product.id}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.vendor || product.brand ? (
                        <Badge variant="outline" className="text-[10px]">
                          {product.vendor || product.brand}
                        </Badge>
                      ) : (
                        <MissingBadge label="Missing brand" />
                      )}

                      {product.productType ? (
                        <Badge variant="outline" className="text-[10px]">
                          {product.productType}
                        </Badge>
                      ) : null}

                      {product.mode ? (
                        <Badge variant="outline" className="text-[10px]">
                          {product.mode}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="px-3 py-3 align-middle">
                {product.sku ? (
                  <p
                    title={product.sku}
                    className="break-words text-xs font-medium leading-4 text-neutral-800"
                  >
                    {product.sku}
                  </p>
                ) : (
                  <MissingBadge label="Missing SKU" />
                )}
              </TableCell>

              <TableCell className="px-3 py-3 align-middle">
                {product.category ? (
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {product.category}
                  </p>
                ) : (
                  <MissingBadge label="Missing category" />
                )}

                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    <PackageCheck className="h-3 w-3" />
                    {product.imagesCount} media
                  </Badge>

                  <Badge variant="outline" className="text-[10px]">
                    {product.variantsCount} variants
                  </Badge>
                </div>
              </TableCell>

              <TableCell className="px-3 py-3 align-middle">
                {product.price != null ? (
                  <p className="text-sm font-semibold text-neutral-950">
                    {formatMoney(product.price, product.currency)}
                  </p>
                ) : (
                  <MissingBadge label="Missing price" />
                )}

                {product.compareAtPrice != null &&
                product.compareAtPrice > 0 ? (
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    Compare {formatMoney(product.compareAtPrice, product.currency)}
                  </p>
                ) : null}
              </TableCell>

              <TableCell className="px-3 py-3 align-middle">
                <StatusBadge value={product.status} />
              </TableCell>

             <TableCell className="px-3 py-3 text-right align-middle">
  <div className="flex justify-end gap-2">
    <Button
      asChild
      size="icon-sm"
      variant="outline"
      title="Edit product"
    >
      <Link href={`/admin/catalog/products/${product.id}/edit`}>
        <Edit3 className="h-3.5 w-3.5" />
      </Link>
    </Button>

    <Button
      asChild
      size="sm"
      variant="outline"
      className="rounded-full"
      title="Manage product variants"
    >
      <Link href={`/admin/catalog/${product.id}/variants`}>
        Variants
      </Link>
    </Button>
  </div>
</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MissingBadge({ label }: { label: string }) {
  return (
    <Badge className="bg-red-50 text-red-700 hover:bg-red-50 text-[10px]">
      {label}
    </Badge>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();

  const className =
    normalized === "ACTIVE" || normalized === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "DRAFT"
        ? "bg-amber-50 text-amber-700"
        : normalized === "ARCHIVED"
          ? "bg-red-50 text-red-700"
          : normalized === "MISSING"
            ? "bg-red-50 text-red-700"
            : "bg-neutral-100 text-neutral-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {normalized}
    </span>
  );
}
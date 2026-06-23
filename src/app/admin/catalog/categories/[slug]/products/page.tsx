"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import {
  fetchCategoryProducts,
  getCategoryProductId,
  removeProductFromCategory,
} from "@/lib/admin/category-api";

function getParamSlug(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function getProductTitle(item: any) {
  const product = item?.product || item?.catalogProduct || item;

  return (
    product?.title ||
    product?.name ||
    item?.title ||
    item?.name ||
    "Untitled product"
  );
}

function getProductSlug(item: any) {
  const product = item?.product || item?.catalogProduct || item;

  return product?.slug || item?.slug || "";
}

function getProductImage(item: any) {
  const product = item?.product || item?.catalogProduct || item;

  if (Array.isArray(product?.images) && product.images.length) {
    const first = product.images[0];

    if (typeof first === "string") return first;

    return (
      first?.url ||
      first?.secureUrl ||
      first?.imageUrl ||
      first?.src ||
      ""
    );
  }

  return (
    product?.thumbnail ||
    product?.imageUrl ||
    product?.image ||
    item?.thumbnail ||
    item?.imageUrl ||
    item?.image ||
    ""
  );
}

function getProductStatus(item: any) {
  const product = item?.product || item?.catalogProduct || item;

  return product?.status || product?.publishStatus || item?.status || "";
}

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = useMemo(() => getParamSlug(params?.slug), [params]);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setError(null);

      const items = await fetchCategoryProducts(slug);
      setProducts(items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Category products load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleRemoveProduct(item: any) {
    const productId = getCategoryProductId(item);
    const title = getProductTitle(item);

    if (!productId) {
      alert("Product ID missing hai.");
      return;
    }

    const confirmed = window.confirm(
      `Remove "${title}" from "${slug}" category? Product delete nahi hoga, sirf category se unassign hoga.`,
    );

    if (!confirmed) return;

    try {
      setRemovingId(productId);
      setError(null);

      await removeProductFromCategory(slug, productId);
      await loadProducts();
    } catch (removeError) {
      alert(
        removeError instanceof Error
          ? removeError.message
          : "Product remove failed.",
      );
    } finally {
      setRemovingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/catalog/categories"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to categories
            </Link>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Admin / Catalog / Categories / Products
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Manage Products
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Category: <span className="font-semibold text-neutral-800">{slug}</span>{" "}
              · Products:{" "}
              <span className="font-semibold text-neutral-800">
                {products.length}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Category products error</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.5rem] bg-white p-10 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
            Loading category products...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Is category me koi product assigned nahi hai.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-neutral-50">
                  <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((item, index) => {
                    const productId = getCategoryProductId(item);
                    const title = getProductTitle(item);
                    const productSlug = getProductSlug(item);
                    const image = getProductImage(item);
                    const status = getProductStatus(item);
                    const isRemoving = removingId === productId;

                    return (
                      <tr
                        key={productId || `${title}-${index}`}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-12 overflow-hidden rounded-xl bg-neutral-100">
                              {image ? (
                                <img
                                  src={image}
                                  alt={title}
                                  className="h-full w-full object-cover object-top"
                                />
                              ) : null}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-950">
                                {title}
                              </p>

                              <p className="mt-0.5 text-xs text-neutral-500">
                                ID: {productId || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {productSlug || "—"}
                        </td>

                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {status || "—"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => handleRemoveProduct(item)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRemoving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
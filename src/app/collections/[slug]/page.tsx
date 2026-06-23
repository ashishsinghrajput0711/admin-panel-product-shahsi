import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  getStorefrontCollection,
  getStorefrontCollectionProducts,
  type StorefrontCollectionProduct,
} from "@/lib/api/collections.api";

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    size?: string;
    color?: string;
    fabric?: string;
  }>;
};

type FilterLinkInput = {
  slug: string;
  page?: number;
  search?: string;
  sort?: string;
  priceMin?: string;
  priceMax?: string;
  size?: string;
  color?: string;
  fabric?: string;
};

function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numberValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function getProductImage(product: StorefrontCollectionProduct) {
  return product.thumbnail || product.imageUrl || "";
}

function getProductHref(product: StorefrontCollectionProduct) {
  if (product.slug) {
    return `/products/${product.slug}`;
  }

  return `/products/${product.id}`;
}

function getCollectionTitle(collection: {
  name?: string | null;
  title?: string | null;
}) {
  return collection.name || collection.title || "Collection";
}

function cleanHtml(value?: string | null) {
  if (!value) return "";

  return value.replace(/<!--\s*x-tinymce\/html\s*-->/gi, "").trim();
}

function stripHtml(value?: string | null) {
  if (!value) return "";

  return cleanHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCollectionHref(input: FilterLinkInput) {
  const params = new URLSearchParams();

  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.search) params.set("search", input.search);
  if (input.sort) params.set("sort", input.sort);
  if (input.priceMin) params.set("priceMin", input.priceMin);
  if (input.priceMax) params.set("priceMax", input.priceMax);
  if (input.size) params.set("size", input.size);
  if (input.color) params.set("color", input.color);
  if (input.fabric) params.set("fabric", input.fabric);

  const queryString = params.toString();

  return queryString
    ? `/collections/${input.slug}?${queryString}`
    : `/collections/${input.slug}`;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const collection = await getStorefrontCollection(slug);
    const title = collection.seoTitle || getCollectionTitle(collection);
    const description =
      collection.seoDescription ||
      stripHtml(collection.description) ||
      "Explore curated Shahsi collection.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection.imageUrl ? [collection.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Collection | Shahsi",
      description: "Explore Shahsi collections.",
    };
  }
}

function ProductCard({ product }: { product: StorefrontCollectionProduct }) {
  const image = getProductImage(product);
  const price = formatPrice(product.salePrice ?? product.price);
  const comparePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.price !== null &&
    product.price !== undefined &&
    Number(product.salePrice) !== Number(product.price)
      ? formatPrice(product.price)
      : "";

  return (
    <Link href={getProductHref(product)} className="group block">
      <div className="overflow-hidden rounded-[28px] bg-[#f2eee7] ring-1 ring-[#e8dfd4] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f2eee7]">
          {image ? (
            <img
              src={image}
              alt={product.title || "Collection product"}
              className="h-full w-full object-contain p-4 transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#8b7c70]">
              No image
            </div>
          )}

          {product.status ? (
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3f352e] shadow-sm">
              {product.status}
            </span>
          ) : null}
        </div>

        <div className="bg-white p-4">
          <p className="mb-1 line-clamp-1 text-[11px] uppercase tracking-[0.18em] text-[#9b6a4a]">
            {product.primaryCategory ||
              product.category ||
              product.vendor ||
              "Shahsi"}
          </p>

          <h3 className="line-clamp-2 min-h-[42px] text-sm font-semibold leading-5 text-[#17110d]">
            {product.title || "Untitled product"}
          </h3>

          <div className="mt-3 flex items-baseline gap-2">
            {price ? (
              <p className="text-sm font-bold text-[#17110d]">{price}</p>
            ) : null}

            {comparePrice ? (
              <p className="text-xs text-[#9b9188] line-through">
                {comparePrice}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#eee4da] pt-3">
            <span className="text-xs font-medium text-[#6f6259]">
              View details
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17110d] text-xs text-white transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const page = Math.max(1, Number(query?.page || 1));
  const search = query?.search || "";
  const sort = query?.sort || "";

  let collection;
  let productsResult;

  try {
    collection = await getStorefrontCollection(slug);
    productsResult = await getStorefrontCollectionProducts({
      slug,
      page,
      limit: 20,
      search,
      sort,
      priceMin: query?.priceMin,
      priceMax: query?.priceMax,
      size: query?.size,
      color: query?.color,
      fabric: query?.fabric,
    });
  } catch {
    notFound();
  }

  const title = getCollectionTitle(collection);
  const descriptionHtml = cleanHtml(collection.description);
  const products = productsResult.items;
  const hasPrevious = productsResult.page > 1;
  const hasNext = productsResult.page < productsResult.totalPages;

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-[#17110d]">
      <section className="border-b border-[#e7ddd2] bg-[#f8f3ec]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#7c4a2d] transition hover:text-[#17110d]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <p className="hidden text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6a4a] sm:block">
              Shahsi / Collection
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8f3ec]">
        {collection.imageUrl ? (
          <img
            src={collection.imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-[0.12]"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f3ec]/90 via-[#f8f3ec]/95 to-[#f7f1e8]" />

        <div className="relative mx-auto max-w-[1500px] px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pb-14 lg:pt-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c4a2d] ring-1 ring-[#e7ddd2]">
              <Sparkles className="h-3.5 w-3.5" />
              Curated Collection
            </p>

            <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#17110d] sm:text-5xl lg:text-7xl">
              {title}
            </h1>

            {descriptionHtml ? (
              <div
                className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#62564d] sm:text-base
                  [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#17110d]
                  [&_h3]:mt-5 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#17110d]
                  [&_p]:mt-3
                  [&_ul]:mx-auto [&_ul]:mt-3 [&_ul]:inline-block [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-left
                  [&_li]:mt-1"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml,
                }}
              />
            ) : null}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5d5148] ring-1 ring-[#e7ddd2]">
                {productsResult.total} products
              </span>

              {collection.slug ? (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5d5148] ring-1 ring-[#e7ddd2]">
                  /collections/{collection.slug}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-24">
        <div className="rounded-[34px] bg-white p-4 shadow-sm ring-1 ring-[#e8dfd4] lg:p-6">
          <form className="grid gap-3 lg:grid-cols-[1fr_240px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b9188]" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search products in this collection"
                className="h-12 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] pl-11 pr-4 text-sm text-[#17110d] outline-none transition placeholder:text-[#9b9188] focus:border-[#17110d] focus:bg-white focus:ring-2 focus:ring-[#17110d]/10"
              />
            </div>

            <select
              name="sort"
              defaultValue={sort}
              className="h-12 rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm text-[#5d5148] outline-none transition focus:border-[#17110d] focus:bg-white focus:ring-2 focus:ring-[#17110d]/10"
            >
              <option value="">Sort by</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#17110d] px-5 text-sm font-semibold text-white transition hover:bg-[#3f2a1f]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Apply
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-[#e8dfd4]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#17110d]">
                  Filters
                </h2>
                <Filter className="h-4 w-4 text-[#9b6a4a]" />
              </div>

              <form className="space-y-5">
                <input type="hidden" name="search" value={search} />
                <input type="hidden" name="sort" value={sort} />

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7c6f65]">
                    Min price
                  </label>
                  <input
                    name="priceMin"
                    defaultValue={query?.priceMin || ""}
                    placeholder="e.g. 500"
                    className="h-11 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm outline-none focus:border-[#17110d] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7c6f65]">
                    Max price
                  </label>
                  <input
                    name="priceMax"
                    defaultValue={query?.priceMax || ""}
                    placeholder="e.g. 5000"
                    className="h-11 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm outline-none focus:border-[#17110d] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7c6f65]">
                    Size
                  </label>
                  <input
                    name="size"
                    defaultValue={query?.size || ""}
                    placeholder="XS, S, M..."
                    className="h-11 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm outline-none focus:border-[#17110d] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7c6f65]">
                    Color
                  </label>
                  <input
                    name="color"
                    defaultValue={query?.color || ""}
                    placeholder="Ivory, Sage..."
                    className="h-11 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm outline-none focus:border-[#17110d] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7c6f65]">
                    Fabric
                  </label>
                  <input
                    name="fabric"
                    defaultValue={query?.fabric || ""}
                    placeholder="Cotton, Silk..."
                    className="h-11 w-full rounded-2xl border border-[#e8dfd4] bg-[#fbf8f3] px-4 text-sm outline-none focus:border-[#17110d] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#17110d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3f2a1f]"
                >
                  Apply filters
                </button>

                <Link
                  href={`/collections/${slug}`}
                  className="block rounded-2xl border border-[#e8dfd4] px-5 py-3 text-center text-sm font-semibold text-[#5d5148] transition hover:bg-[#fbf8f3]"
                >
                  Clear filters
                </Link>
              </form>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#17110d]">
                  Showing {products.length} of {productsResult.total} products
                </p>
                <p className="mt-1 text-xs text-[#8b7c70]">
                  Products are loaded from the live collection API.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5d5148] ring-1 ring-[#e8dfd4] lg:hidden"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            {products.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[34px] bg-white p-12 text-center shadow-sm ring-1 ring-[#e8dfd4]">
                <p className="font-serif text-2xl font-semibold text-[#17110d]">
                  No products found
                </p>
                <p className="mt-2 text-sm text-[#8b7c70]">
                  Try changing search or filters.
                </p>
                <Link
                  href={`/collections/${slug}`}
                  className="mt-6 inline-flex rounded-full bg-[#17110d] px-6 py-3 text-sm font-semibold text-white"
                >
                  Reset collection
                </Link>
              </div>
            )}

            {productsResult.totalPages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {hasPrevious ? (
                  <Link
                    href={buildCollectionHref({
                      slug,
                      page: productsResult.page - 1,
                      search,
                      sort,
                      priceMin: query?.priceMin,
                      priceMax: query?.priceMax,
                      size: query?.size,
                      color: query?.color,
                      fabric: query?.fabric,
                    })}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#5d5148] ring-1 ring-[#e8dfd4] hover:bg-[#fbf8f3]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-5 py-3 text-sm font-semibold text-[#b8ada3] ring-1 ring-[#e8dfd4]">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </span>
                )}

                <span className="rounded-full bg-[#17110d] px-5 py-3 text-sm font-semibold text-white">
                  Page {productsResult.page} of {productsResult.totalPages}
                </span>

                {hasNext ? (
                  <Link
                    href={buildCollectionHref({
                      slug,
                      page: productsResult.page + 1,
                      search,
                      sort,
                      priceMin: query?.priceMin,
                      priceMax: query?.priceMax,
                      size: query?.size,
                      color: query?.color,
                      fabric: query?.fabric,
                    })}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#5d5148] ring-1 ring-[#e8dfd4] hover:bg-[#fbf8f3]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-5 py-3 text-sm font-semibold text-[#b8ada3] ring-1 ring-[#e8dfd4]">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
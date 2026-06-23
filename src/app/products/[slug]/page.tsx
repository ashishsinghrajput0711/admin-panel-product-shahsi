import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type CatalogProduct = {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  brand?: string;
description?: string | null;
  imageUrl?: string;
  thumbnail?: string;
  price?: number | string;
  salePrice?: number | string | null;
  color?: string | null;
  primaryColor?: string | null;
  variantColor?: string | null;
  colorHex?: string | null;
  category?: string | null;
  primaryCategory?: string | null;
};

function getApiBaseUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    "http://65.1.135.224:3001";

  return rawUrl.replace(/\/admin\/catalog$/, "").replace(/\/$/, "");
}

function formatPrice(value?: number | string | null) {
  if (value === undefined || value === null || value === "") {
    return null;
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


function cleanProductHtml(value?: string | null) {
  if (!value) return "";

  return value
    .replace(/<!--\s*x-tinymce\/html\s*-->/gi, "")
    .trim();
}

async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/catalog/slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();

  return json?.data ?? json ?? null;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const title = product.title || product.name || "Product";
  const imageUrl = product.imageUrl || product.thumbnail || "";
  const price = formatPrice(product.salePrice ?? product.price);
  const compareAtPrice =
    product.salePrice && product.price ? formatPrice(product.price) : null;

  const colorName =
    product.color || product.primaryColor || product.variantColor || null;

  return (
    <main className="min-h-screen bg-[#f8f3ea] px-6 py-10 text-[#17110d]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/collections/bridal-whites"
          className="mb-6 inline-flex text-sm font-medium text-[#7c4a2d] hover:underline"
        >
          ← Back to collection
        </Link>

        <div className="grid gap-10 rounded-[32px] bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#efe7db]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8b7c70]">
                No image available
              </div>
            )}
          </div>

          <section className="flex flex-col justify-center">
            {product.brand ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9b6a4a]">
                {product.brand}
              </p>
            ) : null}

            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              {price ? (
                <p className="text-2xl font-semibold text-[#17110d]">{price}</p>
              ) : null}

              {compareAtPrice ? (
                <p className="text-sm text-[#8b7c70] line-through">
                  {compareAtPrice}
                </p>
              ) : null}
            </div>

            {colorName ? (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-medium text-[#5d5148]">Color</span>
                <span
                  className="h-7 w-7 rounded-full border border-black/10"
                  style={{
                    backgroundColor: product.colorHex || "#e8ded2",
                  }}
                />
                <span className="text-sm text-[#5d5148]">{colorName}</span>
              </div>
            ) : null}

            {product.primaryCategory || product.category ? (
              <p className="mt-4 text-sm text-[#6f6259]">
                Category: {product.primaryCategory || product.category}
              </p>
            ) : null}

          {product.description ? (
  <div
    className="mt-6 max-w-none text-[15px] leading-7 text-[#5d5148]
      [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#17110d]
      [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#17110d]
      [&_p]:mt-3
      [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5
      [&_li]:mt-1"
    dangerouslySetInnerHTML={{
      __html: cleanProductHtml(product.description),
    }}
  />
) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-[#17110d] px-6 py-3 text-sm font-semibold text-white">
                Add to cart
              </button>
              <button className="rounded-full border border-[#d8c8b8] px-6 py-3 text-sm font-semibold text-[#17110d]">
                Add to wishlist
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
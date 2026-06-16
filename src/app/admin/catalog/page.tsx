import Link from "next/link";
import {
  BadgeDollarSign,
  Boxes,
  ImageIcon,
  Layers3,
  Package,
  Ruler,
  Settings2,
  Shirt,
  SlidersHorizontal,
} from "lucide-react";

const modules = [
  {
    title: "Products",
    href: "/admin/catalog/products",
    description:
      "Create and manage Shahsi retail, made-to-order, Gownloop rental and resale products.",
    icon: Package,
  },
  {
    title: "Variants",
    href: "/admin/catalog/variants",
    description:
      "Manage size, color, fabric, length, SKU, pricing and stock variants.",
    icon: Layers3,
  },
  {
    title: "Attributes",
    href: "/admin/catalog/attributes",
    description:
      "Reusable catalog attributes for filters, search, SEO, fit and style engines.",
    icon: SlidersHorizontal,
  },
  {
    title: "Pricing",
    href: "/admin/catalog/pricing",
    description:
      "Base price, sale price, rental price, MTO price, resale price and fees.",
    icon: BadgeDollarSign,
  },
  {
    title: "Inventory",
    href: "/admin/catalog/inventory",
    description:
      "Retail stock, MTO capacity, rental assets, resale units and reservations.",
    icon: Boxes,
  },
  {
    title: "Media",
    href: "/admin/catalog/media",
    description:
      "Images, videos, swatches, banners, thumbnails, lookbook and SEO media.",
    icon: ImageIcon,
  },
  {
    title: "Commerce Models",
    href: "/admin/catalog/commerce-models",
    description:
      "Control Retail, Made-to-Order, Rental and Resale model rules.",
    icon: Settings2,
  },
  {
    title: "Fit Data",
    href: "/admin/catalog/fit-data",
    description:
      "Garment measurements, body ranges, stretch, ease and size recommendation data.",
    icon: Ruler,
  },
  {
    title: "Style Data",
    href: "/admin/catalog/style-data",
    description:
      "Color, occasion, silhouette, modesty, skin tone and style recommendation data.",
    icon: Shirt,
  },
];

export default function CatalogDashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <section className="rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog
        </p>

        <div className="mt-4 max-w-4xl">
          <h1 className="text-5xl font-medium tracking-tight">
            Catalog Management
          </h1>

          <p className="mt-4 text-white/70">
            Enterprise catalog admin for Shahsi and Gownloop. Manage product
            truth, variants, attributes, pricing, inventory, media, commerce
            rules, fit data and style data from one place.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-[1.5rem] border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-[#f7f2ea] p-3">
                  <Icon className="h-5 w-5 text-neutral-950" />
                </div>

                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 group-hover:border-neutral-950 group-hover:text-neutral-950">
                  Open
                </span>
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight">
                {module.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {module.description}
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
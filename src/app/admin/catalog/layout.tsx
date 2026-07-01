"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import {
  BadgeDollarSign,
  Boxes,
  ChevronDown,
  ChevronRight,
  Database,
  FolderTree,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  Package,
  Ruler,
  Search,
  Settings2,
  Shirt,
  SlidersHorizontal,
  Send,
} from "lucide-react";

const productSubTabs = [
  {
    label: "Categories",
    href: "/admin/catalog/categories",
    icon: FolderTree,
  },
 
  {
    label: "Variants",
    href: "/admin/catalog/variants",
    icon: Layers3,
  },
  {
    label: "Attributes",
    href: "/admin/catalog/attributes",
    icon: SlidersHorizontal,
  },
  {
    label: "Pricing",
    href: "/admin/catalog/pricing",
    icon: BadgeDollarSign,
  },
  {
    label: "Inventory",
    href: "/admin/catalog/inventory",
    icon: Boxes,
  },
  {
    label: "Media",
    href: "/admin/catalog/media",
    icon: ImageIcon,
  },
  {
    label: "Commerce Models",
    href: "/admin/catalog/commerce-models",
    icon: Settings2,
  },
  {
    label: "Fit Data",
    href: "/admin/catalog/fit-data",
    icon: Ruler,
  },
  {
    label: "Style Data",
    href: "/admin/catalog/style-data",
    icon: Shirt,
  },
  {
    label: "Publishing",
    href: "/admin/catalog/publishing",
    icon: Send,
  },
  {
    label: "Search Data",
    href: "/admin/catalog/search",
    icon: Database,
  },
];

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isOverviewActive = pathname === "/admin/catalog";

  const isSearchAdminActive = pathname.startsWith("/admin/search");

  const isProductSectionActive =
    pathname.startsWith("/admin/catalog/products") ||
    productSubTabs.some((item) => pathname.startsWith(item.href));

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#fbfaf6]">
        <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
          <aside className="border-r border-neutral-200 bg-white">
            <div className="sticky top-0 flex h-screen flex-col">
              <div className="border-b border-neutral-200 px-6 py-6">
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Admin Panel
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Catalog Management
                </h1>

                <p className="mt-2 text-sm text-neutral-500">
                  Shahsi + Gownloop catalog engine
                </p>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                <Link
                  href="/admin/catalog"
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isOverviewActive
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-[#f7f2ea] hover:text-neutral-950"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </Link>

                <Link
                  href="/admin/catalog/products"
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isProductSectionActive
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-[#f7f2ea] hover:text-neutral-950"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Package className="h-4 w-4" />
                    <span>Product</span>
                  </span>

                  {isProductSectionActive ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Link>

                {isProductSectionActive ? (
                  <div className="ml-4 space-y-1 border-l border-neutral-200 pl-3">
                    {productSubTabs.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? "bg-[#f7f2ea] text-neutral-950"
                              : "text-neutral-500 hover:bg-[#f7f2ea] hover:text-neutral-950"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                <Link
  href="/admin/search"
  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
    isSearchAdminActive
      ? "bg-neutral-950 text-white shadow-sm"
      : "text-neutral-600 hover:bg-[#f7f2ea] hover:text-neutral-950"
  }`}
>
  <Search className="h-4 w-4" />
  <span>Search Admin</span>
</Link>
              </nav>

             <div className="border-t border-neutral-200 p-4">
  <div className="rounded-2xl bg-[#f7f2ea] p-4">
    <p className="text-sm font-medium text-neutral-950">
      Build Order
    </p>

    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] leading-5 text-neutral-600">
      {[
        "Product",
        "Categories",
       
        "Variants",
        "Attributes",
        "Pricing",
        "Inventory",
        "Media",
      ].map((item, index, list) => (
        <span key={item} className="inline-flex items-center gap-1">
          <span>{item}</span>
          {index < list.length - 1 ? (
            <span className="text-neutral-400">→</span>
          ) : null}
        </span>
      ))}
    </div>
  </div>
</div>
            </div>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
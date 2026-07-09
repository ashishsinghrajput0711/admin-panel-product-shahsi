"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import {
  FileText,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  Link2,
  PackageSearch,
  SearchCheck,
} from "lucide-react";

const seoNavItems = [
  {
    label: "Dashboard",
    href: "/admin/seo/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products SEO",
    href: "/admin/seo/products",
    icon: PackageSearch,
  },
  {
    label: "Categories SEO",
    href: "/admin/seo/categories",
    icon: FolderTree,
  },
  {
    label: "Redirects",
    href: "/admin/seo/redirects",
    icon: GitBranch,
  },
  {
    label: "Internal Linking",
    href: "/admin/seo/internal-linking",
    icon: Link2,
  },
];

export default function SeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
                  SEO Management
                </h1>

                <p className="mt-2 text-sm text-neutral-500">
                  Products SEO, category SEO, redirects, internal links and
                  analytics
                </p>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                <Link
                  href="/admin/catalog"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-[#f7f2ea] hover:text-neutral-950"
                >
                  <FileText className="h-4 w-4" />
                  <span>Back to Catalog</span>
                </Link>

                <div className="my-3 border-t border-neutral-200" />

                {seoNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-neutral-950 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-[#f7f2ea] hover:text-neutral-950"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-neutral-200 p-4">
                <div className="rounded-2xl bg-[#f7f2ea] p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                    <SearchCheck className="h-4 w-4" />
                    SEO Panel
                  </p>

                  <p className="mt-2 text-xs leading-5 text-neutral-600">
                    Manage product SEO, category SEO, redirects, metadata and
                    internal linking.
                  </p>
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
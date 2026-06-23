"use client";

import Link from "next/link";
import {
  ChevronRight,
  Edit,
  FolderTree,
  PackageSearch,
  Plus,
  Trash2,
} from "lucide-react";
import type { CategoryNode } from "@/components/admin/catalog/categories/category-types";

function getCategoryIsActive(category: CategoryNode) {
  return category.isActive !== false;
}

function CategoryRow({
  category,
  depth = 0,
  onDelete,
  isDeleting,
}: {
  category: CategoryNode;
  depth?: number;
  onDelete: (category: CategoryNode) => void;
  isDeleting?: boolean;
}) {
  const active = getCategoryIsActive(category);

  return (
    <>
      <tr className="border-b border-neutral-100 hover:bg-neutral-50">
        <td className="px-4 py-3">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 22}px` }}
          >
            {category.children?.length ? (
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            ) : (
              <span className="h-4 w-4" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {category.name}
                </span>

                {active ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                    Inactive
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-neutral-500">
                /{category.path || category.slug}
              </p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 text-sm text-neutral-600">
          {category.slug}
        </td>

        <td className="px-4 py-3 text-sm text-neutral-600">
          {category.level || depth + 1}
        </td>

        <td className="px-4 py-3 text-sm text-neutral-600">
          {category.directProductCount ?? 0}
        </td>

        <td className="px-4 py-3 text-sm text-neutral-600">
          {category.productCount ?? 0}
        </td>

        <td className="px-4 py-3 text-sm text-neutral-600">
          {category.sortOrder ?? 0}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/catalog/categories/${encodeURIComponent(
                category.slug,
              )}/products`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              title="Manage category products"
            >
              <PackageSearch className="h-4 w-4" />
            </Link>

            <Link
              href={`/admin/catalog/categories/${encodeURIComponent(
                category.slug,
              )}/edit`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              title="Edit category"
            >
              <Edit className="h-4 w-4" />
            </Link>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(category)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {category.children?.map((child) => (
        <CategoryRow
          key={child.id || child.slug}
          category={child}
          depth={depth + 1}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </>
  );
}

export function CategoryTreeTable({
  categories,
  onDelete,
  isDeleting,
}: {
  categories: CategoryNode[];
  onDelete: (category: CategoryNode) => void;
  isDeleting?: boolean;
}) {
  if (!categories.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
          <FolderTree className="h-6 w-6 text-neutral-500" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-neutral-950">
          No categories found
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Dynamic category tree empty hai. New category create karo.
        </p>

        <Link
          href="/admin/catalog/categories/new"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Create category
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-neutral-200">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead className="bg-neutral-50">
            <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Direct products</th>
              <th className="px-4 py-3">Total products</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <CategoryRow
                key={category.id || category.slug}
                category={category}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
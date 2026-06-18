"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, RefreshCw } from "lucide-react";
import type { CategoryNode } from "@/components/admin/catalog/categories/category-types";
import { CategoryTreeTable } from "@/components/admin/catalog/categories/category-tree-table";
import { deleteCategory, fetchCategoryTree } from "@/lib/admin/category-api";

function countCategories(categories: CategoryNode[]) {
  let count = 0;

  function walk(items: CategoryNode[]) {
    items.forEach((item) => {
      count += 1;

      if (item.children?.length) {
        walk(item.children);
      }
    });
  }

  walk(categories);

  return count;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCategories = useMemo(() => countCategories(categories), [categories]);

  async function loadCategories() {
    try {
      setIsLoading(true);
      setError(null);

      const tree = await fetchCategoryTree();
      setCategories(tree);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Category tree load failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleDelete(category: CategoryNode) {
    const hasProducts = Number(category.productCount || 0) > 0;
    const hasChildren = Boolean(category.children?.length);

    const message = hasChildren || hasProducts
      ? `Category "${category.name}" ke andar ${
          hasChildren ? "child categories" : ""
        }${hasChildren && hasProducts ? " aur " : ""}${
          hasProducts ? "products" : ""
        } hain. Delete karna hai?`
      : `Category "${category.name}" delete karna hai?`;

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError(null);

      await deleteCategory(category.slug);
      await loadCategories();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Category delete failed."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Admin / Catalog
            </p>

            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              <FolderTree className="h-7 w-7" />
              Categories
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Dynamic category tree manage karo. Total categories:{" "}
              <span className="font-semibold text-neutral-800">
                {totalCategories}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadCategories}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/admin/catalog/categories/new"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              New category
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Category error</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.5rem] bg-white p-10 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
            Loading category tree...
          </div>
        ) : (
          <CategoryTreeTable
            categories={categories}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </main>
  );
}
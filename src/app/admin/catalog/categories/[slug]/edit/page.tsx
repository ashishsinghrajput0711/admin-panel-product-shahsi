"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  CategoryFormValues,
  CategoryNode,
} from "@/components/admin/catalog/categories/category-types";
import { CategoryForm } from "@/components/admin/catalog/categories/category-form";
import {
  categoryToFormValues,
  fetchCategoryBySlug,
  fetchCategoryTree,
  uploadCategoryImage,
  upsertCategory,
} from "@/lib/admin/category-api";

function getParamSlug(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();

  const slug = useMemo(() => getParamSlug(params?.slug), [params]);

  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [category, setCategory] = useState<CategoryNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setPageError(null);

      const [tree, detail] = await Promise.all([
        fetchCategoryTree(),
        fetchCategoryBySlug(slug),
      ]);

      setCategoryTree(tree);
      setCategory(detail);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Category detail load failed."
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(values: CategoryFormValues, imageFile: File | null) {
    try {
      setIsSubmitting(true);
      setPageError(null);

      const savedCategory = await upsertCategory(values);
      const savedSlug = savedCategory.slug || values.slug;

      if (imageFile && savedSlug) {
        try {
          await uploadCategoryImage({
            slug: savedSlug,
            file: imageFile,
          });
        } catch (imageError) {
          console.warn("CATEGORY_IMAGE_UPLOAD_FAILED:", imageError);
        }
      }

      if (savedSlug !== slug) {
        router.replace(
          `/admin/catalog/categories/${encodeURIComponent(savedSlug)}/edit`
        );
        return;
      }

      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Category update failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-[1.5rem] bg-white p-10 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
          Loading category...
        </div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          Category not found.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <CategoryForm
          key={category.id || category.slug}
          mode="edit"
          initialValues={categoryToFormValues(category)}
          categoryTree={categoryTree}
          currentCategoryId={category.id}
          currentCategorySlug={category.slug}
          isSubmitting={isSubmitting}
          error={pageError}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
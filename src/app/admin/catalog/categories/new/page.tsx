"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CategoryFormValues,
  CategoryNode,
} from "@/components/admin/catalog/categories/category-types";
import { CategoryForm } from "@/components/admin/catalog/categories/category-form";
import {
  categoryToFormValues,
  fetchCategoryTree,
  uploadCategoryImage,
  upsertCategory,
} from "@/lib/admin/category-api";

export default function NewCategoryPage() {
  const router = useRouter();

  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTree() {
      try {
        setIsLoading(true);
        setPageError(null);

        const tree = await fetchCategoryTree();
        setCategoryTree(tree);
      } catch (error) {
        setPageError(
          error instanceof Error ? error.message : "Category tree load failed."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTree();
  }, []);

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

      router.push(`/admin/catalog/categories/${encodeURIComponent(savedSlug)}/edit`);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Category create failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] rounded-[1.5rem] bg-white p-10 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
          Loading category form...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <CategoryForm
          mode="create"
          initialValues={categoryToFormValues(null)}
          categoryTree={categoryTree}
          isSubmitting={isSubmitting}
          error={pageError}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
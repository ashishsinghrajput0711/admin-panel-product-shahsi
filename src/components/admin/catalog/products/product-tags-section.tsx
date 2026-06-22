"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { Plus, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "./product-schema";

type ProductTagsSectionProps = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
};

function cleanTag(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => cleanTag(item))
    .filter(Boolean);
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function getTags(values: ProductFormValues) {
  return Array.isArray(values.tags) ? values.tags.filter(Boolean) : [];
}

export function ProductTagsSection({
  values,
  onChange,
}: ProductTagsSectionProps) {
  const [draftTag, setDraftTag] = useState("");

  const tags = useMemo(() => getTags(values), [values]);

  function updateTags(nextTags: string[]) {
    const uniqueTags = Array.from(
      new Map(
        nextTags
          .map((item) => cleanTag(item))
          .filter(Boolean)
          .map((item) => [normalizeTag(item), item])
      ).values()
    );

    onChange({
      ...values,
      tags: uniqueTags,
      occasionTags: [],
      metaKeywords: [],
    });
  }

  function addTags() {
    const nextTags = splitTags(draftTag);

    if (!nextTags.length) return;

    updateTags([...tags, ...nextTags]);
    setDraftTag("");
  }

  function removeTag(tagToRemove: string) {
    updateTags(
      tags.filter(
        (tag) => normalizeTag(tag) !== normalizeTag(tagToRemove)
      )
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTags();
    }
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <Tag className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                Tags
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Product tags backend me save honge.
              </p>

              <p className="mt-2 text-sm text-neutral-400">
                {tags.length} {tags.length === 1 ? "tag" : "tags"} added
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-[24px] border border-neutral-200 bg-[#fbfaf7] p-5">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-neutral-800">
                Product Tags
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Add all product, occasion and SEO tags in one field.
              </p>
            </div>

            {tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm"
                  >
                    {tag}

                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full text-neutral-400 transition hover:text-red-600"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-neutral-400">
                No tags added yet.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <input
                value={draftTag}
                onChange={(event) => setDraftTag(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="women's summer dress, vacation mini dress, cotton poplin mini dress"
                className="h-14 min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />

              <Button
                type="button"
                variant="outline"
                onClick={addTags}
                className="h-14 rounded-2xl px-5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            <p className="mt-3 text-xs text-neutral-400">
              Enter press karo ya Add click karo. Comma-separated tags
              automatically separate ho jayenge.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { AlertCircle, Plus, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "./product-schema";

type ProductTagsSectionProps = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
};

const MIN_TAG_LENGTH = 3;
const MAX_TAG_LENGTH = 55;
const MAX_TAGS = 30;

const blockedTags = new Set([
  "test",
  "testing",
  "demo",
  "sample",
  "asdf",
  "sdf",
  "sdfjs",
  "dslck",
  "dddfbd",
  "abc",
  "xyz",
  "qwerty",
  "na",
  "n/a",
  "none",
  "null",
  "undefined",
]);

const allowedSingleWordTags = new Set([
  "dress",
  "dresses",
  "gown",
  "gowns",
  "lehenga",
  "saree",
  "sari",
  "pants",
  "trousers",
  "jeans",
  "top",
  "tops",
  "shirt",
  "shirts",
  "skirt",
  "skirts",
  "blouse",
  "jacket",
  "coat",
  "cotton",
  "silk",
  "satin",
  "chiffon",
  "linen",
  "lace",
  "velvet",
  "ivory",
  "black",
  "white",
  "blue",
  "navy",
  "red",
  "pink",
  "green",
  "gold",
  "silver",
  "brown",
  "beige",
  "taupe",
  "sage",
  "wedding",
  "bridal",
  "bridesmaid",
  "vacation",
  "summer",
  "winter",
  "resort",
  "cocktail",
  "party",
  "formal",
  "casual",
  "midi",
  "mini",
  "maxi",
  "sleeveless",
  "strapless",
  "straight",
  "wide",
  "floral",
  "botanical",
  "smocked",
  "drawstring",
  "pockets",
  "luxury",
  "evening",
  "travel",
]);

function cleanTag(value: string) {
  return String(value || "")
    .replace(/[;|]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTag(value: string) {
  return cleanTag(value).toLowerCase();
}

function hasKeyboardJunkPattern(value: string) {
  const word = value.toLowerCase();

  // repeated same char: dddd, aaa, sssss
  if (/^(.)\1{2,}$/.test(word)) return true;

  // random consonant string: dddfbd, sdfjs, dslck
  const lettersOnly = word.replace(/[^a-z]/g, "");
  const vowelCount = (lettersOnly.match(/[aeiou]/g) || []).length;
  const consonantCount = (
    lettersOnly.match(/[bcdfghjklmnpqrstvwxyz]/g) || []
  ).length;

  if (lettersOnly.length >= 4 && vowelCount === 0 && consonantCount >= 4) {
    return true;
  }

  // too many consonants in a row: ddfbd, xczlk
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(lettersOnly)) {
    return true;
  }

  return false;
}

function isUsefulTag(value: string) {
  const tag = normalizeTag(value);

  if (!tag) return false;
  if (tag.length < MIN_TAG_LENGTH) return false;
  if (tag.length > MAX_TAG_LENGTH) return false;
  if (blockedTags.has(tag)) return false;

  // alphabet hona chahiye
  if (!/[a-z]/i.test(tag)) return false;

  // junk symbols / invalid punctuation block
  if (/[^a-z0-9\s'&-]/i.test(tag)) return false;

  const words = tag.split(/\s+/).filter(Boolean);

  // single-word tag ke liye stricter rule
  if (words.length === 1) {
    const word = words[0];

    if (word.length <= 2) return false;
    if (blockedTags.has(word)) return false;
    if (hasKeyboardJunkPattern(word)) return false;

    // short random single words block, unless commerce/fashion meaning known hai
    if (word.length <= 6 && !allowedSingleWordTags.has(word)) {
      return false;
    }

    return true;
  }

  // multi-word tags me har word too junk nahi hona chahiye
  const hasUsefulWord = words.some((word) => {
    const cleanWord = word.replace(/[^a-z0-9]/gi, "");

    if (cleanWord.length < 3) return false;
    if (blockedTags.has(cleanWord)) return false;
    if (hasKeyboardJunkPattern(cleanWord)) return false;

    return true;
  });

  if (!hasUsefulWord) return false;

  return true;
}

function splitTags(value: string) {
  return cleanTag(value)
    .split(",")
    .map((item) => cleanTag(item))
    .filter(Boolean);
}

function getTags(values: ProductFormValues) {
  return Array.isArray(values.tags)
    ? values.tags.map((tag) => cleanTag(tag)).filter(isUsefulTag)
    : [];
}

function getTagWarning(tags: string[]) {
  if (!tags.length) return "Useful product/search tags add karo.";

  if (tags.length >= MAX_TAGS) {
    return `Maximum ${MAX_TAGS} tags allowed hain. Extra tags ignore honge.`;
  }

  return "Tags product search, filters aur SEO discovery me help karte hain.";
}

export function ProductTagsSection({
  values,
  onChange,
}: ProductTagsSectionProps) {
  const [draftTag, setDraftTag] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);

  const tags = useMemo(() => getTags(values), [values]);
  const tagWarning = getTagWarning(tags);

  function updateTags(nextTags: string[]) {
    const uniqueTags = Array.from(
      new Map(
        nextTags
          .map((item) => cleanTag(item))
          .filter(isUsefulTag)
          .slice(0, MAX_TAGS)
          .map((item) => [normalizeTag(item), item]),
      ).values(),
    );

    onChange({
      ...values,
      tags: uniqueTags,
      occasionTags: [],
      metaKeywords: [],
    });
  }

  function addTags() {
    const rawTags = splitTags(draftTag);
    const validTags = rawTags.filter(isUsefulTag);
    const rejectedTags = rawTags.filter((tag) => !isUsefulTag(tag));

    if (!rawTags.length) {
      setTagError("Pehle tag type karo.");
      return;
    }

    if (!validTags.length) {
      setTagError(
        `Valid tag add karo. Example: cotton pants, women trousers, summer resort pants.`,
      );
      return;
    }

    updateTags([...tags, ...validTags]);
    setDraftTag("");

    if (rejectedTags.length > 0) {
      setTagError(
        `${rejectedTags.length} junk/invalid tag ignore ho gaye: ${rejectedTags
          .slice(0, 4)
          .join(", ")}`,
      );
    } else {
      setTagError(null);
    }
  }

  function removeTag(tagToRemove: string) {
    updateTags(
      tags.filter((tag) => normalizeTag(tag) !== normalizeTag(tagToRemove)),
    );
  }

  function clearAllTags() {
    updateTags([]);
    setTagError(null);
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
                Product search, occasion discovery aur SEO keywords ke liye
                clean tags add karo.
              </p>

              <p className="mt-2 text-sm text-neutral-400">
                {tags.length} / {MAX_TAGS}{" "}
                {tags.length === 1 ? "tag" : "tags"} added
              </p>
            </div>

            {tags.length ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearAllTags}
                className="h-9 rounded-full px-4 text-xs"
              >
                Clear all
              </Button>
            ) : null}
          </div>

          <div className="mt-7 rounded-[24px] border border-neutral-200 bg-[#fbfaf7] p-5">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-neutral-800">
                Product Tags
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Comma-separated tags add karo. Junk/random short tags auto
                ignore honge.
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
                onChange={(event) => {
                  setDraftTag(event.target.value);
                  setTagError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="women's summer dress, vacation midi dress, cotton poplin dress"
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

            {tagError ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{tagError}</span>
              </div>
            ) : (
              <p className="mt-3 text-xs text-neutral-400">{tagWarning}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
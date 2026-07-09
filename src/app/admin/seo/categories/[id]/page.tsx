"use client";

/* eslint-disable @next/next/no-img-element */

import RichTextEditor from "@/components/admin/seo/RichTextEditor";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  FolderTree,
  ImageIcon,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";

type PreviewDevice = "mobile" | "desktop";
type SeoFactorStatus = "PASS" | "WARNING" | "FAIL" | "OPTIONAL" | string;

type SeoScoreFactor = {
  key: string;
  label: string;
  status: SeoFactorStatus;
  score: number;
  maxScore: number;
  message: string;
};

type FaqDraft = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isOpen: boolean;
};

type CategoryMaster = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  fullPath?: string | null;
  publicUrl?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  status?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  imageName?: string | null;
  imageAltText?: string | null;
  thumbnailUrl?: string | null;
  optimizedUrl?: string | null;
  mediaUrl?: string | null;
  fileSizeBytes?: number | string | null;
  originalSizeBytes?: number | string | null;
  originalFileSizeBytes?: number | string | null;
  optimizedSizeBytes?: number | string | null;
  compressedSizeBytes?: number | string | null;
  reductionPercentage?: number | string | null;
  compressionSavedPercent?: number | string | null;
  optimizationStatus?: string | null;
  optimizationReason?: string | null;
  productCount?: number | null;
  parentId?: string | null;
  parentName?: string | null;
  level?: number | null;
  isLeaf?: boolean | null;
  media?: unknown[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CategoryMediaItem = {
  id: string;
  mediaId?: string | null;
  uniqueKey: string;
  url: string;
  originalUrl?: string | null;
  thumbnailUrl?: string | null;
  type: "image" | "video";
  name: string;
  altText: string;
  isPrimary?: boolean;
  isOptimized?: boolean;
  isMissingAlt?: boolean;
  isDuplicateAlt?: boolean;
  isLargeImage?: boolean;
  position?: number | null;
  sortOrder?: number | null;
  fileSizeBytes?: number | null;
  originalSizeBytes?: number | null;
  optimizedSizeBytes?: number | null;
  optimizedUrl?: string | null;
  reductionPercentage?: number | null;
  optimizationStatus?: "optimized" | "skipped" | "failed" | string | null;
  optimizationReason?: string | null;
};

type CategorySeoRecord = {
  id: string | null;
  categoryId: string;
  categoryName?: string | null;
  seoIntroContent?: string | null;
  buyingGuide?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string[] | null;
  slug?: string | null;
  canonicalUrl?: string | null;
  faq?: Array<{
    id?: string | null;
    question?: string | null;
    answer?: string | null;
    sortOrder?: number | null;
  }> | null;
  indexable?: boolean | null;
  followLinks?: boolean | null;
  includeInSitemap?: boolean | null;
  includeInSearch?: boolean | null;
  status?: string | null;
  searchMetadata?: {
    seoTitle?: string | null;
    metaDescription?: string | null;
    primaryKeyword?: string | null;
    secondaryKeywords?: string[] | null;
    slug?: string | null;
    canonicalUrl?: string | null;
    titleLength?: number | null;
    metaDescriptionLength?: number | null;
    isSlugUnique?: boolean | null;
  } | null;
  content?: {
    title?: string | null;
    description?: string | null;
    shortDescription?: string | null;
  } | null;
  mediaSeo?: {
    media?: unknown[] | null;
    summary?: {
      totalMedia?: number | null;
      missingAltText?: number | null;
      duplicateAltText?: number | null;
      largeMedia?: number | null;
      optimizedMedia?: number | null;
    } | null;
  } | null;
  faqBuilder?: {
    enabled?: boolean | null;
    faqs?: Array<{
      id?: string | null;
      question?: string | null;
      answer?: string | null;
      sortOrder?: number | null;
    }> | null;
  } | null;
  publishing?: {
    indexable?: boolean | null;
    followLinks?: boolean | null;
    includeInSitemap?: boolean | null;
  } | null;
  seoScoreBreakdown?: {
    overallScore?: number | null;
    searchMetadataScore?: number | null;
    contentScore?: number | null;
    mediaSeoScore?: number | null;
    faqScore?: number | null;
    technicalSeoScore?: number | null;
    factors?: SeoScoreFactor[] | null;
  } | null;
  nextBestAction?: {
    section?: string | null;
    message?: string | null;
  } | null;
  updatedAt?: string | null;
};

type CategorySeoDetailResponse = {
  success?: boolean;
  data?: {
    category?: CategoryMaster | null;
    seo?: CategorySeoRecord | null;
  } | null;
  category?: CategoryMaster | null;
  seo?: CategorySeoRecord | null;
  message?: string | string[];
};

type CategoryMediaResponse =
  | CategoryMediaItem[]
  | {
      success?: boolean;
      data?:
        | CategoryMediaItem[]
        | {
            media?: unknown[];
            items?: unknown[];
            results?: unknown[];
          };
      media?: unknown[];
      items?: unknown[];
      results?: unknown[];
      message?: string | string[];
    };

type CategoryRedirectSuggestion = {
  sourcePath: string;
  destinationPath: string;
  requestedDestinationPath?: string;
  finalDestinationPath?: string;
};

type CategoryRedirectCreateResponse = {
  success?: boolean;
  data?: unknown;
  sourceUrl?: string | null;
  destinationUrl?: string | null;
  requestedDestinationUrl?: string | null;
  destinationAdjusted?: boolean | null;
  reason?: string | null;
  message?: string | string[];
};

const PUBLIC_FRONTEND_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://frontend-shahsi-2-0.vercel.app"
).replace(/\/$/, "");

const META_TITLE_MIN = 55;
const META_TITLE_MAX = 60;
const META_DESCRIPTION_MIN = 155;
const META_DESCRIPTION_MAX = 160;

const inputClassName =
  "h-11 w-full rounded-xl border-neutral-200 bg-white text-sm shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950";

const textareaClassName =
  "min-h-28 w-full rounded-xl border-neutral-200 bg-white text-sm leading-6 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950";

function arrayToText(value?: string[] | null) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function textToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function stripHtml(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryPath(value?: string | null) {
  const cleanValue = `${value || ""}`.trim();

  if (!cleanValue) return "";

  let pathname = cleanValue;
  let search = "";

  try {
    const parsedUrl = new URL(cleanValue);
    pathname = parsedUrl.pathname;
    search = parsedUrl.search || "";
  } catch {
    pathname = cleanValue.split("?")[0].split("#")[0];
    const queryIndex = cleanValue.indexOf("?");
    if (queryIndex >= 0) search = cleanValue.slice(queryIndex).split("#")[0];
  }

  let cleanPath = pathname
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/categories(?=\/|$)/i, "")
    .replace(/^categories(?=\/|$)/i, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (!cleanPath) return "";

  return `/${cleanPath}${search}`;
}

function getEditableCategoryHandleInput(value?: string | null) {
  const cleanValue = `${value || ""}`.trim();

  if (!cleanValue) return "";

  let pathname = cleanValue;

  try {
    pathname = new URL(cleanValue).pathname;
  } catch {
    pathname = cleanValue.split("?")[0].split("#")[0];
  }

  return pathname
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/categories(?=\/|$)/i, "")
    .replace(/^categories(?=\/|$)/i, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
}

function getSlugFromUrlOrHandle(value: string) {
  return normalizeCategoryPath(value).replace(/^\//, "");
}

function getLeafCategorySlug(value?: string | null) {
  const normalizedPath = normalizeCategoryPath(value).replace(/^\/+|\/+$/g, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  return segments.length ? segments[segments.length - 1] : "";
}

function getParentCategoryPath(value?: string | null) {
  const normalizedPath = normalizeCategoryPath(value).replace(/^\/+|\/+$/g, "");
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length <= 1) return "";

  return `/${segments.slice(0, -1).join("/")}`;
}

function joinCategoryParentAndLeaf(parentPath: string, leafSlug: string) {
  const cleanLeaf = slugify(leafSlug || "");
  const cleanParent = normalizeCategoryPath(parentPath).replace(/\/+$/g, "");

  if (!cleanLeaf) return cleanParent;
  if (!cleanParent) return `/${cleanLeaf}`;

  return `${cleanParent}/${cleanLeaf}`;
}

function getCatalogCategoryFinalPath(response: unknown, requestedPath: string) {
  const requested = normalizeCategoryPath(requestedPath);
  const explicitFullPath = getPathFieldFromUnknown(response, [
    "fullPath",
    "path",
    "categoryPath",
    "publicUrl",
    "canonicalUrl",
    "newCategoryPath",
    "updatedCategoryPath",
    "finalCategoryPath",
    "newPath",
    "updatedPath",
    "destinationPath",
    "destinationUrl",
  ]);

  const requestedParent = getParentCategoryPath(requested);

  if (explicitFullPath) {
    const explicitParent = getParentCategoryPath(explicitFullPath);

    if (!requestedParent || explicitParent === requestedParent) return explicitFullPath;

    const explicitLeaf = getLeafCategorySlug(explicitFullPath);
    if (explicitLeaf) return joinCategoryParentAndLeaf(requestedParent, explicitLeaf);
  }

  const responseLeafPath = getPathFieldFromUnknown(response, [
    "slug",
    "newSlug",
    "updatedSlug",
    "finalSlug",
  ]);
  const responseLeaf = getLeafCategorySlug(responseLeafPath);

  if (responseLeaf) return joinCategoryParentAndLeaf(requestedParent, responseLeaf);

  return requested;
}

function getCanonicalUrlFromHandle(value: string, fallbackSlug: string) {
  const cleanValue = value.trim();
  const normalizedPath = normalizeCategoryPath(cleanValue || fallbackSlug);
  const fallbackPath = normalizeCategoryPath(fallbackSlug);
  const finalPath = normalizedPath || fallbackPath || "/";

  return `${PUBLIC_FRONTEND_URL}${finalPath === "/" ? "" : finalPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function getNumberField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return null;
}

function getBooleanField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function getNestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function getStringFieldFromRecords(records: Array<Record<string, unknown> | null>, keys: string[]) {
  for (const record of records) {
    if (!record) continue;
    const value = getStringField(record, keys);
    if (value) return value;
  }
  return "";
}

function getNumberFieldFromRecords(records: Array<Record<string, unknown> | null>, keys: string[]) {
  for (const record of records) {
    if (!record) continue;
    const value = getNumberField(record, keys);
    if (typeof value === "number") return value;
  }
  return null;
}

function getBooleanFieldFromRecords(records: Array<Record<string, unknown> | null>, keys: string[]) {
  for (const record of records) {
    if (!record) continue;
    const value = getBooleanField(record, keys);
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function normalizeMediaCacheUrl(value?: string | null) {
  return (value || "").trim().toLowerCase().split("?")[0];
}

function isVideoUrl(url?: string | null) {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split("?")[0];
  return (
    cleanUrl.includes("/video/upload/") ||
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".m4v") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    cleanUrl.endsWith(".ogv")
  );
}

function normalizeMediaItem(value: unknown, index: number): CategoryMediaItem | null {
  if (!isRecord(value)) return null;

  const optimizationRecord = getNestedRecord(value, [
    "optimization",
    "mediaOptimization",
    "seoOptimization",
    "optimizationMeta",
    "optimized",
    "compression",
  ]);
  const records = [value, optimizationRecord];

  const rawUrl = getStringField(value, [
    "url",
    "imageUrl",
    "videoUrl",
    "mediaUrl",
    "secureUrl",
    "src",
    "path",
  ]);
  const optimizedUrl = getStringFieldFromRecords(records, [
    "optimizedUrl",
    "optimized_url",
    "webpUrl",
    "webp_url",
    "compressedUrl",
    "compressed_url",
    "transformedUrl",
    "transformed_url",
  ]);
  const thumbnailUrl = getStringFieldFromRecords(records, [
    "thumbnailUrl",
    "thumbnail_url",
    "thumbnail",
    "poster",
    "previewUrl",
    "preview_url",
  ]);
  const url = rawUrl || optimizedUrl || thumbnailUrl;

  if (!url) return null;

  const rawId = getStringFieldFromRecords(records, ["id", "mediaId", "imageId", "_id"]);
  const id = rawId || `category-media-${index}`;
  const rawType = getStringFieldFromRecords(records, ["type", "mediaType", "resourceType", "mimeType"]).toLowerCase();
  const type: "image" | "video" = rawType.includes("video") || isVideoUrl(url) ? "video" : "image";
  const name = getStringFieldFromRecords(records, ["name", "title", "imageTitle", "fileName"]) || "Untitled media";
  const altText = getStringFieldFromRecords(records, ["altText", "alt", "alt_text"]);
  const originalSizeBytes = getNumberFieldFromRecords(records, [
    "originalSizeBytes",
    "originalFileSizeBytes",
    "originalBytes",
    "sourceSizeBytes",
    "beforeSizeBytes",
    "preOptimizationSizeBytes",
  ]);
  const optimizedSizeBytes = getNumberFieldFromRecords(records, [
    "optimizedSizeBytes",
    "optimizedFileSizeBytes",
    "compressedSizeBytes",
    "compressedBytes",
    "optimizedBytes",
    "outputSizeBytes",
    "afterSizeBytes",
    "newSizeBytes",
    "transformedSizeBytes",
  ]);
  const fileSizeBytes = getNumberFieldFromRecords(records, [
    "fileSizeBytes",
    "sizeBytes",
    "bytes",
    "fileSize",
    "size",
    "currentSizeBytes",
  ]);
  const reductionPercentage = getNumberFieldFromRecords(records, [
    "reductionPercentage",
    "reductionPercent",
    "compressionSavedPercent",
    "compressionReductionPercentage",
    "savedPercent",
    "savedPercentage",
  ]);
  const optimizationStatus = getStringFieldFromRecords(records, ["optimizationStatus", "status"]) || null;
  const isOptimized =
    getBooleanFieldFromRecords(records, ["isOptimized", "optimized"]) ??
    Boolean(
      optimizedUrl ||
        optimizedSizeBytes ||
        optimizationStatus === "optimized" ||
        url.endsWith(".webp") ||
        url.includes("/f_webp") ||
        url.includes("format=webp"),
    );

  return {
    id,
    mediaId: getStringFieldFromRecords(records, ["mediaId", "id", "imageId"]),
    uniqueKey: `${type}-${id}-${normalizeMediaCacheUrl(optimizedUrl || url)}-${index}`,
    url,
    originalUrl: getStringFieldFromRecords(records, [
      "originalUrl",
      "original_url",
      "sourceUrl",
      "source_url",
    ]) || (optimizedUrl ? rawUrl : ""),
    thumbnailUrl: thumbnailUrl || optimizedUrl || url,
    type,
    name,
    altText,
    isPrimary: getBooleanFieldFromRecords(records, ["isPrimary", "primary"]),
    isOptimized,
    isMissingAlt: getBooleanFieldFromRecords(records, ["isMissingAlt", "missingAlt"]) ?? !altText,
    isDuplicateAlt: getBooleanFieldFromRecords(records, ["isDuplicateAlt", "duplicateAlt"]),
    isLargeImage: getBooleanFieldFromRecords(records, ["isLargeImage", "largeImage"]),
    position: getNumberFieldFromRecords(records, ["position"]),
    sortOrder: getNumberFieldFromRecords(records, ["sortOrder"]),
    fileSizeBytes,
    originalSizeBytes: originalSizeBytes ?? fileSizeBytes ?? null,
    optimizedSizeBytes: optimizedSizeBytes ?? (isOptimized ? fileSizeBytes : null),
    optimizedUrl,
    reductionPercentage,
    optimizationStatus,
    optimizationReason: getStringFieldFromRecords(records, ["optimizationReason", "reason", "skipReason"]) || null,
  };
}

function markDuplicateAltText(items: CategoryMediaItem[]) {
  const altCounts = new Map<string, number>();

  items.forEach((item) => {
    const key = item.altText.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) return;
    altCounts.set(key, (altCounts.get(key) || 0) + 1);
  });

  return items.map((item) => {
    const key = item.altText.trim().toLowerCase().replace(/\s+/g, " ");
    const duplicateByUi = key ? (altCounts.get(key) || 0) > 1 : false;

    return {
      ...item,
      isMissingAlt: !item.altText.trim(),
      isDuplicateAlt: Boolean(item.isDuplicateAlt || duplicateByUi),
    };
  });
}

function normalizeMediaResponse(response: CategoryMediaResponse | unknown): CategoryMediaItem[] {
  const candidates: unknown[] = [];

  function addCandidate(value: unknown) {
    if (Array.isArray(value)) candidates.push(...value);
  }

  if (Array.isArray(response)) candidates.push(...response);

  if (isRecord(response)) {
    addCandidate(response.data);
    addCandidate(response.media);
    addCandidate(response.items);
    addCandidate(response.results);

    if (isRecord(response.data)) {
      addCandidate(response.data.media);
      addCandidate(response.data.items);
      addCandidate(response.data.results);
    }
  }

  const seen = new Set<string>();
  const normalized = candidates
    .map((item, index) => normalizeMediaItem(item, index))
    .filter((item): item is CategoryMediaItem => Boolean(item))
    .filter((item) => {
      const key = item.url.toLowerCase().split("?")[0] || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.position ?? a.sortOrder ?? 999) - (b.position ?? b.sortOrder ?? 999));

  return markDuplicateAltText(normalized);
}

function categoryMasterToMediaItem(categoryRecord?: CategoryMaster | null): CategoryMediaItem | null {
  const categoryAsRecord = isRecord(categoryRecord) ? categoryRecord : null;
  const url = firstText(
    categoryRecord?.imageUrl,
    categoryRecord?.image,
    categoryRecord?.optimizedUrl,
    categoryRecord?.mediaUrl,
    categoryRecord?.thumbnailUrl,
  );
  if (!url) return null;

  const optimizedUrl = firstText(categoryRecord?.optimizedUrl, "");
  const finalOptimizedUrl = optimizedUrl || url;
  const name = firstText(categoryRecord?.title, categoryRecord?.name, "Category image");
  const altText = firstText(categoryRecord?.imageAltText, "");
  const fileSizeBytes = categoryAsRecord
    ? getNumberField(categoryAsRecord, ["fileSizeBytes", "sizeBytes", "bytes", "fileSize", "size"])
    : null;
  const originalSizeBytes = categoryAsRecord
    ? getNumberField(categoryAsRecord, ["originalSizeBytes", "originalFileSizeBytes", "originalBytes", "sourceSizeBytes"])
    : null;
  const optimizedSizeBytes = categoryAsRecord
    ? getNumberField(categoryAsRecord, ["optimizedSizeBytes", "compressedSizeBytes", "optimizedBytes", "outputSizeBytes"])
    : null;
  const reductionPercentage = categoryAsRecord
    ? getNumberField(categoryAsRecord, ["reductionPercentage", "reductionPercent", "compressionSavedPercent", "savedPercent", "savedPercentage"])
    : null;

  return {
    id: categoryRecord?.id ? `${categoryRecord.id}:image` : "category-image",
    mediaId: categoryRecord?.id ? `${categoryRecord.id}:image` : null,
    uniqueKey: `category-image-${categoryRecord?.id || "default"}-${normalizeMediaCacheUrl(finalOptimizedUrl)}`,
    url,
    originalUrl: url,
    thumbnailUrl: firstText(categoryRecord?.thumbnailUrl, finalOptimizedUrl, url),
    type: "image",
    name,
    altText,
    isPrimary: true,
    isOptimized: Boolean(
      optimizedUrl ||
        url.includes(".webp") ||
        url.includes("/f_webp") ||
        url.includes("format=webp") ||
        categoryRecord?.optimizationStatus === "optimized",
    ),
    isMissingAlt: !altText,
    isDuplicateAlt: false,
    position: 0,
    sortOrder: 0,
    fileSizeBytes,
    originalSizeBytes: originalSizeBytes ?? fileSizeBytes ?? null,
    optimizedSizeBytes: optimizedSizeBytes ?? (optimizedUrl ? fileSizeBytes : null),
    optimizedUrl,
    reductionPercentage,
    optimizationStatus: categoryRecord?.optimizationStatus || null,
    optimizationReason: categoryRecord?.optimizationReason || null,
  };
}

function getMergedCategoryMediaItem(
  image: CategoryMediaItem,
  categoryImage?: CategoryMediaItem | null,
  categoryRecord?: CategoryMaster | null,
) {
  const fallbackUrl = categoryImage?.url || categoryRecord?.imageUrl || categoryRecord?.image || "";
  const finalUrl = firstText(image.url, fallbackUrl);
  const finalOptimizedUrl = firstText(image.optimizedUrl, categoryImage?.optimizedUrl, finalUrl);
  const isOptimized =
    Boolean(image.isOptimized || categoryImage?.isOptimized) ||
    finalOptimizedUrl.endsWith(".webp") ||
    finalOptimizedUrl.includes("/f_webp") ||
    finalOptimizedUrl.includes("format=webp");
  const originalSizeBytes =
    image.originalSizeBytes ??
    categoryImage?.originalSizeBytes ??
    image.fileSizeBytes ??
    categoryImage?.fileSizeBytes ??
    null;
  const optimizedSizeBytes =
    image.optimizedSizeBytes ??
    categoryImage?.optimizedSizeBytes ??
    (isOptimized ? image.fileSizeBytes ?? categoryImage?.fileSizeBytes ?? null : null);

  return {
    ...image,
    id: firstText(image.id, categoryRecord?.id ? `${categoryRecord.id}:image` : "category-image"),
    mediaId: firstText(image.mediaId, image.id, categoryRecord?.id ? `${categoryRecord.id}:image` : ""),
    uniqueKey: `category-image-${categoryRecord?.id || image.id || "default"}-${normalizeMediaCacheUrl(finalOptimizedUrl || finalUrl)}`,
    url: finalUrl,
    originalUrl: firstText(image.originalUrl, categoryImage?.originalUrl, fallbackUrl),
    thumbnailUrl: firstText(image.thumbnailUrl, categoryImage?.thumbnailUrl, finalOptimizedUrl, finalUrl),
    optimizedUrl: finalOptimizedUrl,
    type: "image" as const,
    isPrimary: true,
    name: firstText(image.name, categoryRecord?.title, categoryRecord?.name, "Category image"),
    altText: firstText(image.altText, categoryRecord?.imageAltText, ""),
    isMissingAlt: !firstText(image.altText, categoryRecord?.imageAltText, ""),
    isOptimized,
    fileSizeBytes: image.fileSizeBytes ?? categoryImage?.fileSizeBytes ?? optimizedSizeBytes ?? originalSizeBytes ?? null,
    originalSizeBytes,
    optimizedSizeBytes,
    reductionPercentage: image.reductionPercentage ?? categoryImage?.reductionPercentage ?? null,
    optimizationStatus: image.optimizationStatus || categoryImage?.optimizationStatus || (isOptimized ? "optimized" : null),
    optimizationReason: image.optimizationReason || categoryImage?.optimizationReason || null,
  };
}

function pickSingleCategoryImage(items: CategoryMediaItem[], categoryRecord?: CategoryMaster | null) {
  const categoryImage = categoryMasterToMediaItem(categoryRecord);
  const imageItems = items.filter((item) => item.type === "image" && item.url);

  const imageWithOptimizationData =
    imageItems.find(
      (item) =>
        Boolean(item.optimizedUrl) ||
        item.isOptimized ||
        typeof item.originalSizeBytes === "number" ||
        typeof item.optimizedSizeBytes === "number" ||
        typeof item.fileSizeBytes === "number" ||
        typeof item.reductionPercentage === "number",
    ) || null;

  const image = imageWithOptimizationData || imageItems[0] || categoryImage;
  if (!image) return [];

  return markDuplicateAltText([getMergedCategoryMediaItem(image, categoryImage, categoryRecord)]);
}

type CachedCategoryMediaOptimization = {
  id?: string | null;
  mediaId?: string | null;
  url?: string | null;
  optimizedUrl?: string | null;
  originalUrl?: string | null;
  fileSizeBytes?: number | null;
  originalSizeBytes?: number | null;
  optimizedSizeBytes?: number | null;
  reductionPercentage?: number | null;
  optimizationStatus?: string | null;
  optimizationReason?: string | null;
  updatedAt: number;
};

function getCategoryMediaOptimizationCacheKey(categoryId: string) {
  return `category-seo-media-optimization:${categoryId}`;
}

function getCategoryMediaIdentityKeys(media: CategoryMediaItem) {
  return [
    media.id,
    media.mediaId,
    normalizeMediaCacheUrl(media.url),
    normalizeMediaCacheUrl(media.optimizedUrl),
    normalizeMediaCacheUrl(media.originalUrl),
  ].filter((value): value is string => Boolean(value));
}

function readCategoryMediaOptimizationCache(categoryId: string) {
  if (typeof window === "undefined") return [] as CachedCategoryMediaOptimization[];

  try {
    const raw = window.localStorage.getItem(getCategoryMediaOptimizationCacheKey(categoryId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CachedCategoryMediaOptimization[]) : [];
  } catch {
    return [];
  }
}

function writeCategoryMediaOptimizationCache(categoryId: string, items: CategoryMediaItem[]) {
  if (typeof window === "undefined") return;

  const cacheItems = items
    .filter(
      (item) =>
        item.originalSizeBytes ||
        item.optimizedSizeBytes ||
        item.reductionPercentage ||
        item.optimizedUrl ||
        item.optimizationStatus,
    )
    .map((item) => ({
      id: item.id,
      mediaId: item.mediaId || null,
      url: item.url,
      optimizedUrl: item.optimizedUrl || null,
      originalUrl: item.originalUrl || null,
      fileSizeBytes: item.fileSizeBytes ?? null,
      originalSizeBytes: item.originalSizeBytes ?? item.fileSizeBytes ?? null,
      optimizedSizeBytes: item.optimizedSizeBytes ?? (item.isOptimized ? item.fileSizeBytes ?? null : null),
      reductionPercentage: item.reductionPercentage ?? null,
      optimizationStatus: item.optimizationStatus || (item.isOptimized ? "optimized" : null),
      optimizationReason: item.optimizationReason || null,
      updatedAt: Date.now(),
    }));

  try {
    window.localStorage.setItem(
      getCategoryMediaOptimizationCacheKey(categoryId),
      JSON.stringify(cacheItems),
    );
  } catch {
    // Cache is only used to preserve UI optimization details between category revisits.
  }
}

function applyCategoryMediaOptimizationCache(items: CategoryMediaItem[], categoryId: string) {
  const cache = readCategoryMediaOptimizationCache(categoryId);
  if (!cache.length) return items;

  return items.map((item) => {
    const itemKeys = new Set(getCategoryMediaIdentityKeys(item));
    const cached = cache.find((entry) =>
      [
        entry.id || "",
        entry.mediaId || "",
        normalizeMediaCacheUrl(entry.url),
        normalizeMediaCacheUrl(entry.optimizedUrl),
        normalizeMediaCacheUrl(entry.originalUrl),
      ].some((key) => key && itemKeys.has(key)),
    );

    if (!cached) return item;

    const optimizedUrl = item.optimizedUrl || cached.optimizedUrl || "";
    const isOptimized = Boolean(item.isOptimized || optimizedUrl || cached.optimizationStatus === "optimized");

    return {
      ...item,
      optimizedUrl,
      originalUrl: item.originalUrl || cached.originalUrl || item.url,
      fileSizeBytes: item.fileSizeBytes ?? cached.fileSizeBytes ?? null,
      originalSizeBytes: item.originalSizeBytes ?? cached.originalSizeBytes ?? item.fileSizeBytes ?? null,
      optimizedSizeBytes:
        item.optimizedSizeBytes ??
        cached.optimizedSizeBytes ??
        (isOptimized ? item.fileSizeBytes ?? cached.fileSizeBytes ?? null : null),
      reductionPercentage: item.reductionPercentage ?? cached.reductionPercentage ?? null,
      optimizationStatus: item.optimizationStatus || cached.optimizationStatus || (isOptimized ? "optimized" : null),
      optimizationReason: item.optimizationReason || cached.optimizationReason || null,
      isOptimized,
    };
  });
}

function getDetailPayload(response: CategorySeoDetailResponse) {
  return {
    category: response.data?.category || response.category || null,
    seo: response.data?.seo || response.seo || null,
  };
}

function collectRecordCandidates(value: unknown): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();

  function visit(item: unknown) {
    if (!isRecord(item) || seen.has(item)) return;
    seen.add(item);
    records.push(item);

    [
      "data",
      "category",
      "seo",
      "searchMetadata",
      "redirect",
      "redirectInfo",
      "slugChange",
      "pathChange",
      "canonical",
    ].forEach((key) => visit(item[key]));
  }

  visit(value);
  return records;
}

function getPathFieldFromUnknown(value: unknown, keys: string[]) {
  const records = collectRecordCandidates(value);

  for (const record of records) {
    const field = getStringField(record, keys);
    const normalized = normalizeCategoryPath(field);
    if (normalized) return normalized;
  }

  return "";
}

function getCurrentCategoryPath(categoryRecord?: CategoryMaster | null, seoRecord?: CategorySeoRecord | null, fallback = "") {
  return normalizeCategoryPath(
    firstText(
      seoRecord?.searchMetadata?.canonicalUrl,
      seoRecord?.canonicalUrl,
      categoryRecord?.publicUrl,
      seoRecord?.searchMetadata?.slug,
      seoRecord?.slug,
      categoryRecord?.slug,
      fallback,
    ),
  );
}

function getSaveResponseOldCategoryPath(response: unknown) {
  return getPathFieldFromUnknown(response, [
    "oldCategoryPath",
    "previousCategoryPath",
    "oldPath",
    "previousPath",
    "oldSourcePath",
    "sourcePath",
    "sourceUrl",
    "oldSlug",
    "previousSlug",
    "previousCategorySlug",
    "oldCanonicalUrl",
    "oldPublicUrl",
  ]);
}

function getSaveResponseNewCategoryPath(response: unknown) {
  return getPathFieldFromUnknown(response, [
    "newCategoryPath",
    "updatedCategoryPath",
    "finalCategoryPath",
    "newPath",
    "updatedPath",
    "destinationPath",
    "destinationUrl",
    "newSlug",
    "updatedSlug",
    "finalSlug",
    "slug",
    "canonicalUrl",
    "publicUrl",
  ]);
}

function getRequestedDestinationPath(response: unknown) {
  return getPathFieldFromUnknown(response, [
    "requestedDestinationUrl",
    "requestedDestinationPath",
    "requestedSlug",
    "requestedPath",
  ]);
}

function pathsAreDifferent(sourcePath: string, destinationPath: string) {
  return Boolean(sourcePath && destinationPath && sourcePath !== destinationPath);
}

function stringifyApiMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  if ("message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) {
      try {
        return JSON.stringify(message);
      } catch {
        return fallback;
      }
    }
  }

  if ("error" in data && typeof (data as { error?: unknown }).error === "string") {
    return String((data as { error?: unknown }).error);
  }

  return fallback;
}

function scoreClass(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 50) return "text-amber-700";
  return "text-red-700";
}

function factorStatusClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PASS") return "border-emerald-100 bg-emerald-50/70 text-emerald-700";
  if (normalized === "OPTIONAL") return "border-blue-100 bg-blue-50/70 text-blue-700";
  if (normalized === "WARNING") return "border-amber-100 bg-amber-50/70 text-amber-700";
  if (normalized === "FAIL") return "border-red-100 bg-red-50/70 text-red-700";

  return "border-neutral-100 bg-neutral-50 text-neutral-600";
}

function factorStatusIcon(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PASS") return "✓";
  if (normalized === "OPTIONAL") return "○";
  if (normalized === "WARNING") return "!";
  if (normalized === "FAIL") return "×";

  return "•";
}

function factorIsFixed(factor: SeoScoreFactor) {
  return String(factor.status || "").toUpperCase() === "PASS";
}

function factorIsIssue(factor: SeoScoreFactor) {
  const normalized = String(factor.status || "").toUpperCase();
  return normalized === "FAIL" || normalized === "WARNING";
}

function getSeoFactorCategory(factor: SeoScoreFactor) {
  const key = `${factor.key || ""} ${factor.label || ""}`.toLowerCase();

  if (key.includes("schema") || key.includes("robots") || key.includes("canonical") || key.includes("index")) {
    return "Technical SEO";
  }

  if (
    key.includes("social") ||
    key.includes("meta") ||
    key.includes("seo title") ||
    key.includes("url") ||
    key.includes("slug")
  ) {
    return "Search metadata";
  }

  if (
    key.includes("first paragraph") ||
    key.includes("paragraph") ||
    key.includes("h1") ||
    key.includes("h2") ||
    key.includes("h3") ||
    key.includes("content") ||
    key.includes("density") ||
    key.includes("readability") ||
    key.includes("sentence") ||
    key.includes("transition") ||
    key.includes("category title") ||
    key.includes("category description") ||
    key.includes("faq")
  ) {
    return "Content quality";
  }

  if (key.includes("internal link") || key.includes("external link") || key.includes("linking")) {
    return "Links";
  }

  if (key.includes("image") || key.includes("media") || key.includes("alt")) {
    return "Media";
  }

  return "Other checks";
}

type SeoFactorGroup = {
  label: string;
  fixed: number;
  total: number;
  factors: SeoScoreFactor[];
};

function groupSeoFactors(factors: SeoScoreFactor[]): SeoFactorGroup[] {
  const groups = new Map<string, SeoScoreFactor[]>();

  factors.forEach((factor) => {
    const category = getSeoFactorCategory(factor);
    groups.set(category, [...(groups.get(category) || []), factor]);
  });

  return Array.from(groups.entries()).map(([label, groupFactors]) => ({
    label,
    fixed: groupFactors.filter(factorIsFixed).length,
    total: groupFactors.length,
    factors: groupFactors,
  }));
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "Size not available";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function getOriginalDisplaySize(media: CategoryMediaItem) {
  return media.originalSizeBytes ?? media.fileSizeBytes ?? null;
}

function getCompressedDisplaySize(media: CategoryMediaItem) {
  if (media.optimizedSizeBytes) return media.optimizedSizeBytes;
  if (media.isOptimized && media.fileSizeBytes) return media.fileSizeBytes;
  return null;
}

function fallbackFactors(score: number, isTitleLengthGood: boolean, isDescriptionLengthGood: boolean, isUrlAdded: boolean, isDescriptionAdded: boolean, hasMissingAlt: boolean): SeoScoreFactor[] {
  return [
    {
      key: "meta_title",
      label: "Meta title",
      status: isTitleLengthGood ? "PASS" : "WARNING",
      score: isTitleLengthGood ? 5 : 3,
      maxScore: 5,
      message: isTitleLengthGood ? "Meta title length is good." : "Keep meta title between 55 and 60 characters.",
    },
    {
      key: "meta_description",
      label: "Meta description",
      status: isDescriptionLengthGood ? "PASS" : "WARNING",
      score: isDescriptionLengthGood ? 5 : 3,
      maxScore: 5,
      message: isDescriptionLengthGood ? "Meta description length is good." : "Keep meta description between 155 and 160 characters.",
    },
    {
      key: "canonical_url",
      label: "Canonical URL",
      status: isUrlAdded ? "PASS" : "FAIL",
      score: isUrlAdded ? 5 : 0,
      maxScore: 5,
      message: isUrlAdded ? "Category URL handle is connected." : "Add a category URL handle.",
    },
    {
      key: "category_description",
      label: "Category description",
      status: isDescriptionAdded ? "PASS" : "FAIL",
      score: isDescriptionAdded ? 5 : 0,
      maxScore: 5,
      message: isDescriptionAdded ? "Category content is available." : "Add category description content.",
    },
    {
      key: "media_alt_text",
      label: "Media alt text",
      status: hasMissingAlt ? "WARNING" : "PASS",
      score: hasMissingAlt ? 3 : 5,
      maxScore: 5,
      message: hasMissingAlt ? "Some category media alt text is missing." : "Category media alt text is complete.",
    },
    {
      key: "overall_score",
      label: "Overall score",
      status: score >= 80 ? "PASS" : score >= 50 ? "WARNING" : "FAIL",
      score: Math.round(score / 20),
      maxScore: 5,
      message: "Score updates from the Category SEO validation response after save/validate.",
    },
  ];
}

export default function CategorySeoEditPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const defaultSlug = slugify(decodeURIComponent(categoryId || "category"));

  const [category, setCategory] = useState<CategoryMaster | null>(null);
  const [seo, setSeo] = useState<CategorySeoRecord | null>(null);
  const [mediaItems, setMediaItems] = useState<CategoryMediaItem[]>([]);
  const [selectedMediaKey, setSelectedMediaKey] = useState<string | null>(null);
  const [mediaDraft, setMediaDraft] = useState({ altText: "" });
  const [faqItems, setFaqItems] = useState<FaqDraft[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaSaving, setIsMediaSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<"upload-image" | "optimize-size" | "optimize-alt" | "delete-image" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [originalCategoryPath, setOriginalCategoryPath] = useState("");
  const [pendingRedirectSuggestion, setPendingRedirectSuggestion] = useState<CategoryRedirectSuggestion | null>(null);
  const [createRedirectOnSave, setCreateRedirectOnSave] = useState(true);

  const [customMetaEnabled, setCustomMetaEnabled] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [isOptimizeMenuOpen, setIsOptimizeMenuOpen] = useState(false);
  const [selectedCategoryImageFile, setSelectedCategoryImageFile] = useState<File | null>(null);
  const [newMediaDraft, setNewMediaDraft] = useState({
    altText: "",
  });

  const [form, setForm] = useState({
    categoryName: "",
    categoryDescription: "",
    shortDescription: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    seoTitle: "",
    metaDescription: "",
    slug: defaultSlug,
    canonicalUrl: getCanonicalUrlFromHandle(defaultSlug, defaultSlug),
    faqEnabled: false,
    indexable: true,
    followLinks: true,
    includeInSitemap: true,
  });

  const selectedMedia = useMemo(() => {
    if (!mediaItems.length) return null;
    return mediaItems.find((item) => item.uniqueKey === selectedMediaKey) || mediaItems[0];
  }, [mediaItems, selectedMediaKey]);

  const primaryMedia = useMemo(() => mediaItems.find((item) => item.isPrimary) || mediaItems[0] || null, [mediaItems]);

  const titleCount = form.seoTitle.length;
  const metaCount = form.metaDescription.length;
  const cleanSlug = getSlugFromUrlOrHandle(form.slug || form.canonicalUrl || category?.slug || defaultSlug);
  const effectiveCanonicalUrl = getCanonicalUrlFromHandle(form.canonicalUrl || cleanSlug, cleanSlug || defaultSlug);
  const categoryCatalogKey = getSlugFromUrlOrHandle(form.slug || category?.slug || cleanSlug || defaultSlug) || categoryId;
  const urlHandleInputValue = form.canonicalUrl || effectiveCanonicalUrl;
  const previewTitle = form.seoTitle || form.categoryName || category?.name || "Category";
  const previewDescription = form.metaDescription || stripHtml(form.categoryDescription) || "Meta description preview";

  let previewDomain = PUBLIC_FRONTEND_URL.replace(/^https?:\/\//, "");
  let previewPath = cleanSlug ? cleanSlug.split("/").filter(Boolean).join(" › ") : "category";

  try {
    const parsedPreviewUrl = new URL(effectiveCanonicalUrl);
    previewDomain = parsedPreviewUrl.hostname;
    previewPath = parsedPreviewUrl.pathname.split("/").filter(Boolean).join(" › ") || previewPath;
  } catch {
    // Fallback preview values are already set.
  }

  const isUrlAdded = Boolean(cleanSlug || form.canonicalUrl.trim());
  const isTitleAdded = Boolean(form.seoTitle.trim() || form.categoryName.trim());
  const isDescriptionAdded = Boolean(form.metaDescription.trim() || stripHtml(form.categoryDescription));
  const isTitleLengthGood = titleCount >= META_TITLE_MIN && titleCount <= META_TITLE_MAX;
  const isDescriptionLengthGood = metaCount >= META_DESCRIPTION_MIN && metaCount <= META_DESCRIPTION_MAX;

  const mediaSummary = useMemo(() => {
    const total = mediaItems.length || seo?.mediaSeo?.summary?.totalMedia || 0;
    const missingAlt = mediaItems.length
      ? mediaItems.filter((item) => !item.altText.trim()).length
      : seo?.mediaSeo?.summary?.missingAltText || 0;
    const duplicateAlt = mediaItems.length
      ? mediaItems.filter((item) => item.isDuplicateAlt).length
      : seo?.mediaSeo?.summary?.duplicateAltText || 0;
    const optimized = mediaItems.length
      ? mediaItems.filter((item) => item.isOptimized).length
      : seo?.mediaSeo?.summary?.optimizedMedia || 0;

    return { total, missingAlt, duplicateAlt, optimized };
  }, [mediaItems, seo]);

  const score = seo?.seoScoreBreakdown?.overallScore ?? 0;
  const localScore = Math.round(
    ([isUrlAdded, isTitleAdded, isDescriptionAdded, isTitleLengthGood, isDescriptionLengthGood].filter(Boolean).length / 5) * 100,
  );
  const displayScore = score || localScore;
  const seoFactors =
    seo?.seoScoreBreakdown?.factors?.length
      ? seo.seoScoreBreakdown.factors
      : fallbackFactors(
          displayScore,
          isTitleLengthGood,
          isDescriptionLengthGood,
          isUrlAdded,
          isDescriptionAdded,
          mediaSummary.missingAlt > 0,
        );
  const passedFactorCount = seoFactors.filter(factorIsFixed).length;
  const issueFactorCount = seoFactors.filter(factorIsIssue).length;
  const optionalFactorCount = seoFactors.filter((factor) => String(factor.status || "").toUpperCase() === "OPTIONAL").length;
  const seoFactorGroups = useMemo(() => groupSeoFactors(seoFactors), [seoFactors]);
  const nextBestFactor = seoFactors.find(factorIsIssue) || seoFactors.find((factor) => String(factor.status || "").toUpperCase() === "OPTIONAL");
  const validFaqItems = faqItems.filter((faq) => faq.question.trim() && faq.answer.trim());

  const seoHealthLabel =
    displayScore >= 85 ? "Excellent" : displayScore >= 70 ? "Good" : displayScore >= 50 ? "Needs Work" : "Critical";
  const liveRedirectSuggestion = pendingRedirectSuggestion || buildCategoryRedirectSuggestion();

  async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin token missing hai. Please login again.");
    }

    const requestBody = typeof options?.body === "string" ? options.body : undefined;

    const response = await fetch(`/api/proxy${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const debugPayload = {
        path,
        method: options?.method || "GET",
        status: response.status,
        statusText: response.statusText,
        requestBody: requestBody
          ? (() => {
              try {
                return JSON.parse(requestBody);
              } catch {
                return requestBody;
              }
            })()
          : null,
        responseBody: data,
      };

      console.warn("CATEGORY SEO API ERROR DEBUG:", debugPayload);

      throw new Error(
        [
          `${path} failed: ${response.status} ${response.statusText}`,
          `Request Body: ${JSON.stringify(debugPayload.requestBody, null, 2)}`,
          `Response Body: ${JSON.stringify(debugPayload.responseBody, null, 2)}`,
        ].join("\n\n"),
      );
    }

    return data as T;
  }


  function hydrateFromPayload(categoryRecord: CategoryMaster, seoRecord: CategorySeoRecord) {
    const title = firstText(seoRecord.content?.title, categoryRecord.title, categoryRecord.name, seoRecord.categoryName, "Category");
    const description = firstText(
      seoRecord.content?.description,
      seoRecord.seoIntroContent,
      categoryRecord.description,
      "",
    );
    const shortDescription = firstText(
      seoRecord.content?.shortDescription,
      categoryRecord.shortDescription,
      stripHtml(description).slice(0, 180),
    );
    const slug = firstText(seoRecord.searchMetadata?.slug, seoRecord.slug, categoryRecord.slug, defaultSlug);
    const canonicalUrl = getCanonicalUrlFromHandle(
      firstText(
        categoryRecord.publicUrl,
        seoRecord.searchMetadata?.canonicalUrl,
        seoRecord.canonicalUrl,
        getCanonicalUrlFromHandle(slug, slug),
      ),
      slug,
    );
    setOriginalCategoryPath(getCurrentCategoryPath(categoryRecord, seoRecord, slug));

    const backendOldPath = getSaveResponseOldCategoryPath({ category: categoryRecord, seo: seoRecord });
    const backendNewPath =
      getSaveResponseNewCategoryPath({ category: categoryRecord, seo: seoRecord }) ||
      getCurrentCategoryPath(categoryRecord, seoRecord, slug);

    if (pathsAreDifferent(backendOldPath, backendNewPath)) {
      setPendingRedirectSuggestion({
        sourcePath: backendOldPath,
        destinationPath: backendNewPath,
      });
    }

    const seoTitle = firstText(seoRecord.searchMetadata?.seoTitle, seoRecord.seoTitle, title);
    const metaDescription = firstText(
      seoRecord.searchMetadata?.metaDescription,
      seoRecord.metaDescription,
      shortDescription,
      stripHtml(description),
    );
    const faqSource = seoRecord.faqBuilder?.faqs?.length
      ? seoRecord.faqBuilder.faqs
      : seoRecord.faq || [];

    setForm({
      categoryName: title,
      categoryDescription: description,
      shortDescription,
      primaryKeyword: seoRecord.searchMetadata?.primaryKeyword || seoRecord.primaryKeyword || "",
      secondaryKeywords: arrayToText(seoRecord.searchMetadata?.secondaryKeywords || seoRecord.secondaryKeywords),
      seoTitle,
      metaDescription,
      slug,
      canonicalUrl,
      faqEnabled: typeof seoRecord.faqBuilder?.enabled === "boolean" ? seoRecord.faqBuilder.enabled : false,
      indexable:
        typeof seoRecord.publishing?.indexable === "boolean"
          ? seoRecord.publishing.indexable
          : typeof seoRecord.indexable === "boolean"
            ? seoRecord.indexable
            : true,
      followLinks:
        typeof seoRecord.publishing?.followLinks === "boolean"
          ? seoRecord.publishing.followLinks
          : typeof seoRecord.followLinks === "boolean"
            ? seoRecord.followLinks
            : true,
      includeInSitemap:
        typeof seoRecord.publishing?.includeInSitemap === "boolean"
          ? seoRecord.publishing.includeInSitemap
          : typeof seoRecord.includeInSitemap === "boolean"
            ? seoRecord.includeInSitemap
            : true,
    });

    setFaqItems(
      faqSource.length
        ? faqSource.map((faq, index) => ({
            id: faq.id || `faq-${index + 1}`,
            question: faq.question || "",
            answer: faq.answer || "",
            sortOrder: faq.sortOrder ?? index + 1,
            isOpen: index === 0,
          }))
        : [
            {
              id: "faq-1",
              question: "",
              answer: "",
              sortOrder: 1,
              isOpen: true,
            },
          ],
    );

    const detailMedia = normalizeMediaResponse(seoRecord.mediaSeo?.media || categoryRecord.media || []);
    const nextMedia = applyCategoryMediaOptimizationCache(
      pickSingleCategoryImage(detailMedia, categoryRecord),
      categoryId,
    );

    if (nextMedia.length) writeCategoryMediaOptimizationCache(categoryId, nextMedia);
    setMediaItems(nextMedia);
    setSelectedMediaKey(nextMedia[0]?.uniqueKey || null);
  }

  async function loadCategoryMedia(fallbackSeo?: CategorySeoRecord | null, fallbackCategory?: CategoryMaster | null) {
    const fallbackMedia = normalizeMediaResponse(fallbackSeo?.mediaSeo?.media || fallbackCategory?.media || []);

    try {
      const response = await apiRequest<CategoryMediaResponse>(`/admin/seo/categories/${categoryId}/media`);
      const normalized = normalizeMediaResponse(response);

      const singleImage = applyCategoryMediaOptimizationCache(
        pickSingleCategoryImage([...normalized, ...fallbackMedia], fallbackCategory),
        categoryId,
      );

      if (singleImage.length) {
        writeCategoryMediaOptimizationCache(categoryId, singleImage);
        setMediaItems(singleImage);
        setSelectedMediaKey((prev) => (prev && singleImage.some((item) => item.uniqueKey === prev) ? prev : singleImage[0]?.uniqueKey || null));
        return;
      }
    } catch {
      // Detail response media fallback is enough for first render.
    }

    const nextMedia = applyCategoryMediaOptimizationCache(
      pickSingleCategoryImage(fallbackMedia, fallbackCategory),
      categoryId,
    );

    if (nextMedia.length) writeCategoryMediaOptimizationCache(categoryId, nextMedia);
    setMediaItems(nextMedia);
    setSelectedMediaKey((prev) => (prev && nextMedia.some((item) => item.uniqueKey === prev) ? prev : nextMedia[0]?.uniqueKey || null));
  }

  async function loadCategorySeo() {
    try {
      setIsLoading(true);
      setError(null);
      setNotice(null);

      const response = await apiRequest<CategorySeoDetailResponse>(`/admin/seo/categories/${categoryId}`);
      const payload = getDetailPayload(response);

      if (!payload.category || !payload.seo) {
        throw new Error("Category SEO detail response me category/seo missing hai.");
      }

      setCategory(payload.category);
      setSeo(payload.seo);
      hydrateFromPayload(payload.category, payload.seo);
      await loadCategoryMedia(payload.seo, payload.category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category SEO detail load failed.");
      setCategory(null);
      setSeo(null);
      setMediaItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategorySeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!selectedMedia) {
      setMediaDraft({ altText: "" });
      return;
    }

    setMediaDraft({ altText: selectedMedia.altText || "" });
  }, [selectedMedia]);

  function handleUrlHandleChange(value: string) {
    const nextSlug = getSlugFromUrlOrHandle(value);

    setPendingRedirectSuggestion(null);
    setForm((prev) => ({
      ...prev,
      slug: nextSlug,
      canonicalUrl: value,
    }));
  }

  function buildFaqSaveBody() {
    const validFaqs = faqItems
      .filter((faq) => faq.question.trim() && faq.answer.trim())
      .map((faq, index) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        sortOrder: index + 1,
      }));

    return {
      enabled: form.faqEnabled,
      faqs: validFaqs,
    };
  }

  function buildSaveBody() {
    const cleanedPath = getSlugFromUrlOrHandle(
      form.canonicalUrl || form.slug || category?.slug || defaultSlug,
    );
    const cleanedSlug = getLeafCategorySlug(cleanedPath);
    const categoryName = form.categoryName.trim();
    const descriptionHtml = form.categoryDescription.trim();
    const cleanMetaDescription = stripHtml(form.metaDescription).trim();
    const currentPath = normalizeCategoryPath(form.canonicalUrl || form.slug || defaultSlug);
    const previousPath =
      originalCategoryPath ||
      getCurrentCategoryPath(category, seo, category?.slug || seo?.slug || defaultSlug);
    const hasUrlChanged = pathsAreDifferent(previousPath, currentPath);

    const saveBody: Record<string, unknown> = {
      seoTitle: form.seoTitle.trim() || categoryName,
      metaDescription: cleanMetaDescription,
      primaryKeyword: form.primaryKeyword.trim(),
      secondaryKeywords: textToArray(form.secondaryKeywords),
      seoIntroContent: descriptionHtml,
      buyingGuide: seo?.buyingGuide || "",
      indexable: form.indexable,
      followLinks: form.followLinks,
      includeInSearch: true,
      includeInSitemap: form.includeInSitemap,
      categoryName,
    };

    // Do not send slug/canonicalUrl when the URL has not changed.
    // Otherwise backend duplicate-slug auto-resolution can keep creating -1, -2, -3 on normal saves.
    if (hasUrlChanged) {
      // Send only the leaf category slug to backend/catalog.
      // Full category path stays in canonicalUrl. Sending full path as slug makes backend combine
      // the parent path again, e.g. /bridesmaid-dresses/bridesmaid-dresses-pajamas-and-robe.
      saveBody.slug = cleanedSlug;
      saveBody.canonicalUrl = getCanonicalUrlFromHandle(currentPath, currentPath || defaultSlug);
    }

    return saveBody;
  }

  function buildCategoryRedirectSuggestion(): CategoryRedirectSuggestion | null {
    const currentPath = normalizeCategoryPath(form.canonicalUrl || form.slug || defaultSlug);
    const previousPath =
      originalCategoryPath ||
      getCurrentCategoryPath(category, seo, category?.slug || seo?.slug || defaultSlug);

    if (!pathsAreDifferent(previousPath, currentPath)) return null;

    return {
      sourcePath: previousPath,
      destinationPath: currentPath,
    };
  }

  async function createCategoryRedirect(redirectSuggestion: CategoryRedirectSuggestion) {
    const response = await apiRequest<CategoryRedirectCreateResponse>(`/admin/seo/redirects`, {
      method: "POST",
      body: JSON.stringify({
        sourceUrl: redirectSuggestion.sourcePath,
        destinationUrl: redirectSuggestion.destinationPath,
        redirectType: "PERMANENT_301",
        status: "ACTIVE",
        type: "CATEGORY_URL",
        notes: "Auto-created from Category SEO slug change.",
      }),
    });

    const requestedDestinationPath = getRequestedDestinationPath(response);
    const finalDestinationPath = normalizeCategoryPath(
      firstText(response.destinationUrl, getSaveResponseNewCategoryPath(response), redirectSuggestion.destinationPath),
    );

    return {
      ...redirectSuggestion,
      requestedDestinationPath: requestedDestinationPath || redirectSuggestion.destinationPath,
      finalDestinationPath: finalDestinationPath || redirectSuggestion.destinationPath,
    };
  }

  async function updateCatalogCategoryPathIfNeeded(requestedPath: string) {
    const normalizedRequestedPath = normalizeCategoryPath(requestedPath);

    if (!normalizedRequestedPath) return "";

    const stableCategoryKey = category?.id || categoryId;
    const categoryName =
      form.categoryName.trim() ||
      category?.name ||
      category?.title ||
      "Category";

    const requestedLeafSlug = getLeafCategorySlug(normalizedRequestedPath);

    const response = await apiRequest<unknown>(`/admin/catalog/categories/${encodeURIComponent(stableCategoryKey)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: categoryName,
        // Catalog category slug must be the leaf slug only, not the complete nested path.
        // Parent path is already known by the category relation in backend.
        slug: requestedLeafSlug,
      }),
    });

    return getCatalogCategoryFinalPath(response, normalizedRequestedPath);
  }



  async function saveFaqs() {
    await apiRequest(`/admin/seo/categories/${categoryId}/faqs`, {
      method: "PATCH",
      body: JSON.stringify(buildFaqSaveBody()),
    });
  }


  async function saveSeo(options: { createRedirect?: boolean } = {}) {
    const redirectSuggestion = buildCategoryRedirectSuggestion();
    const shouldCreateRedirect = options.createRedirect ?? createRedirectOnSave;

    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const response = await apiRequest<CategorySeoDetailResponse>(`/admin/seo/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify(buildSaveBody()),
      });

      await saveFaqs();

      const payload = getDetailPayload(response);
      const oldPathFromResponse = getSaveResponseOldCategoryPath(response);
      let newPathFromResponse =
        getSaveResponseNewCategoryPath(response) ||
        getCurrentCategoryPath(payload.category || category, payload.seo || seo, form.slug || defaultSlug);

      let catalogSyncNotice = "";

      // If the URL was changed from this page but the SEO PATCH response still resolves to the old path,
      // also sync the master catalog category slug. This keeps Category SEO and Admin Catalog Categories aligned.
      if (
        redirectSuggestion &&
        pathsAreDifferent(redirectSuggestion.sourcePath, redirectSuggestion.destinationPath) &&
        (!newPathFromResponse || !pathsAreDifferent(redirectSuggestion.sourcePath, newPathFromResponse))
      ) {
        const catalogFinalPath = await updateCatalogCategoryPathIfNeeded(redirectSuggestion.destinationPath);

        if (catalogFinalPath) {
          newPathFromResponse = catalogFinalPath;
          catalogSyncNotice = ` Category master URL synced to ${catalogFinalPath}.`;

          await apiRequest<CategorySeoDetailResponse>(`/admin/seo/categories/${categoryId}`, {
            method: "PATCH",
            body: JSON.stringify({
              ...buildSaveBody(),
              slug: catalogFinalPath.replace(/^\//, ""),
              canonicalUrl: getCanonicalUrlFromHandle(catalogFinalPath, catalogFinalPath),
            }),
          });
        }
      }

      const finalRedirectSuggestion = redirectSuggestion
        ? {
            ...redirectSuggestion,
            sourcePath: oldPathFromResponse || redirectSuggestion.sourcePath,
            destinationPath: newPathFromResponse || redirectSuggestion.destinationPath,
          }
        : null;

      let redirectNotice = "";

      if (shouldCreateRedirect && finalRedirectSuggestion && pathsAreDifferent(finalRedirectSuggestion.sourcePath, finalRedirectSuggestion.destinationPath)) {
        const redirectResult = await createCategoryRedirect(finalRedirectSuggestion);
        redirectNotice = ` Redirect created: ${redirectResult.sourcePath} → ${redirectResult.finalDestinationPath || redirectResult.destinationPath}.`;
      }

      if (payload.category) setCategory(payload.category);
      if (payload.seo) {
        setSeo(payload.seo);
        if (payload.category) hydrateFromPayload(payload.category, payload.seo);
      }

      if (newPathFromResponse) {
        setOriginalCategoryPath(normalizeCategoryPath(newPathFromResponse));
        setForm((prev) => ({
          ...prev,
          slug: normalizeCategoryPath(newPathFromResponse).replace(/^\//, ""),
          canonicalUrl: getCanonicalUrlFromHandle(newPathFromResponse, newPathFromResponse),
        }));
      }

      await loadCategorySeo();
      setPendingRedirectSuggestion(null);
      setCreateRedirectOnSave(true);

      const requestedPath = redirectSuggestion?.destinationPath || "";
      const finalSavedPath = newPathFromResponse || requestedPath;
      const duplicateNotice =
        requestedPath && finalSavedPath && requestedPath !== finalSavedPath
          ? ` Backend adjusted duplicate category path to ${finalSavedPath}.`
          : "";

      const skippedRedirectNotice =
        redirectSuggestion && !shouldCreateRedirect
          ? " Redirect was not created."
          : "";

      setNotice(`Category SEO saved successfully.${redirectNotice}${skippedRedirectNotice}${duplicateNotice}${catalogSyncNotice}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category SEO save failed.");
    } finally {
      setIsSaving(false);
    }
  }




  async function uploadCategoryImage() {
    const altText = newMediaDraft.altText.trim();

    if (!selectedCategoryImageFile) {
      setError("Category image upload karne ke liye image file select karo.");
      return;
    }

    try {
      setActionLoading("upload-image");
      setError(null);
      setNotice(null);

      const token = getAdminToken();
      if (!token) throw new Error("Admin token missing hai. Please login again.");

      const formData = new FormData();
      formData.append("image", selectedCategoryImageFile);
      if (altText) formData.append("altText", altText);

      const response = await fetch(`/api/proxy/admin/catalog/categories/${encodeURIComponent(categoryCatalogKey)}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data: unknown = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        throw new Error(
          [
            `/admin/catalog/categories/${categoryCatalogKey}/image failed: ${response.status} ${response.statusText}`,
            `Response Body: ${JSON.stringify(data, null, 2)}`,
          ].join("\n\n"),
        );
      }

      setSelectedCategoryImageFile(null);
      setNewMediaDraft({ altText: "" });
      setIsAddMediaOpen(false);
      await loadCategorySeo();
      setNotice("Category image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category image upload failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function saveSelectedMediaSeo() {
    if (!selectedMedia) return;

    try {
      setIsMediaSaving(true);
      setError(null);
      setNotice(null);

      const nextAltText = mediaDraft.altText.trim();

      const currentCategoryName =
        form.categoryName.trim() ||
        category?.name ||
        category?.title ||
        "Category";

      const currentCategorySlug =
        getSlugFromUrlOrHandle(form.slug || category?.slug || categoryCatalogKey) ||
        categoryCatalogKey;

      await apiRequest(`/admin/catalog/categories/${encodeURIComponent(categoryCatalogKey)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: currentCategoryName,
          slug: currentCategorySlug,
          imageAltText: nextAltText,
          imageUrl: selectedMedia.optimizedUrl || selectedMedia.url,
        }),
      });

      try {
        await apiRequest(`/admin/seo/categories/${categoryId}/media/${encodeURIComponent(selectedMedia.id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            altText: nextAltText,
          }),
        });
      } catch {
        // Catalog category image alt text is the source of truth for category image SEO.
      }

      setMediaItems((prev) =>
        markDuplicateAltText(
          prev.map((item) =>
            item.uniqueKey === selectedMedia.uniqueKey
              ? {
                  ...item,
                  altText: nextAltText,
                  isMissingAlt: !nextAltText,
                }
              : item,
          ),
        ),
      );

      setNotice("Category image alt text saved successfully.");
      await loadCategorySeo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category image alt text save failed.");
    } finally {
      setIsMediaSaving(false);
    }
  }




  async function optimizeCategoryImage(mode: "SIZE" | "ALT_TEXT") {
    const mediaIds = selectedMedia?.id ? [selectedMedia.id] : mediaItems.map((item) => item.id).filter(Boolean);

    if (!mediaIds.length) {
      setError("Optimize karne ke liye category image available nahi hai.");
      return;
    }

    try {
      setActionLoading(mode === "SIZE" ? "optimize-size" : "optimize-alt");
      setError(null);
      setNotice(null);

      const optimizeResponse = await apiRequest<unknown>(`/admin/seo/categories/${categoryId}/media/optimize`, {
        method: "POST",
        body: JSON.stringify({
          mode,
          mediaIds,
          generateAltText: mode === "ALT_TEXT",
          compressLargeMedia: mode === "SIZE",
          convertToWebp: mode === "SIZE",
          overwriteExisting: true,
          dryRun: false,
        }),
      });

      const optimizedMedia = pickSingleCategoryImage(
        [...normalizeMediaResponse(optimizeResponse), ...mediaItems],
        category,
      );
      if (optimizedMedia.length) {
        writeCategoryMediaOptimizationCache(categoryId, optimizedMedia);
        setMediaItems(applyCategoryMediaOptimizationCache(optimizedMedia, categoryId));
        setSelectedMediaKey(optimizedMedia[0]?.uniqueKey || null);
      }

      await loadCategorySeo();
      setNotice(
        mode === "SIZE"
          ? "Category image size optimization requested successfully."
          : "Category image alt text optimized successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category image optimization failed.");
    } finally {
      setActionLoading(null);
    }
  }



  async function deleteCategoryImage() {
    if (!selectedMedia) {
      setError("Delete karne ke liye category image available nahi hai.");
      return;
    }

    const shouldDelete = window.confirm("Delete this category image?");
    if (!shouldDelete) return;

    try {
      setActionLoading("delete-image");
      setError(null);
      setNotice(null);

      const mediaId = selectedMedia.mediaId || selectedMedia.id;

      await apiRequest(`/admin/seo/categories/${categoryId}/media/${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
      });

      setMediaItems([]);
      setSelectedMediaKey(null);
      setMediaDraft({ altText: "" });

      await loadCategorySeo();
      setNotice("Category image deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category image delete failed.");
    } finally {
      setActionLoading(null);
    }
  }



  function addFaqItem() {
    setFaqItems((prev) => [
      ...prev.map((faq) => ({ ...faq, isOpen: false })),
      {
        id: `faq-${Date.now()}`,
        question: "",
        answer: "",
        sortOrder: prev.length + 1,
        isOpen: true,
      },
    ]);
    setForm((prev) => ({ ...prev, faqEnabled: true }));
  }

  function updateFaqItem(id: string, field: "question" | "answer", value: string) {
    setFaqItems((prev) => prev.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)));
  }

  function deleteFaqItem(id: string) {
    setFaqItems((prev) => prev.filter((faq) => faq.id !== id).map((faq, index) => ({ ...faq, sortOrder: index + 1 })));
  }

  function toggleFaqOpen(id: string) {
    setFaqItems((prev) => prev.map((faq) => ({ ...faq, isOpen: faq.id === id ? !faq.isOpen : faq.isOpen })));
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-[1180px]">
          <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-8 text-center">
            <p className="font-medium text-neutral-950">Loading Category SEO editor...</p>
            <p className="mt-2 text-sm text-neutral-500">Category SEO data backend se aa raha hai.</p>
          </Card>
        </div>
      </main>
    );
  }

  if (error && (!category || !seo)) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-[1180px]">
          <Button asChild variant="outline" className="mb-5 rounded-full">
            <Link href="/admin/seo/categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Category SEO
            </Link>
          </Button>

          <Card className="rounded-[1.5rem] border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">Category SEO detail load nahi hua.</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-red-600">{error}</p>
            <Button className="mt-5 rounded-full" onClick={loadCategorySeo}>
              Retry
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f3] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="sticky top-0 z-40 -mx-4 mb-5 border-b border-neutral-200 bg-[#f6f6f3]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/admin/seo/categories">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                  Category SEO Workspace
                </p>
                <h1 className="truncate text-xl font-semibold text-neutral-950">
                  {form.categoryName || category?.name || "Category"}
                </h1>
              </div>
            </div>

            <Button className="rounded-xl bg-neutral-950" onClick={() => saveSeo()} disabled={isSaving || actionLoading !== null}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Category SEO error</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-5">
            <Card id="overview" className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {primaryMedia?.url || category?.image ? (
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                    <MediaPreview media={primaryMedia || { id: "image", uniqueKey: "image", url: category?.image || "", type: "image", name: form.categoryName, altText: form.categoryName }} compact />
                  </div>
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400">
                    <FolderTree className="h-6 w-6" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-neutral-100 text-neutral-700">Category</Badge>
                    <Badge className="bg-neutral-100 text-neutral-700">{category?.status || "Category"}</Badge>
                    {typeof category?.productCount === "number" ? (
                      <Badge className="bg-neutral-100 text-neutral-700">{category.productCount} products</Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-neutral-950">
                    {form.categoryName || category?.name || "Category"}
                  </h2>
                  <p className="mt-1 break-all text-xs text-neutral-500">Category ID: {categoryId}</p>
                  {category?.fullPath ? (
                    <p className="mt-1 text-xs text-neutral-500">{category.fullPath}</p>
                  ) : null}
                </div>
              </div>
            </Card>

            <SectionCard title="Primary keyword" description="Add the focus keyword for this category." compact>
              <Input
                value={form.primaryKeyword}
                onChange={(event) => setForm((prev) => ({ ...prev, primaryKeyword: event.target.value }))}
                className={inputClassName}
                placeholder="Example: dresses for women"
              />
            </SectionCard>

            <SectionCard title="Main content" description="Edit category title and category description.">
              <div className="space-y-5">
                <Field label="Title">
                  <Input
                    value={form.categoryName}
                    onChange={(event) => setForm((prev) => ({ ...prev, categoryName: event.target.value }))}
                    className={inputClassName}
                    placeholder="Category title"
                  />
                </Field>

                <div className="block min-w-0">
                  <p className="mb-2 text-sm font-medium text-neutral-950">Description</p>
                  <RichTextEditor
                    value={form.categoryDescription}
                    onChange={(html) => setForm((prev) => ({ ...prev, categoryDescription: html }))}
                    productId={categoryId}
                    minHeightClass="min-h-[320px]"
                    maxHeightClass="max-h-[520px]"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Meta tags" description="Google preview, custom meta data, URL handle and URL analysis.">
              <div className="space-y-5">
                <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-none">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-950">Google preview</p>
                    <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          previewDevice === "mobile" ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-white"
                        }`}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          previewDevice === "desktop" ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-white"
                        }`}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-2xl border border-neutral-200 bg-white p-4 transition-all ${previewDevice === "mobile" ? "max-w-[390px]" : "w-full"}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-500">
                        S
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm leading-5 text-neutral-800">Shahsi</p>
                        <p className="line-clamp-1 text-xs leading-5 text-neutral-500">
                          {previewDomain} › {previewPath}
                        </p>
                      </div>
                    </div>

                    <p className={`mt-3 line-clamp-2 font-medium leading-6 text-[#1a0dab] ${previewDevice === "mobile" ? "text-lg" : "text-xl"}`}>
                      {previewTitle || "SEO title preview"}
                    </p>
                    <p className={`mt-1 text-sm leading-6 text-[#4d5156] ${previewDevice === "mobile" ? "line-clamp-3" : "line-clamp-2"}`}>
                      {previewDescription}
                    </p>
                  </div>
                </Card>

                <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-neutral-950">Custom meta data</p>
                        <button
                          type="button"
                          onClick={() => setCustomMetaEnabled((prev) => !prev)}
                          className={`relative h-6 w-11 rounded-full transition ${customMetaEnabled ? "bg-neutral-950" : "bg-neutral-300"}`}
                          aria-label="Toggle custom meta data"
                        >
                          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${customMetaEnabled ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        When enabled, custom meta data will override generated meta tag settings.
                      </p>
                    </div>
                  </div>

                  {customMetaEnabled ? (
                    <div className="mt-5 space-y-5">
                      <Field label={`Meta title (${titleCount}/${META_TITLE_MAX})`}>
                        <Input
                          value={form.seoTitle}
                          onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
                          className={inputClassName}
                          placeholder="Dresses for Women | Shahsi"
                        />
                        <Helper good={titleCount >= META_TITLE_MIN && titleCount <= META_TITLE_MAX}>
                          Recommended length: {META_TITLE_MIN}-{META_TITLE_MAX} characters.
                        </Helper>
                      </Field>

                      <Field label={`Meta description (${metaCount}/${META_DESCRIPTION_MAX})`}>
                        <Textarea
                          value={form.metaDescription}
                          onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
                          className={textareaClassName}
                          placeholder="Shop curated dresses for women at Shahsi..."
                        />
                        <Helper good={metaCount >= META_DESCRIPTION_MIN && metaCount <= META_DESCRIPTION_MAX}>
                          Recommended length: {META_DESCRIPTION_MIN}-{META_DESCRIPTION_MAX} characters.
                        </Helper>
                      </Field>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <Field label="URL handle">
                      <Input
                        value={urlHandleInputValue}
                        onChange={(event) => handleUrlHandleChange(event.target.value)}
                        onBlur={() => {
                          const nextSlug = getSlugFromUrlOrHandle(form.canonicalUrl || form.slug || categoryId);
                          setForm((prev) => ({
                            ...prev,
                            slug: nextSlug,
                            canonicalUrl: prev.canonicalUrl.trim()
                              ? getCanonicalUrlFromHandle(prev.canonicalUrl, nextSlug || categoryId)
                              : prev.canonicalUrl,
                          }));
                        }}
                        className={inputClassName}
                        placeholder={`${PUBLIC_FRONTEND_URL}/bridesmaid-dresses/pajamas-and-robes/all-intimates`}
                      />
                    </Field>

                    {liveRedirectSuggestion ? (
                      <Card className="mt-3 rounded-2xl border-amber-200 bg-amber-50 p-4 shadow-none">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-amber-900">Category URL changed</p>
                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            This category URL has changed. Tick the checkbox below if you want to create a 301 redirect from the old URL to the new URL when saving.
                          </p>
                          <div className="mt-3 grid gap-2 text-xs text-amber-800 sm:grid-cols-2">
                            <div className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                              <span className="block font-semibold uppercase tracking-[0.12em] text-amber-600">Old URL</span>
                              <span className="mt-1 block break-all">{getCanonicalUrlFromHandle(liveRedirectSuggestion.sourcePath, liveRedirectSuggestion.sourcePath)}</span>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
                              <span className="block font-semibold uppercase tracking-[0.12em] text-amber-600">New URL</span>
                              <span className="mt-1 block break-all">{getCanonicalUrlFromHandle(liveRedirectSuggestion.destinationPath, liveRedirectSuggestion.destinationPath)}</span>
                            </div>
                          </div>
                          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white/80 px-3 py-3 text-sm text-amber-900">
                            <input
                              type="checkbox"
                              checked={createRedirectOnSave}
                              onChange={(event) => setCreateRedirectOnSave(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-neutral-950 focus:ring-neutral-950"
                            />
                            <span>
                              <span className="block font-semibold">Create redirect on save</span>
                              <span className="mt-1 block text-xs leading-5 text-amber-700">
                                If checked, saving will create: {liveRedirectSuggestion.sourcePath} → {liveRedirectSuggestion.destinationPath}
                              </span>
                            </span>
                          </label>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">SEO checks</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        These checks update live from title, description and URL handle.
                      </p>
                    </div>
                    <Badge className="bg-white text-neutral-700">
                      {[isUrlAdded, isTitleAdded, isDescriptionAdded, isTitleLengthGood, isDescriptionLengthGood].filter(Boolean).length}/5 fixed
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <AnalysisCheck good={isUrlAdded} title="URL added" description={isUrlAdded ? "URL handle is connected." : "Add a URL handle for this category."} />
                    <AnalysisCheck good={isTitleAdded} title="Title added" description={isTitleAdded ? "Meta title is available." : "Add a meta title for search preview."} />
                    <AnalysisCheck good={isDescriptionAdded} title="Description added" description={isDescriptionAdded ? "Meta description is available." : "Add a meta description for search results."} />
                    <AnalysisCheck good={isTitleLengthGood} title="Title length" description={`${titleCount}/${META_TITLE_MAX} characters. Recommended ${META_TITLE_MIN}-${META_TITLE_MAX}.`} />
                    <AnalysisCheck good={isDescriptionLengthGood} title="Description length" description={`${metaCount}/${META_DESCRIPTION_MAX} characters. Recommended ${META_DESCRIPTION_MIN}-${META_DESCRIPTION_MAX}.`} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Media" description="Optimize category image to improve page speed and SEO.">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <MiniStat label="Total Media" value={mediaItems.length ? 1 : 0} />
                  <MiniStat label="Missing Alt" value={selectedMedia?.altText?.trim() ? 0 : mediaItems.length ? 1 : 0} />
                  <MiniStat label="Duplicate Alt" value={0} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl bg-white"
                    onClick={() => setIsAddMediaOpen((prev) => !prev)}
                    disabled={actionLoading !== null}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Media
                  </Button>

                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl bg-white"
                      onClick={() => setIsOptimizeMenuOpen((prev) => !prev)}
                      disabled={actionLoading !== null || !mediaItems.length}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {actionLoading === "optimize-size" || actionLoading === "optimize-alt" ? "Optimizing..." : "Optimize all"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>

                    {isOptimizeMenuOpen ? (
                      <Card className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border-neutral-200 bg-white p-3 shadow-xl">
                        <button
                          type="button"
                          className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-neutral-50"
                          onClick={() => {
                            setIsOptimizeMenuOpen(false);
                            optimizeCategoryImage("SIZE");
                          }}
                        >
                          <p className="text-sm font-semibold text-neutral-950">Optimize image size</p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            Compress and convert the category image to WebP when backend support is available.
                          </p>
                        </button>
                        <button
                          type="button"
                          className="mt-1 w-full rounded-xl px-3 py-3 text-left transition hover:bg-neutral-50"
                          onClick={() => {
                            setIsOptimizeMenuOpen(false);
                            optimizeCategoryImage("ALT_TEXT");
                          }}
                        >
                          <p className="text-sm font-semibold text-neutral-950">Optimize media alt</p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">Generate or improve missing category image alt text.</p>
                        </button>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </div>

              {isAddMediaOpen ? (
                <Card className="mb-5 rounded-3xl border-neutral-200 bg-[#fbfaf6] p-4 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">Upload / replace category image</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Category SEO supports only one catalog category image. Uploading here replaces the current image and keeps Admin Catalog Categories synced.
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => setIsAddMediaOpen(false)}>
                      Close
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Field label="Image file">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setSelectedCategoryImageFile(event.target.files?.[0] || null)}
                        className="h-11 w-full rounded-xl border-neutral-200 bg-white text-sm file:mr-4 file:h-full file:border-0 file:bg-neutral-950 file:px-4 file:text-sm file:font-medium file:text-white"
                      />
                    </Field>
                    <Field label="Alt text">
                      <Input
                        value={newMediaDraft.altText}
                        onChange={(event) => setNewMediaDraft((prev) => ({ ...prev, altText: event.target.value }))}
                        className={inputClassName}
                        placeholder="Describe the category image"
                      />
                    </Field>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="rounded-xl bg-neutral-950" type="button" onClick={uploadCategoryImage} disabled={actionLoading !== null}>
                      <Plus className="mr-2 h-4 w-4" />
                      {actionLoading === "upload-image" ? "Uploading..." : "Upload / replace image"}
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => setIsAddMediaOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              ) : null}

              {selectedMedia ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      <span>Media</span>
                      <span>Details</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMediaKey(selectedMedia.uniqueKey)}
                      className="grid w-full cursor-pointer grid-cols-[96px_minmax(0,1fr)] items-center gap-4 px-4 py-4 text-left transition hover:bg-neutral-50"
                    >
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 p-1.5">
                        <MediaPreview media={selectedMedia} compact />
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="rounded-xl border border-neutral-100 bg-[#fbfaf6] px-3 py-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Category image</p>
                            <Badge className="bg-white text-neutral-700">Image</Badge>
                            {selectedMedia.isOptimized ? <Badge className="bg-emerald-50 text-emerald-700">Optimized</Badge> : null}
                          </div>
                          <p className="whitespace-normal break-words text-sm leading-5 text-neutral-800">
                            {form.categoryName || category?.name || "Category image"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-100 bg-[#fbfaf6] px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Alt text</p>
                          <p className="mt-1 whitespace-normal break-words text-sm leading-5 text-neutral-800">
                            {selectedMedia.altText || "Alt text missing"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <Card className="mt-5 rounded-3xl border-neutral-200 bg-[#fbfaf6] p-4 shadow-none">
                    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                      <div>
                        <div className="flex h-72 items-center justify-center overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 p-4">
                          <MediaPreview media={selectedMedia} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge className="bg-white text-neutral-700">Image preview</Badge>
                          <Badge className="bg-white text-neutral-700">Category image</Badge>
                          {selectedMedia.isOptimized ? <Badge className="bg-emerald-50 text-emerald-700">Optimized</Badge> : <Badge className="bg-amber-50 text-amber-700">Pending</Badge>}
                          {selectedMedia.optimizedUrl || selectedMedia.url.includes(".webp") ? <Badge className="bg-blue-50 text-blue-700">WebP ready</Badge> : null}
                        </div>

                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Size optimization</p>
                            <Badge className={selectedMedia.isOptimized ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                              {selectedMedia.isOptimized ? "Optimized" : "Pending"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <OptimizationMetric label="Original" value={formatFileSize(getOriginalDisplaySize(selectedMedia))} />
                            <OptimizationMetric label="Compressed" value={formatFileSize(getCompressedDisplaySize(selectedMedia))} />
                            <OptimizationMetric
                              label="Saved"
                              value={typeof selectedMedia.reductionPercentage === "number" ? `${Math.round(selectedMedia.reductionPercentage)}%` : "Not available"}
                              emphasized={typeof selectedMedia.reductionPercentage === "number" && selectedMedia.reductionPercentage > 0}
                            />
                          </div>

                          {selectedMedia.optimizationReason ? (
                            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                              {selectedMedia.optimizationReason}
                            </p>
                          ) : null}

                          <p className="mt-3 text-xs leading-5 text-neutral-500">
                            Click Optimize image size to convert this image to compressed WebP.
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">Edit selected media</p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            Category SEO has one image only. Update alt text here; image name is not required.
                          </p>
                        </div>

                        <Field label="Alt text">
                          <Textarea
                            value={mediaDraft.altText}
                            onChange={(event) => setMediaDraft((prev) => ({ ...prev, altText: event.target.value }))}
                            className={textareaClassName}
                            placeholder="Describe this category image clearly for accessibility and SEO"
                          />
                        </Field>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button className="rounded-xl bg-neutral-950" disabled={isMediaSaving || actionLoading !== null} onClick={saveSelectedMediaSeo}>
                            <Save className="mr-2 h-4 w-4" />
                            {isMediaSaving ? "Saving Alt..." : "Save alt text"}
                          </Button>
                          <Button variant="outline" className="rounded-xl bg-white" disabled={actionLoading !== null} onClick={() => optimizeCategoryImage("SIZE")}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {actionLoading === "optimize-size" ? "Optimizing..." : "Optimize image size"}
                          </Button>
                          <Button variant="outline" className="rounded-xl bg-white" disabled={actionLoading !== null} onClick={() => optimizeCategoryImage("ALT_TEXT")}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {actionLoading === "optimize-alt" ? "Generating..." : "Optimize alt text"}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={actionLoading !== null}
                            onClick={deleteCategoryImage}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {actionLoading === "delete-image" ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="rounded-3xl border-dashed border-neutral-300 bg-[#fbfaf6] p-8 text-center shadow-none">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-neutral-400">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-neutral-950">No category image found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                    Upload one category image. This same image will stay synced with the main Admin Catalog Categories module.
                  </p>
                  <Button className="mt-4 rounded-xl bg-neutral-950" type="button" onClick={() => setIsAddMediaOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Media
                  </Button>
                </Card>
              )}
            </SectionCard>

            <SectionCard title="FAQs builder" description="Create category FAQs and preview how they can appear on the category page.">
              <div className={`rounded-3xl border p-4 transition ${form.faqEnabled ? "border-neutral-200 bg-[#fbfaf6]" : "border-dashed border-neutral-300 bg-neutral-50/70"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-950">Enable FAQ builder</p>
                      <Badge className={form.faqEnabled ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}>
                        {form.faqEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {form.faqEnabled ? <Badge className="bg-white text-neutral-700">{validFaqItems.length} valid FAQ</Badge> : null}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                      Turn this on only when you want FAQ content for this category page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, faqEnabled: !prev.faqEnabled }));
                      if (!form.faqEnabled && faqItems.length === 0) addFaqItem();
                    }}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition ${form.faqEnabled ? "bg-neutral-950" : "bg-neutral-300"}`}
                    aria-label="Toggle FAQs"
                  >
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${form.faqEnabled ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {!form.faqEnabled ? (
                <div className="mt-5 rounded-3xl border border-neutral-200 bg-white p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <p className="text-base font-semibold text-neutral-950">FAQ editor is currently hidden</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Enable FAQs to add questions, write answers, and see the Google-style FAQ preview for this category.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <FaqStatusPill label="Schema" value="Off" />
                        <FaqStatusPill label="Valid FAQs" value="0" />
                        <FaqStatusPill label="Preview" value="Hidden" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-[#fbfaf6] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Preview locked</p>
                      <div className="mt-4 space-y-3">
                        <div className="h-3 w-4/5 rounded-full bg-neutral-200" />
                        <div className="h-3 w-3/5 rounded-full bg-neutral-200" />
                        <div className="h-16 rounded-2xl bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-950">Question & Answer</h3>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">Empty rows will not be saved.</p>
                      </div>
                      <Button variant="outline" className="rounded-xl bg-white" type="button" onClick={addFaqItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add question
                      </Button>
                    </div>

                    {faqItems.length ? (
                      <div className="space-y-3">
                        {faqItems.map((faq, index) => {
                          const hasQuestion = Boolean(faq.question.trim());
                          const hasAnswer = Boolean(faq.answer.trim());
                          const isComplete = hasQuestion && hasAnswer;

                          return (
                            <Card key={faq.id} className={`overflow-hidden rounded-2xl border shadow-none transition ${faq.isOpen ? "border-neutral-300 bg-white" : "border-neutral-200 bg-[#fbfaf6]"}`}>
                              <div className="flex items-center justify-between gap-3 p-4">
                                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => toggleFaqOpen(faq.id)}>
                                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {index + 1}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-neutral-950">{faq.question || "Untitled question"}</span>
                                    <span className="mt-1 block text-xs text-neutral-500">
                                      {isComplete ? "Ready for FAQ" : hasQuestion ? "Answer missing" : "Question and answer missing"}
                                    </span>
                                  </span>
                                </button>

                                <div className="flex shrink-0 items-center gap-1">
                                  <Badge className={isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{isComplete ? "Ready" : "Draft"}</Badge>
                                  <Button variant="ghost" size="sm" type="button" onClick={() => toggleFaqOpen(faq.id)} className="rounded-xl">
                                    <ChevronDown className={`h-4 w-4 transition-transform ${faq.isOpen ? "rotate-180" : ""}`} />
                                  </Button>
                                  <Button variant="ghost" size="sm" type="button" onClick={() => deleteFaqItem(faq.id)} className="rounded-xl hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>

                              {faq.isOpen ? (
                                <div className="border-t border-neutral-100 bg-white p-4">
                                  <div className="grid gap-4">
                                    <Field label="Question">
                                      <Input value={faq.question} onChange={(event) => updateFaqItem(faq.id, "question", event.target.value)} className={inputClassName} placeholder="Example: What styles are available in this category?" />
                                    </Field>
                                    <Field label="Answer">
                                      <Textarea value={faq.answer} onChange={(event) => updateFaqItem(faq.id, "answer", event.target.value)} className={textareaClassName} placeholder="Write a clear answer for category visitors." />
                                    </Field>
                                  </div>
                                </div>
                              ) : null}
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-6 text-center">
                        <p className="text-sm font-semibold text-neutral-950">No FAQ questions yet</p>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">Add your first question to start building FAQ content for this category.</p>
                        <Button className="mt-4 rounded-xl bg-neutral-950" type="button" onClick={addFaqItem}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add first FAQ
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="xl:sticky xl:top-28">
                    <Card className="rounded-3xl border-neutral-200 bg-white p-4 shadow-none">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">Google FAQ preview</p>
                          <p className="mt-1 text-xs text-neutral-500">Live preview from valid questions only.</p>
                        </div>
                        <Badge className="bg-neutral-100 text-neutral-700">{validFaqItems.length} item{validFaqItems.length === 1 ? "" : "s"}</Badge>
                      </div>

                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                        <p className="line-clamp-2 text-base font-medium leading-6 text-[#1a0dab]">{previewTitle}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-emerald-700">{effectiveCanonicalUrl}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#4d5156]">{previewDescription}</p>

                        {validFaqItems.length ? (
                          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white">
                            {validFaqItems.map((faq) => (
                              <div key={faq.id} className="border-b border-neutral-100 px-4 py-3 last:border-b-0">
                                <button type="button" onClick={() => toggleFaqOpen(faq.id)} className="flex w-full items-center justify-between gap-3 text-left">
                                  <span className="line-clamp-2 text-sm font-medium leading-5 text-neutral-950">{faq.question}</span>
                                  <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${faq.isOpen ? "rotate-180" : ""}`} />
                                </button>
                                {faq.isOpen ? <p className="mt-3 text-sm leading-6 text-neutral-600">{faq.answer}</p> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card className="rounded-2xl border-neutral-200 bg-white p-5 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-500">Your SEO score</p>
                <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-neutral-100">
                  <div>
                    <p className={`text-5xl font-semibold ${scoreClass(displayScore)}`}>{displayScore}</p>
                    <p className="text-xs text-neutral-400">/100</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
                  <span className="text-red-600">Issues: {issueFactorCount}</span>
                  <span className="text-emerald-700">Passed: {passedFactorCount}</span>
                  {optionalFactorCount ? <span className="text-blue-700">Optional: {optionalFactorCount}</span> : null}
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-500">{seoHealthLabel} · Backend score</p>
              </div>

              <Button className="mt-5 w-full rounded-xl bg-neutral-950" onClick={() => saveSeo()} disabled={isSaving || actionLoading !== null}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save SEO changes"}
              </Button>
            </Card>

            <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-neutral-950">SEO checklist</h3>
                <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={loadCategorySeo}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {seoFactorGroups.length ? seoFactorGroups.map((group) => <IssueGroupCard key={group.label} group={group} />) : <EmptyState text="Save SEO once to load backend checklist." />}
              </div>
            </Card>

            <RobotMetaCard
              indexable={form.indexable}
              followLinks={form.followLinks}
              onIndexableChange={(value) => setForm((prev) => ({ ...prev, indexable: value }))}
              onFollowLinksChange={(value) => setForm((prev) => ({ ...prev, followLinks: value }))}
            />

            <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-950">Next best action</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {seo?.nextBestAction?.message || (nextBestFactor ? `${nextBestFactor.label}: ${nextBestFactor.message}` : "All available SEO ranking checks look good.")}
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionCard({ title, description, children, compact = false }: { title: string; description: string; children: ReactNode; compact?: boolean }) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-neutral-200 bg-white shadow-sm">
      <div className={compact ? "border-b border-neutral-100 px-5 py-3 sm:px-6" : "border-b border-neutral-100 px-5 py-4 sm:px-6"}>
        <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-neutral-500">{description}</p>
      </div>
      <div className={compact ? "px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2" : "p-5 sm:p-6"}>{children}</div>
    </Card>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <p className="mb-2 text-sm font-medium text-neutral-950">{label}</p>
      {children}
    </label>
  );
}

function Helper({ good, children }: { good: boolean; children: ReactNode }) {
  return <p className={`mt-2 text-xs ${good ? "text-emerald-700" : "text-amber-700"}`}>{children}</p>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-[#f7f2ea] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function AnalysisCheck({ good, title, description }: { good: boolean; title: string; description: string }) {
  return (
    <div className={`rounded-2xl border p-4 transition ${good ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/60"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${good ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
          {good ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ media, compact }: { media: CategoryMediaItem; compact?: boolean }) {
  const src = media.optimizedUrl || media.url;
  const thumbnail = media.thumbnailUrl || src;

  if (!src) {
    return <ImageIcon className="h-6 w-6 text-neutral-400" />;
  }

  if (media.type === "video" || isVideoUrl(src)) {
    return compact ? (
      <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-xs font-semibold text-white/70">
        Video
      </div>
    ) : (
      <video src={src} controls className="h-full max-h-full w-full max-w-full object-contain" poster={thumbnail !== src ? thumbnail : undefined} />
    );
  }

  return <img src={thumbnail} alt={media.altText || media.name || "Category media"} className="h-full max-h-full w-full max-w-full object-contain" />;
}

function OptimizationMetric({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${emphasized ? "border-emerald-100 bg-emerald-50/70" : "border-neutral-100 bg-[#fbfaf6]"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${emphasized ? "text-emerald-700" : "text-neutral-950"}`}>{value}</p>
    </div>
  );
}

function FaqStatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function IssueGroupCard({ group }: { group: SeoFactorGroup }) {
  return (
    <details className="group rounded-xl border border-neutral-100 bg-[#fbfaf6] p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-950">{group.label}</span>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
          {group.fixed}/{group.total} passed
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        {group.factors.map((factor) => (
          <div key={factor.key} className="rounded-xl bg-white px-3 py-2">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${factorStatusClass(factor.status)}`}>
                {factorStatusIcon(factor.status)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-5 text-neutral-950">{factor.label}</p>
                <p className="text-xs leading-5 text-neutral-500">{factor.message}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-neutral-500">
                {factor.score}/{factor.maxScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function RobotMetaCard({
  indexable,
  followLinks,
  onIndexableChange,
  onFollowLinksChange,
}: {
  indexable: boolean;
  followLinks: boolean;
  onIndexableChange: (value: boolean) => void;
  onFollowLinksChange: (value: boolean) => void;
}) {
  const robotsText = `${indexable ? "index" : "noindex"}, ${followLinks ? "follow" : "nofollow"}`;

  return (
    <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Robot Meta</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Control how search engines index this category page.</p>
        </div>
        <Badge className="bg-neutral-100 text-neutral-700">{robotsText}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <RobotMetaToggle checked={indexable} title="Index" description="Allow search engines to display this category page in search results" onChange={onIndexableChange} />
        <RobotMetaToggle checked={followLinks} title="Follow" description="Allow search engines to discover and index links on this category page" onChange={onFollowLinksChange} />
      </div>
    </Card>
  );
}

function RobotMetaToggle({ checked, title, description, onChange }: { checked: boolean; title: string; description: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-100 bg-[#fbfaf6] p-3 transition hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-neutral-500">{description}</span>
      </span>
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-[#f7f2ea] p-4">
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
  );
}

"use client";
import RichTextEditor from "@/components/admin/seo/RichTextEditor";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";

type SeoStatus = "DRAFT" | "PUBLISHED" | "NEEDS_REVIEW" | "ARCHIVED";
type OptimizeMode = "all" | "size" | "alt";

type ProductPricingSummary = {
  amount?: string | number | null;
  currency?: string | null;
  displayPrice?: string | null;
} | null;

type ProductImageLike = {
  url?: string | null;
  secureUrl?: string | null;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  isPrimary?: boolean | null;
  type?: string | null;
  resourceType?: string | null;
  position?: number | null;
  sortOrder?: number | null;
};

type ProductSummary = {
  id: string;
  name: string;
  title?: string | null;
  slug: string | null;
  publicUrl?: string | null;
  price?: string | number | null;
  basePrice?: string | number | null;
  listingPrice?: string | number | null;
  originalPrice?: string | number | null;
  salePrice?: string | number | null;
  rentalPrice?: string | number | null;
  rentPrice?: string | number | null;
  compareAtPrice?: string | number | null;
  currency?: string | null;
  pricing?: ProductPricingSummary;
  tags?: string[] | null;
  images?: ProductImageLike[] | null;
  media?: ProductImageLike[] | null;
  type: string | null;
  status: string | null;
  image: string | null;
  category: string | null;
  description?: string | null;
  shortDescription?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  collections: {
    id: string;
    name: string;
    slug: string;
  }[];
};

type SeoImage = {
  imageId: string;
  imageUrl: string;
  title: string | null;
  altText: string | null;
  caption: string | null;
  keywords: string[];
  isMissingAlt: boolean;
  isDuplicateAlt: boolean;
  isLargeImage: boolean;
  isMissingCaption: boolean;
  isOptimized: boolean;
};

type MediaSeoItem = {
  id: string;
  uniqueKey: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "image" | "video";
  name: string;
  altText: string;
  originalUrl?: string | null;
  optimizedUrl?: string | null;
  originalSizeBytes?: number | null;
  optimizedSizeBytes?: number | null;
  reductionPercentage?: number | null;
  format?: string | null;
  fileSizeBytes?: number | null;
  originalFileSizeBytes?: number | null;
  compressionSavedBytes?: number | null;
  compressionSavedPercent?: number | null;
  optimizationStatus?: "optimized" | "skipped" | "failed" | null;
  optimizationReason?: string | null;
  isExternalVideo?: boolean;
  isOptimized?: boolean;
  isMissingAlt?: boolean;
  isDuplicateAlt?: boolean;
  isLargeImage?: boolean;
  isPrimary?: boolean;
  position?: number | null;
  sortOrder?: number | null;
};

type SeoLinkedItem = {
  id: string;
  title: string;
  slug: string;
  selected: boolean;
};

type SeoIssue = {
  field: string;
  section?: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
};

type SeoFactorStatus = "PASS" | "WARNING" | "FAIL" | "OPTIONAL" | string;

type SeoScoreFactor = {
  key: string;
  label: string;
  status: SeoFactorStatus;
  score: number;
  maxScore: number;
  message: string;
};

type ProductSeoRecord = {
  id: string | null;
  productId: string;
  productName: string;
  productType: string;
  status: SeoStatus;

  searchMetadata: {
    seoTitle: string;
    metaDescription: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    slug: string;
    canonicalUrl: string;
    titleLength?: number;
    metaDescriptionLength?: number;
    isSlugUnique?: boolean;
  };

  videoSeo: {
    videoUrl: string | null;
    videoTitle: string | null;
    videoDescription: string | null;
    videoThumbnail: string | null;
    videoDuration: string | null;
    videoUploadDate: string | null;
    videoType:
      | "TRY_ON"
      | "FABRIC"
      | "MOVEMENT"
      | "WEDDING"
      | "STYLING"
      | string
      | null;
  };

  structuredData: {
    productSchema: Record<string, unknown> | null;
    offerSchema: Record<string, unknown> | null;
    reviewSchema: Record<string, unknown> | null;
    breadcrumbSchema: Record<string, unknown> | null;
    faqSchema: Record<string, unknown> | null;
    videoSchema: Record<string, unknown> | null;
    jsonLdPreview: Record<string, unknown> | null;
    richResultsValidation?: {
      isValid: boolean;
      issues: SeoIssue[];
    };
  };

  imageSeo: {
    images: SeoImage[];
    summary: {
      totalImages: number;
      missingAltText: number;
      duplicateAltText: number;
      largeImages: number;
      missingCaptions: number;
      optimizedImages: number;
    };
  };

  internalLinks: {
    categories: SeoLinkedItem[];
    collections: SeoLinkedItem[];
    editorial: SeoLinkedItem[];
    realWeddings: SeoLinkedItem[];
    palettes: SeoLinkedItem[];
    swatches: SeoLinkedItem[];
  };

  aiSearchOptimization: {
    aiSummary: string | null;
    keyFacts: string[];
    useCases: string[];
    occasions: string[];
    colorIntent: string | null;
    fitIntent: string | null;
  };

  faqBuilder: {
    enabled: boolean;
    faqs: {
      id?: string;
      question: string;
      answer: string;
      sortOrder: number;
    }[];
  };

  seoScoreBreakdown: {
    overallScore: number;
    searchMetadataScore: number;
    structuredDataScore: number;
    mediaSeoScore: number;
    faqScore: number;
    factors?: SeoScoreFactor[];
  };

  updatedAt: string | null;
};

type ProductSeoDetailResponse = {
  data?: {
    product?: ProductSummary;
    seo?: ProductSeoRecord;
  };
  product?: ProductSummary;
  seo?: ProductSeoRecord;
  message?: string | string[];
};

type CatalogProductDetail = {
  id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  publicUrl?: string | null;
  price?: string | number | null;
  basePrice?: string | number | null;
  listingPrice?: string | number | null;
  originalPrice?: string | number | null;
  salePrice?: string | number | null;
  rentalPrice?: string | number | null;
  rentPrice?: string | number | null;
  compareAtPrice?: string | number | null;
  currency?: string | null;
  pricing?: ProductPricingSummary;
  tags?: string[] | null;
  images?: ProductImageLike[] | null;
  media?: ProductImageLike[] | null;
  type?: string | null;
  status?: string | null;
  image?: string | null;
  category?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  collections?: ProductSummary["collections"];
};

type CatalogProductDetailResponse = {
  success?: boolean;
  data?:
    | CatalogProductDetail
    | {
        product?: CatalogProductDetail;
        data?: CatalogProductDetail;
      };
  product?: CatalogProductDetail;
  message?: string | string[];
};

type ValidateResponse = {
  data?: {
    isValid: boolean;
    score: number;
    issues: SeoIssue[];
    scores?: ProductSeoRecord["seoScoreBreakdown"];
  };
  message?: string | string[];
};

type OptimizeImagesResponse = {
  data?: {
    optimizedImages?: Array<{
      id?: string;
      imageId?: string;
      url?: string;
      originalUrl?: string;
      optimizedUrl?: string;
      originalSizeBytes?: number;
      optimizedSizeBytes?: number;
      reductionPercentage?: number;
      format?: string;
      fileSizeBytes?: number;
      originalFileSizeBytes?: number;
      compressionSavedBytes?: number;
      compressionSavedPercent?: number;
      isOptimized?: boolean;
      isLargeImage?: boolean;
      status?: "optimized" | "skipped" | "failed";
      reason?: string;
    }>;
    summary?: {
      totalImages?: number;
      optimizedImages?: number;
      compressedImages?: number;
      skippedImages?: number;
      altGenerated?: number;
      duplicateAltFixed?: number;
    };
  };
  optimizedImages?: Array<{
    id?: string;
    imageId?: string;
    url?: string;
    originalUrl?: string;
    optimizedUrl?: string;
    originalSizeBytes?: number;
    optimizedSizeBytes?: number;
    reductionPercentage?: number;
    format?: string;
    fileSizeBytes?: number;
    originalFileSizeBytes?: number;
    compressionSavedBytes?: number;
    compressionSavedPercent?: number;
    isOptimized?: boolean;
    isLargeImage?: boolean;
    status?: "optimized" | "skipped" | "failed";
    reason?: string;
  }>;
  summary?: {
    totalImages?: number;
    optimizedImages?: number;
    compressedImages?: number;
    skippedImages?: number;
    altGenerated?: number;
    duplicateAltFixed?: number;
  };
  message?: string | string[];
};

type OptimizeMediaResponse = {
  data?: {
    optimizedMedia?: Array<{
      id?: string;
      mediaId?: string;
      type?: string;
      url?: string;
      originalUrl?: string;
      optimizedUrl?: string;
      originalSizeBytes?: number;
      optimizedSizeBytes?: number;
      reductionPercentage?: number;
      format?: string;
      isOptimized?: boolean;
      status?: "optimized" | "skipped" | "failed";
      reason?: string;
    }>;
    optimizedVideos?: Array<{
      id?: string;
      mediaId?: string;
      type?: string;
      url?: string;
      originalUrl?: string;
      optimizedUrl?: string;
      originalSizeBytes?: number;
      optimizedSizeBytes?: number;
      reductionPercentage?: number;
      format?: string;
      isOptimized?: boolean;
      status?: "optimized" | "skipped" | "failed";
      reason?: string;
    }>;
    summary?: {
      totalMedia?: number;
      optimizedMedia?: number;
      optimizedVideos?: number;
      compressedVideos?: number;
      skippedMedia?: number;
      skippedVideos?: number;
    };
  };
  optimizedMedia?: Array<{
    id?: string;
    mediaId?: string;
    type?: string;
    url?: string;
    originalUrl?: string;
    optimizedUrl?: string;
    originalSizeBytes?: number;
    optimizedSizeBytes?: number;
    reductionPercentage?: number;
    format?: string;
    isOptimized?: boolean;
    status?: "optimized" | "skipped" | "failed";
    reason?: string;
  }>;
  optimizedVideos?: Array<{
    id?: string;
    mediaId?: string;
    type?: string;
    url?: string;
    originalUrl?: string;
    optimizedUrl?: string;
    originalSizeBytes?: number;
    optimizedSizeBytes?: number;
    reductionPercentage?: number;
    format?: string;
    isOptimized?: boolean;
    status?: "optimized" | "skipped" | "failed";
    reason?: string;
  }>;
  summary?: {
    totalMedia?: number;
    optimizedMedia?: number;
    optimizedVideos?: number;
    compressedVideos?: number;
    skippedMedia?: number;
    skippedVideos?: number;
  };
  message?: string | string[];
};

type FaqDraft = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isOpen: boolean;
};

function arrayToText(value?: string[] | null) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function textToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonToText(value: unknown) {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function textToJson(value: string) {
  if (!value.trim()) return null;
  return JSON.parse(value);
}

function getDetailPayload(response: ProductSeoDetailResponse) {
  const product = response.data?.product || response.product || null;
  const seo = response.data?.seo || response.seo || null;
  return { product, seo };
}

function getCatalogDetailPayload(response: CatalogProductDetailResponse) {
  if (response.product) return response.product;

  if (response.data && "id" in response.data) {
    return response.data as CatalogProductDetail;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "product" in response.data &&
    response.data.product
  ) {
    return response.data.product;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    response.data.data
  ) {
    return response.data.data;
  }

  return null;
}

function statusClass(status: string) {
  const normalized = status.toUpperCase();

  if (["GOOD", "ACTIVE", "PUBLISHED"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    ["WARNING", "DRAFT", "NEEDS_REVIEW", "NOT_STARTED"].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (["CRITICAL", "ARCHIVED", "INACTIVE", "ERROR"].includes(normalized)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-neutral-100 text-neutral-700";
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

  if (key.includes("title") || key.includes("meta") || key.includes("url") || key.includes("slug")) {
    return "Search metadata";
  }

  if (key.includes("paragraph") || key.includes("h1") || key.includes("h2") || key.includes("h3") || key.includes("content") || key.includes("density") || key.includes("readability") || key.includes("sentence") || key.includes("transition")) {
    return "Content quality";
  }

  if (key.includes("link")) {
    return "Links";
  }

  if (key.includes("image")) {
    return "Media";
  }

  if (key.includes("schema") || key.includes("canonical") || key.includes("robots")) {
    return "Technical SEO";
  }

  if (key.includes("social")) {
    return "Social metadata";
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

function getPublishingBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function firstText(...values: Array<string | null | undefined>) {
  return (
    values.find((value) => typeof value === "string" && value.trim())?.trim() ||
    ""
  );
}

function stripHtml(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function normalizeProductPublicUrl(url: string, slug: string) {
  const cleanUrl = url.trim();
  const cleanSlug = slug.trim();

  if (!cleanUrl) {
    return `${PUBLIC_FRONTEND_URL}/products/${cleanSlug}`;
  }

  try {
    const parsedUrl = new URL(cleanUrl);

    const productPath = parsedUrl.pathname.startsWith("/products/")
      ? parsedUrl.pathname
      : `/products/${cleanSlug}`;

    return `${PUBLIC_FRONTEND_URL}${productPath}${parsedUrl.search}`;
  } catch {
    if (cleanUrl.startsWith("/products/")) {
      return `${PUBLIC_FRONTEND_URL}${cleanUrl}`;
    }

    return `${PUBLIC_FRONTEND_URL}/products/${cleanSlug}`;
  }
}

function getSlugFromUrlOrHandle(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) return "";

  try {
    const parsedUrl = new URL(cleanValue);
    const productSlug = parsedUrl.pathname
      .split("/products/")
      .pop()
      ?.split("/")
      .filter(Boolean)[0];

    return productSlug || cleanValue;
  } catch {
    return cleanValue
      .replace(/^\/products\//, "")
      .replace(/^products\//, "")
      .split("?")[0]
      .split("#")[0]
      .trim();
  }
}

function getCanonicalUrlFromHandle(value: string, fallbackSlug: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return `${PUBLIC_FRONTEND_URL}/products/${fallbackSlug}`;
  }

  try {
    const parsedUrl = new URL(cleanValue);
    return normalizeProductPublicUrl(parsedUrl.toString(), fallbackSlug);
  } catch {
    const cleanSlug = getSlugFromUrlOrHandle(cleanValue || fallbackSlug);
    return `${PUBLIC_FRONTEND_URL}/products/${cleanSlug}`;
  }
}

function getProductFallbackTitle(
  product?: ProductSummary | CatalogProductDetail | null,
  fallback = "",
) {
  return firstText(
    product?.metaTitle,
    product?.seoTitle,
    product?.title,
    product?.name,
    fallback,
  );
}

function getProductFallbackDescription(
  product?: ProductSummary | CatalogProductDetail | null,
  fallback = "",
) {
  return stripHtml(
    firstText(
      product?.metaDescription,
      product?.seoDescription,
      product?.shortDescription,
      product?.description,
      fallback,
    ),
  );
}

function getCatalogSeoTitle(
  product?: ProductSummary | CatalogProductDetail | null,
  fallback = "",
) {
  return firstText(product?.seoTitle, product?.metaTitle, fallback);
}

function getCatalogSeoDescription(
  product?: ProductSummary | CatalogProductDetail | null,
  fallback = "",
) {
  return firstText(product?.seoDescription, product?.metaDescription, fallback);
}

function getPrimaryCatalogImage(
  product?: ProductSummary | CatalogProductDetail | null,
) {
  const items = [
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.media) ? product.media : []),
  ];

  const imageItems = items.filter((item) => {
    const type = `${item.type || item.resourceType || ""}`.toLowerCase();
    return !type || type.includes("image");
  });

  const sorted = [...imageItems].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    const aPosition = a.position ?? a.sortOrder ?? 999;
    const bPosition = b.position ?? b.sortOrder ?? 999;
    return aPosition - bPosition;
  });

  const first = sorted[0] || imageItems[0];

  return (
    first?.secureUrl?.trim() ||
    first?.url?.trim() ||
    first?.thumbnailUrl?.trim() ||
    first?.thumbnail?.trim() ||
    ""
  );
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

  return fallback;
}

const RAW_BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  "http://65.1.135.224:3001";
const PUBLIC_FRONTEND_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://frontend-shahsi-2-0.vercel.app"
).replace(/\/$/, "");

function getBackendApiBaseUrl() {
  return RAW_BACKEND_API_URL.replace(/\/admin\/?$/, "").replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
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

function isExternalVideoUrl(url?: string | null) {
  if (!url) return false;

  const cleanUrl = url.toLowerCase();

  return (
    cleanUrl.includes("youtube.com") ||
    cleanUrl.includes("youtu.be") ||
    cleanUrl.includes("vimeo.com") ||
    cleanUrl.includes("player.vimeo.com") ||
    cleanUrl.includes("dailymotion.com") ||
    cleanUrl.includes("dai.ly")
  );
}

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");

      if (watchId) {
        return `https://www.youtube.com/embed/${watchId}`;
      }

      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      if (parsed.pathname.includes("/embed/")) {
        return url;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function getExternalVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return getYoutubeEmbedUrl(url);
    }

    if (hostname.includes("player.vimeo.com")) {
      return url;
    }

    if (hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname
        .split("/")
        .filter(Boolean)
        .find((part) => /^\d+$/.test(part));

      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }

    if (hostname.includes("dai.ly")) {
      const videoId = parsed.pathname.replace("/", "").split("?")[0];
      return videoId
        ? `https://www.dailymotion.com/embed/video/${videoId}`
        : url;
    }

    if (hostname.includes("dailymotion.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoIndex = parts.findIndex((part) => part === "video");
      const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : "";

      return videoId
        ? `https://www.dailymotion.com/embed/video/${videoId}`
        : url;
    }

    return url;
  } catch {
    return url;
  }
}

function getYoutubeVideoId(url?: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("?")[0];
    }

    if (parsed.hostname.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;

      if (parsed.pathname.includes("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }

      if (parsed.pathname.includes("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    return "";
  } catch {
    return "";
  }
}

function getYoutubeThumbnailUrl(url?: string | null) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function getVimeoVideoId(url?: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("player.vimeo.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoIndex = parts.findIndex((part) => part === "video");
      return videoIndex >= 0 ? parts[videoIndex + 1] || "" : "";
    }

    if (hostname.includes("vimeo.com")) {
      return (
        parsed.pathname
          .split("/")
          .filter(Boolean)
          .find((part) => /^\d+$/.test(part)) || ""
      );
    }

    return "";
  } catch {
    return "";
  }
}

function getVimeoThumbnailUrl(url?: string | null) {
  const videoId = getVimeoVideoId(url);
  return videoId ? `https://vumbnail.com/${videoId}.jpg` : "";
}

function isImageThumbnailUrl(url?: string | null) {
  if (!url) return false;

  const cleanUrl = url.toLowerCase().split("?")[0];

  return (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.includes("res.cloudinary.com") ||
    cleanUrl.includes("img.youtube.com") ||
    cleanUrl.includes("vumbnail.com")
  );
}

function getExternalVideoThumbnailUrl(media: MediaSeoItem) {
  if (
    media.thumbnailUrl &&
    media.thumbnailUrl !== media.url &&
    isImageThumbnailUrl(media.thumbnailUrl)
  ) {
    return media.thumbnailUrl;
  }

  return (
    getYoutubeThumbnailUrl(media.url) || getVimeoThumbnailUrl(media.url) || ""
  );
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0)
    return "Size not available";

  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function getMediaPlaybackUrl(media: MediaSeoItem) {
  return media.optimizedUrl || media.url;
}

function getOriginalMediaSize(media: MediaSeoItem) {
  return (
    media.originalSizeBytes ||
    media.originalFileSizeBytes ||
    media.fileSizeBytes ||
    null
  );
}

function getOptimizedMediaSize(media: MediaSeoItem) {
  if (media.optimizedSizeBytes) return media.optimizedSizeBytes;

  const original = getOriginalMediaSize(media);
  const reductionPercent =
    typeof media.reductionPercentage === "number"
      ? media.reductionPercentage
      : typeof media.compressionSavedPercent === "number"
        ? media.compressionSavedPercent
        : null;

  if (original && typeof reductionPercent === "number" && reductionPercent > 0) {
    return Math.round(original * (1 - reductionPercent / 100));
  }

  return null;
}

function getMediaReductionPercent(media: MediaSeoItem) {
  if (typeof media.reductionPercentage === "number") {
    return media.reductionPercentage;
  }

  if (typeof media.compressionSavedPercent === "number") {
    return media.compressionSavedPercent;
  }

  const original = getOriginalMediaSize(media);
  const optimized = media.optimizedSizeBytes || null;

  if (!original || !optimized || optimized >= original) return null;

  return Math.round(((original - optimized) / original) * 100);
}

function isExternalMediaSource(media: MediaSeoItem) {
  return Boolean(media.isExternalVideo || isExternalVideoUrl(media.url));
}

function canOptimizeMediaSize(media: MediaSeoItem) {
  if (media.type === "video" && isExternalMediaSource(media)) return false;
  return Boolean(media.id);
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

function getMediaTypeFromRecord(record: Record<string, unknown>, url: string) {
  const type = getStringField(record, [
    "type",
    "mediaType",
    "mimeType",
    "resourceType",
    "viewType",
  ]).toLowerCase();

  if (type.includes("video") || isVideoUrl(url) || isExternalVideoUrl(url)) {
    return "video";
  }

  return "image";
}

function getFileName(url?: string | null) {
  if (!url) return "Untitled media";

  try {
    const clean = url.split("?")[0];
    const last = clean.split("/").pop();
    return last || "Untitled media";
  } catch {
    return "Untitled media";
  }
}

function normalizeUrlForDedupe(url: string) {
  return url.trim().toLowerCase().split("?")[0];
}

function normalizeAltText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSeoImage(image: SeoImage, index = 0): MediaSeoItem {
  const type = isVideoUrl(image.imageUrl) ? "video" : "image";

  return {
    id: image.imageId,
    uniqueKey: `${type}-${image.imageId}-${normalizeUrlForDedupe(image.imageUrl)}-${index}`,
    url: image.imageUrl,
    thumbnailUrl: isExternalVideoUrl(image.imageUrl)
      ? getYoutubeThumbnailUrl(image.imageUrl)
      : null,
    type,
    name: image.title || getFileName(image.imageUrl),
    altText: image.altText || "",
    originalUrl: image.imageUrl,
    optimizedUrl: null,
    originalSizeBytes: null,
    optimizedSizeBytes: null,
    reductionPercentage: null,
    format: null,
    fileSizeBytes: null,
    originalFileSizeBytes: null,
    compressionSavedBytes: null,
    compressionSavedPercent: null,
    optimizationStatus: image.isOptimized ? "optimized" : null,
    optimizationReason: null,
    isExternalVideo: isExternalVideoUrl(image.imageUrl),
    isOptimized: image.isOptimized,
    isMissingAlt: image.isMissingAlt,
    isDuplicateAlt: image.isDuplicateAlt,
    isLargeImage: image.isLargeImage,
    isPrimary: false,
    position: index,
    sortOrder: index,
  };
}

function normalizeMediaRecord(
  value: unknown,
  index: number,
): MediaSeoItem | null {
  if (!isRecord(value)) return null;

  const optimizationRecord = getNestedRecord(value, [
    "optimization",
    "mediaOptimization",
    "seoOptimization",
    "optimizationMeta",
    "optimized",
  ]);
  const optimizationRecords = [value, optimizationRecord];

  const url = getStringFieldFromRecords(optimizationRecords, [
    "optimizedUrl",
    "optimized_url",
    "webpUrl",
    "webp_url",
    "url",
    "imageUrl",
    "videoUrl",
    "youtubeUrl",
    "youtube_url",
    "embedUrl",
    "embed_url",
    "externalUrl",
    "external_url",
    "secureUrl",
    "secure_url",
    "src",
    "path",
    "mediaUrl",
  ]);

  if (!url) return null;

  const id =
    getStringFieldFromRecords(optimizationRecords, ["id", "imageId", "mediaId", "_id"]) ||
    `media-${index}`;

  const type = getMediaTypeFromRecord(value, url);
  const name =
    getStringFieldFromRecords(optimizationRecords, ["name", "title", "imageTitle", "fileName"]) ||
    getFileName(url);

  const altText = getStringFieldFromRecords(optimizationRecords, ["altText", "alt", "alt_text"]);
  const thumbnailUrl =
    getStringFieldFromRecords(optimizationRecords, [
      "thumbnailUrl",
      "thumbnail_url",
      "thumbnail",
      "poster",
      "posterUrl",
      "previewUrl",
      "preview_url",
    ]) || (isExternalVideoUrl(url) ? getYoutubeThumbnailUrl(url) : "");

  return {
    id,
    uniqueKey: `${type}-${id}-${normalizeUrlForDedupe(url)}-${index}`,
    url,
    thumbnailUrl,
    type,
    name,
    altText,
    originalUrl:
      getStringFieldFromRecords(optimizationRecords, [
        "originalUrl",
        "original_url",
        "sourceUrl",
        "source_url",
      ]) || (getStringFieldFromRecords(optimizationRecords, ["optimizedUrl", "optimized_url", "webpUrl", "webp_url"]) ? getStringField(value, ["url", "imageUrl", "videoUrl", "secureUrl", "mediaUrl"]) : ""),
    optimizedUrl: getStringFieldFromRecords(optimizationRecords, [
      "optimizedUrl",
      "optimized_url",
      "webpUrl",
      "webp_url",
      "compressedUrl",
      "compressed_url",
      "transformedUrl",
      "transformed_url",
    ]),
    originalSizeBytes: getNumberFieldFromRecords(optimizationRecords, [
      "originalSizeBytes",
      "originalFileSizeBytes",
      "originalBytes",
      "sourceSizeBytes",
      "beforeSizeBytes",
      "preOptimizationSizeBytes",
    ]),
    optimizedSizeBytes: getNumberFieldFromRecords(optimizationRecords, [
      "optimizedSizeBytes",
      "optimizedFileSizeBytes",
      "compressedSizeBytes",
      "compressedBytes",
      "optimizedBytes",
      "outputSizeBytes",
      "afterSizeBytes",
      "newSizeBytes",
      "transformedSizeBytes",
    ]),
    reductionPercentage: getNumberFieldFromRecords(optimizationRecords, [
      "reductionPercentage",
      "reductionPercent",
      "compressionSavedPercent",
      "compressionReductionPercentage",
      "savedPercent",
      "savedPercentage",
    ]),
    format: getStringFieldFromRecords(optimizationRecords, [
      "format",
      "outputFormat",
      "extension",
      "optimizedFormat",
    ]),
    fileSizeBytes: getNumberFieldFromRecords(optimizationRecords, [
      "fileSizeBytes",
      "sizeBytes",
      "bytes",
      "fileSize",
      "size",
    ]),
    originalFileSizeBytes: getNumberFieldFromRecords(optimizationRecords, [
      "originalFileSizeBytes",
      "originalSizeBytes",
      "originalBytes",
      "sourceSizeBytes",
    ]),
    compressionSavedBytes: getNumberFieldFromRecords(optimizationRecords, [
      "compressionSavedBytes",
      "savedBytes",
      "bytesSaved",
    ]),
    compressionSavedPercent: getNumberFieldFromRecords(optimizationRecords, [
      "compressionSavedPercent",
      "savedPercent",
      "savedPercentage",
      "reductionPercentage",
      "reductionPercent",
    ]),
    optimizationStatus:
      (getStringFieldFromRecords(optimizationRecords, ["optimizationStatus", "status"]) as
        | "optimized"
        | "skipped"
        | "failed"
        | "") || null,
    optimizationReason:
      getStringFieldFromRecords(optimizationRecords, [
        "optimizationReason",
        "skipReason",
        "reason",
      ]) || null,
    isExternalVideo: isExternalVideoUrl(url),
    isOptimized:
      getBooleanFieldFromRecords(optimizationRecords, ["isOptimized", "optimized"]) ??
      Boolean(
        getStringFieldFromRecords(optimizationRecords, [
          "optimizedUrl",
          "optimized_url",
          "webpUrl",
          "webp_url",
        ]) ||
          getNumberFieldFromRecords(optimizationRecords, [
            "optimizedSizeBytes",
            "compressedSizeBytes",
          ]),
      ),
    isMissingAlt: !altText,
    isDuplicateAlt: getBooleanFieldFromRecords(optimizationRecords, ["isDuplicateAlt", "duplicateAlt"]),
    isLargeImage: getBooleanFieldFromRecords(optimizationRecords, ["isLargeImage", "largeImage"]),
    isPrimary: getBooleanFieldFromRecords(optimizationRecords, ["isPrimary", "primary"]),
    position: (() => {
      const position = value.position;
      return typeof position === "number" ? position : null;
    })(),
    sortOrder: (() => {
      const sortOrder = value.sortOrder;
      return typeof sortOrder === "number" ? sortOrder : null;
    })(),
  };
}

function dedupeMediaItems(items: MediaSeoItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const cleanUrl = normalizeUrlForDedupe(item.url);
    const key = cleanUrl || `${item.type}:${item.id}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function markDuplicateAltText(items: MediaSeoItem[]) {
  const altCounts = new Map<string, number>();

  items.forEach((item) => {
    const normalizedAlt = normalizeAltText(item.altText);
    if (!normalizedAlt) return;
    altCounts.set(normalizedAlt, (altCounts.get(normalizedAlt) || 0) + 1);
  });

  return items.map((item) => {
    const normalizedAlt = normalizeAltText(item.altText);
    const duplicateByUi = normalizedAlt
      ? (altCounts.get(normalizedAlt) || 0) > 1
      : false;

    return {
      ...item,
      isMissingAlt: !item.altText.trim(),
      isDuplicateAlt: Boolean(item.isDuplicateAlt || duplicateByUi),
    };
  });
}

function normalizeCatalogMediaResponse(response: unknown): MediaSeoItem[] {
  const candidates: unknown[] = [];

  function addCandidate(value: unknown) {
    if (Array.isArray(value)) candidates.push(...value);
  }

  if (Array.isArray(response)) candidates.push(...response);

  if (isRecord(response)) {
    addCandidate(response.data);
    addCandidate(response.media);
    addCandidate(response.images);
    addCandidate(response.videos);
    addCandidate(response.items);
    addCandidate(response.results);

    if (isRecord(response.data)) {
      addCandidate(response.data.media);
      addCandidate(response.data.images);
      addCandidate(response.data.videos);
      addCandidate(response.data.youtubeVideos);
      addCandidate(response.data.videoUrls);
      addCandidate(response.data.items);
      addCandidate(response.data.results);

      if (isRecord(response.data.product)) {
        addCandidate(response.data.product.media);
        addCandidate(response.data.product.images);
        addCandidate(response.data.product.videos);
        addCandidate(response.data.product.youtubeVideos);
        addCandidate(response.data.product.videoUrls);
      }
    }
  }

  return markDuplicateAltText(
    dedupeMediaItems(
      candidates
        .map((item, index) => normalizeMediaRecord(item, index))
        .filter((item): item is MediaSeoItem => Boolean(item)),
    ),
  );
}

export default function ProductSeoEditPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [seo, setSeo] = useState<ProductSeoRecord | null>(null);

  const [mediaItems, setMediaItems] = useState<MediaSeoItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaDraft, setMediaDraft] = useState({ name: "", altText: "" });
  const [isOptimizeMenuOpen, setIsOptimizeMenuOpen] = useState(false);
  const [draggedMediaKey, setDraggedMediaKey] = useState<string | null>(null);

  const [faqItems, setFaqItems] = useState<FaqDraft[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaSaving, setIsMediaSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "media" | "delete-media" | "reorder-media" | "set-primary" | null
  >(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [customMetaEnabled, setCustomMetaEnabled] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "desktop",
  );
  const [originalSlug, setOriginalSlug] = useState("");
  const [originalCanonicalUrl, setOriginalCanonicalUrl] = useState("");
  const [createUrlRedirect, setCreateUrlRedirect] = useState(false);

  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    status: "DRAFT" as SeoStatus,

    seoTitle: "",
    metaDescription: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    slug: "",
    canonicalUrl: "",

    structuredDataJsonLd: "",

    faqEnabled: false,
  });

  const seoFactors = seo?.seoScoreBreakdown.factors || [];
  const score = seo?.seoScoreBreakdown.overallScore || 0;
  const passedFactorCount = seoFactors.filter(factorIsFixed).length;
  const issueFactorCount = seoFactors.filter(factorIsIssue).length;
  const optionalFactorCount = seoFactors.filter(
    (factor) => String(factor.status || "").toUpperCase() === "OPTIONAL",
  ).length;

  const scoreRows: [string, number, number][] = seo
    ? [
        ["Overall Score", seo.seoScoreBreakdown.overallScore, 100],
        ["PDF Ranking Factors", passedFactorCount * 5, seoFactors.length ? seoFactors.length * 5 : 100],
      ].filter(
        (row): row is [string, number, number] => typeof row[1] === "number",
      )
    : [];

  const selectedMedia = useMemo(() => {
    if (!mediaItems.length) return null;
    return (
      mediaItems.find((media) => media.uniqueKey === selectedMediaId) ||
      mediaItems[0]
    );
  }, [mediaItems, selectedMediaId]);

  const primaryMedia = useMemo(() => {
    return mediaItems.find((media) => media.isPrimary) || null;
  }, [mediaItems]);

  const titleCount = form.seoTitle.length;
  const metaCount = form.metaDescription.length;
  const META_TITLE_MIN = 55;
  const META_TITLE_MAX = 60;
  const META_DESCRIPTION_MIN = 155;
  const META_DESCRIPTION_MAX = 160;
  const productName = form.productName || product?.name || "Product";

  const previewTitle = getSyncedSeoTitle() || productName;
  const previewDescription =
    getSyncedSeoDescription() ||
    stripHtml(form.productDescription) ||
    "Meta description preview";
  const cleanSlug = getSlugFromUrlOrHandle(
    form.slug || form.canonicalUrl || product?.slug || product?.id || "",
  );
  const effectiveCanonicalUrl = getCanonicalUrlFromHandle(
    form.canonicalUrl || form.slug || product?.publicUrl || "",
    cleanSlug || productId,
  );
  const urlHandleInputValue = form.canonicalUrl || effectiveCanonicalUrl;
  const originalRedirectSlug = getSlugFromUrlOrHandle(
    originalSlug || originalCanonicalUrl || product?.slug || "",
  );
  const hasUrlChanged = Boolean(
    originalRedirectSlug && cleanSlug && originalRedirectSlug !== cleanSlug,
  );
  const oldRedirectUrl = originalRedirectSlug
    ? getCanonicalUrlFromHandle(originalCanonicalUrl || originalRedirectSlug, originalRedirectSlug)
    : "";
  const newRedirectUrl = cleanSlug
    ? getCanonicalUrlFromHandle(form.canonicalUrl || cleanSlug, cleanSlug)
    : "";

  let previewDomain = PUBLIC_FRONTEND_URL.replace(/^https?:\/\//, "");
  let previewPath = cleanSlug ? `products › ${cleanSlug}` : "products";

  try {
    const parsedPreviewUrl = new URL(effectiveCanonicalUrl);
    previewDomain = parsedPreviewUrl.hostname;
    previewPath =
      parsedPreviewUrl.pathname.split("/").filter(Boolean).join(" › ") ||
      previewPath;
  } catch {
    // Fallback preview values are already set.
  }

  const metaTitleValue = form.seoTitle.trim();
  const metaDescriptionValue = form.metaDescription.trim();
  const titleForAnalysis = metaTitleValue || form.productName.trim();
  const descriptionForAnalysis =
    metaDescriptionValue || stripHtml(form.productDescription);
  const titleAnalysisCount = titleForAnalysis.length;
  const descriptionAnalysisCount = descriptionForAnalysis.length;
 
  const isUrlAdded = Boolean(cleanSlug || form.canonicalUrl.trim());
  const isTitleAdded = Boolean(titleForAnalysis);
  const isDescriptionAdded = Boolean(descriptionForAnalysis);
  const isTitleLengthGood =
  titleAnalysisCount >= META_TITLE_MIN && titleAnalysisCount <= META_TITLE_MAX;

const isDescriptionLengthGood =
  descriptionAnalysisCount >= META_DESCRIPTION_MIN &&
  descriptionAnalysisCount <= META_DESCRIPTION_MAX;
 

  function getSyncedSeoTitle() {
    return firstText(
      form.seoTitle,
      form.productName,
      product?.seoTitle,
      product?.metaTitle,
      product?.title,
      product?.name,
      productName,
    );
  }

  function getSyncedSeoDescription() {
    return stripHtml(
      firstText(
        form.metaDescription,
        product?.seoDescription,
        product?.metaDescription,
        product?.shortDescription,
        product?.description,
      ),
    );
  }

  function syncStructuredDataWithSeo(
    value: Record<string, unknown> | null,
    title: string,
    description: string,
  ) {
    if (!value) {
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description,
      };
    }

    let next: Record<string, unknown>;

    try {
      next = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
      next = value;
    }

    function isProductType(type: unknown) {
      if (typeof type === "string") return type.toLowerCase() === "product";
      if (Array.isArray(type)) {
        return type.some(
          (item) =>
            typeof item === "string" && item.toLowerCase() === "product",
        );
      }
      return false;
    }

    function updateProductNode(node: unknown) {
      if (!isRecord(node)) return;

      if (isProductType(node["@type"])) {
        node.name = title;
        node.description = description;
      }

      if (Array.isArray(node["@graph"])) {
        node["@graph"].forEach(updateProductNode);
      }

      if (isRecord(node.productSchema)) {
        node.productSchema.name = title;
        node.productSchema.description = description;
      }
    }

    updateProductNode(next);

    return next;
  }

  const mediaSummary = useMemo(() => {
    const total = mediaItems.length || seo?.imageSeo.summary.totalImages || 0;
    const missingAlt = mediaItems.length
      ? mediaItems.filter((item) => !item.altText.trim()).length
      : seo?.imageSeo.summary.missingAltText || 0;
    const duplicateAlt = mediaItems.filter(
      (item) => item.isDuplicateAlt,
    ).length;
    const optimized = mediaItems.length
      ? mediaItems.filter((item) => item.isOptimized).length
      : seo?.imageSeo.summary.optimizedImages || 0;

    return { total, missingAlt, duplicateAlt, optimized };
  }, [mediaItems, seo]);

  const validFaqItems = faqItems.filter(
    (faq) => faq.question.trim() && faq.answer.trim(),
  );

  const seoFactorGroups = useMemo(() => groupSeoFactors(seoFactors), [seoFactors]);

  const nextBestFactor = useMemo(() => {
    return seoFactors.find((factor) => factorIsIssue(factor)) || seoFactors.find(
      (factor) => String(factor.status || "").toUpperCase() === "OPTIONAL",
    );
  }, [seoFactors]);

  const seoHealthLabel =
    score >= 85
      ? "Excellent"
      : score >= 70
        ? "Good"
        : score >= 50
          ? "Needs Work"
          : "Critical";

  const totalIssues = seoFactors.length
    ? issueFactorCount
    : seoFactorGroups.reduce(
        (sum, group) => sum + Math.max(0, group.total - group.fixed),
        0,
      );

  const totalFixed = seoFactors.length
    ? passedFactorCount
    : seoFactorGroups.reduce((sum, group) => sum + group.fixed, 0);

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Admin token missing hai. Please login again.");
  }

  const requestBody =
    typeof options?.body === "string" ? options.body : undefined;

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

    console.error("API ERROR DEBUG:", debugPayload);

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
  async function apiFormRequest<T>(
    path: string,
    formData: FormData,
  ): Promise<T> {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin token missing hai. Please login again.");
    }

    const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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
      const message = stringifyApiMessage(
        data,
        `${path} failed: ${response.status} ${response.statusText}`,
      );

      throw new Error(message);
    }

    return data as T;
  }

  function handleUrlHandleChange(value: string) {
    const nextSlug = getSlugFromUrlOrHandle(value);

    setForm((prev) => ({
      ...prev,
      slug: nextSlug,
      canonicalUrl: value,
    }));

    if (originalRedirectSlug && nextSlug && originalRedirectSlug !== nextSlug) {
      setCreateUrlRedirect(true);
    }
  }

  async function createProductUrlRedirectIfNeeded(
    finalSlugOverride?: string,
    finalCanonicalUrlOverride?: string,
  ) {
    const destinationSlug = getSlugFromUrlOrHandle(
      finalSlugOverride || cleanSlug || form.slug || form.canonicalUrl,
    );
    const destinationUrl =
      finalCanonicalUrlOverride ||
      getCanonicalUrlFromHandle(destinationSlug, destinationSlug || productId);

    if (
      !createUrlRedirect ||
      !originalRedirectSlug ||
      !destinationSlug ||
      originalRedirectSlug === destinationSlug
    ) {
      return false;
    }

    const fromPath = `/products/${originalRedirectSlug}`;
    const toPath = `/products/${destinationSlug}`;
    const redirectBody = {
      sourceUrl: fromPath,
      destinationUrl: toPath,
      redirectType: "PERMANENT_301",
      status: "ACTIVE",
      notes: `Product URL redirect from ${fromPath} to ${toPath}`,
    };

    const redirectEndpoints = [
      "/admin/seo/redirects",
      "/admin/seo/url-redirects",
      "/admin/seo/redirects/create",
    ];

    let lastError: unknown = null;

    for (const endpoint of redirectEndpoints) {
      try {
        await apiRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(redirectBody),
        });
        setOriginalSlug(destinationSlug);
        setOriginalCanonicalUrl(destinationUrl);
        setCreateUrlRedirect(false);
        return true;
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("404") && !message.includes("Cannot POST")) {
          throw err;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Redirect create API available nahi hai.");
  }

  function applyMediaList(nextMediaItems: MediaSeoItem[]) {
    const uniqueMediaItems = markDuplicateAltText(
      dedupeMediaItems(nextMediaItems),
    );

    setMediaItems(uniqueMediaItems);

    setSelectedMediaId((prev) => {
      if (prev && uniqueMediaItems.some((item) => item.uniqueKey === prev)) {
        return prev;
      }
      return uniqueMediaItems[0]?.uniqueKey || null;
    });
  }

  function hydrateForm(record: ProductSeoRecord) {
    const hydratedSlug = record.searchMetadata?.slug || "";
    const hydratedCanonicalUrl = record.searchMetadata?.canonicalUrl || "";

    setOriginalSlug((prev) => prev || getSlugFromUrlOrHandle(hydratedSlug || hydratedCanonicalUrl));
    setOriginalCanonicalUrl((prev) => prev || hydratedCanonicalUrl);

    setForm((prev) => ({
      ...prev,

      status: record.status || "DRAFT",

      seoTitle: record.searchMetadata?.seoTitle || "",
      metaDescription: record.searchMetadata?.metaDescription || "",
      primaryKeyword: record.searchMetadata?.primaryKeyword || "",
      secondaryKeywords: arrayToText(record.searchMetadata?.secondaryKeywords),
      slug: hydratedSlug,
      canonicalUrl: hydratedCanonicalUrl,

      structuredDataJsonLd: jsonToText(record.structuredData?.jsonLdPreview),

      faqEnabled: Boolean(record.faqBuilder?.enabled),
    }));

    setFaqItems(
      record.faqBuilder?.faqs?.length
        ? record.faqBuilder.faqs.map((faq, index) => ({
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
  }

  async function loadCatalogOverviewSafely() {
    try {
      const response = await apiRequest<CatalogProductDetailResponse>(
        `/admin/catalog/${productId}/detail`,
      );

      const catalogProduct = getCatalogDetailPayload(response);
      if (!catalogProduct) return;

      const nextName =
        catalogProduct.name || catalogProduct.title || product?.name || "";

      const catalogSeoTitle = getProductFallbackTitle(catalogProduct, nextName);
      const catalogSeoDescription =
        getProductFallbackDescription(catalogProduct);
      const catalogImage =
        getPrimaryCatalogImage(catalogProduct) ||
        catalogProduct.image ||
        product?.image ||
        "";

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              name: nextName,
              title: catalogProduct.title ?? prev.title,
              slug: catalogProduct.slug ?? prev.slug,
              publicUrl: catalogProduct.publicUrl ?? prev.publicUrl,
              price: catalogProduct.price ?? prev.price,
              basePrice: catalogProduct.basePrice ?? prev.basePrice,
              listingPrice: catalogProduct.listingPrice ?? prev.listingPrice,
              originalPrice: catalogProduct.originalPrice ?? prev.originalPrice,
              salePrice: catalogProduct.salePrice ?? prev.salePrice,
              rentalPrice: catalogProduct.rentalPrice ?? prev.rentalPrice,
              rentPrice: catalogProduct.rentPrice ?? prev.rentPrice,
              compareAtPrice:
                catalogProduct.compareAtPrice ?? prev.compareAtPrice,
              currency: catalogProduct.currency ?? prev.currency,
              pricing: catalogProduct.pricing ?? prev.pricing,
              tags: catalogProduct.tags ?? prev.tags,
              images: catalogProduct.images ?? prev.images,
              media: catalogProduct.media ?? prev.media,
              type: catalogProduct.type ?? prev.type,
              status: catalogProduct.status ?? prev.status,
              image: catalogImage || catalogProduct.image || prev.image,
              category: catalogProduct.category ?? prev.category,
              collections: catalogProduct.collections ?? prev.collections,
              seoTitle: catalogProduct.seoTitle ?? prev.seoTitle,
              seoDescription:
                catalogProduct.seoDescription ?? prev.seoDescription,
              metaTitle: catalogProduct.metaTitle ?? prev.metaTitle,
              metaDescription:
                catalogProduct.metaDescription ?? prev.metaDescription,
              description: catalogProduct.description ?? prev.description,
              shortDescription:
                catalogProduct.shortDescription ?? prev.shortDescription,
            }
          : prev,
      );

      setForm((prev) => ({
        ...prev,
        productName: nextName,
        productDescription:
          prev.productDescription ||
          catalogProduct.description ||
          catalogProduct.shortDescription ||
          "",
        slug: catalogProduct.slug || prev.slug,
        seoTitle: prev.seoTitle || catalogSeoTitle,
        metaDescription: prev.metaDescription || catalogSeoDescription,
      }));
    } catch {
      // Catalog detail is optional for this SEO page.
    }
  }

  async function loadMediaSeo(record?: ProductSeoRecord | null) {
    const fallbackMediaItems = markDuplicateAltText(
      dedupeMediaItems(
        record?.imageSeo.images.map((image, index) =>
          normalizeSeoImage(image, index),
        ) ||
          seo?.imageSeo.images.map((image, index) =>
            normalizeSeoImage(image, index),
          ) ||
          [],
      ),
    );

    try {
      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/media`,
      );

      const catalogMediaItems = normalizeCatalogMediaResponse(response);

      if (catalogMediaItems.length) {
        applyMediaList(catalogMediaItems);
        return;
      }

      applyMediaList(fallbackMediaItems);
    } catch {
      applyMediaList(fallbackMediaItems);
    }
  }

  async function loadProductSeo() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<ProductSeoDetailResponse>(
        `/admin/seo/products/${productId}`,
      );

      const payload = getDetailPayload(response);

      if (!payload.product || !payload.seo) {
        throw new Error(
          "Product SEO detail response me product/seo missing hai.",
        );
      }

      setProduct(payload.product);
      setSeo(payload.seo);
      hydrateForm(payload.seo);

      const fallbackTitle = getProductFallbackTitle(
        payload.product,
        payload.seo?.productName || "",
      );
      const fallbackDescription = getProductFallbackDescription(
        payload.product,
      );
      const initialSlug =
        payload.seo.searchMetadata?.slug || payload.product?.slug || "";
      const initialCanonicalUrl =
        payload.seo.searchMetadata?.canonicalUrl || payload.product?.publicUrl || "";

      setOriginalSlug(getSlugFromUrlOrHandle(initialSlug || initialCanonicalUrl));
      setOriginalCanonicalUrl(initialCanonicalUrl);
      setCreateUrlRedirect(false);

      setForm((prev) => ({
        ...prev,
        productName: payload.product?.name || payload.seo?.productName || "",
        productDescription:
          prev.productDescription ||
          payload.product?.description ||
          payload.product?.shortDescription ||
          "",
        seoTitle: prev.seoTitle || fallbackTitle,
        metaDescription: prev.metaDescription || fallbackDescription,
        slug: prev.slug || payload.product?.slug || "",
        canonicalUrl: prev.canonicalUrl || payload.product?.publicUrl || "",
      }));

      await loadCatalogOverviewSafely();
      await loadMediaSeo(payload.seo);
    } catch (err) {
      setProduct(null);
      setSeo(null);
      setMediaItems([]);
      setError(
        err instanceof Error ? err.message : "Product SEO detail load failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function buildSaveBody(finalSlugOverride?: string, finalCanonicalUrlOverride?: string) {
    const syncedSeoTitle = getSyncedSeoTitle();
    const syncedSeoDescription = getSyncedSeoDescription();

    let structuredDataJsonLd: Record<string, unknown> | null = null;

    if (form.structuredDataJsonLd.trim()) {
      structuredDataJsonLd = textToJson(form.structuredDataJsonLd) as Record<
        string,
        unknown
      >;
    }

    structuredDataJsonLd = syncStructuredDataWithSeo(
      structuredDataJsonLd,
      syncedSeoTitle,
      syncedSeoDescription,
    );

    const cleanedSlugForSave =
      finalSlugOverride ||
      getSlugFromUrlOrHandle(
        form.slug || form.canonicalUrl || product?.slug || productId,
      );

    const canonicalUrlForSave =
      finalCanonicalUrlOverride ||
      getCanonicalUrlFromHandle(
        cleanedSlugForSave || form.canonicalUrl || form.slug,
        cleanedSlugForSave || getSlugFromUrlOrHandle(form.slug || product?.slug || productId),
      );

    return {
      status: form.status,

      seoTitle: syncedSeoTitle,
      metaDescription: syncedSeoDescription,
      primaryKeyword: form.primaryKeyword,
      secondaryKeywords: textToArray(form.secondaryKeywords),

      slug: cleanedSlugForSave,
      canonicalUrl: canonicalUrlForSave,
      structuredDataJsonLd,
    };
  }

  async function saveCatalogBasicInfo() {
    const trimmedName = form.productName.trim();
    const requestedSlug = getSlugFromUrlOrHandle(form.slug || form.canonicalUrl);
    const descriptionHtml = form.productDescription.trim();

    if (!trimmedName) {
      throw new Error("Product name empty nahi ho sakta.");
    }

    const body: Record<string, string> = {
      name: trimmedName,
      title: trimmedName,
    };

    if (requestedSlug) {
      body.slug = requestedSlug;
    }

    if (descriptionHtml) {
      body.description = descriptionHtml;
      body.shortDescription = stripHtml(descriptionHtml).slice(0, 180);
    }

    console.log("PATCH basic-info body", body);

    const response = await apiRequest<CatalogProductDetailResponse>(
      `/admin/catalog/${productId}/basic-info`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );

    const updatedProduct = getCatalogDetailPayload(response);
    const finalSlug = getSlugFromUrlOrHandle(
      updatedProduct?.slug || requestedSlug || product?.slug || productId,
    );
    const finalCanonicalUrl = getCanonicalUrlFromHandle(
      finalSlug,
      finalSlug || productId,
    );
    const slugAutoAdjusted = Boolean(
      requestedSlug && finalSlug && requestedSlug !== finalSlug,
    );

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            name: trimmedName,
            title: trimmedName,
            slug: finalSlug || prev.slug,
            publicUrl: finalCanonicalUrl,
            description: descriptionHtml || prev.description,
            shortDescription: descriptionHtml
              ? stripHtml(descriptionHtml).slice(0, 180)
              : prev.shortDescription,
          }
        : prev,
    );

    setForm((prev) => ({
      ...prev,
      productName: trimmedName,
      slug: finalSlug,
      canonicalUrl: finalCanonicalUrl,
    }));

    return {
      requestedSlug,
      finalSlug,
      finalCanonicalUrl,
      slugAutoAdjusted,
    };
  }

  function buildFaqSaveBody() {
    if (!form.faqEnabled) {
      return {
        enabled: false,
        faqs: [],
      };
    }

    const validFaqs = faqItems
      .filter((faq) => faq.question.trim() && faq.answer.trim())
      .map((faq, index) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        sortOrder: index + 1,
      }));

    return {
      enabled: true,
      faqs: validFaqs,
    };
  }

  async function saveFaqs() {
    await apiRequest(`/admin/seo/products/${productId}/faqs`, {
      method: "PATCH",
      body: JSON.stringify(buildFaqSaveBody()),
    });
  }

  function handleStatusChange(nextStatus: SeoStatus) {
    setForm((prev) => ({
      ...prev,
      status: nextStatus,
    }));
  }

  async function saveSeo() {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const catalogSaveResult = await saveCatalogBasicInfo();

      const response = await apiRequest<ProductSeoDetailResponse>(
        `/admin/seo/products/${productId}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            buildSaveBody(
              catalogSaveResult.finalSlug,
              catalogSaveResult.finalCanonicalUrl,
            ),
          ),
        },
      );

      await saveFaqs();
      const redirectCreated = await createProductUrlRedirectIfNeeded(
        catalogSaveResult.finalSlug,
        catalogSaveResult.finalCanonicalUrl,
      );

      const payload = getDetailPayload(response);

      if (payload.product) {
        setProduct((prev) => ({
          ...(payload.product as ProductSummary),
          name:
            form.productName.trim() ||
            payload.product?.name ||
            prev?.name ||
            "",
          title:
            form.productName.trim() ||
            payload.product?.title ||
            prev?.title ||
            "",
        }));
      }

      if (payload.seo) {
        setSeo(payload.seo);
        hydrateForm(payload.seo);
      }

      await loadProductSeo();

      const slugNotice = catalogSaveResult.slugAutoAdjusted
        ? ` Slug already existed, saved as ${catalogSaveResult.finalSlug}.`
        : "";

      setNotice(
        redirectCreated
          ? `Catalog fields, Product SEO and URL redirect saved successfully.${slugNotice}`
          : `Catalog fields and Product SEO saved successfully.${slugNotice}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product SEO save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function getSelectedMediaUpdatePath(media: MediaSeoItem) {
    if (media.type === "image") return `/admin/catalog/images/${media.id}`;
    return `/admin/catalog/media/${media.id}`;
  }

  async function saveSelectedMediaSeo() {
    if (!selectedMedia) return;

    try {
      setIsMediaSaving(true);
      setError(null);
      setNotice(null);

      const nextName = mediaDraft.name.trim();
      const nextAltText = mediaDraft.altText.trim();

      if (!nextName) {
        throw new Error("Media name empty nahi ho sakta.");
      }

      await apiRequest(getSelectedMediaUpdatePath(selectedMedia), {
        method: "PATCH",
        body: JSON.stringify({ name: nextName, altText: nextAltText }),
      });

      setMediaItems((prev) =>
        markDuplicateAltText(
          prev.map((item) =>
            item.uniqueKey === selectedMedia.uniqueKey
              ? {
                  ...item,
                  name: nextName,
                  altText: nextAltText,
                  isMissingAlt: !nextAltText,
                }
              : item,
          ),
        ),
      );

      setNotice("Media name and alt text saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media SEO save failed.");
    } finally {
      setIsMediaSaving(false);
    }
  }

  async function deleteSelectedMedia() {
    if (!selectedMedia) return;

    const confirmed = window.confirm("Selected media delete karna hai?");
    if (!confirmed) return;

    try {
      setActionLoading("delete-media");
      setError(null);
      setNotice(null);

      try {
        await apiRequest(`/admin/catalog/media/${selectedMedia.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        if (selectedMedia.type !== "image") throw err;
        await apiRequest(`/catalog/images/${selectedMedia.id}`, {
          method: "DELETE",
        });
      }

      setMediaItems((prev) =>
        prev.filter((item) => item.uniqueKey !== selectedMedia.uniqueKey),
      );
      setSelectedMediaId(null);
      setNotice("Media deleted successfully.");
      await loadMediaSeo(seo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media delete failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function setSelectedMediaAsPrimary() {
    if (!selectedMedia) return;

    try {
      setActionLoading("set-primary");
      setError(null);
      setNotice(null);

      if (selectedMedia.type === "image") {
        await apiRequest(
          `/admin/catalog/${productId}/images/${selectedMedia.id}/primary`,
          { method: "PATCH" },
        );
      } else {
        const reorderedMediaIds = [
          selectedMedia.id,
          ...mediaItems
            .filter((item) => item.id !== selectedMedia.id)
            .map((item) => item.id),
        ].filter(Boolean);

        await apiRequest(`/admin/catalog/${productId}/media/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ mediaIds: reorderedMediaIds }),
        });
      }

      setMediaItems((prev) =>
        prev.map((item) => ({
          ...item,
          isPrimary: item.uniqueKey === selectedMedia.uniqueKey,
          position: item.uniqueKey === selectedMedia.uniqueKey ? 0 : item.position,
          sortOrder: item.uniqueKey === selectedMedia.uniqueKey ? 0 : item.sortOrder,
        })),
      );
      setNotice(
        selectedMedia.type === "video"
          ? "Primary video updated by moving it to the first media position."
          : "Primary image updated successfully.",
      );
      await loadMediaSeo(seo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Primary media update failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function saveMediaReorder(nextItems: MediaSeoItem[]) {
    try {
      setActionLoading("reorder-media");
      setError(null);
      setNotice(null);

      await apiRequest(`/admin/catalog/${productId}/media/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ mediaIds: nextItems.map((item) => item.id) }),
      });

      setNotice("Media order saved successfully.");
      await loadMediaSeo(seo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media reorder failed.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleMediaDrop(targetKey: string) {
    if (!draggedMediaKey || draggedMediaKey === targetKey) return;

    setMediaItems((prev) => {
      const draggedIndex = prev.findIndex(
        (item) => item.uniqueKey === draggedMediaKey,
      );
      const targetIndex = prev.findIndex(
        (item) => item.uniqueKey === targetKey,
      );

      if (draggedIndex < 0 || targetIndex < 0) return prev;

      const nextItems = [...prev];
      const [draggedItem] = nextItems.splice(draggedIndex, 1);
      nextItems.splice(targetIndex, 0, draggedItem);
      void saveMediaReorder(nextItems);
      return nextItems;
    });

    setDraggedMediaKey(null);
  }

  function getMediaViewLabel(media: MediaSeoItem, index: number) {
    const rawName = `${media.name || getFileName(media.url)}`.toLowerCase();

    if (rawName.includes("front")) return "front view";
    if (rawName.includes("back")) return "back view";
    if (rawName.includes("side")) return "side view";
    if (rawName.includes("detail") || rawName.includes("fabric"))
      return "detail view";
    if (rawName.includes("video")) return "product video";

    const labels = [
      "product video",
      "front view video",
      "back view video",
      "side view video",
      "detail video",
      "styling video",
    ];

    return labels[index % labels.length];
  }

  function buildOptimizedVideoText(media: MediaSeoItem, index: number) {
    const baseTitle =
      form.productName.trim() ||
      product?.title?.trim() ||
      product?.name?.trim() ||
      "Product";
    const category = product?.category?.trim();
    const viewLabel = getMediaViewLabel(media, index);
    const cleanBase = baseTitle.replace(/\s+/g, " ").trim();
    const cleanCategory = category ? category.replace(/\s+/g, " ").trim() : "";

    return {
      name: `${cleanBase} - ${viewLabel.replace(/\b\w/g, (char) => char.toUpperCase())}`,
      altText: [cleanBase, cleanCategory, viewLabel]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    };
  }

  function getVideosNeedingAltOptimization() {
    return mediaItems.filter((item) => {
      if (item.type !== "video") return false;

      const name = item.name.trim().toLowerCase();
      const altText = item.altText.trim().toLowerCase();

      return (
        !name ||
        !altText ||
        item.isMissingAlt ||
        item.isDuplicateAlt ||
        name === "product video" ||
        altText === "product video" ||
        name === "untitled media" ||
        altText === "untitled media"
      );
    });
  }

  async function optimizeVideoAltText() {
    const videoItems = getVideosNeedingAltOptimization();

    let videoAltGenerated = 0;
    let videoNameGenerated = 0;
    let duplicateVideoAltFixed = 0;

    for (let index = 0; index < videoItems.length; index += 1) {
      const media = videoItems[index];
      const generated = buildOptimizedVideoText(media, index);
      const nextName = media.name.trim() ? media.name.trim() : generated.name;
      const nextAltText = generated.altText;

      await apiRequest(`/admin/catalog/media/${media.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: nextName,
          title: nextName,
          altText: nextAltText,
        }),
      });

      if (!media.name.trim()) videoNameGenerated += 1;
      if (!media.altText.trim() || media.isMissingAlt) videoAltGenerated += 1;
      if (media.isDuplicateAlt) duplicateVideoAltFixed += 1;
    }

    return {
      videoAltGenerated,
      videoNameGenerated,
      duplicateVideoAltFixed,
      optimizedVideos: videoItems.length,
    };
  }

  async function optimizeMedia(mode: OptimizeMode = "all") {
    try {
      setActionLoading("media");
      setError(null);
      setNotice(null);
      setIsOptimizeMenuOpen(false);

      const imageIds = mediaItems.length
        ? mediaItems
            .filter((item) => item.type === "image")
            .map((item) => item.id)
            .filter(Boolean)
        : seo?.imageSeo.images.map((image) => image.imageId).filter(Boolean) ||
          [];

      const optimizableVideoItems = mediaItems.filter(
        (item) => item.type === "video" && canOptimizeMediaSize(item),
      );
      const externalVideoCount = mediaItems.filter(
        (item) => item.type === "video" && isExternalMediaSource(item),
      ).length;
      const videoIds = optimizableVideoItems
        .map((item) => item.id)
        .filter(Boolean);

      const shouldOptimizeImageSize =
        imageIds.length > 0 && (mode === "all" || mode === "size");
      const shouldOptimizeImageAlt =
        imageIds.length > 0 && (mode === "all" || mode === "alt");
      const shouldOptimizeVideos =
        videoIds.length > 0 && (mode === "all" || mode === "size");
      const shouldOptimizeVideoAlt =
        (mode === "all" || mode === "alt") &&
        getVideosNeedingAltOptimization().length > 0;

      if (mode === "size" && !imageIds.length && !videoIds.length) {
        throw new Error(
          "Media size optimize karne ke liye koi image/video available nahi hai.",
        );
      }

      if (
        !shouldOptimizeImageSize &&
        !shouldOptimizeImageAlt &&
        !shouldOptimizeVideos &&
        !shouldOptimizeVideoAlt
      ) {
        throw new Error(
          mode === "alt"
            ? "Optimize karne ke liye missing ya duplicate alt text nahi mila."
            : "Optimize karne ke liye koi media available nahi hai.",
        );
      }

      let imageResponse: OptimizeImagesResponse | null = null;
      let videoResponse: OptimizeMediaResponse | null = null;

      if (shouldOptimizeImageSize || shouldOptimizeImageAlt) {
        imageResponse = await apiRequest<OptimizeImagesResponse>(
          `/admin/seo/products/${productId}/images/optimize`,
          {
            method: "POST",
            body: JSON.stringify({
              imageIds,
              generateAltText: shouldOptimizeImageAlt,
              generateCaptions: false,
              compressLargeImages: shouldOptimizeImageSize,
              convertToWebp: shouldOptimizeImageSize,
              outputFormat: shouldOptimizeImageSize ? "webp" : undefined,
              overwriteExisting: true,
              dryRun: false,
            }),
          },
        );
      }

      if (shouldOptimizeVideos) {
        videoResponse = await apiRequest<OptimizeMediaResponse>(
          `/admin/seo/products/${productId}/media/optimize`,
          {
            method: "POST",
            body: JSON.stringify({
              mediaIds: videoIds,
              compressVideos: true,
              outputFormat: "mp4",
              quality: "auto",
              overwriteExisting: true,
              dryRun: false,
            }),
          },
        );
      }

      const videoAltSummary = shouldOptimizeVideoAlt
        ? await optimizeVideoAltText()
        : {
            videoAltGenerated: 0,
            videoNameGenerated: 0,
            duplicateVideoAltFixed: 0,
            optimizedVideos: 0,
          };

      const imageSummary = imageResponse?.data?.summary || imageResponse?.summary || {};
      const optimizedImagesList =
        imageResponse?.data?.optimizedImages || imageResponse?.optimizedImages || [];
      const compressedImages =
        imageSummary.compressedImages ||
        optimizedImagesList.filter((item) =>
          Boolean(item.isOptimized || item.optimizedUrl || item.format === "webp"),
        ).length ||
        0;
      const skippedImages = imageSummary.skippedImages || 0;
      const altGenerated = imageSummary.altGenerated || 0;
      const duplicateAltFixed = imageSummary.duplicateAltFixed || 0;

      const videoSummary = videoResponse?.data?.summary || videoResponse?.summary || {};
      const optimizedVideosList = [
        ...(videoResponse?.data?.optimizedMedia || []),
        ...(videoResponse?.data?.optimizedVideos || []),
        ...(videoResponse?.optimizedMedia || []),
        ...(videoResponse?.optimizedVideos || []),
      ];
      const compressedVideos =
        videoSummary.compressedVideos ||
        videoSummary.optimizedVideos ||
        optimizedVideosList.filter((item) =>
          Boolean(item.isOptimized || item.optimizedUrl || item.status === "optimized"),
        ).length ||
        0;
      const skippedVideos = videoSummary.skippedVideos || videoSummary.skippedMedia || 0;

      const label =
        mode === "all"
          ? "Media size and alt text optimization"
          : mode === "size"
            ? "Media size compression"
            : "Missing / duplicate media alt text optimization";

      const summaryParts = [
        mode === "all" || mode === "size"
          ? `${compressedImages} image compressed`
          : "",
        mode === "all" || mode === "size"
          ? `${compressedVideos} video compressed`
          : "",
        skippedImages ? `${skippedImages} image skipped` : "",
        skippedVideos ? `${skippedVideos} video skipped` : "",
        (mode === "all" || mode === "size") && externalVideoCount
          ? `${externalVideoCount} external video skipped`
          : "",
        mode === "all" || mode === "alt"
          ? `${altGenerated + videoAltSummary.videoAltGenerated} alt generated`
          : "",
        mode === "all" || mode === "alt"
          ? `${duplicateAltFixed + videoAltSummary.duplicateVideoAltFixed} duplicate fixed`
          : "",
      ].filter(Boolean);

      await loadProductSeo();
      await loadMediaSeo(seo);

      setNotice(
        summaryParts.length
          ? `${label} completed: ${summaryParts.join(", ")}.`
          : `${label} completed. No media needed optimization.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Media optimization failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function handleAddMediaClick() {
    mediaInputRef.current?.click();
  }

  async function handleMediaFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    try {
      setActionLoading("media");
      setError(null);
      setNotice(null);

      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const videoFiles = files.filter((file) => file.type.startsWith("video/"));

      if (imageFiles.length) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("images", file));
        await apiFormRequest(`/catalog/${productId}/images`, formData);
      }

      if (videoFiles.length) {
        const formData = new FormData();
        videoFiles.forEach((file) => formData.append("videos", file));
        await apiFormRequest(`/catalog/${productId}/video`, formData);
      }

      const uploadedParts = [
        imageFiles.length
          ? `${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""}`
          : "",
        videoFiles.length
          ? `${videoFiles.length} video${videoFiles.length > 1 ? "s" : ""}`
          : "",
      ].filter(Boolean);

      setNotice(`${uploadedParts.join(" and ")} uploaded successfully.`);
      await loadProductSeo();
      await loadMediaSeo(seo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media upload failed.");
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

  function updateFaqItem(
    id: string,
    field: "question" | "answer",
    value: string,
  ) {
    setFaqItems((prev) =>
      prev.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)),
    );
  }

  function deleteFaqItem(id: string) {
    setFaqItems((prev) =>
      prev
        .filter((faq) => faq.id !== id)
        .map((faq, index) => ({ ...faq, sortOrder: index + 1 })),
    );
  }

  function toggleFaqOpen(id: string) {
    setFaqItems((prev) =>
      prev.map((faq) => ({
        ...faq,
        isOpen: faq.id === id ? !faq.isOpen : faq.isOpen,
      })),
    );
  }

  function openExternalUrl(url: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    loadProductSeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (!selectedMedia) {
      setMediaDraft({ name: "", altText: "" });
      return;
    }

    setMediaDraft({
      name: selectedMedia.name || "",
      altText: selectedMedia.altText || "",
    });
  }, [selectedMedia]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-[1480px]">
          <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-8 text-center">
            <p className="font-medium text-neutral-950">
              Loading Product SEO editor...
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Product-first SEO data backend se aa raha hai.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (error && (!product || !seo)) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-[1480px]">
          <Button asChild variant="outline" className="mb-5 rounded-full">
            <Link href="/admin/seo/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Product SEO
            </Link>
          </Button>

          <Card className="rounded-[1.5rem] border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">
              Product SEO detail load nahi hua.
            </p>
            <p className="mt-2 text-sm text-red-600">{error}</p>

            <Button className="mt-5 rounded-full" onClick={loadProductSeo}>
              Retry
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  if (!product || !seo) return null;

  return (
    <main className="min-h-screen bg-[#f6f6f3] px-4 py-5 sm:px-6 lg:px-8">
      <input
        ref={mediaInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaFilesChange}
      />

      <div className="mx-auto max-w-[1180px]">
        <div className="sticky top-0 z-40 -mx-4 mb-5 border-b border-neutral-200 bg-[#f6f6f3]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <Link href="/admin/seo/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                  Product SEO Workspace
                </p>
                <h1 className="truncate text-xl font-semibold text-neutral-950">
                  {form.productName || product.name}
                </h1>
              </div>
            </div>

            
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-5">
            <Card
              id="overview"
              className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {primaryMedia || product.image ? (
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                    {primaryMedia ? (
                      <MediaPreview media={primaryMedia} compact />
                    ) : (
                      <img
                        src={product.image || ""}
                        alt={form.productName || product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-neutral-100 text-neutral-700">
                      {product.category || "Uncategorized"}
                    </Badge>
                    <Badge className="bg-neutral-100 text-neutral-700">
                      {seo.productType || product.type || "Product"}
                    </Badge>
                  </div>

                  <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-neutral-950">
                    {form.productName || product.name}
                  </h2>
                  <p className="mt-1 break-all text-xs text-neutral-500">
                    Product ID: {product.id}
                  </p>
                </div>
              </div>
            </Card>

            

            <SectionCard
  title="Primary keyword"
  description="Add the focus keyword for this product."
  compact
>
  <Input
    value={form.primaryKeyword}
    onChange={(event) =>
      setForm((prev) => ({
        ...prev,
        primaryKeyword: event.target.value,
      }))
    }
    className={inputClassName}
    placeholder="Example: pink satin trousers"
  />
</SectionCard>

            <SectionCard
              title="Main content"
              description="Edit product title and product description for this product."
            >
              <div className="space-y-5">
                <Field label="Title">
                  <Input
                    value={form.productName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        productName: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="Product title"
                  />
                </Field>

                <div className="block min-w-0">
  <p className="mb-2 text-sm font-medium text-neutral-950">Description</p>

  <RichTextEditor
    value={form.productDescription}
    onChange={(html) =>
      setForm((prev) => ({
        ...prev,
        productDescription: html,
      }))
    }
    productId={productId}
    minHeightClass="min-h-[320px]"
    maxHeightClass="max-h-[520px]"
  />
</div>
              </div>
            </SectionCard>

            <SectionCard
              title="Meta tags"
              description="Google preview, custom meta data, URL handle and URL analysis."
            >
              <div className="space-y-5">
                <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-none">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-950">
                      Google preview
                    </p>
                    <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          previewDevice === "mobile"
                            ? "bg-neutral-950 text-white"
                            : "text-neutral-600 hover:bg-white"
                        }`}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          previewDevice === "desktop"
                            ? "bg-neutral-950 text-white"
                            : "text-neutral-600 hover:bg-white"
                        }`}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border border-neutral-200 bg-white p-4 transition-all ${
                      previewDevice === "mobile"
                        ? "max-w-[390px]"
                        : "w-full"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-500">
                        S
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm leading-5 text-neutral-800">
                          Shahsi
                        </p>
                        <p className="line-clamp-1 text-xs leading-5 text-neutral-500">
                          {previewDomain} › {previewPath}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`mt-3 line-clamp-2 font-medium leading-6 text-[#1a0dab] ${
                        previewDevice === "mobile" ? "text-lg" : "text-xl"
                      }`}
                    >
                      {previewTitle || "SEO title preview"}
                    </p>
                    <p
                      className={`mt-1 text-sm leading-6 text-[#4d5156] ${
                        previewDevice === "mobile" ? "line-clamp-3" : "line-clamp-2"
                      }`}
                    >
                      {previewDescription}
                    </p>
                  </div>
                </Card>

                <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-neutral-950">
                          Custom meta data
                        </p>
                        <button
                          type="button"
                          onClick={() => setCustomMetaEnabled((prev) => !prev)}
                          className={`relative h-6 w-11 rounded-full transition ${
                            customMetaEnabled ? "bg-neutral-950" : "bg-neutral-300"
                          }`}
                          aria-label="Toggle custom meta data"
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              customMetaEnabled ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        When enabled, custom meta data will override the generated meta tag settings.
                      </p>
                    </div>
                  </div>

                  {customMetaEnabled ? (
                    <div className="mt-5 space-y-5">
                      <Field label={`Meta title (${titleCount}/${META_TITLE_MAX})`}>
                        <Input
                          value={form.seoTitle}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              seoTitle: event.target.value,
                            }))
                          }
                          className={inputClassName}
                          placeholder="Black Convertible Bridesmaid Dress | Satin Maxi Gown"
                        />
                        <Helper good={titleCount >= META_TITLE_MIN && titleCount <= META_TITLE_MAX}>
  Recommended length: {META_TITLE_MIN}-{META_TITLE_MAX} characters.
</Helper>
                      </Field>

                      <Field label={`Meta description (${metaCount}/${META_DESCRIPTION_MAX})`}>
                        <Textarea
                          value={form.metaDescription}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              metaDescription: event.target.value,
                            }))
                          }
                          className="min-h-24 w-full rounded-xl border-neutral-200 bg-white text-sm leading-6 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                          placeholder="Shop a black designer multiway bridesmaid dress..."
                        />
                        <Helper
  good={
    metaCount >= META_DESCRIPTION_MIN &&
    metaCount <= META_DESCRIPTION_MAX
  }
>
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
                          const nextSlug = getSlugFromUrlOrHandle(
                            form.canonicalUrl || form.slug || product?.slug || productId,
                          );

                          setForm((prev) => ({
                            ...prev,
                            slug: nextSlug,
                            canonicalUrl: getCanonicalUrlFromHandle(
                              prev.canonicalUrl || nextSlug,
                              nextSlug || product?.slug || productId,
                            ),
                          }));
                        }}
                        className={inputClassName}
                        placeholder={`${PUBLIC_FRONTEND_URL}/products/product-url-handle`}
                      />
                    </Field>

                    {hasUrlChanged ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={createUrlRedirect}
                            onChange={(event) =>
                              setCreateUrlRedirect(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-neutral-300"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-neutral-950">
                              Create a URL redirect
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-neutral-600">
                              Old product URL will automatically redirect to the new URL after save.
                            </span>
                          </span>
                        </label>

                        <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center">
                          <span className="min-w-0 rounded-full bg-white px-3 py-1.5 text-neutral-600">
                            {originalRedirectSlug}
                          </span>
                          <span className="text-neutral-400">→</span>
                          <span className="min-w-0 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                            {cleanSlug}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        SEO checks
                      </p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        These checks update live from title, description and URL handle.
                      </p>
                    </div>
                    <Badge className="bg-white text-neutral-700">
                      {
                        [
                          isUrlAdded,
                          isTitleAdded,
                          isDescriptionAdded,
                          isTitleLengthGood,
                          isDescriptionLengthGood,
                        ].filter(Boolean).length
                      }
                      /5 fixed
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <AnalysisCheck
                      good={isUrlAdded}
                      title="URL added"
                      description={
                        isUrlAdded
                          ? "URL handle is connected."
                          : "Add a URL handle for this product."
                      }
                    />
                    <AnalysisCheck
                      good={isTitleAdded}
                      title="Title added"
                      description={
                        isTitleAdded
                          ? "Meta title is available."
                          : "Add a meta title for search preview."
                      }
                    />
                    <AnalysisCheck
                      good={isDescriptionAdded}
                      title="Description added"
                      description={
                        isDescriptionAdded
                          ? "Meta description is available."
                          : "Add a meta description for search results."
                      }
                    />
                    <AnalysisCheck
                      good={isTitleLengthGood}
                      title="Title length"
                      description={`${titleAnalysisCount}/${META_TITLE_MAX} characters. Recommended ${META_TITLE_MIN}-${META_TITLE_MAX}.`}
                    />
                    <AnalysisCheck
                      good={isDescriptionLengthGood}
                      title="Description length"
                      description={`${descriptionAnalysisCount}/${META_DESCRIPTION_MAX} characters. Recommended ${META_DESCRIPTION_MIN}-${META_DESCRIPTION_MAX}.`}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <div id="media-seo">
              <SectionCard
                title="Media"
                description="Optimize product images and videos to improve page speed and SEO."
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <MiniStat label="Total Media" value={mediaSummary.total} />
                    <MiniStat
                      label="Missing Alt"
                      value={mediaSummary.missingAlt}
                    />
                    <MiniStat
                      label="Duplicate Alt"
                      value={mediaSummary.duplicateAlt}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl bg-white"
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={handleAddMediaClick}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add Media
                    </Button>

                    <div className="relative">
                      <Button
                        variant="outline"
                        className="rounded-xl bg-white"
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => setIsOptimizeMenuOpen((prev) => !prev)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {actionLoading === "media"
                          ? "Optimizing..."
                          : "Optimize all"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>

                      {isOptimizeMenuOpen ? (
                        <Card className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border-neutral-200 bg-white p-2 shadow-xl">
                          <button
                            type="button"
                            className="w-full rounded-xl px-3 py-2 text-left hover:bg-neutral-100"
                            onClick={() => optimizeMedia("all")}
                          >
                            <p className="text-sm font-semibold text-neutral-950">
                              Optimize all
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Compress hosted images/videos + optimize image/video alt
                              text
                            </p>
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-xl px-3 py-2 text-left hover:bg-neutral-100"
                            onClick={() => optimizeMedia("size")}
                          >
                            <p className="text-sm font-semibold text-neutral-950">
                              Optimize media size
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Compress images to WebP and hosted videos to optimized MP4
                            </p>
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-xl px-3 py-2 text-left hover:bg-neutral-100"
                            onClick={() => optimizeMedia("alt")}
                          >
                            <p className="text-sm font-semibold text-neutral-950">
                              Optimize media alt
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Generate or improve missing / duplicate media alt
                              text
                            </p>
                          </button>
                        </Card>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <div className="grid grid-cols-[44px_96px_minmax(0,1fr)] border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    <span />
                    <span>Media</span>
                    <span>Details</span>
                  </div>

                  {mediaItems.length ? (
                    <div className="divide-y divide-neutral-100">
                      {mediaItems.map((media) => {
                        const isSelected =
                          selectedMedia?.uniqueKey === media.uniqueKey;

                        return (
                          <div
                            key={media.uniqueKey}
                            draggable
                            onDragStart={() =>
                              setDraggedMediaKey(media.uniqueKey)
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleMediaDrop(media.uniqueKey)}
                            onDragEnd={() => setDraggedMediaKey(null)}
                            onClick={() => setSelectedMediaId(media.uniqueKey)}
                            className={`grid cursor-pointer grid-cols-[44px_96px_minmax(0,1fr)] items-center gap-4 px-4 py-4 transition hover:bg-neutral-50 ${
                              isSelected ? "bg-neutral-50" : "bg-white"
                            }`}
                          >
                            <span className="text-center text-neutral-400">
                              ⋮⋮
                            </span>
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 p-1.5">
                              <MediaPreview media={media} compact />
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="rounded-xl border border-neutral-100 bg-[#fbfaf6] px-3 py-2">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                    Title
                                  </p>
                                  <Badge className="bg-white text-neutral-700">
                                    {media.type === "video" ? "Video" : "Image"}
                                  </Badge>
                                  {media.isPrimary ? (
                                    <Badge className="bg-emerald-50 text-emerald-700">
                                      Primary
                                    </Badge>
                                  ) : null}
                                  {media.isExternalVideo ? (
                                    <Badge className="bg-white text-neutral-700">
                                      External
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="whitespace-normal break-words text-sm leading-5 text-neutral-800">
                                  {media.name || "Untitled media"}
                                </p>
                              </div>
                              <div className="rounded-xl border border-neutral-100 bg-[#fbfaf6] px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Alt text
                                </p>
                                <p className="mt-1 whitespace-normal break-words text-sm leading-5 text-neutral-800">
                                  {media.altText || "Alt text missing"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState text="No media SEO data found." />
                    </div>
                  )}
                </div>

                {selectedMedia ? (
                  <Card className="mt-5 rounded-3xl border-neutral-200 bg-[#fbfaf6] p-4 shadow-none">
                    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
                      <div>
                        <div className="flex h-80 items-center justify-center overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 p-4">
                          <MediaPreview media={selectedMedia} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge className="bg-white text-neutral-700">
                            {selectedMedia.type === "video" ? "Video preview" : "Image preview"}
                          </Badge>
                          {selectedMedia.isPrimary ? (
                            <Badge className="bg-emerald-50 text-emerald-700">
                              Primary media
                            </Badge>
                          ) : null}
                          {selectedMedia.isOptimized ? (
                            <Badge className="bg-emerald-50 text-emerald-700">
                              Optimized
                            </Badge>
                          ) : null}
                        </div>

                        <MediaOptimizationCard media={selectedMedia} />
                      </div>

                      <div className="min-w-0 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            Edit selected media
                          </p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            Update title and alt text. Video previews are playable here, and images/videos can both be set as primary media.
                          </p>
                        </div>

                        <Field label="Media title">
                          <Input
                            value={mediaDraft.name}
                            onChange={(event) =>
                              setMediaDraft((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className={inputClassName}
                            placeholder="Media title"
                          />
                        </Field>

                        <Field label="Alt text">
                          <Textarea
                            value={mediaDraft.altText}
                            onChange={(event) =>
                              setMediaDraft((prev) => ({
                                ...prev,
                                altText: event.target.value,
                              }))
                            }
                            className="min-h-28 w-full rounded-xl border-neutral-200 bg-white text-sm leading-6 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                            placeholder="Describe this media clearly for accessibility and SEO"
                          />
                        </Field>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            className="rounded-xl bg-neutral-950"
                            disabled={isMediaSaving}
                            onClick={saveSelectedMediaSeo}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {isMediaSaving
                              ? "Saving Media..."
                              : "Save Media SEO"}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl bg-white"
                            disabled={actionLoading !== null}
                            onClick={setSelectedMediaAsPrimary}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {actionLoading === "set-primary"
                              ? "Setting..."
                              : selectedMedia.type === "video"
                                ? "Set Video Primary"
                                : "Set Primary"}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-50"
                            disabled={actionLoading !== null}
                            onClick={deleteSelectedMedia}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {actionLoading === "delete-media"
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </SectionCard>
            </div>

            <div id="faq-builder">
              <SectionCard
                title="FAQs builder"
                description="Create product FAQs and preview how they can appear in rich search results."
              >
                <div
                  className={`rounded-3xl border p-4 transition ${
                    form.faqEnabled
                      ? "border-neutral-200 bg-[#fbfaf6]"
                      : "border-dashed border-neutral-300 bg-neutral-50/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-950">
                          Enable FAQ rich results
                        </p>
                        <Badge
                          className={
                            form.faqEnabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600"
                          }
                        >
                          {form.faqEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {form.faqEnabled ? (
                          <Badge className="bg-white text-neutral-700">
                            {validFaqItems.length} valid FAQ
                            {validFaqItems.length === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                        Turn this on only when you want FAQ schema for this product.
                        Questions and answers will stay hidden until FAQ rich results are enabled.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          faqEnabled: !prev.faqEnabled,
                        }));

                        if (!form.faqEnabled && faqItems.length === 0) {
                          setFaqItems([
                            {
                              id: `faq-${Date.now()}`,
                              question: "",
                              answer: "",
                              sortOrder: 1,
                              isOpen: true,
                            },
                          ]);
                        }
                      }}
                      className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                        form.faqEnabled ? "bg-neutral-950" : "bg-neutral-300"
                      }`}
                      aria-label="Toggle FAQs"
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                          form.faqEnabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {!form.faqEnabled ? (
                  <div className="mt-5 rounded-3xl border border-neutral-200 bg-white p-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div>
                        <p className="text-base font-semibold text-neutral-950">
                          FAQ editor is currently hidden
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                          Enable FAQs to add questions, write answers, and see the
                          Google-style rich result preview for this product.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <FaqStatusPill label="Schema" value="Off" />
                          <FaqStatusPill label="Valid FAQs" value="0" />
                          <FaqStatusPill label="Preview" value="Hidden" />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-dashed border-neutral-200 bg-[#fbfaf6] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Preview locked
                        </p>
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
                          <h3 className="text-sm font-semibold text-neutral-950">
                            Question & Answer
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            Add concise questions with helpful answers. Empty rows will not be saved.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-xl bg-white"
                          type="button"
                          onClick={addFaqItem}
                        >
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
                              <Card
                                key={faq.id}
                                className={`overflow-hidden rounded-2xl border shadow-none transition ${
                                  faq.isOpen
                                    ? "border-neutral-300 bg-white"
                                    : "border-neutral-200 bg-[#fbfaf6]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 p-4">
                                  <button
                                    type="button"
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    onClick={() => toggleFaqOpen(faq.id)}
                                  >
                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                        isComplete
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {index + 1}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-semibold text-neutral-950">
                                        {faq.question || "Untitled question"}
                                      </span>
                                      <span className="mt-1 block text-xs text-neutral-500">
                                        {isComplete
                                          ? "Ready for FAQ schema"
                                          : hasQuestion
                                            ? "Answer missing"
                                            : "Question and answer missing"}
                                      </span>
                                    </span>
                                  </button>

                                  <div className="flex shrink-0 items-center gap-1">
                                    <Badge
                                      className={
                                        isComplete
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-amber-50 text-amber-700"
                                      }
                                    >
                                      {isComplete ? "Ready" : "Draft"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={() => toggleFaqOpen(faq.id)}
                                      className="rounded-xl"
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          faq.isOpen ? "rotate-180" : ""
                                        }`}
                                      />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={() => deleteFaqItem(faq.id)}
                                      className="rounded-xl hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>

                                {faq.isOpen ? (
                                  <div className="border-t border-neutral-100 bg-white p-4">
                                    <div className="grid gap-4">
                                      <Field label="Question">
                                        <Input
                                          value={faq.question}
                                          onChange={(event) =>
                                            updateFaqItem(
                                              faq.id,
                                              "question",
                                              event.target.value,
                                            )
                                          }
                                          className={inputClassName}
                                          placeholder="Example: What fabric are these pants made from?"
                                        />
                                      </Field>
                                      <Field label="Answer">
                                        <Textarea
                                          value={faq.answer}
                                          onChange={(event) =>
                                            updateFaqItem(
                                              faq.id,
                                              "answer",
                                              event.target.value,
                                            )
                                          }
                                          className="min-h-28 w-full rounded-xl border-neutral-200 bg-white text-sm leading-6 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                                          placeholder="Write a clear answer that helps customers and search engines understand the product."
                                        />
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
                          <p className="text-sm font-semibold text-neutral-950">
                            No FAQ questions yet
                          </p>
                          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                            Add your first question to start building FAQ schema for this product.
                          </p>
                          <Button
                            className="mt-4 rounded-xl bg-neutral-950"
                            type="button"
                            onClick={addFaqItem}
                          >
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
                            <p className="text-sm font-semibold text-neutral-950">
                              Google FAQ preview
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Live preview from valid questions only.
                            </p>
                          </div>
                          <Badge className="bg-neutral-100 text-neutral-700">
                            {validFaqItems.length} item
                            {validFaqItems.length === 1 ? "" : "s"}
                          </Badge>
                        </div>

                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                          <p className="line-clamp-2 text-base font-medium leading-6 text-[#1a0dab]">
                            {previewTitle || productName}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-emerald-700">
                            {effectiveCanonicalUrl}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#4d5156]">
                            {previewDescription}
                          </p>

                          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white">
                            <div className="border-b border-neutral-100 px-4 py-3">
                              <p className="text-sm font-semibold text-neutral-950">
                                FAQs
                              </p>
                            </div>
                            {validFaqItems.length ? (
                              <div className="divide-y divide-neutral-100">
                                {validFaqItems.map((faq) => (
                                  <div key={faq.id} className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleFaqOpen(faq.id)}
                                      className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                      <span className="line-clamp-2 text-sm font-medium leading-5 text-neutral-950">
                                        {faq.question}
                                      </span>
                                      <ChevronDown
                                        className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                                          faq.isOpen ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>
                                    {faq.isOpen ? (
                                      <p className="mt-3 text-sm leading-6 text-neutral-600">
                                        {faq.answer}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4">
                                <p className="text-sm leading-6 text-neutral-500">
                                  Complete at least one question and answer to see FAQ rich result preview.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>

            
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card className="rounded-2xl border-neutral-200 bg-white p-5 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-500">
                  Your SEO score
                </p>
                <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-neutral-100">
                  <div>
                    <p
                      className={`text-5xl font-semibold ${scoreClass(score)}`}
                    >
                      {score}
                    </p>
                    <p className="text-xs text-neutral-400">/100</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
                  <span className="text-red-600">Issues: {totalIssues}</span>
                  <span className="text-emerald-700">Passed: {totalFixed}</span>
                  {optionalFactorCount ? (
                    <span className="text-blue-700">Optional: {optionalFactorCount}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  {seoHealthLabel} · PDF-based score
                </p>
              </div>

              <Button
                className="mt-5 w-full rounded-xl bg-neutral-950"
                onClick={saveSeo}
                disabled={isSaving || actionLoading !== null}
              >
                {isSaving ? "Saving..." : "Save SEO changes"}
              </Button>
            </Card>

            <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                {seoFactorGroups.length ? (
                  seoFactorGroups.map((group) => (
                    <IssueGroupCard key={group.label} group={group} />
                  ))
                ) : (
                  <EmptyState text="Save SEO once to load the PDF ranking factor checklist." />
                )}
              </div>
            </Card>

            <Card className="rounded-2xl border-neutral-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-950">
                Next best action
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {nextBestFactor
                  ? `${nextBestFactor.label}: ${nextBestFactor.message}`
                  : "All available SEO ranking checks look good."}
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
const inputClassName =
  "h-11 w-full rounded-xl border-neutral-200 bg-white text-sm shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950";

const selectClassName =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-neutral-950";

const textareaClassName =
  "min-h-32 w-full rounded-xl border-neutral-200 bg-white text-sm shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950";

function SectionCard({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-neutral-200 bg-white shadow-sm">
      <div className={compact ? "border-b border-neutral-100 px-5 py-3 sm:px-6" : "border-b border-neutral-100 px-5 py-4 sm:px-6"}>
        <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-neutral-500">
          {description}
        </p>
      </div>
      <div className={compact ? "px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2" : "p-5 sm:p-6"}>
  {children}
</div>
    </Card>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <p className="mb-2 text-sm font-medium text-neutral-950">{label}</p>
      {children}
    </label>
  );
}

function Helper({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <p
      className={`mt-2 text-xs ${good ? "text-emerald-700" : "text-amber-700"}`}
    >
      {children}
    </p>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-[#f7f2ea] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function MediaOptimizationCard({ media }: { media: MediaSeoItem }) {
  const originalSize = getOriginalMediaSize(media);
  const optimizedSize = getOptimizedMediaSize(media);
  const reductionPercent = getMediaReductionPercent(media);
  const hasOptimizedUrl = Boolean(media.optimizedUrl || media.isOptimized);
  const isExternal = media.type === "video" && isExternalMediaSource(media);
  const format = (media.format || (media.type === "image" ? "webp" : "mp4")).toUpperCase();

  if (isExternal) {
    return (
      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
              External video source
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-950">
              YouTube/Vimeo size is not stored locally
            </p>
          </div>
          <Badge className="bg-white text-blue-700">External</Badge>
        </div>
        <p className="mt-3 text-xs leading-5 text-neutral-600">
          External videos are hosted outside your media library, so original/compressed file size cannot be calculated here. Optimize media size will skip this item. Uploaded product videos can be compressed by the backend and will show original size, compressed size and saved percentage.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Size optimization
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {hasOptimizedUrl
              ? `${media.type === "video" ? "Video" : "Image"} compressed`
              : "Not optimized yet"}
          </p>
        </div>
        <Badge
          className={
            hasOptimizedUrl
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }
        >
          {hasOptimizedUrl ? format : "Pending"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <OptimizationMetric
          label="Original"
          value={formatFileSize(originalSize)}
        />
        <OptimizationMetric
          label="Compressed"
          value={optimizedSize ? formatFileSize(optimizedSize) : "Not available"}
          emphasized={Boolean(optimizedSize)}
        />
        <OptimizationMetric
          label="Saved"
          value={
            typeof reductionPercent === "number"
              ? `${Math.round(reductionPercent)}%`
              : "Not available"
          }
          emphasized={typeof reductionPercent === "number" && reductionPercent > 0}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-neutral-500">
        {hasOptimizedUrl
          ? media.type === "video"
            ? "Optimized video URL is used for playback when available."
            : "Optimized WebP URL is used for image preview when available."
          : media.type === "video"
            ? "Click Optimize media size to compress this video."
            : "Click Optimize media size to convert this image to WebP."}
      </p>
    </div>
  );
}

function OptimizationMetric({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        emphasized
          ? "border-emerald-100 bg-emerald-50/70"
          : "border-neutral-100 bg-[#fbfaf6]"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          emphasized ? "text-emerald-700" : "text-neutral-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MediaPreview({
  media,
  compact,
}: {
  media: MediaSeoItem;
  compact?: boolean;
}) {
  const playbackUrl = getMediaPlaybackUrl(media);

  if (
    media.type === "video" ||
    isVideoUrl(playbackUrl) ||
    isExternalVideoUrl(playbackUrl)
  ) {
    if (isExternalVideoUrl(playbackUrl)) {
      const thumbnailUrl = getExternalVideoThumbnailUrl({ ...media, url: playbackUrl });
      const embedUrl = getExternalVideoEmbedUrl(playbackUrl);

      return compact ? (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-950">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={media.name || "Video thumbnail"}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-900 px-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <Send className="h-4 w-4" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-medium text-white/80">
                {media.name || "External video"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={media.name || "Video preview"}
          className="h-full min-h-[220px] w-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={playbackUrl}
        controls={!compact}
        muted={compact}
        className="h-full max-h-full w-full max-w-full object-contain"
      />
    );
  }

  return (
    <img
      src={playbackUrl}
      alt={media.altText || media.name || "Media preview"}
      className="h-full max-h-full w-full max-w-full object-contain"
    />
  );
}

function ScoreRow({
  label,
  value,
  max = 100,
  compact,
}: {
  label: string;
  value: number;
  max?: number;
  compact?: boolean;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl ${
        compact ? "py-1.5" : "border border-neutral-100 bg-[#f7f2ea] p-4"
      }`}
    >
      <span className="min-w-0 truncate text-sm font-medium text-neutral-700">
        {label}
      </span>
      <span
        className={`shrink-0 text-sm font-semibold ${scoreClass(percentage)}`}
      >
        {value}/{max}
      </span>
    </div>
  );
}




function FaqStatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function AnalysisCheck({
  good,
  title,
  description,
}: {
  good: boolean;
  title: string;
  description: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        good
          ? "border-emerald-100 bg-emerald-50/60"
          : "border-amber-100 bg-amber-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            good ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          }`}
        >
          {good ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckLine({ good, text }: { good: boolean; text: string }) {
  return (
    <p className={good ? "text-emerald-700" : "text-amber-700"}>
      <span className="mr-2">•</span>
      {text}
    </p>
  );
}

function SeoFactorCard({ factor }: { factor: SeoScoreFactor }) {
  return (
    <div className={`rounded-2xl border p-4 ${factorStatusClass(factor.status)}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold">
          {factorStatusIcon(factor.status)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-950">
              {factor.label}
            </p>
            <span className="text-xs font-semibold">
              {factor.score}/{factor.maxScore}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            {factor.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function IssueGroupCard({ group }: { group: SeoFactorGroup }) {
  return (
    <details className="group rounded-xl border border-neutral-100 bg-[#fbfaf6] p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-950">
          {group.label}
        </span>
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
                <p className="text-xs font-semibold leading-5 text-neutral-950">
                  {factor.label}
                </p>
                <p className="text-xs leading-5 text-neutral-500">
                  {factor.message}
                </p>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-[#f7f2ea] p-4">
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
  );
}

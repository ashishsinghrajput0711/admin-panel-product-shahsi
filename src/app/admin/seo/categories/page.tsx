"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/admin-auth";

const PAGE_SIZE = 20;

type CategoryStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortBy = "tree" | "name" | "slug" | "seoScore" | "level";
type SortOrder = "asc" | "desc";

type CategoryTreeNode = {
  id?: string | null;
  _id?: string | null;
  categoryId?: string | null;
  taxonomyId?: string | number | null;

  name?: string | null;
  title?: string | null;
  label?: string | null;

  slug?: string | null;
  handle?: string | null;

  image?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  optimizedUrl?: string | null;
  mediaUrl?: string | null;
  categoryImage?: string | null;
  categoryImageUrl?: string | null;
  imageAltText?: string | null;

  fullPath?: string | null;
  path?: string | null;
  categoryPath?: string | null;

  parentId?: string | null;
  parentName?: string | null;

  level?: number | null;
  depth?: number | null;

  isActive?: boolean | null;
  active?: boolean | null;
  isLeaf?: boolean | null;

  productCount?: number | string | null;
  productsCount?: number | string | null;
  count?: number | string | null;
  totalProducts?: number | string | null;

  seoScore?: number | string | null;
  score?: number | string | null;
  overallScore?: number | string | null;
  seoStatus?: string | null;
  status?: string | null;

  updatedAt?: string | null;
  createdAt?: string | null;

  children?: CategoryTreeNode[] | null;
};

type CategoryTreeResponse =
  | CategoryTreeNode[]
  | {
      success?: boolean;
      data?:
        | CategoryTreeNode[]
        | {
            categories?: CategoryTreeNode[];
            tree?: CategoryTreeNode[];
            items?: CategoryTreeNode[];
            results?: CategoryTreeNode[];
          };
      categories?: CategoryTreeNode[];
      tree?: CategoryTreeNode[];
      items?: CategoryTreeNode[];
      results?: CategoryTreeNode[];
      message?: string | string[];
    };
type CategorySeoListResponse =
  | unknown[]
  | {
      success?: boolean;
      data?:
        | unknown[]
        | {
            categories?: unknown[];
            items?: unknown[];
            results?: unknown[];
          };
      categories?: unknown[];
      items?: unknown[];
      results?: unknown[];
      message?: string | string[];
    };

type SeoScoreMergeInfo = {
  score: number | null;
  status: string;
  updatedAt: string | null;
  imageUrl: string | null;
};

type CategorySeoListItem = {
  id: string;
  name: string;
  slug: string;
  path: string;
  parentName: string | null;
  level: number;
  isActive: boolean;
  isLeaf: boolean;
  productCount: number;
  imageUrl: string | null;
  seoScore: number | null;
  seoStatus: string;
  updatedAt: string | null;
};

const CATEGORY_TREE_QUERY =
  "includeInactive=true&showProductCount=true&showEmpty=true&maxDepth=10";

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }

  return fallback;
}

function getCategoryId(category: CategoryTreeNode) {
  return (
    category.id?.trim() ||
    category.categoryId?.trim() ||
    category._id?.trim() ||
    String(category.taxonomyId || "").trim()
  );
}

function getCategoryName(category: CategoryTreeNode) {
  return (
    category.name?.trim() ||
    category.title?.trim() ||
    category.label?.trim() ||
    "Untitled category"
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategorySlug(category: CategoryTreeNode) {
  return (
    category.slug?.trim() ||
    category.handle?.trim() ||
    slugify(getCategoryName(category))
  );
}

function getCategoryPath(category: CategoryTreeNode) {
  return (
    category.fullPath?.trim() ||
    category.categoryPath?.trim() ||
    category.path?.trim() ||
    getCategorySlug(category)
  );
}

function getCategoryImageUrl(category: CategoryTreeNode) {
  return (
    category.optimizedUrl?.trim() ||
    category.categoryImageUrl?.trim() ||
    category.imageUrl?.trim() ||
    category.categoryImage?.trim() ||
    category.image?.trim() ||
    category.thumbnailUrl?.trim() ||
    category.mediaUrl?.trim() ||
    null
  );
}

function getCategoryProductCount(category: CategoryTreeNode) {
  return toNumber(
    category.productCount ??
      category.productsCount ??
      category.totalProducts ??
      category.count ??
      0,
    0,
  );
}

function getCategorySeoScore(category: CategoryTreeNode) {
  const value =
    category.seoScore ?? category.score ?? category.overallScore ?? null;

  if (value === null || value === undefined || value === "") return null;

  const numeric = toNumber(value, Number.NaN);

  if (!Number.isFinite(numeric)) return null;

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getCategorySeoStatus(category: CategoryTreeNode) {
  const explicitStatus = category.seoStatus || category.status;

  if (typeof explicitStatus === "string" && explicitStatus.trim()) {
    return explicitStatus.trim();
  }

  const score = getCategorySeoScore(category);

  if (score === null) return "Not started";
  if (score > 80) return "Good";
  if (score >= 50) return "Needs improvement";
  return "Poor";
}

function normalizeTreeResponse(
  response: CategoryTreeResponse,
): CategoryTreeNode[] {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response.categories)) return response.categories;
  if (Array.isArray(response.tree)) return response.tree;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.results)) return response.results;

  if (Array.isArray(response.data)) return response.data;

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    if (Array.isArray(response.data.categories))
      return response.data.categories;
    if (Array.isArray(response.data.tree)) return response.data.tree;
    if (Array.isArray(response.data.items)) return response.data.items;
    if (Array.isArray(response.data.results)) return response.data.results;
  }

  return [];
}
function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getStringFromRecord(
  record: Record<string, unknown> | null,
  keys: string[],
) {
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function getNumberFromRecord(
  record: Record<string, unknown> | null,
  keys: string[],
) {
  if (!record) return null;

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

function getImageUrlFromRecord(record: Record<string, unknown> | null): string {
  if (!record) return "";

  const directImage = getStringFromRecord(record, [
    "optimizedUrl",
    "webpUrl",
    "categoryImageUrl",
    "categoryImage",
    "imageUrl",
    "image",
    "thumbnailUrl",
    "thumbnail",
    "mediaUrl",
    "secureUrl",
    "url",
  ]);

  if (directImage) return directImage;

  const nestedRecords = [
    getRecord(record.category),
    getRecord(record.catalogCategory),
    getRecord(record.categoryMaster),
    getRecord(record.data),
    getRecord(record.seo),
  ];

  for (const nestedRecord of nestedRecords) {
    const image = getImageUrlFromRecord(nestedRecord);
    if (image) return image;
  }

  const media = record.media;
  if (Array.isArray(media)) {
    for (const item of media) {
      const itemRecord = getRecord(item);
      const image = getImageUrlFromRecord(itemRecord);
      if (image) return image;
    }
  }

  const mediaSeo = getRecord(record.mediaSeo);
  if (mediaSeo) {
    const seoMedia = mediaSeo.media;
    if (Array.isArray(seoMedia)) {
      for (const item of seoMedia) {
        const itemRecord = getRecord(item);
        const image = getImageUrlFromRecord(itemRecord);
        if (image) return image;
      }
    }
  }

  return "";
}

function normalizeSeoListResponse(
  response: CategorySeoListResponse,
): unknown[] {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response.categories)) return response.categories;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.data)) return response.data;

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    const data = response.data as {
      categories?: unknown[];
      items?: unknown[];
      results?: unknown[];
      records?: unknown[];
      rows?: unknown[];
      data?:
        | unknown[]
        | { categories?: unknown[]; items?: unknown[]; results?: unknown[] };
    };

    if (Array.isArray(data.categories)) return data.categories;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data.data)) return data.data;
    if (
      data.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {
      if (Array.isArray(data.data.categories)) return data.data.categories;
      if (Array.isArray(data.data.items)) return data.data.items;
      if (Array.isArray(data.data.results)) return data.data.results;
    }
  }

  return [];
}

function normalizeSeoScore(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = toNumber(value, Number.NaN);
  if (!Number.isFinite(numeric)) return null;

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getSeoMergeKeys(value: unknown) {
  const record = getRecord(value);
  const dataRecord = getRecord(record?.data);
  const seoRecord =
    getRecord(record?.seo) || getRecord(dataRecord?.seo) || record;
  const categoryRecord =
    getRecord(record?.category) ||
    getRecord(dataRecord?.category) ||
    getRecord(seoRecord?.category);
  const searchMetadataRecord =
    getRecord(seoRecord?.searchMetadata) || getRecord(record?.searchMetadata);
  const contentRecord =
    getRecord(seoRecord?.content) || getRecord(record?.content);

  return Array.from(
    new Set(
      [
        getStringFromRecord(record, ["categoryId", "id", "_id"]),
        getStringFromRecord(seoRecord, ["categoryId", "id", "_id"]),
        getStringFromRecord(categoryRecord, ["id", "categoryId", "_id"]),
        getStringFromRecord(record, ["slug", "handle"]),
        getStringFromRecord(seoRecord, ["slug", "handle"]),
        getStringFromRecord(categoryRecord, ["slug", "handle"]),
        getStringFromRecord(searchMetadataRecord, ["slug"]),
        getStringFromRecord(contentRecord, ["slug"]),
      ].filter(Boolean),
    ),
  );
}

function getSeoMergeInfo(value: unknown): SeoScoreMergeInfo {
  const record = getRecord(value);
  const dataRecord = getRecord(record?.data);
  const seoRecord =
    getRecord(record?.seo) || getRecord(dataRecord?.seo) || record;
  const categoryRecord =
    getRecord(record?.category) ||
    getRecord(dataRecord?.category) ||
    getRecord(seoRecord?.category);
  const breakdownRecord =
    getRecord(seoRecord?.seoScoreBreakdown) ||
    getRecord(record?.seoScoreBreakdown);

  const score = normalizeSeoScore(
    getNumberFromRecord(breakdownRecord, ["overallScore", "score"]) ??
      getNumberFromRecord(seoRecord, ["seoScore", "score", "overallScore"]),
  );

  const status =
    getStringFromRecord(seoRecord, [
      "seoStatus",
      "statusLabel",
      "scoreStatus",
    ]) ||
    getStringFromRecord(record, ["seoStatus", "statusLabel", "scoreStatus"]) ||
    getCategorySeoStatus({ seoScore: score ?? undefined });

  return {
    score,
    status,
    updatedAt:
      getStringFromRecord(seoRecord, ["updatedAt"]) ||
      getStringFromRecord(record, ["updatedAt"]) ||
      getStringFromRecord(categoryRecord, ["updatedAt"]) ||
      null,
    imageUrl:
      getImageUrlFromRecord(categoryRecord) ||
      getImageUrlFromRecord(seoRecord) ||
      getImageUrlFromRecord(record) ||
      null,
  };
}

function mergeSeoScores(
  categories: CategorySeoListItem[],
  seoItems: unknown[],
): CategorySeoListItem[] {
  const seoMap = new Map<string, SeoScoreMergeInfo>();

  seoItems.forEach((item) => {
    const info = getSeoMergeInfo(item);
    getSeoMergeKeys(item).forEach((key) => seoMap.set(key, info));
  });

  return categories.map((category) => {
    const info =
      seoMap.get(category.id) ||
      seoMap.get(category.slug) ||
      seoMap.get(category.path) ||
      null;

    if (!info) return category;

    return {
      ...category,
      seoScore: info.score,
      seoStatus: info.status,
      updatedAt: info.updatedAt || category.updatedAt,
      imageUrl: info.imageUrl || category.imageUrl,
    };
  });
}

function mergeSingleSeoInfo(
  category: CategorySeoListItem,
  info: SeoScoreMergeInfo,
) {
  return {
    ...category,
    seoScore: info.score ?? category.seoScore,
    seoStatus: info.score === null ? category.seoStatus : info.status,
    updatedAt: info.updatedAt || category.updatedAt,
    imageUrl: info.imageUrl || category.imageUrl,
  };
}

function normalizeCategory(
  category: CategoryTreeNode,
  level: number,
  parentName: string | null,
): CategorySeoListItem {
  const name = getCategoryName(category);
  const slug = getCategorySlug(category);
  const path = getCategoryPath(category);
  const id = getCategoryId(category) || slug || path || name;

  const children = Array.isArray(category.children) ? category.children : [];

  const normalizedLevel =
    typeof category.level === "number"
      ? category.level
      : typeof category.depth === "number"
        ? category.depth
        : level;

  return {
    id,
    name,
    slug,
    path,
    parentName: category.parentName?.trim() || parentName,
    level: normalizedLevel,
    isActive:
      typeof category.isActive === "boolean"
        ? category.isActive
        : typeof category.active === "boolean"
          ? category.active
          : true,
    isLeaf:
      typeof category.isLeaf === "boolean"
        ? category.isLeaf
        : children.length === 0,
    productCount: getCategoryProductCount(category),
    imageUrl: getCategoryImageUrl(category),
    seoScore: getCategorySeoScore(category),
    seoStatus: getCategorySeoStatus(category),
    updatedAt: category.updatedAt || null,
  };
}

function flattenCategories(
  items: CategoryTreeNode[],
  level = 0,
  parentName: string | null = null,
): CategorySeoListItem[] {
  return items.flatMap((category) => {
    const current = normalizeCategory(category, level, parentName);
    const children = Array.isArray(category.children) ? category.children : [];

    return [
      current,
      ...flattenCategories(children, current.level + 1, current.name),
    ];
  });
}

function buildCategoryTreePath() {
  return `/api/proxy/admin/catalog/categories/tree?${CATEGORY_TREE_QUERY}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not updated";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSortByLabel(sortBy: SortBy) {
  switch (sortBy) {
    case "tree":
      return "Tree order";
    case "name":
      return "Category name";
    case "slug":
      return "Slug";
    case "seoScore":
      return "SEO score";
    case "level":
      return "Tree level";
    default:
      return "Category name";
  }
}

function getSortOrderLabel(sortOrder: SortOrder) {
  return sortOrder === "asc" ? "Ascending" : "Descending";
}

function getScoreTone(score: number | null) {
  if (score === null) return "neutral";
  if (score < 50) return "red";
  if (score <= 80) return "amber";
  return "green";
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

  if (
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  ) {
    return String((data as { error?: unknown }).error);
  }

  return fallback;
}

function sortCategories(
  categories: CategorySeoListItem[],
  sortBy: SortBy,
  sortOrder: SortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "tree") return [...categories];

  return [...categories].sort((a, b) => {
    let compare = 0;

    if (sortBy === "name") {
      compare = a.name.localeCompare(b.name);
    }

    if (sortBy === "slug") {
      compare = a.slug.localeCompare(b.slug);
    }

    if (sortBy === "seoScore") {
      compare = (a.seoScore ?? -1) - (b.seoScore ?? -1);
    }

    if (sortBy === "level") {
      compare = a.level - b.level;
    }

    return compare * direction;
  });
}

export default function CategorySeoListPage() {
  const [categories, setCategories] = useState<CategorySeoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<CategoryStatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("tree");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [openMenu, setOpenMenu] = useState<"status" | "sort" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: Array<{ value: CategoryStatusFilter; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: "tree", label: "Tree order" },
    { value: "name", label: "Category name" },
    { value: "slug", label: "Slug" },
    { value: "seoScore", label: "SEO score" },
    { value: "level", label: "Tree level" },
  ];

  const sortSummary = useMemo(
    () => `${getSortByLabel(sortBy)} · ${getSortOrderLabel(sortOrder)}`,
    [sortBy, sortOrder],
  );

  const hasActiveFilters = Boolean(searchQuery || status !== "ALL");

  async function getToken() {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin token missing hai. Please login again.");
    }

    return token;
  }

  async function loadCategories(options?: { refresh?: boolean }) {
    try {
      if (options?.refresh) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);

      const token = await getToken();

      const response = await fetch(buildCategoryTreePath(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const text = await response.text();
      let json: CategoryTreeResponse;

      try {
        json = text ? (JSON.parse(text) as CategoryTreeResponse) : [];
      } catch {
        throw new Error(`Category tree API JSON nahi de rahi. Body: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          stringifyApiMessage(
            json,
            `Category tree API failed: ${response.status} ${response.statusText}`,
          ),
        );
      }

      const tree = normalizeTreeResponse(json);
      const flatCategories = flattenCategories(tree);

      let seoListItems: unknown[] = [];

      try {
        const seoResponse = await fetch(`/api/proxy/admin/seo/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const seoText = await seoResponse.text();
        const seoJson = seoText
          ? (JSON.parse(seoText) as CategorySeoListResponse)
          : [];

        if (seoResponse.ok) {
          seoListItems = normalizeSeoListResponse(seoJson);
        }
      } catch {
        // SEO score list is optional. The table still shows catalog categories.
      }

      const categoriesWithSeoScores = mergeSeoScores(
        flatCategories,
        seoListItems,
      );

      const detailHydratedCategories = await Promise.all(
        categoriesWithSeoScores.map(async (category) => {
          if (category.imageUrl && category.seoScore !== null) return category;

          try {
            const detailResponse = await fetch(
              `/api/proxy/admin/seo/categories/${encodeURIComponent(category.id)}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              },
            );

            if (!detailResponse.ok) return category;

            const detailJson = await detailResponse.json();
            return mergeSingleSeoInfo(category, getSeoMergeInfo(detailJson));
          } catch {
            return category;
          }
        }),
      );

      setCategories(detailHydratedCategories);
      setTotal(detailHydratedCategories.length);
    } catch (err) {
      setCategories([]);
      setTotal(0);
      setError(
        err instanceof Error
          ? err.message
          : "Category SEO categories load nahi ho paaye.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function clearAllFilters() {
    setSearchInput("");
    setSearchQuery("");
    setStatus("ALL");
    setCurrentPage(1);
    setOpenMenu(null);
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(searchInput);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = categories.filter((category) => {
      const matchesSearch = query
        ? [
            category.name,
            category.slug,
            category.path,
            category.parentName || "",
            category.seoStatus,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesStatus =
        status === "ALL"
          ? true
          : status === "ACTIVE"
            ? category.isActive
            : status === "INACTIVE"
              ? !category.isActive
              : true;

      return matchesSearch && matchesStatus;
    });

    return sortCategories(filtered, sortBy, sortOrder);
  }, [categories, searchQuery, status, sortBy, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  const startItem =
    filteredCategories.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredCategories.length);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <main className="min-h-screen bg-[#f6f2ea] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-neutral-900 bg-neutral-950 px-8 py-9 text-white shadow-[0_24px_80px_rgba(20,20,20,0.18)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-72 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                Admin / SEO / Categories
              </p>

              <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
                Category SEO
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
                Search, filter, sort, and manage on-page SEO for catalog
                category landing pages.
              </p>
            </div>
          </div>
        </section>

        <Card className="overflow-visible rounded-[2rem] border-neutral-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(29,24,19,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search in all"
                  className="h-12 rounded-2xl border-neutral-200 bg-[#fbfaf6] pl-11 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl bg-white px-5"
                disabled={isLoading || isRefreshing}
                onClick={() => loadCategories({ refresh: true })}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh categories"}
              </Button>
            </div>

            <div className="relative z-30 flex flex-wrap items-center gap-2">
              <DropdownButton
                activeLabel={
                  status === "ALL"
                    ? "Status"
                    : statusOptions.find((item) => item.value === status)
                        ?.label || "Status"
                }
                isOpen={openMenu === "status"}
                onClick={() =>
                  setOpenMenu(openMenu === "status" ? null : "status")
                }
              />

              <DropdownButton
                activeLabel={sortSummary}
                isOpen={openMenu === "sort"}
                onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
              />

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              ) : null}

              {openMenu === "status" ? (
                <RadioDropdown
                  className="left-0 top-11 w-56"
                  options={statusOptions}
                  value={status}
                  onChange={(value) => {
                    setStatus(value as CategoryStatusFilter);
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                  onClear={() => {
                    setStatus("ALL");
                    setCurrentPage(1);
                    setOpenMenu(null);
                  }}
                />
              ) : null}

              {openMenu === "sort" ? (
                <SortDropdown
                  sortOptions={sortOptions}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}
                  onSortOrderChange={(value) => {
                    setSortOrder(value);
                    setCurrentPage(1);
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-[#fbfaf6] px-4 py-3 text-sm text-neutral-500">
            <p>
              Showing{" "}
              <span className="font-semibold text-neutral-950">
                {paginatedCategories.length}
              </span>{" "}
              categories on this page from{" "}
              <span className="font-semibold text-neutral-950">
                {filteredCategories.length}
              </span>{" "}
              matched categories.
            </p>

            <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Category SEO API error</p>
              <p className="mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <CategoriesTable
              categories={paginatedCategories}
              isLoading={isLoading}
            />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-4 md:flex-row md:items-center">
            <p className="text-sm text-neutral-500">
              Showing {startItem}-{endItem} of {filteredCategories.length}{" "}
              categories
              <span className="ml-1 text-neutral-400">
                ({total} total in tree)
              </span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-white"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={isLoading || currentPage <= 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="rounded-xl border border-neutral-200 bg-[#fbfaf6] px-4 py-2 text-sm font-semibold text-neutral-950">
                {currentPage}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl bg-white"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={isLoading || currentPage >= totalPages}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function DropdownButton({
  activeLabel,
  isOpen,
  onClick,
}: {
  activeLabel: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 max-w-[250px] items-center gap-2 rounded-full border px-3 text-sm font-medium shadow-sm transition ${
        isOpen
          ? "border-neutral-300 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <span className="truncate">{activeLabel}</span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function RadioDropdown({
  options,
  value,
  onChange,
  onClear,
  className = "",
  maxHeightClass = "max-h-72",
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  maxHeightClass?: string;
}) {
  return (
    <Card
      className={`absolute z-50 overflow-hidden rounded-2xl border-neutral-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,15,15,0.18)] ${className}`}
    >
      <div className={`${maxHeightClass} overflow-y-auto pr-1`}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => onChange(option.value)}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-neutral-950" : "border-neutral-300"
                }`}
              >
                {selected ? (
                  <span className="h-2 w-2 rounded-full bg-neutral-950" />
                ) : null}
              </span>

              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-1 w-full rounded-xl px-2.5 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-50 hover:text-neutral-600"
        onClick={onClear}
      >
        Clear
      </button>
    </Card>
  );
}

function SortDropdown({
  sortOptions,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: {
  sortOptions: Array<{ value: SortBy; label: string }>;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (value: SortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
}) {
  return (
    <Card className="absolute left-28 top-11 z-50 w-64 overflow-hidden rounded-2xl border-neutral-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,15,15,0.18)]">
      <p className="px-2.5 pb-1 pt-0 text-sm font-semibold text-neutral-700">
        Sort by
      </p>

      <div>
        {sortOptions.map((option) => {
          const selected = option.value === sortBy;

          return (
            <button
              key={option.value}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => onSortByChange(option.value)}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-neutral-950" : "border-neutral-300"
                }`}
              >
                {selected ? (
                  <span className="h-2 w-2 rounded-full bg-neutral-950" />
                ) : null}
              </span>

              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 border-t border-neutral-100 pt-2">
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-neutral-50 ${
            sortOrder === "asc"
              ? "bg-neutral-100 font-semibold text-neutral-950"
              : "text-neutral-700"
          }`}
          onClick={() => onSortOrderChange("asc")}
        >
          <ArrowUp className="h-4 w-4" />
          Ascending
        </button>

        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-neutral-50 ${
            sortOrder === "desc"
              ? "bg-neutral-100 font-semibold text-neutral-950"
              : "text-neutral-700"
          }`}
          onClick={() => onSortOrderChange("desc")}
        >
          <ArrowDown className="h-4 w-4" />
          Descending
        </button>
      </div>
    </Card>
  );
}

function CategoriesTable({
  categories,
  isLoading,
}: {
  categories: CategorySeoListItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse grid-cols-[minmax(320px,1.45fr)_minmax(190px,0.85fr)_110px_170px_120px] items-center gap-5 px-5 py-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-16 rounded-2xl bg-neutral-200" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-4 w-2/5 rounded-full bg-neutral-200" />
                  <div className="h-3 w-1/3 rounded-full bg-neutral-200" />
                </div>
              </div>
              <div className="h-9 rounded-2xl bg-neutral-100" />
              <div className="h-4 w-10 rounded-full bg-neutral-200" />
              <div className="h-9 rounded-2xl bg-neutral-100" />
              <div className="ml-auto h-10 w-10 rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No categories found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Filters/search ke hisaab se categories nahi mile.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left">
          <thead className="bg-[#f4f0e8]">
            <tr>
              <th className="w-[45%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Category
              </th>
              <th className="w-[21%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Slug
              </th>
              <th className="w-[9%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Level
              </th>
              <th className="w-[17%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                SEO Score
              </th>
              <th className="w-[8%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {categories.map((category) => {
              const indentLevel = Math.max(0, category.level - 1);
              const indent = indentLevel * 34;
              const isRoot = indentLevel === 0;

              return (
                <tr
                  key={`${category.id}-${category.path}`}
                  className="group transition hover:bg-[#fbfaf6]"
                >
                  <td className="px-5 py-3 align-top">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="relative flex min-w-0 flex-1 items-start gap-3"
                        style={{ paddingLeft: `${indent}px` }}
                      >
                        {!isRoot ? (
                          <>
                            <span
                              className="absolute top-0 h-full w-px bg-neutral-200"
                              style={{ left: `${Math.max(0, indent - 18)}px` }}
                            />
                            <span
                              className="absolute top-8 h-px w-5 bg-neutral-200"
                              style={{ left: `${Math.max(0, indent - 18)}px` }}
                            />
                          </>
                        ) : null}

                        <span
                          className={`mt-5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isRoot
                              ? "border-neutral-300 bg-white text-neutral-600"
                              : "border-neutral-200 bg-[#fbfaf6] text-neutral-400"
                          }`}
                        >
                          {category.isLeaf ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>

                        <CategoryImagePreview
                          imageUrl={category.imageUrl}
                          name={category.name}
                        />

                        <div className="min-w-0 flex-1 pt-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/seo/categories/${encodeURIComponent(category.id)}`}
                              className="whitespace-normal break-words text-[15px] font-semibold leading-6 text-neutral-950 transition hover:text-neutral-700 hover:underline"
                            >
                              {category.name}
                            </Link>

                            <Badge
                              className={
                                category.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>

                            <Badge className="bg-white text-neutral-600">
                              {isRoot ? "Parent" : `Child L${category.level}`}
                            </Badge>
                          </div>

                          <p className="mt-1 break-words text-xs leading-5 text-neutral-500">
                            /{category.path}
                          </p>

                          {category.parentName ? (
                            <p className="mt-1 text-xs leading-5 text-neutral-400">
                              Child of:{" "}
                              <span className="font-medium text-neutral-500">
                                {category.parentName}
                              </span>
                            </p>
                          ) : (
                            <p className="mt-1 text-xs leading-5 text-neutral-400">
                              Top level parent category
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3 align-top">
                    <p className="break-words font-mono text-sm leading-6 text-neutral-700">
                      {category.slug}
                    </p>
                  </td>

                  <td className="px-5 py-3 align-top">
                    <span className="text-sm font-medium text-neutral-700">
                      {category.level}
                    </span>
                  </td>

                  <td className="px-5 py-3 align-top">
                    <ScoreBadge
                      score={category.seoScore}
                      status={category.seoStatus}
                    />
                  </td>

                  <td className="px-5 py-4 text-right align-top">
                    <Button
                      asChild
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 rounded-full border-neutral-200 bg-white shadow-sm transition hover:bg-neutral-950 hover:text-white"
                      aria-label={`Edit SEO for ${category.name}`}
                    >
                      <Link
                        href={`/admin/seo/categories/${encodeURIComponent(category.id)}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryImagePreview({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="group/image relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-[#fbfaf6] p-1 shadow-sm">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden w-52 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,15,15,0.20)] group-hover/image:block">
            <div className="flex h-64 w-full items-center justify-center rounded-xl bg-[#fbfaf6] p-2">
              <img
                src={imageUrl}
                alt={name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="mt-2 truncate text-xs font-medium text-neutral-600">
              {name}
            </p>
          </div>
        </>
      ) : (
        <FolderTree className="h-6 w-6 text-neutral-300" />
      )}
    </div>
  );
}

function ScoreBadge({
  score,
  status,
}: {
  score: number | null;
  status: string;
}) {
  const tone = getScoreTone(score);

  const styles = {
    neutral: {
      pill: "border-neutral-100 bg-neutral-50 text-neutral-600",
      bar: "bg-neutral-300",
      track: "bg-neutral-100",
      label: status || "Not started",
    },
    red: {
      pill: "border-red-100 bg-red-50 text-red-700",
      bar: "bg-red-500",
      track: "bg-red-100",
      label: "Poor",
    },
    amber: {
      pill: "border-amber-100 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      track: "bg-amber-100",
      label: "Needs improvement",
    },
    green: {
      pill: "border-emerald-100 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      track: "bg-emerald-100",
      label: "Good",
    },
  }[tone];

  const scoreValue = score ?? 0;

  return (
    <div className="min-w-[150px]">
      <div
        className={`inline-flex min-w-12 items-center justify-center rounded-full border px-3 py-1 text-sm font-semibold ${styles.pill}`}
      >
        {score === null ? "—" : score}
      </div>

      <div className={`mt-2 h-2 overflow-hidden rounded-full ${styles.track}`}>
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{ width: `${scoreValue}%` }}
        />
      </div>

      <p className="mt-1 text-xs font-medium text-neutral-400">
        {styles.label}
      </p>
    </div>
  );
}
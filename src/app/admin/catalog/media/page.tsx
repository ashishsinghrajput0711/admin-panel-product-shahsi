"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Check,
  ExternalLink,
  ImageIcon,
  Loader2,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteProductMedia,
  fetchMediaLibrary,
  type MediaLibraryFilterType,
  type ProductMediaItem,
} from "@/lib/admin/product-media-upload";

function getApiRootUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!rawUrl) {
    throw new Error(
      "API base URL missing hai. .env.local me NEXT_PUBLIC_ADMIN_API_URL add karo."
    );
  }

  const cleanUrl = rawUrl.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function isVideoMedia(item: ProductMediaItem) {
  const type = String(item.type || "").toUpperCase();
  const resourceType = String(item.resourceType || "").toLowerCase();
  const mimeType = String(item.mimeType || "").toLowerCase();
  const url = String(item.secureUrl || item.url || "").toLowerCase();

  return (
    type === "VIDEO" ||
    resourceType === "video" ||
    mimeType.startsWith("video/") ||
    mimeType === "external/video" ||
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.endsWith(".mp4") ||
    url.endsWith(".mov") ||
    url.endsWith(".webm") ||
    url.endsWith(".mkv") ||
    url.endsWith(".avi") ||
    url.endsWith(".m4v")
  );
}

function isExternalVideo(item: ProductMediaItem) {
  const url = String(item.secureUrl || item.url || "").toLowerCase();

  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  );
}

function getMediaSrc(item: ProductMediaItem) {
  return item.thumbnailUrl || item.secureUrl || item.url || "";
}

function getMediaTitle(item: ProductMediaItem) {
  const mediaRecord = item as ProductMediaItem & {
    originalFilename?: string | null;
    publicId?: string | null;
  };

  return (
    mediaRecord.name ||
    mediaRecord.title ||
    mediaRecord.altText ||
    mediaRecord.originalFilename ||
    mediaRecord.publicId ||
    "Untitled media"
  );
}

function getMediaDate(item: ProductMediaItem) {
  const rawDate = item.updatedAt || item.createdAt;

  if (!rawDate) return "—";

  try {
    return new Date(rawDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getMediaSize(item: ProductMediaItem) {
  const mediaRecord = item as ProductMediaItem & {
    bytes?: number | string | null;
    fileSize?: number | string | null;
    fileSizeBytes?: number | string | null;
    size?: number | string | null;
  };

  const bytes = Number(
    mediaRecord.bytes ||
      mediaRecord.fileSize ||
      mediaRecord.fileSizeBytes ||
      mediaRecord.size ||
      0
  );

  if (!bytes) return "—";

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(2)} KB`;
}


type ProductPickerItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  brand?: string | null;
  vendor?: string | null;
  status?: string | null;
};

type ProductPickerResponse = {
  success?: boolean;
  data?:
    | ProductPickerItem[]
    | {
        items?: ProductPickerItem[];
        data?: ProductPickerItem[];
        products?: ProductPickerItem[];
      };
  items?: ProductPickerItem[];
  products?: ProductPickerItem[];
};

async function createCatalogMedia(payload: Record<string, unknown>) {
  const token = getToken();

  const response = await fetch(`${getApiRootUrl()}/admin/catalog/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      `Create media failed with status ${response.status}`;

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return json?.data ?? json;
}


async function updateCatalogMedia(
  mediaId: string,
  payload: Record<string, unknown>
) {
  const token = getToken();

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/media/${mediaId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      `Update media failed with status ${response.status}`;

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return json?.data ?? json;
}

async function searchProductPicker(searchText: string) {
  const token = getToken();
  const params = new URLSearchParams();

  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }

  params.set("page", "1");
  params.set("limit", "8");
  params.set("status", "ACTIVE");

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/products/picker?${params.toString()}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const json = (await response.json().catch(() => null)) as ProductPickerResponse | null;

  if (!response.ok) {
    const message =
      (json as { message?: string; error?: string } | null)?.message ||
      (json as { message?: string; error?: string } | null)?.error ||
      `Product picker failed with status ${response.status}`;

    throw new Error(message);
  }

  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.products)) return json.products;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data?.products)) return json.data.products;

  return [];
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MediaLibraryFilterType>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
const [isCreatingMedia, setIsCreatingMedia] = useState(false);

const [productSearch, setProductSearch] = useState("");
const [productResults, setProductResults] = useState<ProductPickerItem[]>([]);
const [selectedProduct, setSelectedProduct] =
  useState<ProductPickerItem | null>(null);
const [isSearchingProducts, setIsSearchingProducts] = useState(false);

const [isEditOpen, setIsEditOpen] = useState(false);
const [isUpdatingMedia, setIsUpdatingMedia] = useState(false);
const [editingMedia, setEditingMedia] = useState<ProductMediaItem | null>(null);
const [editForm, setEditForm] = useState({
  name: "",
  title: "",
  altText: "",
  caption: "",
  viewType: "",
  colorName: "",
  position: 0,
  sortOrder: 0,
  isPrimary: false,
  status: "ACTIVE",
});
const [createForm, setCreateForm] = useState({
  scope: "PRODUCT",
  businessType: "SHAHSI",
  sourceType: "EXTERNAL_URL",
  productId: "",
  type: "IMAGE",
  url: "",
  thumbnailUrl: "",
  title: "",
  altText: "",
  fileName: "",
  mimeType: "image/jpeg",
  position: 0,
  sortOrder: 0,
  isPrimary: false,
  status: "ACTIVE",
});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const imageCount = useMemo(
    () => mediaItems.filter((item) => !isVideoMedia(item)).length,
    [mediaItems]
  );

  const videoCount = useMemo(
    () => mediaItems.filter((item) => isVideoMedia(item)).length,
    [mediaItems]
  );

  const missingAltCount = useMemo(
    () =>
      mediaItems.filter((item) => !String(item.altText || "").trim()).length,
    [mediaItems]
  );

  async function loadMedia(options: { nextPage?: number; append?: boolean } = {}) {
    const nextPage = options.nextPage ?? 1;
    const append = Boolean(options.append);

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const result = await fetchMediaLibrary({
        apiRootUrl: getApiRootUrl(),
        token: getToken(),
        page: nextPage,
        limit: 30,
        search,
        type,
      });

      setMediaItems((current) => {
        if (!append) return result.items;

        const existingIds = new Set(current.map((item) => item.id));
        const freshItems = result.items.filter(
          (item) => !existingIds.has(item.id)
        );

        return [...current, ...freshItems];
      });

      setPage(result.meta.page || nextPage);
      setTotalPages(result.meta.totalPages || 1);
      setTotalItems(result.meta.total || result.items.length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Media library load karte time error aa gaya."
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadMedia({ nextPage: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function handleSearch() {
    await loadMedia({ nextPage: 1, append: false });
  }

  async function handleRefresh() {
    setSuccessMessage("");
    await loadMedia({ nextPage: 1, append: false });
  }

  async function handleProductSearch(searchText = productSearch) {
  setError("");

  try {
    setIsSearchingProducts(true);

    const products = await searchProductPicker(searchText);
    setProductResults(products);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Product search karte time error aa gaya."
    );
  } finally {
    setIsSearchingProducts(false);
  }
}

function selectProductForMedia(product: ProductPickerItem) {
  setSelectedProduct(product);
  setProductSearch(product.title || product.name || product.sku || product.id);

  setCreateForm((prev) => ({
    ...prev,
    productId: product.id,
  }));
}

function useSelectedProductImage() {
  if (!selectedProduct) {
    setError("Pehle product select karo.");
    return;
  }

  const imageUrl = getProductImage(selectedProduct);

  if (!imageUrl) {
    setError("Selected product me image URL nahi mila.");
    return;
  }

  const productTitle = getProductTitle(selectedProduct);

  setError("");

  setCreateForm((prev) => ({
    ...prev,
    type: "IMAGE",
    url: imageUrl,
    thumbnailUrl: imageUrl,
    title: prev.title || productTitle,
    altText: prev.altText || productTitle,
    fileName:
      prev.fileName ||
      `${productTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}.jpg`,
    mimeType: "image/jpeg",
  }));
}

function clearSelectedProduct() {
  setSelectedProduct(null);
  setProductSearch("");
  setProductResults([]);

  setCreateForm((prev) => ({
    ...prev,
    productId: "",
  }));
}

function getProductImage(product: ProductPickerItem) {
  return product.thumbnail || product.imageUrl || product.image || "";
}

function getProductTitle(product: ProductPickerItem) {
  return product.title || product.name || "Untitled product";
}

  function openEditMedia(item: ProductMediaItem) {
  setEditingMedia(item);

  setEditForm({
    name: item.name || "",
    title: item.title || item.name || "",
    altText: item.altText || "",
    caption: String(
      (item as ProductMediaItem & { caption?: string | null }).caption || ""
    ),
    viewType: String(
      (item as ProductMediaItem & { viewType?: string | null }).viewType || ""
    ),
    colorName: String(
      (item as ProductMediaItem & { colorName?: string | null }).colorName || ""
    ),
    position: Number(item.position || 0),
    sortOrder: Number(
      (item as ProductMediaItem & { sortOrder?: number | null }).sortOrder ||
        item.position ||
        0
    ),
    isPrimary: Boolean(item.isPrimary),
    status: item.status || "ACTIVE",
  });

  setError("");
  setSuccessMessage("");
  setIsEditOpen(true);
}

function closeEditMedia() {
  setIsEditOpen(false);
  setEditingMedia(null);
}

  async function handleCreateMedia(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setSuccessMessage("");

  if (!createForm.url.trim()) {
    setError("Media URL required hai.");
    return;
  }

if (!createForm.title.trim()) {
  setError("Media title required hai.");
  return;
}

if (!createForm.productId.trim()) {
  setError("Product select karna required hai.");
  return;
}

const cleanMediaUrl = createForm.url.trim();
const cleanThumbnailUrl = createForm.thumbnailUrl.trim() || cleanMediaUrl;

try {
  new URL(cleanMediaUrl);
} catch {
  setError("Media URL valid URL nahi hai.");
  return;
}

try {
  new URL(cleanThumbnailUrl);
} catch {
  setError("Thumbnail URL valid URL nahi hai. Media URL ko thumbnail me paste karo.");
  return;
}

const payload = {
  scope: createForm.scope,
  productId: createForm.productId.trim(),
  businessType: createForm.businessType,
  type: createForm.type,
  sourceType: "EXTERNAL_URL",
  url: cleanMediaUrl,
  thumbnailUrl: cleanThumbnailUrl,
  title: createForm.title.trim(),
    altText: createForm.altText.trim() || null,
    fileName: createForm.fileName.trim() || null,
    mimeType:
      createForm.mimeType.trim() ||
      (createForm.type === "VIDEO" ? "external/video" : "image/jpeg"),
    position: Number(createForm.position || 0),
    sortOrder: Number(createForm.sortOrder || 0),
    isPrimary: Boolean(createForm.isPrimary),
    status: createForm.status,
  };

  try {
    setIsCreatingMedia(true);

    await createCatalogMedia(payload);

    setSuccessMessage("Media create ho gaya.");
    setIsCreateOpen(false);

    setSelectedProduct(null);
setProductSearch("");
setProductResults([]);

 setCreateForm({
  scope: "PRODUCT",
  businessType: "SHAHSI",
  sourceType: "EXTERNAL_URL",
  productId: "",
  type: "IMAGE",
      url: "",
      thumbnailUrl: "",
      title: "",
      altText: "",
      fileName: "",
      mimeType: "image/jpeg",
      position: 0,
      sortOrder: 0,
      isPrimary: false,
      status: "ACTIVE",
    });

    await loadMedia({ nextPage: 1, append: false });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Media create karte time error aa gaya."
    );
  } finally {
    setIsCreatingMedia(false);
  }
}


async function handleUpdateMedia(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!editingMedia) return;

  setError("");
  setSuccessMessage("");

  if (!editForm.title.trim()) {
    setError("Title required hai.");
    return;
  }

  const payload = {
    name: editForm.name.trim() || editForm.title.trim(),
    title: editForm.title.trim(),
    altText: editForm.altText.trim() || null,
    caption: editForm.caption.trim() || null,
    viewType: editForm.viewType.trim() || null,
    colorName: editForm.colorName.trim() || null,
    position: Number(editForm.position || 0),
    sortOrder: Number(editForm.sortOrder || 0),
    isPrimary: Boolean(editForm.isPrimary),
    status: editForm.status,
  };

  try {
    setIsUpdatingMedia(true);

    const updatedMedia = await updateCatalogMedia(editingMedia.id, payload);

    setMediaItems((current) =>
      current.map((item) =>
        item.id === editingMedia.id
          ? {
              ...item,
              ...payload,
              ...(updatedMedia && typeof updatedMedia === "object"
                ? updatedMedia
                : {}),
            }
          : item
      )
    );

    setSuccessMessage("Media update ho gaya.");
    closeEditMedia();
    await loadMedia({ nextPage: 1, append: false });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Media update karte time error aa gaya."
    );
  } finally {
    setIsUpdatingMedia(false);
  }
}

  async function handleDeleteMedia(item: ProductMediaItem) {
    const confirmed = window.confirm(
      `"${getMediaTitle(item)}" media delete karna hai?`
    );

    if (!confirmed) return;

    try {
      setIsDeletingId(item.id);
      setError("");
      setSuccessMessage("");

      await deleteProductMedia({
        apiRootUrl: getApiRootUrl(),
        mediaId: item.id,
        token: getToken(),
      });

      setMediaItems((current) =>
        current.filter((mediaItem) => mediaItem.id !== item.id)
      );

      setSuccessMessage("Media delete ho gaya.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Media delete karte time error aa gaya."
      );
    } finally {
      setIsDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-4 sm:p-6">
      <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Admin / Catalog
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
              Media Library
            </h1>

            <p className="mt-3 max-w-3xl text-sm text-neutral-500 sm:text-base">
              Manage all uploaded catalog media, product gallery assets,
              thumbnails, videos, alt text and reusable library media.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-11 rounded-full border-neutral-200 px-5 font-semibold"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

    <Button
  type="button"
  onClick={() => {
    setIsCreateOpen(true);
    setError("");
    setSuccessMessage("");
    if (!productResults.length) {
      void handleProductSearch("");
    }
  }}
  className="h-11 rounded-full bg-neutral-950 px-5 font-semibold text-white hover:bg-neutral-800"
>
  <Plus className="mr-2 h-4 w-4" />
  Add URL Media
</Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <StatsCard
          label="Total Media"
          value={totalItems || mediaItems.length}
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <StatsCard
          label="Images"
          value={imageCount}
          icon={<ImageIcon className="h-5 w-5" />}
        />
        <StatsCard
          label="Videos"
          value={videoCount}
          icon={<Video className="h-5 w-5" />}
        />
        <StatsCard
          label="Missing Alt Text"
          value={missingAltCount}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </section>

      <section className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">
              Media Assets
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Search, filter and manage reusable catalog media from backend
              media library.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 lg:w-[360px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSearch();
                  }
                }}
                placeholder="Search media by name, alt text, URL..."
                className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as MediaLibraryFilterType)
              }
              className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Media</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
            </select>

            <Button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="h-11 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800"
            >
              Search
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Media API error</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <Check className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        ) : null}

        <div className="mt-6">
          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Media loading...
            </div>
          ) : mediaItems.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {mediaItems.map((item) => (
             <MediaCard
  key={item.id}
  item={item}
  isDeleting={isDeletingId === item.id}
  onEdit={() => openEditMedia(item)}
  onDelete={() => {
    void handleDeleteMedia(item);
  }}
/>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-neutral-200">
                <ImageIcon className="h-8 w-8 text-neutral-500" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-neutral-950">
                No media found
              </h3>

              <p className="mt-2 max-w-md text-sm text-neutral-500">
                Backend media library empty hai ya current filter/search me koi
                media match nahi hua.
              </p>
            </div>
          )}
        </div>

        {mediaItems.length ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {page} of {totalPages} · Showing {mediaItems.length} media
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={isLoadingMore || page >= totalPages}
              onClick={() =>
                loadMedia({
                  nextPage: page + 1,
                  append: true,
                })
              }
              className="rounded-full border-neutral-200 px-5 font-semibold"
            >
              {isLoadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Load More
            </Button>
          </div>
        ) : null}
      </section>
          {isCreateOpen ? (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
       <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="shrink-0 flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Media Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Add URL Media
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  External image/video URL se global media library record create karo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
              className="shrink-0 rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

           <form onSubmit={handleCreateMedia} className="flex min-h-0 flex-1 flex-col">
    <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overflow-x-hidden px-6 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Scope" required>
                    <select
                      value={createForm.scope}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          scope: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    >
                      <option value="PRODUCT">PRODUCT</option>
                      <option value="VARIANT">VARIANT</option>
                    </select>
                  </Field>

                  <Field label="Media Type" required>
                    <select
                      value={createForm.type}
                      onChange={(event) => {
                        const mediaType = event.target.value;

                        setCreateForm((prev) => ({
                          ...prev,
                          type: mediaType,
                          mimeType:
                            mediaType === "VIDEO"
                              ? "external/video"
                              : "image/jpeg",
                        }));
                      }}
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    >
                      <option value="IMAGE">IMAGE</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="THUMBNAIL">THUMBNAIL</option>
                      <option value="LOOKBOOK">LOOKBOOK</option>
                      <option value="SIZE_GUIDE">SIZE_GUIDE</option>
                      <option value="FABRIC_SWATCH">FABRIC_SWATCH</option>
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4">
  <Field label="Business Type" required>
    <select
      value={createForm.businessType}
      onChange={(event) =>
        setCreateForm((prev) => ({
          ...prev,
          businessType: event.target.value,
        }))
      }
      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
    >
      <option value="SHAHSI">SHAHSI</option>
      <option value="GOWNLOOP">GOWNLOOP</option>
    </select>
  </Field>
</div>

          <div className="grid gap-4">
  <Field label="Product" required>
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <input
        value={productSearch}
        onChange={(event) => setProductSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleProductSearch(productSearch);
          }
        }}
        placeholder="Search product by title, SKU, barcode..."
        className="h-11 min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
      />

      <Button
        type="button"
        onClick={() => handleProductSearch(productSearch)}
        disabled={isSearchingProducts}
        className="h-11 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSearchingProducts ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Search"
        )}
      </Button>
    </div>

    {selectedProduct ? (
   <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        {getProductImage(selectedProduct) ? (
          <img
            src={getProductImage(selectedProduct)}
            alt={getProductTitle(selectedProduct)}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-400">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            title={getProductTitle(selectedProduct)}
            className="truncate text-sm font-semibold text-neutral-950"
          >
            {getProductTitle(selectedProduct)}
          </p>

          <p className="mt-1 truncate text-xs text-neutral-600">
            SKU: {selectedProduct.sku || "—"} · ID: {selectedProduct.id}
          </p>
        </div>

      <div className="flex shrink-0 items-center gap-2">
  <button
    type="button"
    onClick={useSelectedProductImage}
    className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
  >
    Use image
  </button>

  <button
    type="button"
    onClick={clearSelectedProduct}
    className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
  >
    Clear
  </button>
</div>
      </div>
    ) : null}

    {productResults.length ? (
      <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white">
        {productResults.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => selectProductForMedia(product)}
            className="flex w-full items-center gap-3 border-b border-neutral-100 p-3 text-left transition last:border-b-0 hover:bg-neutral-50"
          >
            {getProductImage(product) ? (
              <img
                src={getProductImage(product)}
                alt={getProductTitle(product)}
                className="h-12 w-12 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                title={getProductTitle(product)}
                className="truncate text-sm font-semibold text-neutral-950"
              >
                {getProductTitle(product)}
              </p>

              <p className="mt-1 truncate text-xs text-neutral-500">
                SKU: {product.sku || "—"} · {product.brand || product.vendor || "—"}
              </p>
            </div>

            {selectedProduct?.id === product.id ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : null}
          </button>
        ))}
      </div>
    ) : null}

    <input type="hidden" value={createForm.productId} readOnly />
  </Field>
</div>

                <Field label="Media URL" required>
                  <input
                    value={createForm.url}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        url: event.target.value,
                      }))
                    }
                    placeholder="https://res.cloudinary.com/... or YouTube/Vimeo URL"
                    className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                  />
                </Field>

                <Field label="Thumbnail URL">
                  <input
                    value={createForm.thumbnailUrl}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        thumbnailUrl: event.target.value,
                      }))
                    }
                    placeholder="Optional thumbnail URL"
                    className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title" required>
                    <input
                      value={createForm.title}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Front view"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="File Name">
                    <input
                      value={createForm.fileName}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          fileName: event.target.value,
                        }))
                      }
                      placeholder="front-view.jpg"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>
                </div>

                <Field label="Alt Text">
                  <textarea
                    value={createForm.altText}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        altText: event.target.value,
                      }))
                    }
                    placeholder="Model wearing dress front view"
                    rows={3}
         className="w-full max-w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="MIME Type">
                    <input
                      value={createForm.mimeType}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          mimeType: event.target.value,
                        }))
                      }
                      placeholder="image/jpeg"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Position">
                    <input
                      type="number"
                      value={createForm.position}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          position: Number(event.target.value || 0),
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Sort Order">
                    <input
                      type="number"
                      value={createForm.sortOrder}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          sortOrder: Number(event.target.value || 0),
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
                    Primary Media
                    <input
                      type="checkbox"
                      checked={createForm.isPrimary}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          isPrimary: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-neutral-950"
                    />
                  </label>

                  <Field label="Status">
                    <select
                      value={createForm.status}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          status: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </Field>
                </div>
              </div>

        <div className="shrink-0 flex flex-col gap-3 border-t border-neutral-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-11 rounded-full border-neutral-200 px-6 font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isCreatingMedia}
                  className="h-11 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800"
                >
                  {isCreatingMedia ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Media
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

            {isEditOpen && editingMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
       <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="shrink-0 flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Media Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Edit Media
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Title, alt text, ordering, primary flag aur status update karo.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditMedia}
                className="shrink-0 rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateMedia}
              className="flex min-h-0 flex-1 flex-col"
            >
            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overflow-x-hidden px-6 py-6">
              <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
    Current media
  </p>

  <p
    title={getMediaTitle(editingMedia)}
    className="mt-2 truncate text-sm font-semibold text-neutral-950"
  >
    {getMediaTitle(editingMedia)}
  </p>

  <p
    title={editingMedia.url || editingMedia.secureUrl || ""}
    className="mt-1 max-w-full truncate break-all text-xs text-neutral-500"
  >
    {editingMedia.url || editingMedia.secureUrl}
  </p>
</div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Front view"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Title" required>
                    <input
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Front view"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>
                </div>

                <Field label="Alt Text">
                  <textarea
                    value={editForm.altText}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        altText: event.target.value,
                      }))
                    }
                    placeholder="Model wearing dress front view"
                    rows={3}
           className="w-full max-w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
                  />
                </Field>

                <Field label="Caption">
                  <textarea
                    value={editForm.caption}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        caption: event.target.value,
                      }))
                    }
                    placeholder="Optional caption"
                    rows={2}
         className="w-full max-w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="View Type">
                    <input
                      value={editForm.viewType}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          viewType: event.target.value,
                        }))
                      }
                      placeholder="front"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Color Name">
                    <input
                      value={editForm.colorName}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          colorName: event.target.value,
                        }))
                      }
                      placeholder="Ivory"
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Position">
                    <input
                      type="number"
                      value={editForm.position}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          position: Number(event.target.value || 0),
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Sort Order">
                    <input
                      type="number"
                      value={editForm.sortOrder}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          sortOrder: Number(event.target.value || 0),
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </Field>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
                  Primary Media
                  <input
                    type="checkbox"
                    checked={editForm.isPrimary}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isPrimary: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-neutral-950"
                  />
                </label>
              </div>

      <div className="shrink-0 flex flex-col gap-3 border-t border-neutral-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditMedia}
                  className="h-11 rounded-full border-neutral-200 px-6 font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isUpdatingMedia}
                  className="h-11 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800"
                >
                  {isUpdatingMedia ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="mr-2 h-4 w-4" />
                  )}
                  Update Media
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-100 p-3 text-neutral-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MediaCard({
  item,
  isDeleting,
  onEdit,
  onDelete,
}: {
  item: ProductMediaItem;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const src = getMediaSrc(item);
  const title = getMediaTitle(item);
  const isVideo = isVideoMedia(item);
  const missingAlt = !String(item.altText || "").trim();

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {src ? (
          isVideo && !isExternalVideo(item) ? (
            <video
              src={item.secureUrl || item.url}
              className="h-full w-full object-cover"
              muted
              playsInline
              controls={false}
            />
          ) : (
            <img
              src={src}
              alt={item.altText || title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {isVideo ? (
          <div className="absolute left-3 top-3 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" />
              Video
            </span>
          </div>
        ) : (
          <div className="absolute left-3 top-3 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            Image
          </div>
        )}

        {item.isPrimary ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            Primary
          </div>
        ) : null}

        {missingAlt ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
            Missing Alt
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="min-w-0">
          <p title={title} className="truncate font-semibold text-neutral-950">
            {title}
          </p>

          <p className="mt-1 truncate text-xs text-neutral-500">
            {isVideo ? "Video" : "Image"} · {item.sourceType || "Catalog media"}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-500">
          <div>
            <p className="font-semibold uppercase tracking-wide text-neutral-400">
              Size
            </p>
            <p className="mt-1 text-neutral-700">{getMediaSize(item)}</p>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wide text-neutral-400">
              Updated
            </p>
            <p className="mt-1 text-neutral-700">{getMediaDate(item)}</p>
          </div>
        </div>

        <p
          title={item.altText || ""}
          className="mt-4 line-clamp-2 min-h-[40px] text-sm text-neutral-500"
        >
          {item.altText || "Alt text missing for this media."}
        </p>

    <div className="mt-4 grid grid-cols-3 gap-2">
  <button
    type="button"
    onClick={onEdit}
   className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
  >
    <Pencil className="h-3.5 w-3.5" />
    Edit
  </button>

  <a
            href={item.secureUrl || item.url}
            target="_blank"
            rel="noreferrer"
         className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}


function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-950">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
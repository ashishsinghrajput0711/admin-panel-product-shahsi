"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  GripVertical,
  ImageIcon,
  LinkIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  MediaLibraryFilterType,
  ProductMediaItem,
} from "@/lib/admin/product-media-upload";
import {
  attachProductMedia,
  createExternalProductMedia,
  deleteProductMedia,
  fetchMediaLibrary,
  reorderProductMedia,
  updateProductMediaDetails,
  uploadProductMedia,
} from "@/lib/admin/product-media-upload";
function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
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

function isSupportedMediaFile(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

function isFileDrag(event: React.DragEvent<HTMLElement>) {
  const types = Array.from(event.dataTransfer.types);

  const isInternalMediaDrag =
    types.includes("application/x-product-media-id") ||
    types.includes("application/x-pending-media-index");

  return types.includes("Files") && !isInternalMediaDrag;
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

function getMediaSrc(item: ProductMediaItem) {
  return item.thumbnailUrl || item.secureUrl || item.url;
}

function getPlayableMediaSrc(item: ProductMediaItem) {
  return item.secureUrl || item.url;
}

function sortMediaItems(items: ProductMediaItem[]) {
  return [...items].sort((first, second) => {
    const firstPosition = first.sortOrder ?? first.position ?? 0;
    const secondPosition = second.sortOrder ?? second.position ?? 0;

    return firstPosition - secondPosition;
  });
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [removedItem] = nextItems.splice(fromIndex, 1);

  if (!removedItem) return items;

  nextItems.splice(toIndex, 0, removedItem);

  return nextItems;
}

function isEmbeddableExternalVideo(item: ProductMediaItem) {
  const url = item.url || "";
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com");
}

function PendingImagePreview({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!previewUrl) return null;

  return (
    <img
      src={previewUrl}
      alt={file.name}
      className={className || "h-full w-full object-contain"}
      draggable={false}
    />
  );
}

function PendingVideoPreview({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!previewUrl) return null;

  return (
    <video
      src={previewUrl}
      className={className || "h-full w-full object-contain"}
      controls
      muted
      playsInline
    />
  );
}

function MediaPreview({
  item,
  className,
}: {
  item: ProductMediaItem;
  className?: string;
}) {
  const src = getMediaSrc(item);
  const playableSrc = getPlayableMediaSrc(item);

  if (isVideoMedia(item)) {
    if (isEmbeddableExternalVideo(item)) {
      return (
        <div className={className || "flex h-full w-full items-center justify-center bg-neutral-100"}>
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.altText || item.name || item.title || "Product video"}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-neutral-500">
              <ExternalLink className="h-6 w-6" />
              <span className="mt-2 text-xs">External video</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <video
        src={playableSrc}
        className={className || "h-full w-full object-contain"}
        controls
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={src}
      alt={item.altText || item.name || item.title || "Product media"}
      className={className || "h-full w-full object-contain"}
      draggable={false}
    />
  );
}

function PendingMediaPreview({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  if (isVideoFile(file)) {
    return <PendingVideoPreview file={file} className={className} />;
  }

  return <PendingImagePreview file={file} className={className} />;
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-950">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export function ProductMediaSection({
  productId,
  mediaItems = [],
  pendingFiles = [],
  onPendingFilesChange,
  onMediaChanged,
}: {
  productId?: string;
  mediaItems?: ProductMediaItem[];
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  onMediaChanged?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [orderedMediaItems, setOrderedMediaItems] = useState<ProductMediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalTitle, setExternalTitle] = useState("");
  const [externalAltText, setExternalAltText] = useState("");

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
 const [libraryItems, setLibraryItems] = useState<ProductMediaItem[]>([]);
const [librarySearch, setLibrarySearch] = useState("");
const [libraryType, setLibraryType] = useState<MediaLibraryFilterType>("ALL");
const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
const [isLibraryLoading, setIsLibraryLoading] = useState(false);
const [libraryPage, setLibraryPage] = useState(1);
const [libraryTotalPages, setLibraryTotalPages] = useState(1);
const [isLibraryLoadingMore, setIsLibraryLoadingMore] = useState(false);

  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [dragOverMediaId, setDragOverMediaId] = useState<string | null>(null);
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(null);
  const [dragOverPendingIndex, setDragOverPendingIndex] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  
  const [editingMedia, setEditingMedia] = useState<ProductMediaItem | null>(null);
const [mediaName, setMediaName] = useState("");
const [mediaAltText, setMediaAltText] = useState("");
const [mediaCaption, setMediaCaption] = useState("");
const [mediaViewType, setMediaViewType] = useState("");
const [mediaColorName, setMediaColorName] = useState("");

  const hasProductId = Boolean(productId);

 useEffect(() => {
  setOrderedMediaItems(sortMediaItems(mediaItems));
  setSelectedMediaIds([]);
}, [mediaItems]);

  const totalMediaCount = useMemo(() => {
    return orderedMediaItems.length + pendingFiles.length;
  }, [orderedMediaItems.length, pendingFiles.length]);

  async function uploadOrQueueFiles(files: File[]) {
    const mediaFiles = files.filter(isSupportedMediaFile);

    if (!mediaFiles.length) {
      setMediaError("Please select image or video files only.");
      return;
    }

    setMediaError(null);

    if (!hasProductId) {
      onPendingFilesChange?.([...pendingFiles, ...mediaFiles]);
      return;
    }

    try {
      setIsUploading(true);

      await uploadProductMedia({
        apiRootUrl: getApiRootUrl(),
        productId: productId as string,
        files: mediaFiles,
        token: getToken(),
      });

      onMediaChanged?.();
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Media upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await uploadOrQueueFiles(Array.from(files));
  }

  async function handleDropUpload(event: React.DragEvent<HTMLDivElement>) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    event.stopPropagation();

    setIsDraggingUpload(false);

    if (isUploading) return;

    const files = Array.from(event.dataTransfer.files || []);

    if (files.length > 0) {
      await uploadOrQueueFiles(files);
    }
  }

  function handleDragOverUpload(event: React.DragEvent<HTMLDivElement>) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    event.stopPropagation();

    if (!isUploading) {
      setIsDraggingUpload(true);
    }
  }

  function handleDragLeaveUpload(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget as Node | null;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setIsDraggingUpload(false);
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!mediaId) return;

    try {
      setIsUploading(true);
      setMediaError(null);

      await deleteProductMedia({
        apiRootUrl: getApiRootUrl(),
        mediaId,
        token: getToken(),
      });

      setOrderedMediaItems((current) => current.filter((item) => item.id !== mediaId));

      onMediaChanged?.();
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Media delete failed.");
    } finally {
      setIsUploading(false);
    }
  }


  function toggleMediaSelection(mediaId: string) {
  setSelectedMediaIds((current) =>
    current.includes(mediaId)
      ? current.filter((id) => id !== mediaId)
      : [...current, mediaId]
  );
}

function clearSelectedMedia() {
  setSelectedMediaIds([]);
}

async function handleDeleteSelectedMedia() {
  if (!selectedMediaIds.length) return;

  const confirmed = window.confirm(
    `${selectedMediaIds.length} selected media item(s) remove karne hain?`
  );

  if (!confirmed) return;

  try {
    setIsUploading(true);
    setMediaError(null);

    const apiRootUrl = getApiRootUrl();
    const token = getToken();

    await Promise.all(
      selectedMediaIds.map((mediaId) =>
        deleteProductMedia({
          apiRootUrl,
          mediaId,
          token,
        })
      )
    );

    setOrderedMediaItems((current) =>
      current.filter((item) => !selectedMediaIds.includes(item.id))
    );

    setSelectedMediaIds([]);
    onMediaChanged?.();
  } catch (error) {
    setMediaError(
      error instanceof Error ? error.message : "Selected media delete failed."
    );
  } finally {
    setIsUploading(false);
  }
}

  function removePendingFile(index: number) {
    onPendingFilesChange?.(
      pendingFiles.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function saveMediaOrder(nextItems: ProductMediaItem[]) {
    if (!productId) return;

    const mediaIds = nextItems.map((item) => item.id).filter(Boolean);

    if (mediaIds.length < 2) return;

    try {
      setMediaError(null);

      await reorderProductMedia({
        apiRootUrl: getApiRootUrl(),
        productId,
        mediaIds,
        token: getToken(),
      });

      onMediaChanged?.();
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Media reorder save failed."
      );
    }
  }

  function handleMediaDragStart(
    event: React.DragEvent<HTMLDivElement>,
    mediaId: string
  ) {
    setDraggedMediaId(mediaId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-product-media-id", mediaId);
    event.dataTransfer.setData("text/plain", mediaId);
  }

  function handleMediaDragOver(
    event: React.DragEvent<HTMLDivElement>,
    targetMediaId: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedMediaId || draggedMediaId === targetMediaId) return;

    setDragOverMediaId(targetMediaId);
    event.dataTransfer.dropEffect = "move";
  }

  function handleMediaDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetMediaId: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    const sourceMediaId =
      draggedMediaId || event.dataTransfer.getData("text/plain");

    if (!sourceMediaId || sourceMediaId === targetMediaId) {
      setDraggedMediaId(null);
      setDragOverMediaId(null);
      return;
    }

    setOrderedMediaItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === sourceMediaId);
      const toIndex = current.findIndex((item) => item.id === targetMediaId);

      if (fromIndex === -1 || toIndex === -1) return current;

      const nextItems = reorderItems(current, fromIndex, toIndex).map(
        (item, index) => ({
          ...item,
          position: index,
          sortOrder: index,
          isPrimary: index === 0,
        })
      );

      void saveMediaOrder(nextItems);

      return nextItems;
    });

    setDraggedMediaId(null);
    setDragOverMediaId(null);
  }

  function handleMediaDragEnd() {
    setDraggedMediaId(null);
    setDragOverMediaId(null);
  }

  function handlePendingDragStart(
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) {
    setDraggedPendingIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-pending-media-index", String(index));
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handlePendingDragOver(
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (draggedPendingIndex === null || draggedPendingIndex === targetIndex) return;

    setDragOverPendingIndex(targetIndex);
    event.dataTransfer.dropEffect = "move";
  }

  function handlePendingDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) {
    event.preventDefault();
    event.stopPropagation();

    const sourceIndex =
      draggedPendingIndex ??
      Number(event.dataTransfer.getData("application/x-pending-media-index"));

    if (
      Number.isNaN(sourceIndex) ||
      sourceIndex === targetIndex ||
      sourceIndex < 0 ||
      targetIndex < 0
    ) {
      setDraggedPendingIndex(null);
      setDragOverPendingIndex(null);
      return;
    }

    const nextFiles = reorderItems(pendingFiles, sourceIndex, targetIndex);
    onPendingFilesChange?.(nextFiles);

    setDraggedPendingIndex(null);
    setDragOverPendingIndex(null);
  }

  function handlePendingDragEnd() {
    setDraggedPendingIndex(null);
    setDragOverPendingIndex(null);
  }

  async function handleCreateExternalMedia() {
    if (!productId) {
      setMediaError("External URL media add karne ke liye pehle product save/create karo.");
      return;
    }

    if (!externalUrl.trim()) {
      setMediaError("Please enter media URL.");
      return;
    }

    try {
      setIsUploading(true);
      setMediaError(null);

      await createExternalProductMedia({
        apiRootUrl: getApiRootUrl(),
        productId,
        url: externalUrl,
        title: externalTitle,
        altText: externalAltText,
        token: getToken(),
      });

      setExternalUrl("");
      setExternalTitle("");
      setExternalAltText("");
      setIsUrlModalOpen(false);

      onMediaChanged?.();
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "External URL media create failed."
      );
    } finally {
      setIsUploading(false);
    }
  }

async function loadMediaLibrary(options: { page?: number; append?: boolean } = {}) {
  const nextPage = options.page ?? 1;
  const shouldAppend = Boolean(options.append);

  try {
    if (shouldAppend) {
      setIsLibraryLoadingMore(true);
    } else {
      setIsLibraryLoading(true);
    }

    setMediaError(null);

    const result = await fetchMediaLibrary({
      apiRootUrl: getApiRootUrl(),
      token: getToken(),
      page: nextPage,
      limit: 30,
      search: librarySearch,
      type: libraryType,
    });

    setLibraryItems((current) => {
      if (!shouldAppend) return result.items;

      const existingIds = new Set(current.map((item) => item.id));
      const nextItems = result.items.filter((item) => !existingIds.has(item.id));

      return [...current, ...nextItems];
    });

    setLibraryPage(result.meta.page || nextPage);
    setLibraryTotalPages(result.meta.totalPages || 1);
  } catch (error) {
    setMediaError(
      error instanceof Error ? error.message : "Media library load failed."
    );
  } finally {
    setIsLibraryLoading(false);
    setIsLibraryLoadingMore(false);
  }
}

async function openMediaLibrary() {
  if (!productId) {
    setMediaError("Media library se attach karne ke liye pehle product save/create karo.");
    return;
  }

  setIsLibraryModalOpen(true);
  setSelectedLibraryIds([]);
  setLibraryPage(1);
  setLibraryTotalPages(1);
  await loadMediaLibrary({ page: 1, append: false });
}

  async function handleAttachLibraryMedia() {
    if (!productId) return;

    if (!selectedLibraryIds.length) {
      setMediaError("Please select media from library.");
      return;
    }

    try {
      setIsUploading(true);
      setMediaError(null);

      await attachProductMedia({
        apiRootUrl: getApiRootUrl(),
        productId,
        mediaIds: selectedLibraryIds,
        token: getToken(),
      });

 setSelectedLibraryIds([]);
setIsLibraryModalOpen(false);

onMediaChanged?.();
await loadMediaLibrary({ page: 1, append: false });
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Attach media failed."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function toggleLibrarySelection(mediaId: string) {
    setSelectedLibraryIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId]
    );
  }




function openEditMediaDetails(item: ProductMediaItem) {
  setEditingMedia(item);
  setMediaName(item.name || item.title || "");
  setMediaAltText(item.altText || "");
  setMediaCaption(item.caption || "");
  setMediaViewType(item.viewType || "");
  setMediaColorName(item.colorName || "");
}

async function handleSaveMediaDetails() {
  if (!editingMedia) return;

  try {
    setIsUploading(true);
    setMediaError(null);

    const updatedMedia = await updateProductMediaDetails({
      apiRootUrl: getApiRootUrl(),
      mediaId: editingMedia.id,
      token: getToken(),
      payload: {
        name: mediaName || null,
        title: mediaName || editingMedia.title || editingMedia.name || null,
        altText: mediaAltText || null,
        caption: mediaCaption || null,
        viewType: mediaViewType || null,
        colorName: mediaColorName || null,
        position: editingMedia.position ?? editingMedia.sortOrder ?? 0,
        sortOrder: editingMedia.sortOrder ?? editingMedia.position ?? 0,
        isPrimary: Boolean(editingMedia.isPrimary),
        status: editingMedia.status || "ACTIVE",
      },
    });

    setEditingMedia((current) => {
      if (!current) return current;

      return {
        ...current,
        ...updatedMedia,
        name: updatedMedia?.name ?? mediaName,
        title: updatedMedia?.title ?? mediaName,
        altText: updatedMedia?.altText ?? mediaAltText,
        caption: updatedMedia?.caption ?? mediaCaption,
        viewType: updatedMedia?.viewType ?? mediaViewType,
        colorName: updatedMedia?.colorName ?? mediaColorName,
      };
    });

    await onMediaChanged?.();

    setEditingMedia(null);
  } catch (error) {
    setMediaError(
      error instanceof Error ? error.message : "Media details update failed."
    );
  } finally {
    setIsUploading(false);
  }
}

  return (
    <section
      onDrop={handleDropUpload}
      onDragOver={handleDragOverUpload}
      onDragLeave={handleDragLeaveUpload}
      className={`relative rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 transition sm:p-5 ${
        isDraggingUpload ? "ring-2 ring-neutral-950" : "ring-neutral-200"
      }`}
    >
      {isDraggingUpload ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[1.5rem] border-2 border-dashed border-neutral-950 bg-white/80 backdrop-blur-sm">
          <div className="rounded-2xl bg-neutral-950 px-6 py-4 text-center text-white shadow-xl">
            <Upload className="mx-auto h-7 w-7" />
            <p className="mt-2 text-sm font-semibold">
              Drop media here to upload
            </p>
            <p className="mt-1 text-xs text-white/70">
              Images and videos will upload to Cloudinary through backend API.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-neutral-100 p-2">
            <ImageIcon className="h-4 w-4 text-neutral-700" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-neutral-950">Media</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Upload, add URL, choose library media and drag to reorder.
            </p>
            {totalMediaCount > 0 ? (
              <p className="mt-1 text-[11px] text-neutral-400">
                First media item will be treated as the primary display item.
              </p>
            ) : null}
          </div>
        </div>


{selectedMediaIds.length > 0 ? (
  <div className="flex items-center gap-2">
    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">
      {selectedMediaIds.length} selected
    </span>

    <Button
      type="button"
      variant="outline"
      disabled={isUploading}
      onClick={clearSelectedMedia}
      className="rounded-full px-3"
    >
      Clear
    </Button>

    <Button
      type="button"
      disabled={isUploading}
      onClick={handleDeleteSelectedMedia}
      className="rounded-full bg-red-600 text-white hover:bg-red-700"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Remove
    </Button>
  </div>
) : null}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => setIsMenuOpen((current) => !current)}
            className="rounded-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isUploading ? "Working..." : "Add media"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {isMenuOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <Upload className="h-4 w-4" />
                Upload files
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsUrlModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <LinkIcon className="h-4 w-4" />
                Add from URL
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  void openMediaLibrary();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <ImageIcon className="h-4 w-4" />
                Choose from library
              </button>
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {mediaError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {mediaError}
        </div>
      ) : null}

      {!hasProductId && pendingFiles.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {pendingFiles.length} media file(s) selected. Ye product create hone ke
          baad Cloudinary par upload hongi.
        </div>
      ) : null}

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex min-h-[140px] w-full flex-col items-center justify-center rounded-2xl border border-dashed text-neutral-500 transition ${
            isDraggingUpload
              ? "border-neutral-950 bg-neutral-100"
              : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
          }`}
        >
          <Plus className="h-8 w-8" />
          <span className="mt-2 text-sm font-medium">Add media</span>
          <span className="mt-1 text-xs">
            Upload images/videos or drag files here
          </span>
        </button>

        <div className="grid content-start gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {orderedMediaItems.map((item, index) => {
            const isDragged = draggedMediaId === item.id;
            const isDragOver = dragOverMediaId === item.id;

            const isSelected = selectedMediaIds.includes(item.id);

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => handleMediaDragStart(event, item.id)}
                onDragOver={(event) => handleMediaDragOver(event, item.id)}
                onDrop={(event) => handleMediaDrop(event, item.id)}
                onDragEnd={handleMediaDragEnd}
                className={`group relative cursor-grab overflow-hidden rounded-2xl border bg-neutral-50 transition-all duration-200 active:cursor-grabbing ${
                  isDragged
                    ? "scale-95 opacity-40 ring-2 ring-neutral-950"
                    : "scale-100 opacity-100"
                } ${
  isDragOver || isSelected
    ? "border-neutral-950 shadow-lg ring-2 ring-neutral-950"
    : "border-neutral-200 hover:shadow-md"
}`}
              >
                <MediaPreview
                  item={item}
                  className="h-32 w-full select-none object-contain"
                />


                <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    toggleMediaSelection(item.id);
  }}
  className={`absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border shadow transition ${
    isSelected
      ? "border-neutral-950 bg-neutral-950 text-white"
      : "border-neutral-200 bg-white/95 text-neutral-500 hover:text-neutral-950"
  }`}
  title={isSelected ? "Unselect media" : "Select media"}
>
  {isSelected ? <Check className="h-4 w-4" /> : null}
</button>

               <div className="absolute left-10 top-2 hidden items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-700 shadow ring-1 ring-neutral-200 group-hover:flex">
                  <GripVertical className="h-3 w-3" />
                  Drag
                </div>

                <div className="absolute left-2 bottom-2 flex items-center gap-1">
                  {index === 0 ? (
                    <span className="rounded-full bg-neutral-950 px-2 py-1 text-[10px] font-semibold text-white">
                      Primary
                    </span>
                  ) : null}

                  {item.sourceType === "EXTERNAL_URL" ? (
                    <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                      URL
                    </span>
                  ) : null}

                  {isVideoMedia(item) ? (
                    <span className="rounded-full bg-purple-600 px-2 py-1 text-[10px] font-semibold text-white">
                      Video
                    </span>
                  ) : null}
                </div>


                <button
  type="button"
  disabled={isUploading}
  onClick={() => openEditMediaDetails(item)}
  className="absolute right-11 top-2 hidden rounded-full bg-white px-2 py-1.5 text-[10px] font-semibold text-neutral-700 shadow ring-1 ring-neutral-200 group-hover:block"
>
  Edit
</button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleDeleteMedia(item.id)}
                  className="absolute right-2 top-2 hidden rounded-full bg-white p-1.5 text-red-600 shadow ring-1 ring-neutral-200 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {pendingFiles.map((file, index) => {
            const isDragged = draggedPendingIndex === index;
            const isDragOver = dragOverPendingIndex === index;

            return (
              <div
                key={`${file.name}-${index}`}
                draggable
                onDragStart={(event) => handlePendingDragStart(event, index)}
                onDragOver={(event) => handlePendingDragOver(event, index)}
                onDrop={(event) => handlePendingDrop(event, index)}
                onDragEnd={handlePendingDragEnd}
                className={`group relative cursor-grab overflow-hidden rounded-2xl border border-dashed bg-neutral-50 transition-all duration-200 active:cursor-grabbing ${
                  isDragged
                    ? "scale-95 opacity-40 ring-2 ring-neutral-950"
                    : "scale-100 opacity-100"
                } ${
                  isDragOver
                    ? "border-neutral-950 shadow-lg ring-2 ring-neutral-950"
                    : "border-neutral-300 hover:shadow-md"
                }`}
              >
                <PendingMediaPreview
                  file={file}
                  className="h-32 w-full select-none object-contain"
                />

                <div className="absolute left-2 top-2 hidden items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-700 shadow ring-1 ring-neutral-200 group-hover:flex">
                  <GripVertical className="h-3 w-3" />
                  Drag
                </div>

                <button
                  type="button"
                  onClick={() => removePendingFile(index)}
                  className="absolute right-2 top-2 hidden rounded-full bg-white p-1.5 text-red-600 shadow ring-1 ring-neutral-200 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-[10px] text-white">
                  Pending
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed text-neutral-500 transition ${
              isDraggingUpload
                ? "border-neutral-950 bg-neutral-100"
                : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
            }`}
          >
            <Plus className="h-6 w-6" />
            <span className="mt-1 text-xs">Add media</span>
          </button>
        </div>
      </div>

      {orderedMediaItems.length > 1 || pendingFiles.length > 1 ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          Drag karke media shuffle/reorder kar sakte ho. First media item
          primary rahega.
        </div>
      ) : null}

      {isUrlModalOpen ? (
        <ModalShell title="Add media from URL" onClose={() => setIsUrlModalOpen(false)}>
          <div className="space-y-4 p-5">
            {!productId ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                URL media add karne ke liye pehle product save/create karo.
              </div>
            ) : null}

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Media URL
              </label>
              <input
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://example.com/image.jpg or YouTube/Vimeo URL"
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Title
                </label>
                <input
                  value={externalTitle}
                  onChange={(event) => setExternalTitle(event.target.value)}
                  placeholder="Product media"
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Alt text
                </label>
                <input
                  value={externalAltText}
                  onChange={(event) => setExternalAltText(event.target.value)}
                  placeholder="Product media"
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950"
                />
                  </div>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-2 border-t border-neutral-200 bg-white px-5 pt-4 pb-1">
        <Button
                type="button"
                variant="outline"
                onClick={() => setIsUrlModalOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={isUploading || !productId}
                onClick={handleCreateExternalMedia}
                className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                Add URL media
              </Button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {isLibraryModalOpen ? (
        <ModalShell title="Choose from media library" onClose={() => setIsLibraryModalOpen(false)}>
          <div className="space-y-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search media..."
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-neutral-950"
                />
              </div>

              <select
                value={libraryType}
               onChange={(event) => {
  setLibraryType(event.target.value as MediaLibraryFilterType);
  setLibraryPage(1);
}}
                className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950"
              >
                <option value="ALL">All</option>
                <option value="IMAGE">Images</option>
                <option value="VIDEO">Videos</option>
              </select>

            <Button
  type="button"
  variant="outline"
  onClick={() => {
    setLibraryPage(1);
    void loadMediaLibrary({ page: 1, append: false });
  }}
  disabled={isLibraryLoading}
  className="rounded-full"
>
                {isLibraryLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              {isLibraryLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading media library...
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-sm text-neutral-500">
                  No media found.
                </div>
            ) : (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
  {libraryItems.map((item) => {
  const selected = selectedLibraryIds.includes(item.id);
  const usedInCurrentProduct = productId
    ? item.usedInProductIds?.includes(productId)
    : false;

  return (
    <button
      key={item.id}
      type="button"
      onClick={() => toggleLibrarySelection(item.id)}
      className={`relative overflow-hidden rounded-2xl border bg-white text-left transition ${
        selected
          ? "border-neutral-950 ring-2 ring-neutral-950"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      <MediaPreview
        item={item}
        className="h-32 w-full object-contain"
      />

      {usedInCurrentProduct ? (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
          In this product
        </span>
      ) : item.isUsed ? (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
          Used elsewhere
        </span>
      ) : null}

            <div className="p-2">
              <p className="truncate text-xs font-semibold text-neutral-800">
                {item.name || item.title || item.altText || "Media"}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {isVideoMedia(item) ? "Video" : "Image"} ·{" "}
                {item.sourceType || "Media"}
              </p>
            </div>

            {selected ? (
              <div className="absolute right-2 top-2 rounded-full bg-neutral-950 p-1.5 text-white">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>

    {libraryPage < libraryTotalPages ? (
      <div className="flex justify-center border-t border-neutral-200 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isLibraryLoadingMore}
          onClick={() =>
            loadMediaLibrary({
              page: libraryPage + 1,
              append: true,
            })
          }
          className="rounded-full"
        >
          {isLibraryLoadingMore ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Load more media
        </Button>
      </div>
    ) : null}
  </div>
)}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
              <p className="text-xs text-neutral-500">
             Selected: {selectedLibraryIds.length} · Showing {libraryItems.length} media
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLibraryModalOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  disabled={isUploading || selectedLibraryIds.length === 0}
                  onClick={handleAttachLibraryMedia}
                  className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Attach selected
                </Button>
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}
{editingMedia ? (
  <ModalShell
    title="Edit media details"
    onClose={() => setEditingMedia(null)}
  >
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="space-y-4">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
            <MediaPreview
              item={editingMedia}
              className="h-full max-h-[420px] w-full object-contain"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Media ID
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <code
                      title={editingMedia.id}
                      className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-neutral-700 ring-1 ring-neutral-200"
                    >
                      {editingMedia.id}
                    </code>

                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(editingMedia.id)
                      }
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {editingMedia.productId ? (
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Product ID
                    </p>

                    <code
                      title={editingMedia.productId}
                      className="mt-1.5 block truncate rounded-lg bg-white px-3 py-2 text-xs text-neutral-700 ring-1 ring-neutral-200"
                    >
                      {editingMedia.productId}
                    </code>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Media name
              </label>
              <input
                value={mediaName}
                onChange={(event) => setMediaName(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Media name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Alt description
              </label>
              <textarea
                value={mediaAltText}
                onChange={(event) => setMediaAltText(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Alt description"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Caption
                </label>
                <input
                  value={mediaCaption}
                  onChange={(event) => setMediaCaption(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                  placeholder="Caption"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  View type
                </label>
                <select
                  value={mediaViewType}
                  onChange={(event) => setMediaViewType(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                >
                  <option value="">Select view type</option>
                  <option value="front">Front</option>
                  <option value="back">Back</option>
                  <option value="side">Side</option>
                  <option value="detail">Detail</option>
                  <option value="flatlay">Flatlay</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Color name
              </label>
              <input
                value={mediaColorName}
                onChange={(event) => setMediaColorName(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Color name"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-2 border-t border-neutral-200 bg-white px-5 pb-1 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditingMedia(null)}
            className="rounded-full"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSaveMediaDetails}
            disabled={isUploading}
            className="rounded-full bg-neutral-950 text-white"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save details
          </Button>
        </div>
      </div>
    </div>
  </ModalShell>
) : null}
    </section>
  );
}

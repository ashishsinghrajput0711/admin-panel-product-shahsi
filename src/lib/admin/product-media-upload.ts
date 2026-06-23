export type ProductMediaType = "IMAGE" | "VIDEO";
export type ProductMediaSourceType = "CLOUDINARY" | "EXTERNAL_URL";

export type ProductMediaItem = {
  id: string;
  productId?: string | null;

  url: string;
  secureUrl?: string | null;
  thumbnailUrl?: string | null;

  name?: string | null;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  viewType?: string | null;
  colorName?: string | null;

  type?: ProductMediaType | string | null;
  sourceType?: ProductMediaSourceType | string | null;
  resourceType?: "image" | "video" | string | null;

  mimeType?: string | null;
  format?: string | null;

  width?: number | null;
  height?: number | null;
  bytes?: number | null;

  cloudinaryPublicId?: string | null;

  position?: number | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
  isUsed?: boolean;
  usedInProductIds?: string[];

  status?: "ACTIVE" | "INACTIVE" | string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type MediaLibraryFilterType = "ALL" | "IMAGE" | "VIDEO";

export type MediaLibraryResponse = {
  success?: boolean;
  data?: {
    items?: ProductMediaItem[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: unknown;
  message?: string;
};

type UploadProductImagesResponse = {
  success?: boolean;
  data?: {
    message?: string;
    images?: ProductMediaItem[];
  };
  images?: ProductMediaItem[];
  message?: string;
  error?: unknown;
};

type UploadProductVideosResponse = {
  success?: boolean;
  data?: {
    message?: string;
    videos?: ProductMediaItem[];
  };
  videos?: ProductMediaItem[];
  message?: string;
  error?: unknown;
};

type CreateExternalMediaResponse = {
  success?: boolean;
  data?: {
    media?: ProductMediaItem;
  };
  media?: ProductMediaItem;
  message?: string;
  error?: unknown;
};

type AttachProductMediaResponse = {
  success?: boolean;
  data?: {
    items?: ProductMediaItem[];
  };
  items?: ProductMediaItem[];
  message?: string;
  error?: unknown;
};

type DeleteProductMediaResponse = {
  success?: boolean;
  data?: {
    message?: string;
  };
  message?: string;
  error?: unknown;
};

type ReorderProductMediaResponse = {
  success?: boolean;
  data?: {
    message?: string;
    items?: ProductMediaItem[];
  };
  message?: string;
  error?: unknown;
};

type ReorderProductImagesResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
  error?: unknown;
};

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getJsonHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Media API JSON response nahi de rahi. Body: ${text}`);
  }
}

function getApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (Array.isArray(record.error)) {
    return record.error.join(", ");
  }

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}

function getExternalMediaType(url: string): ProductMediaType {
  const cleanUrl = url.toLowerCase();

  const isVideo =
    cleanUrl.includes("youtube.com") ||
    cleanUrl.includes("youtu.be") ||
    cleanUrl.includes("vimeo.com") ||
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".m4v") ||
    cleanUrl.endsWith(".mkv") ||
    cleanUrl.endsWith(".avi");

  return isVideo ? "VIDEO" : "IMAGE";
}

function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").trim();
    }

    if (hostname.includes("youtube.com")) {
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.replace("/shorts/", "").split("/")[0] || "";
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.replace("/embed/", "").split("/")[0] || "";
      }

      return parsedUrl.searchParams.get("v") || "";
    }

    return "";
  } catch {
    return "";
  }
}

function getExternalThumbnailUrl(url: string, mediaType: ProductMediaType) {
  const cleanUrl = url.trim();

  if (mediaType === "IMAGE") {
    return cleanUrl;
  }

  const youtubeVideoId = getYouTubeVideoId(cleanUrl);

  if (youtubeVideoId) {
    return `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
  }

  return cleanUrl;
}

export async function uploadProductImages({
  apiRootUrl,
  productId,
  files,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  files: File[];
  token?: string | null;
}) {
  if (!files.length) return [];

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`${apiRootUrl}/catalog/${productId}/images`, {
    method: "POST",
    headers: getHeaders(token),
    body: formData,
  });

  const data = await readJson<UploadProductImagesResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product image upload failed: ${response.status}`)
    );
  }

  return data?.data?.images || data?.images || [];
}

export async function uploadProductVideos({
  apiRootUrl,
  productId,
  files,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  files: File[];
  token?: string | null;
}) {
  if (!files.length) return [];

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("videos", file);
  });

  const response = await fetch(`${apiRootUrl}/catalog/${productId}/video`, {
    method: "POST",
    headers: getHeaders(token),
    body: formData,
  });

  const data = await readJson<UploadProductVideosResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product video upload failed: ${response.status}`)
    );
  }

  return data?.data?.videos || data?.videos || [];
}

export async function uploadProductMedia({
  apiRootUrl,
  productId,
  files,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  files: File[];
  token?: string | null;
}) {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  const videoFiles = files.filter((file) => file.type.startsWith("video/"));

  const uploadedImages = imageFiles.length
    ? await uploadProductImages({
        apiRootUrl,
        productId,
        files: imageFiles,
        token,
      })
    : [];

  const uploadedVideos = videoFiles.length
    ? await uploadProductVideos({
        apiRootUrl,
        productId,
        files: videoFiles,
        token,
      })
    : [];

  return [...uploadedImages, ...uploadedVideos];
}

export async function fetchMediaLibrary({
  apiRootUrl,
  token,
  page = 1,
  limit = 30,
  search = "",
  type = "ALL",
  productId = "",
}: {
  apiRootUrl: string;
  token?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  type?: MediaLibraryFilterType;
  productId?: string;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("type", type);
  params.set("sortBy", "createdAt");
  params.set("sortDirection", "desc");

  if (search.trim()) params.set("search", search.trim());
  if (productId.trim()) params.set("productId", productId.trim());

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/media-library?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    }
  );

  const data = await readJson<MediaLibraryResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Media library load failed: ${response.status}`)
    );
  }

  return {
    items: data?.data?.items || [],
    meta: data?.data?.meta || {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function createExternalProductMedia({
  apiRootUrl,
  productId,
  url,
  title,
  altText,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  url: string;
  title?: string;
  altText?: string;
  token?: string | null;
}) {
  const cleanUrl = url.trim();
  const mediaType = getExternalMediaType(cleanUrl);
  const label =
    title?.trim() ||
    altText?.trim() ||
    (mediaType === "VIDEO" ? "Product video" : "Product image");

  const response = await fetch(`${apiRootUrl}/admin/catalog/media`, {
    method: "POST",
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      scope: "PRODUCT",
      productId,
      businessType: "SHAHSI",
      type: mediaType,
      sourceType: "EXTERNAL_URL",
      url: cleanUrl,
      thumbnailUrl: getExternalThumbnailUrl(cleanUrl, mediaType),
      title: label,
      altText: altText?.trim() || label,
      fileName: "",
      mimeType: mediaType === "VIDEO" ? "external/video" : "external/image",
      position: 0,
      sortOrder: 0,
      isPrimary: false,
      status: "ACTIVE",
    }),
  });

  const data = await readJson<CreateExternalMediaResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `External media create failed: ${response.status}`)
    );
  }

  const media = data?.data?.media || data?.media;

  if (!media) {
    throw new Error(
      "External media create ho gaya but response me media missing hai."
    );
  }

  return media;
}

export async function attachProductMedia({
  apiRootUrl,
  productId,
  mediaIds,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  mediaIds: string[];
  token?: string | null;
}) {
  if (!mediaIds.length) return [];

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(productId)}/media/attach`,
    {
      method: "POST",
      headers: getJsonHeaders(token),
      body: JSON.stringify({ mediaIds }),
    }
  );

  const data = await readJson<AttachProductMediaResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Attach media failed: ${response.status}`)
    );
  }

  return data?.data?.items || data?.items || [];
}

export async function deleteProductMedia({
  apiRootUrl,
  mediaId,
  token,
}: {
  apiRootUrl: string;
  mediaId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/media/${encodeURIComponent(mediaId)}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<DeleteProductMediaResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product media delete failed: ${response.status}`)
    );
  }

  return data;
}

export async function reorderProductMedia({
  apiRootUrl,
  productId,
  mediaIds,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  mediaIds: string[];
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(productId)}/media/reorder`,
    {
      method: "PATCH",
      headers: getJsonHeaders(token),
      body: JSON.stringify({ mediaIds }),
    }
  );

  const data = await readJson<ReorderProductMediaResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product media reorder failed: ${response.status}`)
    );
  }

  return data;
}

/**
 * Backward compatibility old image delete API.
 * New media picker should use deleteProductMedia().
 */
export async function deleteProductImage({
  apiRootUrl,
  imageId,
  token,
}: {
  apiRootUrl: string;
  imageId: string;
  token?: string | null;
}) {
  const response = await fetch(`${apiRootUrl}/catalog/images/${imageId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  const data = await readJson<{ message?: string; error?: unknown }>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product image delete failed: ${response.status}`)
    );
  }

  return data;
}

/**
 * Backward compatibility old image reorder API.
 * New media picker should use reorderProductMedia().
 */
export async function reorderProductImages({
  apiRootUrl,
  productId,
  imageIds,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  imageIds: string[];
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(
      productId
    )}/images/reorder`,
    {
      method: "PATCH",
      headers: getJsonHeaders(token),
      body: JSON.stringify({ imageIds }),
    }
  );

  const data = await readJson<ReorderProductImagesResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product image reorder failed: ${response.status}`)
    );
  }

  return data;
}


type UpdateProductImageResponse = {
  success?: boolean;
  data?: {
    image?: ProductMediaItem;
    media?: ProductMediaItem;
  };
  image?: ProductMediaItem;
  media?: ProductMediaItem;
  message?: string;
  error?: unknown;
};

export async function updateProductImageDetails({
  apiRootUrl,
  imageId,
  token,
  name,
  altText,
  caption,
  viewType,
  position,
  colorName,
  isPrimary,
}: {
  apiRootUrl: string;
  imageId: string;
  token?: string | null;
  name?: string;
  altText?: string;
  caption?: string;
  viewType?: string;
  position?: number | null;
  colorName?: string;
  isPrimary?: boolean;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/images/${encodeURIComponent(imageId)}`,
    {
      method: "PATCH",
      headers: getJsonHeaders(token),
      body: JSON.stringify({
        name: name?.trim() || "",
        altText: altText?.trim() || "",
        caption: caption?.trim() || "",
        viewType: viewType?.trim() || "",
        position: Number(position ?? 0),
        colorName: colorName?.trim() || "",
        isPrimary: Boolean(isPrimary),
      }),
    }
  );

  const data = await readJson<UpdateProductImageResponse>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Product image details update failed: ${response.status}`)
    );
  }

  return data?.data?.image || data?.data?.media || data?.image || data?.media || null;
}


export async function updateProductMediaDetails({
  apiRootUrl,
  mediaId,
  token,
  payload,
}: {
  apiRootUrl: string;
  mediaId: string;
  token?: string | null;
  payload: {
    name?: string | null;
    title?: string | null;
    altText?: string | null;
    caption?: string | null;
    viewType?: string | null;
    colorName?: string | null;
    position?: number | null;
    sortOrder?: number | null;
    isPrimary?: boolean;
    status?: string | null;
  };
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/media/${encodeURIComponent(mediaId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await response.text();

  let data: {
    success?: boolean;
    data?: {
      media?: ProductMediaItem;
    };
    media?: ProductMediaItem;
    message?: string | string[];
    error?: unknown;
  } | null = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Media details update API JSON response nahi de rahi. Body: ${text}`);
    }
  }

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : typeof data?.error === "string"
            ? data.error
            : `Media details update failed: ${response.status}`;

    throw new Error(message);
  }

  return data?.data?.media || data?.media || null;
}

type MediaDetailsApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: unknown;
};

function getMediaDetailsHeaders(token?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readMediaDetailsJson<T>(
  response: Response,
  fallbackMessage: string
): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fallbackMessage}. Body: ${text}`);
  }
}

function getMediaDetailsApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (Array.isArray(record.error)) {
    return record.error.join(", ");
  }

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}


export type ProductMediaTransformMode = "crop" | "resize";

export type ProductMediaTransformPayload = {
  mode: ProductMediaTransformMode;
  aspectRatio?: string | null;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  resize?: {
    width: number;
    height: number;
  } | null;
  gravity?: string | null;
  format?: string | null;
  quality?: string | null;
  saveAsNew?: boolean;
  name?: string | null;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  viewType?: string | null;
  colorName?: string | null;
  position?: number | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
  status?: string | null;
};

type ProductMediaTransformResponse = {
  success?: boolean;
  data?: {
    media?: ProductMediaItem;
    item?: ProductMediaItem;
    data?: ProductMediaItem;
  } | ProductMediaItem;
  media?: ProductMediaItem;
  message?: string;
  error?: unknown;
};

function getTransformApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (Array.isArray(record.error)) {
    return record.error.join(", ");
  }

  if (record.error && typeof record.error === "object") {
    return JSON.stringify(record.error, null, 2);
  }

  return fallback;
}

function extractTransformedMedia(
  data: ProductMediaTransformResponse | null
): ProductMediaItem | null {
  if (!data) return null;

  if (data.media) return data.media;

  if (data.data && "id" in data.data) {
    return data.data as ProductMediaItem;
  }

  if (
    data.data &&
    typeof data.data === "object" &&
    "media" in data.data &&
    data.data.media
  ) {
    return data.data.media as ProductMediaItem;
  }

  if (
    data.data &&
    typeof data.data === "object" &&
    "item" in data.data &&
    data.data.item
  ) {
    return data.data.item as ProductMediaItem;
  }

  if (
    data.data &&
    typeof data.data === "object" &&
    "data" in data.data &&
    data.data.data
  ) {
    return data.data.data as ProductMediaItem;
  }

  return null;
}

export async function transformProductMedia({
  apiRootUrl,
  mediaId,
  payload,
  token,
}: {
  apiRootUrl: string;
  mediaId: string;
  payload: ProductMediaTransformPayload;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/media/${encodeURIComponent(
      mediaId
    )}/transform`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await response.text();

  let data: ProductMediaTransformResponse | null = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text) as ProductMediaTransformResponse;
    } catch {
      throw new Error(`Media transform API JSON response nahi de rahi. Body: ${text}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      getTransformApiError(
        data,
        `Media transform failed: ${response.status} ${response.statusText}`
      )
    );
  }

  return {
    raw: data,
    media: extractTransformedMedia(data),
  };
}
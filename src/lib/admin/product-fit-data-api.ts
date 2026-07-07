export type ProductFitData = {
  fitType?: string | null;
  silhouette?: string | null;
  lengthType?: string | null;
  stretchLevel?: string | null;
  supportLevel?: string | null;
  closureType?: string | null;
  neckline?: string | null;
  sleeveLength?: string | null;
  waistline?: string | null;
  fitNotes?: string | null;
  sizeRecommendationNote?: string | null;
  modelInfo?: {
    height?: string | null;
    wearingSize?: string | null;
    bust?: number | null;
    waist?: number | null;
    hips?: number | null;
  } | null;
  measurementGuide?: {
    bust?: string | null;
    waist?: string | null;
    hips?: string | null;
    length?: string | null;
  } | null;
  sizeChart?: ProductFitSizeChartRow[];
  alterationAllowed?: boolean;
  customSizingAvailable?: boolean;
  recommendedForBodyTypes?: string[];
  notRecommendedForBodyTypes?: string[];
  isActive?: boolean;
};

export type ProductFitSizeChartRow = {
  size: string;
  bust?: number | null;
  waist?: number | null;
  hips?: number | null;
  length?: number | null;
};

export type FitDataOptions = {
  fitTypes: string[];
  silhouettes: string[];
  lengthTypes: string[];
  stretchLevels: string[];
  supportLevels: string[];
  closureTypes: string[];
  necklines: string[];
  sleeveLengths: string[];
  waistlines: string[];
  bodyTypes: string[];
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | string[] | { message?: string | string[] } | null;
  message?: string | string[];
};

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

function getAuthHeaders(token?: string | null) {
  const cleanToken = token ?? getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (cleanToken) {
    headers.Authorization = `Bearer ${cleanToken}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne valid JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ApiResponse<unknown> | null, fallback: string) {
  if (Array.isArray(data?.message)) return data.message.join(", ");
  if (typeof data?.message === "string") return data.message;

  if (Array.isArray(data?.error)) return data.error.join(", ");
  if (typeof data?.error === "string") return data.error;

  if (data?.error && typeof data.error === "object") {
    if (Array.isArray(data.error.message)) return data.error.message.join(", ");
    if (typeof data.error.message === "string") return data.error.message;
  }

  return fallback;
}

function unwrapData<T>(response: ApiResponse<T> | T | null): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data as T;
  }

  return response as T;
}

export async function getFitDataOptions(token?: string | null) {
  const response = await fetch(`${getApiRootUrl()}/admin/fit-data/options`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  const json = await parseJson<ApiResponse<FitDataOptions>>(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Fit data options fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData<FitDataOptions>(json);
}

export async function getProductFitData({
  productId,
  token,
}: {
  productId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/${encodeURIComponent(productId)}/fit-data`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    },
  );

  const json = await parseJson<ApiResponse<ProductFitData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Product fit data fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData<ProductFitData>(json);
}

export async function saveProductFitData({
  productId,
  payload,
  token,
}: {
  productId: string;
  payload: ProductFitData;
  token?: string | null;
}) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/${encodeURIComponent(productId)}/fit-data`,
    {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const json = await parseJson<ApiResponse<ProductFitData>>(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json,
        `Product fit data save failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapData<ProductFitData>(json);
}
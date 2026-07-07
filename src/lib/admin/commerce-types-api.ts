export type CommerceTypeCode =
  | "SHOP"
  | "RENTAL"
  | "RESALE"
  | "MTO"
  | "SUBSCRIPTION";

export type CommerceTypeMaster = {
  id?: string;
  name: string;
  code: CommerceTypeCode;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  config?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CommerceTypePayload = {
  name: string;
  code: CommerceTypeCode;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
};


export type CommerceTypeUpdatePayload = Omit<CommerceTypePayload, "code">;

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | string[] | { message?: string | string[] };
  message?: string | string[];
};

function getApiRootUrl() {
  return "/api/proxy";
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

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne valid JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.error)) return data.error.join(", ");
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    if (Array.isArray(data.error.message)) return data.error.message.join(", ");
    if (typeof data.error.message === "string") return data.error.message;
  }

  return fallback;
}

function unwrapArrayResponse<T>(json: ApiResponse<T[]> | T[]): T[] {
  if (Array.isArray(json)) return json;

  if (json && typeof json === "object" && Array.isArray(json.data)) {
    return json.data;
  }

  return [];
}

function unwrapObjectResponse<T>(json: ApiResponse<T> | T): T {
  if (json && typeof json === "object" && "data" in json) {
    return (json as ApiResponse<T>).data as T;
  }

  return json as T;
}

export async function getCommerceTypes() {
  const response = await fetch(`${getApiRootUrl()}/admin/commerce-types`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster[]> | CommerceTypeMaster[]
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce types fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapArrayResponse<CommerceTypeMaster>(json);
}

export async function getActiveCommerceTypes() {
  const response = await fetch(`${getApiRootUrl()}/admin/commerce-types/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster[]> | CommerceTypeMaster[]
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Active commerce types fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapArrayResponse<CommerceTypeMaster>(json);
}

export async function saveCommerceType(payload: CommerceTypePayload) {
  const response = await fetch(`${getApiRootUrl()}/admin/commerce-types`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster> | CommerceTypeMaster
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce type save failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapObjectResponse<CommerceTypeMaster>(json);
}


export async function getCommerceTypeById(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/commerce-types/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster> | CommerceTypeMaster
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce type fetch failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapObjectResponse<CommerceTypeMaster>(json);
}



export async function updateCommerceType(
  id: string,
  payload: CommerceTypeUpdatePayload,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/commerce-types/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster> | CommerceTypeMaster
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce type update failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapObjectResponse<CommerceTypeMaster>(json);
}

export async function activateCommerceType(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/commerce-types/${encodeURIComponent(id)}/activate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster> | CommerceTypeMaster
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce type activate failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapObjectResponse<CommerceTypeMaster>(json);
}

export async function deactivateCommerceType(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/commerce-types/${encodeURIComponent(id)}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const json = await parseJson<
    ApiResponse<CommerceTypeMaster> | CommerceTypeMaster
  >(response);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        json as ApiResponse<unknown>,
        `Commerce type deactivate failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return unwrapObjectResponse<CommerceTypeMaster>(json);
}
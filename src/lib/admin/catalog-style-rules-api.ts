export type CatalogStyleRuleStatus = "ACTIVE" | "INACTIVE";
export type CatalogStyleRuleBusinessType = "SHAHSI" | "GOWNLOOP";

export type CatalogStyleRuleCondition = {
  field: string;
  operator: string;
  value: string;
};

export type CatalogStyleRuleAction = {
  field: string;
  value: string[];
};

export type CatalogStyleRule = {
  id: string;
  name: string;
  description: string | null;
  businessType: CatalogStyleRuleBusinessType;
  status: CatalogStyleRuleStatus;
  priority: number;
  conditions: CatalogStyleRuleCondition[];
  actions: CatalogStyleRuleAction[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogStyleRulesListResponse = {
  items: CatalogStyleRule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CatalogStyleRulesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: CatalogStyleRuleStatus | "";
  businessType?: CatalogStyleRuleBusinessType | "";
  conditionField?: string;
};

export type CatalogStyleRuleFormValues = {
  name: string;
  description?: string;
  businessType: CatalogStyleRuleBusinessType;
  status: CatalogStyleRuleStatus;
  priority: number;
  conditions: CatalogStyleRuleCondition[];
  actions: CatalogStyleRuleAction[];
};
export type CatalogStyleRulePreviewProduct = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type CatalogStyleRulePreviewResult = {
  matchedProducts: number;
  sampleProducts: CatalogStyleRulePreviewProduct[];
};

export type CatalogStyleRuleFieldGroup = "PRODUCT" | "STYLE_DATA";

export type CatalogStyleRuleDataType = "SCALAR" | "ARRAY";

export type CatalogStyleRuleValueType =
  | "SELECT"
  | "CHIPS"
  | "CATEGORY_SELECT"
  | "PRODUCT_TYPE_SELECT"
  | "BRAND_SELECT";

export type CatalogStyleRuleSelectOption = {
  value: string;
  label: string;
};

export type CatalogStyleRuleConditionField = {
  key: string;
  label: string;
  group: CatalogStyleRuleFieldGroup;
  dataType: CatalogStyleRuleDataType;
  description: string;
  example: string;
  operators: string[];
  valueType: CatalogStyleRuleValueType;
  multiple: boolean;
  options: CatalogStyleRuleSelectOption[];
};

export type CatalogStyleRuleActionField = {
  key: string;
  label: string;
  description: string;
  valueType: CatalogStyleRuleValueType;
  multiple: boolean;
  options: CatalogStyleRuleSelectOption[];
};

export type CatalogStyleRuleOptions = {
  conditionFields: CatalogStyleRuleConditionField[];
  actionFields: CatalogStyleRuleActionField[];
  operatorLabels: Record<string, string>;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | null;
  message?: string | string[];
};

function getApiRootUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_ADMIN_API_URL missing hai.");
  }

  return rawUrl.replace(/\/$/, "");
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getApiError(data: unknown, fallback: string) {
  const response = data as ApiResponse<unknown>;

  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }

  if (typeof response?.message === "string") {
    return response.message;
  }

  if (typeof response?.error === "string") {
    return response.error;
  }

  return fallback;
}

function unwrapData<T>(data: ApiResponse<T> | T | null, fallback: T): T {
  if (!data) return fallback;

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    (data as ApiResponse<T>).data !== undefined
  ) {
    return (data as ApiResponse<T>).data as T;
  }

  return data as T;
}

function appendParam(params: URLSearchParams, key: string, value?: unknown) {
  if (value === undefined || value === null || value === "") return;

  const text = String(value).trim();

  if (!text) return;

  params.set(key, text);
}

export async function getCatalogStyleRules(
  params: CatalogStyleRulesListParams = {},
) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 1);
  appendParam(searchParams, "limit", params.limit ?? 20);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "businessType", params.businessType);
  appendParam(searchParams, "conditionField", params.conditionField);

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules?${searchParams.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await parseJson<ApiResponse<CatalogStyleRulesListResponse>>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rules load failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRulesListResponse>(json, {
    items: [],
    meta: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
  });
}

export async function getCatalogStyleRuleOptions() {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/options`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleRuleOptions>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        json,
        `Style rule options load failed: ${response.status}`,
      ),
    );
  }

  return unwrapData<CatalogStyleRuleOptions>(json, {
    conditionFields: [],
    actionFields: [],
    operatorLabels: {},
  });
}

export async function createCatalogStyleRule(
  values: CatalogStyleRuleFormValues,
) {
  const response = await fetch(`${getApiRootUrl()}/admin/catalog/style-rules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(values),
  });

  const json = await parseJson<ApiResponse<CatalogStyleRule>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule create failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRule>(json, {} as CatalogStyleRule);
}


export async function updateCatalogStyleRule(
  id: string,
  values: CatalogStyleRuleFormValues,
) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(values),
    },
  );

  const json = await parseJson<ApiResponse<CatalogStyleRule>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule update failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRule>(json, {} as CatalogStyleRule);
}

export async function activateCatalogStyleRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/${encodeURIComponent(
      id,
    )}/activate`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<CatalogStyleRule>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule activate failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRule>(json, {} as CatalogStyleRule);
}

export async function deactivateCatalogStyleRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/${encodeURIComponent(
      id,
    )}/deactivate`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<CatalogStyleRule>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule deactivate failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRule>(json, {} as CatalogStyleRule);
}
export async function archiveCatalogStyleRule(id: string) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  const json = await parseJson<ApiResponse<CatalogStyleRule>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule archive failed: ${response.status}`),
    );
  }

  return json?.data ?? null;
}
export async function previewCatalogStyleRule(values: {
  conditions: CatalogStyleRuleCondition[];
  actions: CatalogStyleRuleAction[];
}) {
  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/style-rules/preview`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        conditions: values.conditions,
        actions: values.actions,
      }),
    },
  );

  const json =
    await parseJson<ApiResponse<CatalogStyleRulePreviewResult>>(response);

  if (!response.ok) {
    throw new Error(
      getApiError(json, `Style rule preview failed: ${response.status}`),
    );
  }

  return unwrapData<CatalogStyleRulePreviewResult>(json, {
    matchedProducts: 0,
    sampleProducts: [],
  });
}
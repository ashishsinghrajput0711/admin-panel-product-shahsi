import type {
  BaseRecord,
  CreateParams,
  CreateResponse,
  CustomParams,
  CustomResponse,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, unknown>;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

if (!RAW_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_ADMIN_API_URL missing hai. .env.local me real backend URL set karo."
  );
}

function getApiRootUrl() {
  const cleanUrl = RAW_API_URL!.replace(/\/$/, "");

  if (cleanUrl.endsWith("/admin/catalog")) {
    return cleanUrl.replace(/\/admin\/catalog$/, "");
  }

  return cleanUrl;
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

function buildUrl(path: string, query?: Record<string, unknown>) {
  const cleanBase = getApiRootUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(`${cleanBase}${cleanPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestUrl = buildUrl(path, options.query);

  console.log("ADMIN_API_REQUEST:", {
    url: requestUrl,
    method: options.method ?? "GET",
  });

  const response = await fetch(requestUrl, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `API request failed: ${response.status} ${response.statusText}`;

    throw new Error(`${path} - ${message}`);
  }

  return data as T;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getNestedRecords(response: unknown) {
  const root = getRecord(response);
  const data1 = getRecord(root?.data);
  const data2 = getRecord(data1?.data);
  const data3 = getRecord(data2?.data);

  return [root, data1, data2, data3].filter(Boolean) as Record<
    string,
    unknown
  >[];
}

function readArrayFromRecords(
  records: Record<string, unknown>[],
  allowedKeys: string[]
) {
  for (const record of records) {
    if (Array.isArray(record)) return record;

    for (const key of allowedKeys) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }

  return null;
}

function readTotalFromRecords(records: Record<string, unknown>[], fallback: number) {
  const totalKeys = [
    "total",
    "totalCount",
    "totalItems",
    "count",
    "recordsTotal",
  ];

  for (const record of records) {
    for (const key of totalKeys) {
      const value = record[key];

      if (typeof value === "number") return value;

      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
  }

  return fallback;
}

function unwrapList<T>(
  response: unknown,
  resource: string
): { data: T[]; total: number } {
  console.log("ADMIN_API_LIST_RESPONSE:", {
    resource,
    response,
  });

  const records = getNestedRecords(response);

  if (!records.length) {
    throw new Error(`${resource} API response object nahi hai.`);
  }

  const resourceArrayMap: Record<string, string[]> = {
    products: ["products", "items", "results", "records", "data"],
    variants: ["variants", "items", "results", "records", "data"],
    attributes: ["attributes", "items", "results", "records", "data"],
    pricing: ["rules", "pricingRules", "items", "results", "records", "data"],
    inventory: [
      "assets",
      "inventoryAssets",
      "items",
      "results",
      "records",
      "data",
    ],
    "commerce-models": ["commerceTypes", "types", "items", "records", "data"],
    media: ["media", "images", "items", "records", "data"],
    search: ["results", "products", "searchResults", "items", "records", "data"],
    publishing: ["products", "records", "items", "data"],
  };

  const allowedKeys = resourceArrayMap[resource];

  if (!allowedKeys) {
    throw new Error(`${resource} list mapping configured nahi hai.`);
  }

  const list = readArrayFromRecords(records, allowedKeys);

  if (!list) {
    throw new Error(
      `${resource} API response me expected real array nahi mila. Expected keys: ${allowedKeys.join(
        ", "
      )}.`
    );
  }

  const total = readTotalFromRecords(records, list.length);

  return {
    data: list as T[],
    total,
  };
}

function unwrapOne<T>(response: unknown, resource: string): T {
  if (!response || typeof response !== "object") {
    throw new Error(`${resource} API response object nahi hai.`);
  }

  const record = response as Record<string, unknown>;

  const possibleKeys = [
    "data",
    "product",
    "item",
    "attribute",
    "rule",
    "pricingRule",
    "asset",
    "inventoryAsset",
    "commerceType",
    "record",
  ];

  for (const key of possibleKeys) {
    if (record[key] && typeof record[key] === "object") {
      return record[key] as T;
    }
  }

  if ("id" in record) {
    return record as T;
  }

  throw new Error(`${resource} detail response me valid record nahi mila.`);
}

function getPaginationQuery(params: GetListParams) {
  const pagination = params.pagination as
    | (GetListParams["pagination"] & { current?: number })
    | undefined;
  const current = pagination?.currentPage ?? pagination?.current ?? 1;
  const pageSize = pagination?.pageSize ?? 20;

  const query: Record<string, unknown> = {
    page: current,
    limit: pageSize,
  };

  const sorter = params.sorters?.[0];

  if (sorter) {
    query.sortBy = sorter.field;
    query.sortOrder = sorter.order;
  }

  params.filters?.forEach((filter) => {
    if ("field" in filter && "value" in filter) {
      query[filter.field] = filter.value;
    }
  });

  return query;
}

function getMetaValue(params: unknown, key: string) {
  if (!params || typeof params !== "object") return undefined;

  const record = params as Record<string, unknown>;
  const meta = record.meta;

  if (!meta || typeof meta !== "object") return undefined;

  return (meta as Record<string, unknown>)[key];
}

function getVariableValue(variables: unknown, key: string) {
  if (!variables || typeof variables !== "object") return undefined;

  return (variables as Record<string, unknown>)[key];
}

function getResourceEndpoint(resource: string) {
  switch (resource) {
    case "products":
      return {
        list: "/admin/catalog",
        create: "/catalog",
        one: (id: string | number) => `/admin/catalog/${id}/detail`,
        update: (id: string | number) => `/admin/catalog/${id}/basic-info`,
      };

    case "attributes":
      return {
        list: "/admin/attributes",
        create: "/admin/attributes",
        one: (id: string | number) => `/admin/attributes/${id}`,
        update: (id: string | number) => `/admin/attributes/${id}`,
      };

    case "pricing":
      return {
        list: "/admin/pricing/rules",
        create: "/admin/pricing/rules",
        one: (id: string | number) => `/admin/pricing/rules/${id}`,
        update: (id: string | number) => `/admin/pricing/rules/${id}`,
        deleteOne: (id: string | number) => `/admin/pricing/rules/${id}`,
      };

    case "inventory":
      return {
        list: "/admin/inventory/assets",
        create: "/admin/inventory/assets",
        one: (id: string | number) => `/admin/inventory/assets/${id}`,
        update: (id: string | number) => `/admin/inventory/assets/${id}`,
        deleteOne: (id: string | number) => `/admin/inventory/assets/${id}`,
      };

    case "commerce-models":
      return {
        list: "/admin/commerce-types",
        create: "/admin/commerce-types",
        one: (id: string | number) => `/admin/commerce-types/${id}`,
        update: (id: string | number) => `/admin/commerce-types/${id}`,
      };

    case "search":
      return {
        list: "/admin/catalog/products/search",
        create: "/admin/catalog/products/search",
        one: (id: string | number) => `/admin/catalog/products/search/${id}`,
        update: (id: string | number) =>
          `/admin/catalog/products/search/${id}`,
      };

    default:
      throw new Error(`${resource} endpoint mapping configured nahi hai.`);
  }
}

export const adminDataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams
  ): Promise<GetListResponse<TData>> => {
    const { resource } = params;

    if (resource === "products") {
      const response = await apiRequest<unknown>("/admin/catalog", {
        query: getPaginationQuery(params),
      });

      return unwrapList<TData>(response, "products");
    }

    if (resource === "variants") {
      const productId = getMetaValue(params, "productId");

      if (!productId) {
        throw new Error("Variants list ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/variants`,
        {
          query: getPaginationQuery(params),
        }
      );

      return unwrapList<TData>(response, "variants");
    }

    if (resource === "media") {
      const productId = getMetaValue(params, "productId");

      if (!productId) {
        throw new Error("Media list ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/media`,
        {
          query: getPaginationQuery(params),
        }
      );

      return unwrapList<TData>(response, "media");
    }

    if (resource === "fit-data") {
      throw new Error("Fit Data ke liye backend list endpoint configured nahi hai.");
    }

    if (resource === "style-data") {
      throw new Error("Style Data ke liye backend list endpoint configured nahi hai.");
    }

    if (resource === "publishing") {
      const response = await apiRequest<unknown>("/admin/catalog", {
        query: getPaginationQuery(params),
      });

      return unwrapList<TData>(response, "publishing");
    }

    const endpoint = getResourceEndpoint(resource);

    const response = await apiRequest<unknown>(endpoint.list, {
      query: getPaginationQuery(params),
    });

    return unwrapList<TData>(response, resource);
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams
  ): Promise<GetOneResponse<TData>> => {
    const { resource, id } = params;

    if (resource === "variants") {
      const productId = getMetaValue(params, "productId");

      if (!productId) {
        throw new Error("Variant detail ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/variants/${id}`
      );

      return {
        data: unwrapOne<TData>(response, "variants"),
      };
    }

    if (resource === "media") {
      const response = await apiRequest<unknown>(`/admin/catalog/${id}/media`);

      return {
        data: unwrapOne<TData>(response, "media"),
      };
    }

    if (resource === "fit-data") {
      throw new Error("Fit Data detail ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "style-data") {
      throw new Error("Style Data detail ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "publishing") {
      const response = await apiRequest<unknown>(
        `/admin/catalog/${id}/status-history`
      );

      return {
        data: unwrapOne<TData>(response, "publishing"),
      };
    }

    const endpoint = getResourceEndpoint(resource);

    const response = await apiRequest<unknown>(endpoint.one(id));

    return {
      data: unwrapOne<TData>(response, resource),
    };
  },

  create: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: CreateParams<TVariables>
  ): Promise<CreateResponse<TData>> => {
    const { resource, variables } = params;

    if (resource === "variants") {
      const productId =
        getMetaValue(params, "productId") ||
        getVariableValue(variables, "productId");

      if (!productId) {
        throw new Error("Variant create ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/variants`,
        {
          method: "POST",
          body: variables,
        }
      );

      return {
        data: unwrapOne<TData>(response, "variants"),
      };
    }

    if (resource === "media") {
      const productId =
        getMetaValue(params, "productId") ||
        getVariableValue(variables, "productId");

      if (!productId) {
        throw new Error("Media create ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(`/catalog/${productId}/images`, {
        method: "POST",
        body: variables,
      });

      return {
        data: unwrapOne<TData>(response, "media"),
      };
    }

    if (resource === "fit-data") {
      throw new Error("Fit Data create ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "style-data") {
      throw new Error("Style Data create ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "publishing") {
      const productId =
        getMetaValue(params, "productId") ||
        getVariableValue(variables, "productId");

      if (!productId) {
        throw new Error("Publishing create ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/publish`,
        {
          method: "PATCH",
          body: variables,
        }
      );

      return {
        data: unwrapOne<TData>(response, "publishing"),
      };
    }

    const endpoint = getResourceEndpoint(resource);

    const response = await apiRequest<unknown>(endpoint.create, {
      method: "POST",
      body: variables,
    });

    return {
      data: unwrapOne<TData>(response, resource),
    };
  },

  update: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: UpdateParams<TVariables>
  ): Promise<UpdateResponse<TData>> => {
    const { resource, id, variables } = params;

    if (resource === "products") {
      const section = getMetaValue(params, "section");

      const endpoint =
        section === "commerce"
          ? `/admin/catalog/${id}/commerce-settings`
          : section === "pricing"
            ? `/admin/catalog/${id}/pricing`
            : section === "availability"
              ? `/admin/catalog/${id}/availability`
              : section === "tags"
                ? `/admin/catalog/${id}/tags`
                : section === "collections"
                  ? `/admin/catalog/${id}/collections`
                  : section === "seo"
                    ? `/admin/catalog/${id}/seo`
                    : section === "status"
                      ? `/admin/catalog/${id}/status`
                      : `/admin/catalog/${id}/basic-info`;

      const response = await apiRequest<unknown>(endpoint, {
        method: "PATCH",
        body: variables,
      });

      return {
        data: unwrapOne<TData>(response, "products"),
      };
    }

    if (resource === "variants") {
      const productId =
        getMetaValue(params, "productId") ||
        getVariableValue(variables, "productId");

      if (!productId) {
        throw new Error("Variant update ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/variants/${id}`,
        {
          method: "PATCH",
          body: variables,
        }
      );

      return {
        data: unwrapOne<TData>(response, "variants"),
      };
    }

    if (resource === "media") {
      const response = await apiRequest<unknown>(`/admin/catalog/images/${id}`, {
        method: "PATCH",
        body: variables,
      });

      return {
        data: unwrapOne<TData>(response, "media"),
      };
    }

    if (resource === "fit-data") {
      throw new Error("Fit Data update ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "style-data") {
      throw new Error("Style Data update ke liye backend endpoint configured nahi hai.");
    }

    if (resource === "publishing") {
      const action = getMetaValue(params, "action");

      const endpoint =
        action === "unpublish"
          ? `/admin/catalog/${id}/unpublish`
          : action === "status"
            ? `/admin/catalog/${id}/status`
            : `/admin/catalog/${id}/publish`;

      const response = await apiRequest<unknown>(endpoint, {
        method: "PATCH",
        body: variables,
      });

      return {
        data: unwrapOne<TData>(response, "publishing"),
      };
    }

    const endpoint = getResourceEndpoint(resource);

    const response = await apiRequest<unknown>(endpoint.update(id), {
      method: "PATCH",
      body: variables,
    });

    return {
      data: unwrapOne<TData>(response, resource),
    };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: DeleteOneParams<TVariables>
  ): Promise<DeleteOneResponse<TData>> => {
    const { resource, id } = params;

    if (resource === "products") {
      const response = await apiRequest<unknown>("/admin/catalog/bulk", {
        method: "DELETE",
        body: {
          ids: [id],
        },
      });

      return {
        data: unwrapOne<TData>(response, "products"),
      };
    }

    if (resource === "variants") {
      const productId = getMetaValue(params, "productId");

      if (!productId) {
        throw new Error("Variant delete ke liye real productId required hai.");
      }

      const response = await apiRequest<unknown>(
        `/admin/catalog/${productId}/variants/${id}`,
        {
          method: "DELETE",
        }
      );

      return {
        data: unwrapOne<TData>(response, "variants"),
      };
    }

    if (resource === "media") {
      const response = await apiRequest<unknown>(`/catalog/images/${id}`, {
        method: "DELETE",
      });

      return {
        data: unwrapOne<TData>(response, "media"),
      };
    }

    const endpoint = getResourceEndpoint(resource);

    if (!("deleteOne" in endpoint) || !endpoint.deleteOne) {
      throw new Error(`${resource} delete endpoint configured nahi hai.`);
    }

    const response = await apiRequest<unknown>(endpoint.deleteOne(id), {
      method: "DELETE",
    });

    return {
      data: unwrapOne<TData>(response, resource),
    };
  },

  getApiUrl: () => getApiRootUrl(),

  custom: async <
    TData extends BaseRecord = BaseRecord,
    TQuery = unknown,
    TPayload = unknown,
  >({
    url,
    method,
    payload,
    query,
  }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> => {
    const response = await apiRequest<TData>(url, {
      method: method as HttpMethod,
      body: payload,
      query: query as Record<string, unknown> | undefined,
    });

    return {
      data: response,
    };
  },
};

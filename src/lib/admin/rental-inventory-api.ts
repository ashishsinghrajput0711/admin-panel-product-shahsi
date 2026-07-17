export type RentalInventoryVariant = {
  id: string;
  productId: string;
  size?: string | null;
  color?: string | null;
  colorFamily?: string | null;
  variantType?: string | null;
  rentalPackageName?: string | null;
  sku?: string | null;
  variantSku?: string | null;
  rentalPrice?: number | null;
  stock?: number | null;
  reservedStock?: number | null;
  isActive?: boolean | null;
  isAvailable?: boolean | null;
  status?: string | null;
};

export type CreateRentalInventoryUnitPayload = {
  productId: string;
  variantId?: string;
  skuCode: string;
  condition?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?:
    | string
    | string[]
    | {
        message?: string | string[];
      };
  message?: string | string[];
};

function getHeaders(token?: string | null): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Backend ne valid JSON response nahi diya. Status: ${response.status}`,
    );
  }
}

function getErrorMessage(
  response: ApiResponse<unknown>,
  fallback: string,
) {
  if (Array.isArray(response.message)) {
    return response.message.join(", ");
  }

  if (typeof response.message === "string") {
    return response.message;
  }

  if (Array.isArray(response.error)) {
    return response.error.join(", ");
  }

  if (typeof response.error === "string") {
    return response.error;
  }

  if (
    response.error &&
    typeof response.error === "object"
  ) {
    if (Array.isArray(response.error.message)) {
      return response.error.message.join(", ");
    }

    if (typeof response.error.message === "string") {
      return response.error.message;
    }
  }

  return fallback;
}

export async function getProductRentalVariants({
  apiRootUrl,
  productId,
  token,
}: {
  apiRootUrl: string;
  productId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/${encodeURIComponent(
      productId,
    )}/variants`,
    {
      method: "GET",
      headers: getHeaders(token),
      cache: "no-store",
    },
  );

  const json =
    await readJson<ApiResponse<RentalInventoryVariant[]>>(
      response,
    );

  if (!response.ok || json.success === false) {
    throw new Error(
      getErrorMessage(
        json,
        `Product variants load failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  if (!Array.isArray(json.data)) {
    throw new Error(
      "Product variants API ne expected data array return nahi ki.",
    );
  }

  return json.data;
}

export async function createRentalInventoryUnit({
  apiRootUrl,
  payload,
  token,
}: {
  apiRootUrl: string;
  payload: CreateRentalInventoryUnitPayload;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/rental/inventory-unit`,
    {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const json =
    await readJson<ApiResponse<Record<string, unknown>>>(
      response,
    );

  if (!response.ok || json.success === false) {
    throw new Error(
      getErrorMessage(
        json,
        `Rental inventory unit create failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return json;
}
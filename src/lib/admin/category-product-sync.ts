type CategoryProductsResponse = {
  success?: boolean;
  data?: {
    products?: Array<{ id?: string } | string>;
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
  products?: Array<{ id?: string } | string>;
  message?: string;
  error?: unknown;
};

type SyncCategoryProductsInput = {
  apiRootUrl: string;
  productId: string;
  selectedCategorySlugs: string[];
  previousCategorySlugs?: string[];
  token?: string | null;
};

function uniqueValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractProductIds(response: CategoryProductsResponse | null) {
  const products = response?.data?.products || response?.products || [];

  return products
    .map((product) => {
      if (typeof product === "string") return product;
      return product.id || "";
    })
    .filter(Boolean);
}

async function getCategoryProductIds({
  apiRootUrl,
  slug,
  token,
}: {
  apiRootUrl: string;
  slug: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug
    )}/products?page=1&limit=200`,
    {
      method: "GET",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<CategoryProductsResponse>(response);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Category products load failed for ${slug}: ${response.status}`
    );
  }

  return extractProductIds(data);
}

async function assignProductToCategory({
  apiRootUrl,
  slug,
  productId,
  token,
}: {
  apiRootUrl: string;
  slug: string;
  productId: string;
  token?: string | null;
}) {
  const existingIds = await getCategoryProductIds({
    apiRootUrl,
    slug,
    token,
  });

  const productIds = uniqueValues([...existingIds, productId]);

  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug
    )}/products`,
    {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        productIds,
        sortOrder: productIds.map((nextProductId, index) => ({
          productId: nextProductId,
          position: index,
        })),
      }),
    }
  );

  const data = await readJson<{ message?: string }>(response);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Product category assign failed for ${slug}: ${response.status}`
    );
  }
}

async function removeProductFromCategory({
  apiRootUrl,
  slug,
  productId,
  token,
}: {
  apiRootUrl: string;
  slug: string;
  productId: string;
  token?: string | null;
}) {
  const response = await fetch(
    `${apiRootUrl}/admin/catalog/categories/${encodeURIComponent(
      slug
    )}/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    }
  );

  const data = await readJson<{ message?: string }>(response);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Product category remove failed for ${slug}: ${response.status}`
    );
  }
}

export async function syncProductCategories({
  apiRootUrl,
  productId,
  selectedCategorySlugs,
  previousCategorySlugs = [],
  token,
}: SyncCategoryProductsInput) {
  const nextSlugs = uniqueValues(selectedCategorySlugs);
  const oldSlugs = uniqueValues(previousCategorySlugs);

  const removedSlugs = oldSlugs.filter((slug) => !nextSlugs.includes(slug));

  for (const slug of nextSlugs) {
    await assignProductToCategory({
      apiRootUrl,
      slug,
      productId,
      token,
    });
  }

  for (const slug of removedSlugs) {
    await removeProductFromCategory({
      apiRootUrl,
      slug,
      productId,
      token,
    });
  }
}
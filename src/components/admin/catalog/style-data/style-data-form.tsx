"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  styleDataSchema,
  type StyleDataFormValues,
} from "./style-data-schema";
import {
  getCatalogStyleDataOptions,
} from "@/lib/admin/catalog-style-data-api";
import type {
  CatalogStyleDataOptions,
  StyleData,
} from "./style-data-types";

type ProductPickerItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  sku?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  productImage?: string | null;
};

type VariantPickerItem = {
  id: string;
  title?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
};

const emptyOptions: CatalogStyleDataOptions = {
  status: [],
  scope: [],
  businessType: [],
  occasion: [],
  colorFamily: [],
  fabricFeel: [],
  neckline: [],
  sleeveType: [],
  silhouette: [],
  modestyLevel: [],
  season: [],
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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function unwrapItems<T>(json: unknown): T[] {
  const data = json as {
    data?: {
      items?: T[];
      products?: T[];
      variants?: T[];
    };
    items?: T[];
    products?: T[];
    variants?: T[];
  };

  return (
    data?.data?.items ||
    data?.data?.products ||
    data?.data?.variants ||
    data?.items ||
    data?.products ||
    data?.variants ||
    []
  );
}

async function searchProducts(searchText: string) {
  const params = new URLSearchParams();

  params.set("page", "1");
  params.set("limit", "10");

  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/products/picker?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await readJson<unknown>(response);

  if (!response.ok) {
    throw new Error("Product picker load nahi ho paaya.");
  }

  return unwrapItems<ProductPickerItem>(json);
}

async function searchProductVariants(productId: string) {
  if (!productId) return [];

  const response = await fetch(
    `${getApiRootUrl()}/admin/catalog/products/${encodeURIComponent(
      productId,
    )}/variants`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  const json = await readJson<unknown>(response);

  if (!response.ok) {
    return [];
  }

  return unwrapItems<VariantPickerItem>(json);
}

function mapDefaultValues(defaultValues?: Partial<StyleData | StyleDataFormValues>) {
  const raw = defaultValues as Partial<StyleData & StyleDataFormValues> | undefined;

  return {
    productId: raw?.productId || "",
    variantId: raw?.variantId || "",
    scope: raw?.scope || "PRODUCT",
    businessType: raw?.businessType || "SHAHSI",
    status: raw?.status || "DRAFT",

    occasion: Array.isArray(raw?.occasion) ? raw.occasion : [],
    colorFamily: raw?.colorFamily || "",
    fabricFeel: raw?.fabricFeel || "",
    neckline: raw?.neckline || "",
    sleeveType: raw?.sleeveType || "",
    silhouette: raw?.silhouette || "",
    modestyLevel: raw?.modestyLevel || "",
    season: Array.isArray(raw?.season) ? raw.season : [],

    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    stylingKeywords: Array.isArray(raw?.stylingKeywords)
      ? raw.stylingKeywords
      : [],
    aiStylingNotes: raw?.aiStylingNotes || "",
  } satisfies StyleDataFormValues;
}

export function StyleDataForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<StyleData | StyleDataFormValues>;
  onSubmit: (values: StyleDataFormValues) => void;
  isSubmitting?: boolean;
}) {
  const [options, setOptions] = useState<CatalogStyleDataOptions>(emptyOptions);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductPickerItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductPickerItem | null>(null);

  const [variants, setVariants] = useState<VariantPickerItem[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const form = useForm<StyleDataFormValues>({
    resolver: zodResolver(styleDataSchema) as Resolver<StyleDataFormValues>,
    defaultValues: mapDefaultValues(defaultValues),
  });

  const scope = form.watch("scope");
  const productId = form.watch("productId");

  const selectedOccasion = form.watch("occasion") || [];
  const selectedSeason = form.watch("season") || [];
  const selectedTags = form.watch("tags") || [];
  const selectedStylingKeywords = form.watch("stylingKeywords") || [];

  const productLabel = useMemo(() => {
    if (selectedProduct) {
      return (
        selectedProduct.name ||
        selectedProduct.title ||
        selectedProduct.sku ||
        selectedProduct.id
      );
    }

    const raw = defaultValues as Partial<StyleData> | undefined;

    return raw?.productName || raw?.productSku || productId || "";
  }, [defaultValues, productId, selectedProduct]);

  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      try {
        setOptionsLoading(true);
        setOptionsError("");

        const result = await getCatalogStyleDataOptions();

        if (!ignore) {
          setOptions(result);
        }
      } catch (error) {
        if (!ignore) {
          setOptionsError(
            error instanceof Error
              ? error.message
              : "Style data options load nahi ho paaye.",
          );
        }
      } finally {
        if (!ignore) {
          setOptionsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setProductsLoading(true);
        const result = await searchProducts(productSearch);

        if (!ignore) {
          setProducts(result);
        }
      } catch {
        if (!ignore) {
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setProductsLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(loadProducts, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [productSearch]);

  useEffect(() => {
    let ignore = false;

    async function loadVariants() {
      if (!productId || scope !== "VARIANT") {
        setVariants([]);
        return;
      }

      try {
        setVariantsLoading(true);
        const result = await searchProductVariants(productId);

        if (!ignore) {
          setVariants(result);
        }
      } catch {
        if (!ignore) {
          setVariants([]);
        }
      } finally {
        if (!ignore) {
          setVariantsLoading(false);
        }
      }
    }

    loadVariants();

    return () => {
      ignore = true;
    };
  }, [productId, scope]);

  useEffect(() => {
    if (scope === "PRODUCT") {
      form.setValue("variantId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, scope]);

  function selectProduct(product: ProductPickerItem) {
    setSelectedProduct(product);
    setProductSearch("");
    setProducts([]);
    form.setValue("productId", product.id, {
      shouldDirty: true,
      shouldValidate: true,
    });

    form.setValue("variantId", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function removeProduct() {
    setSelectedProduct(null);
    form.setValue("productId", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("variantId", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleArrayValue(
    field: "occasion" | "season",
    value: string,
  ) {
    const current = form.getValues(field) || [];

    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    form.setValue(field, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addTag(field: "tags" | "stylingKeywords", value: string) {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    const current = form.getValues(field) || [];

    if (current.includes(cleanValue)) return;

    form.setValue(field, [...current, cleanValue], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function removeTag(field: "tags" | "stylingKeywords", value: string) {
    const current = form.getValues(field) || [];

    form.setValue(
      field,
      current.filter((item) => item !== value),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  function handleSubmit(values: StyleDataFormValues) {
    const payload: StyleDataFormValues = {
      ...values,
      productId: values.productId.trim(),
      variantId:
        values.scope === "VARIANT" ? values.variantId?.trim() || "" : "",
      aiStylingNotes: values.aiStylingNotes?.trim() || "",
    };

    onSubmit(payload);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {optionsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {optionsError}
        </div>
      ) : null}

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Style Data Target</h2>

        <p className="mt-2 text-sm text-neutral-500">
          Product scope me variant ID nahi bhejna. Variant scope me valid variant
          required hoga.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Scope"
            error={form.formState.errors.scope?.message}
          >
            <select
              {...form.register("scope")}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              {(options.scope.length ? options.scope : ["PRODUCT", "VARIANT"]).map(
                (value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field
            label="Business Type"
            error={form.formState.errors.businessType?.message}
          >
            <select
              {...form.register("businessType")}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              {(options.businessType.length
                ? options.businessType
                : ["SHAHSI", "GOWNLOOP"]
              ).map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Status"
            error={form.formState.errors.status?.message}
          >
            <select
              {...form.register("status")}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              {(options.status.length
                ? options.status
                : ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
              ).map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Field
            label="Product"
            error={form.formState.errors.productId?.message}
          >
            {productId ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-950">
                    {productLabel || "Selected product"}
                  </p>
                  <p className="mt-1 break-all text-xs text-neutral-500">
                    {productId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={removeProduct}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-neutral-500 ring-1 ring-neutral-200 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-3">
                  <Search className="mr-2 h-4 w-4 text-neutral-400" />
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product by name, SKU, slug..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  {productsLoading ? (
                    <div className="p-4 text-sm text-neutral-500">
                      Loading products...
                    </div>
                  ) : products.length ? (
                    products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className="flex w-full items-center gap-3 border-b border-neutral-100 p-3 text-left hover:bg-[#fbfaf6]"
                      >
                        <ProductThumb product={product} />

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-neutral-950">
                            {product.name || product.title || "Untitled product"}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            SKU: {product.sku || "—"}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-neutral-500">
                      Product search karo ya backend picker response check karo.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Field>

          {scope === "VARIANT" ? (
            <Field
              label="Variant"
              error={form.formState.errors.variantId?.message}
            >
              <select
                {...form.register("variantId")}
                disabled={!productId || variantsLoading}
                className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10 disabled:bg-neutral-100"
              >
                <option value="">
                  {variantsLoading
                    ? "Loading variants..."
                    : productId
                      ? "Select variant"
                      : "Select product first"}
                </option>

                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title ||
                      variant.sku ||
                      [variant.size, variant.color].filter(Boolean).join(" / ") ||
                      variant.id}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              PRODUCT scope selected hai. Payload me variantId nahi bheja
              jayega.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Style Classification</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Color Family"
            error={form.formState.errors.colorFamily?.message}
          >
            <SelectField
              value={form.watch("colorFamily")}
              onChange={(value) =>
                form.setValue("colorFamily", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.colorFamily}
              placeholder="Select color family"
            />
          </Field>

          <Field
            label="Fabric Feel"
            error={form.formState.errors.fabricFeel?.message}
          >
            <SelectField
              value={form.watch("fabricFeel")}
              onChange={(value) =>
                form.setValue("fabricFeel", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.fabricFeel}
              placeholder="Select fabric feel"
            />
          </Field>

          <Field
            label="Neckline"
            error={form.formState.errors.neckline?.message}
          >
            <SelectField
              value={form.watch("neckline")}
              onChange={(value) =>
                form.setValue("neckline", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.neckline}
              placeholder="Select neckline"
            />
          </Field>

          <Field
            label="Sleeve Type"
            error={form.formState.errors.sleeveType?.message}
          >
            <SelectField
              value={form.watch("sleeveType")}
              onChange={(value) =>
                form.setValue("sleeveType", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.sleeveType}
              placeholder="Select sleeve type"
            />
          </Field>

          <Field
            label="Silhouette"
            error={form.formState.errors.silhouette?.message}
          >
            <SelectField
              value={form.watch("silhouette")}
              onChange={(value) =>
                form.setValue("silhouette", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.silhouette}
              placeholder="Select silhouette"
            />
          </Field>

          <Field
            label="Modesty Level"
            error={form.formState.errors.modestyLevel?.message}
          >
            <SelectField
              value={form.watch("modestyLevel")}
              onChange={(value) =>
                form.setValue("modestyLevel", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={options.modestyLevel}
              placeholder="Select modesty level"
            />
          </Field>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Field
            label="Occasion"
            error={form.formState.errors.occasion?.message}
          >
            <CheckboxGroup
              values={options.occasion}
              selected={selectedOccasion}
              onToggle={(value) => toggleArrayValue("occasion", value)}
              loading={optionsLoading}
            />
          </Field>

          <Field
            label="Season"
            error={form.formState.errors.season?.message}
          >
            <CheckboxGroup
              values={options.season}
              selected={selectedSeason}
              onToggle={(value) => toggleArrayValue("season", value)}
              loading={optionsLoading}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Tags & Styling Keywords</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TagInput
            label="Tags"
            placeholder="romantic, soft, wedding guest"
            values={selectedTags}
            onAdd={(value) => addTag("tags", value)}
            onRemove={(value) => removeTag("tags", value)}
          />

          <TagInput
            label="Styling Keywords"
            placeholder="pink bridesmaid, soft wedding dress"
            values={selectedStylingKeywords}
            onAdd={(value) => addTag("stylingKeywords", value)}
            onRemove={(value) => removeTag("stylingKeywords", value)}
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">AI Styling Notes</h2>

        <div className="mt-6">
          <Field
            label="AI Styling Notes"
            error={form.formState.errors.aiStylingNotes?.message}
          >
            <textarea
              {...form.register("aiStylingNotes")}
              className="min-h-36 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Best for summer bridesmaid styling..."
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Style Data"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
    >
      <option value="">{placeholder}</option>

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function CheckboxGroup({
  values,
  selected,
  onToggle,
  loading,
}: {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 text-sm text-neutral-500">
        Loading options...
      </div>
    );
  }

  if (!values.length) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 text-sm text-neutral-500">
        Backend options empty hain.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((value) => {
        const checked = selected.includes(value);

        return (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
              checked
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-[#fbfaf6] text-neutral-700"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(value)}
              className="h-4 w-4"
            />
            {value}
          </label>
        );
      })}
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  function submitTag() {
    onAdd(inputValue);
    setInputValue("");
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTag();
            }
          }}
          placeholder={placeholder}
        />

        <Button type="button" variant="outline" onClick={submitTag}>
          Add
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRemove(value)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs text-neutral-700 hover:border-red-200 hover:text-red-600"
            >
              {value}
              <X className="h-3 w-3" />
            </button>
          ))
        ) : (
          <span className="text-sm text-neutral-400">No values added.</span>
        )}
      </div>
    </div>
  );
}

function ProductThumb({ product }: { product: ProductPickerItem }) {
  const imageUrl =
    product.imageUrl || product.thumbnail || product.productImage || "";

  if (!imageUrl) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
        IMG
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name || product.title || "Product"}
      className="h-12 w-12 shrink-0 rounded-xl object-cover"
    />
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      {children}

      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
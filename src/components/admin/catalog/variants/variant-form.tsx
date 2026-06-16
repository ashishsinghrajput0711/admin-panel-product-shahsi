"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCcw } from "lucide-react";
import { variantSchema, type VariantFormValues } from "./variant-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CatalogAttributeOption = {
  id?: string;
  label?: string | null;
  value?: string | null;
  colorHex?: string | null;
  hexCode?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

type CatalogAttribute = {
  id?: string;
  name?: string | null;
  label?: string | null;
  code?: string | null;
  slug?: string | null;
  key?: string | null;
  fieldType?: string | null;
  type?: string | null;
  options?: CatalogAttributeOption[] | null;
};

type AttributesApiResponse = {
  success?: boolean;
  data?:
    | CatalogAttribute[]
    | {
        data?: CatalogAttribute[];
        attributes?: CatalogAttribute[];
        items?: CatalogAttribute[];
        total?: number;
      };
  attributes?: CatalogAttribute[];
  items?: CatalogAttribute[];
  message?: string | string[];
  error?: unknown;
};

const commerceTypeLabels = {
  RETAIL: "Retail",
  MADE_TO_ORDER: "Made-to-Order",
  RENTAL: "Rental",
  RESALE: "Resale",
} as const;

const variantTypeLabels = {
  SIZE: "Size",
  COLOR: "Color",
  LENGTH: "Length",
  FABRIC: "Fabric",
  RENTAL_PACKAGE: "Rental Package",
  SUBSCRIPTION_PACKAGE: "Subscription Package",
} as const;

const baseDefaultValues: VariantFormValues = {
  productId: "",

  sku: "",
  variantSku: "",
  barcode: "",

  businessType: "SHAHSI",
  commerceTypes: ["RETAIL"],

  variantType: "SIZE",
  rentalPackageName: "",
  subscriptionPackageName: "",

  size: "",
  color: "",
  colorFamily: "",
  fabric: "",

  height: "",
  dressLength: "",
  lengthLabel: "",
  neckline: "",
  sleeveLength: "",
  detail: "",

  price: 0,
  compareAtPrice: undefined,
  salePrice: undefined,
  rentalPrice: undefined,
  resalePrice: undefined,
  mtoPrice: undefined,

  stock: 0,
  reservedStock: 0,

  status: "ACTIVE",

  chest: undefined,
  waist: undefined,
  hip: undefined,
  length: undefined,
  sleeve: undefined,
  shoulder: undefined,

  bustMeasurement: undefined,
  waistMeasurement: undefined,
  hipMeasurement: undefined,
  garmentLength: undefined,

  stretchLevel: "",
  fitType: "",

  attributesFabric: "",
  attributesOccasion: "",

  weight: 0,
  weightUnit: "kg",

  isAvailable: true,
  isActive: true,
  isShipsNow: true,
  productionType: "READY_STOCK",

  customLengthAllowed: false,
  minCustomLength: undefined,
  maxCustomLength: undefined,
  productionLeadTimeDays: undefined,
  rushEligible: false,
  rushFee: undefined,
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
    Accept: "*/*",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseJson<T>(response: Response, fallbackMessage: string) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const shortText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    throw new Error(
      `${fallbackMessage}. Server ne JSON ke jagah HTML/text return kiya. Status: ${response.status}. Response: ${shortText}`
    );
  }
}

function getApiErrorMessage(data: AttributesApiResponse, fallback: string) {
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const errorRecord = data.error as Record<string, unknown>;

    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }

    if (Array.isArray(errorRecord.message)) {
      return errorRecord.message.join(", ");
    }
  }

  return fallback;
}

function extractAttributes(response: AttributesApiResponse) {
  if (Array.isArray(response.data)) return response.data;

  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data?.attributes)) return response.data.attributes;
  if (Array.isArray(response.data?.items)) return response.data.items;

  if (Array.isArray(response.attributes)) return response.attributes;
  if (Array.isArray(response.items)) return response.items;

  return [];
}

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAttributeIdentityValues(attribute: CatalogAttribute) {
  return [
    attribute.code,
    attribute.slug,
    attribute.key,
    attribute.name,
    attribute.label,
  ]
    .filter(Boolean)
    .map((value) => normalizeKey(value));
}

function findAttribute(attributes: CatalogAttribute[], keys: string[]) {
  const normalizedKeys = keys.map((key) => normalizeKey(key));

  return attributes.find((attribute) => {
    const identities = getAttributeIdentityValues(attribute);
    return normalizedKeys.some((key) => identities.includes(key));
  });
}

function optionLabel(option: CatalogAttributeOption) {
  return String(option.label || option.value || "").trim();
}

function getAttributeOptions(attributes: CatalogAttribute[], keys: string[]) {
  const attribute = findAttribute(attributes, keys);

  return (attribute?.options ?? [])
    .filter((option) => option.isActive !== false)
    .filter((option) => optionLabel(option))
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
}

function hasOptions(options: CatalogAttributeOption[]) {
  return options.length > 0;
}

export function VariantForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<VariantFormValues>;
  onSubmit: (values: VariantFormValues) => void;
  isSubmitting?: boolean;
}) {
  const [attributes, setAttributes] = useState<CatalogAttribute[]>([]);
  const [isAttributesLoading, setIsAttributesLoading] = useState(true);
  const [attributeApiError, setAttributeApiError] = useState<string | null>(
    null
  );

  const isEditMode = Boolean(defaultValues);

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema) as Resolver<VariantFormValues>,
    defaultValues: {
      ...baseDefaultValues,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (!defaultValues) return;

    form.reset({
      ...baseDefaultValues,
      ...defaultValues,
    });
  }, [defaultValues, form]);

  const commerceTypes = form.watch("commerceTypes") ?? [];
  const variantType = form.watch("variantType");
  const customLengthAllowed = Boolean(form.watch("customLengthAllowed"));
  const rushEligible = Boolean(form.watch("rushEligible"));
  const showMtoRules = commerceTypes.includes("MADE_TO_ORDER");
  const showRentalPackage = variantType === "RENTAL_PACKAGE";
  const showSubscriptionPackage = variantType === "SUBSCRIPTION_PACKAGE";

  async function loadAttributes() {
    try {
      setIsAttributesLoading(true);
      setAttributeApiError(null);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/attributes?page=1&limit=200`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const json = await parseJson<AttributesApiResponse>(
        response,
        "Catalog attributes API JSON response nahi de rahi"
      );

      if (!response.ok) {
        setAttributes([]);

        throw new Error(
          getApiErrorMessage(
            json,
            `Catalog attributes load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      setAttributes(extractAttributes(json));
    } catch (error) {
      setAttributes([]);
      setAttributeApiError(
        error instanceof Error
          ? error.message
          : "Catalog attributes backend se load nahi ho paaye."
      );
    } finally {
      setIsAttributesLoading(false);
    }
  }

  useEffect(() => {
    loadAttributes();
  }, []);

  const attributeOptions = useMemo(
    () => ({
      size: getAttributeOptions(attributes, ["size"]),
      color: getAttributeOptions(attributes, ["color"]),
      colorFamily: getAttributeOptions(attributes, [
        "color_family",
        "color-family",
        "color family",
      ]),
      fabric: getAttributeOptions(attributes, ["fabric"]),
      length: getAttributeOptions(attributes, [
        "length",
        "dress_length",
        "dress-length",
        "dress length",
      ]),
      neckline: getAttributeOptions(attributes, ["neckline"]),
      sleeve: getAttributeOptions(attributes, [
        "sleeve",
        "sleeve_length",
        "sleeve-length",
        "sleeve length",
      ]),
      stretch: getAttributeOptions(attributes, [
        "stretch",
        "stretch_level",
        "stretch-level",
        "stretch level",
      ]),
      fitType: getAttributeOptions(attributes, [
        "fit_type",
        "fit-type",
        "fit type",
      ]),
      occasion: getAttributeOptions(attributes, ["occasion"]),
    }),
    [attributes]
  );

  const disableAttributeSelects =
    isAttributesLoading || Boolean(attributeApiError);

  function toggleCommerceType(type: VariantFormValues["commerceTypes"][number]) {
    const exists = commerceTypes.includes(type);

    form.setValue(
      "commerceTypes",
      exists
        ? commerceTypes.filter((item) => item !== type)
        : [...commerceTypes, type],
      { shouldValidate: true, shouldDirty: true }
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-28">
      {attributeApiError ? (
        <section className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold">Catalog attributes API error</p>
              <p className="mt-1">
                Variant dropdown options backend se load nahi ho paaye.
                Fallback/static options use nahi kiye gaye.
              </p>
              <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs">
                {attributeApiError}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-full"
              onClick={loadAttributes}
              disabled={isAttributesLoading}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${
                  isAttributesLoading ? "animate-spin" : ""
                }`}
              />
              Retry
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            {isAttributesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            <span>
              {isAttributesLoading
                ? "Catalog attribute options backend se load ho rahe hain..."
                : "Catalog attribute options backend se loaded hain. No fallback/mock options used."}
            </span>
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Basic Variant Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Product ID"
            error={form.formState.errors.productId?.message}
          >
            <Input {...form.register("productId")} placeholder="product_id" />
          </Field>

          <Field label="SKU" error={form.formState.errors.sku?.message}>
            <Input {...form.register("sku")} placeholder="VAR-BLUSH-M-001" />
          </Field>

          <Field
  label="Variant SKU"
  error={form.formState.errors.variantSku?.message}
>
  <Input
    {...form.register("variantSku")}
    placeholder="VARIANT-SKU-001"
  />
</Field>

          <Field label="Barcode">
            <Input {...form.register("barcode")} placeholder="890000000001" />
          </Field>

          <Field label="Business Type">
            <select
              {...form.register("businessType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>

        {isEditMode ? (
          <p className="mt-3 text-xs text-neutral-500">
            Variant SKU backend detail response se hi show hota hai. Agar
            backend null bhejta hai to field blank rahegi; SKU copy nahi hoga.
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Variant Type</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Select what this variant represents. Rental and Subscription package
          fields appear conditionally.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Variant Type"
            error={form.formState.errors.variantType?.message}
          >
            <select
              {...form.register("variantType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              {(
                [
                  "SIZE",
                  "COLOR",
                  "LENGTH",
                  "FABRIC",
                  "RENTAL_PACKAGE",
                  "SUBSCRIPTION_PACKAGE",
                ] as const
              ).map((type) => (
                <option key={type} value={type}>
                  {variantTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>

          {showRentalPackage ? (
            <Field
              label="Rental Package Name"
              error={form.formState.errors.rentalPackageName?.message}
            >
              <Input
                {...form.register("rentalPackageName")}
                placeholder="3 Days Rental"
              />
            </Field>
          ) : null}

          {showSubscriptionPackage ? (
            <Field
              label="Subscription Package Name"
              error={form.formState.errors.subscriptionPackageName?.message}
            >
              <Input
                {...form.register("subscriptionPackageName")}
                placeholder="Monthly Subscription"
              />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Variant Options</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <DynamicSelect
            label="Size"
            value={form.watch("size") ?? ""}
            options={attributeOptions.size}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.size?.message}
            onChange={(value) =>
              form.setValue("size", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Color"
            value={form.watch("color") ?? ""}
            options={attributeOptions.color}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.color?.message}
            onChange={(value) =>
              form.setValue("color", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Color Family"
            value={form.watch("colorFamily") ?? ""}
            options={attributeOptions.colorFamily}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.colorFamily?.message}
            onChange={(value) =>
              form.setValue("colorFamily", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Fabric"
            value={form.watch("fabric") ?? ""}
            options={attributeOptions.fabric}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.fabric?.message}
            onChange={(value) => {
              form.setValue("fabric", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.setValue("attributesFabric", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />

          <Field label="Height">
            <Input {...form.register("height")} placeholder="5'4 - 5'8" />
          </Field>

          <DynamicSelect
            label="Dress Length"
            value={form.watch("dressLength") ?? ""}
            options={attributeOptions.length}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.dressLength?.message}
            onChange={(value) => {
              form.setValue("dressLength", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.setValue("lengthLabel", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />

          <DynamicSelect
            label="Length Label"
            value={form.watch("lengthLabel") ?? ""}
            options={attributeOptions.length}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.lengthLabel?.message}
            onChange={(value) =>
              form.setValue("lengthLabel", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Neckline"
            value={form.watch("neckline") ?? ""}
            options={attributeOptions.neckline}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.neckline?.message}
            onChange={(value) =>
              form.setValue("neckline", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Sleeve Length"
            value={form.watch("sleeveLength") ?? ""}
            options={attributeOptions.sleeve}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.sleeveLength?.message}
            onChange={(value) =>
              form.setValue("sleeveLength", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <Field label="Detail">
            <Input {...form.register("detail")} placeholder="Slit" />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Commerce Type</h2>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {(["RETAIL", "MADE_TO_ORDER", "RENTAL", "RESALE"] as const).map(
            (type) => (
              <button
                type="button"
                key={type}
                onClick={() => toggleCommerceType(type)}
                className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                  commerceTypes.includes(type)
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-[#fbfaf6] text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {commerceTypeLabels[type]}
              </button>
            )
          )}
        </div>

        {form.formState.errors.commerceTypes?.message ? (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.commerceTypes.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Pricing</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Retail Price"
            error={form.formState.errors.price?.message}
          >
            <Input type="number" step="0.01" {...form.register("price")} />
          </Field>

          <Field
            label="Compare At Price"
            error={form.formState.errors.compareAtPrice?.message}
          >
            <Input
              type="number"
              step="0.01"
              {...form.register("compareAtPrice")}
            />
          </Field>

          <Field
            label="Sale Price"
            error={form.formState.errors.salePrice?.message}
          >
            <Input type="number" step="0.01" {...form.register("salePrice")} />
          </Field>

          <Field
            label="Rental Price"
            error={form.formState.errors.rentalPrice?.message}
          >
            <Input type="number" step="0.01" {...form.register("rentalPrice")} />
          </Field>

          <Field
            label="Resale Price"
            error={form.formState.errors.resalePrice?.message}
          >
            <Input type="number" step="0.01" {...form.register("resalePrice")} />
          </Field>

          <Field
            label="MTO Price"
            error={form.formState.errors.mtoPrice?.message}
          >
            <Input type="number" step="0.01" {...form.register("mtoPrice")} />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Inventory</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Stock" error={form.formState.errors.stock?.message}>
            <Input type="number" {...form.register("stock")} />
          </Field>

          <Field
            label="Reserved Stock"
            error={form.formState.errors.reservedStock?.message}
          >
            <Input type="number" {...form.register("reservedStock")} />
          </Field>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Reserved Stock UI me display/edit ho sakta hai, lekin create/update
          variant API body me nahi bheja jaata kyunki backend DTO reject karta
          hai.
        </p>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Fit Starter Data</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field label="Chest">
            <Input type="number" step="0.01" {...form.register("chest")} />
          </Field>

          <Field label="Waist">
            <Input type="number" step="0.01" {...form.register("waist")} />
          </Field>

          <Field label="Hip">
            <Input type="number" step="0.01" {...form.register("hip")} />
          </Field>

          <Field label="Length">
            <Input type="number" step="0.01" {...form.register("length")} />
          </Field>

          <Field label="Sleeve">
            <Input type="number" step="0.01" {...form.register("sleeve")} />
          </Field>

          <Field label="Shoulder">
            <Input type="number" step="0.01" {...form.register("shoulder")} />
          </Field>

          <DynamicSelect
            label="Fit Type"
            value={form.watch("fitType") ?? ""}
            options={attributeOptions.fitType}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.fitType?.message}
            onChange={(value) =>
              form.setValue("fitType", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <DynamicSelect
            label="Stretch Level"
            value={form.watch("stretchLevel") ?? ""}
            options={attributeOptions.stretch}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.stretchLevel?.message}
            onChange={(value) =>
              form.setValue("stretchLevel", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Attributes</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DynamicSelect
            label="Attribute Fabric"
            value={form.watch("attributesFabric") ?? ""}
            options={attributeOptions.fabric}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.attributesFabric?.message}
            onChange={(value) => {
              form.setValue("attributesFabric", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.setValue("fabric", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />

          <DynamicSelect
            label="Attribute Occasion"
            value={form.watch("attributesOccasion") ?? ""}
            options={attributeOptions.occasion}
            disabled={disableAttributeSelects}
            loading={isAttributesLoading}
            error={form.formState.errors.attributesOccasion?.message}
            onChange={(value) =>
              form.setValue("attributesOccasion", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Shipping & Status</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Weight">
            <Input type="number" step="0.01" {...form.register("weight")} />
          </Field>

          <Field label="Weight Unit">
            <Input {...form.register("weightUnit")} placeholder="kg" />
          </Field>

          <Field label="Production Type">
            <Input
              {...form.register("productionType")}
              placeholder="READY_STOCK"
            />
          </Field>

          <CheckboxField
            label="Available"
            checked={Boolean(form.watch("isAvailable"))}
            onChange={(checked) =>
              form.setValue("isAvailable", checked, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <CheckboxField
            label="Active"
            checked={Boolean(form.watch("isActive"))}
            onChange={(checked) =>
              form.setValue("isActive", checked, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />

          <CheckboxField
            label="Ships Now"
            checked={Boolean(form.watch("isShipsNow"))}
            onChange={(checked) =>
              form.setValue("isShipsNow", checked, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </div>
      </section>

      {showMtoRules ? (
        <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-medium">Made-to-Order Rules</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <CheckboxField
              label="Custom Length Allowed"
              checked={customLengthAllowed}
              onChange={(checked) =>
                form.setValue("customLengthAllowed", checked, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />

            {customLengthAllowed ? (
              <>
                <Field label="Min Custom Length">
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("minCustomLength")}
                  />
                </Field>

                <Field label="Max Custom Length">
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("maxCustomLength")}
                  />
                </Field>
              </>
            ) : null}

            <Field label="Production Lead Time Days">
              <Input
                type="number"
                {...form.register("productionLeadTimeDays")}
              />
            </Field>

            <CheckboxField
              label="Rush Eligible"
              checked={rushEligible}
              onChange={(checked) =>
                form.setValue("rushEligible", checked, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />

            {rushEligible ? (
              <Field label="Rush Fee">
                <Input type="number" step="0.01" {...form.register("rushFee")} />
              </Field>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => history.back()}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="rounded-full"
            disabled={isSubmitting || isAttributesLoading}
          >
            {isSubmitting ? "Saving..." : "Save Variant"}
          </Button>
        </div>
      </div>
    </form>
  );
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
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-10 items-center gap-3 rounded-md border border-neutral-300 bg-white px-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-neutral-300"
      />
      <span>{label}</span>
    </label>
  );
}

function DynamicSelect({
  label,
  value,
  options,
  disabled,
  loading,
  error,
  onChange,
}: {
  label: string;
  value: string;
  options: CatalogAttributeOption[];
  disabled: boolean;
  loading: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const noBackendOptions = !loading && !disabled && !hasOptions(options);

    const currentValueExists = options.some(
    (option) => optionLabel(option) === value
  );

  const displayOptions =
    value && !currentValueExists
      ? [{ label: value, value, isActive: true }, ...options]
      : options;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>

      <select
        value={value}
        disabled={disabled || noBackendOptions}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
      >
        <option value="">
          {loading
            ? "Loading from backend..."
            : noBackendOptions
              ? "No backend options found"
              : `Select ${label}`}
        </option>

       {displayOptions.map((option) => {
  const value = optionLabel(option);
  const label = optionLabel(option);

  return (
    <option key={`${value}-${label}`} value={value}>
      {label}
    </option>
  );
})}
      </select>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      {noBackendOptions ? (
        <p className="mt-1 text-xs text-amber-700">
          Backend attribute/options me ye field abhi available nahi hai.
        </p>
      ) : null}
    </label>
  );
}

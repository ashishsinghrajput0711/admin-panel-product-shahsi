"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attribute } from "@/components/admin/catalog/attributes/attribute-types";

type LibraryAttribute = {
  name: string;
  slug: string;
  code: string;
  description: string;
  type:
    | "TEXT"
    | "NUMBER"
    | "BOOLEAN"
    | "SELECT"
    | "MULTI_SELECT"
    | "COLOR"
    | "SIZE";
  scope: "PRODUCT" | "VARIANT" | "PRODUCT_AND_VARIANT";
  group:
    | "PRODUCT"
    | "VARIANT"
    | "FIT"
    | "STYLE"
    | "SEO"
    | "SEARCH"
    | "MTO"
    | "RENTAL"
    | "RESALE";
  options: Array<{
    label: string;
    value: string;
    colorHex?: string | null;
  }>;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isVariantOption: boolean;
  isSeoField: boolean;
  isFitEngineField: boolean;
  isStyleEngineField: boolean;
  isBulkUploadField: boolean;
};

type AttributesApiResponse = {
  success?: boolean;
  data?:
    | Attribute[]
    | {
        data?: Attribute[];
        attributes?: Attribute[];
        total?: number;
      };
  attributes?: Attribute[];
  message?: string | string[];
  error?: unknown;
};

type CreateAttributeResponse = {
  success?: boolean;
  data?: Attribute;
  message?: string | string[];
  error?: unknown;
};

type BackendFieldType =
  | "text"
  | "dropdown"
  | "multi_select"
  | "swatch"
  | "image"
  | "date"
  | "number"
  | "boolean"
  | "formula"
  | "linked_products";

type BackendCreateAttributePayload = {
  code: string;
  name: string;
  label: string;
  fieldType: BackendFieldType;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isVariantLevel: boolean;
  sortOrder: number;
  options?: Array<{
    label: string;
    value: string;
    sortOrder: number;
    isActive: boolean;
    colorHex?: string;
  }>;
};

type CreateLibraryAttributeResult = {
  created: boolean;
  alreadyExists: boolean;
};

const SHAHSi_GLOBAL_ATTRIBUTES: LibraryAttribute[] = [
  makeAttribute("Color", "COLOR", "COLOR", "PRODUCT_AND_VARIANT", "VARIANT", [
    ["Blush Pink", "blush-pink", "#f4c2c2"],
    ["Ivory", "ivory", "#fffff0"],
    ["Black", "black", "#000000"],
    ["Sage", "sage", "#9caf88"],
    ["Champagne", "champagne", "#f7e7ce"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Color Family", "COLOR_FAMILY", "SELECT", "PRODUCT_AND_VARIANT", "SEARCH", [
    ["Pink", "pink"],
    ["White", "white"],
    ["Black", "black"],
    ["Green", "green"],
    ["Neutral", "neutral"],
    ["Blue", "blue"],
    ["Red", "red"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Size", "SIZE", "SIZE", "VARIANT", "VARIANT", [
    ["XS", "xs"],
    ["S", "s"],
    ["M", "m"],
    ["L", "l"],
    ["XL", "xl"],
    ["CUSTOM", "custom"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isFitEngineField: true,
  }),

  makeAttribute("Fabric", "FABRIC", "SELECT", "PRODUCT_AND_VARIANT", "STYLE", [
    ["Satin", "satin"],
    ["Silk", "silk"],
    ["Chiffon", "chiffon"],
    ["Cotton", "cotton"],
    ["Velvet", "velvet"],
    ["Lace", "lace"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Length", "LENGTH", "SELECT", "PRODUCT_AND_VARIANT", "FIT", [
    ["Mini", "mini"],
    ["Midi", "midi"],
    ["Maxi", "maxi"],
    ["Floor Length", "floor-length"],
    ["Tea Length", "tea-length"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isSeoField: true,
    isFitEngineField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Neckline", "NECKLINE", "SELECT", "PRODUCT_AND_VARIANT", "STYLE", [
    ["Sweetheart", "sweetheart"],
    ["V-Neck", "v-neck"],
    ["Halter", "halter"],
    ["Strapless", "strapless"],
    ["Square Neck", "square-neck"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Sleeve", "SLEEVE", "SELECT", "PRODUCT_AND_VARIANT", "STYLE", [
    ["Sleeveless", "sleeveless"],
    ["Short Sleeve", "short-sleeve"],
    ["Long Sleeve", "long-sleeve"],
    ["Off Shoulder", "off-shoulder"],
    ["Cap Sleeve", "cap-sleeve"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isVariantOption: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Waistline", "WAISTLINE", "SELECT", "PRODUCT", "FIT", [
    ["Natural Waist", "natural-waist"],
    ["Empire Waist", "empire-waist"],
    ["Drop Waist", "drop-waist"],
    ["Smocked Waist", "smocked-waist"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isFitEngineField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Silhouette", "SILHOUETTE", "SELECT", "PRODUCT", "STYLE", [
    ["A-Line", "a-line"],
    ["Mermaid", "mermaid"],
    ["Sheath", "sheath"],
    ["Ball Gown", "ball-gown"],
    ["Fit and Flare", "fit-and-flare"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Train Length", "TRAIN_LENGTH", "SELECT", "PRODUCT", "STYLE", [
    ["No Train", "no-train"],
    ["Sweep Train", "sweep-train"],
    ["Chapel Train", "chapel-train"],
    ["Cathedral Train", "cathedral-train"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Stretch", "STRETCH", "SELECT", "PRODUCT_AND_VARIANT", "FIT", [
    ["None", "none"],
    ["Low", "low"],
    ["Medium", "medium"],
    ["High", "high"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isFitEngineField: true,
    isVariantOption: true,
  }),

  makeAttribute("Fit Type", "FIT_TYPE", "SELECT", "PRODUCT_AND_VARIANT", "FIT", [
    ["Regular", "regular"],
    ["Slim", "slim"],
    ["Relaxed", "relaxed"],
    ["Bodycon", "bodycon"],
    ["Custom", "custom"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isFitEngineField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Modesty", "MODESTY", "SELECT", "PRODUCT", "STYLE", [
    ["Low", "low"],
    ["Medium", "medium"],
    ["High", "high"],
    ["Modest", "modest"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Body Shape", "BODY_SHAPE", "MULTI_SELECT", "PRODUCT", "FIT", [
    ["Pear", "pear"],
    ["Apple", "apple"],
    ["Hourglass", "hourglass"],
    ["Rectangle", "rectangle"],
    ["Petite", "petite"],
    ["Tall", "tall"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isFitEngineField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Skin Tone", "SKIN_TONE", "MULTI_SELECT", "PRODUCT", "STYLE", [
    ["Fair", "fair"],
    ["Medium", "medium"],
    ["Olive", "olive"],
    ["Deep", "deep"],
    ["Warm", "warm"],
    ["Cool", "cool"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Occasion", "OCCASION", "MULTI_SELECT", "PRODUCT", "SEARCH", [
    ["Wedding", "wedding"],
    ["Bridesmaid", "bridesmaid"],
    ["Engagement", "engagement"],
    ["Cocktail", "cocktail"],
    ["Reception", "reception"],
    ["Haldi", "haldi"],
    ["Sangeet", "sangeet"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Wedding Theme", "WEDDING_THEME", "MULTI_SELECT", "PRODUCT", "STYLE", [
    ["Garden", "garden"],
    ["Beach", "beach"],
    ["Royal", "royal"],
    ["Minimal", "minimal"],
    ["Boho", "boho"],
    ["Classic", "classic"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Season", "SEASON", "MULTI_SELECT", "PRODUCT", "STYLE", [
    ["Spring", "spring"],
    ["Summer", "summer"],
    ["Autumn", "autumn"],
    ["Winter", "winter"],
    ["All Season", "all-season"],
  ], {
    isFilterable: true,
    isSearchable: true,
    isSeoField: true,
    isStyleEngineField: true,
  }),

  makeAttribute("Rental Eligible", "RENTAL_ELIGIBLE", "BOOLEAN", "PRODUCT_AND_VARIANT", "RENTAL", [], {
    isFilterable: true,
    isSearchable: false,
  }),

  makeAttribute("Resale Eligible", "RESALE_ELIGIBLE", "BOOLEAN", "PRODUCT_AND_VARIANT", "RESALE", [], {
    isFilterable: true,
    isSearchable: false,
  }),

  makeAttribute("Rush Eligible", "RUSH_ELIGIBLE", "BOOLEAN", "PRODUCT_AND_VARIANT", "MTO", [], {
    isFilterable: true,
    isSearchable: false,
  }),

  makeAttribute("Custom Length Eligible", "CUSTOM_LENGTH_ELIGIBLE", "BOOLEAN", "PRODUCT_AND_VARIANT", "MTO", [], {
    isFilterable: true,
    isSearchable: false,
    isFitEngineField: true,
  }),
];

function makeAttribute(
  name: string,
  code: string,
  type: LibraryAttribute["type"],
  scope: LibraryAttribute["scope"],
  group: LibraryAttribute["group"],
  rawOptions: Array<[string, string, string?]>,
  flags: Partial<
    Pick<
      LibraryAttribute,
      | "isFilterable"
      | "isSearchable"
      | "isVariantOption"
      | "isSeoField"
      | "isFitEngineField"
      | "isStyleEngineField"
      | "isBulkUploadField"
    >
  >
): LibraryAttribute {
  return {
    name,
    slug: code.toLowerCase().replaceAll("_", "-"),
    code,
    description: `${name} master attribute used by Shahsi catalog systems.`,
    type,
    scope,
    group,
    options: rawOptions.map(([label, value, colorHex]) => ({
      label,
      value,
      colorHex: colorHex ?? null,
    })),
    isRequired: false,
    isFilterable: Boolean(flags.isFilterable),
    isSearchable: Boolean(flags.isSearchable),
    isVariantOption: Boolean(flags.isVariantOption),
    isSeoField: Boolean(flags.isSeoField),
    isFitEngineField: Boolean(flags.isFitEngineField),
    isStyleEngineField: Boolean(flags.isStyleEngineField),
    isBulkUploadField: flags.isBulkUploadField ?? true,
  };
}

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

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractAttributes(response: AttributesApiResponse | unknown): Attribute[] {
  if (Array.isArray(response)) return response as Attribute[];

  const root = response as AttributesApiResponse;

  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.attributes)) return root.attributes;

  if (root.data && typeof root.data === "object") {
    if (Array.isArray(root.data.data)) return root.data.data;
    if (Array.isArray(root.data.attributes)) return root.data.attributes;

    const firstArray = Object.values(root.data).find(Array.isArray);
    if (Array.isArray(firstArray)) return firstArray as Attribute[];
  }

  return [];
}

async function parseJson<T>(response: Response, fallbackMessage: string) {
  const text = await response.text();

  if (!text) return {} as T;

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

function getErrorMessage(
  data: { message?: string | string[]; error?: unknown },
  fallback: string
) {
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    const record = data.error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) return record.message.join(", ");
  }

  return fallback;
}

function mapLibraryTypeToBackendFieldType(
  type: LibraryAttribute["type"]
): BackendFieldType {
  if (type === "TEXT") return "text";
  if (type === "NUMBER") return "number";
  if (type === "BOOLEAN") return "boolean";
  if (type === "SELECT") return "dropdown";
  if (type === "MULTI_SELECT") return "multi_select";
  if (type === "COLOR") return "swatch";
  if (type === "SIZE") return "dropdown";

  return "text";
}

function canSendOptions(fieldType: BackendFieldType) {
  return (
    fieldType === "dropdown" ||
    fieldType === "multi_select" ||
    fieldType === "swatch" ||
    fieldType === "image"
  );
}

function isDuplicateAttributeError(
  status: number,
  data: { message?: string | string[]; error?: unknown } | null
) {
  const message = JSON.stringify(data ?? {}).toLowerCase();

  return (
    status === 409 ||
    message.includes("already exists") ||
    message.includes("duplicate")
  );
}

function getAttributeIdentityValues(
  attribute: Partial<Attribute> & Record<string, unknown>
) {
  return [
    attribute.id,
    attribute.name,
    attribute.label,
    attribute.code,
    attribute.slug,
    attribute.key,
  ]
    .filter(Boolean)
    .map((value) => normalizeKey(String(value)));
}

function doesLibraryAttributeExist(
  libraryAttribute: LibraryAttribute,
  backendAttributes: Attribute[]
) {
  const libraryKeys = new Set([
    normalizeKey(libraryAttribute.code),
    normalizeKey(libraryAttribute.slug),
    normalizeKey(libraryAttribute.name),
  ]);

  return backendAttributes.some((backendAttribute) => {
    const backendKeys = getAttributeIdentityValues(
      backendAttribute as Attribute & Record<string, unknown>
    );

    return backendKeys.some((key) => libraryKeys.has(key));
  });
}

function buildAttributePayload(
  attribute: LibraryAttribute,
  index: number
): BackendCreateAttributePayload {
  const fieldType = mapLibraryTypeToBackendFieldType(attribute.type);
  const code = normalizeKey(attribute.slug || attribute.code || attribute.name);

  const payload: BackendCreateAttributePayload = {
    code,
    name: attribute.name,
    label: attribute.name,
    fieldType,
    isRequired: attribute.isRequired,
    isFilterable: attribute.isFilterable,
    isSearchable: attribute.isSearchable,
    isVariantLevel:
      attribute.scope === "VARIANT" || attribute.scope === "PRODUCT_AND_VARIANT",
    sortOrder: index + 1,
  };

if (canSendOptions(fieldType) && attribute.options.length > 0) {
  payload.options = attribute.options.map((option, optionIndex) => {
    const nextOption: NonNullable<
      BackendCreateAttributePayload["options"]
    >[number] = {
      label: option.label,
      value: normalizeKey(option.value || option.label),
      sortOrder: optionIndex + 1,
      isActive: true,
    };

    if (fieldType === "swatch" && option.colorHex) {
      nextOption.colorHex = option.colorHex;
    }

    return nextOption;
  });
}

  return payload;
}

export default function AttributeLibraryPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const missingAttributes = useMemo(() => {
    if (apiError) return [];

    return SHAHSi_GLOBAL_ATTRIBUTES.filter(
      (attribute) => !doesLibraryAttributeExist(attribute, attributes)
    );
  }, [apiError, attributes]);

  const existingAttributesCount = useMemo(() => {
    if (apiError) return 0;

    return SHAHSi_GLOBAL_ATTRIBUTES.filter((attribute) =>
      doesLibraryAttributeExist(attribute, attributes)
    ).length;
  }, [apiError, attributes]);

  async function loadAttributes() {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await fetch(
        `${getApiRootUrl()}/admin/catalog/attributes?page=1&limit=200`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const json = await parseJson<AttributesApiResponse>(
        response,
        "Attributes API JSON response nahi de rahi"
      );

      if (!response.ok) {
        setAttributes([]);
        throw new Error(
          getErrorMessage(
            json,
            `Attributes load failed: ${response.status} ${response.statusText}`
          )
        );
      }

      const nextAttributes = extractAttributes(json);
      setAttributes(nextAttributes);
    } catch (error) {
      setAttributes([]);
      setApiError(
        error instanceof Error
          ? error.message
          : "Backend se attributes load nahi ho paaye."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function createAttribute(
    attribute: LibraryAttribute,
    index: number
  ): Promise<CreateLibraryAttributeResult> {
    const response = await fetch(`${getApiRootUrl()}/admin/catalog/attributes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(buildAttributePayload(attribute, index)),
    });

    const json = await parseJson<CreateAttributeResponse>(
      response,
      "Create attribute API JSON response nahi de rahi"
    );

    if (!response.ok) {
      if (isDuplicateAttributeError(response.status, json)) {
        return {
          created: false,
          alreadyExists: true,
        };
      }

      throw new Error(
        getErrorMessage(
          json,
          `Create attribute failed: ${response.status} ${response.statusText}`
        )
      );
    }

    return {
      created: true,
      alreadyExists: false,
    };
  }

  async function handleCreateOne(attribute: LibraryAttribute, index: number) {
    if (apiError) return;

    try {
      setActiveCode(attribute.code);
      setApiError(null);
      setMessage(null);

      const result = await createAttribute(attribute, index);

      setMessage(
        result.alreadyExists
          ? `${attribute.name} backend me already exist karta hai.`
          : `${attribute.name} attribute create ho gaya.`
      );

      await loadAttributes();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Attribute create failed."
      );
    } finally {
      setActiveCode(null);
    }
  }

  async function handleSeedMissing() {
    if (apiError) return;

    try {
      setIsSeeding(true);
      setApiError(null);
      setMessage(null);

      let createdCount = 0;
      let alreadyExistsCount = 0;
      let failedCount = 0;

      for (const attribute of missingAttributes) {
        const libraryIndex = SHAHSi_GLOBAL_ATTRIBUTES.findIndex(
          (item) => item.code === attribute.code
        );

        try {
          setActiveCode(attribute.code);

          const result = await createAttribute(
            attribute,
            libraryIndex >= 0 ? libraryIndex : 0
          );

          if (result.alreadyExists) {
            alreadyExistsCount += 1;
          } else {
            createdCount += 1;
          }
        } catch (error) {
          failedCount += 1;
          console.error("Attribute seed failed:", attribute.name, error);
        }
      }

      setMessage(
        `Seed complete. Created: ${createdCount}, Already exists: ${alreadyExistsCount}, Failed: ${failedCount}`
      );

      await loadAttributes();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Seed missing attributes failed."
      );
    } finally {
      setActiveCode(null);
      setIsSeeding(false);
    }
  }

  useEffect(() => {
    loadAttributes();
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/attributes"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attributes
        </Link>

        <section className="mt-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
            Admin / Catalog / Attributes / Library
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <h1 className="text-5xl font-medium tracking-tight">
                Global Attribute Library
              </h1>

              <p className="mt-4 max-w-4xl text-white/70">
                Preloaded Shahsi master attributes for filters, search,
                recommendations, SEO, variants, fit engine, style engine, MTO,
                rental, resale and bulk upload mapping.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={loadAttributes}
                disabled={isLoading || isSeeding}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                type="button"
                className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
                onClick={handleSeedMissing}
                disabled={
                  isLoading ||
                  isSeeding ||
                  Boolean(apiError) ||
                  missingAttributes.length === 0
                }
              >
                {isSeeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Seed Missing ({missingAttributes.length})
              </Button>
            </div>
          </div>
        </section>
      </div>

      {apiError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Attribute Library API error</p>
          <p className="mt-2 rounded-xl bg-white/70 p-3 text-xs">{apiError}</p>
        </div>
      ) : null}

      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">{message}</p>
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Library attributes"
          value={SHAHSi_GLOBAL_ATTRIBUTES.length}
        />
        <StatCard label="Already in backend" value={existingAttributesCount} />
        <StatCard label="Missing" value={apiError ? 0 : missingAttributes.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {SHAHSi_GLOBAL_ATTRIBUTES.map((attribute, index) => {
          const exists =
            !apiError && doesLibraryAttributeExist(attribute, attributes);
          const isActive = activeCode === attribute.code;

          return (
            <article
              key={attribute.code}
              className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-neutral-950">
                      {attribute.name}
                    </h2>

                    {exists ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Exists
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                        Missing
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-neutral-500">
                    {attribute.description}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={exists ? "outline" : "default"}
                  className="rounded-full"
                  disabled={
                    exists ||
                    isActive ||
                    isLoading ||
                    isSeeding ||
                    Boolean(apiError)
                  }
                  onClick={() => handleCreateOne(attribute, index)}
                >
                  {isActive ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {exists ? "Created" : "Create"}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{attribute.code}</Badge>
                <Badge variant="outline">{attribute.type}</Badge>
                <Badge variant="outline">{attribute.scope}</Badge>
                <Badge variant="outline">{attribute.group}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {attribute.isFilterable ? <Flag>Filterable</Flag> : null}
                {attribute.isSearchable ? <Flag>Searchable</Flag> : null}
                {attribute.isVariantOption ? <Flag>Variant Option</Flag> : null}
                {attribute.isSeoField ? <Flag>SEO Field</Flag> : null}
                {attribute.isFitEngineField ? <Flag>Fit Engine</Flag> : null}
                {attribute.isStyleEngineField ? <Flag>Style Engine</Flag> : null}
                {attribute.isBulkUploadField ? <Flag>Bulk Upload</Flag> : null}
              </div>

              {attribute.options.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Options
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {attribute.options.slice(0, 10).map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs text-neutral-700"
                      >
                        {option.colorHex ? (
                          <span
                            className="h-3 w-3 rounded-full border border-neutral-300"
                            style={{ backgroundColor: option.colorHex }}
                          />
                        ) : null}
                        {option.label}
                      </span>
                    ))}

                    {attribute.options.length > 10 ? (
                      <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
                        +{attribute.options.length - 10} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <Sparkles className="h-4 w-4 text-neutral-400" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
      {children}
    </span>
  );
}
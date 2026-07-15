"use client";
import Link from "next/link";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Layers3,
  Loader2,
  Plus,
  Power,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  deleteCatalogAttributeOption,
  fetchCatalogAttributeGroups,
  updateCatalogAttributeOption,
  type CatalogAttributeGroup,
} from "@/lib/admin/catalog-attributes-api";

import { attributeSchema, type AttributeFormValues } from "./attribute-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const optionBasedTypes = ["SELECT", "MULTI_SELECT", "COLOR", "SIZE"];

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleToSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAttributeType(
  type?: string | null,
): AttributeFormValues["type"] {
  const value = String(type || "").trim().toLowerCase();

  if (value === "text") return "TEXT";
  if (value === "number") return "NUMBER";
  if (value === "boolean") return "BOOLEAN";
  if (value === "dropdown" || value === "select") return "SELECT";
  if (value === "multi_select" || value === "multiselect") {
    return "MULTI_SELECT";
  }
  if (value === "swatch" || value === "color") return "COLOR";
  if (value === "size") return "SIZE";

  return "TEXT";
}

const SYSTEM_ATTRIBUTE_GROUPS = [
  "PRODUCT",
  "VARIANT",
  "FIT",
  "STYLE",
  "SEO",
  "SEARCH",
  "MTO",
  "RENTAL",
  "RESALE",
  "BASIC",
  "SIZE",
  "COLOR",
  "FABRIC",
  "OCCASION",
  "CUSTOM",
] as const;

function normalizeSystemGroup(
  value: unknown,
): AttributeFormValues["group"] {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();

  if (
    SYSTEM_ATTRIBUTE_GROUPS.includes(
      normalizedValue as (typeof SYSTEM_ATTRIBUTE_GROUPS)[number],
    )
  ) {
    return normalizedValue as AttributeFormValues["group"];
  }

  return "PRODUCT";
}

function getAssignedCatalogGroup(
  defaultValues?: Partial<AttributeFormValues>,
) {
  const record = (defaultValues || {}) as Record<
    string,
    unknown
  >;

  const possibleGroups = [
    record.attributeGroup,
    record.catalogAttributeGroup,
    record.groupDetails,
    typeof record.group === "object"
      ? record.group
      : null,
  ];

  return (
    possibleGroups.find(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item),
    ) as Record<string, unknown> | undefined
  );
}

function getFieldTypeFromType(type: AttributeFormValues["type"]) {
  if (type === "TEXT") return "text";
  if (type === "NUMBER") return "number";
  if (type === "BOOLEAN") return "boolean";
  if (type === "SELECT") return "dropdown";
  if (type === "MULTI_SELECT") return "multi_select";
  if (type === "COLOR") return "swatch";
  if (type === "SIZE") return "dropdown";

  return "text";
}

function shouldAutoReplace(currentValue: string, previousName: string) {
  if (!currentValue) return true;

  return (
    currentValue === titleToSlug(previousName) ||
    currentValue === slugify(previousName).toUpperCase()
  );
}

function mapDefaultValues(
  defaultValues?: Partial<AttributeFormValues>,
): AttributeFormValues {
  const rawDefaults = (defaultValues || {}) as Record<
    string,
    unknown
  >;

  const assignedCatalogGroup =
    getAssignedCatalogGroup(defaultValues);

  const name = String(
    rawDefaults.name || "",
  ).trim();

  const code = String(
    rawDefaults.code ||
      rawDefaults.slug ||
      "",
  ).trim();

  const type = normalizeAttributeType(
    String(
      rawDefaults.type ||
        rawDefaults.fieldType ||
        "",
    ),
  );

  const assignedGroupId = String(
    rawDefaults.groupId ||
      assignedCatalogGroup?.id ||
      "",
  ).trim();

  const assignedGroupKey = String(
    rawDefaults.groupKey ||
      assignedCatalogGroup?.key ||
      assignedCatalogGroup?.code ||
      assignedCatalogGroup?.slug ||
      "",
  ).trim();

  const assignedGroupSlug = String(
    rawDefaults.groupSlug ||
      assignedCatalogGroup?.slug ||
      assignedCatalogGroup?.key ||
      assignedCatalogGroup?.code ||
      "",
  ).trim();


  return {
    name,
    slug: String(defaultValues?.slug || titleToSlug(name)).trim(),
    code: code || slugify(name).toUpperCase(),
    description: String(defaultValues?.description || ""),

    type,
    fieldType: defaultValues?.fieldType || getFieldTypeFromType(type),

   scope:
  (rawDefaults.scope as AttributeFormValues["scope"]) ||
  "PRODUCT_AND_VARIANT",

group: normalizeSystemGroup(rawDefaults.group),

groupId: assignedGroupId,
groupKey: assignedGroupKey,
groupSlug: assignedGroupSlug,

    isRequired: Boolean(defaultValues?.isRequired),
    isFilterable: Boolean(defaultValues?.isFilterable),
    isSearchable: Boolean(defaultValues?.isSearchable),

    isVariantLevel: Boolean(
      defaultValues?.isVariantLevel ||
        defaultValues?.isVariantDefining ||
        defaultValues?.isVariantOption,
    ),
    isVariantDefining: Boolean(
      defaultValues?.isVariantDefining ||
        defaultValues?.isVariantLevel ||
        defaultValues?.isVariantOption,
    ),
    isVariantOption: Boolean(
      defaultValues?.isVariantOption ||
        defaultValues?.isVariantLevel ||
        defaultValues?.isVariantDefining,
    ),

    // Backend current DTO does not accept these fields, so UI does not render them.
    // Keep false defaults only for schema compatibility.
    isSeoField: false,
    isFitEngineField: false,
    isStyleEngineField: false,
    isBulkUploadField: false,

    status: defaultValues?.status || "ACTIVE",
    isActive:
      typeof defaultValues?.isActive === "boolean"
        ? defaultValues.isActive
        : defaultValues?.status !== "INACTIVE" &&
          defaultValues?.status !== "ARCHIVED",

    sortOrder: Number(defaultValues?.sortOrder || 0),

    options: Array.isArray(defaultValues?.options)
      ? defaultValues.options.map((option, index) => ({
          id: option.id,
          label: String(option.label || option.value || ""),
          value: String(option.value || option.label || ""),
          colorHex: String(option.colorHex || ""),
          imageUrl: String(option.imageUrl || ""),
          sortOrder: Number(option.sortOrder || option.position || index + 1),
          position: Number(option.position || option.sortOrder || index + 1),
          isActive:
            typeof option.isActive === "boolean" ? option.isActive : true,
        }))
      : [],
  };
}

export function AttributeForm({
  attributeId,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  attributeId?: string;
  defaultValues?: Partial<AttributeFormValues>;
  onSubmit: (values: AttributeFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema) as Resolver<AttributeFormValues>,
    defaultValues: mapDefaultValues(defaultValues),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
    keyName: "formRowId",
  });

  const [optionAction, setOptionAction] = useState<{
  id: string;
  type: "status" | "delete";
} | null>(null);

const [optionActionError, setOptionActionError] = useState<string | null>(
  null,
);
const [catalogGroups, setCatalogGroups] = useState<
  CatalogAttributeGroup[]
>([]);

const [isCatalogGroupsLoading, setIsCatalogGroupsLoading] =
  useState(true);

const [catalogGroupsError, setCatalogGroupsError] =
  useState<string | null>(null);

  const selectedType = form.watch("type");

  const selectedCatalogGroupId = String(
  form.watch("groupId") || "",
).trim();

const selectedCatalogGroup = useMemo(
  () =>
    catalogGroups.find(
      (group) =>
        String(group.id) ===
        selectedCatalogGroupId,
    ) || null,
  [
    catalogGroups,
    selectedCatalogGroupId,
  ],
);
  const showOptions = optionBasedTypes.includes(selectedType);
  async function loadCatalogGroups() {
  try {
    setIsCatalogGroupsLoading(true);
    setCatalogGroupsError(null);

   const result =
  await fetchCatalogAttributeGroups({
    page: 1,
    limit: 100,
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

    setCatalogGroups(result.groups);
  } catch (error) {
    setCatalogGroups([]);

    setCatalogGroupsError(
      error instanceof Error
        ? error.message
        : "Attribute groups load failed.",
    );
  } finally {
    setIsCatalogGroupsLoading(false);
  }
}

useEffect(() => {
  void loadCatalogGroups();
}, []);

  function handleNameChange(value: string) {
    const previousName = form.getValues("name");
    const currentSlug = form.getValues("slug");
    const currentCode = form.getValues("code");

    form.setValue("name", value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (shouldAutoReplace(currentSlug, previousName)) {
      form.setValue("slug", titleToSlug(value), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (shouldAutoReplace(currentCode, previousName)) {
      form.setValue("code", slugify(value).toUpperCase(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function handleSlugChange(value: string) {
    form.setValue("slug", titleToSlug(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleCodeChange(value: string) {
    form.setValue("code", slugify(value).toUpperCase(), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleTypeChange(value: AttributeFormValues["type"]) {
    form.setValue("type", value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    form.setValue("fieldType", getFieldTypeFromType(value), {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!optionBasedTypes.includes(value)) {
      form.setValue("options", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function handleCatalogGroupChange(
  groupId: string,
) {
  const cleanGroupId = String(
    groupId || "",
  ).trim();

  const selectedGroup =
    catalogGroups.find(
      (group) =>
        String(group.id) === cleanGroupId,
    ) || null;

  form.setValue(
    "groupId",
    cleanGroupId,
    {
      shouldDirty: true,
      shouldValidate: true,
    },
  );

  form.setValue(
    "groupKey",
    selectedGroup
      ? String(
          selectedGroup.key ||
            selectedGroup.code ||
            selectedGroup.slug ||
            "",
        )
      : "",
    {
      shouldDirty: true,
      shouldValidate: true,
    },
  );

  form.setValue(
    "groupSlug",
    selectedGroup
      ? String(
          selectedGroup.slug ||
            selectedGroup.key ||
            selectedGroup.code ||
            "",
        )
      : "",
    {
      shouldDirty: true,
      shouldValidate: true,
    },
  );
}

  function addOption() {
    const sortOrder = fields.length + 1;

    append({
      label: "",
      value: "",
      colorHex: selectedType === "COLOR" ? "#000000" : "",
      imageUrl: "",
      sortOrder,
      position: sortOrder,
      isActive: true,
    });
  }

  function handleOptionLabelChange(index: number, value: string) {
    const currentValue = form.getValues(`options.${index}.value`);

    form.setValue(`options.${index}.label`, value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!currentValue) {
      form.setValue(`options.${index}.value`, slugify(value), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleOptionStatusChange(index: number) {
  const option = form.getValues(`options.${index}`);
  const optionId = String(option?.id || "").trim();
  const nextActive = !Boolean(option?.isActive);

  // New unsaved option hai to sirf local form state change hogi.
  if (!optionId) {
    form.setValue(`options.${index}.isActive`, nextActive, {
      shouldDirty: true,
      shouldValidate: true,
    });

    return;
  }

  if (!attributeId) {
    setOptionActionError("Attribute ID missing hai.");
    return;
  }

  try {
    setOptionActionError(null);
    setOptionAction({
      id: optionId,
      type: "status",
    });

    await updateCatalogAttributeOption({
      attributeId,
      optionId,
      option: {
        ...option,
        id: optionId,
        isActive: nextActive,
      },
    });

    form.setValue(`options.${index}.isActive`, nextActive, {
      shouldDirty: false,
      shouldValidate: true,
    });
  } catch (error) {
    setOptionActionError(
      error instanceof Error
        ? error.message
        : "Option status update failed.",
    );
  } finally {
    setOptionAction(null);
  }
}

async function handleDeleteOption(index: number) {
  const option = form.getValues(`options.${index}`);
  const optionId = String(option?.id || "").trim();
  const optionLabel = String(
    option?.label || option?.value || "this option",
  ).trim();

  // Abhi backend mein create nahi hua hai.
  if (!optionId) {
    remove(index);
    return;
  }

  if (!attributeId) {
    setOptionActionError("Attribute ID missing hai.");
    return;
  }

  const confirmed = window.confirm(
    `Permanently delete option "${optionLabel}"?\n\nAgar ye option kisi product mein use ho raha hai to backend request reject kar sakta hai.`,
  );

  if (!confirmed) return;

  try {
    setOptionActionError(null);
    setOptionAction({
      id: optionId,
      type: "delete",
    });

    await deleteCatalogAttributeOption({
      attributeId,
      optionId,
    });

    // Backend delete successful hone ke baad hi UI se remove hoga.
    remove(index);
  } catch (error) {
    setOptionActionError(
      error instanceof Error ? error.message : "Option delete failed.",
    );
  } finally {
    setOptionAction(null);
  }
}

  function handleSubmit(values: AttributeFormValues) {
    const cleanedValues: AttributeFormValues = {
      ...values,
      fieldType: values.fieldType || getFieldTypeFromType(values.type),
      isActive: values.status === "ACTIVE",
      groupId: String(values.groupId || "").trim(),
groupKey: String(values.groupKey || "").trim(),
groupSlug: String(values.groupSlug || "").trim(),

      isVariantLevel: Boolean(
        values.isVariantLevel ||
          values.isVariantDefining ||
          values.isVariantOption,
      ),
      isVariantDefining: Boolean(
        values.isVariantDefining ||
          values.isVariantLevel ||
          values.isVariantOption,
      ),
      isVariantOption: Boolean(
        values.isVariantOption ||
          values.isVariantLevel ||
          values.isVariantDefining,
      ),

      // Backend current DTO rejects these, API cleaner should also remove them.
      isSeoField: false,
      isFitEngineField: false,
      isStyleEngineField: false,
      isBulkUploadField: false,

      options: optionBasedTypes.includes(values.type)
        ? (values.options || [])
            .map((option, index) => {
              const label = String(option.label || "").trim();
              const rawValue = String(option.value || option.label || "").trim();
              const sortOrder = Number(option.sortOrder || index + 1);

              return {
                id: option.id,
                label,
                value: rawValue ? slugify(rawValue) : "",
                colorHex: String(option.colorHex || "").trim(),
                imageUrl: String(option.imageUrl || "").trim(),
                sortOrder,
                position: sortOrder,
                isActive:
                  typeof option.isActive === "boolean"
                    ? option.isActive
                    : true,
              };
            })
            .filter((option) => option.label && option.value)
        : [],
    };

    onSubmit(cleanedValues);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pb-28">
      <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-medium text-neutral-950">
            Basic information
          </h2>
          <p className="text-sm text-neutral-500">
            Attribute ka naam, code aur description set karo. Code backend aur
            product mapping ke liye use hoga.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Attribute Name"
            error={form.formState.errors.name?.message}
          >
            <Input
              value={form.watch("name")}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Color Family"
            />
          </Field>

          <Field label="Slug" error={form.formState.errors.slug?.message}>
            <Input
              value={form.watch("slug")}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="color-family"
            />
          </Field>

          <Field label="Code" error={form.formState.errors.code?.message}>
            <Input
              value={form.watch("code")}
              onChange={(event) => handleCodeChange(event.target.value)}
              placeholder="COLOR_FAMILY"
            />
          </Field>

          <Field label="Status">
            <select
              value={form.watch("status")}
              onChange={(event) => {
                const status = event.target
                  .value as AttributeFormValues["status"];

                form.setValue("status", status, {
                  shouldDirty: true,
                  shouldValidate: true,
                });

                form.setValue("isActive", status === "ACTIVE", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                {...form.register("description")}
                className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Attribute description..."
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-medium text-neutral-950">
            Attribute settings
          </h2>
          <p className="text-sm text-neutral-500">
            Type, scope aur group decide karega ki ye product, variant, filter,
            search ya taxonomy me kaise use hoga.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Type">
            <select
              value={selectedType}
              onChange={(event) =>
                handleTypeChange(
                  event.target.value as AttributeFormValues["type"],
                )
              }
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="SELECT">Select</option>
              <option value="MULTI_SELECT">Multi Select</option>
              <option value="COLOR">Color / Swatch</option>
              <option value="SIZE">Size</option>
            </select>
          </Field>

          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="PRODUCT_AND_VARIANT">Product + Variant</option>
            </select>
          </Field>

        <Field label="System group">
            <select
              {...form.register("group")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="FIT">Fit</option>
              <option value="STYLE">Style</option>
              <option value="SEO">SEO</option>
              <option value="SEARCH">Search</option>
              <option value="MTO">MTO</option>
              <option value="RENTAL">Rental</option>
              <option value="RESALE">Resale</option>
              <option value="BASIC">Basic</option>
              <option value="SIZE">Size</option>
              <option value="COLOR">Color</option>
              <option value="FABRIC">Fabric</option>
              <option value="OCCASION">Occasion</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </Field>
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-neutral-500" />

                    <p className="text-sm font-semibold text-neutral-900">
                      Catalog attribute group
                    </p>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Backend Attribute Group assign karo. Ye System group se
                    alag relation hai aur Attribute Groups page par usage count
                    update karega.
                  </p>
                </div>

                <Link
                  href="/admin/catalog/attributes/groups"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  <Layers3 className="h-3.5 w-3.5" />
                  Manage groups
                </Link>
              </div>

              <div className="mt-4">
                <select
                  value={selectedCatalogGroupId}
                  onChange={(event) =>
                    handleCatalogGroupChange(event.target.value)
                  }
                  disabled={isCatalogGroupsLoading}
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
                >
                  <option value="">
                    {isCatalogGroupsLoading
                      ? "Loading attribute groups..."
                      : "Ungrouped"}
                  </option>

                  {catalogGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label || group.name}
                      {group.isActive === false ? " — Inactive" : ""}
                    </option>
                  ))}
                </select>

                {catalogGroupsError ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {catalogGroupsError}
                  </div>
                ) : null}

                {!isCatalogGroupsLoading &&
                !catalogGroupsError &&
                catalogGroups.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Abhi koi Catalog Attribute Group available nahi hai. Manage
                    groups page se pehle group create karo.
                  </div>
                ) : null}

                {selectedCatalogGroup ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedCatalogGroup.label ||
                        selectedCatalogGroup.name}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 font-mono text-[11px] text-neutral-500 ring-1 ring-neutral-200">
                      {selectedCatalogGroup.slug ||
                        selectedCatalogGroup.key ||
                        selectedCatalogGroup.code}
                    </span>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase",
                        selectedCatalogGroup.isActive === false
                          ? "bg-neutral-200 text-neutral-600"
                          : "bg-emerald-50 text-emerald-700",
                      ].join(" ")}
                    >
                      {selectedCatalogGroup.isActive === false
                        ? "Inactive"
                        : "Active"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCatalogGroupChange("")}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                    >
                      Remove assignment
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-neutral-500">
                    Attribute currently ungrouped rahega.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showOptions ? (
        <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-2xl font-medium text-neutral-950">
                Options
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {fields.length} option{fields.length === 1 ? "" : "s"} added.
                Select, multi-select, color aur size attributes ke options
                yahan add karo.
              </p>
            </div>

            <Button
              type="button"
              onClick={addOption}
              className="w-fit rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add option
            </Button>
          </div>

      <div className="mt-6 space-y-3">
  {optionActionError ? (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-semibold">Option action failed</p>
      <p className="mt-1">{optionActionError}</p>
    </div>
  ) : null}

  {fields.length ? (
    fields.map((field, index) => {
      const currentOption = form.watch(`options.${index}`);
      const optionId = String(currentOption?.id || "").trim();
      const isActive = Boolean(currentOption?.isActive);

      const statusLoading =
        Boolean(optionId) &&
        optionAction?.id === optionId &&
        optionAction.type === "status";

      const deleteLoading =
        Boolean(optionId) &&
        optionAction?.id === optionId &&
        optionAction.type === "delete";

      const rowLoading = statusLoading || deleteLoading;

      return (
        <div
          key={field.formRowId}
          className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1.3fr_110px_90px_100px_220px]"
        >
          <Field label="Label">
            <Input
              value={form.watch(`options.${index}.label`) || ""}
              disabled={rowLoading}
              onChange={(event) =>
                handleOptionLabelChange(index, event.target.value)
              }
              placeholder="Ivory"
            />
          </Field>

          <Field label="Value">
            <Input
              value={form.watch(`options.${index}.value`) || ""}
              disabled={rowLoading || Boolean(optionId)}
              onChange={(event) =>
                form.setValue(
                  `options.${index}.value`,
                  slugify(event.target.value),
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                )
              }
              placeholder="ivory"
            />

            {optionId ? (
              <span className="mt-1 block text-xs text-neutral-500">
                Existing stored value ko change karne se references break ho
                sakte hain, isliye locked hai.
              </span>
            ) : null}
          </Field>

          {selectedType === "COLOR" ? (
            <Field label="Color">
              <input
                type="color"
                disabled={rowLoading}
                value={
                  form.watch(`options.${index}.colorHex`) || "#000000"
                }
                onChange={(event) =>
                  form.setValue(
                    `options.${index}.colorHex`,
                    event.target.value,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
                className="h-10 w-full rounded-md border border-neutral-300 bg-white p-1 disabled:opacity-50"
              />
            </Field>
          ) : (
            <div className="hidden xl:block" />
          )}

          <Field label="Sort">
            <Input
              type="number"
              disabled={rowLoading}
              value={String(
                form.watch(`options.${index}.sortOrder`) || index + 1,
              )}
              onChange={(event) => {
                const nextSort = Number(
                  event.target.value || index + 1,
                );

                form.setValue(
                  `options.${index}.sortOrder`,
                  nextSort,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );

                form.setValue(
                  `options.${index}.position`,
                  nextSort,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
              }}
            />
          </Field>

          <div className="flex flex-col justify-end">
            <span className="mb-2 block text-sm font-medium text-neutral-800">
              Status
            </span>

            <span
              className={[
                "inline-flex h-10 items-center justify-center rounded-full px-3 text-xs font-semibold ring-1",
                isActive
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-neutral-100 text-neutral-600 ring-neutral-200",
              ].join(" ")}
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-2 xl:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={rowLoading}
              onClick={() => handleOptionStatusChange(index)}
              className={[
                "h-10 rounded-full px-4",
                isActive
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
              ].join(" ")}
            >
              {statusLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isActive ? (
                <Power className="mr-2 h-4 w-4" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}

              {statusLoading
                ? "Updating..."
                : isActive
                  ? "Deactivate"
                  : "Activate"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={rowLoading}
              onClick={() => handleDeleteOption(index)}
              className="h-10 rounded-full border-red-200 bg-red-50 px-4 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              {deleteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}

              {deleteLoading
                ? "Deleting..."
                : optionId
                  ? "Delete"
                  : "Remove"}
            </Button>
          </div>
        </div>
      );
    })
  ) : (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-8 text-center">
      <p className="text-sm font-medium text-neutral-800">
        No options added yet.
      </p>

      <p className="mt-1 text-sm text-neutral-500">
        Add option click karke values add karo.
      </p>
    </div>
  )}
</div>
        </section>
      ) : null}

      <section className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-medium text-neutral-950">
            Usage flags
          </h2>
          <p className="text-sm text-neutral-500">
            Ye flags decide karenge ki attribute filters, search aur variant
            option me use hoga ya nahi.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CheckboxField
            label="Required"
            checked={Boolean(form.watch("isRequired"))}
            onChange={(checked) =>
              form.setValue("isRequired", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Filterable"
            checked={Boolean(form.watch("isFilterable"))}
            onChange={(checked) =>
              form.setValue("isFilterable", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Searchable"
            checked={Boolean(form.watch("isSearchable"))}
            onChange={(checked) =>
              form.setValue("isSearchable", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Variant option"
            checked={Boolean(form.watch("isVariantOption"))}
            onChange={(checked) => {
              form.setValue("isVariantOption", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });

              form.setValue("isVariantDefining", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });

              form.setValue("isVariantLevel", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Attribute"}
        </Button>
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

function CheckboxField({
  label,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={[
        "flex items-center gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] text-sm font-medium",
        compact ? "h-10 px-3" : "p-4",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-neutral-950"
      />
      {label}
    </label>
  );
}
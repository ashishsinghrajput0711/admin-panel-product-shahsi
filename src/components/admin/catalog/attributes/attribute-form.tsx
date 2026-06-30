"use client";

import type { ReactNode } from "react";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

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
  const name = String(defaultValues?.name || "").trim();
  const code = String(defaultValues?.code || defaultValues?.slug || "").trim();

  const type = normalizeAttributeType(
    String(defaultValues?.type || defaultValues?.fieldType || ""),
  );

  return {
    name,
    slug: String(defaultValues?.slug || titleToSlug(name)).trim(),
    code: code || slugify(name).toUpperCase(),
    description: String(defaultValues?.description || ""),

    type,
    fieldType: defaultValues?.fieldType || getFieldTypeFromType(type),

    scope: defaultValues?.scope || "PRODUCT_AND_VARIANT",
    group: defaultValues?.group || "PRODUCT",

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
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
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

  const selectedType = form.watch("type");
  const showOptions = optionBasedTypes.includes(selectedType);

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

  function handleSubmit(values: AttributeFormValues) {
    const cleanedValues: AttributeFormValues = {
      ...values,
      fieldType: values.fieldType || getFieldTypeFromType(values.type),
      isActive: values.status === "ACTIVE",

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

          <Field label="Group">
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
            {fields.length ? (
              fields.map((field, index) => (
                <div
                  key={field.formRowId}
                  className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 md:grid-cols-[1.3fr_1.3fr_110px_110px_80px_44px]"
                >
                  <Field label="Label">
                    <Input
                      value={form.watch(`options.${index}.label`) || ""}
                      onChange={(event) =>
                        handleOptionLabelChange(index, event.target.value)
                      }
                      placeholder="Ivory"
                    />
                  </Field>

                  <Field label="Value">
                    <Input
                      value={form.watch(`options.${index}.value`) || ""}
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
                  </Field>

                  {selectedType === "COLOR" ? (
                    <Field label="Color">
                      <input
                        type="color"
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
                        className="h-10 w-full rounded-md border border-neutral-300 bg-white p-1"
                      />
                    </Field>
                  ) : (
                    <div className="hidden md:block" />
                  )}

                  <Field label="Sort">
                    <Input
                      type="number"
                      value={String(
                        form.watch(`options.${index}.sortOrder`) || index + 1,
                      )}
                      onChange={(event) => {
                        const nextSort = Number(event.target.value || index + 1);

                        form.setValue(`options.${index}.sortOrder`, nextSort, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        form.setValue(`options.${index}.position`, nextSort, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </Field>

                  <CheckboxField
                    label="Active"
                    checked={Boolean(form.watch(`options.${index}.isActive`))}
                    compact
                    onChange={(checked) =>
                      form.setValue(`options.${index}.isActive`, checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex h-10 w-10 items-center justify-center self-end rounded-full border border-red-200 text-red-600 transition hover:bg-red-50"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
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
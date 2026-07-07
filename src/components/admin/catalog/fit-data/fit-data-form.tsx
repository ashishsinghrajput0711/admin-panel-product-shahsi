"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fitDataSchema, type FitDataFormValues } from "./fit-data-schema";
import {
  getCatalogProductsPicker,
  type CatalogProductPickerItem,
  type ProductFitDataPayload,
} from "@/lib/admin/catalog-fit-data-api";

type FitDataFormProps = {
  defaultValues?: Partial<FitDataFormValues>;
  onSubmit: (values: ProductFitDataPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  isEditMode?: boolean;
    selectedProduct?: CatalogProductPickerItem | null;
};

const fitTypes = ["SLIM", "REGULAR", "RELAXED", "OVERSIZED"];
const silhouettes = [
  "A_LINE",
  "MERMAID",
  "BALL_GOWN",
  "SHEATH",
  "FIT_AND_FLARE",
  "STRAIGHT",
];
const lengthTypes = ["MINI", "MIDI", "MAXI", "FLOOR_LENGTH", "ANKLE_LENGTH"];
const stretchLevels = ["NONE", "LOW", "MEDIUM", "HIGH"];
const supportLevels = ["LOW", "MEDIUM", "HIGH"];
const closureTypes = ["ZIPPER", "BUTTON", "HOOK", "LACE_UP", "PULLOVER"];
const necklines = [
  "SWEETHEART",
  "V_NECK",
  "HALTER",
  "OFF_SHOULDER",
  "ROUND",
  "SQUARE",
];
const sleeveLengths = ["SLEEVELESS", "SHORT", "THREE_QUARTER", "LONG"];
const waistlines = ["NATURAL", "EMPIRE", "DROPPED", "HIGH_WAIST"];
const bodyTypes = [
  "PETITE",
  "TALL",
  "HOURGLASS",
  "PEAR",
  "APPLE",
  "ATHLETIC",
  "PLUS_SIZE",
];

const blankSizeRow = {
  size: "S",
  bust: "",
  waist: "",
  hips: "",
  length: "",
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toNullableNumber(value?: string) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) return null;

  const parsed = Number(cleanValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(values: FitDataFormValues): ProductFitDataPayload {
  return {
    productId: values.productId,
    scope: values.scope,
    variantId: values.variantId?.trim() || null,
    status: values.status,

    fitType: values.fitType,
    silhouette: values.silhouette,
    lengthType: values.lengthType,
    stretchLevel: values.stretchLevel,
    supportLevel: values.supportLevel,
    closureType: values.closureType,
    neckline: values.neckline,
    sleeveLength: values.sleeveLength,
    waistline: values.waistline,

    fitNotes: values.fitNotes?.trim() || "",
    sizeRecommendationNote: values.sizeRecommendationNote?.trim() || "",

    modelInfo: {
      height: values.modelHeight?.trim() || "",
      wearingSize: values.modelWearingSize?.trim() || "",
      bust: toNullableNumber(values.modelBust),
      waist: toNullableNumber(values.modelWaist),
      hips: toNullableNumber(values.modelHips),
    },

    measurementGuide: {
      bust: values.guideBust?.trim() || "",
      waist: values.guideWaist?.trim() || "",
      hips: values.guideHips?.trim() || "",
      length: values.guideLength?.trim() || "",
    },

    sizeChart: values.sizeChart
      .map((row) => ({
        size: row.size.trim(),
        bust: toNullableNumber(row.bust),
        waist: toNullableNumber(row.waist),
        hips: toNullableNumber(row.hips),
        length: toNullableNumber(row.length),
      }))
      .filter((row) => row.size),

    alterationAllowed: Boolean(values.alterationAllowed),
    customSizingAvailable: Boolean(values.customSizingAvailable),
    recommendedForBodyTypes: values.recommendedForBodyTypes || [],
    notRecommendedForBodyTypes: values.notRecommendedForBodyTypes || [],
    isActive: Boolean(values.isActive),
  };
}

export function FitDataForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Fit Data",
  isEditMode = false,
  selectedProduct = null,
}: FitDataFormProps) {
  const form = useForm<FitDataFormValues>({
    resolver: zodResolver(fitDataSchema) as Resolver<FitDataFormValues>,
    defaultValues: {
      productId: "",
      scope: "PRODUCT",
      variantId: "",
      status: "ACTIVE",

      fitType: "REGULAR",
      silhouette: "A_LINE",
      lengthType: "FLOOR_LENGTH",
      stretchLevel: "LOW",
      supportLevel: "MEDIUM",
      closureType: "ZIPPER",
      neckline: "SWEETHEART",
      sleeveLength: "SLEEVELESS",
      waistline: "NATURAL",

      fitNotes: "",
      sizeRecommendationNote: "",

      modelHeight: "",
      modelWearingSize: "",
      modelBust: "",
      modelWaist: "",
      modelHips: "",

      guideBust: "",
      guideWaist: "",
      guideHips: "",
      guideLength: "",

      sizeChart: [blankSizeRow],

      alterationAllowed: false,
      customSizingAvailable: false,
      isActive: true,

      recommendedForBodyTypes: [],
      notRecommendedForBodyTypes: [],

      ...defaultValues,
    },
  });
    const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<CatalogProductPickerItem[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [selectedPickerProduct, setSelectedPickerProduct] =
    useState<CatalogProductPickerItem | null>(selectedProduct);
  const [productPickerError, setProductPickerError] = useState<string | null>(
    null,
  );

    useEffect(() => {
    setSelectedPickerProduct(selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    if (!defaultValues) return;

    form.reset({
      productId: "",
      scope: "PRODUCT",
      variantId: "",
      status: "ACTIVE",
      fitType: "REGULAR",
      silhouette: "A_LINE",
      lengthType: "FLOOR_LENGTH",
      stretchLevel: "LOW",
      supportLevel: "MEDIUM",
      closureType: "ZIPPER",
      neckline: "SWEETHEART",
      sleeveLength: "SLEEVELESS",
      waistline: "NATURAL",
      fitNotes: "",
      sizeRecommendationNote: "",
      modelHeight: "",
      modelWearingSize: "",
      modelBust: "",
      modelWaist: "",
      modelHips: "",
      guideBust: "",
      guideWaist: "",
      guideHips: "",
      guideLength: "",
      sizeChart: [blankSizeRow],
      alterationAllowed: false,
      customSizingAvailable: false,
      isActive: true,
      recommendedForBodyTypes: [],
      notRecommendedForBodyTypes: [],
      ...defaultValues,
    });
  }, [defaultValues, form]);


    const loadProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);
      setProductPickerError(null);

      const data = await getCatalogProductsPicker({
        search: productSearch,
        page: 1,
        limit: 50,
      });

      setProducts(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setProductPickerError(
        error instanceof Error
          ? error.message
          : "Products load nahi ho paaye.",
      );
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  }, [productSearch]);

  useEffect(() => {
    if (!isProductPickerOpen) return;

    loadProducts();
  }, [isProductPickerOpen, loadProducts]);

  function handleSelectProduct(product: CatalogProductPickerItem) {
    form.setValue("productId", product.id, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setSelectedPickerProduct(product);
    setIsProductPickerOpen(false);
  }

  const sizeChart = form.watch("sizeChart") || [];
  const recommendedForBodyTypes = form.watch("recommendedForBodyTypes") || [];
  const notRecommendedForBodyTypes =
    form.watch("notRecommendedForBodyTypes") || [];

  function addSizeRow() {
    form.setValue("sizeChart", [...sizeChart, { ...blankSizeRow, size: "" }], {
      shouldValidate: true,
    });
  }

  function removeSizeRow(index: number) {
    if (sizeChart.length <= 1) return;

    form.setValue(
      "sizeChart",
      sizeChart.filter((_, rowIndex) => rowIndex !== index),
      { shouldValidate: true },
    );
  }

  function toggleBodyType(
    key: "recommendedForBodyTypes" | "notRecommendedForBodyTypes",
    value: string,
  ) {
    const currentValue = form.getValues(key) || [];
    const exists = currentValue.includes(value);

    form.setValue(
      key,
      exists
        ? currentValue.filter((item) => item !== value)
        : [...currentValue, value],
      { shouldValidate: true },
    );
  }

  function handleSubmit(values: FitDataFormValues) {
    return onSubmit(buildPayload(values));
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Fit Data Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
                   <Field
            label="Product"
            error={form.formState.errors.productId?.message}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  {...form.register("productId")}
                  disabled={isEditMode}
                  placeholder="Catalog product ID"
                />

                {!isEditMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductPickerOpen(true)}
                  >
                    Pick Product
                  </Button>
                ) : null}
              </div>

              {selectedPickerProduct ? (
                <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-3 text-sm">
                  <p className="font-medium">{selectedPickerProduct.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    SKU: {selectedPickerProduct.sku || "—"}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-400">
                    {selectedPickerProduct.slug || selectedPickerProduct.id}
                  </p>
                 {!isEditMode && selectedPickerProduct.hasFitData ? (
  <p className="mt-2 text-xs font-medium text-amber-700">
    This product already has fit data. Saving will update the existing record.
  </p>
) : null}
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
            </select>
          </Field>

          <Field label="Variant ID">
            <Input {...form.register("variantId")} placeholder="Optional variant ID" />
          </Field>

          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          <CheckboxField
            label="Fit Data Active"
            checked={Boolean(form.watch("isActive"))}
            onChange={(checked) =>
              form.setValue("isActive", checked, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Fit Classification</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SelectField label="Fit Type" register={form.register("fitType")} options={fitTypes} />
          <SelectField label="Silhouette" register={form.register("silhouette")} options={silhouettes} />
          <SelectField label="Length Type" register={form.register("lengthType")} options={lengthTypes} />
          <SelectField label="Stretch Level" register={form.register("stretchLevel")} options={stretchLevels} />
          <SelectField label="Support Level" register={form.register("supportLevel")} options={supportLevels} />
          <SelectField label="Closure Type" register={form.register("closureType")} options={closureTypes} />
          <SelectField label="Neckline" register={form.register("neckline")} options={necklines} />
          <SelectField label="Sleeve Length" register={form.register("sleeveLength")} options={sleeveLengths} />
          <SelectField label="Waistline" register={form.register("waistline")} options={waistlines} />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Notes</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Fit Notes">
            <textarea
              {...form.register("fitNotes")}
              className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Runs true to size."
            />
          </Field>

          <Field label="Size Recommendation Note">
            <textarea
              {...form.register("sizeRecommendationNote")}
              className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Choose your usual size. Size up if between sizes."
            />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Model Info</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <Field label="Height">
            <Input {...form.register("modelHeight")} placeholder={`5'8`} />
          </Field>

          <Field label="Wearing Size">
            <Input {...form.register("modelWearingSize")} placeholder="S" />
          </Field>

          <Field label="Bust">
            <Input {...form.register("modelBust")} type="number" placeholder="34" />
          </Field>

          <Field label="Waist">
            <Input {...form.register("modelWaist")} type="number" placeholder="26" />
          </Field>

          <Field label="Hips">
            <Input {...form.register("modelHips")} type="number" placeholder="36" />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Measurement Guide</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Bust Guide">
            <Input {...form.register("guideBust")} placeholder="Measure around the fullest part of bust." />
          </Field>

          <Field label="Waist Guide">
            <Input {...form.register("guideWaist")} placeholder="Measure around natural waist." />
          </Field>

          <Field label="Hips Guide">
            <Input {...form.register("guideHips")} placeholder="Measure around fullest part of hips." />
          </Field>

          <Field label="Length Guide">
            <Input {...form.register("guideLength")} placeholder="Measure from shoulder to hem." />
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-medium">Size Chart</h2>

          <Button type="button" variant="outline" onClick={addSizeRow}>
            Add Row
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {sizeChart.map((_, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
            >
              <Field label="Size">
                <Input {...form.register(`sizeChart.${index}.size`)} placeholder="S" />
              </Field>

              <Field label="Bust">
                <Input {...form.register(`sizeChart.${index}.bust`)} type="number" placeholder="34" />
              </Field>

              <Field label="Waist">
                <Input {...form.register(`sizeChart.${index}.waist`)} type="number" placeholder="26" />
              </Field>

              <Field label="Hips">
                <Input {...form.register(`sizeChart.${index}.hips`)} type="number" placeholder="36" />
              </Field>

              <Field label="Length">
                <Input {...form.register(`sizeChart.${index}.length`)} type="number" placeholder="59" />
              </Field>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={sizeChart.length <= 1}
                  onClick={() => removeSizeRow(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <BodyTypeSelector
          label="Recommended For Body Types"
          values={recommendedForBodyTypes}
          onToggle={(value) => toggleBodyType("recommendedForBodyTypes", value)}
        />

        <BodyTypeSelector
          label="Not Recommended For Body Types"
          values={notRecommendedForBodyTypes}
          onToggle={(value) =>
            toggleBodyType("notRecommendedForBodyTypes", value)
          }
        />
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Rules</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <CheckboxField
            label="Alteration Allowed"
            checked={Boolean(form.watch("alterationAllowed"))}
            onChange={(checked) =>
              form.setValue("alterationAllowed", checked, {
                shouldValidate: true,
              })
            }
          />

          <CheckboxField
            label="Custom Sizing Available"
            checked={Boolean(form.watch("customSizingAvailable"))}
            onChange={(checked) =>
              form.setValue("customSizingAvailable", checked, {
                shouldValidate: true,
              })
            }
          />
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>

            {isProductPickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <div className="border-b border-neutral-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-medium">Pick Product</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Search by product name, SKU or slug.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductPickerOpen(false)}
                >
                  Close
                </Button>
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search product..."
                />

                <Button type="button" onClick={loadProducts}>
                  Search
                </Button>
              </div>

              {productPickerError ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {productPickerError}
                </div>
              ) : null}
            </div>

            <div className="max-h-[58vh] overflow-auto p-5">
              {isProductsLoading ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  Products load ho rahe hain...
                </div>
              ) : products.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left hover:bg-[#fbfaf6]"
                    >
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 font-medium">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          SKU: {product.sku || "—"}
                        </p>
                        <p className="mt-1 truncate text-xs text-neutral-400">
                          {product.slug || product.id}
                        </p>

                        <span
                          className={
                            product.hasFitData
                              ? "mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                              : "mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                          }
                        >
                          {product.hasFitData
                            ? "Fit data exists"
                            : "No fit data"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  No products found.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function SelectField({
  label,
  register,
  options,
}: {
  label: string;
  register: ReturnType<typeof useForm<FitDataFormValues>>["register"] extends (
    name: any,
  ) => infer R
    ? R
    : never;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select
        {...register}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function BodyTypeSelector({
  label,
  values,
  onToggle,
}: {
  label: string;
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
      <h2 className="text-2xl font-medium">{label}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {bodyTypes.map((bodyType) => {
          const selected = values.includes(bodyType);

          return (
            <button
              key={bodyType}
              type="button"
              onClick={() => onToggle(bodyType)}
              className={
                selected
                  ? "rounded-full border border-neutral-950 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              }
            >
              {formatLabel(bodyType)}
            </button>
          );
        })}
      </div>
    </section>
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
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFitDataOptions,
  getProductFitData,
  saveProductFitData,
  type FitDataOptions,
  type ProductFitData,
  type ProductFitSizeChartRow,
} from "@/lib/admin/product-fit-data-api";

type ProductFitDataSectionProps = {
  productId: string;
  product: {
    fitData?: ProductFitData | null;
  };
  token?: string | null;
  onSaved?: () => void;
};

type FitFormState = {
  fitType: string;
  silhouette: string;
  lengthType: string;
  stretchLevel: string;
  supportLevel: string;
  closureType: string;
  neckline: string;
  sleeveLength: string;
  waistline: string;
  fitNotes: string;
  sizeRecommendationNote: string;
  modelHeight: string;
  modelWearingSize: string;
  modelBust: string;
  modelWaist: string;
  modelHips: string;
  guideBust: string;
  guideWaist: string;
  guideHips: string;
  guideLength: string;
  sizeChart: Array<{
    size: string;
    bust: string;
    waist: string;
    hips: string;
    length: string;
  }>;
  alterationAllowed: boolean;
  customSizingAvailable: boolean;
  recommendedForBodyTypes: string[];
  notRecommendedForBodyTypes: string[];
  isActive: boolean;
};

const emptyOptions: FitDataOptions = {
  fitTypes: [],
  silhouettes: [],
  lengthTypes: [],
  stretchLevels: [],
  supportLevels: [],
  closureTypes: [],
  necklines: [],
  sleeveLengths: [],
  waistlines: [],
  bodyTypes: [],
};

function text(value: unknown) {
  return String(value ?? "");
}

function numberText(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function toNullableNumber(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) return null;

  const parsed = Number(cleanValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeSizeChart(
  rows?: ProductFitSizeChartRow[] | null,
): FitFormState["sizeChart"] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [
      {
        size: "S",
        bust: "",
        waist: "",
        hips: "",
        length: "",
      },
    ];
  }

  return rows.map((row) => ({
    size: text(row.size),
    bust: numberText(row.bust),
    waist: numberText(row.waist),
    hips: numberText(row.hips),
    length: numberText(row.length),
  }));
}

function buildInitialState(fitData?: ProductFitData | null): FitFormState {
  return {
    fitType: text(fitData?.fitType || "REGULAR"),
    silhouette: text(fitData?.silhouette || "A_LINE"),
    lengthType: text(fitData?.lengthType || "FLOOR_LENGTH"),
    stretchLevel: text(fitData?.stretchLevel || "LOW"),
    supportLevel: text(fitData?.supportLevel || "MEDIUM"),
    closureType: text(fitData?.closureType || "ZIPPER"),
    neckline: text(fitData?.neckline || "SWEETHEART"),
    sleeveLength: text(fitData?.sleeveLength || "SLEEVELESS"),
    waistline: text(fitData?.waistline || "NATURAL"),
    fitNotes: text(fitData?.fitNotes),
    sizeRecommendationNote: text(fitData?.sizeRecommendationNote),
    modelHeight: text(fitData?.modelInfo?.height),
    modelWearingSize: text(fitData?.modelInfo?.wearingSize),
    modelBust: numberText(fitData?.modelInfo?.bust),
    modelWaist: numberText(fitData?.modelInfo?.waist),
    modelHips: numberText(fitData?.modelInfo?.hips),
    guideBust: text(fitData?.measurementGuide?.bust),
    guideWaist: text(fitData?.measurementGuide?.waist),
    guideHips: text(fitData?.measurementGuide?.hips),
    guideLength: text(fitData?.measurementGuide?.length),
    sizeChart: normalizeSizeChart(fitData?.sizeChart),
    alterationAllowed: Boolean(fitData?.alterationAllowed),
    customSizingAvailable: Boolean(fitData?.customSizingAvailable),
    recommendedForBodyTypes: Array.isArray(fitData?.recommendedForBodyTypes)
      ? fitData.recommendedForBodyTypes
      : [],
    notRecommendedForBodyTypes: Array.isArray(
      fitData?.notRecommendedForBodyTypes,
    )
      ? fitData.notRecommendedForBodyTypes
      : [],
    isActive: fitData?.isActive !== false,
  };
}

function buildPayload(values: FitFormState): ProductFitData {
  return {
    fitType: values.fitType,
    silhouette: values.silhouette,
    lengthType: values.lengthType,
    stretchLevel: values.stretchLevel,
    supportLevel: values.supportLevel,
    closureType: values.closureType,
    neckline: values.neckline,
    sleeveLength: values.sleeveLength,
    waistline: values.waistline,
    fitNotes: values.fitNotes.trim(),
    sizeRecommendationNote: values.sizeRecommendationNote.trim(),
    modelInfo: {
      height: values.modelHeight.trim(),
      wearingSize: values.modelWearingSize.trim(),
      bust: toNullableNumber(values.modelBust),
      waist: toNullableNumber(values.modelWaist),
      hips: toNullableNumber(values.modelHips),
    },
    measurementGuide: {
      bust: values.guideBust.trim(),
      waist: values.guideWaist.trim(),
      hips: values.guideHips.trim(),
      length: values.guideLength.trim(),
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
    alterationAllowed: values.alterationAllowed,
    customSizingAvailable: values.customSizingAvailable,
    recommendedForBodyTypes: values.recommendedForBodyTypes,
    notRecommendedForBodyTypes: values.notRecommendedForBodyTypes,
    isActive: values.isActive,
  };
}

export function ProductFitDataSection({
  productId,
  product,
  token,
  onSaved,
}: ProductFitDataSectionProps) {
  const initialState = useMemo(
    () => buildInitialState(product.fitData),
    [product.fitData],
  );

  const [values, setValues] = useState<FitFormState>(initialState);
  const [options, setOptions] = useState<FitDataOptions>(emptyOptions);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFitData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [nextOptions, nextFitData] = await Promise.all([
          getFitDataOptions(token),
          product.fitData
            ? Promise.resolve(product.fitData)
            : getProductFitData({ productId, token }),
        ]);

        if (!isMounted) return;

        setOptions(nextOptions || emptyOptions);
        setValues(buildInitialState(nextFitData));
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Fit Data load nahi ho paaya.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFitData();

    return () => {
      isMounted = false;
    };
  }, [product.fitData, productId, token]);

  function updateField<K extends keyof FitFormState>(
    key: K,
    value: FitFormState[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSizeChartRow(
    index: number,
    key: keyof FitFormState["sizeChart"][number],
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      sizeChart: current.sizeChart.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    }));
  }

  function addSizeChartRow() {
    setValues((current) => ({
      ...current,
      sizeChart: [
        ...current.sizeChart,
        {
          size: "",
          bust: "",
          waist: "",
          hips: "",
          length: "",
        },
      ],
    }));
  }

  function removeSizeChartRow(index: number) {
    setValues((current) => ({
      ...current,
      sizeChart:
        current.sizeChart.length > 1
          ? current.sizeChart.filter((_, rowIndex) => rowIndex !== index)
          : current.sizeChart,
    }));
  }

  function toggleBodyType(key: "recommendedForBodyTypes" | "notRecommendedForBodyTypes", value: string) {
    setValues((current) => {
      const currentList = current[key];
      const exists = currentList.includes(value);

      return {
        ...current,
        [key]: exists
          ? currentList.filter((item) => item !== value)
          : [...currentList, value],
      };
    });
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setMessage(null);
      setErrorMessage(null);

      const payload = buildPayload(values);

      await saveProductFitData({
        productId,
        payload,
        token,
      });

      setMessage("Fit Data save ho gaya.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Fit Data save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Catalog / Fit Data
          </p>

          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Fit Data
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Manage product fit, size guide, model measurements and body type
            recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Fit Data"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
          Loading Fit Data...
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <SelectField
              label="Fit Type"
              value={values.fitType}
              options={options.fitTypes}
              onChange={(value) => updateField("fitType", value)}
            />

            <SelectField
              label="Silhouette"
              value={values.silhouette}
              options={options.silhouettes}
              onChange={(value) => updateField("silhouette", value)}
            />

            <SelectField
              label="Length Type"
              value={values.lengthType}
              options={options.lengthTypes}
              onChange={(value) => updateField("lengthType", value)}
            />

            <SelectField
              label="Stretch Level"
              value={values.stretchLevel}
              options={options.stretchLevels}
              onChange={(value) => updateField("stretchLevel", value)}
            />

            <SelectField
              label="Support Level"
              value={values.supportLevel}
              options={options.supportLevels}
              onChange={(value) => updateField("supportLevel", value)}
            />

            <SelectField
              label="Closure Type"
              value={values.closureType}
              options={options.closureTypes}
              onChange={(value) => updateField("closureType", value)}
            />

            <SelectField
              label="Neckline"
              value={values.neckline}
              options={options.necklines}
              onChange={(value) => updateField("neckline", value)}
            />

            <SelectField
              label="Sleeve Length"
              value={values.sleeveLength}
              options={options.sleeveLengths}
              onChange={(value) => updateField("sleeveLength", value)}
            />

            <SelectField
              label="Waistline"
              value={values.waistline}
              options={options.waistlines}
              onChange={(value) => updateField("waistline", value)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaField
              label="Fit Notes"
              value={values.fitNotes}
              placeholder="Runs true to size."
              onChange={(value) => updateField("fitNotes", value)}
            />

            <TextAreaField
              label="Size Recommendation Note"
              value={values.sizeRecommendationNote}
              placeholder="Choose your usual size. Size up if between sizes."
              onChange={(value) =>
                updateField("sizeRecommendationNote", value)
              }
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4">
            <h3 className="text-sm font-semibold text-neutral-950">
              Model Info
            </h3>

            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              <InputField
                label="Height"
                value={values.modelHeight}
                placeholder={`5'8`}
                onChange={(value) => updateField("modelHeight", value)}
              />

              <InputField
                label="Wearing Size"
                value={values.modelWearingSize}
                placeholder="S"
                onChange={(value) => updateField("modelWearingSize", value)}
              />

              <InputField
                label="Bust"
                type="number"
                value={values.modelBust}
                placeholder="34"
                onChange={(value) => updateField("modelBust", value)}
              />

              <InputField
                label="Waist"
                type="number"
                value={values.modelWaist}
                placeholder="26"
                onChange={(value) => updateField("modelWaist", value)}
              />

              <InputField
                label="Hips"
                type="number"
                value={values.modelHips}
                placeholder="36"
                onChange={(value) => updateField("modelHips", value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4">
            <h3 className="text-sm font-semibold text-neutral-950">
              Measurement Guide
            </h3>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <InputField
                label="Bust Guide"
                value={values.guideBust}
                placeholder="Measure around the fullest part of bust."
                onChange={(value) => updateField("guideBust", value)}
              />

              <InputField
                label="Waist Guide"
                value={values.guideWaist}
                placeholder="Measure around natural waist."
                onChange={(value) => updateField("guideWaist", value)}
              />

              <InputField
                label="Hips Guide"
                value={values.guideHips}
                placeholder="Measure around fullest part of hips."
                onChange={(value) => updateField("guideHips", value)}
              />

              <InputField
                label="Length Guide"
                value={values.guideLength}
                placeholder="Measure from shoulder to hem."
                onChange={(value) => updateField("guideLength", value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-neutral-950">
                Size Chart
              </h3>

              <button
                type="button"
                onClick={addSizeChartRow}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                Add Row
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {values.sizeChart.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
                >
                  <InputField
                    label="Size"
                    value={row.size}
                    placeholder="S"
                    onChange={(value) =>
                      updateSizeChartRow(index, "size", value)
                    }
                  />

                  <InputField
                    label="Bust"
                    type="number"
                    value={row.bust}
                    placeholder="34"
                    onChange={(value) =>
                      updateSizeChartRow(index, "bust", value)
                    }
                  />

                  <InputField
                    label="Waist"
                    type="number"
                    value={row.waist}
                    placeholder="26"
                    onChange={(value) =>
                      updateSizeChartRow(index, "waist", value)
                    }
                  />

                  <InputField
                    label="Hips"
                    type="number"
                    value={row.hips}
                    placeholder="36"
                    onChange={(value) =>
                      updateSizeChartRow(index, "hips", value)
                    }
                  />

                  <InputField
                    label="Length"
                    type="number"
                    value={row.length}
                    placeholder="59"
                    onChange={(value) =>
                      updateSizeChartRow(index, "length", value)
                    }
                  />

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeSizeChartRow(index)}
                      disabled={values.sizeChart.length <= 1}
                      className="h-10 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BodyTypeSelector
              label="Recommended For Body Types"
              values={values.recommendedForBodyTypes}
              options={options.bodyTypes}
              onToggle={(value) =>
                toggleBodyType("recommendedForBodyTypes", value)
              }
            />

            <BodyTypeSelector
              label="Not Recommended For Body Types"
              values={values.notRecommendedForBodyTypes}
              options={options.bodyTypes}
              onToggle={(value) =>
                toggleBodyType("notRecommendedForBodyTypes", value)
              }
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-3">
            <CheckboxField
              label="Alteration Allowed"
              checked={values.alterationAllowed}
              onChange={(checked) => updateField("alterationAllowed", checked)}
            />

            <CheckboxField
              label="Custom Sizing Available"
              checked={values.customSizingAvailable}
              onChange={(checked) =>
                updateField("customSizingAvailable", checked)
              }
            />

            <CheckboxField
              label="Fit Data Active"
              checked={values.isActive}
              onChange={(checked) => updateField("isActive", checked)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
      >
        {options.length ? null : <option value={value}>{formatLabel(value)}</option>}

        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
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
    <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-neutral-300"
      />
      {label}
    </label>
  );
}

function BodyTypeSelector({
  label,
  values,
  options,
  onToggle,
}: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <h3 className="text-sm font-semibold text-neutral-950">{label}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={
                selected
                  ? "rounded-full border border-neutral-950 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              }
            >
              {formatLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
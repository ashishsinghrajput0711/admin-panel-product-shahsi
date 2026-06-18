"use client";

import { useMemo } from "react";
import { HelpCircle, Layers3, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "./product-schema";

type MetafieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

type FieldType = "text" | "textarea" | "tags" | "select";

type MetafieldField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
};

const categoryMetafieldFields: MetafieldField[] = [
  {
    key: "color",
    label: "Color",
    type: "text",
    placeholder: "Dusty Rose",
  },
  {
    key: "size",
    label: "Size",
    type: "tags",
    placeholder: "S, M, L, XL, Custom",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "text",
    placeholder: "Cotton",
  },
  {
    key: "ageGroup",
    label: "Age group",
    type: "select",
    options: ["", "Adults", "Kids", "Teens", "Unisex"],
  },
  {
    key: "careInstructions",
    label: "Care instructions",
    type: "text",
    placeholder: "Dry clean only",
  },
  {
    key: "clothingFeatures",
    label: "Clothing features",
    type: "tags",
    placeholder: "Breathable, Lightweight",
  },
  {
    key: "dressOccasion",
    label: "Dress occasion",
    type: "tags",
    placeholder: "Casual, Everyday",
  },
  {
    key: "dressStyle",
    label: "Dress style",
    type: "text",
    placeholder: "Flared",
  },
  {
    key: "neckline",
    label: "Neckline",
    type: "text",
    placeholder: "V-neck",
  },
  {
    key: "skirtDressLengthType",
    label: "Skirt/Dress length type",
    type: "text",
    placeholder: "Mini",
  },
  {
    key: "sleeveLengthType",
    label: "Sleeve length type",
    type: "text",
    placeholder: "Sleeveless",
  },
  {
    key: "targetGender",
    label: "Target gender",
    type: "select",
    options: ["", "Female", "Male", "Unisex"],
  },
  {
    key: "topLengthType",
    label: "Top length type",
    type: "text",
    placeholder: "Crop",
  },
];

const productMetafieldFields: MetafieldField[] = [
  {
    key: "productFaqs",
    label: "Product FAQs",
    type: "textarea",
    placeholder: "Add product FAQs",
  },
  {
    key: "careInstructions",
    label: "Care & Instructions",
    type: "text",
    placeholder: "Care instructions Cotton",
  },
  {
    key: "compositionOrigin",
    label: "Composition & Origin",
    type: "text",
    placeholder: "Cotton Composition & Origin",
  },
  {
    key: "customBadge",
    label: "Custom Badge",
    type: "text",
    placeholder: "Preorder / New / Limited",
  },
  {
    key: "seeMoreFrom",
    label: "See More from",
    type: "tags",
    placeholder: "Tiered Dress, Mini Dresses for Women",
  },
  {
    key: "primaryCollection",
    label: "Primary collection",
    type: "text",
    placeholder: "Dresses for Women",
  },
  {
    key: "secondaryCollection",
    label: "Secondary collection",
    type: "text",
    placeholder: "Mini Dresses for Women",
  },
  {
    key: "advancedProductTitle",
    label: "Advanced Product Title",
    type: "text",
    placeholder: "Travel-Ready Dusty Rose Gathered Waist Mini Dress",
  },
  {
    key: "similarColorProducts",
    label: "Similar Color Products",
    type: "tags",
    placeholder: "Blush Pink, Dusty Rose",
  },
  {
    key: "matchWithAccessories",
    label: "Match with Accessories",
    type: "tags",
    placeholder: "Clutch, Earrings, Sandals",
  },
  {
    key: "similarStyleProduct",
    label: "Similar Style Product",
    type: "text",
    placeholder: "Day Dresses",
  },
  {
    key: "style",
    label: "Style",
    type: "text",
    placeholder: "Day Dresses",
  },
  {
    key: "fabric",
    label: "Fabric",
    type: "text",
    placeholder: "Cotton",
  },
  {
    key: "print",
    label: "Print",
    type: "text",
    placeholder: "Solid Color",
  },
  {
    key: "printSwatch",
    label: "Print Swatch",
    type: "text",
    placeholder: "Swatch URL or label",
  },
  {
    key: "similarPrintTitle",
    label: "Similar Print Title",
    type: "text",
    placeholder: "Similar prints",
  },
  {
    key: "similarPrintProducts",
    label: "Similar Print Products",
    type: "tags",
    placeholder: "Product handles or titles",
  },
  {
    key: "disclosures",
    label: "Disclosures",
    type: "textarea",
    placeholder: "Any disclosure text",
  },
];

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyValue(value: MetafieldValue) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function getValue(
  values: ProductFormValues,
  group: "categoryMetafields" | "productMetafields",
  key: string
) {
  const groupValue = values[group] as Record<string, MetafieldValue> | undefined;
  return groupValue?.[key];
}

function updateValue(
  values: ProductFormValues,
  group: "categoryMetafields" | "productMetafields",
  key: string,
  value: MetafieldValue,
  onChange: (values: ProductFormValues) => void
) {
  onChange({
    ...values,
    [group]: {
      ...(values[group] || {}),
      [key]: value,
    },
  });
}

function MetafieldInput({
  field,
  value,
  onChange,
}: {
  field: MetafieldField;
  value: MetafieldValue;
  onChange: (value: MetafieldValue) => void;
}) {
  const textValue = stringifyValue(value);

  if (field.type === "textarea") {
    return (
      <textarea
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="min-h-[84px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-950"
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
      >
        {(field.options || [""]).map((option) => (
          <option key={option || "blank"} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      value={textValue}
      onChange={(event) =>
        onChange(
          field.type === "tags" ? parseTags(event.target.value) : event.target.value
        )
      }
      placeholder={field.placeholder}
      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
    />
  );
}

function MetafieldSectionCard({
  icon,
  title,
  subtitle,
  fields,
  values,
  group,
  onChange,
  rightSlot,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  fields: MetafieldField[];
  values: ProductFormValues;
  group: "categoryMetafields" | "productMetafields";
  onChange: (values: ProductFormValues) => void;
  rightSlot?: React.ReactNode;
}) {
  const filledCount = useMemo(() => {
    return fields.filter((field) => {
      const value = getValue(values, group, field.key);
      if (Array.isArray(value)) return value.length > 0;
      return String(value || "").trim().length > 0;
    }).length;
  }, [fields, group, values]);

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700">
            {icon}
          </div>

          <div>
            <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
            <p className="mt-1 text-[11px] text-neutral-400">
              {filledCount} of {fields.length} fields filled
            </p>
          </div>
        </div>

        {rightSlot}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {field.label}
            </label>

            <MetafieldInput
              field={field}
              value={getValue(values, group, field.key)}
              onChange={(value) => updateValue(values, group, field.key, value, onChange)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductShopifyMetafieldsSection({
  values,
  onChange,
  primaryCategoryLabel,
}: {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  primaryCategoryLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <MetafieldSectionCard
        icon={<Layers3 className="h-4 w-4" />}
        title="Category metafields"
        subtitle="Category based filter/search fields. Ye selected category ke context me use honge."
        fields={categoryMetafieldFields}
        values={values}
        group="categoryMetafields"
        onChange={onChange}
        rightSlot={
          <div className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600">
            {primaryCategoryLabel || "Selected category"}
          </div>
        }
      />

      <MetafieldSectionCard
        icon={<Tags className="h-4 w-4" />}
        title="Product metafields"
        subtitle="Additional Shopify-style product details for merchandising, SEO, collections and recommendations."
        fields={productMetafieldFields}
        values={values}
        group="productMetafields"
        onChange={onChange}
        rightSlot={
          <Button type="button" variant="outline" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add definition
          </Button>
        }
      />

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Category metafields category-level data hain. Product metafields product-specific data hain.
          Existing product fields ko touch nahi kiya gaya hai; ye sirf additional Shopify-style fields hain.
        </p>
      </div>
    </div>
  );
}
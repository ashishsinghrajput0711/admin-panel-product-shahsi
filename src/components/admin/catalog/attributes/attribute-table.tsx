"use client";

import Link from "next/link";
import { Archive, Edit3, ListPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attribute, AttributeOption } from "./attribute-types";

const typeLabels: Record<string, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  SELECT: "Select",
  MULTI_SELECT: "Multi Select",
  COLOR: "Color",
  SIZE: "Size",
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  dropdown: "Dropdown",
  multi_select: "Multi Select",
  swatch: "Swatch",
  image: "Image",
  date: "Date",
  formula: "Formula",
  linked_products: "Linked Products",
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(attribute: Attribute) {
  if (attribute.status) return normalizeText(attribute.status).toUpperCase();

  if (attribute.isActive === false) return "INACTIVE";
  if (attribute.isActive === true) return "ACTIVE";

  return "ACTIVE";
}

function getAttributeName(attribute: Attribute) {
  return (
    normalizeText(attribute.name) ||
    normalizeText(attribute.label) ||
    normalizeText(attribute.code) ||
    "Untitled Attribute"
  );
}

function getAttributeCode(attribute: Attribute) {
  return (
    normalizeText(attribute.code) ||
    normalizeText(attribute.slug) ||
    normalizeText(attribute.key) ||
    "no_code"
  );
}

function getAttributeSlug(attribute: Attribute) {
  return (
    normalizeText(attribute.slug) ||
    normalizeText(attribute.key) ||
    normalizeText(attribute.code) ||
    ""
  );
}

function getAttributeType(attribute: Attribute) {
  return normalizeText(attribute.type || attribute.fieldType || "TEXT");
}

function getTypeLabel(attribute: Attribute) {
  const type = getAttributeType(attribute);
  return typeLabels[type] ?? type;
}

function getOptionLabel(option: AttributeOption) {
  return normalizeText(option.label || option.value);
}

function getOptionsCount(attribute: Attribute) {
  return attribute.optionsCount ?? attribute.options?.length ?? 0;
}

function getStatusBadgeClass(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "INACTIVE") {
    return "border-neutral-200 bg-neutral-50 text-neutral-600";
  }

  if (status === "ARCHIVED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getUsageFlags(attribute: Attribute) {
  const flags: string[] = [];

  if (attribute.isRequired) flags.push("Required");
  if (attribute.isFilterable) flags.push("Filter");
  if (attribute.isSearchable) flags.push("Search");

  if (
    attribute.isVariantLevel ||
    attribute.isVariantOption ||
    attribute.isVariantDefining
  ) {
    flags.push("Variant");
  }

  if (attribute.isSeoField) flags.push("SEO");
  if (attribute.isFitEngineField) flags.push("Fit");
  if (attribute.isStyleEngineField) flags.push("Style");
  if (attribute.isBulkUploadField) flags.push("Bulk");

  return flags;
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatUpdatedTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OptionPill({ label }: { label: string }) {
  return (
    <span
      title={label}
      className="inline-flex max-w-[86px] truncate rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700"
    >
      {label}
    </span>
  );
}

function UsagePill({ label }: { label: string }) {
  return (
    <span
      title={label}
      className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
    >
      {label}
    </span>
  );
}

const gridClass =
  "grid grid-cols-[1.25fr_0.9fr_0.75fr_1.7fr_1.15fr_0.9fr_0.85fr_118px]";

export function AttributeTable({
  attributes,
  isLoading,
  isActionLoading,
  onArchive,
}: {
  attributes: Attribute[];
  isLoading: boolean;
  isActionLoading?: boolean;
  onArchive?: (attribute: Attribute) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        Loading attributes...
      </div>
    );
  }

  if (!attributes.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No attributes found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend se current page par attributes nahi mile.
        </p>

        <Button asChild className="mt-4 rounded-full">
          <Link href="/admin/catalog/attributes/library">
            Open Global Library
          </Link>
        </Button>
      </div>
    );
  }

  return (
   <div className="overflow-hidden bg-white">
      <div
        className={`${gridClass} border-b border-neutral-200 bg-[#f4efe7] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500`}
      >
        <div className="min-w-0 pr-3">Attribute</div>
        <div className="min-w-0 pr-3">Code</div>
        <div className="min-w-0 pr-3">Type</div>
        <div className="min-w-0 pr-3">Options</div>
        <div className="min-w-0 pr-3">Usage</div>
        <div className="min-w-0 pr-3">Status</div>
        <div className="min-w-0 pr-3">Updated</div>
        <div className="min-w-0 text-right">Actions</div>
      </div>

      <div className="divide-y divide-neutral-100">
        {attributes.map((attribute) => {
          const status = normalizeStatus(attribute);
          const flags = getUsageFlags(attribute);
          const options = attribute.options ?? [];
          const attributeName = getAttributeName(attribute);
          const attributeSlug = getAttributeSlug(attribute);
          const attributeCode = getAttributeCode(attribute);
          const visibleOptions = options.slice(0, 5);
          const hiddenOptionsCount = Math.max(0, options.length - 5);
          const visibleFlags = flags.slice(0, 3);
          const hiddenFlagsCount = Math.max(0, flags.length - 3);

          return (
            <div
              key={attribute.id}
            className={`${gridClass} items-center px-6 py-4 transition hover:bg-[#fbfaf6]`}
            >
              <div className="min-w-0 pr-3">
                <p
                  className="truncate text-sm font-semibold text-neutral-950"
                  title={attributeName}
                >
                  {attributeName}
                </p>

                {attributeSlug ? (
                  <p
                    className="mt-1 truncate text-xs text-neutral-500"
                    title={`/${attributeSlug}`}
                  >
                    /{attributeSlug}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 pr-3">
                <code
                  title={attributeCode}
                  className="inline-flex max-w-full truncate rounded-lg bg-neutral-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-neutral-700"
                >
                  {attributeCode}
                </code>
              </div>

              <div className="min-w-0 pr-3">
                <Badge
                  variant="outline"
                  className="max-w-full truncate rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-700"
                  title={getTypeLabel(attribute)}
                >
                  {getTypeLabel(attribute)}
                </Badge>
              </div>

              <div className="min-w-0 pr-3">
                <p className="mb-2 text-xs font-semibold text-neutral-950">
                  {getOptionsCount(attribute)} options
                </p>

                {visibleOptions.length ? (
                  <div className="flex max-w-full flex-wrap gap-1.5">
                    {visibleOptions.map((option) => {
                      const optionLabel = getOptionLabel(option);

                      return (
                        <OptionPill
                          key={option.id ?? `${option.value}-${option.label}`}
                          label={optionLabel}
                        />
                      );
                    })}

                    {hiddenOptionsCount ? (
                      <OptionPill label={`+${hiddenOptionsCount}`} />
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </div>

              <div className="min-w-0 pr-3">
                <div className="flex max-w-full flex-wrap gap-1.5">
                  {visibleFlags.length ? (
                    visibleFlags.map((flag) => (
                      <UsagePill key={`${attribute.id}-${flag}`} label={flag} />
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}

                  {hiddenFlagsCount ? (
                    <UsagePill label={`+${hiddenFlagsCount}`} />
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 pr-3">
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusBadgeClass(
                    status,
                  )}`}
                >
                  {status}
                </Badge>
              </div>

              <div className="min-w-0 pr-3">
                <div
                  className="max-w-full text-xs leading-5 text-neutral-500"
                  title={attribute.updatedAt || ""}
                >
                  <p className="truncate font-medium text-neutral-700">
                    {formatUpdatedAt(attribute.updatedAt)}
                  </p>
                  <p className="truncate text-neutral-400">
                    {formatUpdatedTime(attribute.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 justify-end gap-1.5">
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 rounded-full border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-950 hover:text-white"
                  title="Edit attribute"
                >
                  <Link href={`/admin/catalog/attributes/${attribute.id}/edit`}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 rounded-full border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-950 hover:text-white"
                  title="Manage options"
                >
                  <Link
                    href={`/admin/catalog/attributes/${attribute.id}/edit#options`}
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                  </Link>
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 rounded-full border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700"
                  disabled={isActionLoading || status === "ARCHIVED"}
                  onClick={() => onArchive?.(attribute)}
                  title="Archive attribute"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
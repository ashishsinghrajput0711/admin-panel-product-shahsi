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
  if (attribute.isBulkUploadField) flags.push("Bulk Upload");

  return flags;
}

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
      <div className="p-8 text-sm text-neutral-500">Loading attributes...</div>
    );
  }

  if (!attributes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No attributes found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend se current page par attributes nahi mile. Global Library se
          default attributes seed kar sakte ho.
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
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Attribute</th>
            <th className="p-4 font-medium">Code</th>
            <th className="p-4 font-medium">Type</th>
            <th className="p-4 font-medium">Options</th>
            <th className="p-4 font-medium">Usage</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Updated</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {attributes.map((attribute) => {
            const status = normalizeStatus(attribute);
            const flags = getUsageFlags(attribute);
            const options = attribute.options ?? [];

            return (
              <tr key={attribute.id} className="border-t border-neutral-200">
                <td className="p-4 align-top">
                  <p className="font-medium text-neutral-950">
                    {getAttributeName(attribute)}
                  </p>

                  {getAttributeSlug(attribute) ? (
                    <p className="text-xs text-neutral-500">
                      /{getAttributeSlug(attribute)}
                    </p>
                  ) : null}

                  {attribute.description ? (
                    <p className="mt-1 max-w-sm text-xs text-neutral-500">
                      {attribute.description}
                    </p>
                  ) : null}
                </td>

                <td className="p-4 align-top">
                  <code className="rounded-md bg-neutral-100 px-2 py-1 text-xs">
                    {getAttributeCode(attribute)}
                  </code>
                </td>

                <td className="p-4 align-top">
                  <Badge variant="outline" className="rounded-full">
                    {getTypeLabel(attribute)}
                  </Badge>
                </td>

                <td className="p-4 align-top">
                  <p className="font-medium text-neutral-950">
                    {getOptionsCount(attribute)} options
                  </p>

                  {options.length ? (
                    <div className="mt-2 flex max-w-[260px] flex-wrap gap-1">
                      {options.slice(0, 4).map((option) => (
                        <Badge
                          key={option.id ?? `${option.value}-${option.label}`}
                          variant="outline"
                          className="rounded-full text-[11px]"
                        >
                          {getOptionLabel(option)}
                        </Badge>
                      ))}

                      {options.length > 4 ? (
                        <Badge variant="outline" className="rounded-full text-[11px]">
                          +{options.length - 4}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}
                </td>

                <td className="p-4 align-top">
                  <div className="flex max-w-[360px] flex-wrap gap-1">
                    {flags.length ? (
                      flags.map((flag) => (
                        <Badge
                          key={`${attribute.id}-${flag}`}
                          variant="outline"
                          className="rounded-full"
                        >
                          {flag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </div>
                </td>

                <td className="p-4 align-top">
                  <Badge
                    variant="outline"
                    className={`rounded-full ${getStatusBadgeClass(status)}`}
                  >
                    {status}
                  </Badge>
                </td>

                <td className="p-4 align-top text-xs text-neutral-500">
                  {attribute.updatedAt
                    ? new Date(attribute.updatedAt).toLocaleString()
                    : "—"}
                </td>

                <td className="p-4 align-top text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <Link href={`/admin/catalog/attributes/${attribute.id}/edit`}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <Link href={`/admin/catalog/attributes/${attribute.id}/edit#options`}>
                        <ListPlus className="mr-2 h-4 w-4" />
                        Options
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={isActionLoading || status === "ARCHIVED"}
                      onClick={() => onArchive?.(attribute)}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
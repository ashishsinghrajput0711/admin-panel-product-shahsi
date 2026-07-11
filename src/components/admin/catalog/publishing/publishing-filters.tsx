"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  CatalogBusinessType,
  CatalogLifecycleStatus,
  CatalogPublicationStatus,
  PublishingListFilters,
} from "./publishing-types";

type PublishingFiltersProps = {
  value: PublishingListFilters;
  disabled?: boolean;
  onChange: (value: PublishingListFilters) => void;
  onClear: () => void;
};

const lifecycleStatuses: Array<{
  value: CatalogLifecycleStatus;
  label: string;
}> = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
];

const publicationStatuses: Array<{
  value: CatalogPublicationStatus;
  label: string;
}> = [
  { value: "PUBLISHED", label: "Published" },
  { value: "UNPUBLISHED", label: "Unpublished" },
  { value: "PUBLISH_BLOCKED", label: "Publish Blocked" },
];

const businessTypes: Array<{
  value: CatalogBusinessType;
  label: string;
}> = [
  { value: "SHAHSI", label: "Shahsi" },
  { value: "GOWNLOOP", label: "Gownloop" },
];

export function PublishingFilters({
  value,
  disabled = false,
  onChange,
  onClear,
}: PublishingFiltersProps) {
  function updateFilter<K extends keyof PublishingListFilters>(
    key: K,
    nextValue: PublishingListFilters[K],
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-medium text-neutral-950">
            Filters
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Search products and filter lifecycle, publication and catalog
            fields.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onClear}
          className="self-start rounded-full text-neutral-500 lg:self-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

          <input
            value={value.search}
            disabled={disabled}
            placeholder="Search product name, SKU or slug..."
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
            className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf6] pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
          />
        </div>

        <select
          value={value.status}
          disabled={disabled}
          onChange={(event) =>
            updateFilter(
              "status",
              event.target.value as CatalogLifecycleStatus | "",
            )
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        >
          <option value="">All lifecycle statuses</option>

          {lifecycleStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={value.publicationStatus}
          disabled={disabled}
          onChange={(event) =>
            updateFilter(
              "publicationStatus",
              event.target.value as CatalogPublicationStatus | "",
            )
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        >
          <option value="">All publication statuses</option>

          {publicationStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={value.businessType}
          disabled={disabled}
          onChange={(event) =>
            updateFilter(
              "businessType",
              event.target.value as CatalogBusinessType | "",
            )
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        >
          <option value="">All businesses</option>

          {businessTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={value.productType}
          disabled={disabled}
          placeholder="Product type..."
          onChange={(event) =>
            updateFilter("productType", event.target.value)
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        />

        <input
          value={value.brand}
          disabled={disabled}
          placeholder="Brand..."
          onChange={(event) => updateFilter("brand", event.target.value)}
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        />

        <input
          value={value.categoryId}
          disabled={disabled}
          placeholder="Category ID..."
          onChange={(event) =>
            updateFilter("categoryId", event.target.value)
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:opacity-60"
        />
      </div>
    </Card>
  );
}
"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AttributeFiltersState } from "./attribute-types";

const statusOptions = [
  { label: "All status", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const typeOptions = [
  { label: "All types", value: "ALL" },
  { label: "Text", value: "TEXT" },
  { label: "Number", value: "NUMBER" },
  { label: "Boolean", value: "BOOLEAN" },
  { label: "Select / Dropdown", value: "SELECT" },
  { label: "Multi Select", value: "MULTI_SELECT" },
  { label: "Color / Swatch", value: "COLOR" },
  { label: "Size", value: "SIZE" },
] as const;

const flagOptions = [
  { label: "All flags", value: "ALL" },
  { label: "Required", value: "REQUIRED" },
  { label: "Filterable", value: "FILTERABLE" },
  { label: "Searchable", value: "SEARCHABLE" },
  { label: "Variant", value: "VARIANT" },
  { label: "SEO", value: "SEO" },
  { label: "Fit Engine", value: "FIT" },
  { label: "Style Engine", value: "STYLE" },
  { label: "Bulk Upload", value: "BULK_UPLOAD" },
] as const;

export function AttributeFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: AttributeFiltersState;
  onChange: (filters: AttributeFiltersState) => void;
  onClear: () => void;
}) {
  return (
    <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-neutral-950">Filters</h2>
          <p className="mt-1 text-xs text-neutral-500">
           Backend attributes ko search, status, type aur usage flags ke basis par filter karo.
          </p>
        </div>

        <button
          type="button"
          className="w-fit text-sm underline underline-offset-4 hover:text-neutral-950"
          onClick={onClear}
        >
          Clear
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            Search
          </span>
          <Input
            value={filters.search}
            onChange={(event) =>
              onChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Search name, code, slug..."
          />
        </label>

        <FilterSelect
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(value) =>
            onChange({
              ...filters,
              status: value as AttributeFiltersState["status"],
            })
          }
        />

        <FilterSelect
          label="Type"
          value={filters.type}
          options={typeOptions}
          onChange={(value) =>
            onChange({
              ...filters,
              type: value,
            })
          }
        />

        <FilterSelect
          label="Flag"
          value={filters.flag}
          options={flagOptions}
          onChange={(value) =>
            onChange({
              ...filters,
              flag: value as AttributeFiltersState["flag"],
            })
          }
        />
      </div>

      <div className="mt-4 rounded-2xl bg-[#fbfaf6] p-3 text-xs text-neutral-500">
       Filters backend request ke saath apply hote hain. Result pagination ke according update hota hai.
      </div>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
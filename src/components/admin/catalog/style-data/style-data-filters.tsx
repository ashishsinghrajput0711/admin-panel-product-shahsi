"use client";

import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CatalogStyleDataOptions } from "./style-data-types";
import type { CatalogStyleDataListParams } from "@/lib/admin/catalog-style-data-api";

export function StyleDataFilters({
  options,
  filters,
  isLoading,
  onChange,
  onClear,
}: {
  options: CatalogStyleDataOptions;
  filters: CatalogStyleDataListParams;
  isLoading: boolean;
  onChange: (key: keyof CatalogStyleDataListParams, value: string) => void;
  onClear: () => void;
}) {
  return (
    <Card className="h-fit rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-medium">Filters</h2>

        <button
          type="button"
          onClick={onClear}
          className="text-sm underline underline-offset-4 hover:text-neutral-950"
        >
          Clear
        </button>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-800">
            Search
          </span>

          <div className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3">
            <Search className="mr-2 h-4 w-4 text-neutral-400" />
            <Input
              value={filters.search || ""}
              onChange={(event) => onChange("search", event.target.value)}
              placeholder="Product, SKU, tag..."
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </label>

        <SelectFilter
          label="Status"
          value={filters.status || ""}
          values={options.status}
          loading={isLoading}
          onChange={(value) => onChange("status", value)}
        />

        <SelectFilter
          label="Scope"
          value={filters.scope || ""}
          values={options.scope}
          loading={isLoading}
          onChange={(value) => onChange("scope", value)}
        />

        <SelectFilter
          label="Business Type"
          value={filters.businessType || ""}
          values={options.businessType}
          loading={isLoading}
          onChange={(value) => onChange("businessType", value)}
        />

        <SelectFilter
          label="Occasion"
          value={filters.occasion || ""}
          values={options.occasion}
          loading={isLoading}
          onChange={(value) => onChange("occasion", value)}
        />

        <SelectFilter
          label="Color Family"
          value={filters.colorFamily || ""}
          values={options.colorFamily}
          loading={isLoading}
          onChange={(value) => onChange("colorFamily", value)}
        />

        <SelectFilter
          label="Fabric Feel"
          value={filters.fabricFeel || ""}
          values={options.fabricFeel}
          loading={isLoading}
          onChange={(value) => onChange("fabricFeel", value)}
        />

        <SelectFilter
          label="Neckline"
          value={filters.neckline || ""}
          values={options.neckline}
          loading={isLoading}
          onChange={(value) => onChange("neckline", value)}
        />

        <SelectFilter
          label="Sleeve Type"
          value={filters.sleeveType || ""}
          values={options.sleeveType}
          loading={isLoading}
          onChange={(value) => onChange("sleeveType", value)}
        />

        <SelectFilter
          label="Silhouette"
          value={filters.silhouette || ""}
          values={options.silhouette}
          loading={isLoading}
          onChange={(value) => onChange("silhouette", value)}
        />

        <SelectFilter
          label="Modesty Level"
          value={filters.modestyLevel || ""}
          values={options.modestyLevel}
          loading={isLoading}
          onChange={(value) => onChange("modestyLevel", value)}
        />

        <SelectFilter
          label="Season"
          value={filters.season || ""}
          values={options.season}
          loading={isLoading}
          onChange={(value) => onChange("season", value)}
        />
      </div>
    </Card>
  );
}

function SelectFilter({
  label,
  value,
  values,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading}
        className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10 disabled:bg-neutral-100"
      >
        <option value="">{loading ? "Loading..." : "All"}</option>

        {values.map((item) => (
          <option key={item} value={item}>
            {formatLabel(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
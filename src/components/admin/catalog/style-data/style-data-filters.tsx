"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CatalogStyleDataOptions } from "./style-data-types";
import type { CatalogStyleDataListParams } from "@/lib/admin/catalog-style-data-api";

type FilterPanel = "status" | "scope" | "business" | "style" | null;

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
  const [openPanel, setOpenPanel] = useState<FilterPanel>(null);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "page" || key === "limit") return false;
      return Boolean(String(value || "").trim());
    }).length;
  }, [filters]);

  function togglePanel(panel: FilterPanel) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-neutral-200 bg-white p-0">
      <div className="p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-2xl font-medium text-neutral-950">Filters</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Filter style data by status, scope, business and styling rules.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={!activeFilterCount}
            className="w-fit rounded-full text-neutral-500"
          >
            <X className="mr-2 h-4 w-4" />
            Clear all
            {activeFilterCount ? (
              <span className="ml-2 rounded-full bg-neutral-950 px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-neutral-300 bg-[#fbfaf6] px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-neutral-400" />
            <Input
              value={filters.search || ""}
              onChange={(event) => onChange("search", event.target.value)}
              placeholder="Search product, SKU, tag, keyword..."
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />

            {filters.search ? (
              <button
                type="button"
                onClick={() => onChange("search", "")}
                className="ml-2 rounded-full p-1 text-neutral-400 hover:bg-white hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <FilterPill
              label="Status"
              value={filters.status}
              isOpen={openPanel === "status"}
              isActive={Boolean(filters.status)}
              onClick={() => togglePanel("status")}
            />

            <FilterPill
              label="Scope"
              value={filters.scope}
              isOpen={openPanel === "scope"}
              isActive={Boolean(filters.scope)}
              onClick={() => togglePanel("scope")}
            />

            <FilterPill
              label="Business"
              value={filters.businessType}
              isOpen={openPanel === "business"}
              isActive={Boolean(filters.businessType)}
              onClick={() => togglePanel("business")}
            />

            <FilterPill
              label="Style"
              value={getStyleSummary(filters)}
              isOpen={openPanel === "style"}
              isActive={hasStyleFilters(filters)}
              onClick={() => togglePanel("style")}
            />
          </div>
        </div>

        {activeFilterCount ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <ActivePill
              label="Search"
              value={filters.search}
              onRemove={() => onChange("search", "")}
            />
            <ActivePill
              label="Status"
              value={filters.status}
              onRemove={() => onChange("status", "")}
            />
            <ActivePill
              label="Scope"
              value={filters.scope}
              onRemove={() => onChange("scope", "")}
            />
            <ActivePill
              label="Business"
              value={filters.businessType}
              onRemove={() => onChange("businessType", "")}
            />
            <ActivePill
              label="Occasion"
              value={filters.occasion}
              onRemove={() => onChange("occasion", "")}
            />
            <ActivePill
              label="Color"
              value={filters.colorFamily}
              onRemove={() => onChange("colorFamily", "")}
            />
            <ActivePill
              label="Fabric"
              value={filters.fabricFeel}
              onRemove={() => onChange("fabricFeel", "")}
            />
            <ActivePill
              label="Neckline"
              value={filters.neckline}
              onRemove={() => onChange("neckline", "")}
            />
            <ActivePill
              label="Sleeve"
              value={filters.sleeveType}
              onRemove={() => onChange("sleeveType", "")}
            />
            <ActivePill
              label="Silhouette"
              value={filters.silhouette}
              onRemove={() => onChange("silhouette", "")}
            />
            <ActivePill
              label="Modesty"
              value={filters.modestyLevel}
              onRemove={() => onChange("modestyLevel", "")}
            />
            <ActivePill
              label="Season"
              value={filters.season}
              onRemove={() => onChange("season", "")}
            />
          </div>
        ) : null}
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          openPanel ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-neutral-200 bg-[#fbfaf6] p-5 transition-all duration-300 ease-out ${
              openPanel
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            {openPanel === "status" ? (
              <ChoicePanel
                title="Status"
                description="Record status ke basis par filter karo."
                value={filters.status || ""}
                values={options.status}
                loading={isLoading}
                onSelect={(value) => onChange("status", value)}
              />
            ) : null}

            {openPanel === "scope" ? (
              <ChoicePanel
                title="Scope"
                description="Product ya variant level style data filter karo."
                value={filters.scope || ""}
                values={options.scope}
                loading={isLoading}
                onSelect={(value) => onChange("scope", value)}
              />
            ) : null}

            {openPanel === "business" ? (
              <ChoicePanel
                title="Business"
                description="Shahsi ya Gownloop style data records filter karo."
                value={filters.businessType || ""}
                values={options.businessType}
                loading={isLoading}
                onSelect={(value) => onChange("businessType", value)}
              />
            ) : null}

            {openPanel === "style" ? (
              <StylePanel
                options={options}
                filters={filters}
                loading={isLoading}
                onChange={onChange}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function FilterPill({
  label,
  value,
  isOpen,
  isActive,
  onClick,
}: {
  label: string;
  value?: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm transition-all duration-200 ${
        isOpen || isActive
          ? "border-[#c7a96b] bg-[#fbf6ea] text-neutral-950 shadow-sm"
          : "border-neutral-200 bg-[#fbfaf6] text-neutral-800 hover:border-neutral-300 hover:bg-white"
      }`}
    >
      <span>{label}</span>

      {value ? (
        <span className="max-w-[140px] truncate text-xs text-neutral-500">
          {formatLabel(value)}
        </span>
      ) : null}

      <ChevronDown
        className={`h-4 w-4 transition-transform duration-300 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function ChoicePanel({
  title,
  description,
  value,
  values,
  loading,
  onSelect,
}: {
  title: string;
  description: string;
  value: string;
  values: string[];
  loading: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => onSelect("")}
          disabled={!value}
          className="w-fit rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:border-neutral-300 disabled:opacity-40"
        >
          Clear {title}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <OptionButton
          label="All"
          active={!value}
          disabled={loading}
          onClick={() => onSelect("")}
        />

        {values.map((item) => (
          <OptionButton
            key={item}
            label={formatLabel(item)}
            active={value === item}
            disabled={loading}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

function StylePanel({
  options,
  filters,
  loading,
  onChange,
}: {
  options: CatalogStyleDataOptions;
  filters: CatalogStyleDataListParams;
  loading: boolean;
  onChange: (key: keyof CatalogStyleDataListParams, value: string) => void;
}) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-950">
          Style filters
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Occasion, color, fabric, neckline aur season ke basis par records
          filter karo.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MiniChoiceGroup
          label="Occasion"
          value={filters.occasion || ""}
          values={options.occasion}
          loading={loading}
          onSelect={(value) => onChange("occasion", value)}
        />

        <MiniChoiceGroup
          label="Color Family"
          value={filters.colorFamily || ""}
          values={options.colorFamily}
          loading={loading}
          onSelect={(value) => onChange("colorFamily", value)}
        />

        <MiniChoiceGroup
          label="Fabric Feel"
          value={filters.fabricFeel || ""}
          values={options.fabricFeel}
          loading={loading}
          onSelect={(value) => onChange("fabricFeel", value)}
        />

        <MiniChoiceGroup
          label="Neckline"
          value={filters.neckline || ""}
          values={options.neckline}
          loading={loading}
          onSelect={(value) => onChange("neckline", value)}
        />

        <MiniChoiceGroup
          label="Sleeve Type"
          value={filters.sleeveType || ""}
          values={options.sleeveType}
          loading={loading}
          onSelect={(value) => onChange("sleeveType", value)}
        />

        <MiniChoiceGroup
          label="Silhouette"
          value={filters.silhouette || ""}
          values={options.silhouette}
          loading={loading}
          onSelect={(value) => onChange("silhouette", value)}
        />

        <MiniChoiceGroup
          label="Modesty Level"
          value={filters.modestyLevel || ""}
          values={options.modestyLevel}
          loading={loading}
          onSelect={(value) => onChange("modestyLevel", value)}
        />

        <MiniChoiceGroup
          label="Season"
          value={filters.season || ""}
          values={options.season}
          loading={loading}
          onSelect={(value) => onChange("season", value)}
        />
      </div>
    </div>
  );
}

function MiniChoiceGroup({
  label,
  value,
  values,
  loading,
  onSelect,
}: {
  label: string;
  value: string;
  values: string[];
  loading: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-950">{label}</p>

        {value ? (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-700"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <OptionButton
          label="All"
          active={!value}
          disabled={loading}
          onClick={() => onSelect("")}
          small
        />

        {values.map((item) => (
          <OptionButton
            key={item}
            label={formatLabel(item)}
            active={value === item}
            disabled={loading}
            onClick={() => onSelect(item)}
            small
          />
        ))}
      </div>
    </div>
  );
}

function OptionButton({
  label,
  active,
  disabled,
  onClick,
  small = false,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border transition-all duration-200 ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function ActivePill({
  label,
  value,
  onRemove,
}: {
  label: string;
  value?: string;
  onRemove: () => void;
}) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1.5 text-xs text-neutral-700 transition hover:border-red-200 hover:text-red-600"
    >
      <span className="text-neutral-400">{label}:</span>
      <span className="font-medium">{formatLabel(value)}</span>
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function hasStyleFilters(filters: CatalogStyleDataListParams) {
  return Boolean(
    filters.occasion ||
      filters.colorFamily ||
      filters.fabricFeel ||
      filters.neckline ||
      filters.sleeveType ||
      filters.silhouette ||
      filters.modestyLevel ||
      filters.season,
  );
}

function getStyleSummary(filters: CatalogStyleDataListParams) {
  const values = [
    filters.occasion,
    filters.colorFamily,
    filters.fabricFeel,
    filters.neckline,
    filters.sleeveType,
    filters.silhouette,
    filters.modestyLevel,
    filters.season,
  ].filter(Boolean);

  if (!values.length) return "";

  if (values.length === 1) return String(values[0]);

  return `${values.length} selected`;
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
"use client";

import { ChevronDown, X } from "lucide-react";

export type CommerceModelFilterState = {
  statuses: string[];
  types: string[];
  configs: string[];
};

type FilterGroup = {
  title: string;
  key: keyof CommerceModelFilterState;
  items: {
    label: string;
    value: string;
  }[];
};

const groups: FilterGroup[] = [
  {
    title: "Status",
    key: "statuses",
    items: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    title: "Type",
    key: "types",
    items: [
      { label: "Shop", value: "SHOP" },
      { label: "Rental", value: "RENTAL" },
      { label: "Resale", value: "RESALE" },
      { label: "MTO", value: "MTO" },
      { label: "Subscription", value: "SUBSCRIPTION" },
    ],
  },
  {
    title: "Config",
    key: "configs",
    items: [
      { label: "Allow COD", value: "allowCOD" },
      { label: "Allow Returns", value: "allowReturns" },
      { label: "Requires Deposit", value: "requiresDeposit" },
      { label: "Daily Rental", value: "allowDailyRental" },
      { label: "Subscription Rental", value: "allowSubscriptionRental" },
      { label: "Rush Production", value: "allowRushProduction" },
    ],
  },
];

export const emptyCommerceModelFilters: CommerceModelFilterState = {
  statuses: [],
  types: [],
  configs: [],
};

function getSelectedCount(value: CommerceModelFilterState) {
  return value.statuses.length + value.types.length + value.configs.length;
}

function getSelectedLabels(
  value: CommerceModelFilterState,
  group: FilterGroup,
) {
  return group.items
    .filter((item) => value[group.key].includes(item.value))
    .map((item) => item.label);
}

export function CommerceModelFilters({
  value,
  onChange,
  onClear,
}: {
  value: CommerceModelFilterState;
  onChange: (value: CommerceModelFilterState) => void;
  onClear: () => void;
}) {
  function toggleFilter(
    key: keyof CommerceModelFilterState,
    filterValue: string,
  ) {
    const currentValues = value[key];

    const nextValues = currentValues.includes(filterValue)
      ? currentValues.filter((item) => item !== filterValue)
      : [...currentValues, filterValue];

    onChange({
      ...value,
      [key]: nextValues,
    });
  }

  function clearGroup(key: keyof CommerceModelFilterState) {
    onChange({
      ...value,
      [key]: [],
    });
  }

  const selectedCount = getSelectedCount(value);

  return (
    <aside className="rounded-[1.5rem] border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium text-neutral-950">Filters</h2>

            {selectedCount ? (
              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                {selectedCount} selected
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Filter commerce types by status, type and config rules.
          </p>
        </div>

        <button
          type="button"
          disabled={!selectedCount}
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Clear all
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {groups.map((group) => {
          const selectedLabels = getSelectedLabels(value, group);
          const hasSelected = selectedLabels.length > 0;

          return (
            <details key={group.key} className="group relative">
              <summary
                className={`flex cursor-pointer list-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              hasSelected
  ? "border-[#b88a44] bg-[#fff4df] text-[#6f4a16] shadow-sm"
  : "border-neutral-200 bg-[#fbfaf6] text-neutral-800 hover:border-[#d4b47a] hover:bg-[#fff9ed]"
                }`}
              >
                <span>{group.title}</span>

                {hasSelected ? (
                 <span className="rounded-full bg-[#b88a44] px-2 py-0.5 text-xs text-white">
                    {selectedLabels.length}
                  </span>
                ) : null}

                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>

              <div className="absolute left-0 z-30 mt-2 w-80 origin-top rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 transition duration-200 group-open:animate-in group-open:fade-in group-open:zoom-in-95">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-950">
                      {group.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {hasSelected
                        ? `${selectedLabels.length} selected`
                        : "No filter selected"}
                    </p>
                  </div>

                  {hasSelected ? (
                    <button
                      type="button"
                      onClick={() => clearGroup(group.key)}
                      className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-950"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="max-h-72 space-y-1 overflow-auto">
                  {group.items.map((item) => {
                    const checked = value[group.key].includes(item.value);

                    return (
                      <label
                        key={item.value}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition ${
                     checked
  ? "bg-[#fff4df] text-[#6f4a16] ring-1 ring-[#e0c18a]"
  : "text-neutral-700 hover:bg-[#fbfaf6]"
                        }`}
                      >
                        <span>{item.label}</span>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFilter(group.key, item.value)}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {selectedCount ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          {groups.flatMap((group) =>
            getSelectedLabels(value, group).map((label) => (
              <button
                key={`${group.key}-${label}`}
                type="button"
                onClick={() => {
                  const item = group.items.find((entry) => entry.label === label);
                  if (item) toggleFilter(group.key, item.value);
                }}
              className="inline-flex items-center gap-1 rounded-full border border-[#e0c18a] bg-[#fff4df] px-3 py-1.5 text-xs font-medium text-[#6f4a16] hover:border-[#b88a44]"
              >
                {label}
                <X className="h-3 w-3" />
              </button>
            )),
          )}
        </div>
      ) : null}
    </aside>
  );
}
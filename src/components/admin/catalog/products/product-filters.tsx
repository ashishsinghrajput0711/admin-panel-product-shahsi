"use client";

import { Checkbox } from "@/components/ui/checkbox";

const filterGroups = {
  Business: ["Shahsi", "Gownloop"],
  Status: ["Draft", "Active", "Inactive", "Archived"],
  "Product Type": [
    "Dress",
    "Accessory",
    "Swatch",
    "Editorial Product",
    "Rental Listing",
    "Resale Listing",
  ],
  "Commerce Type": ["Retail", "Made-to-Order", "Rental", "Resale"],
  Category: ["Bridesmaid Dresses", "MTO Dresses", "Rental Dresses", "Resale"],
};

export function ProductFilters() {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-neutral-950">Filters</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Product list ko business, status, type aur category ke according filter karo.
          </p>
        </div>

        <button
          type="button"
          className="text-sm underline underline-offset-4 hover:text-neutral-950"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(filterGroups).map(([title, values]) => (
          <div key={title} className="rounded-2xl border border-neutral-100 bg-[#fbfaf6] p-4">
            <p className="mb-3 text-sm font-medium text-neutral-950">{title}</p>

            <div className="space-y-3">
              {values.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700"
                >
                  <Checkbox />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
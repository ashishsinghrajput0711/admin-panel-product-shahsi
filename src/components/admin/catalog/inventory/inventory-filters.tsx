"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const groups = {
  Status: [
    "In Stock",
    "Low Stock",
    "Out of Stock",
    "On Hold",
    "Damaged",
    "Archived",
  ],
  Scope: ["Product", "Variant"],
  Business: ["Shahsi", "Gownloop"],
  Stock: ["Available", "Reserved", "Low Stock", "Damaged", "On Hold"],
  Warehouse: ["Main Warehouse", "Rental Warehouse", "Returns Warehouse"],
};

export function InventoryFilters() {
  return (
    <Card className="h-fit rounded-[1.5rem] border-neutral-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-medium">Filters</h2>

        <button
          type="button"
          className="text-sm underline underline-offset-4 hover:text-neutral-950"
        >
          Clear
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([title, values]) => (
          <div key={title} className="border-t border-neutral-200 pt-4">
            <p className="mb-3 font-medium">{title}</p>

            <div className="space-y-3">
              {values.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700"
                >
                  <Checkbox />
                  {value}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
// "use client";

// import Link from "next/link";
// import { useList } from "@refinedev/core";
// import { Archive, Boxes, Plus, Upload } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { InventoryFilters } from "@/components/admin/catalog/inventory/inventory-filters";
// import { InventoryTable } from "@/components/admin/catalog/inventory/inventory-table";
// import type { InventoryItem } from "@/components/admin/catalog/inventory/inventory-types";

// export default function InventoryPage() {
//   const listResult = useList<InventoryItem>({
//     resource: "inventory",
//   });

//   const data = listResult.result;
//   const isLoading = listResult.query?.isLoading ?? false;
//   const isError = listResult.query?.isError ?? false;
//   const error = listResult.query?.error;

//   const inventoryItems = data?.data ?? [];

//   return (
//     <main className="min-h-screen bg-[#fbfaf6] p-6">
//       <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
//         <p className="text-xs uppercase tracking-[0.22em] text-white/60">
//           Admin / Catalog / Inventory
//         </p>

//         <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
//           <div>
//             <h1 className="text-5xl font-medium tracking-tight">
//               Inventory Management
//             </h1>

//             <p className="mt-4 max-w-3xl text-white/70">
//               Manage product and variant stock, warehouse locations, reserved
//               stock, available stock, low stock alerts, rental availability and
//               restock planning.
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-3">
//             <Button type="button" variant="secondary" className="rounded-full">
//               <Upload className="mr-2 h-4 w-4" />
//               Bulk Upload
//             </Button>

//             <Button type="button" variant="secondary" className="rounded-full">
//               <Boxes className="mr-2 h-4 w-4" />
//               Stock Adjust
//             </Button>

//             <Button type="button" variant="secondary" className="rounded-full">
//               <Archive className="mr-2 h-4 w-4" />
//               Archive
//             </Button>

//             <Button
//               asChild
//               className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
//             >
//               <Link href="/admin/catalog/inventory/new">
//                 <Plus className="mr-2 h-4 w-4" />
//                 Create Inventory
//               </Link>
//             </Button>
//           </div>
//         </div>
//       </section>

//       {isError ? (
//         <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//           Inventory API connect nahi ho paayi. Backend ready hone ke baad
//           endpoint check karna:{" "}
//           <span className="font-semibold">
//             GET /api/proxy/admin/catalog/inventory
//           </span>
//           {error instanceof Error && error.message ? (
//             <p className="mt-1 text-xs">{error.message}</p>
//           ) : null}
//         </div>
//       ) : null}

//       <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
//         <InventoryFilters />

//         <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
//           <InventoryTable
//             inventoryItems={inventoryItems}
//             isLoading={isLoading}
//           />
//         </Card>
//       </section>
//     </main>
//   );
// }





"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InventoryStatus = "In stock" | "Low stock" | "Out of stock" | "Unavailable";

type InventoryItem = {
  id: string;
  productTitle: string;
  variantTitle?: string;
  sku?: string;
  location: string;
  available: number;
  committed: number;
  unavailable: number;
  onHand: number;
  status: InventoryStatus;
  imageUrl?: string;
};

const inventoryItems: InventoryItem[] = [];

function getStatusBadge(status: InventoryStatus) {
  if (status === "In stock") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">In stock</Badge>;
  }

  if (status === "Low stock") {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low stock</Badge>;
  }

  if (status === "Out of stock") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out of stock</Badge>;
  }

  return <Badge variant="secondary">Unavailable</Badge>;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return inventoryItems;

    return inventoryItems.filter((item) => {
      return (
        item.productTitle.toLowerCase().includes(query) ||
        item.variantTitle?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const totalProducts = inventoryItems.length;
  const totalAvailable = inventoryItems.reduce((sum, item) => sum + item.available, 0);
  const lowStockCount = inventoryItems.filter((item) => item.status === "Low stock").length;
  const outOfStockCount = inventoryItems.filter((item) => item.status === "Out of stock").length;

  return (
    <div className="min-h-screen bg-[#f6f6f7] px-6 py-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#202223]">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-[#6d7175]">
              Track stock levels, update quantities, and manage product availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-9 gap-2 bg-white">
              <Upload className="h-4 w-4" />
              Import
            </Button>

            <Button variant="outline" className="h-9 gap-2 bg-white">
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Button className="h-9 gap-2 bg-[#303030] text-white hover:bg-[#1f1f1f]">
              <Plus className="h-4 w-4" />
              Adjust inventory
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-[#dcdfe4] bg-white p-4 shadow-sm">
            <p className="text-sm text-[#6d7175]">Total products</p>
            <p className="mt-2 text-2xl font-semibold text-[#202223]">
              {totalProducts}
            </p>
          </Card>

          <Card className="border-[#dcdfe4] bg-white p-4 shadow-sm">
            <p className="text-sm text-[#6d7175]">Available stock</p>
            <p className="mt-2 text-2xl font-semibold text-[#202223]">
              {totalAvailable}
            </p>
          </Card>

          <Card className="border-[#dcdfe4] bg-white p-4 shadow-sm">
            <p className="text-sm text-[#6d7175]">Low stock</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-[#202223]">
              {lowStockCount}
              {lowStockCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : null}
            </p>
          </Card>

          <Card className="border-[#dcdfe4] bg-white p-4 shadow-sm">
            <p className="text-sm text-[#6d7175]">Out of stock</p>
            <p className="mt-2 text-2xl font-semibold text-[#202223]">
              {outOfStockCount}
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden border-[#dcdfe4] bg-white shadow-sm">
          <div className="border-b border-[#dcdfe4] px-4 pt-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-9 rounded-none border-b-2 border-[#202223] px-3 text-sm font-medium text-[#202223]"
                >
                  All
                </Button>

                <Button
                  variant="ghost"
                  className="h-9 px-3 text-sm font-medium text-[#6d7175]"
                >
                  Low stock
                </Button>

                <Button
                  variant="ghost"
                  className="h-9 px-3 text-sm font-medium text-[#6d7175]"
                >
                  Out of stock
                </Button>

                <Button
                  variant="ghost"
                  className="h-9 px-3 text-sm font-medium text-[#6d7175]"
                >
                  Unavailable
                </Button>
              </div>

              <Button variant="ghost" className="h-9 gap-2 text-sm">
                Save view
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d7175]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory"
                  className="h-9 border-[#babfc3] pl-9 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="h-9 gap-2 bg-white">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>

                <Button variant="outline" className="h-9 gap-2 bg-white">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </Button>

                <Button variant="outline" className="h-9 gap-2 bg-white">
                  <SlidersHorizontal className="h-4 w-4" />
                  Columns
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#dcdfe4] bg-[#f9fafb] text-left text-xs font-medium uppercase tracking-wide text-[#6d7175]">
                  <th className="w-[44px] px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#babfc3]" />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Committed</th>
                  <th className="px-4 py-3 text-right">Unavailable</th>
                  <th className="px-4 py-3 text-right">On hand</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-[56px] px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#edf0f2] transition hover:bg-[#f6f6f7]"
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" className="h-4 w-4 rounded border-[#babfc3]" />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-[#dcdfe4] bg-[#f6f6f7]">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt={item.productTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-[#8c9196]">No img</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#202223]">
                              {item.productTitle}
                            </p>
                            {item.variantTitle ? (
                              <p className="truncate text-xs text-[#6d7175]">
                                {item.variantTitle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[#202223]">
                        {item.sku || "—"}
                      </td>

                      <td className="px-4 py-3 text-[#202223]">
                        {item.location}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Input
                          defaultValue={item.available}
                          className="ml-auto h-8 w-24 text-right"
                        />
                      </td>

                      <td className="px-4 py-3 text-right text-[#202223]">
                        {item.committed}
                      </td>

                      <td className="px-4 py-3 text-right text-[#202223]">
                        {item.unavailable}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-[#202223]">
                        {item.onHand}
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View product</DropdownMenuItem>
                            <DropdownMenuItem>Adjust quantity</DropdownMenuItem>
                            <DropdownMenuItem>Transfer stock</DropdownMenuItem>
                            <DropdownMenuItem>View history</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f3]">
                          <Search className="h-5 w-5 text-[#6d7175]" />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-[#202223]">
                          No inventory found
                        </h3>

                        <p className="mt-1 text-sm text-[#6d7175]">
                          Inventory items will appear here once products and variants are connected from the backend.
                        </p>

                        <Button className="mt-4 h-9 bg-[#303030] text-white hover:bg-[#1f1f1f]">
                          Add inventory
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#dcdfe4] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#6d7175]">
              Showing {filteredInventory.length} inventory items
            </p>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 bg-white" disabled>
                Previous
              </Button>
              <Button variant="outline" className="h-8 bg-white" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
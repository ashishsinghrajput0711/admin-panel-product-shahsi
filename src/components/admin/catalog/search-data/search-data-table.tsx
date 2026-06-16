"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SearchData } from "./search-data-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
  CATEGORY: "Category",
  ATTRIBUTE: "Attribute",
  GLOBAL: "Global",
} as const;

const intentLabels = {
  GENERAL: "General",
  CATEGORY_DISCOVERY: "Category Discovery",
  PRODUCT_DISCOVERY: "Product Discovery",
  OCCASION: "Occasion",
  COLOR: "Color",
  STYLE: "Style",
  FIT: "Fit",
  BRIDAL_PARTY: "Bridal Party",
} as const;

export function SearchDataTable({
  searchDataItems,
  isLoading,
}: {
  searchDataItems: SearchData[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Loading search data...</div>
    );
  }

  if (!searchDataItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No search data records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend search data ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Keyword</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Target</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Intent</th>
            <th className="p-4 font-medium">Synonyms</th>
            <th className="p-4 font-medium">Boost</th>
            <th className="p-4 font-medium">Weight</th>
            <th className="p-4 font-medium">Flags</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {searchDataItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-4">
                <p className="font-medium text-neutral-950">{item.keyword}</p>
                <p className="text-xs text-neutral-500">
                  {item.normalizedKeyword}
                </p>
                {item.resultUrl && (
                  <p className="mt-1 max-w-[220px] truncate text-xs text-neutral-500">
                    {item.resultUrl}
                  </p>
                )}
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {scopeLabels[item.scope] ?? item.scope}
                </Badge>
              </td>

              <td className="p-4">
                <p>
                  {item.productName ||
                    item.variantSku ||
                    item.categoryName ||
                    item.attributeName ||
                    "Global Search"}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.productId ||
                    item.variantId ||
                    item.categoryId ||
                    item.attributeId ||
                    item.id}
                </p>
              </td>

              <td className="p-4">{item.businessType}</td>

              <td className="p-4">
                {intentLabels[item.intent] ?? item.intent}
              </td>

              <td className="p-4">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {item.synonyms?.slice(0, 3).map((synonym) => (
                    <Badge key={synonym} variant="outline">
                      {synonym}
                    </Badge>
                  ))}

                  {item.misspellings?.slice(0, 2).map((misspelling) => (
                    <Badge key={misspelling} variant="outline">
                      {misspelling}
                    </Badge>
                  ))}

                  {!item.synonyms?.length && !item.misspellings?.length && (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <div className="flex max-w-[200px] flex-wrap gap-1">
                  {item.boostTerms?.slice(0, 3).map((term) => (
                    <Badge key={term} className="bg-neutral-950 text-white">
                      {term}
                    </Badge>
                  ))}

                  {!item.boostTerms?.length && (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">{item.rankingWeight}</td>

              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {item.isVisible && <Badge variant="outline">Visible</Badge>}
                  {item.isTrending && <Badge variant="outline">Trending</Badge>}
                  {!item.isVisible && !item.isTrending && (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
              </td>

              <td className="p-4">
                <StatusBadge status={item.status} />
              </td>

              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/catalog/search/${item.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Boost
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    More
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700"
        : status === "INACTIVE"
          ? "bg-neutral-100 text-neutral-700"
          : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}
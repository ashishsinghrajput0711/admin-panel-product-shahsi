"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogMedia } from "./media-types";

const scopeLabels = {
  PRODUCT: "Product",
  VARIANT: "Variant",
} as const;

const typeLabels = {
  IMAGE: "Image",
  VIDEO: "Video",
  THUMBNAIL: "Thumbnail",
  LOOKBOOK: "Lookbook",
  SIZE_GUIDE: "Size Guide",
  FABRIC_SWATCH: "Fabric Swatch",
} as const;

export function MediaTable({
  mediaItems,
  isLoading,
}: {
  mediaItems: CatalogMedia[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="p-8 text-sm text-neutral-500">Loading media...</div>;
  }

  if (!mediaItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          No media records found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          Backend media ready hone ke baad yahan show hoga.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
      <table className="w-full min-w-[1150px] text-sm">
        <thead className="bg-[#f7f2ea] text-left">
          <tr>
            <th className="p-4 font-medium">Preview</th>
            <th className="p-4 font-medium">Media</th>
            <th className="p-4 font-medium">Scope</th>
            <th className="p-4 font-medium">Business</th>
            <th className="p-4 font-medium">Type</th>
            <th className="p-4 font-medium">Alt Text</th>
            <th className="p-4 font-medium">Position</th>
            <th className="p-4 font-medium">Primary</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {mediaItems.map((item) => (
            <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-4">
                <MediaPreview item={item} />
              </td>

              <td className="p-4">
                <p className="font-medium text-neutral-950">
                  {item.title || item.fileName || "Catalog Media"}
                </p>
                <p className="max-w-[220px] truncate text-xs text-neutral-500">
                  {item.url}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {item.productName || item.variantSku || item.productId || item.variantId || "No target"}
                </p>
              </td>

              <td className="p-4">
                <Badge variant="outline">
                  {scopeLabels[item.scope] ?? item.scope}
                </Badge>
              </td>

              <td className="p-4">{item.businessType}</td>

              <td className="p-4">
                {typeLabels[item.type] ?? item.type}
              </td>

              <td className="p-4">
                {item.altText ? (
                  <span className="line-clamp-2 max-w-[180px] text-neutral-700">
                    {item.altText}
                  </span>
                ) : (
                  <span className="text-amber-700">Missing</span>
                )}
              </td>

              <td className="p-4">{item.position}</td>

              <td className="p-4">
                {item.isPrimary ? (
                  <Badge className="bg-neutral-950 text-white">Primary</Badge>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
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
                    <Link href={`/admin/catalog/media/${item.id}/edit`}>
                      Edit
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" className="rounded-full">
                    Primary
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

function MediaPreview({ item }: { item: CatalogMedia }) {
  if (item.type === "VIDEO") {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-xs font-medium text-neutral-600">
        VIDEO
      </div>
    );
  }

  const src = item.thumbnailUrl || item.url;

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-neutral-100">
      <Image
        src={src}
        alt={item.altText || item.title || "Catalog media"}
        fill
        className="object-cover"
        unoptimized
      />
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
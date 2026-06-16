"use client";

import Link from "next/link";
import { useList } from "@refinedev/core";
import { Archive, ImageIcon, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MediaFilters } from "@/components/admin/catalog/media/media-filters";
import { MediaTable } from "@/components/admin/catalog/media/media-table";
import type { CatalogMedia } from "@/components/admin/catalog/media/media-types";

export default function MediaPage() {
  const listResult = useList<CatalogMedia>({
    resource: "media",
  });

  const data = listResult.result;
  const isLoading = listResult.query?.isLoading ?? false;
  const isError = listResult.query?.isError ?? false;
  const error = listResult.query?.error;

  const mediaItems = data?.data ?? [];

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Media
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Media Management
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage product and variant images, videos, thumbnails, lookbook
              assets, alt text, media ordering, primary media and publish status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" className="rounded-full">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <ImageIcon className="mr-2 h-4 w-4" />
              Gallery
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/media/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Media
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {isError ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Media API connect nahi ho paayi. Backend ready hone ke baad endpoint
          check karna:{" "}
          <span className="font-semibold">
            GET /api/proxy/admin/catalog/media
          </span>
          {error instanceof Error && error.message ? (
            <p className="mt-1 text-xs">{error.message}</p>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <MediaFilters />

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
          <MediaTable mediaItems={mediaItems} isLoading={isLoading} />
        </Card>
      </section>
    </main>
  );
}
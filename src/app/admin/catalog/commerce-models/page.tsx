"use client";

import Link from "next/link";
import { useList } from "@refinedev/core";
import { Archive, Plus, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommerceModelFilters } from "@/components/admin/catalog/commerce-models/commerce-model-filters";
import { CommerceModelTable } from "@/components/admin/catalog/commerce-models/commerce-model-table";
import type { CommerceModel } from "@/components/admin/catalog/commerce-models/commerce-model-types";

export default function CommerceModelsPage() {
  const listResult = useList<CommerceModel>({
    resource: "commerce-models",
  });

  const data = listResult.result;
  const isLoading = listResult.query?.isLoading ?? false;
  const isError = listResult.query?.isError ?? false;
  const error = listResult.query?.error;

  const models = data?.data ?? [];

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Admin / Catalog / Commerce Models
        </p>

        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-5xl font-medium tracking-tight">
              Commerce Models
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Manage retail, made-to-order, rental and resale rules including
              availability, deposits, returns, late fees, lead times and resale
              commission.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" className="rounded-full">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <Settings2 className="mr-2 h-4 w-4" />
              Rules
            </Button>

            <Button type="button" variant="secondary" className="rounded-full">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>

            <Button
              asChild
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
            >
              <Link href="/admin/catalog/commerce-models/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Model
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {isError ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Commerce models API connect nahi ho paayi. Backend ready hone ke baad
          endpoint check karna:{" "}
          <span className="font-semibold">
            GET /api/proxy/admin/catalog/commerce-models
          </span>
          {error instanceof Error && error.message ? (
            <p className="mt-1 text-xs">{error.message}</p>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CommerceModelFilters />

        <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-4">
          <CommerceModelTable models={models} isLoading={isLoading} />
        </Card>
      </section>
    </main>
  );
}
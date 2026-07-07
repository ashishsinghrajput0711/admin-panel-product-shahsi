"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  activateCommerceType,
  deactivateCommerceType,
  getCommerceTypes,
} from "@/lib/admin/commerce-types-api";
import { Archive, Plus, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CommerceModelFilters,
  emptyCommerceModelFilters,
  type CommerceModelFilterState,
} from "@/components/admin/catalog/commerce-models/commerce-model-filters";
import { CommerceModelTable } from "@/components/admin/catalog/commerce-models/commerce-model-table";
import type { CommerceModel } from "@/components/admin/catalog/commerce-models/commerce-model-types";

export default function CommerceModelsPage() {
  const [models, setModels] = useState<CommerceModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<CommerceModelFilterState>(
  emptyCommerceModelFilters,
);

  useEffect(() => {
    let cancelled = false;

    async function loadCommerceTypes() {
      try {
        setIsLoading(true);
        setApiError(null);

        const items = await getCommerceTypes();

        if (!cancelled) {
          setModels(items);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Commerce types fetch failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCommerceTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleStatus(model: CommerceModel) {
    if (!model.id) return;

    try {
      setTogglingId(model.id);
      setApiError(null);

      if (model.isActive) {
        await deactivateCommerceType(model.id);
      } else {
        await activateCommerceType(model.id);
      }

      const items = await getCommerceTypes();
      setModels(items);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Commerce type status update failed.",
      );
    } finally {
      setTogglingId(null);
    }
  }


  const filteredModels = models.filter((model) => {
  const statusMatch =
    !filters.statuses.length ||
    filters.statuses.includes(model.isActive ? "active" : "inactive");

  const typeMatch =
    !filters.types.length || filters.types.includes(model.code);

  const config = model.config || {};

  const configMatch =
    !filters.configs.length ||
    filters.configs.every((configKey) => Boolean(config[configKey]));

  return statusMatch && typeMatch && configMatch;
});

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

      {apiError ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Commerce types API connect nahi ho paayi. Backend endpoint check
          karna:{" "}
          <span className="font-semibold">
            GET /api/proxy/admin/commerce-types
          </span>
          <p className="mt-1 text-xs">{apiError}</p>
        </div>
      ) : null}

     <section className="space-y-6">
  <CommerceModelFilters
  value={filters}
  onChange={setFilters}
  onClear={() => setFilters(emptyCommerceModelFilters)}
/>

  <Card className="w-full rounded-[1.5rem] border-neutral-200 bg-white p-4">
   <CommerceModelTable
  models={filteredModels}
  isLoading={isLoading}
  onToggleStatus={handleToggleStatus}
  togglingId={togglingId}
/>
  </Card>
</section>
    </main>
  );
}
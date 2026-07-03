"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  Warehouse,
  X,
} from "lucide-react";

import {
  createAdminLocation,
  createAdminWarehouse,
  createInventoryAsset,
  createWarehouseBin,
  deleteInventoryAsset,
  getAdminLocations,
  getAdminProductPicker,
  getAdminProductVariants,
  getAdminWarehouses,
  getInventoryAssetById,
  getInventoryAssets,
  getWarehouseBins,
  updateInventoryAsset,
  type AdminCatalogVariant,
  type AdminLocation,
  type AdminProductPickerItem,
  type AdminWarehouse,
  type CreateAdminLocationPayload,
  type CreateAdminWarehousePayload,
  type CreateInventoryAssetPayload,
  type CreateWarehouseBinPayload,
  type InventoryAsset,
  type InventoryListMeta,
  type UpdateInventoryAssetPayload,
  type WarehouseBin,
} from "@/lib/admin/inventory-api";

type InventoryTab = "assets" | "locations" | "warehouses" | "bins";

const tabs: Array<{
  id: InventoryTab;
  label: string;
  icon: typeof Boxes;
}> = [
  {
    id: "assets",
    label: "Assets",
    icon: Boxes,
  },
  {
    id: "locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    id: "warehouses",
    label: "Warehouses",
    icon: Warehouse,
  },
  {
    id: "bins",
    label: "Bins",
    icon: Building2,
  },
];

const emptyMeta: InventoryListMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

const initialLocationForm = {
  name: "",
  code: "",
  type: "STORE",
  country: "India",
  state: "",
  city: "",
  pincode: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  email: "",
  isActive: true,
  isDefault: false,
};

const initialWarehouseForm = {
  locationId: "",
  name: "",
  code: "",
  type: "MAIN",
  country: "India",
  state: "",
  city: "",
  pincode: "",
  addressLine1: "",
  addressLine2: "",
  managerName: "",
  managerPhone: "",
  managerEmail: "",
  isActive: true,
  isDefault: false,
};


const initialBinForm = {
  warehouseId: "",
  name: "",
  code: "",
  zone: "",
  aisle: "",
  rack: "",
  shelf: "",
  capacity: 100,
  currentLoad: 0,
  isActive: true,
};


const initialAssetForm = {
  productId: "",
  variantId: "",
  skuCode: "",
  barcode: "",
  assetType: "STOCK",
  title: "",
  notes: "",
  locationId: "",
  warehouseId: "",
  binCode: "",
  condition: "NEW",
  status: "ACTIVE",
  totalQuantity: 0,
  availableQuantity: 0,
  reservedQuantity: 0,
  allocatedQuantity: 0,
  damagedQuantity: 0,
  lostQuantity: 0,
  unitCost: 0,
  currency: "USD",
};

function cleanText(value: string) {
  return value.trim();
}

function optionalText(value: string) {
  const cleanValue = value.trim();
  return cleanValue ? cleanValue : undefined;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>("locations");

  return (
   <main className="min-h-screen overflow-x-hidden bg-[#fbfaf6] px-4 py-6 lg:px-6">
     <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
        <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                Admin / Catalog
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
                Inventory
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-neutral-500">
                Manage inventory assets, stock locations, warehouses and bins
                using backend-driven inventory APIs.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Build order: Locations → Warehouses → Bins → Assets
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "locations" ? <LocationsTab /> : null}
    {activeTab === "warehouses" ? <WarehousesTab /> : null}
     {activeTab === "bins" ? <BinsTab /> : null}
   {activeTab === "assets" ? <AssetsTab /> : null}
      </div>
    </main>
  );
}

function LocationsTab() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(initialLocationForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLocationDrawerOpen, setIsLocationDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () => locations.filter((location) => location.isActive !== false).length,
    [locations]
  );

  const inactiveCount = useMemo(
    () => locations.filter((location) => location.isActive === false).length,
    [locations]
  );

  async function loadLocations(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getAdminLocations({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        status:
          statusFilter === "ALL"
            ? undefined
            : statusFilter === "ACTIVE"
              ? "ACTIVE"
              : "INACTIVE",
      });

      setLocations(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Locations load karte time error aa gaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLocations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadLocations(1);
  }

  async function handleCreateLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!cleanText(form.name)) {
      setError("Location name required hai.");
      return;
    }

    if (!cleanText(form.code)) {
      setError("Location code required hai.");
      return;
    }

    if (!cleanText(form.type)) {
      setError("Location type required hai.");
      return;
    }

    const payload: CreateAdminLocationPayload = {
      name: cleanText(form.name),
      code: cleanText(form.code),
      type: cleanText(form.type),
      country: optionalText(form.country),
      state: optionalText(form.state),
      city: optionalText(form.city),
      pincode: optionalText(form.pincode),
      addressLine1: optionalText(form.addressLine1),
      addressLine2: optionalText(form.addressLine2),
      phone: optionalText(form.phone),
      email: optionalText(form.email),
      isActive: form.isActive,
      isDefault: form.isDefault,
      metadata: {},
      createdBy: "admin",
    };

    try {
      setIsCreating(true);

      await createAdminLocation(payload);

    setForm(initialLocationForm);
setSuccessMessage("Location create ho gayi.");
setIsLocationDrawerOpen(false);
await loadLocations(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Location create karte time error aa gaya."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
   <section className="min-w-0">
  <div className="flex min-w-0 flex-col gap-6">
       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Total Locations" value={meta.total} />
          <StatsCard label="Visible On This Page" value={locations.length} />
          <StatsCard
            label="Active / Inactive"
            value={`${activeCount} / ${inactiveCount}`}
          />
        </div>

     <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">
                Locations
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Location means where stock can exist geographically or
                operationally.
              </p>
            </div>

           <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <button
    type="button"
    onClick={() => setIsLocationDrawerOpen(true)}
    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
  >
    <Plus className="h-4 w-4" />
    Create Location
  </button>

  <button
    type="button"
    onClick={() => loadLocations(page)}
    disabled={isLoading}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <RefreshCcw className="h-4 w-4" />
    )}
    Refresh
  </button>
</div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, code, city..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Search
            </button>
          </form>

          {error ? (
            <AlertBox type="error" message={error} />
          ) : null}

          {successMessage ? (
            <AlertBox type="success" message={successMessage} />
          ) : null}

       <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
         <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Locations loading...
                        </div>
                      </td>
                    </tr>
                  ) : locations.length ? (
                    locations.map((location) => (
                      <tr key={location.id} className="hover:bg-neutral-50/70">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-neutral-950">
                              {location.name}
                            </p>
                            <p className="mt-1 max-w-xs truncate text-xs text-neutral-500">
                              {location.addressLine1 || "No address"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{location.code}</TableCell>
                        <TableCell>{location.type || "-"}</TableCell>
                        <TableCell>{location.city || "-"}</TableCell>
                        <TableCell>
                          <StatusBadge active={location.isActive !== false} />
                        </TableCell>
                        <TableCell>
                          {location.isDefault ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              Default
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        No locations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() => loadLocations(page - 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={isLoading || page >= (meta.totalPages || 1)}
                onClick={() => loadLocations(page + 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

     <div
  className={[
    "fixed inset-0 z-50 transition",
    isLocationDrawerOpen ? "pointer-events-auto" : "pointer-events-none",
  ].join(" ")}
>
  <button
    type="button"
    aria-label="Close create location drawer"
    onClick={() => setIsLocationDrawerOpen(false)}
    className={[
      "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
      isLocationDrawerOpen ? "opacity-100" : "opacity-0",
    ].join(" ")}
  />

  <form
    onSubmit={handleCreateLocation}
    className={[
      "absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl transition-all duration-300 ease-out",
      isLocationDrawerOpen
        ? "translate-x-0 opacity-100"
        : "translate-x-full opacity-0",
    ].join(" ")}
  >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              Create Location
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Confirmed Swagger payload ke fields use ho rahe hain.
            </p>
          </div>

        <button
  type="button"
  onClick={() => setIsLocationDrawerOpen(false)}
  className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
>
  <X className="h-5 w-5" />
</button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Location Name" required>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Delhi Store"
             className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Code" required>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="LOC-DELHI-001"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Type" required>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="STORE">STORE</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
              <option value="HUB">HUB</option>
              <option value="POPUP">POPUP</option>
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <input
                value={form.country}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, country: event.target.value }))
                }
                placeholder="India"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="State">
              <input
                value={form.state}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, state: event.target.value }))
                }
                placeholder="Delhi"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, city: event.target.value }))
                }
                placeholder="New Delhi"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Pincode">
              <input
                value={form.pincode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pincode: event.target.value }))
                }
                placeholder="110001"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <Field label="Address Line 1">
            <input
              value={form.addressLine1}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressLine1: event.target.value,
                }))
              }
              placeholder="Main market road"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Address Line 2">
            <input
              value={form.addressLine2}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressLine2: event.target.value,
                }))
              }
              placeholder="Near metro station"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="+91 9999999999"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Email">
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="store@shahsi.com"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
              Active Location
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>

            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
              Default Location
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isDefault: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Location
          </button>
        </div>
            </form>
    </div>
  </section>
  );
}


function WarehousesTab() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [page, setPage] = useState(1);

const [form, setForm] = useState(initialWarehouseForm);
const [isLoading, setIsLoading] = useState(true);
const [isCreating, setIsCreating] = useState(false);
const [isWarehouseDrawerOpen, setIsWarehouseDrawerOpen] = useState(false);
const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () => warehouses.filter((warehouse) => warehouse.isActive !== false).length,
    [warehouses]
  );

  async function loadLocationsForDropdown() {
    const response = await getAdminLocations({
      page: 1,
      limit: 100,
    });

    setLocations(response.data);

    setForm((prev) => {
      if (prev.locationId || !response.data[0]?.id) return prev;

      return {
        ...prev,
        locationId: response.data[0].id,
      };
    });
  }

  async function loadWarehouses(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getAdminWarehouses({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        locationId: locationFilter === "ALL" ? undefined : locationFilter,
      });

      setWarehouses(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Warehouses load karte time error aa gaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLocationsForDropdown();
    loadWarehouses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWarehouses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadWarehouses(1);
  }

  async function handleCreateWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!cleanText(form.locationId)) {
      setError("Warehouse ke liye location select karna required hai.");
      return;
    }

    if (!cleanText(form.name)) {
      setError("Warehouse name required hai.");
      return;
    }

    if (!cleanText(form.code)) {
      setError("Warehouse code required hai.");
      return;
    }

    if (!cleanText(form.type)) {
      setError("Warehouse type required hai.");
      return;
    }

    const payload: CreateAdminWarehousePayload = {
      locationId: cleanText(form.locationId),
      name: cleanText(form.name),
      code: cleanText(form.code),
      type: cleanText(form.type),
      addressLine1: optionalText(form.addressLine1),
      addressLine2: optionalText(form.addressLine2),
      city: optionalText(form.city),
      state: optionalText(form.state),
      pincode: optionalText(form.pincode),
      country: optionalText(form.country),
      managerName: optionalText(form.managerName),
      managerPhone: optionalText(form.managerPhone),
      managerEmail: optionalText(form.managerEmail),
      isActive: form.isActive,
      isDefault: form.isDefault,
      metadata: {},
      createdBy: "admin",
    };

    try {
      setIsCreating(true);

      await createAdminWarehouse(payload);

      setForm((prev) => ({
        ...initialWarehouseForm,
        locationId: prev.locationId,
      }));

  setSuccessMessage("Warehouse create ho gaya.");
setIsWarehouseDrawerOpen(false);
await loadWarehouses(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Warehouse create karte time error aa gaya."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="min-w-0">
  <div className="flex min-w-0 flex-col gap-6">
       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Total Warehouses" value={meta.total} />
          <StatsCard label="Visible On This Page" value={warehouses.length} />
          <StatsCard label="Active" value={activeCount} />
        </div>

   <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">
                Warehouses
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Warehouse belongs to a location. Select location first, then
                create warehouse.
              </p>
            </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <button
    type="button"
    onClick={() => setIsWarehouseDrawerOpen(true)}
    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
  >
    <Plus className="h-4 w-4" />
    Create Warehouse
  </button>

  <button
    type="button"
    onClick={() => loadWarehouses(page)}
    disabled={isLoading}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <RefreshCcw className="h-4 w-4" />
    )}
    Refresh
  </button>
</div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, code, city..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Search
            </button>
          </form>

          {error ? <AlertBox type="error" message={error} /> : null}
          {successMessage ? (
            <AlertBox type="success" message={successMessage} />
          ) : null}

        <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
  <div className="max-w-full overflow-x-auto">
    <table className="w-full min-w-[760px] divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Warehouses loading...
                        </div>
                      </td>
                    </tr>
                  ) : warehouses.length ? (
                    warehouses.map((warehouse) => (
                      <tr key={warehouse.id} className="hover:bg-neutral-50/70">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-neutral-950">
                              {warehouse.name}
                            </p>
                            <p className="mt-1 max-w-xs truncate text-xs text-neutral-500">
                              {warehouse.addressLine1 || "No address"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{warehouse.code}</TableCell>
                        <TableCell>{warehouse.type || "-"}</TableCell>
                        <TableCell>{warehouse.city || "-"}</TableCell>
                        <TableCell>
                          <StatusBadge active={warehouse.isActive !== false} />
                        </TableCell>
                        <TableCell>
                          {warehouse.isDefault ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              Default
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        No warehouses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() => loadWarehouses(page - 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={isLoading || page >= (meta.totalPages || 1)}
                onClick={() => loadWarehouses(page + 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

   <div
  className={[
    "fixed inset-0 z-50 transition",
    isWarehouseDrawerOpen ? "pointer-events-auto" : "pointer-events-none",
  ].join(" ")}
>
  <button
    type="button"
    aria-label="Close create warehouse drawer"
    onClick={() => setIsWarehouseDrawerOpen(false)}
    className={[
      "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
      isWarehouseDrawerOpen ? "opacity-100" : "opacity-0",
    ].join(" ")}
  />

  <form
    onSubmit={handleCreateWarehouse}
    className={[
      "absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl transition-all duration-300 ease-out",
      isWarehouseDrawerOpen
        ? "translate-x-0 opacity-100"
        : "translate-x-full opacity-0",
    ].join(" ")}
  >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              Create Warehouse
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Confirmed Swagger warehouse payload ke fields use ho rahe hain.
            </p>
          </div>

        <button
  type="button"
  onClick={() => setIsWarehouseDrawerOpen(false)}
  className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
>
  <X className="h-5 w-5" />
</button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Location" required>
            <select
              value={form.locationId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  locationId: event.target.value,
                }))
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Warehouse Name" required>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Delhi Main Warehouse"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Code" required>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="WH-DELHI-001"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Type" required>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="MAIN">MAIN</option>
              <option value="STORE">STORE</option>
              <option value="FULFILLMENT">FULFILLMENT</option>
              <option value="RETURN">RETURN</option>
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <input
                value={form.country}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, country: event.target.value }))
                }
                placeholder="India"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="State">
              <input
                value={form.state}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, state: event.target.value }))
                }
                placeholder="Delhi"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, city: event.target.value }))
                }
                placeholder="New Delhi"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Pincode">
              <input
                value={form.pincode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pincode: event.target.value }))
                }
                placeholder="110001"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <Field label="Address Line 1">
            <input
              value={form.addressLine1}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressLine1: event.target.value,
                }))
              }
              placeholder="Warehouse road"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Address Line 2">
            <input
              value={form.addressLine2}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  addressLine2: event.target.value,
                }))
              }
              placeholder="Near logistics hub"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Manager Name">
            <input
              value={form.managerName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  managerName: event.target.value,
                }))
              }
              placeholder="Warehouse Manager"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Manager Phone">
              <input
                value={form.managerPhone}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    managerPhone: event.target.value,
                  }))
                }
                placeholder="9999999999"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Manager Email">
              <input
                value={form.managerEmail}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    managerEmail: event.target.value,
                  }))
                }
                placeholder="warehouse@shahsi.com"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
              Active Warehouse
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>

            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
              Default Warehouse
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isDefault: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating || !locations.length}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Warehouse
          </button>
        </div>
           </form>
    </div>
  </section>
  );
}


function BinsTab() {
  const [bins, setBins] = useState<WarehouseBin[]>([]);
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);

  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);

const [form, setForm] = useState(initialBinForm);
const [isLoading, setIsLoading] = useState(true);
const [isCreating, setIsCreating] = useState(false);
const [isBinDrawerOpen, setIsBinDrawerOpen] = useState(false);
const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () => bins.filter((bin) => bin.isActive !== false).length,
    [bins]
  );

  async function loadWarehousesForDropdown() {
    const response = await getAdminWarehouses({
      page: 1,
      limit: 100,
    });

    setWarehouses(response.data);

    const firstWarehouseId = response.data[0]?.id || "";

    setWarehouseFilter((prev) => prev || firstWarehouseId);

    setForm((prev) => ({
      ...prev,
      warehouseId: prev.warehouseId || firstWarehouseId,
    }));

    return firstWarehouseId;
  }

  async function loadBins(nextPage = page, selectedWarehouseId = warehouseFilter) {
    if (!selectedWarehouseId) {
      setBins([]);
      setMeta(emptyMeta);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await getWarehouseBins(selectedWarehouseId, {
        page: nextPage,
        limit: 20,
      });

      setBins(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bins load karte time error aa gaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initBinsTab() {
      try {
        setIsLoading(true);
        setError("");

        const firstWarehouseId = await loadWarehousesForDropdown();

        if (firstWarehouseId) {
          await loadBins(1, firstWarehouseId);
        } else {
          setBins([]);
          setMeta(emptyMeta);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Bins tab initialize karte time error aa gaya."
        );
      } finally {
        setIsLoading(false);
      }
    }

    initBinsTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!warehouseFilter) return;

    setForm((prev) => ({
      ...prev,
      warehouseId: warehouseFilter,
    }));

    loadBins(1, warehouseFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseFilter]);

  async function handleCreateBin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!cleanText(form.warehouseId)) {
      setError("Bin ke liye warehouse select karna required hai.");
      return;
    }

    if (!cleanText(form.name)) {
      setError("Bin name required hai.");
      return;
    }

    if (!cleanText(form.code)) {
      setError("Bin code required hai.");
      return;
    }

    const payload: CreateWarehouseBinPayload = {
      name: cleanText(form.name),
      code: cleanText(form.code),
      zone: optionalText(form.zone),
      aisle: optionalText(form.aisle),
      rack: optionalText(form.rack),
      shelf: optionalText(form.shelf),
      capacity: Number(form.capacity || 0),
      currentLoad: Number(form.currentLoad || 0),
      isActive: form.isActive,
      metadata: {},
      createdBy: "admin",
    };

    try {
      setIsCreating(true);

      await createWarehouseBin(form.warehouseId, payload);

      setForm((prev) => ({
        ...initialBinForm,
        warehouseId: prev.warehouseId,
      }));

    setSuccessMessage("Bin create ho gaya.");
setIsBinDrawerOpen(false);
await loadBins(1, form.warehouseId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bin create karte time error aa gaya."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
  <section className="min-w-0">
  <div className="flex min-w-0 flex-col gap-6">
       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Total Bins" value={meta.total} />
          <StatsCard label="Visible On This Page" value={bins.length} />
          <StatsCard label="Active" value={activeCount} />
        </div>

      <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">Bins</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Bin belongs to a warehouse. Select warehouse first, then create
                bin.
              </p>
            </div>

           <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <button
    type="button"
    onClick={() => setIsBinDrawerOpen(true)}
    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
  >
    <Plus className="h-4 w-4" />
    Create Bin
  </button>

  <button
    type="button"
    onClick={() => loadBins(page, warehouseFilter)}
    disabled={isLoading || !warehouseFilter}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <RefreshCcw className="h-4 w-4" />
    )}
    Refresh
  </button>
</div>
          </div>

          <div className="mt-5">
            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              className="h-11 w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          {error ? <AlertBox type="error" message={error} /> : null}
          {successMessage ? (
            <AlertBox type="success" message={successMessage} />
          ) : null}

          <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
  <div className="max-w-full overflow-x-auto">
    <table className="w-full min-w-[760px] divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Aisle</TableHead>
                    <TableHead>Rack</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Bins loading...
                        </div>
                      </td>
                    </tr>
                  ) : bins.length ? (
                    bins.map((bin) => (
                      <tr key={bin.id} className="hover:bg-neutral-50/70">
                        <TableCell>
                          <p className="font-semibold text-neutral-950">
                            {bin.name}
                          </p>
                        </TableCell>
                        <TableCell>{bin.code}</TableCell>
                        <TableCell>{bin.zone || "-"}</TableCell>
                        <TableCell>{bin.aisle || "-"}</TableCell>
                        <TableCell>{bin.rack || "-"}</TableCell>
                        <TableCell>
                          {Number(bin.currentLoad ?? 0)} /{" "}
                          {Number(bin.capacity ?? 0)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge active={bin.isActive !== false} />
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        {warehouseFilter
                          ? "No bins found."
                          : "Warehouse select karo."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() => loadBins(page - 1, warehouseFilter)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={isLoading || page >= (meta.totalPages || 1)}
                onClick={() => loadBins(page + 1, warehouseFilter)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

    <div
  className={[
    "fixed inset-0 z-50 transition",
    isBinDrawerOpen ? "pointer-events-auto" : "pointer-events-none",
  ].join(" ")}
>
  <button
    type="button"
    aria-label="Close create bin drawer"
    onClick={() => setIsBinDrawerOpen(false)}
    className={[
      "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
      isBinDrawerOpen ? "opacity-100" : "opacity-0",
    ].join(" ")}
  />

  <form
    onSubmit={handleCreateBin}
    className={[
      "absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl transition-all duration-300 ease-out",
      isBinDrawerOpen
        ? "translate-x-0 opacity-100"
        : "translate-x-full opacity-0",
    ].join(" ")}
  >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              Create Bin
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Confirmed Swagger bin payload ke fields use ho rahe hain.
            </p>
          </div>

          <button
  type="button"
  onClick={() => setIsBinDrawerOpen(false)}
  className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
>
  <X className="h-5 w-5" />
</button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Warehouse" required>
            <select
              value={form.warehouseId}
              onChange={(event) => {
                const nextWarehouseId = event.target.value;

                setForm((prev) => ({
                  ...prev,
                  warehouseId: nextWarehouseId,
                }));

                setWarehouseFilter(nextWarehouseId);
              }}
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bin Name" required>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="BIN-A1"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Code" required>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="BIN-A1"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Zone">
            <input
              value={form.zone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, zone: event.target.value }))
              }
              placeholder="QC-ZONE"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Aisle">
              <input
                value={form.aisle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, aisle: event.target.value }))
                }
                placeholder="A"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Rack">
              <input
                value={form.rack}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rack: event.target.value }))
                }
                placeholder="R1"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Shelf">
              <input
                value={form.shelf}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, shelf: event.target.value }))
                }
                placeholder="S1"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Capacity">
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    capacity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Current Load">
              <input
                type="number"
                min={0}
                value={form.currentLoad}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    currentLoad: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-neutral-700">
              Active Bin
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating || !warehouses.length}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Bin
          </button>
        </div>
      </form>
      </div>
    </section>
  );
}

function AssetsTab() {

  const [productSearch, setProductSearch] = useState("");
const [productResults, setProductResults] = useState<AdminProductPickerItem[]>([]);
const [selectedProduct, setSelectedProduct] =
  useState<AdminProductPickerItem | null>(null);
const [isSearchingProducts, setIsSearchingProducts] = useState(false);
const [variants, setVariants] = useState<AdminCatalogVariant[]>([]);
const [selectedVariant, setSelectedVariant] =
  useState<AdminCatalogVariant | null>(null);
const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [bins, setBins] = useState<WarehouseBin[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);

  const [locationFilter, setLocationFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(initialAssetForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);
const [isDeletingAssetId, setIsDeletingAssetId] = useState("");
const [editingAssetId, setEditingAssetId] = useState("");
const [error, setError] = useState("");
const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () => assets.filter((asset) => asset.status === "ACTIVE").length,
    [assets]
  );

  async function loadAssetDependencies() {
    const [locationsResponse, warehousesResponse] = await Promise.all([
      getAdminLocations({ page: 1, limit: 100 }),
      getAdminWarehouses({ page: 1, limit: 100 }),
    ]);

    setLocations(locationsResponse.data);
    setWarehouses(warehousesResponse.data);

    const firstLocationId = locationsResponse.data[0]?.id || "";
    const firstWarehouseId = warehousesResponse.data[0]?.id || "";

    setForm((prev) => ({
      ...prev,
      locationId: prev.locationId || firstLocationId,
      warehouseId: prev.warehouseId || firstWarehouseId,
    }));

    if (firstWarehouseId) {
      const binsResponse = await getWarehouseBins(firstWarehouseId, {
        page: 1,
        limit: 100,
      });

      setBins(binsResponse.data);

      setForm((prev) => ({
        ...prev,
        binCode: prev.binCode || binsResponse.data[0]?.code || "",
      }));
    }
  }

  async function loadBinsForWarehouse(warehouseId: string) {
    if (!warehouseId) {
      setBins([]);
      return;
    }

    const response = await getWarehouseBins(warehouseId, {
      page: 1,
      limit: 100,
    });

    setBins(response.data);

    setForm((prev) => ({
      ...prev,
      binCode: response.data[0]?.code || "",
    }));
  }

  async function loadAssets(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getInventoryAssets({
        page: nextPage,
        limit: 20,
        locationId: locationFilter === "ALL" ? undefined : locationFilter,
        warehouseId: warehouseFilter === "ALL" ? undefined : warehouseFilter,
      });

      setAssets(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Assets load karte time error aa gaya."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProductVariants(productId: string) {
  if (!productId) {
    setVariants([]);
    setSelectedVariant(null);
    return;
  }

  try {
    setIsLoadingVariants(true);
    setError("");

    const response = await getAdminProductVariants(productId);
    const activeVariants = response.filter(
      (variant) => variant.status !== "INACTIVE" && variant.isActive !== false
    );

    setVariants(activeVariants);
    setSelectedVariant(null);

    setForm((prev) => ({
      ...prev,
      variantId: "",
    }));
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Product variants load karte time error aa gaya."
    );
    setVariants([]);
    setSelectedVariant(null);
  } finally {
    setIsLoadingVariants(false);
  }
}


  async function searchProducts(searchText = productSearch) {
  try {
    setIsSearchingProducts(true);
    setError("");

    const response = await getAdminProductPicker({
      search: searchText.trim() || undefined,
      searchBy: "all",
      status: "ACTIVE",
      page: 1,
      limit: 10,
    });

    setProductResults(response.items);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Product picker load karte time error aa gaya."
    );
  } finally {
    setIsSearchingProducts(false);
  }
}

async function selectProduct(product: AdminProductPickerItem) {
  setSelectedProduct(product);
  setSelectedVariant(null);
  setProductSearch(product.title);

  setForm((prev) => ({
    ...prev,
    productId: product.id,
    variantId: "",
    skuCode: product.sku || "",
    barcode: "",
    title: product.title,
  }));

  await loadProductVariants(product.id);
}

function clearSelectedProduct() {
  setSelectedProduct(null);
  setSelectedVariant(null);
  setVariants([]);
  setProductSearch("");

  setForm((prev) => ({
    ...prev,
    productId: "",
    variantId: "",
    skuCode: "",
    barcode: "",
    title: "",
  }));
}


function selectVariant(variantId: string) {
  const variant = variants.find((item) => item.id === variantId) || null;

  setSelectedVariant(variant);

  setForm((prev) => ({
    ...prev,
    variantId: variant?.id || "",
    skuCode: variant?.sku || variant?.variantSku || prev.skuCode,
    barcode: variant?.barcode || "",
    totalQuantity:
      Number(prev.totalQuantity || 0) > 0
        ? prev.totalQuantity
        : Number(variant?.stock || 0),
    availableQuantity:
      Number(prev.availableQuantity || 0) > 0
        ? prev.availableQuantity
        : Math.max(
            Number(variant?.stock || 0) - Number(variant?.reservedStock || 0),
            0
          ),
    unitCost:
      Number(prev.unitCost || 0) > 0
        ? prev.unitCost
        : Number(variant?.price || 0),
  }));
}


function openCreateAssetDrawer() {
  setEditingAssetId("");
  setSelectedProduct(null);
  setSelectedVariant(null);
  setVariants([]);
  setProductSearch("");

  setForm((prev) => ({
    ...initialAssetForm,
    locationId: prev.locationId,
    warehouseId: prev.warehouseId,
    binCode: prev.binCode,
  }));

  setError("");
  setSuccessMessage("");
  setIsAssetDrawerOpen(true);
}

async function openEditAssetDrawer(asset: InventoryAsset) {
  setEditingAssetId(asset.id);
  setSelectedProduct(null);
  setSelectedVariant(null);
  setVariants([]);
  setProductSearch(asset.title || "");

  setError("");
  setSuccessMessage("");

  try {
    setIsUpdating(true);

    const detail = await getInventoryAssetById(asset.id);
    const currentAsset = detail || asset;

    setForm({
      productId: currentAsset.productId || "",
      variantId: currentAsset.variantId || "",
      skuCode: currentAsset.skuCode || "",
      barcode: currentAsset.barcode || "",
      assetType: currentAsset.assetType || "STOCK",
      title: currentAsset.title || "",
      notes: currentAsset.notes || "",
      locationId: currentAsset.locationId || "",
      warehouseId: currentAsset.warehouseId || "",
      binCode: currentAsset.binCode || "",
      condition: currentAsset.condition || "NEW",
      status: currentAsset.status || "ACTIVE",
      totalQuantity: Number(currentAsset.totalQuantity || 0),
      availableQuantity: Number(currentAsset.availableQuantity || 0),
      reservedQuantity: Number(currentAsset.reservedQuantity || 0),
      allocatedQuantity: Number(currentAsset.allocatedQuantity || 0),
      damagedQuantity: Number(currentAsset.damagedQuantity || 0),
      lostQuantity: Number(currentAsset.lostQuantity || 0),
      unitCost: Number(currentAsset.unitCost || 0),
      currency: currentAsset.currency || "USD",
    });

    if (currentAsset.warehouseId) {
      await loadBinsForWarehouse(currentAsset.warehouseId);
    }

    setIsAssetDrawerOpen(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Asset detail load karte time error aa gaya."
    );
  } finally {
    setIsUpdating(false);
  }
}

function closeAssetDrawer() {
  setIsAssetDrawerOpen(false);
  setEditingAssetId("");
}

  useEffect(() => {
    async function initAssetsTab() {
      try {
        setIsLoading(true);
        setError("");

       await loadAssetDependencies();
await searchProducts("");
await loadAssets(1);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Assets tab initialize karte time error aa gaya."
        );
      } finally {
        setIsLoading(false);
      }
    }

    initAssetsTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAssets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, warehouseFilter]);

  async function handleCreateAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!cleanText(form.productId)) {
      setError("Product ID required hai.");
      return;
    }

    if (!cleanText(form.title)) {
      setError("Asset title required hai.");
      return;
    }

    if (!cleanText(form.locationId)) {
      setError("Location required hai.");
      return;
    }

    if (!cleanText(form.warehouseId)) {
      setError("Warehouse required hai.");
      return;
    }

    const totalQuantity = Number(form.totalQuantity || 0);
    const availableQuantity = Number(form.availableQuantity || 0);

  const payload: CreateInventoryAssetPayload | UpdateInventoryAssetPayload = {
      productId: cleanText(form.productId),
      variantId: optionalText(form.variantId),
      skuCode: optionalText(form.skuCode),
      barcode: optionalText(form.barcode),
      assetType: cleanText(form.assetType),
      title: cleanText(form.title),
      notes: optionalText(form.notes),
      locationId: cleanText(form.locationId),
      warehouseId: cleanText(form.warehouseId),
      binCode: optionalText(form.binCode),
      condition: cleanText(form.condition),
      status: cleanText(form.status),
      totalQuantity,
      availableQuantity,
      reservedQuantity: Number(form.reservedQuantity || 0),
      allocatedQuantity: Number(form.allocatedQuantity || 0),
      damagedQuantity: Number(form.damagedQuantity || 0),
      lostQuantity: Number(form.lostQuantity || 0),
      unitCost: Number(form.unitCost || 0),
      currency: cleanText(form.currency),
      metadata: {},
      createdBy: "admin",
    };

  try {
  setIsCreating(true);

  if (editingAssetId) {
    await updateInventoryAsset(editingAssetId, payload);
  } else {
    await createInventoryAsset(payload as CreateInventoryAssetPayload);
  }

  setForm((prev) => ({
    ...initialAssetForm,
    locationId: prev.locationId,
    warehouseId: prev.warehouseId,
    binCode: prev.binCode,
  }));

  setEditingAssetId("");
  setSelectedProduct(null);
  setSelectedVariant(null);
  setVariants([]);
  setProductSearch("");
  setSuccessMessage(
    editingAssetId
      ? "Inventory asset update ho gaya."
      : "Inventory asset create ho gaya."
  );
  setIsAssetDrawerOpen(false);
  await loadAssets(1);
} catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Inventory asset create karte time error aa gaya."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteAsset(asset: InventoryAsset) {
  const confirmDelete = window.confirm(
    `"${asset.title || "Untitled asset"}" asset delete karna hai?`
  );

  if (!confirmDelete) return;

  try {
    setIsDeletingAssetId(asset.id);
    setError("");
    setSuccessMessage("");

    await deleteInventoryAsset(asset.id);

    setSuccessMessage("Inventory asset delete ho gaya.");
    await loadAssets(1);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Inventory asset delete karte time error aa gaya."
    );
  } finally {
    setIsDeletingAssetId("");
  }
}

return (
  <section className="min-w-0">
  <div className="flex min-w-0 flex-col gap-6">
       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Total Assets" value={meta.total} />
          <StatsCard label="Visible On This Page" value={assets.length} />
          <StatsCard label="Active Assets" value={activeCount} />
        </div>

    <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <h2 className="text-lg font-semibold text-neutral-950">
      Inventory Assets
    </h2>
    <p className="mt-1 text-sm text-neutral-500">
      Asset maps product/variant stock to location, warehouse and bin.
    </p>
  </div>

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <button
  type="button"
  onClick={openCreateAssetDrawer}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
>
  <Plus className="h-4 w-4" />
  Create Asset
</button>

    <button
      type="button"
      onClick={() => loadAssets(page)}
      disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
            </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>

            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          {error ? <AlertBox type="error" message={error} /> : null}
          {successMessage ? (
            <AlertBox type="success" message={successMessage} />
          ) : null}

  <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
  <div className="w-full overflow-hidden">
    <table className="w-full table-fixed divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
              <TableHead className="w-[28%]">Title</TableHead>
<TableHead className="w-[18%]">SKU</TableHead>
<TableHead className="w-[11%]">Asset Type</TableHead>
<TableHead className="w-[11%]">Condition</TableHead>
<TableHead className="w-[8%]">Qty</TableHead>
<TableHead className="w-[10%]">Status</TableHead>
<TableHead className="w-[14%]">Actions</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                       colSpan={7}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assets loading...
                        </div>
                      </td>
                    </tr>
                  ) : assets.length ? (
                    assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-neutral-50/70">
                       <TableCell>
  <div className="min-w-0">
   <p
  title={asset.title || "Untitled asset"}
  className="truncate font-semibold text-neutral-950"
>
  {asset.title || "Untitled asset"}
</p>
 <p title={asset.productId} className="mt-1 truncate text-xs text-neutral-500">
  {asset.productId}
</p>
  </div>
</TableCell>
                      <TableCell>
  <span className="block truncate">{asset.skuCode || "-"}</span>
</TableCell>
                        <TableCell>{asset.assetType || "-"}</TableCell>
                        <TableCell>{asset.condition || "-"}</TableCell>
                        <TableCell>
                          {Number(asset.availableQuantity ?? 0)} /{" "}
                          {Number(asset.totalQuantity ?? 0)}
                        </TableCell>
              <TableCell>
  <span
    className={[
      "rounded-full px-3 py-1 text-xs font-semibold",
      asset.status === "ACTIVE"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-neutral-100 text-neutral-600",
    ].join(" ")}
  >
    {asset.status || "-"}
  </span>
</TableCell>

<TableCell>
<div className="flex items-center gap-2 whitespace-nowrap">
    <button
      type="button"
      onClick={() => {
        void openEditAssetDrawer(asset);
      }}
      disabled={isUpdating}
      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() => {
        void handleDeleteAsset(asset);
      }}
      disabled={isDeletingAssetId === asset.id}
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeletingAssetId === asset.id ? "Deleting..." : "Delete"}
    </button>
  </div>
</TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-neutral-500"
                      >
                        No inventory assets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() => loadAssets(page - 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={isLoading || page >= (meta.totalPages || 1)}
                onClick={() => loadAssets(page + 1)}
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

<div
  className={[
    "fixed inset-0 z-50 flex items-center justify-center p-4 transition",
    isAssetDrawerOpen ? "pointer-events-auto" : "pointer-events-none",
  ].join(" ")}
>
    <button
      type="button"
      aria-label="Close create asset drawer"
    onClick={closeAssetDrawer}
  className={[
  "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ease-out",
  isAssetDrawerOpen ? "opacity-100" : "opacity-0",
].join(" ")}
    />

<div
  className={[
    "relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all duration-300 ease-out",
    isAssetDrawerOpen
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-6 scale-95 opacity-0",
  ].join(" ")}
>
  <form onSubmit={handleCreateAsset} className="flex min-h-0 flex-1 flex-col">
    <div className="shrink-0 border-b border-neutral-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Inventory Asset
              </p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
  {editingAssetId ? "Edit Asset" : "Create Asset"}
</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Select a product, assign location, warehouse, bin and stock quantity.
              </p>
            </div>

            <button
              type="button"
             onClick={closeAssetDrawer}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

   <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Field label="Product" required>
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3">
           <div
  className={[
    "grid gap-2",
    editingAssetId ? "grid-cols-1" : "sm:grid-cols-[minmax(0,1fr)_auto]",
  ].join(" ")}
>
              <input
  value={productSearch}
  onChange={(event) => setProductSearch(event.target.value)}
  disabled={Boolean(editingAssetId)}
  placeholder="Search product by title, SKU, barcode..."
  className="h-11 min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
  
/>

             {!editingAssetId ? (
  <button
    type="button"
    onClick={() => searchProducts(productSearch)}
    disabled={isSearchingProducts}
    className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isSearchingProducts ? "..." : "Search"}
  </button>
) : null}
              </div>

              {selectedProduct ? (
               <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  {selectedProduct.thumbnail || selectedProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.thumbnail || selectedProduct.imageUrl || ""}
                      alt={selectedProduct.title}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-xs text-neutral-400">
                      No img
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {selectedProduct.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-neutral-600">
                      SKU: {selectedProduct.sku || "-"} · ₹{selectedProduct.price ?? "-"}
                    </p>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      ID: {selectedProduct.id}
                    </p>
                  </div>

                 {!editingAssetId ? (
  <button
    type="button"
    onClick={clearSelectedProduct}
    className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
  >
    Clear
  </button>
) : null}
                </div>
              ) : null}
              {!editingAssetId ? (

              <div className="mt-3 max-h-64 overflow-y-auto overflow-x-hidden rounded-2xl border border-neutral-200 bg-white">
                {isSearchingProducts ? (
                  <div className="px-4 py-6 text-center text-sm text-neutral-500">
                    Products loading...
                  </div>
                ) : productResults.length ? (
                  productResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
       onClick={() => {
  if (editingAssetId) return;
  void selectProduct(product);
}}
                      className="flex w-full min-w-0 items-center gap-3 border-b border-neutral-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-neutral-50"
                    >
                      {product.thumbnail || product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail || product.imageUrl || ""}
                          alt={product.title}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400">
                          No img
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {product.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          SKU: {product.sku || "-"} ·{" "}
                          {product.vendor || product.brand || "-"}
                        </p>
                      </div>

                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                        {product.status || "-"}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-neutral-500">
                    No products found.
                  </div>
                )}
             </div>
) : null}

<input type="hidden" value={form.productId} readOnly />
            </div>
          </Field>

        <Field label="Variant">
  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-3">
    <select
      value={form.variantId}
      onChange={(event) => selectVariant(event.target.value)}
     disabled={
  (!selectedProduct && !editingAssetId) ||
  isLoadingVariants ||
  (!variants.length && !editingAssetId)
}
      className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
    >
      <option value="">
      {!selectedProduct && !editingAssetId
  ? "Select product first"
  : isLoadingVariants
    ? "Variants loading..."
    : variants.length
      ? "Select variant"
    : editingAssetId
  ? form.variantId
    ? `Current variant: ${form.variantId.slice(0, 8)}...`
    : "No variant linked"
  : "No variants found"}
      </option>

      {variants.map((variant) => (
        <option key={variant.id} value={variant.id}>
          {[
            variant.size ? `Size ${variant.size}` : null,
            variant.color || null,
            variant.sku || variant.variantSku || null,
            `Stock ${Number(variant.stock ?? 0)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </option>
      ))}
    </select>

    {selectedVariant ? (
      <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
        <div className="grid gap-2 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-neutral-950">Size:</span>{" "}
            {selectedVariant.size || "-"}
          </p>
          <p>
            <span className="font-semibold text-neutral-950">Color:</span>{" "}
            {selectedVariant.color || "-"}
          </p>
          <p>
            <span className="font-semibold text-neutral-950">SKU:</span>{" "}
            {selectedVariant.sku || selectedVariant.variantSku || "-"}
          </p>
          <p>
            <span className="font-semibold text-neutral-950">Stock:</span>{" "}
            {Number(selectedVariant.stock ?? 0)}
          </p>
          <p>
            <span className="font-semibold text-neutral-950">Reserved:</span>{" "}
            {Number(selectedVariant.reservedStock ?? 0)}
          </p>
          <p>
            <span className="font-semibold text-neutral-950">Price:</span> ₹
            {selectedVariant.price ?? "-"}
          </p>
        </div>
      </div>
    ) : null}
  </div>
</Field>

          <Field label="Asset Title" required>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Blue Dress Stock"
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU Code">
              <input
                value={form.skuCode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, skuCode: event.target.value }))
                }
                placeholder="SKU-001"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Barcode">
              <input
                value={form.barcode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, barcode: event.target.value }))
                }
                placeholder="BAR-001"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset Type">
              <select
                value={form.assetType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    assetType: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              >
                <option value="STOCK">STOCK</option>
              </select>
            </Field>

            <Field label="Condition">
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    condition: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              >
                <option value="NEW">NEW</option>
                <option value="GOOD">GOOD</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="LOST">LOST</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" required>
              <select
                value={form.locationId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    locationId: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              >
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Warehouse" required>
              <select
                value={form.warehouseId}
                onChange={async (event) => {
                  const warehouseId = event.target.value;

                  setForm((prev) => ({
                    ...prev,
                    warehouseId,
                  }));

                  await loadBinsForWarehouse(warehouseId);
                }}
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bin">
            <select
              value={form.binCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, binCode: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="">Select bin</option>
              {bins.map((bin) => (
                <option key={bin.id} value={bin.code}>
                  {bin.name} ({bin.code})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total Quantity">
              <input
                type="number"
                min={0}
                value={form.totalQuantity}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setForm((prev) => ({
                    ...prev,
                    totalQuantity: value,
                    availableQuantity: prev.availableQuantity || value,
                  }));
                }}
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Available Quantity">
              <input
                type="number"
                min={0}
                value={form.availableQuantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    availableQuantity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reserved Quantity">
              <input
                type="number"
                min={0}
                value={form.reservedQuantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    reservedQuantity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Allocated Quantity">
              <input
                type="number"
                min={0}
                value={form.allocatedQuantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    allocatedQuantity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Damaged Quantity">
              <input
                type="number"
                min={0}
                value={form.damagedQuantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    damagedQuantity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Lost Quantity">
              <input
                type="number"
                min={0}
                value={form.lostQuantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    lostQuantity: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit Cost">
              <input
                type="number"
                min={0}
                value={form.unitCost}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    unitCost: Number(event.target.value),
                  }))
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Currency">
              <input
                value={form.currency}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currency: event.target.value }))
                }
                placeholder="USD"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Internal inventory note"
              rows={3}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </Field>
        </div>

   <div className="shrink-0 border-t border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex gap-3">
            <button
              type="button"
            onClick={closeAssetDrawer}
              className="h-12 flex-1 rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
         {editingAssetId ? "Update Asset" : "Create Asset"}
            </button>
          </div>
        </div>
          </form>
    </div>
  </div>
    </section>
  );
}

function ComingSoonTab({ title }: { title: string }) {
  return (
    <section className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
        Inventory
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-neutral-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500">
        Is tab ka API flow next step me connect karenge. Pehle Locations stable
        kar rahe hain, kyunki Warehouse create karne ke liye locationId required
        hai.
      </p>
    </section>
  );
}

function StatsCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
  <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function AlertBox({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const isError = type === "error";

  return (
    <div
      className={[
        "mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      ].join(" ")}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={[
        "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="min-w-0 px-4 py-4 align-middle text-sm text-neutral-700">
      {children}
    </td>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
      Inactive
    </span>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-neutral-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}



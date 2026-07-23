"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { SubscriptionPlansTab } from "@/components/admin/catalog/inventory/subscription-plans-tab";
import { CustomerSubscriptionsTab } from "@/components/admin/catalog/inventory/customer-subscriptions-tab";
import {
  AlertCircle,
  Archive,
  Boxes,
  CalendarDays,
  ClipboardList,
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  CreditCard,
  Search,
 Warehouse,
PackagePlus,
UsersRound,
Wrench,
X,
Pencil,
Trash2,
} from "lucide-react";

import {
  acceptRentalRequest,
  archiveRentalInventoryUnit,
  completeRentalBookingCleaning,
  createAdminLocation,
  createAdminWarehouse,
  createInventoryAsset,
  createRentalDamageReport,
  createRentalInventoryUnit,
  createWarehouseBin,
  declineRentalRequest,
  deleteInventoryAsset,
  deleteRentalInventoryUnit,
  getAdminLocations,
  getAdminProductPicker,
  getAdminProductVariants,
  getAdminWarehouses,
  getInventoryAssetById,
  getInventoryAssets,
  getRentalBookingById,
  getRentalBookings,
  getRentalBookingTimeline,
  getRentalDamageReportById,
  getRentalDamageReports,
  getRentalInventoryUnits,
  getRentalOptions,
  getRentalRequestById,
  getRentalRequests,
  getWarehouseBins,
  returnRentalBooking,
  updateInventoryAsset,
  updateRentalBookingStatus,
  updateRentalDamageReport,
  updateRentalDamageReportStatus,
  updateRentalInventoryUnitCondition,
  updateRentalInventoryUnitStatus,
  deleteAdminLocation,
getAdminLocationById,
updateAdminLocation,

  type AdminCatalogVariant,
  type AdminLocation,
  type AdminProductPickerItem,
  type AdminWarehouse,
  type CreateAdminLocationPayload,
  type UpdateAdminLocationPayload,
  type CreateAdminWarehousePayload,
  type CreateInventoryAssetPayload,
  type CreateRentalDamageReportPayload,
  type CreateWarehouseBinPayload,
  type InventoryAsset,
  type InventoryListMeta,
  type RentalBooking,
  type RentalBookingStatus,
  type RentalBookingTimeline,
  type RentalDamageReport,
  type RentalDamageStatus,
  type RentalInventoryCondition,
  type RentalInventoryUnit,
  type RentalInventoryUnitStatus,
  type RentalOptions,
  type RentalRequest,
  type UpdateInventoryAssetPayload,
  type UpdateRentalDamageReportPayload,
  type WarehouseBin,
} from "@/lib/admin/inventory-api";

type InventoryTab =
  | "assets"
  | "rentalUnits"
  | "rentalRequests"
  | "rentalBookings"
  | "subscriptionPlans"
  | "rentalDamageReports"
  | "locations"
  | "customerSubscriptions"
  | "warehouses"
  | "bins";

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
  id: "rentalUnits",
  label: "Rental Units",
  icon: PackagePlus,
},
{
  id: "rentalRequests",
  label: "Rental Requests",
  icon: ClipboardList,
},
{
  id: "rentalBookings",
  label: "Rental Bookings",
  icon: CalendarDays,
},
{
  id: "subscriptionPlans",
  label: "Subscription Plans",
  icon: CreditCard,
},
{
  id: "customerSubscriptions",
  label: "Customer Subscriptions",
  icon: UsersRound,
},
{
  id: "rentalDamageReports",
  label: "Damage Reports",
  icon: Wrench,
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

const initialRentalUnitForm = {
  productId: "",
  variantId: "",
  skuCode: "",
  condition: "",
};
const initialDamageReportForm = {
  bookingId: "",
  inventoryUnitId: "",
  damageType: "",
  notes: "",
  repairCost: "",
  feeCharged: "",
};

const initialDamageReportEditForm = {
  notes: "",
  repairCost: "",
  feeCharged: "",
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
const [activeTab, setActiveTab] =
  useState<InventoryTab>("rentalUnits");

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
<div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                "flex min-w-0 items-center justify-center gap-2 rounded-3xl px-3 py-3 text-xs font-semibold transition xl:text-sm",
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
{activeTab === "rentalUnits" ? <RentalUnitsTab /> : null}
{activeTab === "rentalRequests" ? <RentalRequestsTab /> : null}
{activeTab === "rentalBookings" ? <RentalBookingsTab /> : null}
{activeTab === "subscriptionPlans" ? (
  <SubscriptionPlansTab />
) : null}

{activeTab === "customerSubscriptions" ? (
  <CustomerSubscriptionsTab />
) : null}
{activeTab === "rentalDamageReports" ? (
  <DamageReportsTab />
) : null}
      </div>
    </main>
  );
}

function LocationsTab() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<
  "code" | "city" | "state" | "country" | "pincode"
>("code");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(initialLocationForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [editingLocationId, setEditingLocationId] =
  useState("");

const [loadingLocationId, setLoadingLocationId] =
  useState("");

const [deletingLocationId, setDeletingLocationId] =
  useState("");
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

    const cleanSearch = search.trim();

    const response = await getAdminLocations({
      page: nextPage,
      limit: 20,

      ...(cleanSearch && searchField === "code"
        ? { code: cleanSearch }
        : {}),

      ...(cleanSearch && searchField === "city"
        ? { city: cleanSearch }
        : {}),

      ...(cleanSearch && searchField === "state"
        ? { state: cleanSearch }
        : {}),

      ...(cleanSearch && searchField === "country"
        ? { country: cleanSearch }
        : {}),

      ...(cleanSearch && searchField === "pincode"
        ? { pincode: cleanSearch }
        : {}),

      isActive:
        statusFilter === "ALL"
          ? undefined
          : statusFilter === "ACTIVE",
    });

    setLocations(response.data);
    setMeta(response.meta);
    setPage(response.meta.page || nextPage);
  } catch (err) {
    setLocations([]);
    setMeta(emptyMeta);

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load locations.",
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

  function openCreateLocationDrawer() {
  setEditingLocationId("");
  setForm(initialLocationForm);
  setError("");
  setSuccessMessage("");
  setIsLocationDrawerOpen(true);
}

function closeLocationDrawer() {
  setIsLocationDrawerOpen(false);
  setEditingLocationId("");
  setForm(initialLocationForm);
}

async function openEditLocationDrawer(
  location: AdminLocation,
) {
  try {
    setLoadingLocationId(location.id);
    setError("");
    setSuccessMessage("");

    const detail = await getAdminLocationById(
      location.id,
    );

    if (!detail) {
      throw new Error("Location detail not found.");
    }

    setEditingLocationId(detail.id);

    setForm({
      name: detail.name || "",
      code: detail.code || "",
      type: detail.type || "STORE",
      country: detail.country || "",
      state: detail.state || "",
      city: detail.city || "",
      pincode: detail.pincode || "",
      addressLine1: detail.addressLine1 || "",
      addressLine2: detail.addressLine2 || "",
      phone: detail.phone || "",
      email: detail.email || "",
      isActive: detail.isActive !== false,
      isDefault: detail.isDefault === true,
    });

    setIsLocationDrawerOpen(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load location detail.",
    );
  } finally {
    setLoadingLocationId("");
  }
}

 async function handleSaveLocation(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setError("");
  setSuccessMessage("");

  if (!cleanText(form.name)) {
    setError("Location name is required.");
    return;
  }

  if (!cleanText(form.code)) {
    setError("Location code is required.");
    return;
  }

  const payload:
    | CreateAdminLocationPayload
    | UpdateAdminLocationPayload = {
    name: cleanText(form.name),
    code: cleanText(form.code),
    type: optionalText(form.type),
    country: optionalText(form.country),
    state: optionalText(form.state),
    city: optionalText(form.city),
    pincode: optionalText(form.pincode),
    addressLine1: optionalText(
      form.addressLine1,
    ),
    addressLine2: optionalText(
      form.addressLine2,
    ),
    phone: optionalText(form.phone),
    email: optionalText(form.email),
    isActive: form.isActive,
    isDefault: form.isDefault,
  };

  const isEditing = Boolean(editingLocationId);

  try {
    setIsCreating(true);

    if (editingLocationId) {
      await updateAdminLocation(
        editingLocationId,
        payload,
      );
    } else {
      await createAdminLocation(
        payload as CreateAdminLocationPayload,
      );
    }

    closeLocationDrawer();

    setSuccessMessage(
      isEditing
        ? "Location updated successfully."
        : "Location created successfully.",
    );

    await loadLocations(isEditing ? page : 1);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : isEditing
          ? "Failed to update location."
          : "Failed to create location.",
    );
  } finally {
    setIsCreating(false);
  }
}
async function handleDeleteLocation(
  location: AdminLocation,
) {
  const confirmed = window.confirm(
    `Delete location "${location.name}"?`,
  );

  if (!confirmed) return;

  try {
    setDeletingLocationId(location.id);
    setError("");
    setSuccessMessage("");

    await deleteAdminLocation(location.id);

    const nextPage =
      locations.length === 1 && page > 1
        ? page - 1
        : page;

    setSuccessMessage(
      "Location deleted successfully.",
    );

    await loadLocations(nextPage);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to delete location.",
    );
  } finally {
    setDeletingLocationId("");
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
  onClick={openCreateLocationDrawer}
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
         className="mt-5 grid gap-3 lg:grid-cols-[170px_minmax(0,1fr)_180px_auto]"

         
          >

            <select
  value={searchField}
  onChange={(event) =>
    setSearchField(
      event.target.value as typeof searchField,
    )
  }
  className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
>
  <option value="code">Code</option>
  <option value="city">City</option>
  <option value="state">State</option>
  <option value="country">Country</option>
  <option value="pincode">Pincode</option>
</select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
             placeholder={`Search by ${searchField}...`}
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
      <table className="w-full min-w-[920px] divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Actions</TableHead>
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
                        <TableCell>
  <div className="flex items-center gap-2 whitespace-nowrap">
    <button
      type="button"
      onClick={() => {
        void openEditLocationDrawer(location);
      }}
      disabled={
        loadingLocationId === location.id ||
        deletingLocationId === location.id
      }
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loadingLocationId === location.id ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Pencil className="h-3.5 w-3.5" />
      )}

      Edit
    </button>

    <button
      type="button"
      onClick={() => {
        void handleDeleteLocation(location);
      }}
      disabled={
        loadingLocationId === location.id ||
        deletingLocationId === location.id
      }
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deletingLocationId === location.id ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}

      {deletingLocationId === location.id
        ? "Deleting..."
        : "Delete"}
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
onClick={closeLocationDrawer}
    className={[
      "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
      isLocationDrawerOpen ? "opacity-100" : "opacity-0",
    ].join(" ")}
  />

<form
  onSubmit={handleSaveLocation}
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
  {editingLocationId
    ? "Edit Location"
    : "Create Location"}
</h2>

<p className="mt-1 text-sm text-neutral-500">
  {editingLocationId
    ? "Update the selected stock location."
    : "Create a new stock location."}
</p>
          </div>

     <button
  type="button"
  onClick={closeLocationDrawer}
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
) : editingLocationId ? (
  <Pencil className="h-4 w-4" />
) : (
  <Plus className="h-4 w-4" />
)}

{isCreating
  ? editingLocationId
    ? "Saving..."
    : "Creating..."
  : editingLocationId
    ? "Save Changes"
    : "Create Location"}
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

function RentalUnitsTab() {
  const [units, setUnits] = useState<RentalInventoryUnit[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);

  const [rentalOptions, setRentalOptions] =
    useState<RentalOptions | null>(null);

  const [filterProducts, setFilterProducts] = useState<
    AdminProductPickerItem[]
  >([]);

  const [listSearch, setListSearch] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<
    AdminProductPickerItem[]
  >([]);

  const [selectedProduct, setSelectedProduct] =
    useState<AdminProductPickerItem | null>(null);

  const [variants, setVariants] = useState<AdminCatalogVariant[]>([]);

  const [selectedVariant, setSelectedVariant] =
    useState<AdminCatalogVariant | null>(null);

  const [form, setForm] = useState(initialRentalUnitForm);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [updatingUnitId, setUpdatingUnitId] = useState("");
  const [archivingUnitId, setArchivingUnitId] = useState("");
  const [deletingUnitId, setDeletingUnitId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const statusOptions =
    rentalOptions?.inventoryUnitStatuses ?? [];

  const conditionOptions =
    rentalOptions?.inventoryConditions ?? [];

  const availableCount = useMemo(
    () => units.filter((unit) => unit.status === "AVAILABLE").length,
    [units],
  );

  const unavailableCount = useMemo(
    () => units.filter((unit) => unit.status !== "AVAILABLE").length,
    [units],
  );

  async function loadRentalDependencies() {
    try {
      const [optionsResponse, productsResponse] = await Promise.all([
        getRentalOptions(),
        getAdminProductPicker({
          status: "ACTIVE",
          page: 1,
          limit: 100,
        }),
      ]);

      setRentalOptions(optionsResponse);
      setFilterProducts(productsResponse.items);

      setForm((current) => ({
        ...current,
        condition:
          current.condition ||
          optionsResponse.inventoryConditions[0] ||
          "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental inventory options.",
      );
    }
  }

  async function loadRentalUnits(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getRentalInventoryUnits({
        page: nextPage,
        limit: 20,
        search: listSearch.trim() || undefined,
        productId:
          productFilter === "ALL" ? undefined : productFilter,
        status:
          statusFilter === "ALL" ? undefined : statusFilter,
      });

      setUnits(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setUnits([]);
      setMeta(emptyMeta);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental inventory units.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleListSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await loadRentalUnits(1);
  }

 async function searchProducts(searchText = productSearch) {
  try {
    setIsSearchingProducts(true);
    setError("");

    const cleanSearch = searchText.trim();

    const response = await getAdminProductPicker({
      search: cleanSearch || undefined,
      page: 1,
      limit: 50,
    });

    setProductResults(response.items);
  } catch (err) {
    setProductResults([]);

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load products.",
    );
  } finally {
    setIsSearchingProducts(false);
  }
}

  async function loadVariants(productId: string) {
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
        (variant) =>
          variant.status !== "INACTIVE" &&
          variant.isActive !== false,
      );

      setVariants(activeVariants);
    } catch (err) {
      setVariants([]);
      setSelectedVariant(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load product variants.",
      );
    } finally {
      setIsLoadingVariants(false);
    }
  }

  function openCreateDrawer() {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setVariants([]);
    setProductSearch("");
    setProductResults([]);

    setForm({
      ...initialRentalUnitForm,
      condition: conditionOptions[0] || "",
    });

    setError("");
    setSuccessMessage("");
    setIsCreateDrawerOpen(true);

    void searchProducts("");
  }

  function closeCreateDrawer() {
    setIsCreateDrawerOpen(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setVariants([]);
    setProductSearch("");
    setProductResults([]);

    setForm({
      ...initialRentalUnitForm,
      condition: conditionOptions[0] || "",
    });
  }

  async function selectProduct(product: AdminProductPickerItem) {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setProductSearch(product.title);
    setProductResults([]);

    setForm((current) => ({
      ...current,
      productId: product.id,
      variantId: "",
      skuCode: "",
    }));

    await loadVariants(product.id);
  }

  function clearProduct() {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setVariants([]);
    setProductSearch("");
    setProductResults([]);

    setForm((current) => ({
      ...current,
      productId: "",
      variantId: "",
      skuCode: "",
    }));

    void searchProducts("");
  }

  function selectVariant(variantId: string) {
    const variant =
      variants.find((item) => item.id === variantId) || null;

    setSelectedVariant(variant);

    setForm((current) => ({
      ...current,
      variantId: variant?.id || "",
      skuCode: "",
    }));
  }

  async function handleCreateRentalUnit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const productId = form.productId.trim();
    const variantId = form.variantId.trim();
    const skuCode = form.skuCode.trim();
    const condition = form.condition.trim();

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!skuCode) {
      setError("A unique physical inventory unit SKU is required.");
      return;
    }

    try {
      setIsCreating(true);

      await createRentalInventoryUnit({
        productId,
        skuCode,
        ...(variantId ? { variantId } : {}),
        ...(condition ? { condition } : {}),
      });

      closeCreateDrawer();

      setSuccessMessage(
        "Rental inventory unit created successfully.",
      );

      await loadRentalUnits(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create the rental inventory unit.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(
    unit: RentalInventoryUnit,
    nextStatus: RentalInventoryUnitStatus,
  ) {
    if (nextStatus === unit.status) return;

    try {
      setUpdatingUnitId(unit.id);
      setError("");
      setSuccessMessage("");

      await updateRentalInventoryUnitStatus(unit.id, {
        status: nextStatus,
      });

      setSuccessMessage(
        `Rental unit status updated to ${nextStatus}.`,
      );

      await loadRentalUnits(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update the rental unit status.",
      );
    } finally {
      setUpdatingUnitId("");
    }
  }

  async function handleConditionChange(
    unit: RentalInventoryUnit,
    nextCondition: RentalInventoryCondition,
  ) {
    if (nextCondition === unit.condition) return;

    try {
      setUpdatingUnitId(unit.id);
      setError("");
      setSuccessMessage("");

      await updateRentalInventoryUnitCondition(unit.id, {
        condition: nextCondition,
      });

      setSuccessMessage(
        `Rental unit condition updated to ${nextCondition}.`,
      );

      await loadRentalUnits(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update the rental unit condition.",
      );
    } finally {
      setUpdatingUnitId("");
    }
  }

  async function handleMarkLost(unit: RentalInventoryUnit) {
    const confirmed = window.confirm(
      `Mark rental unit "${unit.skuCode}" as LOST?`,
    );

    if (!confirmed) return;

    try {
      setArchivingUnitId(unit.id);
      setError("");
      setSuccessMessage("");

      await archiveRentalInventoryUnit(unit.id);

      setSuccessMessage(
        `Rental unit ${unit.skuCode} marked as LOST.`,
      );

      await loadRentalUnits(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark the rental unit as lost.",
      );
    } finally {
      setArchivingUnitId("");
    }
  }

  async function handleDeleteUnit(unit: RentalInventoryUnit) {
    const confirmed = window.confirm(
      `Delete rental unit "${unit.skuCode}" permanently?`,
    );

    if (!confirmed) return;

    try {
      setDeletingUnitId(unit.id);
      setError("");
      setSuccessMessage("");

      await deleteRentalInventoryUnit(unit.id);

      setSuccessMessage(
        `Rental unit ${unit.skuCode} deleted successfully.`,
      );

      const nextPage =
        units.length === 1 && page > 1
          ? page - 1
          : page;

      await loadRentalUnits(nextPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete the rental inventory unit.",
      );
    } finally {
      setDeletingUnitId("");
    }
  }

  useEffect(() => {
    void loadRentalDependencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadRentalUnits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter, statusFilter]);

  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            label="Total Rental Units"
            value={meta.total}
          />

          <StatsCard
            label="Available On This Page"
            value={availableCount}
          />

          <StatsCard
            label="Unavailable On This Page"
            value={unavailableCount}
          />
        </div>

        <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Inventory
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Physical Rental Units
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage individual rentable items, their status and condition.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openCreateDrawer}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                <PackagePlus className="h-4 w-4" />
                Create Rental Unit
              </button>

              <button
                type="button"
                onClick={() => void loadRentalUnits(page)}
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
            onSubmit={handleListSearch}
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={listSearch}
                onChange={(event) =>
                  setListSearch(event.target.value)
                }
                placeholder="Search by unit SKU or product..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <select
              value={productFilter}
              onChange={(event) =>
                setProductFilter(event.target.value)
              }
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Products</option>

              {filterProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-950"
            >
              <option value="ALL">All Statuses</option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>
          </form>

          {error ? (
            <AlertBox type="error" message={error} />
          ) : null}

          {successMessage ? (
            <AlertBox
              type="success"
              message={successMessage}
            />
          ) : null}

       <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
  <div className="w-full overflow-x-auto">
    <table className="w-full table-fixed divide-y divide-neutral-200 text-sm">
      <thead className="bg-neutral-50">
        <tr>
          <TableHead className="w-[22%]">Product</TableHead>
          <TableHead className="w-[15%]">Unit SKU</TableHead>
          <TableHead className="w-[13%]">Variant</TableHead>
          <TableHead className="w-[13%]">Status</TableHead>
          <TableHead className="w-[13%]">Condition</TableHead>
          <TableHead className="w-[10%]">Booking</TableHead>
          <TableHead className="w-[14%]">Actions</TableHead>
        </tr>
      </thead>

      <tbody className="divide-y divide-neutral-100 bg-white">
        {isLoading ? (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-12 text-center text-sm text-neutral-500"
            >
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Rental units loading...
              </span>
            </td>
          </tr>
        ) : units.length ? (
          units.map((unit) => {
            const isUpdating = updatingUnitId === unit.id;
            const isArchiving = archivingUnitId === unit.id;
            const isDeleting = deletingUnitId === unit.id;

            return (
              <tr
                key={unit.id}
                className="hover:bg-neutral-50/70"
              >
                <TableCell>
                  <div className="min-w-0">
                    <p
                      title={
                        unit.product?.title ||
                        "Product unavailable"
                      }
                      className="line-clamp-2 text-xs font-semibold leading-5 text-neutral-950"
                    >
                      {unit.product?.title ||
                        "Product unavailable"}
                    </p>

                    <p
                      title={unit.product?.sku || ""}
                      className="mt-1 truncate text-[11px] text-neutral-500"
                    >
                      SKU: {unit.product?.sku || "-"}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="min-w-0">
                    <p
                      title={unit.skuCode}
                      className="break-words text-xs font-semibold leading-5 text-neutral-900"
                    >
                      {unit.skuCode}
                    </p>

                    <p
                      title={unit.id}
                      className="mt-1 truncate text-[10px] text-neutral-400"
                    >
                      ID: {unit.id.slice(0, 8)}…
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  {unit.variant ? (
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-800">
                        {[
                          unit.variant.size
                            ? `Size ${unit.variant.size}`
                            : null,
                          unit.variant.color || null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "-"}
                      </p>

                      <p
                        title={unit.variant.sku || ""}
                        className="mt-1 truncate text-[10px] text-neutral-500"
                      >
                        {unit.variant.sku || "-"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-500">
                      Product level
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <select
                    value={unit.status}
                    disabled={
                      isUpdating ||
                      isArchiving ||
                      isDeleting ||
                      !statusOptions.length
                    }
                    onChange={(event) =>
                      void handleStatusChange(
                        unit,
                        event.target
                          .value as RentalInventoryUnitStatus,
                      )
                    }
                    className="h-9 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-2 text-[11px] font-semibold outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  >
                    {!statusOptions.includes(unit.status) ? (
                      <option value={unit.status}>
                        {unit.status}
                      </option>
                    ) : null}

                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </TableCell>

                <TableCell>
                  <select
                    value={unit.condition || ""}
                    disabled={
                      isUpdating ||
                      isArchiving ||
                      isDeleting ||
                      !conditionOptions.length
                    }
                    onChange={(event) => {
                      if (!event.target.value) return;

                      void handleConditionChange(
                        unit,
                        event.target
                          .value as RentalInventoryCondition,
                      );
                    }}
                    className="h-9 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-2 text-[11px] font-semibold outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  >
                    {!unit.condition ? (
                      <option value="">Not set</option>
                    ) : null}

                    {unit.condition &&
                    !conditionOptions.includes(unit.condition) ? (
                      <option value={unit.condition}>
                        {unit.condition}
                      </option>
                    ) : null}

                    {conditionOptions.map((condition) => (
                      <option
                        key={condition}
                        value={condition}
                      >
                        {condition}
                      </option>
                    ))}
                  </select>
                </TableCell>

                <TableCell>
                  {unit.currentBookingId ? (
                    <span
                      title={unit.currentBookingId}
                      className="block truncate text-[10px] font-medium text-neutral-700"
                    >
                      {unit.currentBookingId}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      No booking
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      disabled={
                        unit.status === "LOST" ||
                        isUpdating ||
                        isArchiving ||
                        isDeleting
                      }
                      onClick={() =>
                        void handleMarkLost(unit)
                      }
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isArchiving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Archive className="h-3 w-3" />
                      )}

                      {unit.status === "LOST"
                        ? "Lost"
                        : "Mark Lost"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdating ||
                        isArchiving ||
                        isDeleting
                      }
                      onClick={() =>
                        void handleDeleteUnit(unit)
                      }
                      className="h-8 rounded-lg border border-red-200 bg-red-50 px-2 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </TableCell>
              </tr>
            );
          })
        ) : (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-12 text-center text-sm text-neutral-500"
            >
              No rental inventory units found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total{" "}
              {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() =>
                  void loadRentalUnits(page - 1)
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  isLoading ||
                  page >= (meta.totalPages || 1)
                }
                onClick={() =>
                  void loadRentalUnits(page + 1)
                }
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
    isCreateDrawerOpen
      ? "pointer-events-auto"
      : "pointer-events-none",
  ].join(" ")}
>
  <button
    type="button"
    aria-label="Close create rental unit modal"
    onClick={closeCreateDrawer}
    className={[
      "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ease-out",
      isCreateDrawerOpen
        ? "opacity-100"
        : "opacity-0",
    ].join(" ")}
  />

  <form
    onSubmit={handleCreateRentalUnit}
   className={[
  "relative z-10 max-h-[84vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-[1.75rem] bg-white p-4 shadow-2xl transition-all duration-300 ease-out sm:p-5",
  isCreateDrawerOpen
    ? "translate-y-0 scale-100 opacity-100"
    : "translate-y-4 scale-95 opacity-0",
].join(" ")}
  >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Inventory
              </p>

             <h2 className="mt-1 text-xl font-semibold text-neutral-950">
  Create Rental Unit
</h2>

<p className="mt-1 text-xs text-neutral-500">
  Create one record for each physical rentable item.
</p>
            </div>

            <button
              type="button"
              onClick={closeCreateDrawer}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

       <div className="mt-4 grid gap-4">
            <Field label="Product" required>
           <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5">
  <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_105px]">
                  <input
                    value={productSearch}
                    onChange={(event) =>
                      setProductSearch(event.target.value)
                    }
                    placeholder="Search product by title or SKU..."
                    className="h-10 min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void searchProducts(productSearch)
                    }
                    disabled={isSearchingProducts}
             className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSearchingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </button>
                </div>

                {selectedProduct ? (
                <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                    {selectedProduct.thumbnail ||
                    selectedProduct.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          selectedProduct.thumbnail ||
                          selectedProduct.imageUrl ||
                          ""
                        }
                        alt={selectedProduct.title}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] text-neutral-400">
                        No image
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-950">
                        {selectedProduct.title}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                        SKU: {selectedProduct.sku || "-"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearProduct}
                     className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
               <div className="mt-2 max-h-[190px] overflow-y-auto overflow-x-hidden rounded-xl border border-neutral-200 bg-white">
                    {isSearchingProducts ? (
                      <div className="px-4 py-8 text-center text-sm text-neutral-500">
                        Products loading...
                      </div>
                    ) : productResults.length ? (
                      productResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            void selectProduct(product)
                          }
                          className="flex w-full min-w-0 items-center gap-3 border-b border-neutral-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-neutral-50"
                        >
                          {product.thumbnail ||
                          product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                product.thumbnail ||
                                product.imageUrl ||
                                ""
                              }
                              alt={product.title}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400">
                              No image
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {product.title}
                            </p>

                            <p className="mt-1 truncate text-xs text-neutral-500">
                              SKU: {product.sku || "-"}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-neutral-500">
                        No products found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Variant">
              <select
                value={form.variantId}
                onChange={(event) =>
                  selectVariant(event.target.value)
                }
                disabled={
                  !selectedProduct ||
                  isLoadingVariants
                }
             className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
              >
                <option value="">
                  {!selectedProduct
                    ? "Select product first"
                    : isLoadingVariants
                      ? "Variants loading..."
                      : "Product-level unit — no variant"}
                </option>

                {variants.map((variant) => (
                  <option
                    key={variant.id}
                    value={variant.id}
                  >
                    {[
                      variant.size
                        ? `Size ${variant.size}`
                        : null,
                      variant.color || null,
                      variant.variantSku ||
                        variant.sku ||
                        null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>
            </Field>

            {selectedVariant ? (
              <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-3">
                <p className="text-sm text-neutral-600">
                  Size:{" "}
                  <strong className="text-neutral-950">
                    {selectedVariant.size || "-"}
                  </strong>
                </p>

                <p className="text-sm text-neutral-600">
                  Color:{" "}
                  <strong className="text-neutral-950">
                    {selectedVariant.color || "-"}
                  </strong>
                </p>

                <p className="text-sm text-neutral-600">
                  SKU:{" "}
                  <strong className="text-neutral-950">
                    {selectedVariant.variantSku ||
                      selectedVariant.sku ||
                      "-"}
                  </strong>
                </p>
              </div>
            ) : null}

            <Field label="Physical Unit SKU" required>
              <input
                value={form.skuCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    skuCode: event.target.value,
                  }))
                }
                placeholder={
                  selectedVariant?.variantSku ||
                  selectedVariant?.sku
                    ? `${
                        selectedVariant.variantSku ||
                        selectedVariant.sku
                      }-UNIT-001`
                    : "Example: RENT-DRESS-M-UNIT-001"
                }
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
              />
            </Field>

            <Field label="Condition">
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
                disabled={!conditionOptions.length}
           className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
              >
                {!conditionOptions.length ? (
                  <option value="">
                    Conditions loading...
                  </option>
                ) : null}

                {conditionOptions.map((condition) => (
                  <option
                    key={condition}
                    value={condition}
                  >
                    {condition}
                  </option>
                ))}
              </select>
            </Field>
          </div>

         <div className="sticky bottom-0 -mx-4 mt-4 flex gap-3 border-t border-neutral-200 bg-white px-4 pb-1 pt-3 sm:-mx-5 sm:px-5">
            <button
              type="button"
              onClick={closeCreateDrawer}
           className="h-10 flex-1 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isCreating ||
                !selectedProduct
              }
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}

              {isCreating
                ? "Creating..."
                : "Create Rental Unit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function RentalRequestsTab() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedRequest, setSelectedRequest] =
    useState<RentalRequest | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionRequestId, setActionRequestId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const pendingCount = useMemo(
    () =>
      requests.filter((request) => request.status === "PENDING")
        .length,
    [requests],
  );

  const processedCount = useMemo(
    () =>
      requests.filter((request) => request.status !== "PENDING")
        .length,
    [requests],
  );

  function formatRequestDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function getRequestStatusClass(status: string) {
    switch (status) {
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-800";

      case "ACCEPTED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "DECLINED":
        return "border-red-200 bg-red-50 text-red-700";

      case "COMPLETED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "CANCELLED":
        return "border-neutral-200 bg-neutral-100 text-neutral-600";

      default:
        return "border-neutral-200 bg-neutral-100 text-neutral-600";
    }
  }

  async function loadRentalRequests(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getRentalRequests({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
      });

      setRequests(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setRequests([]);
      setMeta(emptyMeta);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental requests.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await loadRentalRequests(1);
  }

  async function openRequestDetail(request: RentalRequest) {
    try {
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setSelectedRequest(request);
      setError("");

      const detail = await getRentalRequestById(request.id);

      if (!detail) {
        throw new Error("Rental request detail not found.");
      }

      setSelectedRequest(detail);
    } catch (err) {
      setIsDetailOpen(false);
      setSelectedRequest(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental request detail.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeRequestDetail() {
    setIsDetailOpen(false);
    setSelectedRequest(null);
  }

  async function handleAccept(request: RentalRequest) {
    if (request.status !== "PENDING") return;

    const confirmed = window.confirm(
      `Accept rental request "${request.id}"?`,
    );

    if (!confirmed) return;

    try {
      setActionRequestId(request.id);
      setError("");
      setSuccessMessage("");

      const updatedRequest = await acceptRentalRequest(request.id);

      if (updatedRequest) {
        setSelectedRequest((current) =>
          current?.id === updatedRequest.id
            ? updatedRequest
            : current,
        );
      }

      setSuccessMessage(
        "Rental request accepted successfully.",
      );

      await loadRentalRequests(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to accept the rental request.",
      );
    } finally {
      setActionRequestId("");
    }
  }

  async function handleDecline(request: RentalRequest) {
    if (request.status !== "PENDING") return;

    const confirmed = window.confirm(
      `Decline rental request "${request.id}"?`,
    );

    if (!confirmed) return;

    try {
      setActionRequestId(request.id);
      setError("");
      setSuccessMessage("");

      const updatedRequest = await declineRentalRequest(request.id);

      if (updatedRequest) {
        setSelectedRequest((current) =>
          current?.id === updatedRequest.id
            ? updatedRequest
            : current,
        );
      }

      setSuccessMessage(
        "Rental request declined successfully.",
      );

      await loadRentalRequests(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to decline the rental request.",
      );
    } finally {
      setActionRequestId("");
    }
  }

  useEffect(() => {
    void loadRentalRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            label="Total Rental Requests"
            value={meta.total}
          />

          <StatsCard
            label="Pending On This Page"
            value={pendingCount}
          />

          <StatsCard
            label="Processed On This Page"
            value={processedCount}
          />
        </div>

        <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Rental Requests
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Review customer rental requests and accept or decline pending requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRentalRequests(page)}
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

          <form
            onSubmit={handleSearch}
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rental requests..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>
          </form>

          {error ? (
            <AlertBox type="error" message={error} />
          ) : null}

          {successMessage ? (
            <AlertBox
              type="success"
              message={successMessage}
            />
          ) : null}

          <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1050px] table-fixed divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead className="w-[12%]">
                      Request
                    </TableHead>

                    <TableHead className="w-[14%]">
                      Product
                    </TableHead>

                    <TableHead className="w-[14%]">
                      Renter
                    </TableHead>

                    <TableHead className="w-[16%]">
                      Rental Period
                    </TableHead>

                    <TableHead className="w-[16%]">
                      Message
                    </TableHead>

                    <TableHead className="w-[12%]">
                      Status
                    </TableHead>

                    <TableHead className="w-[16%]">
                      Actions
                    </TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rental requests loading...
                        </span>
                      </td>
                    </tr>
                  ) : requests.length ? (
                    requests.map((request) => {
                      const isActing =
                        actionRequestId === request.id;

                      return (
                        <tr
                          key={request.id}
                          className="hover:bg-neutral-50/70"
                        >
                          <TableCell>
                            <p
                              title={request.id}
                              className="truncate text-xs font-semibold text-neutral-950"
                            >
                              {request.id.slice(0, 8)}…
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              {formatRequestDate(request.createdAt)}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={request.productId}
                              className="truncate text-xs font-medium text-neutral-800"
                            >
                              {request.productId}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={request.renterId}
                              className="truncate text-xs font-medium text-neutral-800"
                            >
                              {request.renterId}
                            </p>

                            {request.sellerId ? (
                              <p
                                title={request.sellerId}
                                className="mt-1 truncate text-[10px] text-neutral-500"
                              >
                                Seller: {request.sellerId}
                              </p>
                            ) : null}
                          </TableCell>

                          <TableCell>
                            <p className="text-xs font-medium text-neutral-800">
                              {formatRequestDate(request.startDate)}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              to {formatRequestDate(request.endDate)}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={request.message || ""}
                              className="line-clamp-2 text-xs leading-5 text-neutral-600"
                            >
                              {request.message || "No message"}
                            </p>
                          </TableCell>

                          <TableCell>
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                                getRequestStatusClass(request.status),
                              ].join(" ")}
                            >
                              {request.status}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="grid gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void openRequestDetail(request)
                                }
                                disabled={isActing}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>

                              {request.status === "PENDING" ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleAccept(request)
                                    }
                                    disabled={isActing}
                                    className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? "..." : "Accept"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDecline(request)
                                    }
                                    disabled={isActing}
                                    className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? "..." : "Decline"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        No rental requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total{" "}
              {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() =>
                  void loadRentalRequests(page - 1)
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  isLoading ||
                  page >= (meta.totalPages || 1)
                }
                onClick={() =>
                  void loadRentalRequests(page + 1)
                }
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
          isDetailOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close rental request detail"
          onClick={closeRequestDetail}
          className={[
            "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            isDetailOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
            "relative z-10 max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl transition-all duration-300 sm:p-6",
            isDetailOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-5 scale-95 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Request
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Request Details
              </h2>
            </div>

            <button
              type="button"
              onClick={closeRequestDetail}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDetailLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Request detail loading...
              </span>
            </div>
          ) : selectedRequest ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RequestDetailItem
                  label="Request ID"
                  value={selectedRequest.id}
                />

                <RequestDetailItem
                  label="Status"
                  value={selectedRequest.status}
                />

                <RequestDetailItem
                  label="Product ID"
                  value={selectedRequest.productId}
                />

                <RequestDetailItem
                  label="Renter ID"
                  value={selectedRequest.renterId}
                />

                <RequestDetailItem
                  label="Seller ID"
                  value={selectedRequest.sellerId || "-"}
                />

                <RequestDetailItem
                  label="Created"
                  value={formatRequestDate(
                    selectedRequest.createdAt,
                  )}
                />

                <RequestDetailItem
                  label="Start Date"
                  value={formatRequestDate(
                    selectedRequest.startDate,
                  )}
                />

                <RequestDetailItem
                  label="End Date"
                  value={formatRequestDate(
                    selectedRequest.endDate,
                  )}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Customer Message
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-800">
                  {selectedRequest.message || "No message provided."}
                </p>
              </div>

              {selectedRequest.status === "PENDING" ? (
                <div className="mt-5 grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleDecline(selectedRequest)
                    }
                    disabled={
                      actionRequestId === selectedRequest.id
                    }
                    className="h-11 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Decline Request
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleAccept(selectedRequest)
                    }
                    disabled={
                      actionRequestId === selectedRequest.id
                    }
                    className="h-11 rounded-2xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Accept Request
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RentalBookingsTab() {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);
  const [rentalOptions, setRentalOptions] =
    useState<RentalOptions | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedBooking, setSelectedBooking] =
    useState<RentalBooking | null>(null);

  const [timeline, setTimeline] =
    useState<RentalBookingTimeline | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [actionBookingId, setActionBookingId] = useState("");

  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [returnCondition, setReturnCondition] =
    useState<RentalInventoryCondition>("Good");
  const [returnNotes, setReturnNotes] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status !== "COMPLETED" &&
          booking.status !== "CANCELLED",
      ).length,
    [bookings],
  );

  const completedCount = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.status === "COMPLETED",
      ).length,
    [bookings],
  );

  function formatBookingDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function formatBookingDateTime(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatBookingMoney(
    amount: number,
    currency?: string | null,
  ) {
    const numericAmount = Number(amount || 0);

    if (!currency) {
      return numericAmount.toFixed(2);
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(numericAmount);
    } catch {
      return `${currency} ${numericAmount.toFixed(2)}`;
    }
  }

  function getBookingStatusClass(status: string) {
    switch (status) {
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-800";

      case "RESERVED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "PAID":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "SHIPPED":
        return "border-violet-200 bg-violet-50 text-violet-700";

      case "ACTIVE":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";

      case "RETURNED":
        return "border-orange-200 bg-orange-50 text-orange-700";

      case "CLEANING":
        return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";

      case "COMPLETED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "CANCELLED":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-neutral-200 bg-neutral-100 text-neutral-600";
    }
  }

  async function loadRentalBookingOptions() {
    try {
      const response = await getRentalOptions();

      setRentalOptions(response);

      const firstCondition =
        response.inventoryConditions.find(
          (condition) => condition === "Good",
        ) ||
        response.inventoryConditions[0] ||
        "Good";

      setReturnCondition(
        firstCondition as RentalInventoryCondition,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental booking options.",
      );
    }
  }

  async function loadRentalBookings(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getRentalBookings({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
      });

      setBookings(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setBookings([]);
      setMeta(emptyMeta);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental bookings.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshBookingDetail(bookingId: string) {
    const [detail, timelineResponse] = await Promise.all([
      getRentalBookingById(bookingId),
      getRentalBookingTimeline(bookingId),
    ]);

    if (!detail) {
      throw new Error("Rental booking detail not found.");
    }

    setSelectedBooking(detail);
    setTimeline(timelineResponse);
  }

  async function openBookingDetail(booking: RentalBooking) {
    try {
      setSelectedBooking(booking);
      setTimeline(null);
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setIsReturnFormOpen(false);
      setReturnNotes("");
      setError("");

      await refreshBookingDetail(booking.id);
    } catch (err) {
      setIsDetailOpen(false);
      setSelectedBooking(null);
      setTimeline(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rental booking detail.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeBookingDetail() {
    setIsDetailOpen(false);
    setSelectedBooking(null);
    setTimeline(null);
    setIsReturnFormOpen(false);
    setReturnNotes("");
  }

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await loadRentalBookings(1);
  }

  async function handleBookingStatusChange(
    booking: RentalBooking,
    nextStatus: RentalBookingStatus,
  ) {
    if (nextStatus === booking.status) return;

    const confirmed = window.confirm(
      `Change booking status from ${booking.status} to ${nextStatus}?`,
    );

    if (!confirmed) return;

    try {
      setActionBookingId(booking.id);
      setError("");
      setSuccessMessage("");

      await updateRentalBookingStatus(booking.id, {
        status: nextStatus,
      });

      setSuccessMessage(
        `Rental booking status updated to ${nextStatus}.`,
      );

      await loadRentalBookings(page);

      if (isDetailOpen) {
        await refreshBookingDetail(booking.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update the rental booking status.",
      );
    } finally {
      setActionBookingId("");
    }
  }

  async function handleReturnBooking() {
    if (!selectedBooking) return;

    try {
      setActionBookingId(selectedBooking.id);
      setError("");
      setSuccessMessage("");

      const response = await returnRentalBooking(
        selectedBooking.id,
        {
          condition: returnCondition,
          ...(returnNotes.trim()
            ? { notes: returnNotes.trim() }
            : {}),
        },
      );

      setSuccessMessage(
        response.message ||
          "Rental returned and moved to cleaning.",
      );

      setIsReturnFormOpen(false);
      setReturnNotes("");

      await loadRentalBookings(page);
      await refreshBookingDetail(selectedBooking.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the rental return.",
      );
    } finally {
      setActionBookingId("");
    }
  }

  async function handleCompleteCleaning(
    booking: RentalBooking,
  ) {
    const confirmed = window.confirm(
      `Mark cleaning complete for booking "${booking.id}"?`,
    );

    if (!confirmed) return;

    try {
      setActionBookingId(booking.id);
      setError("");
      setSuccessMessage("");

      const response =
        await completeRentalBookingCleaning(booking.id);

      setSuccessMessage(
        response.message ||
          "Cleaning completed. Inventory is available again.",
      );

      await loadRentalBookings(page);

      if (isDetailOpen) {
        await refreshBookingDetail(booking.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete rental cleaning.",
      );
    } finally {
      setActionBookingId("");
    }
  }

  useEffect(() => {
    void loadRentalBookingOptions();
    void loadRentalBookings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedNextStatuses = selectedBooking
    ? (
        rentalOptions?.validBookingTransitions[
          selectedBooking.status
        ] ?? []
      ).filter(
        (status) =>
          status !== "RETURNED" &&
          status !== "COMPLETED",
      )
    : [];

  const canProcessReturn = selectedBooking
    ? (
        rentalOptions?.validBookingTransitions[
          selectedBooking.status
        ] ?? []
      ).includes("RETURNED")
    : false;

  const canCompleteCleaning =
    selectedBooking?.status === "CLEANING" &&
    (
      rentalOptions?.validBookingTransitions.CLEANING ?? []
    ).includes("COMPLETED");

  const selectedPayment =
    selectedBooking?.payments?.[0] ?? null;

  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            label="Total Rental Bookings"
            value={meta.total}
          />

          <StatsCard
            label="Active On This Page"
            value={activeCount}
          />

          <StatsCard
            label="Completed On This Page"
            value={completedCount}
          />
        </div>

        <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Rental Bookings
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage booking lifecycle, payments, returns and cleaning.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRentalBookings(page)}
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

          <form
            onSubmit={handleSearch}
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search rental bookings..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>
          </form>

          {error ? (
            <AlertBox type="error" message={error} />
          ) : null}

          {successMessage ? (
            <AlertBox
              type="success"
              message={successMessage}
            />
          ) : null}

         <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
  <div className="w-full overflow-x-auto">
    <table className="w-full min-w-[980px] table-fixed divide-y divide-neutral-200 text-sm xl:min-w-0">
      <thead className="bg-neutral-50">
        <tr>
          <TableHead className="w-[16%]">
            Booking / Customer
          </TableHead>

          <TableHead className="w-[17%]">
            Product / Variant
          </TableHead>

          <TableHead className="w-[14%]">
            Rental Period
          </TableHead>

          <TableHead className="w-[19%]">
            Inventory Unit
          </TableHead>

          <TableHead className="w-[14%]">
            Payment / Total
          </TableHead>

          <TableHead className="w-[10%]">
            Status
          </TableHead>

          <TableHead className="w-[10%]">
            Actions
          </TableHead>
        </tr>
      </thead>

      <tbody className="divide-y divide-neutral-100 bg-white">
        {isLoading ? (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-12 text-center text-sm text-neutral-500"
            >
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Rental bookings loading...
              </span>
            </td>
          </tr>
        ) : bookings.length ? (
          bookings.map((booking) => {
            const payment =
              booking.payments?.[0] ?? null;

            const isActing =
              actionBookingId === booking.id;

            return (
              <tr
                key={booking.id}
                className="hover:bg-neutral-50/70"
              >
                <TableCell>
                  <div className="min-w-0">
                    <p
                      title={booking.id}
                      className="truncate text-xs font-semibold text-neutral-950"
                    >
                      {booking.id.slice(0, 8)}…
                    </p>

                    <p className="mt-1 text-[10px] text-neutral-500">
                      {formatBookingDate(
                        booking.createdAt,
                      )}
                    </p>

                    <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                      Customer
                    </p>

                    <p
                      title={booking.userId}
                      className="mt-0.5 truncate text-[10px] text-neutral-600"
                    >
                      {booking.userId}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="min-w-0">
                    <p
                      title={booking.productId}
                      className="truncate text-xs font-semibold text-neutral-900"
                    >
                      {booking.productId}
                    </p>

                    <p
                      title={booking.variantId || ""}
                      className="mt-1 truncate text-[10px] text-neutral-500"
                    >
                      Variant:{" "}
                      {booking.variantId || "-"}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-xs font-medium text-neutral-800">
                    {formatBookingDate(
                      booking.rentalStartDate,
                    )}
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-500">
                    to{" "}
                    {formatBookingDate(
                      booking.rentalEndDate,
                    )}
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    {booking.rentalDays} days
                  </p>
                </TableCell>

                <TableCell>
                  <div className="min-w-0">
                    <p
                      title={
                        booking.inventoryUnit?.skuCode ||
                        booking.inventoryUnitId ||
                        ""
                      }
                      className="truncate text-xs font-semibold text-neutral-800"
                    >
                      {booking.inventoryUnit?.skuCode ||
                        booking.inventoryUnitId ||
                        "Not assigned"}
                    </p>

                    <p className="mt-1 text-[10px] text-neutral-500">
                      {booking.inventoryUnit?.status ||
                        "No unit status"}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-900">
                      {payment?.status ||
                        "No payment"}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-neutral-500">
                      {payment?.paymentType || "-"}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-neutral-950">
                      {formatBookingMoney(
                        booking.total,
                        payment?.currency,
                      )}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      getBookingStatusClass(
                        booking.status,
                      ),
                    ].join(" ")}
                  >
                    {booking.status}
                  </span>
                </TableCell>

                <TableCell>
                  <button
                    type="button"
                    onClick={() =>
                      void openBookingDetail(
                        booking,
                      )
                    }
                    disabled={isActing}
                    className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                </TableCell>
              </tr>
            );
          })
        ) : (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-12 text-center text-sm text-neutral-500"
            >
              No rental bookings found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total{" "}
              {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() =>
                  void loadRentalBookings(page - 1)
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  isLoading ||
                  page >= (meta.totalPages || 1)
                }
                onClick={() =>
                  void loadRentalBookings(page + 1)
                }
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
          isDetailOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close rental booking detail"
          onClick={closeBookingDetail}
          className={[
            "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            isDetailOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
         "relative z-10 max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-white p-4 shadow-2xl transition-all duration-300 sm:p-5",
            isDetailOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-5 scale-95 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Booking
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Booking Details
              </h2>
            </div>

            <button
              type="button"
              onClick={closeBookingDetail}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDetailLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking detail loading...
              </span>
            </div>
          ) : selectedBooking ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RequestDetailItem
                  label="Booking ID"
                  value={selectedBooking.id}
                />

                <RequestDetailItem
                  label="Status"
                  value={selectedBooking.status}
                />

                <RequestDetailItem
                  label="Product ID"
                  value={selectedBooking.productId}
                />

                <RequestDetailItem
                  label="Customer ID"
                  value={selectedBooking.userId}
                />

                <RequestDetailItem
                  label="Variant ID"
                  value={selectedBooking.variantId || "-"}
                />

                <RequestDetailItem
                  label="Inventory Unit"
                  value={
                    selectedBooking.inventoryUnit?.skuCode ||
                    selectedBooking.inventoryUnitId ||
                    "-"
                  }
                />

                <RequestDetailItem
                  label="Rental Start"
                  value={formatBookingDate(
                    selectedBooking.rentalStartDate,
                  )}
                />

                <RequestDetailItem
                  label="Rental End"
                  value={formatBookingDate(
                    selectedBooking.rentalEndDate,
                  )}
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <RequestDetailItem
                  label="Subtotal"
                  value={formatBookingMoney(
                    selectedBooking.subtotal,
                    selectedPayment?.currency,
                  )}
                />

                <RequestDetailItem
                  label="Security Deposit"
                  value={formatBookingMoney(
                    selectedBooking.securityDeposit,
                    selectedPayment?.currency,
                  )}
                />

                <RequestDetailItem
                  label="Premium Surcharge"
                  value={formatBookingMoney(
                    selectedBooking.premiumSurcharge,
                    selectedPayment?.currency,
                  )}
                />

                <RequestDetailItem
                  label="Late Fee"
                  value={formatBookingMoney(
                    selectedBooking.lateFee,
                    selectedPayment?.currency,
                  )}
                />

                <RequestDetailItem
                  label="Damage Fee"
                  value={formatBookingMoney(
                    selectedBooking.damageFee,
                    selectedPayment?.currency,
                  )}
                />

                <RequestDetailItem
                  label="Total"
                  value={formatBookingMoney(
                    selectedBooking.total,
                    selectedPayment?.currency,
                  )}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Payment
                  </p>

                  <p className="mt-3 text-sm font-semibold text-neutral-950">
                    {selectedPayment?.status ||
                      "No payment record"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {selectedPayment?.paymentType || "-"}
                  </p>

                  <p className="mt-2 text-sm text-neutral-800">
                    {selectedPayment
                      ? formatBookingMoney(
                          selectedPayment.amount,
                          selectedPayment.currency,
                        )
                      : "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Inventory Unit
                  </p>

                  <p className="mt-3 text-sm font-semibold text-neutral-950">
                    {selectedBooking.inventoryUnit?.skuCode ||
                      "Not assigned"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Status:{" "}
                    {selectedBooking.inventoryUnit?.status || "-"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Condition:{" "}
                    {selectedBooking.inventoryUnit?.condition ||
                      "-"}
                  </p>
                </div>
              </div>

              {selectedBooking.returns?.length ? (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Return Details
                  </p>

                  {selectedBooking.returns.map(
                    (returnRecord) => (
                      <div
                        key={returnRecord.id}
                        className="mt-3 grid gap-3 sm:grid-cols-2"
                      >
                        <p className="text-sm text-neutral-700">
                          Condition:{" "}
                          <strong className="text-neutral-950">
                            {returnRecord.condition || "-"}
                          </strong>
                        </p>

                        <p className="text-sm text-neutral-700">
                          Received:{" "}
                          <strong className="text-neutral-950">
                            {formatBookingDateTime(
                              returnRecord.receivedAt,
                            )}
                          </strong>
                        </p>

                        <p className="text-sm text-neutral-700">
                          Cleaning Started:{" "}
                          <strong className="text-neutral-950">
                            {formatBookingDateTime(
                              returnRecord.cleaningStartedAt,
                            )}
                          </strong>
                        </p>

                        <p className="text-sm text-neutral-700">
                          Cleaning Completed:{" "}
                          <strong className="text-neutral-950">
                            {formatBookingDateTime(
                              returnRecord.cleaningCompletedAt,
                            )}
                          </strong>
                        </p>

                        <p className="sm:col-span-2 text-sm text-neutral-700">
                          Notes:{" "}
                          <strong className="text-neutral-950">
                            {returnRecord.notes || "-"}
                          </strong>
                        </p>
                      </div>
                    ),
                  )}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Timeline
                </p>

                <div className="mt-4 grid gap-3">
                  {timeline?.events?.length ? (
                    timeline.events.map((event, index) => (
                      <div
                        key={`${event.type}-${event.at}-${index}`}
                        className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {event.type.replaceAll("_", " ")}
                          </p>

                          {event.status ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              Status: {event.status}
                            </p>
                          ) : null}
                        </div>

                        <p className="shrink-0 text-xs text-neutral-500">
                          {formatBookingDateTime(event.at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">
                      No timeline events found.
                    </p>
                  )}
                </div>
              </div>

              {isReturnFormOpen ? (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-orange-900">
                    Process Rental Return
                  </p>

                  <div className="mt-4 grid gap-4">
                    <Field label="Returned Condition" required>
                      <select
                        value={returnCondition}
                        onChange={(event) =>
                          setReturnCondition(
                            event.target
                              .value as RentalInventoryCondition,
                          )
                        }
                        className="h-11 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none transition focus:border-orange-500"
                      >
                        {(
                          rentalOptions?.inventoryConditions ?? []
                        ).map((condition) => (
                          <option
                            key={condition}
                            value={condition}
                          >
                            {condition}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Return Notes">
                      <textarea
                        value={returnNotes}
                        onChange={(event) =>
                          setReturnNotes(event.target.value)
                        }
                        rows={3}
                        placeholder="Add return inspection notes..."
                        className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIsReturnFormOpen(false)
                        }
                        className="h-11 rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleReturnBooking()
                        }
                        disabled={
                          actionBookingId ===
                          selectedBooking.id
                        }
                        className="h-11 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionBookingId ===
                        selectedBooking.id
                          ? "Processing..."
                          : "Confirm Return"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isReturnFormOpen ? (
                <div className="mt-5 grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedNextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        void handleBookingStatusChange(
                          selectedBooking,
                          status as RentalBookingStatus,
                        )
                      }
                      disabled={
                        actionBookingId ===
                        selectedBooking.id
                      }
                      className="h-11 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark as {status}
                    </button>
                  ))}

                  {canProcessReturn ? (
                    <button
                      type="button"
                      onClick={() =>
                        setIsReturnFormOpen(true)
                      }
                      disabled={
                        actionBookingId ===
                        selectedBooking.id
                      }
                      className="h-11 rounded-2xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Process Return
                    </button>
                  ) : null}

                  {canCompleteCleaning ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleCompleteCleaning(
                          selectedBooking,
                        )
                      }
                      disabled={
                        actionBookingId ===
                        selectedBooking.id
                      }
                      className="h-11 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Complete Cleaning
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}


function DamageReportsTab() {
  const [reports, setReports] = useState<RentalDamageReport[]>([]);
  const [bookingOptions, setBookingOptions] = useState<RentalBooking[]>([]);
  const [rentalOptions, setRentalOptions] =
    useState<RentalOptions | null>(null);

  const [meta, setMeta] = useState<InventoryListMeta>(emptyMeta);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createForm, setCreateForm] =
    useState(initialDamageReportForm);

  const [editForm, setEditForm] =
    useState(initialDamageReportEditForm);

  const [selectedReport, setSelectedReport] =
    useState<RentalDamageReport | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionReportId, setActionReportId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const damageStatuses =
    rentalOptions?.damageStatuses ?? [];

  const openCount = useMemo(
    () =>
      reports.filter((report) => report.status === "OPEN").length,
    [reports],
  );

  const processedCount = useMemo(
    () =>
      reports.filter((report) => report.status !== "OPEN").length,
    [reports],
  );

  function formatDamageDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function formatDamageDateTime(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatDamageAmount(value?: number | null) {
    return Number(value || 0).toFixed(2);
  }

  function getDamageStatusClass(status: string) {
    switch (status) {
      case "OPEN":
        return "border-amber-200 bg-amber-50 text-amber-800";

      case "CHARGED":
        return "border-red-200 bg-red-50 text-red-700";

      case "WAIVED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "RESOLVED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      default:
        return "border-neutral-200 bg-neutral-100 text-neutral-600";
    }
  }

  async function loadDamageDependencies() {
    try {
      const [optionsResponse, bookingsResponse] =
        await Promise.all([
          getRentalOptions(),
          getRentalBookings({
            page: 1,
            limit: 100,
          }),
        ]);

      setRentalOptions(optionsResponse);
      setBookingOptions(bookingsResponse.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load damage report dependencies.",
      );
    }
  }

  async function loadDamageReports(nextPage = page) {
    try {
      setIsLoading(true);
      setError("");

      const response = await getRentalDamageReports({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
      });

      setReports(response.data);
      setMeta(response.meta);
      setPage(response.meta.page || nextPage);
    } catch (err) {
      setReports([]);
      setMeta(emptyMeta);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load damage reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDamageDependencies();
    void loadDamageReports(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await loadDamageReports(1);
  }

  function openCreateModal() {
    setCreateForm(initialDamageReportForm);
    setError("");
    setSuccessMessage("");
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setCreateForm(initialDamageReportForm);
  }

  function handleBookingSelection(bookingId: string) {
    const selectedBooking =
      bookingOptions.find((booking) => booking.id === bookingId) ||
      null;

    setCreateForm((current) => ({
      ...current,
      bookingId,
      inventoryUnitId:
        selectedBooking?.inventoryUnitId ||
        selectedBooking?.inventoryUnit?.id ||
        "",
    }));
  }

  async function handleCreateDamageReport(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const bookingId = createForm.bookingId.trim();
    const inventoryUnitId =
      createForm.inventoryUnitId.trim();
    const damageType = createForm.damageType.trim();
    const notes = createForm.notes.trim();

    if (!bookingId) {
      setError("Please select a rental booking.");
      return;
    }

    if (!damageType) {
      setError("Damage type is required.");
      return;
    }

    const repairCost = createForm.repairCost.trim();
    const feeCharged = createForm.feeCharged.trim();

    if (
      repairCost &&
      (!Number.isFinite(Number(repairCost)) ||
        Number(repairCost) < 0)
    ) {
      setError("Repair cost must be a valid non-negative number.");
      return;
    }

    if (
      feeCharged &&
      (!Number.isFinite(Number(feeCharged)) ||
        Number(feeCharged) < 0)
    ) {
      setError("Fee charged must be a valid non-negative number.");
      return;
    }

    const payload: CreateRentalDamageReportPayload = {
      bookingId,
      damageType,
      ...(inventoryUnitId ? { inventoryUnitId } : {}),
      ...(notes ? { notes } : {}),
      ...(repairCost
        ? { repairCost: Number(repairCost) }
        : {}),
      ...(feeCharged
        ? { feeCharged: Number(feeCharged) }
        : {}),
    };

    try {
      setIsCreating(true);

      await createRentalDamageReport(payload);

      closeCreateModal();

      setSuccessMessage(
        "Damage report created successfully.",
      );

      await loadDamageReports(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create the damage report.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function openDamageDetail(
    report: RentalDamageReport,
  ) {
    try {
      setSelectedReport(report);
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setError("");

      const detail = await getRentalDamageReportById(report.id);

      if (!detail) {
        throw new Error("Damage report detail not found.");
      }

      setSelectedReport(detail);

      setEditForm({
        notes: detail.notes || "",
        repairCost: String(detail.repairCost ?? ""),
        feeCharged: String(detail.feeCharged ?? ""),
      });
    } catch (err) {
      setIsDetailOpen(false);
      setSelectedReport(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load damage report detail.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDamageDetail() {
    setIsDetailOpen(false);
    setSelectedReport(null);
    setEditForm(initialDamageReportEditForm);
  }

  async function handleUpdateDamageReport(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedReport) return;

    const repairCost = Number(editForm.repairCost || 0);
    const feeCharged = Number(editForm.feeCharged || 0);

    if (!Number.isFinite(repairCost) || repairCost < 0) {
      setError("Repair cost must be a valid non-negative number.");
      return;
    }

    if (!Number.isFinite(feeCharged) || feeCharged < 0) {
      setError("Fee charged must be a valid non-negative number.");
      return;
    }

    try {
      setIsUpdating(true);
      setError("");
      setSuccessMessage("");
const updatedReport = await updateRentalDamageReport(
  selectedReport.id,
  {
    notes: editForm.notes.trim(),
    repairCost,
    feeCharged,
  },
);

if (!updatedReport) {
  throw new Error(
    "Updated damage report was not returned by the server.",
  );
}

setSelectedReport(updatedReport);

setEditForm({
  notes: updatedReport.notes || "",
  repairCost: String(updatedReport.repairCost ?? ""),
  feeCharged: String(updatedReport.feeCharged ?? ""),
});

    


      setSuccessMessage(
        "Damage report updated successfully.",
      );

      await loadDamageReports(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update the damage report.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDamageStatusChange(
    report: RentalDamageReport,
    nextStatus: RentalDamageStatus,
  ) {
    if (nextStatus === report.status) return;

    const confirmed = window.confirm(
      `Change damage report status from ${report.status} to ${nextStatus}?`,
    );

    if (!confirmed) return;

    try {
      setActionReportId(report.id);
      setError("");
      setSuccessMessage("");

  const updatedReport =
  await updateRentalDamageReportStatus(report.id, {
    status: nextStatus,
  });

if (!updatedReport) {
  throw new Error(
    "Updated damage report status was not returned by the server.",
  );
}

setSelectedReport((current) =>
  current?.id === updatedReport.id
    ? updatedReport
    : current,
);

      setSuccessMessage(
        `Damage report status updated to ${nextStatus}.`,
      );

      await loadDamageReports(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update damage report status.",
      );
    } finally {
      setActionReportId("");
    }
  }

  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            label="Total Damage Reports"
            value={meta.total}
          />

          <StatsCard
            label="Open On This Page"
            value={openCount}
          />

          <StatsCard
            label="Processed On This Page"
            value={processedCount}
          />
        </div>

        <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Damage Reports
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Record rental damage, repair costs, charged fees and resolution status.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Create Damage Report
              </button>

              <button
                type="button"
                onClick={() => void loadDamageReports(page)}
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
            onSubmit={handleSearch}
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search damage reports..."
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>
          </form>

          {error ? (
            <AlertBox type="error" message={error} />
          ) : null}

          {successMessage ? (
            <AlertBox
              type="success"
              message={successMessage}
            />
          ) : null}

          <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[980px] table-fixed divide-y divide-neutral-200 text-sm xl:min-w-0">
                <thead className="bg-neutral-50">
                  <tr>
                    <TableHead className="w-[13%]">
                      Report
                    </TableHead>

                    <TableHead className="w-[18%]">
                      Booking / Customer
                    </TableHead>

                    <TableHead className="w-[18%]">
                      Product / Damage
                    </TableHead>

                    <TableHead className="w-[18%]">
                      Inventory Unit
                    </TableHead>

                    <TableHead className="w-[13%]">
                      Cost / Fee
                    </TableHead>

                    <TableHead className="w-[10%]">
                      Status
                    </TableHead>

                    <TableHead className="w-[10%]">
                      Actions
                    </TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Damage reports loading...
                        </span>
                      </td>
                    </tr>
                  ) : reports.length ? (
                    reports.map((report) => {
                      const isActing =
                        actionReportId === report.id;

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-neutral-50/70"
                        >
                          <TableCell>
                            <p
                              title={report.id}
                              className="truncate text-xs font-semibold text-neutral-950"
                            >
                              {report.id.slice(0, 8)}…
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              {formatDamageDate(report.createdAt)}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={report.bookingId}
                              className="truncate text-xs font-semibold text-neutral-900"
                            >
                              {report.bookingId}
                            </p>

                            <p
                              title={report.booking?.userId || ""}
                              className="mt-1 truncate text-[10px] text-neutral-500"
                            >
                              Customer: {report.booking?.userId || "-"}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={report.booking?.productId || ""}
                              className="truncate text-xs font-semibold text-neutral-900"
                            >
                              {report.booking?.productId || "-"}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-neutral-500">
                              {report.damageType}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p
                              title={report.inventoryUnitId || ""}
                              className="truncate text-xs font-semibold text-neutral-900"
                            >
                              {report.inventoryUnitId || "-"}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              Booking: {report.booking?.status || "-"}
                            </p>
                          </TableCell>

                          <TableCell>
                            <p className="text-xs font-semibold text-neutral-900">
                              Repair:{" "}
                              {formatDamageAmount(report.repairCost)}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              Fee:{" "}
                              {formatDamageAmount(report.feeCharged)}
                            </p>
                          </TableCell>

                          <TableCell>
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                                getDamageStatusClass(report.status),
                              ].join(" ")}
                            >
                              {report.status}
                            </span>
                          </TableCell>

                          <TableCell>
                            <button
                              type="button"
                              onClick={() =>
                                void openDamageDetail(report)
                              }
                              disabled={isActing}
                              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </TableCell>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        No damage reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {meta.page} of {meta.totalPages || 1} · Total{" "}
              {meta.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() =>
                  void loadDamageReports(page - 1)
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  isLoading ||
                  page >= (meta.totalPages || 1)
                }
                onClick={() =>
                  void loadDamageReports(page + 1)
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Damage Report Modal */}
      <div
        className={[
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition",
          isCreateOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close create damage report"
          onClick={closeCreateModal}
          className={[
            "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            isCreateOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <form
          onSubmit={handleCreateDamageReport}
          className={[
            "relative z-10 max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl transition-all duration-300",
            isCreateOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-5 scale-95 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Create Damage Report
              </h2>
            </div>

            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="Rental Booking" required>
              <select
                value={createForm.bookingId}
                onChange={(event) =>
                  handleBookingSelection(event.target.value)
                }
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              >
                <option value="">Select rental booking</option>

                {bookingOptions.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id.slice(0, 8)}… ·{" "}
                    {booking.productId.slice(0, 8)}… ·{" "}
                    {booking.status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Inventory Unit ID">
              <input
                value={createForm.inventoryUnitId}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    inventoryUnitId: event.target.value,
                  }))
                }
                placeholder="Inventory unit ID"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </Field>

            <Field label="Damage Type" required>
              <input
                value={createForm.damageType}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    damageType: event.target.value,
                  }))
                }
                placeholder="Example: zipper_damage"
                className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Repair Cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.repairCost}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      repairCost: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </Field>

              <Field label="Fee Charged">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.feeCharged}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      feeCharged: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                rows={4}
                value={createForm.notes}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add damage inspection notes..."
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950"
              />
            </Field>

            <div className="grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeCreateModal}
                className="h-11 rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                {isCreating ? "Creating..." : "Create Report"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Damage Report Detail Modal */}
      <div
        className={[
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition",
          isDetailOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close damage report detail"
          onClick={closeDamageDetail}
          className={[
            "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            isDetailOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
            "relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl transition-all duration-300",
            isDetailOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-5 scale-95 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Damage Report
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Report Details
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDamageDetail}
              className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDetailLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Damage report loading...
              </span>
            </div>
          ) : selectedReport ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <RequestDetailItem
                  label="Report ID"
                  value={selectedReport.id}
                />

                <RequestDetailItem
                  label="Damage Type"
                  value={selectedReport.damageType}
                />

                <RequestDetailItem
                  label="Booking ID"
                  value={selectedReport.bookingId}
                />

                <RequestDetailItem
                  label="Inventory Unit"
                  value={selectedReport.inventoryUnitId || "-"}
                />

                <RequestDetailItem
                  label="Created"
                  value={formatDamageDateTime(
                    selectedReport.createdAt,
                  )}
                />

                <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </p>

                  <select
                    value={selectedReport.status}
                    disabled={
                      actionReportId === selectedReport.id ||
                      !damageStatuses.length
                    }
                    onChange={(event) =>
                      void handleDamageStatusChange(
                        selectedReport,
                        event.target.value as RentalDamageStatus,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold outline-none focus:border-neutral-950 disabled:opacity-60"
                  >
                    {!damageStatuses.includes(
                      selectedReport.status,
                    ) ? (
                      <option value={selectedReport.status}>
                        {selectedReport.status}
                      </option>
                    ) : null}

                    {damageStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedReport.booking ? (
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Linked Booking
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <RequestDetailItem
                      label="Customer ID"
                      value={selectedReport.booking.userId}
                    />

                    <RequestDetailItem
                      label="Product ID"
                      value={selectedReport.booking.productId}
                    />

                    <RequestDetailItem
                      label="Variant ID"
                      value={
                        selectedReport.booking.variantId || "-"
                      }
                    />

                    <RequestDetailItem
                      label="Rental Start"
                      value={formatDamageDate(
                        selectedReport.booking.rentalStartDate,
                      )}
                    />

                    <RequestDetailItem
                      label="Rental End"
                      value={formatDamageDate(
                        selectedReport.booking.rentalEndDate,
                      )}
                    />

                    <RequestDetailItem
                      label="Booking Status"
                      value={selectedReport.booking.status}
                    />
                  </div>
                </div>
              ) : null}

              <form
                onSubmit={handleUpdateDamageReport}
                className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Update Damage Report
                </p>

                <div className="mt-4 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Repair Cost">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.repairCost}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            repairCost: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                      />
                    </Field>

                    <Field label="Fee Charged">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.feeCharged}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            feeCharged: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
                      />
                    </Field>
                  </div>

                  <Field label="Notes">
                    <textarea
                      rows={4}
                      value={editForm.notes}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}

                    {isUpdating
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
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

    const cleanSearch = searchText.trim();

    const response = await getAdminProductPicker({
      search: cleanSearch || undefined,
      page: 1,
      limit: 50,
    });

    setProductResults(response.items);
  } catch (err) {
    setProductResults([]);

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load products.",
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
            className="flex w-full min-w-0 items-center gap-2.5 border-b border-neutral-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-neutral-50"
                    >
                      {product.thumbnail || product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail || product.imageUrl || ""}
                          alt={product.title}
                         className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[9px] text-neutral-400">
                          No img
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-neutral-950">
                          {product.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
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

function RequestDetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
   <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p
        title={value}
       className="mt-1.5 break-words text-sm font-medium text-neutral-900"
      >
        {value}
      </p>
    </div>
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



"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Archive,
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import {
  archiveRentalSubscriptionPlan,
  createRentalSubscriptionPlan,
  getRentalSubscriptionPlanById,
  getRentalSubscriptionPlans,
  updateRentalSubscriptionPlan,
  type CreateRentalSubscriptionPlanPayload,
  type RentalSubscriptionPlan,
  type UpdateRentalSubscriptionPlanPayload,
} from "@/lib/admin/inventory-api";

const initialCreatePlanForm = {
  name: "",
  price: "",
  currency: "USD",
  itemCreditsPerCycle: "",
  cycle: "MONTHLY",
  pauseAllowed: true,
  cancelAllowed: true,
  swapAllowed: false,
  shippingIncluded: true,
  laundryIncluded: true,
  damagePolicy: "",
  stripePriceId: "",
};

const initialEditPlanForm = {
  ...initialCreatePlanForm,
  refillAllowed: false,
  lateFeePolicy: "",
};

function planToEditForm(plan: RentalSubscriptionPlan) {
  return {
    name: plan.name || "",
    price: String(plan.price ?? ""),
    currency: plan.currency || "USD",
    itemCreditsPerCycle: String(
      plan.itemCreditsPerCycle ?? "",
    ),
    cycle: plan.cycle || "MONTHLY",
    pauseAllowed: Boolean(plan.pauseAllowed),
    cancelAllowed: Boolean(plan.cancelAllowed),
    swapAllowed: Boolean(plan.swapAllowed),
    refillAllowed: Boolean(plan.refillAllowed),
    shippingIncluded: Boolean(plan.shippingIncluded),
    laundryIncluded: Boolean(plan.laundryIncluded),
    damagePolicy: plan.damagePolicy || "",
    lateFeePolicy: plan.lateFeePolicy || "",
    stripePriceId: plan.stripePriceId || "",
  };
}

function formatPlanMoney(
  amount: number,
  currency?: string | null,
) {
  const value = Number(amount || 0);

  if (!currency) return value.toFixed(2);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatPlanDate(value?: string | null) {
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

export function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<
    RentalSubscriptionPlan[]
  >([]);

  const [search, setSearch] = useState("");

  const [selectedPlan, setSelectedPlan] =
    useState<RentalSubscriptionPlan | null>(null);

  const [createForm, setCreateForm] = useState(
    initialCreatePlanForm,
  );

  const [editForm, setEditForm] = useState(
    initialEditPlanForm,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] =
    useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [archivingPlanId, setArchivingPlanId] =
    useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return plans;

    return plans.filter((plan) =>
      [
        plan.id,
        plan.name,
        plan.currency,
        plan.cycle,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [plans, search]);

  const monthlyCount = useMemo(
    () =>
      plans.filter((plan) => plan.cycle === "MONTHLY")
        .length,
    [plans],
  );

  const totalCredits = useMemo(
    () =>
      plans.reduce(
        (total, plan) =>
          total + Number(plan.itemCreditsPerCycle || 0),
        0,
      ),
    [plans],
  );

  async function loadPlans() {
    try {
      setIsLoading(true);
      setError("");

      const response =
        await getRentalSubscriptionPlans();

      setPlans(response);
    } catch (err) {
      setPlans([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription plans.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  function openCreateModal() {
    setCreateForm(initialCreatePlanForm);
    setError("");
    setSuccessMessage("");
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setCreateForm(initialCreatePlanForm);
  }

  async function handleCreatePlan(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const name = createForm.name.trim();
    const currency = createForm.currency.trim();
    const cycle = createForm.cycle.trim();

    const price = Number(createForm.price);
    const credits = Number(
      createForm.itemCreditsPerCycle,
    );

    if (!name) {
      setError("Plan name is required.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Price must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isInteger(credits) ||
      credits <= 0
    ) {
      setError(
        "Item credits per cycle must be a positive whole number.",
      );
      return;
    }

    if (!cycle) {
      setError("Billing cycle is required.");
      return;
    }

    const payload: CreateRentalSubscriptionPlanPayload =
      {
        name,
        price,
        itemCreditsPerCycle: credits,
        ...(currency ? { currency } : {}),
        ...(cycle ? { cycle } : {}),
        pauseAllowed: createForm.pauseAllowed,
        cancelAllowed: createForm.cancelAllowed,
        swapAllowed: createForm.swapAllowed,
        shippingIncluded:
          createForm.shippingIncluded,
        laundryIncluded:
          createForm.laundryIncluded,
        ...(createForm.damagePolicy.trim()
          ? {
              damagePolicy:
                createForm.damagePolicy.trim(),
            }
          : {}),
        stripePriceId:
          createForm.stripePriceId.trim() || null,
      };

    try {
      setIsCreating(true);

      const createdPlan =
        await createRentalSubscriptionPlan(payload);

      if (!createdPlan) {
        throw new Error(
          "Created subscription plan was not returned by the server.",
        );
      }

      closeCreateModal();

      setSuccessMessage(
        "Subscription plan created successfully.",
      );

      await loadPlans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create subscription plan.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function openPlanDetail(
    plan: RentalSubscriptionPlan,
  ) {
    try {
      setSelectedPlan(plan);
      setEditForm(planToEditForm(plan));
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setError("");
      setSuccessMessage("");

      const detail =
        await getRentalSubscriptionPlanById(plan.id);

      if (!detail) {
        throw new Error(
          "Subscription plan detail not found.",
        );
      }

      setSelectedPlan(detail);
      setEditForm(planToEditForm(detail));
    } catch (err) {
      setIsDetailOpen(false);
      setSelectedPlan(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription plan detail.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closePlanDetail() {
    setIsDetailOpen(false);
    setSelectedPlan(null);
    setEditForm(initialEditPlanForm);
  }

  async function handleUpdatePlan(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedPlan) return;

    setError("");
    setSuccessMessage("");

    const name = editForm.name.trim();
    const currency = editForm.currency.trim();
    const cycle = editForm.cycle.trim();

    const price = Number(editForm.price);
    const credits = Number(
      editForm.itemCreditsPerCycle,
    );

    if (!name) {
      setError("Plan name is required.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Price must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isInteger(credits) ||
      credits <= 0
    ) {
      setError(
        "Item credits per cycle must be a positive whole number.",
      );
      return;
    }

    const payload: UpdateRentalSubscriptionPlanPayload =
      {
        name,
        price,
        currency,
        itemCreditsPerCycle: credits,
        cycle,
        pauseAllowed: editForm.pauseAllowed,
        cancelAllowed: editForm.cancelAllowed,
        swapAllowed: editForm.swapAllowed,
        refillAllowed: editForm.refillAllowed,
        shippingIncluded:
          editForm.shippingIncluded,
        laundryIncluded:
          editForm.laundryIncluded,
        damagePolicy:
          editForm.damagePolicy.trim() || null,
        lateFeePolicy:
          editForm.lateFeePolicy.trim() || null,
        stripePriceId:
          editForm.stripePriceId.trim() || null,
      };

    try {
      setIsUpdating(true);

      const updatedPlan =
        await updateRentalSubscriptionPlan(
          selectedPlan.id,
          payload,
        );

      if (!updatedPlan) {
        throw new Error(
          "Updated subscription plan was not returned by the server.",
        );
      }

      setSelectedPlan(updatedPlan);
      setEditForm(planToEditForm(updatedPlan));

      setSuccessMessage(
        "Subscription plan updated successfully.",
      );

      await loadPlans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update subscription plan.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleArchivePlan(
    plan: RentalSubscriptionPlan,
  ) {
    const confirmed = window.confirm(
      `Archive subscription plan "${plan.name}"?`,
    );

    if (!confirmed) return;

    try {
      setArchivingPlanId(plan.id);
      setError("");
      setSuccessMessage("");

      const archivedPlan =
        await archiveRentalSubscriptionPlan(plan.id);

      if (!archivedPlan) {
        throw new Error(
          "Archived subscription plan was not returned by the server.",
        );
      }

      if (selectedPlan?.id === plan.id) {
        closePlanDetail();
      }

      setSuccessMessage(
        "Subscription plan archived successfully.",
      );

      await loadPlans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive subscription plan.",
      );
    } finally {
      setArchivingPlanId("");
    }
  }

  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <PlanStatsCard
            label="Active Subscription Plans"
            value={plans.length}
          />

          <PlanStatsCard
            label="Monthly Plans"
            value={monthlyCount}
          />

          <PlanStatsCard
            label="Total Credits Per Cycle"
            value={totalCredits}
          />
        </div>

        <div className="min-w-0 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Rental Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Subscription Plans
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage subscription pricing, item credits,
                included services and rental policies.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Create Subscription Plan
              </button>

              <button
                type="button"
                onClick={() => void loadPlans()}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
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

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subscription plans..."
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-neutral-950"
            />
          </div>

          {error ? (
            <PlanAlert type="error" message={error} />
          ) : null}

          {successMessage ? (
            <PlanAlert
              type="success"
              message={successMessage}
            />
          ) : null}

          <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1050px] table-fixed divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <PlanTableHead className="w-[23%]">
                      Plan
                    </PlanTableHead>

                    <PlanTableHead className="w-[14%]">
                      Price
                    </PlanTableHead>

                    <PlanTableHead className="w-[15%]">
                      Cycle / Credits
                    </PlanTableHead>

                    <PlanTableHead className="w-[25%]">
                      Included Benefits
                    </PlanTableHead>

                    <PlanTableHead className="w-[10%]">
                      Status
                    </PlanTableHead>

                    <PlanTableHead className="w-[13%]">
                      Actions
                    </PlanTableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Subscription plans loading...
                        </span>
                      </td>
                    </tr>
                  ) : filteredPlans.length ? (
                    filteredPlans.map((plan) => {
                      const isArchiving =
                        archivingPlanId === plan.id;

                      const benefits = [
                        plan.pauseAllowed
                          ? "Pause"
                          : null,
                        plan.cancelAllowed
                          ? "Cancel"
                          : null,
                        plan.swapAllowed
                          ? "Swap"
                          : null,
                        plan.refillAllowed
                          ? "Refill"
                          : null,
                        plan.shippingIncluded
                          ? "Shipping"
                          : null,
                        plan.laundryIncluded
                          ? "Laundry"
                          : null,
                      ].filter(Boolean);

                      return (
                        <tr
                          key={plan.id}
                          className="hover:bg-neutral-50/70"
                        >
                          <PlanTableCell>
                            <p className="truncate text-xs font-semibold text-neutral-950">
                              {plan.name}
                            </p>

                            <p
                              title={plan.id}
                              className="mt-1 truncate text-[10px] text-neutral-500"
                            >
                              ID: {plan.id}
                            </p>
                          </PlanTableCell>

                          <PlanTableCell>
                            <p className="text-sm font-semibold text-neutral-950">
                              {formatPlanMoney(
                                plan.price,
                                plan.currency,
                              )}
                            </p>
                          </PlanTableCell>

                          <PlanTableCell>
                            <p className="text-xs font-semibold text-neutral-900">
                              {plan.cycle}
                            </p>

                            <p className="mt-1 text-[10px] text-neutral-500">
                              {plan.itemCreditsPerCycle} item
                              credits
                            </p>
                          </PlanTableCell>

                          <PlanTableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {benefits.length ? (
                                benefits.map((benefit) => (
                                  <span
                                    key={benefit}
                                    className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[9px] font-semibold text-neutral-600"
                                  >
                                    {benefit}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  No included benefits
                                </span>
                              )}
                            </div>
                          </PlanTableCell>

                          <PlanTableCell>
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                              ACTIVE
                            </span>
                          </PlanTableCell>

                          <PlanTableCell>
                            <div className="grid gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void openPlanDetail(plan)
                                }
                                disabled={isArchiving}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View / Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleArchivePlan(plan)
                                }
                                disabled={isArchiving}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                              >
                                {isArchiving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Archive className="h-3.5 w-3.5" />
                                )}
                                Archive
                              </button>
                            </div>
                          </PlanTableCell>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-neutral-500"
                      >
                        No subscription plans found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-5 text-sm text-neutral-500">
            Showing {filteredPlans.length} of {plans.length} active
            plans
          </p>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close create subscription plan"
            onClick={closeCreateModal}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          <form
            onSubmit={handleCreatePlan}
            className="relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6"
          >
            <PlanModalHeader
              eyebrow="Rental Management"
              title="Create Subscription Plan"
              onClose={closeCreateModal}
            />

            {error ? (
              <PlanAlert type="error" message={error} />
            ) : null}

            <PlanFormFields
              form={createForm}
              setForm={setCreateForm}
              includeUpdateOnlyFields={false}
            />

            <div className="mt-6 grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-2">
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

                {isCreating
                  ? "Creating..."
                  : "Create Plan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isDetailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close subscription plan detail"
            onClick={closePlanDetail}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">
            <PlanModalHeader
              eyebrow="Subscription Plan"
              title="Plan Details"
              onClose={closePlanDetail}
            />

            {isDetailLoading ? (
              <div className="flex min-h-72 items-center justify-center">
                <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subscription plan loading...
                </span>
              </div>
            ) : selectedPlan ? (
              <>
                {error ? (
                  <PlanAlert type="error" message={error} />
                ) : null}

                {successMessage ? (
                  <PlanAlert
                    type="success"
                    message={successMessage}
                  />
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <PlanInfoItem
                    label="Plan ID"
                    value={selectedPlan.id}
                  />

                  <PlanInfoItem
                    label="Status"
                    value={
                      selectedPlan.isActive
                        ? "ACTIVE"
                        : "INACTIVE"
                    }
                  />

                  <PlanInfoItem
                    label="Created"
                    value={formatPlanDate(
                      selectedPlan.createdAt,
                    )}
                  />

                  <PlanInfoItem
                    label="Last Updated"
                    value={formatPlanDate(
                      selectedPlan.updatedAt,
                    )}
                  />
                </div>

                <form onSubmit={handleUpdatePlan}>
                  <PlanFormFields
                    form={editForm}
                    setForm={setEditForm}
                    includeUpdateOnlyFields
                  />

                  <div className="mt-6 grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        void handleArchivePlan(
                          selectedPlan,
                        )
                      }
                      disabled={
                        archivingPlanId === selectedPlan.id
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-800 disabled:opacity-60"
                    >
                      <Archive className="h-4 w-4" />
                      Archive Plan
                    </button>

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
      ) : null}
    </section>
  );
}

type CreatePlanFormState =
  typeof initialCreatePlanForm;

type EditPlanFormState =
  typeof initialEditPlanForm;

function PlanFormFields<
  T extends CreatePlanFormState | EditPlanFormState,
>({
  form,
  setForm,
  includeUpdateOnlyFields,
}: {
  form: T;
  setForm: React.Dispatch<
    React.SetStateAction<T>
  >;
  includeUpdateOnlyFields: boolean;
}) {
  return (
    <div className="mt-5 grid gap-4">
      <PlanField label="Plan Name" required>
        <input
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Basic Monthly"
          className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
        />
      </PlanField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanField label="Price" required>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                price: event.target.value,
              }))
            }
            className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
          />
        </PlanField>

        <PlanField label="Currency">
          <input
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency:
                  event.target.value.toUpperCase(),
              }))
            }
            maxLength={3}
            placeholder="USD"
            className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
          />
        </PlanField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanField
          label="Item Credits Per Cycle"
          required
        >
          <input
            type="number"
            min="1"
            step="1"
            value={form.itemCreditsPerCycle}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                itemCreditsPerCycle:
                  event.target.value,
              }))
            }
            className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
          />
        </PlanField>

        <PlanField label="Cycle" required>
          <input
            value={form.cycle}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cycle:
                  event.target.value.toUpperCase(),
              }))
            }
            placeholder="MONTHLY"
            className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
          />
        </PlanField>
      </div>

      <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
        <PlanToggle
          label="Pause Allowed"
          checked={form.pauseAllowed}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              pauseAllowed: checked,
            }))
          }
        />

        <PlanToggle
          label="Cancel Allowed"
          checked={form.cancelAllowed}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              cancelAllowed: checked,
            }))
          }
        />

        <PlanToggle
          label="Swap Allowed"
          checked={form.swapAllowed}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              swapAllowed: checked,
            }))
          }
        />

        {includeUpdateOnlyFields &&
        "refillAllowed" in form ? (
          <PlanToggle
            label="Refill Allowed"
            checked={form.refillAllowed}
            onChange={(checked) =>
              setForm((current) => ({
                ...current,
                refillAllowed: checked,
              }))
            }
          />
        ) : null}

        <PlanToggle
          label="Shipping Included"
          checked={form.shippingIncluded}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              shippingIncluded: checked,
            }))
          }
        />

        <PlanToggle
          label="Laundry Included"
          checked={form.laundryIncluded}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              laundryIncluded: checked,
            }))
          }
        />
      </div>

      <PlanField label="Damage Policy">
        <textarea
          rows={3}
          value={form.damagePolicy}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              damagePolicy: event.target.value,
            }))
          }
          placeholder="Describe damage charges and coverage..."
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950"
        />
      </PlanField>

      {includeUpdateOnlyFields &&
      "lateFeePolicy" in form ? (
        <PlanField label="Late Fee Policy">
          <textarea
            rows={3}
            value={form.lateFeePolicy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lateFeePolicy: event.target.value,
              }))
            }
            placeholder="Describe late return charges..."
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950"
          />
        </PlanField>
      ) : null}

      <PlanField label="Stripe Price ID">
        <input
          value={form.stripePriceId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              stripePriceId: event.target.value,
            }))
          }
          placeholder="Leave blank until Stripe price is configured"
          className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-950"
        />
      </PlanField>
    </div>
  );
}

function PlanToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700">
      {label}

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 accent-neutral-950"
      />
    </label>
  );
}

function PlanField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-neutral-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function PlanModalHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-600"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function PlanStatsCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function PlanInfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function PlanAlert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={[
        "mt-5 rounded-2xl border px-4 py-3 text-sm",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function PlanTableHead({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 ${className}`}
    >
      {children}
    </th>
  );
}

function PlanTableCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="min-w-0 px-4 py-4 align-top">
      {children}
    </td>
  );
}
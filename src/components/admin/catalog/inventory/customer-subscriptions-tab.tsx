"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarClock,
  Eye,
  Loader2,
  Pause,
  Plus,
  RefreshCcw,
  Search,
  SkipForward,
  ArrowUpRight,
  X,
} from "lucide-react";

import {
  createCustomerSubscription,
  getCustomerSubscriptionById,
  getCustomerSubscriptions,
  getSubscriptionAdminPlans,
  pauseCustomerSubscription,
  skipCustomerSubscriptionCycle,
  upgradeCustomerSubscription,
  retryCustomerSubscriptionBilling,
  forecastSubscriptionInventory,
  type CustomerSubscription,
  type CustomerSubscriptionStatus,
  type CreateCustomerSubscriptionPayload,
  type SubscriptionAdminPlan,
  type SubscriptionPaginationMeta,
  type SubscriptionProrationMode,
  type SubscriptionBillingRetryMode,
  type SubscriptionInventoryForecast,
} from "@/lib/admin/inventory-api";

const PAGE_LIMIT = 20;

const subscriptionStatuses: CustomerSubscriptionStatus[] =
  [
    "ACTIVE",
    "PAUSED",
    "SKIPPED",
    "PAYMENT_FAILED",
    "CANCELLED",
    "EXPIRED",
  ];

const initialCreateForm = {
  customerId: "",
  planId: "",
  status: "ACTIVE" as CustomerSubscriptionStatus,
  startDate: "",
  nextBillingDate: "",
  shippingAddressId: "",
  paymentMethodId: "",
  notes: "",
};

const initialPauseForm = {
  reason: "",
  pauseUntil: "",
  note: "",
};

const initialSkipForm = {
  cycleDate: "",
  reason: "",
  note: "",
};

const initialUpgradeForm = {
  newPlanId: "",
  effectiveFrom: "",
  prorationMode:
    "NEXT_CYCLE" as SubscriptionProrationMode,
  note: "",
};

const initialBillingRetryForm = {
  paymentIntentId: "",
  retryMode:
    "MANUAL" as SubscriptionBillingRetryMode,
  note: "",
};

const initialForecastForm = {
  from: "",
  to: "",
  planIds: [] as string[],
};

function dateInputToIso(value: string) {
  const parsed = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date selected.");
  }

  return parsed.toISOString();
}

function dateInputToEndOfDayIso(value: string) {
  const parsed = new Date(
    `${value}T23:59:59.999Z`,
  );

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid end date selected.");
  }

  return parsed.toISOString();
}

function formatSubscriptionDate(
  value?: string | null,
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

return new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(date);
}

function formatSubscriptionDateTime(
  value?: string | null,
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSubscriptionMoney(
  amount: string | number,
  currency: string,
) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function getStatusClass(
  status: CustomerSubscriptionStatus,
) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "SKIPPED":
      return "border-sky-200 bg-sky-50 text-sky-700";

    case "PAYMENT_FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "CANCELLED":
    case "EXPIRED":
      return "border-neutral-300 bg-neutral-100 text-neutral-600";

    default:
      return "border-neutral-200 bg-white text-neutral-700";
  }
}

export function CustomerSubscriptionsTab() {
  const [subscriptions, setSubscriptions] =
    useState<CustomerSubscription[]>([]);

  const [plans, setPlans] = useState<
    SubscriptionAdminPlan[]
  >([]);

  const [meta, setMeta] =
    useState<SubscriptionPaginationMeta>({
      total: 0,
      page: 1,
      limit: PAGE_LIMIT,
      totalPages: 0,
    });

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] =
    useState("");

  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"" | CustomerSubscriptionStatus>("");

  const [planFilter, setPlanFilter] =
    useState("");

  const [selectedSubscription, setSelectedSubscription] =
    useState<CustomerSubscription | null>(null);

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isDetailOpen, setIsDetailOpen] =
    useState(false);
const [isForecastOpen, setIsForecastOpen] =
  useState(false);

const [actionMode, setActionMode] = useState<
  | "pause"
  | "skip"
  | "upgrade"
  | "billingRetry"
  | null
>(null);

  const [createForm, setCreateForm] =
    useState(initialCreateForm);

  const [pauseForm, setPauseForm] =
    useState(initialPauseForm);

  const [skipForm, setSkipForm] =
    useState(initialSkipForm);

    const [upgradeForm, setUpgradeForm] =
  useState(initialUpgradeForm);

  const [
  billingRetryForm,
  setBillingRetryForm,
] = useState(initialBillingRetryForm);


const [forecastForm, setForecastForm] =
  useState(initialForecastForm);

const [forecastResult, setForecastResult] =
  useState<SubscriptionInventoryForecast | null>(
    null,
  );

const [isForecastLoading, setIsForecastLoading] =
  useState(false);

const [forecastError, setForecastError] =
  useState("");

const [forecastSuccess, setForecastSuccess] =
  useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isDetailLoading, setIsDetailLoading] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isActionLoading, setIsActionLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const activeCount = useMemo(
    () =>
      subscriptions.filter(
        (item) => item.status === "ACTIVE",
      ).length,
    [subscriptions],
  );

  const pausedCount = useMemo(
    () =>
      subscriptions.filter(
        (item) => item.status === "PAUSED",
      ).length,
    [subscriptions],
  );

  const skippedCount = useMemo(
    () =>
      subscriptions.filter(
        (item) => item.status === "SKIPPED",
      ).length,
    [subscriptions],
  );

  const loadPlans = useCallback(async () => {
    try {
      const response =
        await getSubscriptionAdminPlans({
          page: 1,
          limit: 100,
          status: "ACTIVE",
        });

      setPlans(response.items);
    } catch (err) {
      setPlans([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription plans.",
      );
    }
  }, []);

  const loadSubscriptions = useCallback(
    async (targetPage = page) => {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await getCustomerSubscriptions({
            page: targetPage,
            limit: PAGE_LIMIT,
            search:
              appliedSearch || undefined,
            status:
              statusFilter || undefined,
            planId:
              planFilter || undefined,
          });

        setSubscriptions(response.items);
        setMeta(response.meta);
      } catch (err) {
        setSubscriptions([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customer subscriptions.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      appliedSearch,
      page,
      planFilter,
      statusFilter,
    ],
  );

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadSubscriptions(page);
  }, [loadSubscriptions, page]);

  async function reloadSelectedSubscription(
    subscriptionId: string,
  ) {
    const detail =
      await getCustomerSubscriptionById(
        subscriptionId,
      );

    if (!detail) {
      throw new Error(
        "Customer subscription detail not found.",
      );
    }

    setSelectedSubscription(detail);
  }

  async function openSubscriptionDetail(
    subscription: CustomerSubscription,
  ) {
    try {
      setSelectedSubscription(subscription);
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setActionMode(null);
      setPauseForm(initialPauseForm);
      setSkipForm(initialSkipForm);
      setUpgradeForm(initialUpgradeForm);
      setBillingRetryForm(initialBillingRetryForm);
      
      
      setError("");
      setSuccessMessage("");

      await reloadSelectedSubscription(
        subscription.id,
      );
    } catch (err) {
      setIsDetailOpen(false);
      setSelectedSubscription(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription detail.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeSubscriptionDetail() {
    setIsDetailOpen(false);
    setSelectedSubscription(null);
    setActionMode(null);
    setPauseForm(initialPauseForm);
    setSkipForm(initialSkipForm);
    setUpgradeForm(initialUpgradeForm);
  }

  async function handleCreateSubscription(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const customerId =
      createForm.customerId.trim();

    const planId = createForm.planId.trim();

    if (!customerId) {
      setError("Customer ID is required.");
      return;
    }

    if (!planId) {
      setError("Subscription plan is required.");
      return;
    }

    if (!createForm.startDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setIsCreating(true);

      const payload: CreateCustomerSubscriptionPayload =
        {
          customerId,
          planId,
          status: createForm.status,
          startDate: dateInputToIso(
            createForm.startDate,
          ),
          ...(createForm.nextBillingDate
            ? {
                nextBillingDate:
                  dateInputToIso(
                    createForm.nextBillingDate,
                  ),
              }
            : {}),
          ...(createForm.shippingAddressId.trim()
            ? {
                shippingAddressId:
                  createForm.shippingAddressId.trim(),
              }
            : {}),
          ...(createForm.paymentMethodId.trim()
            ? {
                paymentMethodId:
                  createForm.paymentMethodId.trim(),
              }
            : {}),
          ...(createForm.notes.trim()
            ? {
                notes: createForm.notes.trim(),
              }
            : {}),
          metadata: {
            source: "admin-panel",
          },
        };

      const created =
        await createCustomerSubscription(payload);

      if (!created) {
        throw new Error(
          "Created subscription was not returned by the server.",
        );
      }

      setIsCreateOpen(false);
      setCreateForm(initialCreateForm);

      setSuccessMessage(
        "Customer subscription created successfully.",
      );

      setPage(1);
      await loadSubscriptions(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer subscription.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handlePauseSubscription(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedSubscription) return;

    const reason = pauseForm.reason.trim();

    if (!reason) {
      setError("Pause reason is required.");
      return;
    }

    try {
      setIsActionLoading(true);
      setError("");
      setSuccessMessage("");

      await pauseCustomerSubscription(
        selectedSubscription.id,
        {
          reason,
          ...(pauseForm.pauseUntil
            ? {
                pauseUntil:
                  dateInputToIso(
                    pauseForm.pauseUntil,
                  ),
              }
            : {}),
          ...(pauseForm.note.trim()
            ? {
                note: pauseForm.note.trim(),
              }
            : {}),
        },
      );

      await reloadSelectedSubscription(
        selectedSubscription.id,
      );

      await loadSubscriptions(page);

      setActionMode(null);
      setPauseForm(initialPauseForm);

      setSuccessMessage(
        "Subscription paused successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to pause subscription.",
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleSkipSubscription(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedSubscription) return;

    const reason = skipForm.reason.trim();

    if (!skipForm.cycleDate) {
      setError("Cycle date is required.");
      return;
    }

    if (!reason) {
      setError("Skip reason is required.");
      return;
    }

    try {
      setIsActionLoading(true);
      setError("");
      setSuccessMessage("");

      await skipCustomerSubscriptionCycle(
        selectedSubscription.id,
        {
          cycleDate: dateInputToIso(
            skipForm.cycleDate,
          ),
          reason,
          ...(skipForm.note.trim()
            ? {
                note: skipForm.note.trim(),
              }
            : {}),
        },
      );

      await reloadSelectedSubscription(
        selectedSubscription.id,
      );

      await loadSubscriptions(page);

      setActionMode(null);
      setSkipForm(initialSkipForm);

      setSuccessMessage(
        "Subscription cycle skipped successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to skip subscription cycle.",
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleUpgradeSubscription(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!selectedSubscription) return;

  const newPlanId =
    upgradeForm.newPlanId.trim();

  if (!newPlanId) {
    setError("New subscription plan is required.");
    return;
  }

  if (
    newPlanId === selectedSubscription.planId
  ) {
    setError(
      "Please select a different subscription plan.",
    );
    return;
  }

  if (!upgradeForm.effectiveFrom) {
    setError("Effective date is required.");
    return;
  }

  try {
    setIsActionLoading(true);
    setError("");
    setSuccessMessage("");

    const updated =
      await upgradeCustomerSubscription(
        selectedSubscription.id,
        {
          newPlanId,
          effectiveFrom: dateInputToIso(
            upgradeForm.effectiveFrom,
          ),
          prorationMode:
            upgradeForm.prorationMode,
          ...(upgradeForm.note.trim()
            ? {
                note: upgradeForm.note.trim(),
              }
            : {}),
        },
      );

    if (!updated) {
      throw new Error(
        "Updated subscription was not returned by the server.",
      );
    }

    await reloadSelectedSubscription(
      selectedSubscription.id,
    );

    await loadSubscriptions(page);

    setActionMode(null);
    setUpgradeForm(initialUpgradeForm);

    setSuccessMessage(
      "Subscription plan changed successfully.",
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to change subscription plan.",
    );
  } finally {
    setIsActionLoading(false);
  }
}

async function handleBillingRetry(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!selectedSubscription) return;

  if (
    selectedSubscription.status !==
    "PAYMENT_FAILED"
  ) {
    setError(
      "Billing retry is only available for payment failed subscriptions.",
    );
    return;
  }

  try {
    setIsActionLoading(true);
    setError("");
    setSuccessMessage("");

    const attempt =
      await retryCustomerSubscriptionBilling({
        subscriptionId:
          selectedSubscription.id,
        retryMode:
          billingRetryForm.retryMode,
        ...(billingRetryForm.paymentIntentId.trim()
          ? {
              paymentIntentId:
                billingRetryForm.paymentIntentId.trim(),
            }
          : {}),
        ...(billingRetryForm.note.trim()
          ? {
              note: billingRetryForm.note.trim(),
            }
          : {}),
      });

    if (!attempt) {
      throw new Error(
        "Billing retry attempt was not returned by the server.",
      );
    }

    await reloadSelectedSubscription(
      selectedSubscription.id,
    );

    await loadSubscriptions(page);

    setActionMode(null);
    setBillingRetryForm(
      initialBillingRetryForm,
    );

    setSuccessMessage(
      "Billing retry queued successfully.",
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to queue billing retry.",
    );
  } finally {
    setIsActionLoading(false);
  }
}

async function handleInventoryForecast(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!forecastForm.from) {
    setForecastError("From date is required.");
    return;
  }

  if (!forecastForm.to) {
    setForecastError("To date is required.");
    return;
  }

  if (
    new Date(forecastForm.to).getTime() <
    new Date(forecastForm.from).getTime()
  ) {
    setForecastError(
      "To date cannot be before From date.",
    );
    return;
  }

  try {
    setIsForecastLoading(true);
    setForecastError("");
    setForecastSuccess("");

    const result =
      await forecastSubscriptionInventory({
        from: dateInputToIso(
          forecastForm.from,
        ),
        to: dateInputToEndOfDayIso(
          forecastForm.to,
        ),
        ...(forecastForm.planIds.length
          ? {
              planIds: forecastForm.planIds,
            }
          : {}),
      });

    if (!result) {
      throw new Error(
        "Inventory forecast was not returned by the server.",
      );
    }

    setForecastResult(result);

    setForecastSuccess(
      "Inventory forecast generated successfully.",
    );
  } catch (err) {
    setForecastResult(null);

    setForecastError(
      err instanceof Error
        ? err.message
        : "Failed to generate inventory forecast.",
    );
  } finally {
    setIsForecastLoading(false);
  }
}

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);
    setAppliedSearch(searchInput.trim());
  }

  return (
    <section className="min-w-0">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Customer Subscriptions"
          value={meta.total}
        />

        <StatCard
          label="Active On This Page"
          value={activeCount}
        />

        <StatCard
          label="Paused On This Page"
          value={pausedCount}
        />

        <StatCard
          label="Skipped On This Page"
          value={skippedCount}
        />
      </div>

      <div className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Subscription Management
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
              Customer Subscriptions
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Assign plans, review billing cycles and
              manage pause or skip actions.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
  type="button"
  onClick={() => {
    setForecastForm(initialForecastForm);
    setForecastResult(null);
    setForecastError("");
    setForecastSuccess("");
    setIsForecastOpen(true);

    void loadPlans();
  }}
  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800"
>
  <CalendarClock className="h-4 w-4" />
  Inventory Forecast
</button>
            <button
              type="button"
              onClick={() => {
                setCreateForm(initialCreateForm);
                setError("");
                setSuccessMessage("");
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Assign Subscription
            </button>

            <button
              type="button"
              onClick={() =>
                void loadSubscriptions(page)
              }
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 disabled:opacity-50"
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
          className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_260px_120px]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search subscription number or customer..."
              className="h-12 w-full rounded-2xl border border-neutral-200 pl-11 pr-4 text-sm outline-none focus:border-neutral-950"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(
                event.target.value as
                  | ""
                  | CustomerSubscriptionStatus,
              );
            }}
            className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
          >
            <option value="">All Statuses</option>

            {subscriptionStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}
          </select>

          <select
            value={planFilter}
            onChange={(event) => {
              setPage(1);
              setPlanFilter(event.target.value);
            }}
            className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
          >
            <option value="">All Plans</option>

            {plans.map((plan) => (
              <option
                key={plan.id}
                value={plan.id}
              >
                {plan.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>

        {error ? (
          <Alert type="error" message={error} />
        ) : null}

        {successMessage ? (
          <Alert
            type="success"
            message={successMessage}
          />
        ) : null}

        <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <TableHead className="w-[18%]">
                    Subscription
                  </TableHead>

                  <TableHead className="w-[17%]">
                    Customer
                  </TableHead>

                  <TableHead className="w-[21%]">
                    Plan
                  </TableHead>

                  <TableHead className="w-[17%]">
                    Current Cycle
                  </TableHead>

                  <TableHead className="w-[13%]">
                    Next Billing
                  </TableHead>

                  <TableHead className="w-[8%]">
                    Status
                  </TableHead>

                  <TableHead className="w-[6%]">
                    Action
                  </TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-neutral-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Customer subscriptions loading...
                      </span>
                    </td>
                  </tr>
                ) : subscriptions.length ? (
                  subscriptions.map(
                    (subscription) => (
                      <tr
                        key={subscription.id}
                        className="hover:bg-neutral-50/70"
                      >
                        <TableCell>
                          <p className="truncate font-semibold text-neutral-950">
                            {
                              subscription.subscriptionNumber
                            }
                          </p>

                          <p className="mt-1 truncate text-[10px] text-neutral-500">
                            {subscription.id}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="truncate text-xs font-medium text-neutral-800">
                            {subscription.customerId}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="truncate font-semibold text-neutral-950">
                            {subscription.plan?.name ||
                              subscription.planId}
                          </p>

                          <p className="mt-1 text-[10px] text-neutral-500">
                            {subscription.plan
                              ? formatSubscriptionMoney(
                                  subscription.plan.price,
                                  subscription.plan
                                    .currency,
                                )
                              : "-"}
                            {" · "}
                            {subscription.plan
                              ?.billingInterval || "-"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs text-neutral-800">
                            {formatSubscriptionDate(
                              subscription.currentCycleStart,
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-neutral-500">
                            to{" "}
                            {formatSubscriptionDate(
                              subscription.currentCycleEnd,
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs font-medium text-neutral-800">
                            {formatSubscriptionDate(
                              subscription.nextBillingDate,
                            )}
                          </p>
                        </TableCell>

                        <TableCell>
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold",
                              getStatusClass(
                                subscription.status,
                              ),
                            ].join(" ")}
                          >
                            {subscription.status}
                          </span>
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            onClick={() =>
                              void openSubscriptionDetail(
                                subscription,
                              )
                            }
                            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 text-[10px] font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </TableCell>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-neutral-500"
                    >
                      No customer subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            Page {meta.page} of{" "}
            {Math.max(meta.totalPages, 1)} · Total{" "}
            {meta.total}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              className="rounded-2xl border border-neutral-200 px-5 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                page >= meta.totalPages ||
                isLoading ||
                meta.totalPages === 0
              }
              onClick={() =>
                setPage((current) => current + 1)
              }
              className="rounded-2xl border border-neutral-200 px-5 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isForecastOpen ? (
  <ModalShell
    title="Subscription Inventory Forecast"
    eyebrow="Subscription Management"
    onClose={() => {
      setIsForecastOpen(false);
      setForecastForm(initialForecastForm);
      setForecastResult(null);
      setForecastError("");
      setForecastSuccess("");
    }}
  >
    <form
      onSubmit={handleInventoryForecast}
      className="mt-5 grid gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From Date" required>
          <input
            type="date"
            value={forecastForm.from}
            onChange={(event) =>
              setForecastForm((current) => ({
                ...current,
                from: event.target.value,
              }))
            }
            className="form-control"
          />
        </Field>

        <Field label="To Date" required>
          <input
            type="date"
            value={forecastForm.to}
            onChange={(event) =>
              setForecastForm((current) => ({
                ...current,
                to: event.target.value,
              }))
            }
            className="form-control"
          />
        </Field>
      </div>

      <div>
        <p className="text-sm font-semibold text-neutral-700">
          Subscription Plans
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Leave all plans unchecked to include every
          active subscription plan.
        </p>

        <div className="mt-3 grid max-h-64 gap-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
          {plans.length ? (
            plans.map((plan) => {
              const isSelected =
                forecastForm.planIds.includes(
                  plan.id,
                );

              return (
                <label
                  key={plan.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setForecastForm(
                        (current) => ({
                          ...current,
                          planIds: isSelected
                            ? current.planIds.filter(
                                (id) =>
                                  id !== plan.id,
                              )
                            : [
                                ...current.planIds,
                                plan.id,
                              ],
                        }),
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span className="min-w-0">
                    <span className="block font-semibold text-neutral-950">
                      {plan.name}
                    </span>

                    <span className="mt-1 block text-xs text-neutral-500">
                      {plan.billingInterval}
                      {" · "}
                      {plan.itemsPerCycle} items per
                      cycle
                    </span>
                  </span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500">
              No active subscription plans found.
            </p>
          )}
        </div>
      </div>

      {forecastError ? (
        <Alert
          type="error"
          message={forecastError}
        />
      ) : null}

      {forecastSuccess ? (
        <Alert
          type="success"
          message={forecastSuccess}
        />
      ) : null}

      <button
        type="submit"
        disabled={isForecastLoading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isForecastLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CalendarClock className="h-4 w-4" />
        )}

        {isForecastLoading
          ? "Generating Forecast..."
          : "Generate Inventory Forecast"}
      </button>
    </form>

    {forecastResult ? (
      <div className="mt-6 grid gap-5 border-t border-neutral-200 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Total Subscriptions"
            value={String(
              forecastResult.totalSubscriptions,
            )}
          />

          <InfoCard
            label="Total Items Required"
            value={String(
              forecastResult.totalItemsRequired,
            )}
          />

          <InfoCard
            label="Plans Included"
            value={String(
              forecastResult.byPlan.length,
            )}
          />

          <InfoCard
            label="Forecast Run ID"
            value={forecastResult.forecastRunId}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="Forecast From"
            value={formatSubscriptionDate(
              forecastResult.from,
            )}
          />

          <InfoCard
            label="Forecast To"
            value={formatSubscriptionDate(
              forecastResult.to,
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-950">
            Plan Requirements
          </h3>

          <div className="mt-3 grid gap-4">
            {forecastResult.byPlan.length ? (
              forecastResult.byPlan.map(
                (planForecast) => (
                  <div
                    key={planForecast.planId}
                    className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-neutral-950">
                          {planForecast.planName}
                        </p>

                        <p className="mt-1 text-sm text-neutral-500">
                          {
                            planForecast.billingInterval
                          }
                        </p>
                      </div>

                      <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        {
                          planForecast.itemsRequired
                        }{" "}
                        items required
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoCard
                        label="Subscriptions"
                        value={String(
                          planForecast.subscriptions,
                        )}
                      />

                      <InfoCard
                        label="Items Per Cycle"
                        value={String(
                          planForecast.itemsPerCycle,
                        )}
                      />

                      <InfoCard
                        label="Eligible Products"
                        value={String(
                          planForecast
                            .eligibleProductIds.length,
                        )}
                      />

                      <InfoCard
                        label="Eligible Categories"
                        value={String(
                          planForecast
                            .eligibleCategoryIds.length,
                        )}
                      />
                    </div>
                  </div>
                ),
              )
            ) : (
              <p className="text-sm text-neutral-500">
                No subscription inventory requirement
                was found for this date range.
              </p>
            )}
          </div>
        </div>
      </div>
    ) : null}
  </ModalShell>
) : null}

      {isCreateOpen ? (
        <ModalShell
          title="Assign Customer Subscription"
          eyebrow="Subscription Management"
          onClose={() => setIsCreateOpen(false)}
        >
          <form
            onSubmit={handleCreateSubscription}
            className="mt-5 grid gap-4"
          >
            <Field label="Customer ID" required>
              <input
                value={createForm.customerId}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    customerId:
                      event.target.value,
                  }))
                }
                className="form-control"
              />
            </Field>

            <Field
              label="Subscription Plan"
              required
            >
              <select
                value={createForm.planId}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    planId: event.target.value,
                  }))
                }
                className="form-control"
              >
                <option value="">
                  Select active plan
                </option>

                {plans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name} —{" "}
                    {formatSubscriptionMoney(
                      plan.price,
                      plan.currency,
                    )}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      status:
                        event.target
                          .value as CustomerSubscriptionStatus,
                    }))
                  }
                  className="form-control"
                >
                  {subscriptionStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field label="Start Date" required>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      startDate:
                        event.target.value,
                    }))
                  }
                  className="form-control"
                />
              </Field>
            </div>

            <Field label="Next Billing Date">
              <input
                type="date"
                value={
                  createForm.nextBillingDate
                }
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    nextBillingDate:
                      event.target.value,
                  }))
                }
                className="form-control"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping Address ID">
                <input
                  value={
                    createForm.shippingAddressId
                  }
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      shippingAddressId:
                        event.target.value,
                    }))
                  }
                  className="form-control"
                />
              </Field>

              <Field label="Payment Method ID">
                <input
                  value={
                    createForm.paymentMethodId
                  }
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      paymentMethodId:
                        event.target.value,
                    }))
                  }
                  className="form-control"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                rows={3}
                value={createForm.notes}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="form-control py-3"
              />
            </Field>

            {error ? (
              <Alert
                type="error"
                message={error}
              />
            ) : null}

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {isCreating
                ? "Assigning..."
                : "Assign Subscription"}
            </button>
          </form>
        </ModalShell>
      ) : null}

      {isDetailOpen ? (
        <ModalShell
          title="Customer Subscription Details"
          eyebrow="Subscription Management"
          onClose={closeSubscriptionDetail}
        >
          {isDetailLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : selectedSubscription ? (
            <div className="mt-5 grid gap-5">
              {error ? (
                <Alert
                  type="error"
                  message={error}
                />
              ) : null}

              {successMessage ? (
                <Alert
                  type="success"
                  message={successMessage}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  label="Subscription Number"
                  value={
                    selectedSubscription.subscriptionNumber
                  }
                />

                <InfoCard
                  label="Status"
                  value={selectedSubscription.status}
                />

                <InfoCard
                  label="Customer ID"
                  value={
                    selectedSubscription.customerId
                  }
                />

                <InfoCard
                  label="Plan"
                  value={
                    selectedSubscription.plan.name
                  }
                />

                <InfoCard
                  label="Current Cycle"
                  value={`${formatSubscriptionDate(
                    selectedSubscription.currentCycleStart,
                  )} → ${formatSubscriptionDate(
                    selectedSubscription.currentCycleEnd,
                  )}`}
                />

                <InfoCard
                  label="Next Billing"
                  value={formatSubscriptionDate(
                    selectedSubscription.nextBillingDate,
                  )}
                />

                <InfoCard
                  label="Paused Until"
                  value={formatSubscriptionDate(
                    selectedSubscription.pausedUntil,
                  )}
                />

                <InfoCard
                  label="Created"
                  value={formatSubscriptionDateTime(
                    selectedSubscription.createdAt,
                  )}
                />
              </div>

              {selectedSubscription.notes ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Subscription Notes
                  </p>

                  <p className="mt-2 text-sm text-neutral-800">
                    {selectedSubscription.notes}
                  </p>
                </div>
              ) : null}

              {selectedSubscription.status ===
              "ACTIVE" ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedSubscription.plan
                    .allowPause ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActionMode(
                          actionMode === "pause"
                            ? null
                            : "pause",
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-800"
                    >
                      <Pause className="h-4 w-4" />
                      Pause Subscription
                    </button>
                  ) : null}

                  {selectedSubscription.plan
                    .allowSkip ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActionMode(
                          actionMode === "skip"
                            ? null
                            : "skip",
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-800"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip Cycle
                    </button>
                  ) : null}

               <button
  type="button"
  onClick={() => {
    setError("");
    setSuccessMessage("");

    void loadPlans();

    setUpgradeForm({
      newPlanId: "",
      effectiveFrom:
        selectedSubscription.currentCycleEnd.slice(
          0,
          10,
        ),
      prorationMode: "NEXT_CYCLE",
      note: "",
    });

    setActionMode(
      actionMode === "upgrade"
        ? null
        : "upgrade",
    );
  }}
  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-800"
>
  <ArrowUpRight className="h-4 w-4" />
  Change Plan
</button>
                </div>
              ) : null}

              {selectedSubscription.status ===
"PAYMENT_FAILED" ? (
  <button
    type="button"
    onClick={() => {
      setError("");
      setSuccessMessage("");

      setBillingRetryForm(
        initialBillingRetryForm,
      );

      setActionMode(
        actionMode === "billingRetry"
          ? null
          : "billingRetry",
      );
    }}
    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
  >
    <RefreshCcw className="h-4 w-4" />
    Retry Billing
  </button>
) : null}

              {actionMode === "pause" ? (
                <form
                  onSubmit={
                    handlePauseSubscription
                  }
                  className="grid gap-4 rounded-3xl border border-amber-200 bg-amber-50/40 p-4"
                >
                  <h3 className="font-semibold">
                    Pause Subscription
                  </h3>

                  <Field
                    label="Reason"
                    required
                  >
                    <input
                      value={pauseForm.reason}
                      onChange={(event) =>
                        setPauseForm(
                          (current) => ({
                            ...current,
                            reason:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control"
                    />
                  </Field>

                  <Field label="Pause Until">
                    <input
                      type="date"
                      value={
                        pauseForm.pauseUntil
                      }
                      onChange={(event) =>
                        setPauseForm(
                          (current) => ({
                            ...current,
                            pauseUntil:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control"
                    />
                  </Field>

                  <Field label="Action Note">
                    <textarea
                      rows={3}
                      value={pauseForm.note}
                      onChange={(event) =>
                        setPauseForm(
                          (current) => ({
                            ...current,
                            note:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control py-3"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="h-11 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirm Pause
                  </button>
                </form>
              ) : null}

              {actionMode === "skip" ? (
                <form
                  onSubmit={
                    handleSkipSubscription
                  }
                  className="grid gap-4 rounded-3xl border border-sky-200 bg-sky-50/40 p-4"
                >
                  <h3 className="font-semibold">
                    Skip Subscription Cycle
                  </h3>

                  <Field
                    label="Cycle Date"
                    required
                  >
                    <input
                      type="date"
                      value={skipForm.cycleDate}
                      onChange={(event) =>
                        setSkipForm(
                          (current) => ({
                            ...current,
                            cycleDate:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control"
                    />
                  </Field>

                  <Field
                    label="Reason"
                    required
                  >
                    <input
                      value={skipForm.reason}
                      onChange={(event) =>
                        setSkipForm(
                          (current) => ({
                            ...current,
                            reason:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control"
                    />
                  </Field>

                  <Field label="Action Note">
                    <textarea
                      rows={3}
                      value={skipForm.note}
                      onChange={(event) =>
                        setSkipForm(
                          (current) => ({
                            ...current,
                            note:
                              event.target.value,
                          }),
                        )
                      }
                      className="form-control py-3"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="h-11 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirm Skip
                  </button>
                </form>
              ) : null}

                            {actionMode === "upgrade" ? (
                <form
                  onSubmit={handleUpgradeSubscription}
                  className="grid gap-4 rounded-3xl border border-violet-200 bg-violet-50/40 p-4"
                >
                  <div>
                    <h3 className="font-semibold text-neutral-950">
                      Change Subscription Plan
                    </h3>

                    <p className="mt-1 text-sm text-neutral-600">
                      Current plan:{" "}
                      {selectedSubscription.plan.name}
                    </p>
                  </div>

                  <Field
                    label="New Subscription Plan"
                    required
                  >
                    <select
                      value={upgradeForm.newPlanId}
                      onChange={(event) =>
                        setUpgradeForm((current) => ({
                          ...current,
                          newPlanId:
                            event.target.value,
                        }))
                      }
                      className="form-control"
                    >
                      <option value="">
                        Select a different active plan
                      </option>

                      {plans
                        .filter(
                          (plan) =>
                            plan.id !==
                            selectedSubscription.planId,
                        )
                        .map((plan) => (
                          <option
                            key={plan.id}
                            value={plan.id}
                          >
                            {plan.name} —{" "}
                            {formatSubscriptionMoney(
                              plan.price,
                              plan.currency,
                            )}{" "}
                            — {plan.itemsPerCycle} items
                          </option>
                        ))}
                    </select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Effective From"
                      required
                    >
                      <input
                        type="date"
                        value={
                          upgradeForm.effectiveFrom
                        }
                        onChange={(event) =>
                          setUpgradeForm(
                            (current) => ({
                              ...current,
                              effectiveFrom:
                                event.target.value,
                            }),
                          )
                        }
                        className="form-control"
                      />
                    </Field>

                    <Field label="Proration Mode">
                      <select
                        value={
                          upgradeForm.prorationMode
                        }
                        onChange={(event) =>
                          setUpgradeForm(
                            (current) => ({
                              ...current,
                              prorationMode:
                                event.target
                                  .value as SubscriptionProrationMode,
                            }),
                          )
                        }
                        className="form-control"
                      >
                        <option value="NEXT_CYCLE">
                          Next Cycle
                        </option>

                        <option value="IMMEDIATE">
                          Immediate
                        </option>

                        <option value="NONE">
                          No Proration
                        </option>
                      </select>
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-white p-4 text-sm text-neutral-600">
                    {upgradeForm.prorationMode ===
                    "NEXT_CYCLE" ? (
                      <p>
                        The selected plan will apply
                        from the next subscription
                        cycle.
                      </p>
                    ) : null}

                    {upgradeForm.prorationMode ===
                    "IMMEDIATE" ? (
                      <p>
                        The selected plan will apply
                        immediately. Price adjustment
                        will follow backend proration
                        rules.
                      </p>
                    ) : null}

                    {upgradeForm.prorationMode ===
                    "NONE" ? (
                      <p>
                        The plan will change without a
                        prorated price adjustment.
                      </p>
                    ) : null}
                  </div>

                  <Field label="Action Note">
                    <textarea
                      rows={3}
                      value={upgradeForm.note}
                      onChange={(event) =>
                        setUpgradeForm((current) => ({
                          ...current,
                          note: event.target.value,
                        }))
                      }
                      placeholder="Add an internal note for this plan change."
                      className="form-control py-3"
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}

                    {isActionLoading
                      ? "Changing Plan..."
                      : "Confirm Plan Change"}
                  </button>
                </form>
              ) : null}

              {actionMode === "billingRetry" ? (
  <form
    onSubmit={handleBillingRetry}
    className="grid gap-4 rounded-3xl border border-red-200 bg-red-50/40 p-4"
  >
    <div>
      <h3 className="font-semibold text-neutral-950">
        Retry Subscription Billing
      </h3>

      <p className="mt-1 text-sm text-neutral-600">
        Queue another billing attempt for{" "}
        {
          selectedSubscription.subscriptionNumber
        }
        .
      </p>
    </div>

    <Field label="Payment Intent ID">
      <input
        value={
          billingRetryForm.paymentIntentId
        }
        onChange={(event) =>
          setBillingRetryForm((current) => ({
            ...current,
            paymentIntentId:
              event.target.value,
          }))
        }
        placeholder="Optional Stripe payment intent ID"
        className="form-control"
      />
    </Field>

    <Field label="Retry Mode">
      <select
        value={billingRetryForm.retryMode}
        onChange={(event) =>
          setBillingRetryForm((current) => ({
            ...current,
            retryMode:
              event.target
                .value as SubscriptionBillingRetryMode,
          }))
        }
        className="form-control"
      >
        <option value="MANUAL">
          Manual
        </option>

        <option value="AUTO">
          Automatic
        </option>
      </select>
    </Field>

    <Field label="Action Note">
      <textarea
        rows={3}
        value={billingRetryForm.note}
        onChange={(event) =>
          setBillingRetryForm((current) => ({
            ...current,
            note: event.target.value,
          }))
        }
        placeholder="Add an internal note for this billing retry."
        className="form-control py-3"
      />
    </Field>

    <button
      type="submit"
      disabled={isActionLoading}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-semibold text-white disabled:opacity-50"
    >
      {isActionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}

      {isActionLoading
        ? "Queueing Retry..."
        : "Queue Billing Retry"}
    </button>
  </form>
) : null}

<div>
  <div className="flex items-center gap-2">
    <CalendarClock className="h-5 w-5 text-neutral-500" />

    <h3 className="text-lg font-semibold">
      Billing Attempts
    </h3>
  </div>

  <div className="mt-3 grid gap-3">
    {selectedSubscription.billingAttempts
      ?.length ? (
      selectedSubscription.billingAttempts.map(
        (attempt) => (
          <div
            key={attempt.id}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-neutral-950">
                    Billing Retry
                  </p>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    {attempt.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-neutral-600">
                  {attempt.note || "-"}
                </p>
              </div>

              <span className="text-xs text-neutral-500">
                {formatSubscriptionDateTime(
                  attempt.createdAt,
                )}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard
                label="Attempt ID"
                value={attempt.id}
              />

              <InfoCard
                label="Retry Mode"
                value={attempt.retryMode}
              />

              <InfoCard
                label="Payment Intent ID"
                value={
                  attempt.paymentIntentId || "-"
                }
              />

              <InfoCard
                label="Processed At"
                value={formatSubscriptionDateTime(
                  attempt.processedAt,
                )}
              />
            </div>
          </div>
        ),
      )
    ) : (
      <p className="text-sm text-neutral-500">
        No billing attempts available.
      </p>
    )}
  </div>
</div>

              <div>
                <h3 className="text-lg font-semibold">
                  Action Timeline
                </h3>

                <div className="mt-3 grid gap-3">
                  {selectedSubscription.actionLogs
                    ?.length ? (
                    selectedSubscription.actionLogs.map(
                      (log) => (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-neutral-950">
                                {log.title}
                              </p>

                              <p className="mt-1 text-sm text-neutral-600">
                                {log.description ||
                                  "-"}
                              </p>
                            </div>

                            <span className="text-xs text-neutral-500">
                              {formatSubscriptionDateTime(
                                log.createdAt,
                              )}
                            </span>
                          </div>

                          {log.metadata ? (
                            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-[11px] text-neutral-600">
                              {JSON.stringify(
                                log.metadata,
                                null,
                                2,
                              )}
                            </pre>
                          ) : null}
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-neutral-500">
                      No action logs available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </ModalShell>
      ) : null}

      <style jsx global>{`
        .form-control {
          height: 44px;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(229 229 229);
          background: white;
          padding-left: 1rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          outline: none;
        }

        textarea.form-control {
          height: auto;
        }

        .form-control:focus {
          border-color: rgb(10 10 10);
        }
      `}</style>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-neutral-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function Alert({
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

function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="min-w-0 px-4 py-4 align-top">
      {children}
    </td>
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

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function InfoCard({
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

function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">
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
            className="rounded-2xl border border-neutral-200 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
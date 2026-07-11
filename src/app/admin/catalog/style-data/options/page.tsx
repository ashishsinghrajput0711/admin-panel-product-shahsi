"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit3,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  activateCatalogStyleDataOptionValue,
  archiveCatalogStyleDataOptionValue,
  createCatalogStyleDataOptionValue,
  deactivateCatalogStyleDataOptionValue,
  deleteCatalogStyleDataOptionValue,
  getCatalogStyleDataOptionValues,
  reorderCatalogStyleDataOptionValues,
  restoreCatalogStyleDataOptionValue,
  updateCatalogStyleDataOptionValue,
  type CatalogStyleDataOptionStatus,
  type CatalogStyleDataOptionValue,
  type CatalogStyleDataOptionValuesListParams,
} from "@/lib/admin/catalog-style-data-option-values-api";

type OptionFilters = {
  search: string;
  group: string;
  status: CatalogStyleDataOptionStatus | "";
};

type ModalMode = "create" | "edit" | null;

type OptionFormState = {
  group: string;
  value: string;
  label: string;
  description: string;
  position: string;
};

type OptionAction =
  | "activate"
  | "deactivate"
  | "archive"
  | "restore"
  | "delete";

const emptyForm: OptionFormState = {
  group: "",
  value: "",
  label: "",
  description: "",
  position: "",
};

export default function StyleDataOptionsPage() {
  const [items, setItems] = useState<CatalogStyleDataOptionValue[]>([]);
  const [supportedGroups, setSupportedGroups] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<
    CatalogStyleDataOptionStatus[]
  >([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<OptionFilters>({
    search: "",
    group: "",
    status: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionId, setActionId] = useState("");
  const [actionType, setActionType] = useState<OptionAction | "">("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState("");
  const [formValues, setFormValues] =
    useState<OptionFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const queryParams =
    useMemo<CatalogStyleDataOptionValuesListParams>(
      () => ({
        page,
        limit,
        search: filters.search,
        group: filters.group,
        status: filters.status,
      }),
      [filters, limit, page],
    );

  const canReorder =
    Boolean(filters.group) &&
    !filters.search.trim() &&
    !filters.status &&
    totalPages === 1 &&
    items.length > 1;

  async function loadOptionValues() {
    try {
      setIsLoading(true);
      setError("");

      const result = await getCatalogStyleDataOptionValues(queryParams);

      setItems(result.items || []);
      setSupportedGroups(result.supportedGroups || []);
      setStatuses(result.statuses || []);

      setTotal(result.meta?.total || 0);
      setTotalPages(Math.max(1, result.meta?.totalPages || 1));
      setIsOrderDirty(false);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Style Data option values load failed.",
      );

      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setIsOrderDirty(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOptionValues();
  }, [queryParams]);

  function updateFilter(
    key: keyof OptionFilters,
    value: string,
  ) {
    setPage(1);
    setIsOrderDirty(false);

    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setPage(1);
    setIsOrderDirty(false);

    setFilters({
      search: "",
      group: "",
      status: "",
    });
  }

  function openCreateModal() {
    const defaultGroup =
      filters.group || supportedGroups[0] || "";

    setEditingId("");
    setFormValues({
      ...emptyForm,
      group: defaultGroup,
    });

    setError("");
    setModalMode("create");
  }

  function openEditModal(item: CatalogStyleDataOptionValue) {
    setEditingId(item.id);

    setFormValues({
      group: item.group,
      value: item.value,
      label: item.label,
      description: item.description || "",
      position: String(item.position),
    });

    setError("");
    setModalMode("edit");
  }

  function closeModal() {
    if (isSubmitting) return;

    setModalMode(null);
    setEditingId("");
    setFormValues(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const group = formValues.group.trim();
    const value = formValues.value.trim();
    const label = formValues.label.trim();
    const description = formValues.description.trim();
    const positionText = formValues.position.trim();

    if (!group) {
      setError("Option group select karo.");
      return;
    }

    if (modalMode === "create" && !value) {
      setError("Option value required hai.");
      return;
    }

    if (!label) {
      setError("Option label required hai.");
      return;
    }

    let position: number | undefined;

    if (positionText) {
      position = Number(positionText);

      if (!Number.isInteger(position) || position <= 0) {
        setError("Position positive whole number hona chahiye.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (modalMode === "create") {
        await createCatalogStyleDataOptionValue({
          group,
          value,
          label,
          ...(description ? { description } : {}),
          ...(position !== undefined ? { position } : {}),
        });
      } else {
        if (!editingId) {
          throw new Error("Editing option ID missing hai.");
        }

        await updateCatalogStyleDataOptionValue(editingId, {
          label,
          description,
          ...(position !== undefined ? { position } : {}),
        });
      }

      closeModal();
      await loadOptionValues();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Option save failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOptionAction(
    item: CatalogStyleDataOptionValue,
    action: OptionAction,
  ) {
    if (action === "archive") {
      const confirmed = window.confirm(
        `"${item.label}" option ko archive karna hai? Historical references preserve rahenge.`,
      );

      if (!confirmed) return;
    }

    if (action === "delete") {
      if (item.usageCount > 0) {
        setError(
          `"${item.label}" ${item.usageCount} jagah use ho raha hai. Delete ke badle deactivate ya archive karo.`,
        );
        return;
      }

      const confirmed = window.confirm(
        `"${item.label}" option permanently delete karna hai? Ye action undo nahi hoga.`,
      );

      if (!confirmed) return;
    }

    try {
      setActionId(item.id);
      setActionType(action);
      setError("");

      if (action === "activate") {
        await activateCatalogStyleDataOptionValue(item.id);
      }

      if (action === "deactivate") {
        await deactivateCatalogStyleDataOptionValue(item.id);
      }

      if (action === "archive") {
        await archiveCatalogStyleDataOptionValue(item.id);
      }

      if (action === "restore") {
        await restoreCatalogStyleDataOptionValue(item.id);
      }

      if (action === "delete") {
        await deleteCatalogStyleDataOptionValue(item.id);
      }

      await loadOptionValues();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Option ${action} failed.`,
      );
    } finally {
      setActionId("");
      setActionType("");
    }
  }

  function moveOption(index: number, direction: "up" | "down") {
    if (!canReorder) return;

    const targetIndex =
      direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      const currentItem = next[index];

      next[index] = next[targetIndex];
      next[targetIndex] = currentItem;

      return next.map((item, itemIndex) => ({
        ...item,
        position: itemIndex + 1,
      }));
    });

    setIsOrderDirty(true);
  }

  async function handleSaveOrder() {
    if (!filters.group || !canReorder || !isOrderDirty) return;

    try {
      setIsSavingOrder(true);
      setError("");

      await reorderCatalogStyleDataOptionValues({
        group: filters.group,
        items: items.map((item, index) => ({
          id: item.id,
          position: index + 1,
        })),
      });

      await loadOptionValues();
    } catch (orderError) {
      setError(
        orderError instanceof Error
          ? orderError.message
          : "Option order save failed.",
      );
    } finally {
      setIsSavingOrder(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <section className="mb-6 rounded-[2rem] bg-neutral-950 p-8 text-white">
        <Link
          href="/admin/catalog/style-data"
          className="inline-flex items-center text-sm text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Style Data
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Admin / Catalog / Style Data / Options
            </p>

            <h1 className="mt-3 text-5xl font-medium tracking-tight">
              Manage Style Options
            </h1>

            <p className="mt-4 max-w-3xl text-white/70">
              Occasion, season, color family, fabric feel, neckline,
              sleeve type, silhouette and modesty level values manage
              karo. Active values Style Data aur Style Rules dono mein
              automatically available hongi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={loadOptionValues}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>

            <Button
              type="button"
              className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
              onClick={openCreateModal}
              disabled={
                isLoading || supportedGroups.length === 0
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Option
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Options" value={total} />

        <SummaryCard
          label="Visible Records"
          value={items.length}
        />

        <SummaryCard
          label="Supported Groups"
          value={supportedGroups.length}
        />

        <SummaryCard
          label="Current Page"
          value={page}
        />
      </section>

      <Card className="mb-6 rounded-[1.5rem] border-neutral-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-2xl font-medium text-neutral-950">
              Filters
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Search, group aur status ke basis par option values filter
              karo.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-950"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Search value, label or description..."
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf6] pl-11 pr-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
            />
          </div>

          <select
            value={filters.group}
            onChange={(event) =>
              updateFilter("group", event.target.value)
            }
            className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
          >
            <option value="">All groups</option>

            {supportedGroups.map((group) => (
              <option key={group} value={group}>
                {formatLabel(group)}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter("status", event.target.value)
            }
            className="h-12 rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
          >
            <option value="">All statuses</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {filters.group ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="font-medium text-blue-900">
                {formatLabel(filters.group)} ordering
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Reorder ke liye search aur status filters clear hone
                chahiye aur selected group ek hi page mein load hona
                chahiye.
              </p>
            </div>

            <Button
              type="button"
              className="rounded-full"
              onClick={handleSaveOrder}
              disabled={
                !canReorder ||
                !isOrderDirty ||
                isSavingOrder
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingOrder ? "Saving Order..." : "Save Order"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        {isLoading ? (
          <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            Loading Style Data options...
          </Card>
        ) : items.length === 0 ? (
          <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-10 text-center">
            <h3 className="text-xl font-medium text-neutral-950">
              No options found
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Filters change karo ya new option create karo.
            </p>
          </Card>
        ) : (
          items.map((item, index) => {
            const isActionLoading = actionId === item.id;

            return (
              <Card
                key={item.id}
                className="rounded-[1.5rem] border-neutral-200 bg-white p-5"
              >
                <div className="flex flex-col justify-between gap-5 xl:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs font-medium text-neutral-600">
                        {formatLabel(item.group)}
                      </span>

                      <StatusBadge status={item.status} />

                      <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
                        Position {item.position}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-medium text-neutral-950">
                      {item.label}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      Stored value:{" "}
                      <span className="font-medium text-neutral-700">
                        {item.value}
                      </span>
                    </p>

                    {item.description ? (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">
                        No description added.
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <UsageBox
                        label="Total Usage"
                        value={item.usageCount}
                      />

                      <UsageBox
                        label="Style Data"
                        value={item.styleDataUsageCount}
                      />

                      <UsageBox
                        label="Style Rules"
                        value={item.styleRuleUsageCount}
                      />
                    </div>

                    <p className="mt-4 text-xs text-neutral-400">
                      Updated {formatDate(item.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-[330px]">
                    {canReorder ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full"
                          disabled={index === 0 || isSavingOrder}
                          onClick={() => moveOption(index, "up")}
                        >
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Move Up
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full"
                          disabled={
                            index === items.length - 1 ||
                            isSavingOrder
                          }
                          onClick={() => moveOption(index, "down")}
                        >
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Move Down
                        </Button>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={isActionLoading}
                        onClick={() => openEditModal(item)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      {item.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleOptionAction(item, "deactivate")
                          }
                        >
                          <PowerOff className="mr-2 h-4 w-4" />
                          {isActionLoading &&
                          actionType === "deactivate"
                            ? "Deactivating..."
                            : "Deactivate"}
                        </Button>
                      ) : null}

                      {item.status === "INACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleOptionAction(item, "activate")
                          }
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {isActionLoading &&
                          actionType === "activate"
                            ? "Activating..."
                            : "Activate"}
                        </Button>
                      ) : null}

                      {item.status === "ARCHIVED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-blue-200 bg-blue-50 text-blue-700"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleOptionAction(item, "restore")
                          }
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          {isActionLoading &&
                          actionType === "restore"
                            ? "Restoring..."
                            : "Restore"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={isActionLoading}
                          onClick={() =>
                            handleOptionAction(item, "archive")
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          {isActionLoading &&
                          actionType === "archive"
                            ? "Archiving..."
                            : "Archive"}
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full border-red-200 bg-red-50 text-red-700"
                        disabled={
                          isActionLoading || item.usageCount > 0
                        }
                        title={
                          item.usageCount > 0
                            ? `Used in ${item.usageCount} records. Deactivate or archive instead.`
                            : "Permanently delete unused option"
                        }
                        onClick={() =>
                          handleOptionAction(item, "delete")
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isActionLoading &&
                        actionType === "delete"
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </div>

                    {item.usageCount > 0 ? (
                      <p className="text-xs leading-5 text-neutral-500">
                        Delete disabled hai kyunki option currently{" "}
                        {item.usageCount} reference
                        {item.usageCount === 1 ? "" : "s"} mein use ho
                        raha hai.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={page <= 1 || isLoading}
            onClick={() =>
              setPage((current) => Math.max(1, current - 1))
            }
          >
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={page >= totalPages || isLoading}
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      {modalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Style Data / Options
                </p>

                <h2 className="mt-2 text-3xl font-medium text-neutral-950">
                  {modalMode === "create"
                    ? "Create Option"
                    : "Edit Option"}
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  {modalMode === "create"
                    ? "New option Active status mein create hoga."
                    : "Group aur stored value immutable hain. Sirf label, description aur position edit honge."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormField label="Option Group">
                <select
                  value={formValues.group}
                  disabled={modalMode === "edit" || isSubmitting}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      group: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none disabled:bg-neutral-100"
                >
                  <option value="">Select group</option>

                  {supportedGroups.map((group) => (
                    <option key={group} value={group}>
                      {formatLabel(group)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Stored Value">
                <input
                  value={formValues.value}
                  disabled={modalMode === "edit" || isSubmitting}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  placeholder="Example: Engagement"
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none disabled:bg-neutral-100"
                />
              </FormField>

              <FormField label="Display Label">
                <input
                  value={formValues.label}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Example: Engagement Ceremony"
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                />
              </FormField>

              <FormField label="Position">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={formValues.position}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      position: event.target.value,
                    }))
                  }
                  placeholder="Example: 7"
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Description">
                  <textarea
                    value={formValues.description}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Explain where this option should be used..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none"
                  />
                </FormField>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting
                  ? "Saving..."
                  : modalMode === "create"
                    ? "Create Option"
                    : "Update Option"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-[1.25rem] border-neutral-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-neutral-950">
        {value}
      </p>
    </Card>
  );
}

function UsageBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-[#fbfaf6] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      {children}
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: CatalogStyleDataOptionStatus;
}) {
  const styles =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "INACTIVE"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-neutral-300 bg-neutral-100 text-neutral-600";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
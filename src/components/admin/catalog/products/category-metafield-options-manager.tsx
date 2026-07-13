"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCategoryMetafieldOptionUsage,
  type CategoryMetafieldDefinition,
  type CategoryMetafieldOptionUsageData,
} from "@/lib/admin/product-taxonomy-metafields-api";

export type CategoryMetafieldOptionItem = {
  id: string;
  definitionId?: string | null;
  label: string;
  value: string;
  sortOrder: number;
  status?: string | null;
  isActive?: boolean | null;
  usageCount?: number | null;
  canDelete?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ManageableDefinition = CategoryMetafieldDefinition & {
  id?: string | null;
  canEdit?: boolean | null;
  optionItems?: CategoryMetafieldOptionItem[] | null;
};

type ApiResponse = {
  success?: boolean;
  data?: unknown;
  message?: string | string[];
  error?: unknown;
};

function getApiError(data: ApiResponse | null, fallback: string) {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (
    data?.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof (data.error as { message?: unknown }).message === "string"
  ) {
    return (data.error as { message: string }).message;
  }

  return fallback;
}

async function requestOptionApi({
  apiRootUrl,
  token,
  endpoint,
  method,
  body,
}: {
  apiRootUrl: string;
  token?: string | null;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
}) {
  const response = await fetch(`${apiRootUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data: ApiResponse | null = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text) as ApiResponse;
    } catch {
      throw new Error(
        `Metafield option API ne invalid JSON return kiya. HTTP ${response.status}.`,
      );
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      getApiError(
        data,
        `Metafield option request failed: ${response.status} ${response.statusText}`,
      ),
    );
  }

  return data;
}

function optionBasePath(definitionId: string) {
  return `/admin/catalog/taxonomy/metafield-definitions/${encodeURIComponent(
    definitionId,
  )}/options`;
}

function makeOptionValue(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function CategoryMetafieldOptionsManager({
  definition,
  apiRootUrl,
  token,
  onChanged,
  onClose,
}: {
  definition: CategoryMetafieldDefinition;
  apiRootUrl: string;
  token?: string | null;
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const manageableDefinition = definition as ManageableDefinition;
  const definitionId = String(manageableDefinition.id || "").trim();

  const options = useMemo(() => {
    return [...(manageableDefinition.optionItems || [])]
      .filter((option) => Boolean(String(option?.id || "").trim()))
      .sort(
        (left, right) =>
          Number(left.sortOrder || 0) - Number(right.sortOrder || 0),
      );
  }, [manageableDefinition.optionItems]);

  const [orderedOptions, setOrderedOptions] =
  useState<CategoryMetafieldOptionItem[]>(options);

const draggedOptionIdRef = useRef<string | null>(null);
const didDropRef = useRef(false);

const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
const [dragOverOptionId, setDragOverOptionId] = useState<string | null>(null);

useEffect(() => {
  if (draggedOptionIdRef.current) {
    return;
  }

  setOrderedOptions(options);
}, [options]);

  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(
    String(options.length + 1),
  );
  const [newIsActive, setNewIsActive] = useState(true);
  const [valueWasEdited, setValueWasEdited] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");

  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [usageOption, setUsageOption] =
  useState<CategoryMetafieldOptionItem | null>(null);

  const isEditable = manageableDefinition.canEdit !== false;

  async function runAction(
    key: string,
    action: () => Promise<void>,
    successText: string,
  ) {
    try {
      setWorkingKey(key);
      setError(null);
      setSuccessMessage(null);

      await action();
      await onChanged();

      setSuccessMessage(successText);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Metafield option action failed.",
      );
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleCreate() {
    const label = newLabel.trim();
    const value = newValue.trim();
    const sortOrder = Number(newSortOrder);

    if (!definitionId) {
      setError("Definition ID backend response me missing hai.");
      return;
    }

    if (!label) {
      setError("Option label required hai.");
      return;
    }

    if (!value) {
      setError("Option value required hai.");
      return;
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Sort order valid non-negative integer hona chahiye.");
      return;
    }

    await runAction(
      "create",
      async () => {
        await requestOptionApi({
          apiRootUrl,
          token,
          endpoint: optionBasePath(definitionId),
          method: "POST",
          body: {
            label,
            value,
            sortOrder,
            isActive: newIsActive,
          },
        });

        setNewLabel("");
        setNewValue("");
        setNewSortOrder(String(options.length + 2));
        setNewIsActive(true);
        setValueWasEdited(false);
      },
      `“${label}” option create ho gaya.`,
    );
  }

  function startEditing(option: CategoryMetafieldOptionItem) {
    setEditingId(option.id);
    setEditLabel(option.label);
    setEditSortOrder(String(option.sortOrder));
    setError(null);
    setSuccessMessage(null);
  }

  async function handleUpdate(option: CategoryMetafieldOptionItem) {
    const label = editLabel.trim();
    const sortOrder = Number(editSortOrder);

    if (!label) {
      setError("Option label required hai.");
      return;
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Sort order valid non-negative integer hona chahiye.");
      return;
    }

    await runAction(
      `update:${option.id}`,
      async () => {
        await requestOptionApi({
          apiRootUrl,
          token,
          endpoint: `${optionBasePath(definitionId)}/${encodeURIComponent(
            option.id,
          )}`,
          method: "PATCH",
          body: {
            label,
            sortOrder,
          },
        });

        setEditingId(null);
      },
      `“${label}” option update ho gaya.`,
    );
  }

  async function handleDelete(option: CategoryMetafieldOptionItem) {
    if (!option.canDelete) {
      setError(
        `“${option.label}” use ho raha hai. Isko delete nahi, deactivate karo.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `“${option.label}” option permanently delete karna hai?`,
    );

    if (!confirmed) return;

    await runAction(
      `delete:${option.id}`,
      async () => {
        await requestOptionApi({
          apiRootUrl,
          token,
          endpoint: `${optionBasePath(definitionId)}/${encodeURIComponent(
            option.id,
          )}`,
          method: "DELETE",
        });
      },
      `“${option.label}” option delete ho gaya.`,
    );
  }

  async function handleActiveChange(option: CategoryMetafieldOptionItem) {
    const isActive = option.isActive !== false;
    const action = isActive ? "deactivate" : "activate";

    await runAction(
      `${action}:${option.id}`,
      async () => {
        await requestOptionApi({
          apiRootUrl,
          token,
          endpoint: `${optionBasePath(definitionId)}/${encodeURIComponent(
            option.id,
          )}/${action}`,
          method: "PATCH",
        });
      },
      `“${option.label}” option ${
        isActive ? "deactivate" : "activate"
      } ho gaya.`,
    );
  }

 function handleOptionDragStart(
  event: DragEvent<HTMLButtonElement>,
  optionId: string,
) {
  if (!isEditable || workingKey || editingId) {
    event.preventDefault();
    return;
  }

  draggedOptionIdRef.current = optionId;
  didDropRef.current = false;

  setDraggedOptionId(optionId);
  setDragOverOptionId(optionId);

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", optionId);
}

function handleOptionDragEnter(targetOptionId: string) {
  const draggedId = draggedOptionIdRef.current;

  if (!draggedId || draggedId === targetOptionId) {
    return;
  }

  setDragOverOptionId(targetOptionId);

  setOrderedOptions((current) => {
    const sourceIndex = current.findIndex(
      (option) => option.id === draggedId,
    );

    const targetIndex = current.findIndex(
      (option) => option.id === targetOptionId,
    );

    if (
      sourceIndex === -1 ||
      targetIndex === -1 ||
      sourceIndex === targetIndex
    ) {
      return current;
    }

    const next = [...current];
    const [movedOption] = next.splice(sourceIndex, 1);

    next.splice(targetIndex, 0, movedOption);

    return next;
  });
}

function handleOptionDragOver(event: DragEvent<HTMLDivElement>) {
  if (!draggedOptionIdRef.current) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

async function handleOptionDrop(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();

  const draggedId = draggedOptionIdRef.current;

  if (!draggedId || !definitionId || workingKey) {
    return;
  }

  didDropRef.current = true;

  const nextOrder = [...orderedOptions];

  const orderChanged =
    nextOrder.length === options.length &&
    nextOrder.some(
      (option, index) => option.id !== options[index]?.id,
    );

  draggedOptionIdRef.current = null;
  setDraggedOptionId(null);
  setDragOverOptionId(null);

  if (!orderChanged) {
    return;
  }

  try {
    setWorkingKey(`reorder:drag:${draggedId}`);
    setError(null);
    setSuccessMessage(null);

    await requestOptionApi({
      apiRootUrl,
      token,
      endpoint: `${optionBasePath(definitionId)}/reorder`,
      method: "PATCH",
      body: {
        items: nextOrder.map((option, index) => ({
          optionId: option.id,
          sortOrder: index + 1,
        })),
      },
    });

    await onChanged();

    setSuccessMessage("Options ka order update ho gaya.");
  } catch (reorderError) {
    setOrderedOptions(options);

    setError(
      reorderError instanceof Error
        ? reorderError.message
        : "Options reorder failed.",
    );
  } finally {
    setWorkingKey(null);
  }
}

function handleOptionDragEnd() {
  if (!didDropRef.current) {
    setOrderedOptions(options);
  }

  draggedOptionIdRef.current = null;
  didDropRef.current = false;

  setDraggedOptionId(null);
  setDragOverOptionId(null);
}

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-[1050px] flex-col overflow-hidden rounded-[1.5rem] bg-[#f7f6f1] shadow-2xl ring-1 ring-black/10">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-neutral-950">
              Manage {definition.label || definition.key} values
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Backend option create, edit, activate, deactivate, delete aur reorder.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(workingKey)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-50"
            aria-label="Close values manager"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {!definitionId ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Definition ID backend response me missing hai. Option APIs call nahi ho
              sakti.
            </div>
          ) : null}

          {!isEditable ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Backend ne is definition ke liye canEdit=false diya hai. Values read-only
              hain.
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-neutral-950">
                  Add new value
                </h4>
                <p className="mt-1 text-xs text-neutral-500">
                  Value create hone ke baad current definition list backend se refresh
                  hogi.
                </p>
              </div>

              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {options.length} values
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1.2fr_140px]">
              <label className="text-xs font-medium text-neutral-700">
                Label
                <input
                  value={newLabel}
                  onChange={(event) => {
                    const nextLabel = event.target.value;
                    setNewLabel(nextLabel);

                    if (!valueWasEdited) {
                      setNewValue(makeOptionValue(nextLabel));
                    }
                  }}
                  placeholder="Velvet"
                  disabled={!isEditable || Boolean(workingKey)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-100"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700">
                Value
                <input
                  value={newValue}
                  onChange={(event) => {
                    setValueWasEdited(true);
                    setNewValue(event.target.value);
                  }}
                  placeholder="velvet"
                  disabled={!isEditable || Boolean(workingKey)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-100"
                />
              </label>

              <label className="text-xs font-medium text-neutral-700">
                Sort order
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={newSortOrder}
                  onChange={(event) => setNewSortOrder(event.target.value)}
                  disabled={!isEditable || Boolean(workingKey)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-100"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(event) => setNewIsActive(event.target.checked)}
                  disabled={!isEditable || Boolean(workingKey)}
                  className="h-4 w-4"
                />
                Create as active
              </label>

              <Button
                type="button"
                onClick={handleCreate}
                disabled={
                  !isEditable ||
                  !definitionId ||
                  Boolean(workingKey) ||
                  !newLabel.trim() ||
                  !newValue.trim()
                }
                className="h-10 rounded-xl bg-neutral-950 px-5 text-white hover:bg-neutral-800"
              >
                {workingKey === "create" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add value
              </Button>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h4 className="text-sm font-semibold text-neutral-950">
                Existing values
              </h4>
              <p className="mt-1 text-xs text-neutral-500">
                Used value delete nahi hoga; uske liye deactivate use karo.
              </p>
            </div>

            {options.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500">
                Backend response me optionItems empty hain.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
            {orderedOptions.map((option, index) => {
                  const isActive = option.isActive !== false;
                  const isEditing = editingId === option.id;
                  const isWorking = Boolean(
                    workingKey && workingKey.includes(option.id),
                  );

                  return (
                 <div
  key={option.id}
  onDragEnter={() => handleOptionDragEnter(option.id)}
  onDragOver={handleOptionDragOver}
  onDrop={handleOptionDrop}
  className={[
    "p-4 transition-all duration-200",
    draggedOptionId === option.id
      ? "scale-[0.995] bg-neutral-100 opacity-60"
      : dragOverOptionId === option.id
        ? "bg-blue-50/70"
        : "bg-white",
  ].join(" ")}
>
                      {isEditing ? (
                        <div className="grid gap-3 md:grid-cols-[1fr_130px_auto] md:items-end">
                          <label className="text-xs font-medium text-neutral-700">
                            Label
                            <input
                              value={editLabel}
                              onChange={(event) => setEditLabel(event.target.value)}
                              disabled={Boolean(workingKey)}
                              className="mt-1 h-10 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                            />
                          </label>

                          <label className="text-xs font-medium text-neutral-700">
                            Sort order
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={editSortOrder}
                              onChange={(event) =>
                                setEditSortOrder(event.target.value)
                              }
                              disabled={Boolean(workingKey)}
                              className="mt-1 h-10 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
                            />
                          </label>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={Boolean(workingKey)}
                              className="h-10 rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleUpdate(option)}
                              disabled={Boolean(workingKey) || !editLabel.trim()}
                              className="h-10 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800"
                            >
                              {workingKey === `update:${option.id}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                     <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
  <div className="flex min-w-0 items-start gap-3">
    <button
      type="button"
      draggable={
        isEditable &&
        !Boolean(workingKey) &&
        editingId === null
      }
      onDragStart={(event) =>
        handleOptionDragStart(event, option.id)
      }
      onDragEnd={handleOptionDragEnd}
      disabled={
        !isEditable ||
        Boolean(workingKey) ||
        editingId !== null
      }
      className="mt-0.5 flex h-10 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`Drag ${option.label} to reorder`}
      title="Drag to reorder"
    >
      {workingKey === `reorder:drag:${option.id}` ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GripVertical className="h-5 w-5" />
      )}
    </button>

    <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-neutral-950">
                                {option.label}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ring-1 ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                    : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>

                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">
                                Usage {Number(option.usageCount || 0)}
                              </span>

                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">
                               Order {index + 1}
                              </span>
                            </div>

                         <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
  {option.value}
</p>
    </div>
  </div>

<div className="flex flex-wrap items-center gap-2">
                          

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => startEditing(option)}
                              disabled={!isEditable || Boolean(workingKey)}
                              className="h-9 rounded-xl px-3 text-xs"
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>

                            {Number(option.usageCount || 0) > 0 ? (
  <Button
    type="button"
    variant="outline"
    onClick={() => setUsageOption(option)}
    disabled={Boolean(workingKey)}
    className="h-9 rounded-xl border-blue-200 px-3 text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800"
  >
    <Eye className="mr-1.5 h-3.5 w-3.5" />
    View usage
  </Button>
) : null}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleActiveChange(option)}
                              disabled={!isEditable || Boolean(workingKey)}
                              className="h-9 rounded-xl px-3 text-xs"
                            >
                              {isWorking ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : isActive ? (
                                <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                              ) : (
                                <Power className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>

                            {option.canDelete ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDelete(option)}
                                disabled={!isEditable || Boolean(workingKey)}
                                className="h-9 rounded-xl border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
                              >
                                {workingKey === `delete:${option.id}` ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-neutral-200 bg-white px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={Boolean(workingKey)}
            className="rounded-xl"
          >
            Close
          </Button>
        </div>

        
      </div>

         {usageOption ? (
        <CategoryMetafieldOptionUsageModal
          apiRootUrl={apiRootUrl}
          token={token}
          definitionId={definitionId}
          option={usageOption}
          onClose={() => setUsageOption(null)}
        />
      ) : null}
    </div>
  );
}


function formatUsageSavedValue(
  value: string | string[] | number | boolean | null,
) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(" • ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function CategoryMetafieldOptionUsageModal({
  apiRootUrl,
  token,
  definitionId,
  option,
  onClose,
}: {
  apiRootUrl: string;
  token?: string | null;
  definitionId: string;
  option: CategoryMetafieldOptionItem;
  onClose: () => void;
}) {
  const [usageData, setUsageData] =
    useState<CategoryMetafieldOptionUsageData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [productTypeInput, setProductTypeInput] = useState("");
  const [appliedProductType, setAppliedProductType] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        setIsLoading(true);
        setUsageError(null);

        const result = await getCategoryMetafieldOptionUsage({
          apiRootUrl,
          definitionId,
          optionId: option.id,
          page,
          limit,
          search: appliedSearch,
          status,
          businessType,
          productType: appliedProductType,
          token,
        });

        if (cancelled) return;

        const invalidProduct = result.products.find((product) => {
          return (
            !String(product.id || "").trim() ||
            !String(product.name || "").trim()
          );
        });

        if (invalidProduct) {
          throw new Error(
            "Usage API response me kisi product ka real ID ya name missing hai.",
          );
        }

        setUsageData(result);
      } catch (loadError) {
        if (!cancelled) {
          setUsageData(null);
          setUsageError(
            loadError instanceof Error
              ? loadError.message
              : "Category metafield option usage load failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!definitionId) {
      setUsageData(null);
      setUsageError("Definition ID missing hai.");
      setIsLoading(false);
      return;
    }

    if (!option.id) {
      setUsageData(null);
      setUsageError("Option ID missing hai.");
      setIsLoading(false);
      return;
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, [
    apiRootUrl,
    appliedProductType,
    appliedSearch,
    businessType,
    definitionId,
    option.id,
    page,
    refreshKey,
    status,
    token,
  ]);

function applyFilters() {
  setPage(1);
  setAppliedSearch(searchInput.trim());
  setAppliedProductType(productTypeInput.trim());
}

  function clearFilters() {
    setPage(1);

    setSearchInput("");
    setAppliedSearch("");

    setStatus("");
    setBusinessType("");

    setProductTypeInput("");
    setAppliedProductType("");
  }

  const products = usageData?.products || [];
  const pagination = usageData?.pagination;

  const currentPage = Number(pagination?.page || page);
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const totalProducts = Number(pagination?.total || 0);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-[1150px] flex-col overflow-hidden rounded-[1.5rem] bg-[#f7f6f1] shadow-2xl ring-1 ring-black/10">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-neutral-950">
                Products using “{option.label}”
              </h3>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                {usageData?.option.usageCount ??
                  Number(option.usageCount || 0)}{" "}
                usages
              </span>
            </div>

            <p className="mt-1 text-xs text-neutral-500">
              {usageData?.definition.label || "Category metafield"} →{" "}
              {usageData?.option.value || option.value}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            aria-label="Close option usage"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

       <div className="shrink-0 border-b border-neutral-200 bg-white px-5 py-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_180px_auto]">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />

           <input
  value={searchInput}
  onChange={(event) => setSearchInput(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  }}
  placeholder="Search name, SKU, slug or product ID"
  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
/>
            </label>

            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={businessType}
              onChange={(event) => {
                setPage(1);
                setBusinessType(event.target.value);
              }}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              <option value="">All businesses</option>
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
            </select>

          <input
  value={productTypeInput}
  onChange={(event) => setProductTypeInput(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  }}
  placeholder="Product type"
  className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
/>

            <div className="flex items-center gap-2">
            <Button
  type="button"
  onClick={applyFilters}
  className="h-10 rounded-xl bg-neutral-950 px-4 text-white hover:bg-neutral-800"
>
  Search
</Button>

              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="h-10 rounded-xl px-4"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              {totalProducts} real backend product
              {totalProducts === 1 ? "" : "s"} found
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={isLoading}
              className="h-9 rounded-xl px-3 text-xs"
            >
              {isLoading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {usageError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {usageError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white text-sm text-neutral-500 ring-1 ring-neutral-200">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading real product usage...
            </div>
          ) : null}

          {!isLoading && !usageError && products.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white p-6 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
              Is option ko use karne wala koi product current filters mein
              nahi mila.
            </div>
          ) : null}

          {!isLoading && !usageError && products.length > 0 ? (
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
              <div className="hidden grid-cols-[minmax(260px,1.5fr)_180px_120px_170px_160px_130px] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 lg:grid">
                <span>Product</span>
                <span>SKU</span>
                <span>Status</span>
                <span>Category</span>
                <span>Saved value</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(260px,1.5fr)_180px_120px_170px_160px_130px] lg:items-center lg:gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/catalog/products/${encodeURIComponent(
                          product.id,
                        )}/edit`}
                        className="block truncate text-sm font-semibold text-neutral-950 hover:text-blue-700 hover:underline"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
                        {product.id}
                      </p>

                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {product.slug}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:hidden">
                        SKU
                      </p>
                      <p className="mt-1 break-all text-sm text-neutral-700 lg:mt-0">
                        {product.sku}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:hidden">
                        Status
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 ring-1 ring-neutral-200 lg:mt-0">
                        {product.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:hidden">
                        Category
                      </p>

                      <p className="mt-1 text-sm text-neutral-700 lg:mt-0">
                        {product.categoryName}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-400">
                        {product.businessType} · {product.productType}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:hidden">
                        Saved value
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 lg:mt-0">
                        {formatUsageSavedValue(product.savedValue)}
                      </p>
                    </div>

                    <Link
                      href={`/admin/catalog/products/${encodeURIComponent(
                        product.id,
                      )}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
                    >
                      Edit product
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-neutral-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              disabled={isLoading || currentPage <= 1}
              className="h-9 rounded-xl px-3 text-xs"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1),
                )
              }
              disabled={isLoading || currentPage >= totalPages}
              className="h-9 rounded-xl px-3 text-xs"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>

            <Button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl bg-neutral-950 px-4 text-xs text-white hover:bg-neutral-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

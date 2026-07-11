"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
    Archive,
  GitBranch,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  activateCatalogStyleRule,
  archiveCatalogStyleRule,
  createCatalogStyleRule,
  deactivateCatalogStyleRule,
  getCatalogStyleRuleOptions,
  getCatalogStyleRules,
  previewCatalogStyleRule,
  updateCatalogStyleRule,
  type CatalogStyleRule,
  type CatalogStyleRuleConditionField,
  type CatalogStyleRuleFormValues,
  type CatalogStyleRuleOptions,
  type CatalogStyleRulePreviewResult,
  type CatalogStyleRulesListParams,
} from "@/lib/admin/catalog-style-rules-api";

function createDefaultFormValues(
  options: CatalogStyleRuleOptions | null = null,
): CatalogStyleRuleFormValues {
  const firstConditionField = options?.conditionFields?.[0];
  const firstActionField = options?.actionFields?.[0];

  return {
    name: "",
    description: "",
    businessType: "SHAHSI",
    status: "ACTIVE",
    priority: 0,
    conditions: [
      {
        field: firstConditionField?.key || "",
        operator: firstConditionField?.operators?.[0] || "",
        value: "",
      },
    ],
    actions: [
      {
        field: firstActionField?.key || "",
        value: [],
      },
    ],
  };
}

export default function StyleRulesPage() {
  const [items, setItems] = useState<CatalogStyleRule[]>([]);
  const [editingRuleId, setEditingRuleId] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [previewResult, setPreviewResult] =
    useState<CatalogStyleRulePreviewResult | null>(null);

  const [previewError, setPreviewError] = useState("");

  const [actionId, setActionId] = useState("");
  const [actionType, setActionType] = useState<
    "" | "activate" | "deactivate" | "archive"
  >("");

  const [ruleOptions, setRuleOptions] =
    useState<CatalogStyleRuleOptions | null>(null);

  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<CatalogStyleRulesListParams>({
    search: "",
    status: "",
    businessType: "",
    conditionField: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [formValues, setFormValues] =
    useState<CatalogStyleRuleFormValues>(() => createDefaultFormValues());

  const [actionValueInputs, setActionValueInputs] = useState<
    Record<number, string>
  >({});
  const [error, setError] = useState("");

  const queryParams = useMemo<CatalogStyleRulesListParams>(
    () => ({
      page,
      limit,
      ...filters,
    }),
    [filters, limit, page],
  );

    const conditionFields = ruleOptions?.conditionFields || [];
  const actionFields = ruleOptions?.actionFields || [];

  const productConditionFields = conditionFields.filter(
    (field) => field.group === "PRODUCT",
  );

  const styleDataConditionFields = conditionFields.filter(
    (field) => field.group === "STYLE_DATA",
  );

    async function loadRuleOptions() {
    try {
      setIsOptionsLoading(true);
      setOptionsError("");

      const result = await getCatalogStyleRuleOptions();

      setRuleOptions(result);
    } catch (loadError) {
      setOptionsError(
        loadError instanceof Error
          ? loadError.message
          : "Style rule options load failed.",
      );

      setRuleOptions(null);
    } finally {
      setIsOptionsLoading(false);
    }
  }

  async function loadRules() {
    try {
      setIsLoading(true);
      setError("");

      const result = await getCatalogStyleRules(queryParams);

      setItems(result.items || []);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Style rules load failed.",
      );
      setItems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadRuleOptions();
  }, []);



  useEffect(() => {
    loadRules();
  }, [queryParams]);

  function updateFilter(key: keyof CatalogStyleRulesListParams, value: string) {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({
      search: "",
      status: "",
      businessType: "",
      conditionField: "",
    });
  }

  function openCreateModal() {
    setEditingRuleId("");
    setFormValues(createDefaultFormValues(ruleOptions));
    setActionValueInputs({});
    setPreviewResult(null);
    setPreviewError("");
    setError("");
    setCreateOpen(true);
  }

  function closeCreateModal() {
    if (isSubmitting || isPreviewing) return;

    setCreateOpen(false);
    setEditingRuleId("");
    setFormValues(createDefaultFormValues(ruleOptions));
    setActionValueInputs({});
    setPreviewResult(null);
    setPreviewError("");
  }

function openEditModal(rule: CatalogStyleRule) {
  setEditingRuleId(rule.id);

  setFormValues({
    name: rule.name || "",
    description: rule.description || "",
    businessType: rule.businessType,
    status: rule.status,
    priority: rule.priority || 0,
    conditions: rule.conditions?.length
      ? rule.conditions
      : [
          {
            field: "category",
            operator: "EQUALS",
            value: "",
          },
        ],
    actions: rule.actions?.length
      ? rule.actions
      : [
          {
            field: "tags",
            value: [],
          },
        ],
  });

   setActionValueInputs({});
  setPreviewResult(null);
  setPreviewError("");
  setError("");
  setCreateOpen(true);
}

   function updateCondition(
    index: number,
    key: "field" | "operator" | "value",
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      conditions: current.conditions.map((condition, conditionIndex) => {
        if (conditionIndex !== index) return condition;

        if (key === "field") {
          const selectedField = conditionFields.find(
            (field) => field.key === value,
          );

          return {
            ...condition,
            field: value,
            operator: selectedField?.operators?.[0] || "",
            value: "",
          };
        }

        return {
          ...condition,
          [key]: value,
        };
      }),
    }));

    setPreviewResult(null);
    setPreviewError("");
  }


   function addCondition() {
    const firstField = conditionFields[0];

    if (!firstField) return;

    setFormValues((current) => ({
      ...current,
      conditions: [
        ...current.conditions,
        {
          field: firstField.key,
          operator: firstField.operators[0] || "",
          value: "",
        },
      ],
    }));

    setPreviewResult(null);
  }

  function removeCondition(index: number) {
    setFormValues((current) => ({
      ...current,
      conditions:
        current.conditions.length > 1
          ? current.conditions.filter((_, conditionIndex) => conditionIndex !== index)
          : current.conditions,
    }));
  }

    function updateActionField(index: number, value: string) {
    setFormValues((current) => ({
      ...current,
      actions: current.actions.map((action, actionIndex) =>
        actionIndex === index
          ? {
              field: value,
              value: [],
            }
          : action,
      ),
    }));

    setActionValueInputs((current) => ({
      ...current,
      [index]: "",
    }));

    setPreviewResult(null);
    setPreviewError("");
  }

    function addAction() {
    const selectedActionFields = new Set(
      formValues.actions.map((action) => action.field),
    );

    const nextActionField = actionFields.find(
      (field) => !selectedActionFields.has(field.key),
    );

    if (!nextActionField) return;

    setFormValues((current) => ({
      ...current,
      actions: [
        ...current.actions,
        {
          field: nextActionField.key,
          value: [],
        },
      ],
    }));
  }

  function removeAction(index: number) {
    setFormValues((current) => ({
      ...current,
      actions:
        current.actions.length > 1
          ? current.actions.filter(
              (_, actionIndex) => actionIndex !== index,
            )
          : current.actions,
    }));

    setActionValueInputs({});
    setPreviewResult(null);
  }

  function addActionValue(index: number, rawValue: string) {
    const values = rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!values.length) return;

    setFormValues((current) => ({
      ...current,
      actions: current.actions.map((action, actionIndex) => {
        if (actionIndex !== index) return action;

        return {
          ...action,
          value: Array.from(new Set([...action.value, ...values])),
        };
      }),
    }));

     setActionValueInputs((current) => ({
      ...current,
      [index]: "",
    }));

    setPreviewResult(null);
  }

  function removeActionValue(index: number, value: string) {
    setFormValues((current) => ({
      ...current,
      actions: current.actions.map((action, actionIndex) =>
        actionIndex === index
          ? {
              ...action,
              value: action.value.filter((item) => item !== value),
            }
          : action,
      ),
    }));
  }

 async function handlePreviewRule() {
  const validConditions = formValues.conditions.filter(
    (condition) =>
      condition.field.trim() &&
      condition.operator.trim() &&
      condition.value.trim(),
  );

  if (!validConditions.length) {
    setPreviewError(
      "Preview ke liye at least one valid condition required hai.",
    );
    setPreviewResult(null);
    return;
  }

  const validActions = formValues.actions.filter(
    (action) => action.field.trim() && action.value.length,
  );

  if (!validActions.length) {
    setPreviewError(
      "Preview ke liye at least one valid action required hai.",
    );
    setPreviewResult(null);
    return;
  }

  try {
    setIsPreviewing(true);
    setPreviewError("");
    setPreviewResult(null);

    const result = await previewCatalogStyleRule({
      conditions: validConditions,
      actions: validActions,
    });

    setPreviewResult(result);
  } catch (previewRequestError) {
    setPreviewError(
      previewRequestError instanceof Error
        ? previewRequestError.message
        : "Style rule preview failed.",
    );
  } finally {
    setIsPreviewing(false);
  }
}

async function handleSaveRule() {
  const cleanName = formValues.name.trim();

  if (!cleanName) {
    setError("Rule name required hai.");
    return;
  }

  const validConditions = formValues.conditions.filter(
    (condition) =>
      condition.field.trim() &&
      condition.operator.trim() &&
      condition.value.trim(),
  );

  if (!validConditions.length) {
    setError("At least one valid condition required hai.");
    return;
  }

  const validActions = formValues.actions.filter(
    (action) => action.field.trim() && action.value.length,
  );

  if (!validActions.length) {
    setError("At least one valid action required hai.");
    return;
  }

  const payload: CatalogStyleRuleFormValues = {
    ...formValues,
    name: cleanName,
    description: formValues.description?.trim() || "",
    conditions: validConditions,
    actions: validActions,
  };

  try {
    setIsSubmitting(true);
    setError("");

    if (editingRuleId) {
      await updateCatalogStyleRule(editingRuleId, payload);
    } else {
      await createCatalogStyleRule(payload);
    }

    setCreateOpen(false);
    setEditingRuleId("");
        setFormValues(createDefaultFormValues(ruleOptions));
    setActionValueInputs({});
    setPreviewResult(null);
    setPreviewError("");

    await loadRules();
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "Style rule save failed.",
    );
  } finally {
    setIsSubmitting(false);
  }
}

async function handleActivateRule(rule: CatalogStyleRule) {
  try {
    setActionId(rule.id);
        setActionType("deactivate");
    setError("");

    await activateCatalogStyleRule(rule.id);
    await loadRules();
  } catch (activateError) {
    setError(
      activateError instanceof Error
        ? activateError.message
        : "Style rule activate failed.",
    );
    } finally {
    setActionId("");
    setActionType("");
  }
}

async function handleDeactivateRule(rule: CatalogStyleRule) {
  try {
    setActionId(rule.id);
        setActionType("activate");
    setError("");

    await deactivateCatalogStyleRule(rule.id);
    await loadRules();
  } catch (deactivateError) {
    setError(
      deactivateError instanceof Error
        ? deactivateError.message
        : "Style rule deactivate failed.",
    );
  } finally {
    setActionId("");
     setActionType("");
  }
}

  async function handleArchiveRule(rule: CatalogStyleRule) {
    const confirmed = window.confirm(
      `"${rule.name}" ko archive karna hai?`,
    );

    if (!confirmed) return;

    try {
      setActionId(rule.id);
      setActionType("archive");
      setError("");

      await archiveCatalogStyleRule(rule.id);
      await loadRules();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Style rule archive failed.",
      );
    } finally {
      setActionId("");
      setActionType("");
    }
  }


  return (
<main className="min-h-screen bg-[#f7f5ef] px-4 py-5 sm:px-6 lg:px-8">
   <section className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral-950 px-6 py-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)] sm:px-8 sm:py-7">
        <Link
          href="/admin/catalog/style-data"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Style Data
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Admin / Catalog / Style Rules
            </p>

      <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
  Style Rules
</h1>

       <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              Create backend-driven rules that apply style tags or styling
              keywords based on catalog conditions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
        className="h-11 rounded-full border-white/10 bg-white/10 px-5 text-white hover:bg-white/20"
              onClick={loadRules}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

          <Button
  type="button"
  className="h-11 rounded-full bg-white px-5 font-medium text-neutral-950 shadow-sm hover:bg-neutral-100"
  onClick={openCreateModal}
  disabled={isOptionsLoading || !ruleOptions}
>
             <Plus className="mr-2 h-4 w-4" />
{isOptionsLoading ? "Loading Options..." : "Create Rule"}
            </Button>
          </div>
        </div>
      </section>

   <Card className="mb-5 rounded-[1.5rem] border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
  <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_200px_220px_auto]">
    <div className="flex h-12 min-w-0 items-center rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 transition focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-neutral-100">
      <Search className="mr-3 h-4 w-4 shrink-0 text-neutral-400" />

      <input
        value={filters.search || ""}
        onChange={(event) => updateFilter("search", event.target.value)}
        placeholder="Search by rule name..."
        className="min-w-0 flex-1 bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
      />
    </div>

    <select
      value={filters.status || ""}
      onChange={(event) => updateFilter("status", event.target.value)}
      className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
    >
      <option value="">All statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="INACTIVE">Inactive</option>
    </select>

    <select
      value={filters.businessType || ""}
      onChange={(event) =>
        updateFilter("businessType", event.target.value)
      }
      className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
    >
      <option value="">All businesses</option>
      <option value="SHAHSI">Shahsi</option>
      <option value="GOWNLOOP">Gownloop</option>
    </select>

  <select
  value={filters.conditionField || ""}
  onChange={(event) =>
    updateFilter("conditionField", event.target.value)
  }
  className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
>
  <option value="">All condition fields</option>

  {productConditionFields.length ? (
    <optgroup label="Product Fields">
      {productConditionFields.map((field) => (
        <option key={field.key} value={field.key}>
          {field.label}
        </option>
      ))}
    </optgroup>
  ) : null}

  {styleDataConditionFields.length ? (
    <optgroup label="Style Data Fields">
      {styleDataConditionFields.map((field) => (
        <option key={field.key} value={field.key}>
          {field.label}
        </option>
      ))}
    </optgroup>
  ) : null}
</select>

    <Button
      type="button"
      variant="outline"
      className="h-12 rounded-2xl border-neutral-200 px-5"
      onClick={clearFilters}
    >
      Clear
    </Button>
  </div>
</Card>

{optionsError ? (
  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <p>{optionsError}</p>

    <button
      type="button"
      onClick={loadRuleOptions}
      className="mt-2 font-medium underline"
    >
      Retry loading options
    </button>
  </div>
) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

    <Card className="rounded-[1.75rem] border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-8 text-sm text-neutral-500">
            Loading style rules...
          </div>
        ) : items.length ? (
          <div className="space-y-4">
          {items.map((rule) => (
 <StyleRuleCard
  key={rule.id}
  rule={rule}
  actionId={actionId}
  actionType={actionType}
  ruleOptions={ruleOptions}
  onEdit={openEditModal}
  onActivate={handleActivateRule}
  onDeactivate={handleDeactivateRule}
  onArchive={handleArchiveRule}
/>
))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf6] p-10 text-center">
            <h3 className="text-lg font-semibold text-neutral-950">
              No style rules found
            </h3>
            <p className="mt-2 text-sm text-neutral-500">
              Create rule button se first style rule banao.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-neutral-200 pt-4 text-sm">
          <p className="text-neutral-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={page >= totalPages || isLoading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {createOpen ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative z-[10000] my-4 max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-white/50 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Catalog / Style Rules
                </p>

                <h2 className="mt-2 text-3xl font-medium text-neutral-950">
               {editingRuleId ? "Edit Style Rule" : "Create Style Rule"}
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Conditions match hone par actions style data me apply honge.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
            disabled={isSubmitting || isPreviewing}
                className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>


            {error ? (
  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {error}
  </div>
) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Rule Name">
                <input
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Auto tag bridesmaid pink dresses"
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                />
              </Field>

              <Field label="Priority">
                <input
                  type="number"
                  value={formValues.priority}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      priority: Number(event.target.value || 0),
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                />
              </Field>

              <Field label="Business Type">
                <select
                  value={formValues.businessType}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      businessType: event.target.value as
                        | "SHAHSI"
                        | "GOWNLOOP",
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                >
                  <option value="SHAHSI">Shahsi</option>
                  <option value="GOWNLOOP">Gownloop</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={formValues.status}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      status: event.target.value as "ACTIVE" | "INACTIVE",
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    value={formValues.description || ""}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional rule description..."
                    className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
                  />
                </Field>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-950">
                    Conditions
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Example: category equals Bridesmaid.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={addCondition}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>

           <div className="space-y-3">
  {formValues.conditions.map((condition, index) => {
    const fieldMetadata = conditionFields.find(
      (field) => field.key === condition.field,
    );

    return (
      <div
        key={index}
        className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <select
          value={condition.field}
          onChange={(event) =>
            updateCondition(index, "field", event.target.value)
          }
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
        >
          <option value="">Select field</option>

          {productConditionFields.length ? (
            <optgroup label="Product Fields">
              {productConditionFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </optgroup>
          ) : null}

          {styleDataConditionFields.length ? (
            <optgroup label="Style Data Fields">
              {styleDataConditionFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>

        <select
          value={condition.operator}
          onChange={(event) =>
            updateCondition(index, "operator", event.target.value)
          }
          disabled={!fieldMetadata}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none disabled:bg-neutral-100"
        >
          <option value="">Select operator</option>

          {(fieldMetadata?.operators || []).map((operator) => (
            <option key={operator} value={operator}>
              {ruleOptions?.operatorLabels?.[operator] ||
                formatLabel(operator)}
            </option>
          ))}
        </select>

        <ConditionValueControl
          field={fieldMetadata || null}
          value={condition.value}
          onChange={(value) =>
            updateCondition(index, "value", value)
          }
        />

        <Button
          type="button"
          variant="outline"
          className="rounded-full border-red-200 text-red-600"
          disabled={formValues.conditions.length <= 1}
          onClick={() => removeCondition(index)}
        >
          Remove
        </Button>

        {fieldMetadata ? (
          <div className="md:col-span-4 rounded-lg bg-[#fbfaf6] px-3 py-2">
            <p className="text-xs text-neutral-600">
              {fieldMetadata.description}
            </p>

            {fieldMetadata.example ? (
              <p className="mt-1 text-xs text-neutral-400">
                Example: {fieldMetadata.example}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  })}
</div>
            </section>

           <section className="mt-6 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-lg font-medium text-neutral-950">
        Actions
      </h3>

      <p className="mt-1 text-sm text-neutral-500">
        Matching products ke Style Data mein tags ya styling keywords
        add honge.
      </p>
    </div>

    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={addAction}
      disabled={
        !actionFields.length ||
        formValues.actions.length >= actionFields.length
      }
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Action
    </Button>
  </div>

  {formValues.actions.map((action, index) => {
    const actionMetadata = actionFields.find(
      (field) => field.key === action.field,
    );

    return (
      <div
        key={index}
        className="mt-4 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Field label="Action Field">
              <select
                value={action.field}
                onChange={(event) =>
                  updateActionField(index, event.target.value)
                }
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none"
              >
                <option value="">Select action</option>

                {actionFields.map((field) => {
                  const usedByAnotherAction =
                    formValues.actions.some(
                      (existingAction, existingIndex) =>
                        existingIndex !== index &&
                        existingAction.field === field.key,
                    );

                  return (
                    <option
                      key={field.key}
                      value={field.key}
                      disabled={usedByAnotherAction}
                    >
                      {field.label}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-red-200 text-red-600"
            disabled={formValues.actions.length <= 1}
            onClick={() => removeAction(index)}
          >
            Remove
          </Button>
        </div>

        {actionMetadata ? (
          <p className="mt-2 text-xs text-neutral-500">
            {actionMetadata.description}
          </p>
        ) : null}

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-neutral-800">
            Action Values
          </p>

          <div className="flex gap-2">
            <input
              value={actionValueInputs[index] || ""}
              onChange={(event) =>
                setActionValueInputs((current) => ({
                  ...current,
                  [index]: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  addActionValue(
                    index,
                    actionValueInputs[index] || "",
                  );
                }
              }}
              placeholder={
                actionMetadata?.key === "stylingKeywords"
                  ? "pink bridesmaid dress, festive outfit"
                  : "romantic, bridesmaid"
              }
              className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
            />

            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                addActionValue(
                  index,
                  actionValueInputs[index] || "",
                )
              }
            >
              Add
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {action.value.length ? (
              action.value.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    removeActionValue(index, value)
                  }
                  className="rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs hover:border-red-200 hover:text-red-600"
                >
                  {value} ×
                </button>
              ))
            ) : (
              <span className="text-sm text-neutral-400">
                No action values added.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  })}
</section>

          {previewError ? (
  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {previewError}
  </div>
) : null}

{previewResult ? (
  <section className="mt-6 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
          Rule Preview
        </p>

        <h3 className="mt-2 text-xl font-medium text-neutral-950">
          Matching Products
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Current conditions ke basis par backend preview result.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
          Matched
        </p>

        <p className="mt-1 text-3xl font-semibold text-neutral-950">
          {previewResult.matchedProducts}
        </p>
      </div>
    </div>

   {previewResult.sampleProducts.length ? (
  <div className="mt-6">
    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-neutral-950">
          Sample Products
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Backend preview se return hue matching catalog products.
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        Showing {previewResult.sampleProducts.length} of{" "}
        {previewResult.matchedProducts}
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
     {previewResult.sampleProducts.map((product, index) => {
  const productName =
    product.name?.trim() || "Untitled product";

  const productSku =
    product.sku?.trim() || "SKU unavailable";

  const productId =
    product.id?.trim() || `preview-product-${index}`;

  const productImageUrl =
    product.imageUrl?.trim() || null;

  const productImageAlt =
    product.imageAlt?.trim() || productName;

        return (
        <article
  key={productId}
  className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
>
  <div className="flex items-start gap-4">
    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
      {productImageUrl ? (
        <img
          src={productImageUrl}
          alt={productImageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center px-2 text-center text-[10px] font-medium text-neutral-400">
          No image
        </div>
      )}

      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>

    <div className="min-w-0 flex-1">
      <h4 className="break-words text-sm font-semibold leading-5 text-neutral-950">
        {productName}
      </h4>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-neutral-200 bg-[#fbfaf6] px-2.5 py-1 text-xs font-medium text-neutral-700">
          SKU: {productSku}
        </span>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Matched
        </span>
      </div>
    </div>
  </div>

  <div className="mt-4 border-t border-neutral-100 pt-3">
    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
      Product ID
    </p>

    <p className="mt-1 break-all font-mono text-xs text-neutral-500">
      {productId}
    </p>
  </div>
</article>
        );
      })}
    </div>
  </div>
) : (
      <div className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-center">
        <p className="text-sm font-medium text-neutral-800">
          No matching products found
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Condition field, operator ya value change karke preview dobara run
          karo.
        </p>
      </div>
    )}
  </section>
) : null}

<div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-950 p-4">
  <Button
    type="button"
    variant="outline"
    className="rounded-full bg-white text-neutral-950"
    onClick={handlePreviewRule}
    disabled={isPreviewing || isSubmitting}
  >
    {isPreviewing ? "Previewing..." : "Preview Matches"}
  </Button>

  <div className="flex gap-3">
    <Button
      type="button"
      variant="outline"
      className="rounded-full bg-white"
      onClick={closeCreateModal}
      disabled={isSubmitting || isPreviewing}
    >
      Cancel
    </Button>

    <Button
      type="button"
      className="rounded-full bg-white text-neutral-950 hover:bg-white/90"
      onClick={handleSaveRule}
      disabled={isSubmitting || isPreviewing}
    >
      {isSubmitting
        ? "Saving..."
        : editingRuleId
          ? "Update Rule"
          : "Save Rule"}
    </Button>
  </div>
</div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ConditionValueControl({
  field,
  value,
  onChange,
}: {
  field: CatalogStyleRuleConditionField | null;
  value: string;
  onChange: (value: string) => void;
}) {
  if (!field) {
    return (
      <input
        value=""
        disabled
        placeholder="Select field first"
        className="h-10 rounded-lg border border-neutral-300 bg-neutral-100 px-3 text-sm outline-none"
      />
    );
  }

  if (field.valueType === "SELECT" && field.options.length) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
      >
        <option value="">Select {field.label.toLowerCase()}</option>

        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  let placeholder = field.example
    ? `Example: ${field.example}`
    : `Enter ${field.label.toLowerCase()}`;

  if (field.valueType === "CATEGORY_SELECT") {
    placeholder = "Enter exact category value";
  }

  if (field.valueType === "PRODUCT_TYPE_SELECT") {
    placeholder = "Enter exact product type";
  }

  if (field.valueType === "BRAND_SELECT") {
    placeholder = "Enter exact brand";
  }

  if (field.valueType === "CHIPS") {
    placeholder = field.example
      ? `Enter one value, example: ${field.example}`
      : "Enter one value";
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
    />
  );
}

function StyleRuleCard({
  rule,
  actionId,
  actionType,
  ruleOptions,
  onEdit,
  onActivate,
  onDeactivate,
  onArchive,
}: {
  rule: CatalogStyleRule;
  actionId: string;
  actionType: "" | "activate" | "deactivate" | "archive";
  ruleOptions: CatalogStyleRuleOptions | null;
  onEdit: (rule: CatalogStyleRule) => void;
  onActivate: (rule: CatalogStyleRule) => void;
  onDeactivate: (rule: CatalogStyleRule) => void;
  onArchive: (rule: CatalogStyleRule) => void;
}) {
  const isActionLoading = actionId === rule.id;
  const isActive = rule.status === "ACTIVE";

  const conditionCount = rule.conditions?.length || 0;
  const actionCount = rule.actions?.length || 0;

    const getConditionFieldLabel = (fieldKey: string) =>
    ruleOptions?.conditionFields.find(
      (field) => field.key === fieldKey,
    )?.label || formatLabel(fieldKey);

  const getActionFieldLabel = (fieldKey: string) =>
    ruleOptions?.actionFields.find(
      (field) => field.key === fieldKey,
    )?.label || formatLabel(fieldKey);

  const getOperatorLabel = (operator: string) =>
    ruleOptions?.operatorLabels?.[operator] ||
    formatLabel(operator);

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg">
      <div
        className={`h-1.5 w-full ${
          isActive ? "bg-emerald-500" : "bg-neutral-300"
        }`}
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={rule.status} />

              <span className="rounded-full border border-neutral-200 bg-[#fbfaf6] px-3 py-1 text-xs font-medium text-neutral-700">
                {formatLabel(rule.businessType)}
              </span>
            </div>

            <h3 className="break-words text-xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-2xl">
              {rule.name}
            </h3>

            {rule.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                {rule.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">
                No description added for this rule.
              </p>
            )}
          </div>

        <div className="flex shrink-0 flex-wrap gap-2">
  <Button
    type="button"
    size="sm"
    variant="outline"
    className="h-10 rounded-full border-neutral-200 bg-white px-4"
    disabled={isActionLoading}
    onClick={() => onEdit(rule)}
  >
    <Pencil className="mr-2 h-3.5 w-3.5" />
    Edit
  </Button>

  {isActive ? (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-10 rounded-full border-amber-200 bg-amber-50 px-4 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
      disabled={isActionLoading}
      onClick={() => onDeactivate(rule)}
    >
      <PowerOff className="mr-2 h-3.5 w-3.5" />

      {isActionLoading && actionType === "deactivate"
        ? "Deactivating..."
        : "Deactivate"}
    </Button>
  ) : (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-10 rounded-full border-emerald-200 bg-emerald-50 px-4 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
      disabled={isActionLoading}
      onClick={() => onActivate(rule)}
    >
      <Power className="mr-2 h-3.5 w-3.5" />

      {isActionLoading && actionType === "activate"
        ? "Activating..."
        : "Activate"}
    </Button>
  )}

  <Button
    type="button"
    size="sm"
    variant="outline"
    className="h-10 rounded-full border-red-200 bg-red-50 px-4 text-red-700 hover:bg-red-100 hover:text-red-800"
    disabled={isActionLoading}
    onClick={() => onArchive(rule)}
  >
    <Archive className="mr-2 h-3.5 w-3.5" />

    {isActionLoading && actionType === "archive"
      ? "Archiving..."
      : "Archive"}
  </Button>
</div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 py-3">
            <div className="flex items-center gap-2 text-neutral-500">
              <GitBranch className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.12em]">
                Conditions
              </span>
            </div>

            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {conditionCount}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 py-3">
            <div className="flex items-center gap-2 text-neutral-500">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.12em]">
                Actions
              </span>
            </div>

            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {actionCount}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf6] px-4 py-3">
            <div className="flex items-center gap-2 text-neutral-500">
              <Tag className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.12em]">
                Priority
              </span>
            </div>

            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {rule.priority}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <section className="rounded-[1.25rem] border border-neutral-200 bg-[#fbfaf6] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Conditions
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  All conditions are combined using AND.
                </p>
              </div>

              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                {conditionCount}
              </span>
            </div>

            <div className="space-y-2">
              {conditionCount ? (
                rule.conditions.map((condition, index) => (
                  <div
                    key={`${condition.field}-${condition.operator}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neutral-950 text-[10px] font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-neutral-950">
                  {getConditionFieldLabel(condition.field)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                      {getOperatorLabel(condition.operator)}
                        </span>

                        <span className="break-all rounded-full border border-neutral-200 bg-[#fbfaf6] px-2.5 py-1 text-[11px] font-medium text-neutral-800">
                          {condition.value}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
                  No conditions configured.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-neutral-200 bg-[#fbfaf6] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Actions
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Applied when all rule conditions match.
                </p>
              </div>

              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                {actionCount}
              </span>
            </div>

            <div className="space-y-2">
              {actionCount ? (
                rule.actions.map((action, index) => (
                  <div
                    key={`${action.field}-${index}`}
                    className="rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Sparkles className="h-4 w-4" />
                      </span>

                      <p className="text-sm font-semibold text-neutral-950">
                       {getActionFieldLabel(action.field)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {action.value.length ? (
                        action.value.map((value) => (
                          <span
                            key={value}
                            className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                          >
                            {value}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-400">
                          No action values.
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-400">
                  No actions configured.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

function Field({
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

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-neutral-100 text-neutral-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
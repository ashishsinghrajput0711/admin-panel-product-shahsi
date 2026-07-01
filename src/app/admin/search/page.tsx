"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  getSearchSynonyms,
  getSearchBoostRules,
  getSearchFilterConfig,
  getSearchReindexJobs,
  getSearchAnalytics,
  getSearchNoResultRules,
  createSearchSynonym,
  updateSearchSynonym,
  deleteSearchSynonym,
  createSearchBoostRule,
  updateSearchBoostRule,
  deleteSearchBoostRule,
  triggerSearchReindex,
reindexSelectedProducts,
  saveSearchFilterConfig,
  createSearchNoResultRule,
updateSearchNoResultRule,
deleteSearchNoResultRule,
} from "@/lib/admin/search-admin-api";

type TabKey =
  | "synonyms"
  | "boostRules"
  | "filters"
  | "reindexJobs"
  | "analytics"
  | "noResultRules";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "synonyms", label: "Synonyms" },
  { key: "boostRules", label: "Boost Rules" },
  { key: "filters", label: "Filters" },
  { key: "reindexJobs", label: "Reindex Jobs" },
  { key: "analytics", label: "Analytics" },
  { key: "noResultRules", label: "No-result Rules" },
];

function getDataArray(data: any) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (data?.data) return [data.data];
  return [];
}

export default function SearchAdminPage() {

    const [noResultStatusFilter, setNoResultStatusFilter] = useState<
  "ACTIVE" | "ARCHIVED" | "ALL"
>("ACTIVE");

const [isNoResultFormOpen, setIsNoResultFormOpen] = useState(false);
const [editingNoResultRule, setEditingNoResultRule] = useState<any>(null);
const [noResultQuery, setNoResultQuery] = useState("");
const [noResultRedirectType, setNoResultRedirectType] = useState<
  "PRODUCT" | "CATEGORY" | "COLLECTION" | "SEARCH"
>("COLLECTION");
const [noResultRedirectTargetId, setNoResultRedirectTargetId] = useState("");
const [noResultMessage, setNoResultMessage] = useState("");
const [noResultStatus, setNoResultStatus] = useState("ACTIVE");
const [isSavingNoResultRule, setIsSavingNoResultRule] = useState(false);

    const [reindexScope, setReindexScope] = useState<
  "ALL" | "PRODUCTS" | "CATEGORIES" | "COLLECTIONS"
>("ALL");
const [selectedReindexProductIds, setSelectedReindexProductIds] = useState("");
const [isTriggeringReindex, setIsTriggeringReindex] = useState(false);
const [isTriggeringProductReindex, setIsTriggeringProductReindex] =
  useState(false);

    const [boostStatusFilter, setBoostStatusFilter] = useState<
  "ACTIVE" | "ARCHIVED" | "ALL"
>("ACTIVE");

const [filterContext, setFilterContext] = useState("products");
const [filterRows, setFilterRows] = useState<any[]>([]);
const [isSavingFilters, setIsSavingFilters] = useState(false);

const [isBoostFormOpen, setIsBoostFormOpen] = useState(false);
const [editingBoostRule, setEditingBoostRule] = useState<any>(null);
const [boostName, setBoostName] = useState("");
const [boostTargetType, setBoostTargetType] = useState<
  "PRODUCT" | "CATEGORY" | "COLLECTION" | "BRAND" | "TAG"
>("CATEGORY");
const [boostTargetId, setBoostTargetId] = useState("");
const [boostQuery, setBoostQuery] = useState("");
const [boostValue, setBoostValue] = useState("2.5");
const [boostStatus, setBoostStatus] = useState("ACTIVE");
const [boostStartsAt, setBoostStartsAt] = useState("");
const [boostEndsAt, setBoostEndsAt] = useState("");
const [isSavingBoostRule, setIsSavingBoostRule] = useState(false);

    const [isSynonymFormOpen, setIsSynonymFormOpen] = useState(false);
    const [synonymStatusFilter, setSynonymStatusFilter] = useState<
  "ACTIVE" | "ARCHIVED" | "ALL"
>("ACTIVE");
const [editingSynonym, setEditingSynonym] = useState<any>(null);
const [synonymTerm, setSynonymTerm] = useState("");
const [synonymValues, setSynonymValues] = useState("");
const [synonymStatus, setSynonymStatus] = useState("ACTIVE");
const [isSavingSynonym, setIsSavingSynonym] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("synonyms");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const title = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label || "Search Admin";
  }, [activeTab]);

  useEffect(() => {
    let ignore = false;

    async function loadTabData() {
      try {
        setIsLoading(true);
        setError("");

        let result: any = null;

        if (activeTab === "synonyms") {
          result = await getSearchSynonyms();
        }

        if (activeTab === "boostRules") {
          result = await getSearchBoostRules();
        }

        if (activeTab === "filters") {
          result = await getSearchFilterConfig("products");
        }

        if (activeTab === "reindexJobs") {
          result = await getSearchReindexJobs();
        }

        if (activeTab === "analytics") {
          result = await getSearchAnalytics();
        }

        if (activeTab === "noResultRules") {
          result = await getSearchNoResultRules();
        }

        if (!ignore) {
          setData(result);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Search admin data load failed.",
          );
          setData(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTabData();

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const rows = getDataArray(data);


  useEffect(() => {
  if (activeTab !== "filters") return;

  const config = Array.isArray(data?.data)
    ? data.data[0]
    : data?.data || data;

  const filters = Array.isArray(config?.filters) ? config.filters : [];

  setFilterRows(
    filters
      .map((filter: any, index: number) => ({
        key: filter.key || "",
        label: filter.label || "",
        type: filter.type || "MULTI_SELECT",
        source: filter.source || "ATTRIBUTE",
        enabled: filter.enabled !== false,
        position: Number(filter.position || index + 1),
      }))
      .sort((a: any, b: any) => a.position - b.position),
  );
}, [activeTab, data]);


  async function reloadActiveTab() {
  try {
    setIsLoading(true);
    setError("");

    let result: any = null;

    if (activeTab === "synonyms") result = await getSearchSynonyms();
    if (activeTab === "boostRules") result = await getSearchBoostRules();
    if (activeTab === "filters") result = await getSearchFilterConfig("products");
    if (activeTab === "reindexJobs") result = await getSearchReindexJobs();
    if (activeTab === "analytics") result = await getSearchAnalytics();
    if (activeTab === "noResultRules") result = await getSearchNoResultRules();

    setData(result);
  } catch (loadError) {
    setError(
      loadError instanceof Error
        ? loadError.message
        : "Search admin data load failed.",
    );
    setData(null);
  } finally {
    setIsLoading(false);
  }
}

function openCreateSynonym() {
  setEditingSynonym(null);
  setSynonymTerm("");
  setSynonymValues("");
  setSynonymStatus("ACTIVE");
  setIsSynonymFormOpen(true);
}

function openEditSynonym(row: any) {
  setEditingSynonym(row);
  setSynonymTerm(row.term || "");
  setSynonymValues(Array.isArray(row.synonyms) ? row.synonyms.join(", ") : "");
  setSynonymStatus(row.status || "ACTIVE");
  setIsSynonymFormOpen(true);
}

async function saveSynonym() {
  const term = synonymTerm.trim();
  const synonyms = synonymValues
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!term || synonyms.length === 0) {
    setError("Term and synonyms are required.");
    return;
  }

  try {
    setIsSavingSynonym(true);
    setError("");

    const payload = {
      term,
      synonyms,
      status: synonymStatus as "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED",
    };

    if (editingSynonym?.id) {
      await updateSearchSynonym(editingSynonym.id, payload);
    } else {
      await createSearchSynonym(payload);
    }

    setIsSynonymFormOpen(false);
    setEditingSynonym(null);
    await reloadActiveTab();
  } catch (saveError) {
    setError(
      saveError instanceof Error ? saveError.message : "Synonym save failed.",
    );
  } finally {
    setIsSavingSynonym(false);
  }
}

async function removeSynonym(row: any) {
  if (!row?.id) return;

const confirmed = window.confirm(`Archive synonym rule "${row.term}"?`);
  if (!confirmed) return;

  try {
    setError("");
    await deleteSearchSynonym(row.id);
    await reloadActiveTab();
  } catch (deleteError) {
    setError(
      deleteError instanceof Error
        ? deleteError.message
        : "Synonym delete failed.",
    );
  }
}

async function restoreSynonym(row: any) {
  if (!row?.id) return;

  try {
    setError("");

    await updateSearchSynonym(row.id, {
      status: "ACTIVE",
    });

    await reloadActiveTab();
    setSynonymStatusFilter("ACTIVE");
  } catch (restoreError) {
    setError(
      restoreError instanceof Error
        ? restoreError.message
        : "Synonym restore failed.",
    );
  }
}

function openCreateBoostRule() {
  setEditingBoostRule(null);
  setBoostName("");
  setBoostTargetType("CATEGORY");
  setBoostTargetId("");
  setBoostQuery("");
  setBoostValue("2.5");
  setBoostStatus("ACTIVE");
  setBoostStartsAt("");
  setBoostEndsAt("");
  setIsBoostFormOpen(true);
}

function openEditBoostRule(row: any) {
  setEditingBoostRule(row);
  setBoostName(row.name || "");
  setBoostTargetType(row.targetType || "CATEGORY");
  setBoostTargetId(row.targetId || "");
  setBoostQuery(row.query || "");
  setBoostValue(String(row.boostValue ?? "2.5"));
  setBoostStatus(row.status || "ACTIVE");
  setBoostStartsAt(row.startsAt ? String(row.startsAt).slice(0, 16) : "");
  setBoostEndsAt(row.endsAt ? String(row.endsAt).slice(0, 16) : "");
  setIsBoostFormOpen(true);
}

function getDateTimeIso(value: string) {
  if (!value.trim()) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

async function saveBoostRule() {
  const name = boostName.trim();
  const targetId = boostTargetId.trim();
  const query = boostQuery.trim();
  const numericBoostValue = Number(boostValue);

  if (!name || !targetId || !Number.isFinite(numericBoostValue)) {
    setError("Name, target ID and valid boost value are required.");
    return;
  }

  try {
    setIsSavingBoostRule(true);
    setError("");

    const payload = {
      name,
      targetType: boostTargetType,
      targetId,
      query,
      boostValue: numericBoostValue,
      status: boostStatus as "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED",
      startsAt: getDateTimeIso(boostStartsAt),
      endsAt: getDateTimeIso(boostEndsAt),
    };

    if (editingBoostRule?.id) {
      await updateSearchBoostRule(editingBoostRule.id, payload);
    } else {
      await createSearchBoostRule(payload);
    }

    setIsBoostFormOpen(false);
    setEditingBoostRule(null);
    await reloadActiveTab();
  } catch (saveError) {
    setError(
      saveError instanceof Error ? saveError.message : "Boost rule save failed.",
    );
  } finally {
    setIsSavingBoostRule(false);
  }
}

async function archiveBoostRule(row: any) {
  if (!row?.id) return;

  const confirmed = window.confirm(`Archive boost rule "${row.name}"?`);
  if (!confirmed) return;

  try {
    setError("");
    await deleteSearchBoostRule(row.id);
    await reloadActiveTab();
  } catch (archiveError) {
    setError(
      archiveError instanceof Error
        ? archiveError.message
        : "Boost rule archive failed.",
    );
  }
}

async function restoreBoostRule(row: any) {
  if (!row?.id) return;

  try {
    setError("");

    await updateSearchBoostRule(row.id, {
      status: "ACTIVE",
    });

    await reloadActiveTab();
    setBoostStatusFilter("ACTIVE");
  } catch (restoreError) {
    setError(
      restoreError instanceof Error
        ? restoreError.message
        : "Boost rule restore failed.",
    );
  }
}

function renderSynonymsTable() {
const synonyms = getDataArray(data).filter((row: any) => {
  const status = String(row.status || "ACTIVE").toUpperCase();

  if (synonymStatusFilter === "ALL") return true;
  return status === synonymStatusFilter;
});

  return (
    <div className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-neutral-600">Status</span>

    <select
      value={synonymStatusFilter}
      onChange={(event) =>
        setSynonymStatusFilter(
          event.target.value as "ACTIVE" | "ARCHIVED" | "ALL",
        )
      }
      className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
    >
      <option value="ACTIVE">Active</option>
      <option value="ARCHIVED">Archived</option>
      <option value="ALL">All</option>
    </select>
  </div>

  <button
    type="button"
    onClick={openCreateSynonym}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Add Synonym
        </button>
      </div>

      {isSynonymFormOpen ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-950">
              {editingSynonym ? "Edit Synonym" : "Add Synonym"}
            </h3>

            <button
              type="button"
              onClick={() => setIsSynonymFormOpen(false)}
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_2fr_180px]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Term
              </label>
              <input
                value={synonymTerm}
                onChange={(event) => setSynonymTerm(event.target.value)}
                placeholder="lehenga"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Synonyms
              </label>
              <input
                value={synonymValues}
                onChange={(event) => setSynonymValues(event.target.value)}
                placeholder="bridal lehenga, wedding lehenga, designer lehenga"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Comma separated values.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Status
              </label>
              <select
                value={synonymStatus}
                onChange={(event) => setSynonymStatus(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSynonymFormOpen(false)}
              className="h-10 rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveSynonym}
              disabled={isSavingSynonym}
              className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingSynonym ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

    {isLoading ? (
  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
    Loading synonym rules...
  </div>
) : synonyms.length === 0 ? (
  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
    No synonym rules found.
  </div>
) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3">Synonyms</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {synonyms.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-neutral-950">
                    {row.term}
                  </td>

                  <td className="px-4 py-3 text-neutral-600">
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(row.synonyms) ? row.synonyms : []).map(
                        (synonym: string) => (
                          <span
                            key={synonym}
                            className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                          >
                            {synonym}
                          </span>
                        ),
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      {row.status || "ACTIVE"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditSynonym(row)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                     {String(row.status || "ACTIVE").toUpperCase() === "ARCHIVED" ? (
  <button
    type="button"
    onClick={() => restoreSynonym(row)}
    className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
  >
    Restore
  </button>
) : (
  <button
    type="button"
    onClick={() => removeSynonym(row)}
    className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
  >
    <Trash2 className="h-3.5 w-3.5" />
    Archive
  </button>
)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



function renderBoostRulesTable() {
  const boostRules = getDataArray(data).filter((row: any) => {
    const status = String(row.status || "ACTIVE").toUpperCase();

    if (boostStatusFilter === "ALL") return true;
    return status === boostStatusFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600">Status</span>

          <select
            value={boostStatusFilter}
            onChange={(event) =>
              setBoostStatusFilter(
                event.target.value as "ACTIVE" | "ARCHIVED" | "ALL",
              )
            }
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="ALL">All</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateBoostRule}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Add Boost Rule
        </button>
      </div>

      {isBoostFormOpen ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-950">
              {editingBoostRule ? "Edit Boost Rule" : "Add Boost Rule"}
            </h3>

            <button
              type="button"
              onClick={() => setIsBoostFormOpen(false)}
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Rule Name
              </label>
              <input
                value={boostName}
                onChange={(event) => setBoostName(event.target.value)}
                placeholder="Boost Bridal Collection"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Target Type
              </label>
              <select
                value={boostTargetType}
                onChange={(event) =>
                  setBoostTargetType(
                    event.target.value as
                      | "PRODUCT"
                      | "CATEGORY"
                      | "COLLECTION"
                      | "BRAND"
                      | "TAG",
                  )
                }
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="PRODUCT">PRODUCT</option>
                <option value="CATEGORY">CATEGORY</option>
                <option value="COLLECTION">COLLECTION</option>
                <option value="BRAND">BRAND</option>
                <option value="TAG">TAG</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Target ID
              </label>
              <input
                value={boostTargetId}
                onChange={(event) => setBoostTargetId(event.target.value)}
                placeholder="replace-with-category-id"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Query
              </label>
              <input
                value={boostQuery}
                onChange={(event) => setBoostQuery(event.target.value)}
                placeholder="wedding"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Boost Value
              </label>
              <input
                type="number"
                step="0.1"
                value={boostValue}
                onChange={(event) => setBoostValue(event.target.value)}
                placeholder="2.5"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Status
              </label>
              <select
                value={boostStatus}
                onChange={(event) => setBoostStatus(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Starts At
              </label>
              <input
                type="datetime-local"
                value={boostStartsAt}
                onChange={(event) => setBoostStartsAt(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ends At
              </label>
              <input
                type="datetime-local"
                value={boostEndsAt}
                onChange={(event) => setBoostEndsAt(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBoostFormOpen(false)}
              className="h-10 rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveBoostRule}
              disabled={isSavingBoostRule}
              className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingBoostRule ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          Loading boost rules...
        </div>
      ) : boostRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          No boost rules found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3">Boost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {boostRules.map((row: any) => {
                const status = String(row.status || "ACTIVE").toUpperCase();

                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-neutral-950">
                      {row.name || "-"}
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      <div className="space-y-1">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                          {row.targetType || "-"}
                        </span>
                        <p className="max-w-[240px] truncate text-xs text-neutral-500">
                          {row.targetId || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      {row.query || "-"}
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      {row.boostValue ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          status === "ARCHIVED"
                            ? "bg-neutral-100 text-neutral-600 ring-neutral-200"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditBoostRule(row)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {status === "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => restoreBoostRule(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => archiveBoostRule(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function renderFiltersTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600">Context</span>

          <select
            value={filterContext}
            onChange={(event) => setFilterContext(event.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
          >
            <option value="products">products</option>
            <option value="categories">categories</option>
            <option value="collections">collections</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addFilterRow}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Filter
          </button>

          <button
            type="button"
            onClick={saveFilters}
            disabled={isSavingFilters}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingFilters ? "Saving..." : "Save Filters"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          Loading filter config...
        </div>
      ) : filterRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          No filters found. Add filters and save config.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {filterRows.map((row, index) => (
                <tr key={`${row.key || "filter"}-${index}`}>
                  <td className="px-4 py-3">
                    <input
                      value={row.key}
                      onChange={(event) =>
                        updateFilterRow(index, "key", event.target.value)
                      }
                      placeholder="color"
                      className="h-9 w-full rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-950"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      value={row.label}
                      onChange={(event) =>
                        updateFilterRow(index, "label", event.target.value)
                      }
                      placeholder="Color"
                      className="h-9 w-full rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-950"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={row.type}
                      onChange={(event) =>
                        updateFilterRow(index, "type", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-950"
                    >
                      <option value="MULTI_SELECT">MULTI_SELECT</option>
                      <option value="SINGLE_SELECT">SINGLE_SELECT</option>
                      <option value="RANGE">RANGE</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={row.source}
                      onChange={(event) =>
                        updateFilterRow(index, "source", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-950"
                    >
                      <option value="CATEGORY">CATEGORY</option>
                      <option value="PRICE">PRICE</option>
                      <option value="VARIANT_OPTION">VARIANT_OPTION</option>
                      <option value="ATTRIBUTE">ATTRIBUTE</option>
                      <option value="BRAND">BRAND</option>
                      <option value="TAG">TAG</option>
                      <option value="COLLECTION">COLLECTION</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(row.enabled)}
                        onChange={(event) =>
                          updateFilterRow(index, "enabled", event.target.checked)
                        }
                      />
                      <span className="text-xs text-neutral-600">
                        {row.enabled ? "Yes" : "No"}
                      </span>
                    </label>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.position}
                      onChange={(event) =>
                        updateFilterRow(
                          index,
                          "position",
                          Number(event.target.value),
                        )
                      }
                      className="h-9 w-20 rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-neutral-950"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeFilterRow(index)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Saving filters will replace the full filters array for this context.
      </p>
    </div>
  );
}


function renderReindexJobsTable() {
  const jobs = getDataArray(data);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-base font-semibold text-neutral-950">
            Trigger Reindex
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Full ya scope based search reindex manually run karo.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={reindexScope}
              onChange={(event) =>
                setReindexScope(
                  event.target.value as
                    | "ALL"
                    | "PRODUCTS"
                    | "CATEGORIES"
                    | "COLLECTIONS",
                )
              }
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            >
              <option value="ALL">ALL</option>
              <option value="PRODUCTS">PRODUCTS</option>
              <option value="CATEGORIES">CATEGORIES</option>
              <option value="COLLECTIONS">COLLECTIONS</option>
            </select>

            <button
              type="button"
              onClick={runScopeReindex}
              disabled={isTriggeringReindex}
              className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTriggeringReindex ? "Running..." : "Run Reindex"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-base font-semibold text-neutral-950">
            Reindex Selected Products
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Product IDs comma ya new line separated daalo.
          </p>

          <textarea
            value={selectedReindexProductIds}
            onChange={(event) =>
              setSelectedReindexProductIds(event.target.value)
            }
            placeholder="8703b48a-fbb3-4eda-a931-bb664bb604c4"
            rows={3}
            className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={runSelectedProductsReindex}
              disabled={isTriggeringProductReindex}
              className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTriggeringProductReindex
                ? "Running..."
                : "Reindex Products"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">
              Job History
            </h3>
            <p className="text-sm text-neutral-500">
              Backend reindex job status/history.
            </p>
          </div>

          <button
            type="button"
            onClick={reloadActiveTab}
            className="h-9 rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            Loading reindex jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            No reindex jobs found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Counts</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {jobs.map((job: any, index: number) => {
                  const status = String(
                    job.status || job.state || "UNKNOWN",
                  ).toUpperCase();

                  return (
                    <tr key={job.id || index}>
                     <td className="min-w-[220px] px-4 py-3 font-medium text-neutral-950">
                        {job.id || job.jobId || `Job ${index + 1}`}
                      </td>

                      <td className="px-4 py-3 text-neutral-600">
                        {job.scope || job.type || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            status === "COMPLETED" || status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : status === "FAILED" || status === "ERROR"
                                ? "bg-red-50 text-red-700 ring-red-100"
                                : "bg-amber-50 text-amber-700 ring-amber-100"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-neutral-600">
                        {job.total !== undefined ||
                        job.processed !== undefined ||
                        job.failed !== undefined ? (
                          <span>
                            {job.processed ?? 0}/{job.total ?? "-"} processed
                            {job.failed !== undefined
                              ? ` · ${job.failed} failed`
                              : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-3 text-neutral-600">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleString()
                          : job.updatedAt
                            ? new Date(job.updatedAt).toLocaleString()
                            : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function renderAnalyticsDashboard() {
  const analytics = data?.data || data || {};

  const topQueries =
    analytics.topQueries ||
    analytics.topSearches ||
    analytics.popularQueries ||
    analytics.queries ||
    [];

  const noResultQueries =
    analytics.noResultQueries ||
    analytics.noResults ||
    analytics.zeroResultQueries ||
    [];

 const summary = analytics.summary || {};

const totalSearches =
  summary.totalSearches ??
  analytics.totalSearches ??
  analytics.totalQueries ??
  analytics.searchCount ??
  0;

const totalNoResults =
  summary.noResultSearches ??
  summary.totalNoResults ??
  analytics.totalNoResults ??
  analytics.noResultCount ??
  analytics.zeroResultCount ??
  noResultQueries.length ??
  0;

const conversionRate =
  summary.conversionRate ??
  analytics.conversionRate ??
  analytics.searchConversionRate ??
  analytics.ctr ??
  null;

const uniqueSearches =
  summary.uniqueSearches ??
  analytics.uniqueSearches ??
  null;

  function getQueryText(row: any) {
    return row.query || row.term || row.search || row.q || "-";
  }

  function getQueryCount(row: any) {
    return row.count ?? row.total ?? row.searches ?? row.frequency ?? "-";
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Total Searches
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-950">
            {totalSearches}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            No-result Searches
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-950">
            {totalNoResults}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Conversion / CTR
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-950">
            {conversionRate === null || conversionRate === undefined
              ? "-"
              : `${conversionRate}%`}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Unique Searches
          </p>
          <p className="mt-2 text-3xl font-semibold text-neutral-950">
          {uniqueSearches ?? "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h3 className="text-base font-semibold text-neutral-950">
              Top Queries
            </h3>
            <p className="text-sm text-neutral-500">
              Most searched terms from backend analytics.
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-neutral-500">
              Loading top queries...
            </div>
          ) : topQueries.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              No top query data found.
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Count</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-200">
                  {topQueries.map((row: any, index: number) => (
                    <tr key={`${getQueryText(row)}-${index}`}>
                      <td className="px-4 py-3 font-medium text-neutral-950">
                        {getQueryText(row)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {getQueryCount(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h3 className="text-base font-semibold text-neutral-950">
              No-result Queries
            </h3>
            <p className="text-sm text-neutral-500">
              Queries jinke liye search result nahi mila.
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-neutral-500">
              Loading no-result queries...
            </div>
          ) : noResultQueries.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              No no-result query data found.
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Count</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-200">
                  {noResultQueries.map((row: any, index: number) => (
                    <tr key={`${getQueryText(row)}-${index}`}>
                      <td className="px-4 py-3 font-medium text-neutral-950">
                        {getQueryText(row)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {getQueryCount(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">
              Raw Analytics Response
            </h3>
            <p className="text-sm text-neutral-500">
              Backend response shape verify karne ke liye.
            </p>
          </div>

          <button
            type="button"
            onClick={reloadActiveTab}
            className="h-9 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        <pre className="max-h-80 overflow-auto rounded-xl bg-white p-4 text-xs text-neutral-700">
          {JSON.stringify(analytics, null, 2)}
        </pre>
      </div>
    </div>
  );
}


function renderNoResultRulesTable() {
  const rules = getDataArray(data).filter((row: any) => {
    const status = String(row.status || "ACTIVE").toUpperCase();

    if (noResultStatusFilter === "ALL") return true;
    return status === noResultStatusFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600">Status</span>

          <select
            value={noResultStatusFilter}
            onChange={(event) =>
              setNoResultStatusFilter(
                event.target.value as "ACTIVE" | "ARCHIVED" | "ALL",
              )
            }
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="ALL">All</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateNoResultRule}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Add No-result Rule
        </button>
      </div>

      {isNoResultFormOpen ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-950">
              {editingNoResultRule ? "Edit No-result Rule" : "Add No-result Rule"}
            </h3>

            <button
              type="button"
              onClick={() => setIsNoResultFormOpen(false)}
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Query
              </label>
              <input
                value={noResultQuery}
                onChange={(event) => setNoResultQuery(event.target.value)}
                placeholder="bridal gown"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Redirect Type
              </label>
              <select
                value={noResultRedirectType}
                onChange={(event) =>
                  setNoResultRedirectType(
                    event.target.value as
                      | "PRODUCT"
                      | "CATEGORY"
                      | "COLLECTION"
                      | "SEARCH",
                  )
                }
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="PRODUCT">PRODUCT</option>
                <option value="CATEGORY">CATEGORY</option>
                <option value="COLLECTION">COLLECTION</option>
                <option value="SEARCH">SEARCH</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Redirect Target ID
              </label>
              <input
                value={noResultRedirectTargetId}
                onChange={(event) =>
                  setNoResultRedirectTargetId(event.target.value)
                }
                placeholder="replace-with-collection-id"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Status
              </label>
              <select
                value={noResultStatus}
                onChange={(event) => setNoResultStatus(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Message
              </label>
              <input
                value={noResultMessage}
                onChange={(event) => setNoResultMessage(event.target.value)}
                placeholder="Showing similar bridal collection"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNoResultFormOpen(false)}
              className="h-10 rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveNoResultRule}
              disabled={isSavingNoResultRule}
              className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingNoResultRule ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          Loading no-result rules...
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          No no-result rules found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3">Redirect</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {rules.map((row: any) => {
                const status = String(row.status || "ACTIVE").toUpperCase();

                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-neutral-950">
                      {row.query || "-"}
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      <div className="space-y-1">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                          {row.redirectType || "-"}
                        </span>
                        <p className="max-w-[280px] truncate text-xs text-neutral-500">
                          {row.redirectTargetId || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      {row.message || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          status === "ARCHIVED"
                            ? "bg-neutral-100 text-neutral-600 ring-neutral-200"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditNoResultRule(row)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {status === "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => restoreNoResultRule(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => archiveNoResultRule(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function openCreateNoResultRule() {
  setEditingNoResultRule(null);
  setNoResultQuery("");
  setNoResultRedirectType("COLLECTION");
  setNoResultRedirectTargetId("");
  setNoResultMessage("");
  setNoResultStatus("ACTIVE");
  setIsNoResultFormOpen(true);
}

function openEditNoResultRule(row: any) {
  setEditingNoResultRule(row);
  setNoResultQuery(row.query || "");
  setNoResultRedirectType(row.redirectType || "COLLECTION");
  setNoResultRedirectTargetId(row.redirectTargetId || "");
  setNoResultMessage(row.message || "");
  setNoResultStatus(row.status || "ACTIVE");
  setIsNoResultFormOpen(true);
}

async function saveNoResultRule() {
  const query = noResultQuery.trim();
  const redirectTargetId = noResultRedirectTargetId.trim();
  const message = noResultMessage.trim();

  if (!query || !redirectTargetId) {
    setError("Query and redirect target ID are required.");
    return;
  }

  try {
    setIsSavingNoResultRule(true);
    setError("");

    const payload = {
      query,
      redirectType: noResultRedirectType,
      redirectTargetId,
      message,
      status: noResultStatus as "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED",
    };

    if (editingNoResultRule?.id) {
      await updateSearchNoResultRule(editingNoResultRule.id, payload);
    } else {
      await createSearchNoResultRule(payload);
    }

    setIsNoResultFormOpen(false);
    setEditingNoResultRule(null);
    await reloadActiveTab();
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "No-result rule save failed.",
    );
  } finally {
    setIsSavingNoResultRule(false);
  }
}

async function archiveNoResultRule(row: any) {
  if (!row?.id) return;

  const confirmed = window.confirm(`Archive no-result rule "${row.query}"?`);
  if (!confirmed) return;

  try {
    setError("");
    await deleteSearchNoResultRule(row.id);
    await reloadActiveTab();
  } catch (archiveError) {
    setError(
      archiveError instanceof Error
        ? archiveError.message
        : "No-result rule archive failed.",
    );
  }
}

async function restoreNoResultRule(row: any) {
  if (!row?.id) return;

  try {
    setError("");

    await updateSearchNoResultRule(row.id, {
      status: "ACTIVE",
    });

    await reloadActiveTab();
    setNoResultStatusFilter("ACTIVE");
  } catch (restoreError) {
    setError(
      restoreError instanceof Error
        ? restoreError.message
        : "No-result rule restore failed.",
    );
  }
}

function updateFilterRow(index: number, key: string, value: unknown) {
  setFilterRows((previous) =>
    previous.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: value } : row,
    ),
  );
}

function addFilterRow() {
  setFilterRows((previous) => [
    ...previous,
    {
      key: "",
      label: "",
      type: "MULTI_SELECT",
      source: "ATTRIBUTE",
      enabled: true,
      position: previous.length + 1,
    },
  ]);
}

function removeFilterRow(index: number) {
  setFilterRows((previous) =>
    previous
      .filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({
        ...row,
        position: rowIndex + 1,
      })),
  );
}

async function saveFilters() {
  const cleanedFilters = filterRows
    .map((row, index) => ({
      key: String(row.key || "").trim(),
      label: String(row.label || "").trim(),
      type: row.type || "MULTI_SELECT",
      source: row.source || "ATTRIBUTE",
      enabled: Boolean(row.enabled),
      position: Number(row.position || index + 1),
    }))
    .filter((row) => row.key && row.label);

  if (cleanedFilters.length === 0) {
    setError("At least one valid filter is required.");
    return;
  }

  try {
    setIsSavingFilters(true);
    setError("");

    await saveSearchFilterConfig({
      context: filterContext,
      filters: cleanedFilters,
    });

    await reloadActiveTab();
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "Filter config save failed.",
    );
  } finally {
    setIsSavingFilters(false);
  }
}

async function runScopeReindex() {
  const confirmed = window.confirm(`Trigger ${reindexScope} reindex?`);
  if (!confirmed) return;

  try {
    setIsTriggeringReindex(true);
    setError("");

    await triggerSearchReindex({
      scope: reindexScope,
    });

    await reloadActiveTab();
  } catch (reindexError) {
    setError(
      reindexError instanceof Error
        ? reindexError.message
        : "Reindex trigger failed.",
    );
  } finally {
    setIsTriggeringReindex(false);
  }
}

async function runSelectedProductsReindex() {
  const productIds = selectedReindexProductIds
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (productIds.length === 0) {
    setError("At least one product ID is required.");
    return;
  }

  try {
    setIsTriggeringProductReindex(true);
    setError("");

    await reindexSelectedProducts({
      productIds,
    });

    setSelectedReindexProductIds("");
    await reloadActiveTab();
  } catch (reindexError) {
    setError(
      reindexError instanceof Error
        ? reindexError.message
        : "Selected products reindex failed.",
    );
  } finally {
    setIsTriggeringProductReindex(false);
  }
}

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-950">
          Search Admin
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage search synonyms, boost rules, filters, indexing, analytics and
          no-result handling.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-2">
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
   onClick={() => {
  setActiveTab(tab.key);
  setError("");
  setIsSynonymFormOpen(false);
  setEditingSynonym(null);
  setIsBoostFormOpen(false);
  setEditingBoostRule(null);
  setIsNoResultFormOpen(false);
  setEditingNoResultRule(null);
}}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
            <p className="text-sm text-neutral-500">
              {activeTab === "filters"
                ? "Context: products"
                : "Backend connected data"}
            </p>
          </div>

          {isLoading ? (
            <span className="text-sm text-neutral-500">Loading...</span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

      {!error && activeTab === "synonyms" ? renderSynonymsTable() : null}

      {!error && activeTab === "boostRules" ? renderBoostRulesTable() : null}

      {!error && activeTab === "filters" ? renderFiltersTable() : null}

      {!error && activeTab === "reindexJobs" ? renderReindexJobsTable() : null}

      {!error && activeTab === "analytics" ? renderAnalyticsDashboard() : null}


      {!error && activeTab === "noResultRules" ? renderNoResultRulesTable() : null}

{!error && !isLoading && activeTab !== "synonyms" &&
activeTab !== "boostRules" &&
activeTab !== "filters" &&
activeTab !== "reindexJobs" &&
activeTab !== "analytics" &&
activeTab !== "noResultRules"&& rows.length === 0 ? (
  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
    No records found.
  </div>
) : null}

{!error && activeTab !== "synonyms" &&
activeTab !== "boostRules" &&
activeTab !== "filters" &&
activeTab !== "reindexJobs" &&
activeTab !== "analytics" &&
activeTab !== "noResultRules" && rows.length > 0 ? (
  <div className="overflow-hidden rounded-xl border border-neutral-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Record</th>
          <th className="px-4 py-3">Details</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-neutral-200">
        {rows.map((row: any, index: number) => (
          <tr key={row.id || index}>
            <td className="px-4 py-3 font-medium text-neutral-950">
              {row.name ||
                row.term ||
                row.query ||
                row.context ||
                row.id ||
                `Record ${index + 1}`}
            </td>

            <td className="max-w-xl px-4 py-3 text-neutral-600">
              <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-50 p-2 text-xs">
                {JSON.stringify(row, null, 2)}
              </pre>
            </td>

            <td className="px-4 py-3 text-neutral-600">
              {row.status || row.state || row.enabled?.toString() || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : null}
      </section>
    </main>
  );
}
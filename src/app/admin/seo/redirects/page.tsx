"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/admin-auth";

type RedirectRecord = {
  id: string;
  sourceUrl: string;
  sourcePath?: string | null;
  destinationUrl: string;
  destinationPath?: string | null;
  redirectType?: string | null;
  statusCode?: number | null;
  status?: string | null;
  isActive?: boolean | null;
  hitCount?: number | null;
  lastHitAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RedirectsResponse = {
  data?: RedirectRecord[];
  total?: number;
  message?: string | string[];
};

function normalizeApiMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
}

function getRedirectItems(response: RedirectsResponse | RedirectRecord[]) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayPath(primary?: string | null, fallback?: string | null) {
  return primary || fallback || "-";
}

export default function SeoRedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredRedirects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return redirects;

    return redirects.filter((redirect) =>
      [
        redirect.sourceUrl,
        redirect.sourcePath,
        redirect.destinationUrl,
        redirect.destinationPath,
        redirect.notes,
      ]
        .filter(Boolean)
        .some((value) => `${value}`.toLowerCase().includes(query)),
    );
  }, [redirects, search]);

  async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin token missing hai. Please login again.");
    }

    const response = await fetch(`/api/proxy${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw new Error(
        normalizeApiMessage(data, `${path} failed: ${response.status} ${response.statusText}`),
      );
    }

    return data as T;
  }

  async function loadRedirects() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<RedirectsResponse | RedirectRecord[]>(
        "/admin/seo/redirects",
      );

      const items = getRedirectItems(response).sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setRedirects(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redirects load failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRedirect(id: string) {
    const confirmed = window.confirm("Selected redirect delete karna hai?");
    if (!confirmed) return;

    try {
      setActionLoading(`delete-${id}`);
      setError(null);
      setNotice(null);

      await apiRequest(`/admin/seo/redirects/${id}`, {
        method: "DELETE",
      });

      setRedirects((prev) => prev.filter((redirect) => redirect.id !== id));
      setNotice("Redirect deleted successfully.");
      await loadRedirects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redirect delete failed.");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    loadRedirects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f6f3] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1260px] space-y-5">
        <Card className="overflow-hidden rounded-[2rem] border-neutral-200 bg-neutral-950 text-white shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
                Admin / SEO / Redirects
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                URL redirects
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
                Manage product and collection redirects from one clean table.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/15"
                onClick={loadRedirects}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
            </div>
          </div>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-[1.75rem] border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 p-4 sm:p-5">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter redirects"
                className="h-11 rounded-xl border-neutral-200 bg-white pl-11 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <th className="px-5 py-3">Redirect from</th>
                  <th className="px-5 py-3">Redirect to</th>
                  <th className="px-5 py-3">Hits</th>
                  <th className="px-5 py-3">Last hit</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-neutral-500">
                      Loading redirects...
                    </td>
                  </tr>
                ) : filteredRedirects.length ? (
                  filteredRedirects.map((redirect) => (
                    <tr
                      key={redirect.id}
                      className="group align-top transition hover:bg-[#fbfaf6]"
                    >
                      <td className="max-w-[420px] px-5 py-4">
                        <Link
                          href={`/admin/seo/redirects/${redirect.id}`}
                          className="block break-all rounded-xl bg-neutral-50 px-3 py-2 font-mono text-sm font-medium text-neutral-950 transition group-hover:bg-white group-hover:underline"
                        >
                          {displayPath(redirect.sourcePath, redirect.sourceUrl)}
                        </Link>
                      </td>
                      <td className="max-w-[420px] px-5 py-4">
                        <div className="flex items-start gap-2">
                          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-neutral-400" />
                          <p className="break-all rounded-xl bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-800 group-hover:bg-white">
                            {displayPath(redirect.destinationPath, redirect.destinationUrl)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-neutral-950">
                        {redirect.hitCount || 0}
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-600">
                        {formatDate(redirect.lastHitAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl bg-white"
                          >
                            <Link href={`/admin/seo/redirects/${redirect.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-50"
                            disabled={actionLoading !== null}
                            onClick={() => deleteRedirect(redirect.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                     
                      
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-neutral-100 px-5 py-4 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-neutral-950">{filteredRedirects.length}</strong> of{" "}
              <strong className="text-neutral-950">{redirects.length}</strong> redirects
            </span>
            <span>Click redirect or Edit to update it on a separate page.</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

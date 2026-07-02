"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminToken } from "@/lib/admin-auth";

type RedirectRecord = {
  id: string;
  sourceUrl: string;
  sourcePath?: string | null;
  destinationUrl: string;
  destinationPath?: string | null;
  redirectType?: string | null;
  status?: string | null;
  notes?: string | null;
};

type RedirectResponse = {
  data?: RedirectRecord;
  redirect?: RedirectRecord;
  message?: string | string[];
} & Partial<RedirectRecord>;

type RedirectFormState = {
  sourceUrl: string;
  destinationUrl: string;
  notes: string;
};

const emptyForm: RedirectFormState = {
  sourceUrl: "",
  destinationUrl: "",
  notes: "",
};

function normalizeApiMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
}

function getRedirectPayload(response: RedirectResponse): RedirectRecord | null {
  if (response.data) return response.data;
  if (response.redirect) return response.redirect;
  if (response.id && response.sourceUrl && response.destinationUrl) {
    return response as RedirectRecord;
  }
  return null;
}

function normalizePath(value: string) {
  const cleanValue = value.trim();
  if (!cleanValue) return "";

  try {
    const parsed = new URL(cleanValue);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (cleanValue.startsWith("/")) return cleanValue;
    return `/${cleanValue}`;
  }
}

export default function RedirectEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const redirectId = params.id;
  const isCreateMode = redirectId === "new";

  const [form, setForm] = useState<RedirectFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pageTitle = useMemo(
    () => (isCreateMode ? "Create URL redirect" : "Edit URL redirect"),
    [isCreateMode],
  );

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

  async function loadRedirect() {
    if (isCreateMode) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<RedirectResponse>(
        `/admin/seo/redirects/${redirectId}`,
      );
      const redirect = getRedirectPayload(response);

      if (!redirect) {
        throw new Error("Redirect detail response missing hai.");
      }

      setForm({
        sourceUrl: redirect.sourcePath || redirect.sourceUrl || "",
        destinationUrl: redirect.destinationPath || redirect.destinationUrl || "",
        notes: redirect.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redirect detail load failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildSaveBody() {
    const sourceUrl = normalizePath(form.sourceUrl);
    const destinationUrl = normalizePath(form.destinationUrl);

    if (!sourceUrl) throw new Error("Redirect from URL required hai.");
    if (!destinationUrl) throw new Error("Redirect to URL required hai.");
    if (sourceUrl === destinationUrl) {
      throw new Error("Redirect from aur redirect to same nahi ho sakte.");
    }

    return {
      sourceUrl,
      destinationUrl,
      redirectType: "PERMANENT_301",
      status: "ACTIVE",
      notes: form.notes.trim() || undefined,
    };
  }

  async function saveRedirect() {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const body = buildSaveBody();

      if (isCreateMode) {
        await apiRequest("/admin/seo/redirects", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setNotice("Redirect created successfully.");
      } else {
        await apiRequest(`/admin/seo/redirects/${redirectId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setNotice("Redirect updated successfully.");
      }

      router.push("/admin/seo/redirects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redirect save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRedirect() {
    if (isCreateMode) return;

    const confirmed = window.confirm("Selected redirect delete karna hai?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError(null);
      setNotice(null);

      await apiRequest(`/admin/seo/redirects/${redirectId}`, {
        method: "DELETE",
      });

      router.push("/admin/seo/redirects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redirect delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    loadRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectId]);

  return (
    <main className="min-h-screen bg-[#f6f6f3] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/admin/seo/redirects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              URL redirects
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="pt-2">
            <h1 className="text-3xl font-semibold text-neutral-950">{pageTitle}</h1>
            <div className="mt-8 space-y-10 text-sm leading-6 text-neutral-600">
              <div>
                <p className="font-semibold text-neutral-950">Redirect from</p>
                <p className="mt-2">
                  The original URL visitors come from. Usually this is an old product, collection or page URL.
                </p>
              </div>
              <div>
                <p className="font-semibold text-neutral-950">Redirect to</p>
                <p className="mt-2">
                  The new URL where visitors should be forwarded. Use path format like /products/new-slug.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
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

            <Card className="rounded-[1.5rem] border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              {isLoading ? (
                <p className="py-8 text-center text-sm text-neutral-500">Loading redirect...</p>
              ) : (
                <div className="space-y-5">
                  <Field label="Redirect from">
                    <Input
                      value={form.sourceUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({ ...prev, sourceUrl: normalizePath(prev.sourceUrl) }))
                      }
                      className={inputClassName}
                      placeholder="/products/old-product-url"
                    />
                  </Field>

                  <Field label="Redirect to">
                    <Input
                      value={form.destinationUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, destinationUrl: event.target.value }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          destinationUrl: normalizePath(prev.destinationUrl),
                        }))
                      }
                      className={inputClassName}
                      placeholder="/products/new-product-url"
                    />
                  </Field>

                  
                </div>
              )}
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              {!isCreateMode ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-50"
                  disabled={isDeleting || isSaving || isLoading}
                  onClick={deleteRedirect}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete redirect"}
                </Button>
              ) : null}

              <Button
                type="button"
                className="rounded-xl bg-neutral-950"
                disabled={isSaving || isDeleting || isLoading}
                onClick={saveRedirect}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save redirect"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border-neutral-200 bg-white text-sm shadow-none focus-visible:ring-1 focus-visible:ring-neutral-950";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <p className="mb-2 text-sm font-medium text-neutral-950">{label}</p>
      {children}
    </label>
  );
}

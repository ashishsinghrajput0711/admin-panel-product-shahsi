"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUpdate } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AttributeForm } from "@/components/admin/catalog/attributes/attribute-form";
import type { AttributeFormValues } from "@/components/admin/catalog/attributes/attribute-schema";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string | string[] | { message?: string | string[] };
  message?: string | string[];
};

function getApiRootUrl() {
  return "/api/proxy";
}

function getToken() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");

  return token?.replace(/^Bearer\s+/i, "").trim() || null;
}

function getAuthHeaders() {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "*/*",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Backend ne JSON response nahi diya.");
  }
}

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;

  if (Array.isArray(data.error)) return data.error.join(", ");
  if (typeof data.error === "string") return data.error;

  if (data.error && typeof data.error === "object") {
    if (Array.isArray(data.error.message)) return data.error.message.join(", ");
    if (typeof data.error.message === "string") return data.error.message;
  }

  return fallback;
}

function extractAttributeData(
  json: ApiResponse<AttributeFormValues> | AttributeFormValues
) {
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }

  return json as AttributeFormValues;
}

export default function EditAttributePage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const [attribute, setAttribute] = useState<AttributeFormValues | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const updateMutation = useUpdate();
  const { mutate } = updateMutation;

  const isSubmitting =
    "isLoading" in updateMutation
      ? Boolean(updateMutation.isLoading)
      : "isPending" in updateMutation
        ? Boolean(updateMutation.isPending)
        : false;

  useEffect(() => {
    let cancelled = false;

    async function loadAttribute() {
      try {
        setIsLoading(true);
        setApiError(null);

        const response = await fetch(
          `${getApiRootUrl()}/admin/catalog/attributes/${id}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        const json = await parseApiResponse<
          ApiResponse<AttributeFormValues> | AttributeFormValues
        >(response);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              json as ApiResponse<unknown>,
              `Attribute fetch failed: ${response.status} ${response.statusText}`
            )
          );
        }

        const foundAttribute = extractAttributeData(json);

        if (!cancelled) {
          setAttribute(foundAttribute);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Attribute fetch failed."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (id) {
      loadAttribute();
    } else {
      setApiError("Attribute ID missing hai.");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleSubmit(values: AttributeFormValues) {
    mutate({
      resource: "attributes",
      id,
      values,
      successNotification: {
        message: "Attribute updated successfully",
        description: "The attribute changes have been saved.",
        type: "success",
      },
      errorNotification: {
        message: "Attribute update failed",
        description: "Please check backend API and submitted fields.",
        type: "error",
      },
    });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
          Loading attribute...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] p-6">
      <div className="mb-6">
        <Link
          href="/admin/catalog/attributes"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attributes
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-500">
          Admin / Catalog / Attributes
        </p>

        <h1 className="mt-2 text-5xl font-medium tracking-tight">
          Edit Attribute
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Update attribute type, scope, group, rules and status.
        </p>
      </div>

      {apiError ? (
        <section className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Attribute API error</p>
          <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs">
            {apiError}
          </p>
        </section>
      ) : null}

      <AttributeForm
        defaultValues={attribute}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
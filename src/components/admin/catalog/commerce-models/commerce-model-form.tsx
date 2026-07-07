"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  commerceModelSchema,
  type CommerceModelFormValues,
} from "./commerce-model-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const defaultConfigByCode: Record<string, Record<string, unknown>> = {
  SHOP: {
    allowCOD: true,
    allowReturns: true,
  },
  RENTAL: {
    allowDailyRental: true,
    allowSubscriptionRental: true,
    requiresDeposit: true,
  },
  RESALE: {
    allowOffers: true,
    requiresVerification: true,
  },
  MTO: {
    allowCustomSizing: true,
    allowRushProduction: true,
  },
  SUBSCRIPTION: {
    allowPlanSwap: true,
    freeCleaningIncluded: true,
  },
};

function stringifyConfig(value?: Record<string, unknown> | null) {
  return JSON.stringify(value || {}, null, 2);
}

function parseConfigText(text?: string) {
  const cleanText = String(text || "").trim();

  if (!cleanText) return {};

  try {
    const parsed = JSON.parse(cleanText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Config must be a JSON object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Config JSON invalid hai. Please valid JSON object daalo.");
  }
}

export function CommerceModelForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
}: {
  defaultValues?: Partial<CommerceModelFormValues> & {
    config?: Record<string, unknown> | null;
  };
  onSubmit: (values: CommerceModelFormValues) => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}) {
  const form = useForm<CommerceModelFormValues>({
    resolver: zodResolver(
      commerceModelSchema,
    ) as Resolver<CommerceModelFormValues>,
   defaultValues: {
  name: "",
  code: "RENTAL",
  description: "",
  isActive: true,
  sortOrder: 1,
  ...defaultValues,
  configText:
    defaultValues?.configText ||
    stringifyConfig(defaultValues?.config || defaultConfigByCode.RENTAL),
},
  });

  const code = form.watch("code");
  const isActive = Boolean(form.watch("isActive"));

  function applyDefaultConfig() {
    form.setValue("configText", stringifyConfig(defaultConfigByCode[code]), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleSubmit(values: CommerceModelFormValues) {
    try {
      parseConfigText(values.configText);
      onSubmit(values);
    } catch (error) {
      form.setError("configText", {
        message:
          error instanceof Error
            ? error.message
            : "Config JSON invalid hai.",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Commerce Type Master</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Rental" />
          </Field>

          <Field label="Code" error={form.formState.errors.code?.message}>
            <select
              {...form.register("code")}
              disabled={isEditMode}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            >
              <option value="SHOP">SHOP</option>
              <option value="RENTAL">RENTAL</option>
              <option value="RESALE">RESALE</option>
              <option value="MTO">MTO</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
            </select>

            {isEditMode ? (
              <p className="mt-1 text-xs text-neutral-500">
                Code master identifier hai, edit mode me change nahi hoga.
              </p>
            ) : null}
          </Field>

          <Field
            label="Description"
            error={form.formState.errors.description?.message}
          >
            <Input
              {...form.register("description")}
              placeholder="Products available for daily or subscription rental"
            />
          </Field>

          <Field
            label="Sort Order"
            error={form.formState.errors.sortOrder?.message}
          >
            <Input
              type="number"
              {...form.register("sortOrder", { valueAsNumber: true })}
            />
          </Field>

          <CheckboxField
            label="Active"
            checked={isActive}
            onChange={(checked) =>
              form.setValue("isActive", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-medium">Config JSON</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Backend dynamic config object. Example: requiresDeposit,
              allowDailyRental, allowReturns.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={applyDefaultConfig}
          >
            Use {code} Default Config
          </Button>
        </div>

        <div className="mt-6">
          <textarea
            {...form.register("configText")}
            rows={12}
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-neutral-950/10"
            placeholder='{"allowDailyRental": true}'
          />

          {form.formState.errors.configText?.message ? (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.configText.message}
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Commerce Type"}
        </Button>
      </div>
    </form>
  );
}

export function parseCommerceModelConfig(values: CommerceModelFormValues) {
  return parseConfigText(values.configText);
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>

      {children}

      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-[#fbfaf6] p-4 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
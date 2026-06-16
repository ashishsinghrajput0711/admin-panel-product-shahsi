"use client";

import type { ReactNode } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  publishingSchema,
  type PublishingFormValues,
} from "./publishing-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const channelLabels = {
  WEBSITE: "Website",
  MOBILE_APP: "Mobile App",
  BRIDAL_PARTY: "Bridal Party",
  RENTAL: "Rental",
  RESALE: "Resale",
  MARKETPLACE: "Marketplace",
} as const;

export function PublishingForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<PublishingFormValues>;
  onSubmit: (values: PublishingFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<PublishingFormValues>({
    resolver: zodResolver(publishingSchema) as Resolver<PublishingFormValues>,
    defaultValues: {
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      categoryId: "",
      businessType: "SHAHSI",
      status: "DRAFT",
      approvalStatus: "NOT_SUBMITTED",
      channels: ["WEBSITE"],
      isVisible: false,
      isFeatured: false,
      scheduledPublishAt: "",
      publishedAt: "",
      unpublishedAt: "",
      seoReady: "WARNING",
      mediaReady: "WARNING",
      inventoryReady: "WARNING",
      pricingReady: "WARNING",
      reviewerName: "",
      rejectionReason: "",
      notes: "",
      ...defaultValues,
    },
  });

  const scope = form.watch("scope");
  const channels = form.watch("channels") ?? [];
  const isVisible = Boolean(form.watch("isVisible"));
  const isFeatured = Boolean(form.watch("isFeatured"));
  const approvalStatus = form.watch("approvalStatus");

  function toggleChannel(channel: PublishingFormValues["channels"][number]) {
    const exists = channels.includes(channel);

    form.setValue(
      "channels",
      exists
        ? channels.filter((item) => item !== channel)
        : [...channels, channel],
      { shouldValidate: true }
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Publishing Target</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Scope">
            <select
              {...form.register("scope")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="PRODUCT">Product</option>
              <option value="VARIANT">Variant</option>
              <option value="CATEGORY">Category</option>
            </select>
          </Field>

          {scope === "PRODUCT" && (
            <Field label="Product ID">
              <Input {...form.register("productId")} placeholder="product_cuid" />
            </Field>
          )}

          {scope === "VARIANT" && (
            <Field label="Variant ID">
              <Input {...form.register("variantId")} placeholder="variant_cuid" />
            </Field>
          )}

          {scope === "CATEGORY" && (
            <Field label="Category ID">
              <Input {...form.register("categoryId")} placeholder="category_cuid" />
            </Field>
          )}

          <Field label="Business Type">
            <select
              {...form.register("businessType")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="SHAHSI">Shahsi</option>
              <option value="GOWNLOOP">Gownloop</option>
              <option value="BOTH">Both</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Publishing Status</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <select
              {...form.register("status")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          <Field label="Approval Status">
            <select
              {...form.register("approvalStatus")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="NOT_SUBMITTED">Not Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>

          <Field label="Reviewer Name">
            <Input {...form.register("reviewerName")} placeholder="Senior reviewer" />
          </Field>
        </div>

        {approvalStatus === "REJECTED" && (
          <div className="mt-6">
            <Field label="Rejection Reason">
              <textarea
                {...form.register("rejectionReason")}
                className="min-h-24 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
                placeholder="Reason for rejection..."
              />
            </Field>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Sales Channels</h2>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {(
            [
              "WEBSITE",
              "MOBILE_APP",
              "BRIDAL_PARTY",
              "RENTAL",
              "RESALE",
              "MARKETPLACE",
            ] as const
          ).map((channel) => (
            <button
              type="button"
              key={channel}
              onClick={() => toggleChannel(channel)}
              className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                channels.includes(channel)
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-[#fbfaf6] text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {channelLabels[channel]}
            </button>
          ))}
        </div>

        {form.formState.errors.channels?.message && (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.channels.message}
          </p>
        )}
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Readiness Checks</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field label="SEO Ready">
            <select
              {...form.register("seoReady")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="READY">Ready</option>
              <option value="WARNING">Warning</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>

          <Field label="Media Ready">
            <select
              {...form.register("mediaReady")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="READY">Ready</option>
              <option value="WARNING">Warning</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>

          <Field label="Inventory Ready">
            <select
              {...form.register("inventoryReady")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="READY">Ready</option>
              <option value="WARNING">Warning</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>

          <Field label="Pricing Ready">
            <select
              {...form.register("pricingReady")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
            >
              <option value="READY">Ready</option>
              <option value="WARNING">Warning</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Schedule & Visibility</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Scheduled Publish At">
            <Input type="datetime-local" {...form.register("scheduledPublishAt")} />
          </Field>

          <Field label="Published At">
            <Input type="datetime-local" {...form.register("publishedAt")} />
          </Field>

          <Field label="Unpublished At">
            <Input type="datetime-local" {...form.register("unpublishedAt")} />
          </Field>

          <CheckboxField
            label="Visible on Storefront"
            checked={isVisible}
            onChange={(checked) =>
              form.setValue("isVisible", checked, { shouldValidate: true })
            }
          />

          <CheckboxField
            label="Featured Content"
            checked={isFeatured}
            onChange={(checked) =>
              form.setValue("isFeatured", checked, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="text-2xl font-medium">Internal Notes</h2>

        <div className="mt-6">
          <Field label="Notes">
            <textarea
              {...form.register("notes")}
              className="min-h-28 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-950/10"
              placeholder="Publishing notes, checklist comments, approval notes..."
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end rounded-[1.5rem] bg-neutral-950 p-4 shadow-xl">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white px-6 text-neutral-950 hover:bg-white/90"
        >
          {isSubmitting ? "Saving..." : "Save Publishing"}
        </Button>
      </div>
    </form>
  );
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

      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
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

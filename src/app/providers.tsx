"use client";

import { Suspense } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { adminDataProvider } from "@/lib/admin/admin-data-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Refine
        routerProvider={routerProvider}
        dataProvider={adminDataProvider}
        resources={[
          {
            name: "products",
            list: "/admin/catalog/products",
            create: "/admin/catalog/products/new",
            edit: "/admin/catalog/products/:id/edit",
          },
          {
            name: "variants",
            list: "/admin/catalog/variants",
            create: "/admin/catalog/variants/new",
            edit: "/admin/catalog/variants/:id/edit",
          },
          {
            name: "attributes",
            list: "/admin/catalog/attributes",
            create: "/admin/catalog/attributes/new",
            edit: "/admin/catalog/attributes/:id/edit",
          },
          {
            name: "pricing",
            list: "/admin/catalog/pricing",
            create: "/admin/catalog/pricing/new",
            edit: "/admin/catalog/pricing/:id/edit",
          },
          {
            name: "inventory",
            list: "/admin/catalog/inventory",
            create: "/admin/catalog/inventory/new",
            edit: "/admin/catalog/inventory/:id/edit",
          },
          {
            name: "media",
            list: "/admin/catalog/media",
            create: "/admin/catalog/media/new",
            edit: "/admin/catalog/media/:id/edit",
          },
          {
            name: "commerce-models",
            list: "/admin/catalog/commerce-models",
            create: "/admin/catalog/commerce-models/new",
            edit: "/admin/catalog/commerce-models/:id/edit",
          },
          {
            name: "fit-data",
            list: "/admin/catalog/fit-data",
            create: "/admin/catalog/fit-data/new",
            edit: "/admin/catalog/fit-data/:id/edit",
          },
          {
            name: "style-data",
            list: "/admin/catalog/style-data",
            create: "/admin/catalog/style-data/new",
            edit: "/admin/catalog/style-data/:id/edit",
          },
          {
            name: "publishing",
            list: "/admin/catalog/publishing",
            create: "/admin/catalog/publishing/new",
            edit: "/admin/catalog/publishing/:id/edit",
          },
          {
            name: "search",
            list: "/admin/catalog/search",
            create: "/admin/catalog/search/new",
            edit: "/admin/catalog/search/:id/edit",
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          disableTelemetry: true,
        }}
      >
        {children}
      </Refine>
    </Suspense>
  );
}

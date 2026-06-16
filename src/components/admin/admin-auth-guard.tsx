"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminAuth, getAdminToken, verifyAdminAccess } from "@/lib/admin-auth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function checkAccess() {
      try {
        const token = getAdminToken();

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        await verifyAdminAccess();

        if (!ignore) {
          setStatus("allowed");
        }
      } catch (err) {
        clearAdminAuth();

        if (!ignore) {
          setError(err instanceof Error ? err.message : "Admin access denied.");
          setStatus("denied");
        }

        setTimeout(() => {
          router.replace("/admin/login");
        }, 1000);
      }
    }

    checkAccess();

    return () => {
      ignore = true;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf6]">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200">
          <p className="text-lg font-medium text-neutral-950">
            Checking admin access...
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Please wait while we verify your session.
          </p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf6]">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <p className="text-lg font-semibold">Admin access denied</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
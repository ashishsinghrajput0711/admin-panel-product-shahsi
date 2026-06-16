"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { adminLogin, verifyAdminAccess } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("Test@123456");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      await adminLogin({
        email,
        password,
      });

      await verifyAdminAccess();

      router.replace("/admin/catalog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-neutral-200 lg:grid-cols-[1fr_1.1fr]">
        <div className="bg-neutral-950 p-10 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">
            Shahsi Admin
          </p>

          <h1 className="mt-8 text-5xl font-medium tracking-tight">
            Catalog Management Login
          </h1>

          <p className="mt-5 max-w-md text-white/65">
            Login to manage products, variants, pricing, inventory, media,
            publishing, and catalog data.
          </p>
        </div>

        <div className="p-8 md:p-10">
          <h2 className="text-3xl font-medium tracking-tight">Admin Login</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Use your backend account credentials to continue.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Login failed</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-800">
                Email
              </span>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-800">
                Password
              </span>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                  placeholder="Password"
                  required
                />
              </div>
            </label>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Need an account?{" "}
            <Link
              href="/admin/signup"
              className="font-medium text-neutral-950 underline underline-offset-4"
            >
              Create admin account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
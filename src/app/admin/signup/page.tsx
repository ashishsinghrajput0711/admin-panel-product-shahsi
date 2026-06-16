"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminRegister } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSignupPage() {
  const router = useRouter();

  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Test@123456");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("9876543210");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      await adminRegister({
        email,
        password,
        name,
        countryCode,
        phoneNumber,
        emailType: "PERSONAL",
        userSubType: "CUSTOMER",
      });

      setSuccessMessage("Account created successfully. Please login now.");

      setTimeout(() => {
        router.replace("/admin/login");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6] p-6">
      <section className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-neutral-200 md:p-10">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
          Shahsi Admin
        </p>

        <h1 className="mt-4 text-4xl font-medium tracking-tight">
          Create Admin Account
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          This uses the real backend register API. Admin access will still be
          verified from `/auth/admin` after login.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Signup failed</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Country Code</span>
            <Input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Phone Number</span>
            <Input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
            />
          </label>

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/admin/login"
            className="font-medium text-neutral-950 underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
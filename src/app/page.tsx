import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6] p-6">
      <section className="max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-neutral-200">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
          Shahsi Admin
        </p>

        <h1 className="mt-4 text-5xl font-medium tracking-tight text-neutral-950">
          Catalog Management System
        </h1>

        <p className="mt-4 text-neutral-500">
          Start managing products, variants, attributes, pricing, inventory,
          media, commerce models, fit data and style data.
        </p>

        <div className="mt-8">
          <Link
            href="/admin/catalog"
            className="inline-flex rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Open Admin Catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
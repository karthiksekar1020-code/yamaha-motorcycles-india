import { T } from "@/components/i18n/I18nProvider";
import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { listMotorcycles } from "@/lib/motorcycles/repository";
import { parseCatalogueQuery } from "@/lib/validation/catalogue";
import { MotorcycleCard } from "@/components/motorcycles/MotorcycleCard";
import { MotorcycleFilters } from "@/components/motorcycles/MotorcycleFilters";

export const metadata: Metadata = { title: "Motorcycles", description: "Search, filter and compare the motorcycle lineup by category, market and engine displacement." };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MotorcyclesPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const query = parseCatalogueQuery(raw);
  let result;
  try {
    result = await listMotorcycles(query);
  } catch {
    return (
      <section className="container-x pt-40" role="alert">
        <h1 className="display text-3xl">Catalogue unavailable</h1>
        <p className="mt-3 text-muted">We couldn’t load the motorcycle catalogue. Please try again shortly.</p>
      </section>
    );
  }

  const qs = (page: number) => {
    const p = new URLSearchParams(Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" && k !== "page" ? [[k, v]] : [])));
    p.set("page", String(page));
    return `/motorcycles?${p}`;
  };

  return (
    <>
      <section className="border-b border-line bg-surface pb-12 pt-32">
        <div className="container-x">
          <p className="micro"><T k="page.motorcycles.eyebrow" /></p>
          <h1 className="display mt-2 text-4xl md:text-6xl"><T k="page.motorcycles.title" /></h1>
          <p className="mt-4 max-w-2xl text-muted"><T k="page.motorcycles.intro" /></p>
        </div>
      </section>
      <section className="container-x grid grid-cols-1 gap-10 py-12 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <Suspense fallback={<div className="skeleton h-40" />}><MotorcycleFilters initialQ={query.q ?? ""} /></Suspense>
        </div>
        <div>
          <p className="micro mb-2" role="status" aria-live="polite">{result.total} {result.total === 1 ? "motorcycle" : "motorcycles"} found</p>
          <p className="mb-4 text-xs text-muted">Prices are indicative ex-showroom (Delhi) figures from third-party listings, checked 9 Oct 2026. Confirm the final price with a Yamaha dealer.</p>
          {result.excludedForMissingValue > 0 && (
            <p className="mb-4 border border-line bg-elevated p-3 text-sm text-muted">
              {result.excludedForMissingValue} {result.excludedForMissingValue === 1 ? "model is" : "models are"} hidden from price sorting because no price is available.
            </p>
          )}
          {result.items.length === 0 ? (
            <div className="border border-line p-10 text-center">
              <h2 className="display text-3xl">No matches</h2>
              <p className="mt-2 text-muted">Try removing a filter or searching for a different term.</p>
              <Link href="/motorcycles" className="btn mt-6">Reset filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">{result.items.map((m, i) => <MotorcycleCard key={m.slug} m={m} index={i} />)}</div>
          )}
          {result.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
              {result.page > 1 && <Link className="btn btn-ghost btn-sm" href={qs(result.page - 1)}>Previous</Link>}
              <span className="micro num">Page {result.page} of {result.pageCount}</span>
              {result.page < result.pageCount && <Link className="btn btn-ghost btn-sm" href={qs(result.page + 1)}>Next</Link>}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

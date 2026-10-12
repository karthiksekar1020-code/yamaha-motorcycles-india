import { T } from "@/components/i18n/I18nProvider";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllMotorcycles } from "@/lib/motorcycles/repository";
import { CompareClient } from "@/components/compare/CompareClient";

export const metadata: Metadata = { title: "Compare motorcycles", description: "Compare up to three motorcycles side by side with clear units and highlighted differences." };
export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  let all;
  try { all = await getAllMotorcycles(); } catch {
    return <section className="container-x pt-40" role="alert"><h1 className="display text-3xl">Comparison unavailable</h1><p className="mt-3 text-muted">The catalogue couldn’t be loaded. Please try again shortly.</p></section>;
  }
  const initial = (m ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return (
    <section className="container-x pb-12 pt-32">
      <p className="micro"><T k="page.compare.eyebrow" /></p>
      <h1 className="display mt-2 text-4xl md:text-6xl"><T k="page.compare.title" /></h1>
      <p className="mb-10 mt-4 max-w-2xl text-muted"><T k="page.compare.intro" /></p>
      <Suspense fallback={<div className="skeleton h-96" />}><CompareClient all={all} initial={initial} /></Suspense>
    </section>
  );
}

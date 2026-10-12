import { T } from "@/components/i18n/I18nProvider";
import type { Metadata } from "next";
import { getAllMotorcycles } from "@/lib/motorcycles/repository";
import { StudioClient } from "@/components/studio/StudioClient";

export const metadata: Metadata = { title: "Studio", description: "Browse official photos of every Yamaha India motorcycle and scooter, with two views per model." };
export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model } = await searchParams;
  let all;
  try { all = await getAllMotorcycles(); } catch {
    return <section className="container-x pt-40" role="alert"><h1 className="display text-3xl">Studio unavailable</h1><p className="mt-3 text-muted">The catalogue couldn’t be loaded.</p></section>;
  }
  if (all.length === 0) return <section className="container-x pt-40"><h1 className="display text-3xl">No motorcycles available</h1></section>;
  return (
    <section className="container-x pb-8 pt-24">
      <p className="micro"><T k="page.studio.eyebrow" /></p>
      <h1 className="display mt-2 text-3xl md:text-5xl"><T k="page.studio.title" /></h1>
      <p className="mb-5 mt-2 max-w-2xl text-muted"><T k="page.studio.intro" /></p>
      <StudioClient all={all} initialSlug={model} />
    </section>
  );
}

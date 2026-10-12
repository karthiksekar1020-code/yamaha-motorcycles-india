import { T } from "@/components/i18n/I18nProvider";
import type { Metadata } from "next";
import { getAllMotorcycles } from "@/lib/motorcycles/repository";
import { TestRideForm } from "@/components/forms/TestRideForm";

export const metadata: Metadata = { title: "Request a test ride", description: "Request a motorcycle test ride. Enquiries are reviewed and confirmed by a representative." };
export const dynamic = "force-dynamic";

export default async function TestRidePage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model } = await searchParams;
  let models: { slug: string; name: string }[] = [];
  try { models = (await getAllMotorcycles()).map((m) => ({ slug: m.slug, name: m.name })); } catch {}
  return (
    <section className="container-x pb-8 pt-32">
      <p className="micro"><T k="page.testride.eyebrow" /></p>
      <h1 className="display mt-2 text-4xl md:text-6xl"><T k="page.testride.title" /></h1>
      <p className="mb-10 mt-4 max-w-2xl text-muted"><T k="page.testride.intro" /></p>
      {models.length === 0 ? (
        <p role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm">The model list couldn’t be loaded, so requests are unavailable right now. Please try again shortly.</p>
      ) : (
        <div className="max-w-4xl"><TestRideForm models={models} defaultModel={model} /></div>
      )}
    </section>
  );
}

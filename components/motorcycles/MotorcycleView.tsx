import Link from "next/link";
import { MediaStage } from "@/components/motorcycles/MediaStage";
import { SpecTable } from "@/components/motorcycles/SpecTable";
import { MotorcycleCard } from "@/components/motorcycles/MotorcycleCard";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { AVAILABILITY_LABEL, fmtMeasure, fmtNum } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";

/** The model page body, shared by the public page and the admin preview so they can never drift apart. */
export function MotorcycleView({ m, related }: { m: Motorcycle; related: Motorcycle[] }) {
  return (
    <>
      <section className="pt-24">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="micro mb-6 flex gap-2"><Link href="/" className="hover:text-fg">Home</Link>/<Link href="/motorcycles" className="hover:text-fg">Motorcycles</Link>/<span className="text-fg">{m.name}</span></nav>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="micro">{m.category} · {m.market} market</p>
              <h1 className="display mt-2 text-4xl md:text-6xl">{m.name}</h1>
            </div>
            <div className="flex gap-3"><CompareToggle slug={m.slug} name={m.name} /><Link href={`/test-ride?model=${m.slug}`} className="btn">Request test ride</Link></div>
          </div>
        </div>
        <div className="container-x mt-8"><MediaStage m={m} /></div>
      </section>

      <section className="container-x grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="display text-3xl">Overview</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">{m.description}</p>
          <dl className="num mt-8 grid grid-cols-3 border border-line">
            {[["Displacement", fmtNum(m.engineCc, "cc")], ["Power", fmtMeasure(m.power)], ["Kerb weight", fmtNum(m.kerbWeightKg, "kg")]].map(([k, v]) => (
              <div key={k} className="border-r border-line p-4 last:border-r-0"><dt className="micro">{k}</dt><dd className="display mt-1 text-2xl md:text-3xl">{v}</dd></div>
            ))}
          </dl>
          {m.features.length > 0 && (<><h3 className="display mt-10 text-2xl">Features</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">{m.features.map((f) => <li key={f} className="py-3 text-sm">{f}</li>)}</ul></>)}
          {m.colors.length > 0 && (<><h3 className="display mt-10 text-2xl">Colours</h3>
          <ul className="mt-3 flex flex-wrap gap-2">{m.colors.map((c) => <li key={c} className="border border-line px-3 py-1.5 text-sm">{c}</li>)}</ul></>)}
          <p className="mt-6 text-sm text-muted">{AVAILABILITY_LABEL[m.availability]}.</p>
        </div>
        <div>
          <h2 className="display text-3xl">Specifications</h2>
          <div className="mt-4"><SpecTable m={m} /></div>
          <div className="mt-6 border border-line bg-elevated p-4 text-xs leading-relaxed text-muted">
            <p className="micro mb-1 !text-fg">Data source</p>
            {m.dataStatus === "verified" && m.sourceUrl ? (
              <p>Verified {m.lastVerifiedAt ? new Date(m.lastVerifiedAt).toLocaleDateString("en-IN") : ""} · <a href={m.sourceUrl} className="underline" rel="noopener noreferrer" target="_blank">Source</a></p>
            ) : (
              <p>Demonstration data. Not verified against an official source and may differ from current market specifications. No source or verification date is recorded.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface py-16">
        <div className="container-x">
          <h2 className="display text-3xl">Related motorcycles</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r, i) => <MotorcycleCard key={r.slug} m={r} index={i} />)}</div>
        </div>
      </section>
    </>
  );
}

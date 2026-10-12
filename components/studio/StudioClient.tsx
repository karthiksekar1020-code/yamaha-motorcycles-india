"use client";
import { useState } from "react";
import Link from "next/link";
import { ImageGallery } from "@/components/motorcycles/ImageGallery";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { fmtMeasure, fmtNum } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";

export function StudioClient({ all, initialSlug }: { all: Motorcycle[]; initialSlug?: string }) {
  const [slug, setSlug] = useState(all.some((m) => m.slug === initialSlug) ? initialSlug! : all[0]!.slug);
  const m = all.find((x) => x.slug === slug)!;

  // keep the chosen model in the address so a refresh (or a shared link) shows the same bike
  const choose = (next: string) => {
    setSlug(next);
    window.history.replaceState(null, "", `/experience?model=${encodeURIComponent(next)}`);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ImageGallery key={m.slug} m={m} />
      <aside className="space-y-6">
        <div>
          <label htmlFor="studio-model" className="micro mb-2 block">Motorcycle</label>
          <select id="studio-model" className="field" value={slug} onChange={(e) => choose(e.target.value)}>{all.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>
        </div>
        <div className="border border-line p-5">
          <p className="micro">{m.category}</p>
          <h2 className="display mt-1 text-3xl">{m.name}</h2>
          {m.image && <ModelPicture m={m} className="mx-auto mt-3 h-44 w-auto max-w-full" sizes="320px" />}
          <dl className="num mt-4 divide-y divide-line text-sm">
            {[["Displacement", fmtNum(m.engineCc, "cc")], ["Power", fmtMeasure(m.power)], ["Torque", fmtMeasure(m.torque)], ["Kerb weight", fmtNum(m.kerbWeightKg, "kg")]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <Link href={`/motorcycles/${m.slug}`} className="btn btn-ghost mt-5 w-full">Full specifications</Link>
        </div>
      </aside>
    </div>
  );
}

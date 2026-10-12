"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { useCompare } from "./CompareProvider";
import { MAX_COMPARE, NA, SPEC_ROWS } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";

export function CompareClient({ all, initial }: { all: Motorcycle[]; initial: string[] }) {
  const router = useRouter();
  const ctx = useCompare();
  const valid = (s: string[]) => s.filter((x, i) => all.some((m) => m.slug === x) && s.indexOf(x) === i).slice(0, MAX_COMPARE);
  const [slugs, setSlugs] = useState<string[]>(() => valid(initial));

  // With no URL selection, adopt the catalogue tray selection once it hydrates from sessionStorage.
  useEffect(() => { if (initial.length === 0 && ctx.slugs.length) setSlugs(valid(ctx.slugs)); }, [ctx.slugs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next: string[]) => {
    setSlugs(next);
    router.replace(next.length ? `/compare?m=${next.join(",")}` : "/compare", { scroll: false });
  };

  const selected = useMemo(() => slugs.map((s) => all.find((m) => m.slug === s)!).filter(Boolean), [slugs, all]);
  const markets = new Set(selected.map((m) => m.market));
  const pickable = all.filter((m) => !slugs.includes(m.slug));

  const Picker = ({ replace }: { replace?: string }) => (
    <div>
      <label className="micro mb-2 block" htmlFor={`pick-${replace ?? "new"}`}>{replace ? "Replace with" : "Add a motorcycle"}</label>
      <select id={`pick-${replace ?? "new"}`} className="field" value="" onChange={(e) => e.target.value && update(replace ? slugs.map((s) => (s === replace ? e.target.value : s)) : [...slugs, e.target.value])}>
        <option value="">Select…</option>
        {pickable.map((m) => <option key={m.slug} value={m.slug}>{m.name} ({m.market})</option>)}
      </select>
    </div>
  );

  const head = (m: Motorcycle) => (
    <div className="relative">
      <button aria-label={`Remove ${m.name}`} onClick={() => update(slugs.filter((s) => s !== m.slug))} className="absolute right-0 top-0 p-1 text-muted hover:text-fg"><X size={18} /></button>
      <ModelPicture m={m} className="mx-auto h-40 w-auto max-w-full md:h-52" sizes="(min-width:768px) 33vw, 100vw" />
      <p className="micro mt-2">{m.category}</p>
      <Link href={`/motorcycles/${m.slug}`} className="display text-3xl hover:text-blue-bright">{m.name}</Link>
    </div>
  );

  if (selected.length === 0) {
    return (
      <div className="border border-line p-10">
        <h2 className="display text-3xl">Nothing to compare yet</h2>
        <p className="mt-2 max-w-md text-muted">Select two or three motorcycles to see their specifications side by side.</p>
        <div className="mt-6 max-w-xs"><Picker /></div>
        <Link href="/motorcycles" className="btn btn-ghost mt-6">Browse the catalogue</Link>
      </div>
    );
  }

  return (
    <div>
      {markets.size > 1 && (
        <p role="note" className="mb-6 border border-blue/60 bg-blue/10 p-4 text-sm">
          Market warning: these models are listed for different markets ({[...markets].join(" and ")}). Specifications, equipment and availability can differ by market.
        </p>
      )}
      {selected.length < 2 && <p className="mb-6 text-sm text-muted">Add at least one more motorcycle to compare.</p>}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="num w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">Motorcycle specification comparison</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 w-48 bg-bg p-3 align-bottom"><span className="micro">Model</span></th>
              {selected.map((m) => <th key={m.slug} scope="col" className="min-w-[200px] p-3 text-center align-top">{head(m)}</th>)}
              {selected.length < MAX_COMPARE && <th scope="col" className="min-w-[200px] p-3 align-bottom"><Picker /></th>}
            </tr>
          </thead>
          <tbody>
            {SPEC_ROWS.map((r) => {
              const vals = selected.map((m) => r.get(m) || NA);
              const differs = selected.length > 1 && new Set(vals).size > 1;
              return (
                <tr key={r.key} className="border-t border-line">
                  <th scope="row" className="sticky left-0 bg-bg p-3 text-xs font-semibold uppercase tracking-[.14em] text-muted">
                    {r.label}{differs && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-bright align-middle" title="Values differ" aria-label="values differ" />}
                  </th>
                  {vals.map((v, i) => <td key={i} className={`p-3 text-center text-sm ${v === NA ? "text-muted" : ""} ${differs && v !== NA ? "bg-blue/10" : ""}`}>{v}</td>)}
                  {selected.length < MAX_COMPARE && <td />}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-muted">Highlighted rows have differing values. No overall “score” is calculated; the numbers are shown as listed.</p>
      </div>

      {/* Mobile cards */}
      <div className="space-y-6 md:hidden">
        {selected.map((m) => (
          <section key={m.slug} aria-label={m.name} className="border border-line p-4">
            {head(m)}
            <dl className="num mt-4 divide-y divide-line text-sm">
              {SPEC_ROWS.map((r) => <div key={r.key} className="flex justify-between gap-4 py-2"><dt className="text-muted">{r.label}</dt><dd className="text-right">{r.get(m) || NA}</dd></div>)}
            </dl>
            <div className="mt-4"><Picker replace={m.slug} /></div>
          </section>
        ))}
        {selected.length < MAX_COMPARE && <Picker />}
      </div>

      <button onClick={() => { ctx.clear(); update([]); }} className="btn btn-ghost btn-sm mt-8">Clear comparison</button>
    </div>
  );
}

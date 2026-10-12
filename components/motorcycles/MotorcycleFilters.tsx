"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { CATEGORIES } from "@/types/motorcycle";

const SORTS = [
  ["recommended", "Recommended"], ["name", "Name (A–Z)"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["cc", "Engine displacement"],
];

function Fields({ onChange, values }: { onChange: (k: string, v: string) => void; values: Record<string, string> }) {
  const lbl = "micro mb-2 block";
  return (
    <div className="space-y-6">
      <div><label htmlFor="f-category" className={lbl}>Category</label>
        <select id="f-category" className="field" value={values.category} onChange={(e) => onChange("category", e.target.value)}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select></div>
      <div><label htmlFor="f-market" className={lbl}>Market availability</label>
        <select id="f-market" className="field" value={values.market} onChange={(e) => onChange("market", e.target.value)}>
          <option value="">All markets</option><option>India</option><option>International</option>
        </select></div>
      <fieldset><legend className={lbl}>Engine displacement (cc)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Minimum cc" className="field num" inputMode="numeric" placeholder="Min" value={values.minCc} onChange={(e) => onChange("minCc", e.target.value.replace(/\D/g, ""))} />
          <input aria-label="Maximum cc" className="field num" inputMode="numeric" placeholder="Max" value={values.maxCc} onChange={(e) => onChange("maxCc", e.target.value.replace(/\D/g, ""))} />
        </div></fieldset>
      <div><label htmlFor="f-year" className={lbl}>Model year</label>
        <input id="f-year" className="field num" inputMode="numeric" placeholder="e.g. 2025" value={values.year} onChange={(e) => onChange("year", e.target.value.replace(/\D/g, "").slice(0, 4))} />
        <p className="mt-1 text-xs text-muted">Model year is unverified in demo data.</p></div>
      <div><label htmlFor="f-trans" className={lbl}>Transmission</label>
        <select id="f-trans" className="field" value={values.transmission} onChange={(e) => onChange("transmission", e.target.value)}>
          <option value="">Any</option><option>6-speed</option><option>5-speed</option><option>Automatic</option>
        </select></div>
      <p className="text-xs text-muted">Price filtering is unavailable until verified prices are loaded.</p>
    </div>
  );
}

export function MotorcycleFilters({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(initialQ);

  const get = (k: string) => sp.get(k) ?? "";
  const values = { category: get("category"), market: get("market"), minCc: get("minCc"), maxCc: get("maxCc"), year: get("year"), transmission: get("transmission") };

  const push = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = ["category", "market", "minCc", "maxCc", "year", "transmission", "q"].filter((k) => sp.get(k)).length;

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="catalogue-q" className="micro mb-2 block">Search</label>
          <input id="catalogue-q" type="search" className="field" placeholder="Model, category or engine class" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sort" className="micro mb-2 block">Sort by</label>
          <select id="sort" className="field min-w-[190px]" value={sp.get("sort") ?? "recommended"} onChange={(e) => push({ sort: e.target.value === "recommended" ? "" : e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setDrawer(true)} className="btn btn-ghost lg:hidden" aria-haspopup="dialog"><SlidersHorizontal size={16} /> Filters{active ? ` (${active})` : ""}</button>
      </div>

      <aside aria-label="Filters" className="mt-8 hidden lg:block"><Fields values={values} onChange={(k, v) => push({ [k]: v })} /></aside>
      {active > 0 && <button className="link-underline micro mt-6 !text-fg" onClick={() => { setQ(""); router.replace(path, { scroll: false }); }}>Clear all filters</button>}

      <ModalDialog open={drawer} onClose={() => setDrawer(false)} label="Filters" className="fixed inset-y-0 left-0 right-auto h-full w-[min(90vw,380px)]">
        <div className="h-full overflow-y-auto border-r border-line bg-surface p-6">
          <div className="mb-6 flex items-center justify-between"><h2 className="display text-3xl">Filters</h2><button aria-label="Close filters" onClick={() => setDrawer(false)}><X /></button></div>
          <Fields values={values} onChange={(k, v) => push({ [k]: v })} />
          <button className="btn mt-8 w-full" onClick={() => setDrawer(false)}>Show results</button>
        </div>
      </ModalDialog>
    </>
  );
}

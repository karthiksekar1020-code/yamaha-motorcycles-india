"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motorcycleSchema, type MotorcycleFormValues } from "@/lib/admin/schemas";
import { api } from "@/lib/admin/client";
import { CATEGORIES } from "@/types/motorcycle";
import { FieldError } from "./ui";

/** Everything is held as text while typing; it is converted and validated (by the same schema the server uses) on save. */
interface Draft {
  slug: string; name: string; market: string; modelYear: string; category: string; description: string; engineCc: string;
  powerValue: string; powerUnit: string; torqueValue: string; torqueUnit: string; transmission: string; cooling: string;
  kerbWeightKg: string; seatHeightMm: string; fuelCapacityL: string; frontSuspension: string; rearSuspension: string; frontBrake: string; rearBrake: string;
  priceInr: string; availability: string; features: string; colors: string; sourceUrl: string; lastVerifiedAt: string; sortOrder: string;
  isFeatured: boolean; isPublished: boolean;
}

const txt = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const toDraft = (v?: MotorcycleFormValues): Draft => ({
  slug: txt(v?.slug), name: txt(v?.name), market: v?.market ?? "India", modelYear: txt(v?.modelYear), category: v?.category ?? "Street", description: txt(v?.description), engineCc: txt(v?.engineCc),
  powerValue: txt(v?.power?.value), powerUnit: v?.power?.unit ?? "PS", torqueValue: txt(v?.torque?.value), torqueUnit: v?.torque?.unit ?? "Nm",
  transmission: txt(v?.transmission), cooling: txt(v?.cooling), kerbWeightKg: txt(v?.kerbWeightKg), seatHeightMm: txt(v?.seatHeightMm), fuelCapacityL: txt(v?.fuelCapacityL),
  frontSuspension: txt(v?.frontSuspension), rearSuspension: txt(v?.rearSuspension), frontBrake: txt(v?.frontBrake), rearBrake: txt(v?.rearBrake),
  priceInr: txt(v?.priceInr), availability: v?.availability ?? "unverified", features: (v?.features ?? []).join("\n"), colors: (v?.colors ?? []).join("\n"),
  sourceUrl: txt(v?.sourceUrl), lastVerifiedAt: txt(v?.lastVerifiedAt), sortOrder: txt(v?.sortOrder ?? 0), isFeatured: v?.isFeatured ?? false, isPublished: v?.isPublished ?? false,
});

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const lines = (s: string) => s.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
function toPayload(d: Draft) {
  return {
    slug: d.slug.trim(), name: d.name, market: d.market, modelYear: num(d.modelYear), category: d.category, description: d.description, engineCc: num(d.engineCc),
    power: d.powerValue.trim() === "" ? null : { value: Number(d.powerValue), unit: d.powerUnit },
    torque: d.torqueValue.trim() === "" ? null : { value: Number(d.torqueValue), unit: d.torqueUnit },
    transmission: d.transmission, cooling: d.cooling, kerbWeightKg: num(d.kerbWeightKg), seatHeightMm: num(d.seatHeightMm), fuelCapacityL: num(d.fuelCapacityL),
    frontSuspension: d.frontSuspension, rearSuspension: d.rearSuspension, frontBrake: d.frontBrake, rearBrake: d.rearBrake,
    priceInr: num(d.priceInr), availability: d.availability, features: lines(d.features), colors: lines(d.colors), sourceUrl: d.sourceUrl, lastVerifiedAt: d.lastVerifiedAt,
    isFeatured: d.isFeatured, isPublished: d.isPublished, sortOrder: d.sortOrder.trim() === "" ? 0 : Number(d.sortOrder),
  };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const AVAIL = [["unverified", "Availability unverified"], ["current", "Currently available"], ["upcoming", "Upcoming"], ["discontinued", "Discontinued"], ["international-only", "International market only"]] as const;

export function MotorcycleForm({ id, initial }: { id?: string; initial?: MotorcycleFormValues }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => toDraft(initial));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const bind = (k: keyof Draft) => ({ value: d[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never) });
  const err = (k: string) => errors[k];
  const invalid = (k: string) => (errors[k] ? true : undefined);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSaved("");
    const parsed = motorcycleSchema.safeParse(toPayload(d));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({}); setBusy(true);
    const res = await api<{ id?: string }>(id ? `/api/admin/motorcycles/${id}` : "/api/admin/motorcycles", { method: id ? "PUT" : "POST", json: parsed.data });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.error.fields ?? {});
      setFormError(res.error.message);
      return;
    }
    if (!id && res.data.id) { router.replace(`/admin/motorcycles/${res.data.id}?created=1`); router.refresh(); return; }
    setSaved(d.isPublished ? "Saved. The changes are live on the website." : "Saved as a draft. Visitors cannot see it yet.");
    router.refresh();
  };

  const field = (k: keyof Draft, label: string, opts: { type?: string; hint?: string; placeholder?: string; required?: boolean; inputMode?: "decimal" | "numeric" } = {}) => (
    <div>
      <label htmlFor={k} className="micro mb-2 block">{label}{opts.required && <span aria-hidden className="text-blue-bright"> *</span>}</label>
      <input id={k} type={opts.type ?? "text"} inputMode={opts.inputMode} placeholder={opts.placeholder} className="field" aria-invalid={invalid(k)} aria-describedby={err(k) ? `${k}-err` : opts.hint ? `${k}-hint` : undefined} {...bind(k)} />
      {opts.hint && !err(k) && <p id={`${k}-hint`} className="mt-1 text-xs text-muted">{opts.hint}</p>}
      {err(k) && <div id={`${k}-err`}><FieldError msg={err(k)} /></div>}
    </div>
  );
  const group = (title: string, children: React.ReactNode) => <fieldset className="border border-line p-5"><legend className="display px-2 text-xl">{title}</legend><div className="grid gap-5 sm:grid-cols-2">{children}</div></fieldset>;
  const powerErr = useMemo(() => err("power") ?? err("torque"), [errors]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form onSubmit={save} noValidate className="max-w-4xl space-y-6">
      {group("Basics", <>
        <div>
          <label htmlFor="name" className="micro mb-2 block">Model name <span aria-hidden className="text-blue-bright">*</span></label>
          <input id="name" className="field" aria-invalid={invalid("name")} value={d.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          <FieldError msg={err("name")} />
        </div>
        <div>
          <label htmlFor="slug" className="micro mb-2 block">Web address (slug) <span aria-hidden className="text-blue-bright">*</span></label>
          <input id="slug" className="field" aria-invalid={invalid("slug")} aria-describedby="slug-hint" value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          <p id="slug-hint" className="mt-1 text-xs text-muted">Appears as /motorcycles/{d.slug || "your-model"}. Lowercase letters, numbers and hyphens.</p>
          <FieldError msg={err("slug")} />
        </div>
        <div><label htmlFor="category" className="micro mb-2 block">Category</label><select id="category" className="field" {...bind("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select><FieldError msg={err("category")} /></div>
        <div><label htmlFor="market" className="micro mb-2 block">Market</label><select id="market" className="field" {...bind("market")}><option>India</option><option>International</option></select></div>
        {field("modelYear", "Model year", { inputMode: "numeric" })}
        <div><label htmlFor="availability" className="micro mb-2 block">Availability</label><select id="availability" className="field" {...bind("availability")}>{AVAIL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="micro mb-2 block">Description</label>
          <textarea id="description" rows={4} className="field !h-auto py-3" aria-invalid={invalid("description")} {...bind("description")} />
          <FieldError msg={err("description")} />
        </div>
      </>)}

      {group("Engine and dimensions", <>
        {field("engineCc", "Engine displacement (cc)", { inputMode: "numeric" })}
        <div>
          <span className="micro mb-2 block">Maximum power</span>
          <div className="flex gap-2"><input aria-label="Power value" inputMode="decimal" className="field" value={d.powerValue} onChange={(e) => set("powerValue", e.target.value)} /><input aria-label="Power unit" className="field !w-24" value={d.powerUnit} onChange={(e) => set("powerUnit", e.target.value)} /></div>
        </div>
        <div>
          <span className="micro mb-2 block">Maximum torque</span>
          <div className="flex gap-2"><input aria-label="Torque value" inputMode="decimal" className="field" value={d.torqueValue} onChange={(e) => set("torqueValue", e.target.value)} /><input aria-label="Torque unit" className="field !w-24" value={d.torqueUnit} onChange={(e) => set("torqueUnit", e.target.value)} /></div>
        </div>
        <div className="flex items-end"><FieldError msg={powerErr} /></div>
        {field("transmission", "Transmission", { placeholder: "e.g. 6-speed" })}
        {field("cooling", "Cooling", { placeholder: "e.g. Liquid-cooled" })}
        {field("kerbWeightKg", "Kerb weight (kg)", { inputMode: "decimal" })}
        {field("seatHeightMm", "Seat height (mm)", { inputMode: "numeric" })}
        {field("fuelCapacityL", "Fuel capacity (L)", { inputMode: "decimal" })}
        {field("frontSuspension", "Front suspension")}
        {field("rearSuspension", "Rear suspension")}
        {field("frontBrake", "Front brake")}
        {field("rearBrake", "Rear brake")}
      </>)}

      {group("Price, colours and features", <>
        {field("priceInr", "Price, ex-showroom (₹)", { inputMode: "decimal", hint: "Leave empty if not verified; the site then shows “Price not verified”." })}
        {field("sortOrder", "Display order", { inputMode: "numeric", hint: "Lower numbers appear first." })}
        <div><label htmlFor="colors" className="micro mb-2 block">Colour options</label><textarea id="colors" rows={4} className="field !h-auto py-3" aria-describedby="colors-hint" {...bind("colors")} /><p id="colors-hint" className="mt-1 text-xs text-muted">One per line.</p><FieldError msg={err("colors")} /></div>
        <div><label htmlFor="features" className="micro mb-2 block">Key features</label><textarea id="features" rows={4} className="field !h-auto py-3" aria-describedby="features-hint" {...bind("features")} /><p id="features-hint" className="mt-1 text-xs text-muted">One per line.</p><FieldError msg={err("features")} /></div>
      </>)}

      {group("Source and verification", <>
        {field("sourceUrl", "Source web address", { type: "url", hint: "Official page this data comes from (http or https)." })}
        {field("lastVerifiedAt", "Last verified on", { type: "date" })}
      </>)}

      <fieldset className="border border-line p-5">
        <legend className="display px-2 text-xl">Visibility</legend>
        <div className="space-y-4">
          <label className="flex items-start gap-3"><input type="checkbox" checked={d.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="mt-1 h-5 w-5 accent-[#1677ff]" /><span><span className="block font-semibold">Published</span><span className="text-sm text-muted">Visible to everyone on the website. Untick to keep it as a private draft.</span></span></label>
          <label className="flex items-start gap-3"><input type="checkbox" checked={d.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="mt-1 h-5 w-5 accent-[#1677ff]" /><span><span className="block font-semibold">Featured</span><span className="text-sm text-muted">Shown first on the homepage.</span></span></label>
        </div>
      </fieldset>

      {formError && <p role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{formError}</p>}
      {saved && <p role="status" className="border border-emerald-400/50 bg-emerald-400/10 p-3 text-sm">{saved}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={busy}>{busy ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Saving…</> : id ? "Save changes" : "Create motorcycle"}</button>
        {id && <Link href={`/admin/motorcycles/${id}/preview`} target="_blank" className="btn btn-ghost">Preview</Link>}
        <Link href="/admin/motorcycles" className="text-sm text-muted underline hover:text-fg">Back to the list</Link>
      </div>
    </form>
  );
}

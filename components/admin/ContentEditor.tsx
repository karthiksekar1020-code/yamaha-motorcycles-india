"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { CONTENT_SCHEMAS, NAV_LINKS, type ContentKey, type HeroContent, type HomeContent, type NavigationContent, type PromoContent } from "@/lib/content/schema";
import { api } from "@/lib/admin/client";
import { FieldError, StatusPill } from "./ui";

export interface BlockState { draft: unknown | null; published: unknown | null; defaults: unknown }
type Values = Record<ContentKey, unknown>;

const TABS: { key: ContentKey; label: string; blurb: string }[] = [
  { key: "hero", label: "Hero banner", blurb: "The large opening section of the homepage." },
  { key: "home", label: "Section headings", blurb: "Headings and small labels on the homepage." },
  { key: "navigation", label: "Menu", blurb: "Which pages appear in the top menu, in what order, and what they are called." },
  { key: "promo", label: "Promo banner", blurb: "An announcement strip shown under the hero. Off by default." },
];

const HERO_FIELDS: { k: keyof HeroContent; label: string; max: number; multi?: boolean }[] = [
  { k: "eyebrow", label: "Small line above the title", max: 80 }, { k: "line1", label: "Title, first line", max: 40 }, { k: "line2", label: "Title, second line", max: 60 },
  { k: "lead", label: "Introduction paragraph", max: 300, multi: true }, { k: "cta1", label: "First button", max: 30 }, { k: "cta2", label: "Second button", max: 30 }, { k: "meta", label: "Bottom-left caption", max: 80 },
];
const HOME_FIELDS: { k: keyof HomeContent; label: string; max: number }[] = [
  { k: "featured", label: "Featured section label", max: 40 }, { k: "chooseRide", label: "Choose-your-ride heading", max: 60 }, { k: "categories", label: "Categories label", max: 40 },
  { k: "engineering", label: "Engineering label", max: 40 }, { k: "builtAround", label: "Engineering heading", max: 80 }, { k: "compare", label: "Compare label", max: 40 },
  { k: "precision", label: "Compare heading", max: 80 }, { k: "gallery", label: "Gallery label", max: 40 }, { k: "inFocus", label: "Gallery heading", max: 60 },
  { k: "viewAll", label: "“View all” link", max: 30 }, { k: "nextMove", label: "Closing call-to-action heading", max: 80 },
];

export function ContentEditor({ blocks }: { blocks: Record<ContentKey, BlockState> }) {
  const [tab, setTab] = useState<ContentKey>("hero");
  const [serverState, setServerState] = useState(blocks);
  const initial = (k: ContentKey) => serverState[k].draft ?? serverState[k].published ?? serverState[k].defaults;
  const [values, setValues] = useState<Values>(() => Object.fromEntries((Object.keys(blocks) as ContentKey[]).map((k) => [k, structuredClone(initial(k))])) as Values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const block = serverState[tab];
  const live = block.published !== null;
  const dirty = JSON.stringify(values[tab]) !== JSON.stringify(initial(tab));
  const setValue = (v: unknown) => { setValues((p) => ({ ...p, [tab]: v })); setMsg(null); };

  const validate = () => {
    const parsed = CONTENT_SCHEMAS[tab].safeParse(values[tab]);
    if (parsed.success) { setErrors({}); return parsed.data; }
    const next: Record<string, string> = {};
    for (const i of parsed.error.issues) next[i.path.join(".") || "form"] ??= i.message;
    setErrors(next);
    setMsg({ kind: "error", text: "Please fix the highlighted fields." });
    return null;
  };
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) => {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) { setMsg({ kind: "error", text: r.error ?? "Something went wrong." }); return; }
    after?.();
    setMsg({ kind: "ok", text: success });
  };
  const call = async (method: string, path = "", json?: unknown) => { const res = await api(`/api/admin/content/${tab}${path}`, { method, json }); return res.ok ? { ok: true } : { ok: false, error: res.error.message }; };

  const saveDraft = async () => { const v = validate(); if (!v) return; await run(() => call("PUT", "", v), "Draft saved. The website has not changed yet.", () => setServerState((s) => ({ ...s, [tab]: { ...s[tab], draft: v } }))); };
  const publish = async () => {
    const v = validate(); if (!v) return;
    await run(async () => { const a = await call("PUT", "", v); return a.ok ? call("POST", "/publish") : a; }, "Published. The website now shows this.", () => setServerState((s) => ({ ...s, [tab]: { ...s[tab], draft: v, published: v } })));
  };
  const unpublish = () => run(() => call("DELETE", "/publish"), "Unpublished. The website is back to its built-in wording.", () => setServerState((s) => ({ ...s, [tab]: { ...s[tab], published: null } })));
  const discard = () => run(() => call("DELETE"), "Draft discarded.", () => { setServerState((s) => ({ ...s, [tab]: { ...s[tab], draft: null } })); setValues((p) => ({ ...p, [tab]: structuredClone(block.published ?? block.defaults) })); });

  const textField = (id: string, label: string, value: string, onChange: (v: string) => void, max: number, multi = false) => (
    <div key={id} className={multi ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="micro mb-2 block">{label} <span className="normal-case tracking-normal text-muted">({value.length}/{max})</span></label>
      {multi ? <textarea id={id} rows={3} className="field !h-auto py-3" maxLength={max + 50} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={errors[id.split(":")[1]!] ? true : undefined} />
        : <input id={id} className="field" maxLength={max + 20} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={errors[id.split(":")[1]!] ? true : undefined} />}
      <FieldError msg={errors[id.split(":")[1]!]} />
    </div>
  );

  const hero = values.hero as HeroContent, home = values.home as HomeContent, nav = values.navigation as NavigationContent, promo = values.promo as PromoContent;
  return (
    <div>
      <div role="tablist" aria-label="Content blocks" className="mb-6 flex flex-wrap gap-2 border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} role="tab" id={`tab-${t.key}`} aria-selected={tab === t.key} aria-controls={`panel-${t.key}`} onClick={() => { setTab(t.key); setMsg(null); setErrors({}); }}
            className={`-mb-px border-b-2 px-4 py-3 text-sm ${tab === t.key ? "border-blue-bright text-fg" : "border-transparent text-muted hover:text-fg"}`}>
            {t.label} {serverState[t.key].published !== null && <span aria-label="published" className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <StatusPill on={live} onLabel="Live: edited wording" offLabel="Live: built-in wording" />
          {block.draft !== null && <StatusPill on={false} offLabel="Saved draft" />}
          {dirty && <span className="text-xs text-blue-bright">Unsaved changes</span>}
        </div>
        <p className="mb-5 text-sm text-muted">{TABS.find((t) => t.key === tab)!.blurb} Edited wording applies to the English site; other languages keep their own translations.</p>

        {tab === "hero" && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{HERO_FIELDS.map((f) => textField(`hero:${f.k}`, f.label, hero[f.k], (v) => setValue({ ...hero, [f.k]: v }), f.max, f.multi))}</div>
            <div className="mt-6 border border-line bg-[radial-gradient(60%_80%_at_80%_50%,rgba(22,119,255,.22),#050c24)] p-6" aria-label="Preview of the hero text">
              <p className="micro !text-blue-bright">{hero.eyebrow}</p>
              <p className="display mt-2 text-4xl">{hero.line1} <span className="text-blue-bright">{hero.line2}</span></p>
              <p className="mt-3 max-w-md text-sm text-muted">{hero.lead}</p>
              <div className="mt-4 flex gap-2"><span className="btn btn-sm">{hero.cta1}</span><span className="btn btn-ghost btn-sm">{hero.cta2}</span></div>
            </div>
          </>
        )}
        {tab === "home" && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{HOME_FIELDS.map((f) => textField(`home:${f.k}`, f.label, home[f.k], (v) => setValue({ ...home, [f.k]: v }), f.max))}</div>}

        {tab === "navigation" && (
          <div>
            <ul className="divide-y divide-line border border-line">
              {nav.items.map((it, i) => (
                <li key={it.href} className="flex flex-wrap items-center gap-3 p-3">
                  <input type="checkbox" id={`nav-vis-${it.href}`} checked={it.visible} onChange={(e) => setValue({ items: nav.items.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)) })} className="h-5 w-5 accent-[#1677ff]" aria-label={`Show ${it.href} in the menu`} />
                  <span className="num w-28 shrink-0 text-xs text-muted">{it.href}</span>
                  <input aria-label={`Menu label for ${it.href}`} className="field !h-10 min-w-[140px] flex-1" maxLength={30} value={it.label} onChange={(e) => setValue({ items: nav.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => { const n = [...nav.items]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; setValue({ items: n }); }} className="btn btn-ghost btn-sm !px-2"><ArrowUp size={16} /></button>
                    <button type="button" aria-label="Move down" disabled={i === nav.items.length - 1} onClick={() => { const n = [...nav.items]; [n[i + 1], n[i]] = [n[i]!, n[i + 1]!]; setValue({ items: n }); }} className="btn btn-ghost btn-sm !px-2"><ArrowDown size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <FieldError msg={errors["items"] ?? Object.entries(errors).find(([k]) => k.startsWith("items."))?.[1]} />
            <p className="mt-2 text-xs text-muted">Ticked pages appear in the top menu. Links can only point to pages of this website ({NAV_LINKS.length} available).</p>
          </div>
        )}

        {tab === "promo" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex items-start gap-3 sm:col-span-2"><input type="checkbox" checked={promo.enabled} onChange={(e) => setValue({ ...promo, enabled: e.target.checked })} className="mt-1 h-5 w-5 accent-[#1677ff]" /><span><span className="block font-semibold">Show the banner</span><span className="text-sm text-muted">Visible to everyone once published.</span></span></label>
            <div className="sm:col-span-2"><label htmlFor="promo-text" className="micro mb-2 block">Banner text <span className="normal-case tracking-normal text-muted">({promo.text.length}/160)</span></label><input id="promo-text" className="field" maxLength={180} value={promo.text} onChange={(e) => setValue({ ...promo, text: e.target.value })} aria-invalid={errors.text ? true : undefined} /><FieldError msg={errors.text} /></div>
            <div><label htmlFor="promo-label" className="micro mb-2 block">Link label (optional)</label><input id="promo-label" className="field" maxLength={40} value={promo.linkLabel} onChange={(e) => setValue({ ...promo, linkLabel: e.target.value })} /></div>
            <div><label htmlFor="promo-href" className="micro mb-2 block">Link to</label><select id="promo-href" className="field" value={promo.linkHref ?? ""} onChange={(e) => setValue({ ...promo, linkHref: e.target.value || null })}><option value="">No link</option>{NAV_LINKS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
          </div>
        )}

        {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`mt-6 border p-3 text-sm ${msg.kind === "error" ? "border-danger/60 bg-danger/10" : "border-emerald-400/50 bg-emerald-400/10"}`}>{msg.text}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={publish} disabled={busy} className="btn">{busy ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Working…</> : "Save and publish"}</button>
          <button onClick={saveDraft} disabled={busy} className="btn btn-ghost">Save draft only</button>
          {block.draft !== null && <button onClick={discard} disabled={busy} className="text-sm text-muted underline hover:text-fg">Discard draft</button>}
          {live && <button onClick={unpublish} disabled={busy} className="text-sm text-danger underline">Unpublish (use built-in wording)</button>}
        </div>
      </div>
    </div>
  );
}

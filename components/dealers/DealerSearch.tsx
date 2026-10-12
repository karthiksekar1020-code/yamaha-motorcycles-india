"use client";
import { useState } from "react";
import type { Dealer } from "@/types/dealer";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; dealers: Dealer[] }
  | { kind: "error"; message: string; setup?: boolean };

export function DealerSearch() {
  const [q, setQ] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) { setFieldError("Enter a city or 6-digit PIN code"); return; }
    if (/^\d+$/.test(term) && term.length !== 6) { setFieldError("PIN codes have 6 digits"); return; }
    setFieldError("");
    setState({ kind: "loading" });
    try {
      const r = await fetch(`/api/dealers?q=${encodeURIComponent(term)}`);
      const body = await r.json().catch(() => ({}));
      if (r.status === 503 && body.error?.code === "DEALER_DATA_NOT_CONFIGURED") { setState({ kind: "error", setup: true, message: "" }); return; }
      if (!r.ok) throw new Error(body.error?.message);
      setState({ kind: "results", dealers: body.dealers });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message || "Dealer search failed. Please try again." });
    }
  };

  return (
    <div>
      <form onSubmit={submit} role="search" noValidate className="flex max-w-xl flex-wrap items-start gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="dealer-q" className="micro mb-2 block">City or PIN code</label>
          <input id="dealer-q" className="field" value={q} onChange={(e) => setQ(e.target.value)} aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? "dealer-q-err" : undefined} placeholder="e.g. Pune or 411001" />
          {fieldError && <p id="dealer-q-err" role="alert" className="mt-1 text-xs text-danger">{fieldError}</p>}
        </div>
        <button className="btn mt-[26px]" disabled={state.kind === "loading"}>{state.kind === "loading" ? "Searching…" : "Search"}</button>
      </form>

      <div className="mt-10" aria-live="polite">
        {state.kind === "error" && state.setup && (
          <div className="max-w-2xl border border-line bg-elevated p-6">
            <p className="micro !text-fg">Dealer data not connected</p>
            <p className="mt-2 text-sm text-muted">No dealership dataset is configured, so no dealers are shown. This site never displays unverified locations as authorised dealers. Connect a verified source by setting the Supabase environment variables and loading the <code>dealers</code> table (see README).</p>
          </div>
        )}
        {state.kind === "error" && !state.setup && <p role="alert" className="text-danger">{state.message}</p>}
        {state.kind === "results" && state.dealers.length === 0 && <p className="text-muted">No verified dealers found for “{q.trim()}”. Try a nearby city or another PIN code.</p>}
        {state.kind === "results" && state.dealers.some((d) => !d.isVerified) && (
          <p role="note" className="mb-5 max-w-2xl border border-blue/60 bg-blue/10 p-4 text-sm">
            Some results are <strong>unverified listings</strong> collected from third-party websites, not confirmed with Yamaha. Addresses and phone numbers may be out of date, so call the dealer before you visit.
          </p>
        )}
        {state.kind === "results" && state.dealers.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {state.dealers.map((d) => (
              <li key={d.id} className="border border-line p-5">
                {!d.isVerified && <p className="micro mb-2 !text-blue-bright">Unverified listing</p>}
                <h3 className="display text-2xl">{d.name}</h3>
                <p className="mt-2 text-sm text-muted">{d.address}, {d.city} {d.postalCode}</p>
                {d.phone && <p className="num mt-1 text-sm"><a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className="underline">{d.phone}</a></p>}
                {d.openingHours && <p className="mt-1 text-xs text-muted">{d.openingHours}</p>}
                {!d.isVerified && d.sourceUrl && <p className="mt-1 text-xs text-muted">Source: <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">third-party listing</a></p>}
                <a className="link-underline micro mt-4 inline-block !text-fg" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${d.name}, ${d.address}, ${d.city} ${d.postalCode}`)}`}>Get directions</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

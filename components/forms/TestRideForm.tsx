"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { testRideSchema, TIME_WINDOWS, type TestRideInput } from "@/lib/validation/test-ride";
import type { Dealer } from "@/types/dealer";

type Result = { kind: "success"; ref: string; message: string } | { kind: "error"; message: string } | null;

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="micro mb-2 block">{label} <span aria-hidden className="text-blue-bright">*</span></label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TestRideForm({ models, defaultModel }: { models: { slug: string; name: string }[]; defaultModel?: string }) {
  const { register, handleSubmit, setError, watch, reset, setFocus, formState: { errors, isSubmitting } } = useForm<TestRideInput>({
    resolver: zodResolver(testRideSchema),
    defaultValues: { motorcycleSlug: models.some((m) => m.slug === defaultModel) ? defaultModel : "", dealerId: "", website: "" },
  });
  const [result, setResult] = useState<Result>(null);
  const [dealers, setDealers] = useState<Dealer[] | null>(null);
  const [dealerNote, setDealerNote] = useState("Enter your city to see available dealerships.");
  const city = watch("city");
  const today = new Date().toISOString().slice(0, 10);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!city || city.trim().length < 2) { setDealers(null); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/dealers?q=${encodeURIComponent(city.trim())}`, { signal: ctl.signal });
        if (r.status === 503) { setDealers(null); setDealerNote("Dealer selection isn’t available yet. Your request will be recorded without a dealer."); return; }
        if (!r.ok) throw new Error();
        const list: Dealer[] = ((await r.json()).dealers as Dealer[]).filter((d) => d.isVerified); // unverified listings are not offered here
        setDealers(list);
        setDealerNote(list.length ? "" : "No verified dealers found for that city. You can still submit without one.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") { setDealers(null); setDealerNote("Couldn’t load dealers. You can still submit."); }
      }
    }, 400);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [city]);

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    try {
      const res = await fetch("/api/test-ride", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { setResult({ kind: "success", ref: body.referenceCode, message: body.message }); reset(); return; }
      if (res.status === 422 && body.error?.fields) {
        for (const [k, msg] of Object.entries(body.error.fields)) setError(k as keyof TestRideInput, { message: String(msg) });
        const first = Object.keys(body.error.fields)[0] as keyof TestRideInput | undefined;
        if (first) setFocus(first);
        return;
      }
      setResult({ kind: "error", message: body.error?.message ?? "Something went wrong. Please try again." });
    } catch {
      setResult({ kind: "error", message: "Network error. Check your connection and try again." });
    }
    alertRef.current?.focus();
  });

  if (result?.kind === "success") {
    return (
      <div role="status" className="border border-ok/50 bg-ok/10 p-8">
        <p className="micro !text-ok">Request received</p>
        <h2 className="display mt-2 text-3xl md:text-4xl">Reference {result.ref}</h2>
        <p className="mt-4 max-w-lg text-sm text-muted">{result.message}</p>
        <div className="mt-6 flex gap-3"><Link href="/motorcycles" className="btn">Keep exploring</Link><button className="btn btn-ghost" onClick={() => setResult(null)}>New request</button></div>
      </div>
    );
  }

  const inv = (k: keyof TestRideInput) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {result?.kind === "error" && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm md:col-span-2">{result.message}</div>
      )}
      <Field id="fullName" label="Full name" error={errors.fullName?.message}><input id="fullName" autoComplete="name" className="field" {...inv("fullName")} {...register("fullName")} /></Field>
      <Field id="mobile" label="Mobile number" error={errors.mobile?.message}><input id="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" className="field" {...inv("mobile")} {...register("mobile")} /></Field>
      <Field id="email" label="Email address" error={errors.email?.message}><input id="email" type="email" autoComplete="email" className="field" {...inv("email")} {...register("email")} /></Field>
      <Field id="city" label="City" error={errors.city?.message}><input id="city" autoComplete="address-level2" className="field" {...inv("city")} {...register("city")} /></Field>
      <Field id="motorcycleSlug" label="Preferred model" error={errors.motorcycleSlug?.message}>
        <select id="motorcycleSlug" className="field" {...inv("motorcycleSlug")} {...register("motorcycleSlug")}>
          <option value="">Select a model</option>{models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
        </select>
      </Field>
      <div>
        <label htmlFor="dealerId" className="micro mb-2 block">Preferred dealership (optional)</label>
        <select id="dealerId" className="field" disabled={!dealers?.length} {...register("dealerId")}>
          <option value="">{dealers?.length ? "No preference" : "Not available"}</option>
          {dealers?.map((d) => <option key={d.id} value={d.id}>{d.name}, {d.city}</option>)}
        </select>
        {dealerNote && <p className="mt-1 text-xs text-muted">{dealerNote}</p>}
      </div>
      <Field id="preferredDate" label="Preferred date" error={errors.preferredDate?.message}><input id="preferredDate" type="date" min={today} className="field num" {...inv("preferredDate")} {...register("preferredDate")} /></Field>
      <Field id="preferredTimeWindow" label="Time window" error={errors.preferredTimeWindow?.message}>
        <select id="preferredTimeWindow" className="field" {...inv("preferredTimeWindow")} {...register("preferredTimeWindow")}>
          <option value="">Select</option>{TIME_WINDOWS.map((w) => <option key={w} value={w}>{w[0]!.toUpperCase() + w.slice(1)}</option>)}
        </select>
      </Field>

      {/* Honeypot: hidden from users and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label></div>

      <div className="md:col-span-2">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent-blue)]" aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "consent-err" : undefined} {...register("consent")} />
          <span>I agree to the <Link href="/privacy" className="underline">privacy notice</Link> and consent to being contacted about this request. <span aria-hidden className="text-blue-bright">*</span></span>
        </label>
        {errors.consent && <p id="consent-err" role="alert" className="mt-1 text-xs text-danger">{errors.consent.message}</p>}
      </div>
      <div className="md:col-span-2">
        <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Request test ride"}</button>
        <p className="mt-3 text-xs text-muted">Submitting creates an enquiry only. It is not a confirmed booking until a representative contacts you.</p>
      </div>
    </form>
  );
}

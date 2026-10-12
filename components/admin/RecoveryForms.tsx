"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { forgotSchema, mfaCodeSchema, resetSchema } from "@/lib/admin/schemas";
import { api } from "@/lib/admin/client";

const Err = ({ id, msg }: { id: string; msg?: string }) => (msg ? <p id={id} role="alert" className="mt-1 text-xs text-danger">{msg}</p> : null);

export function ForgotForm() {
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema) });
  const onSubmit = handleSubmit(async (v) => {
    setError("");
    const res = await api<{ message: string }>("/api/admin/auth/forgot", { json: v });
    if (res.ok) setDone(res.data.message); else setError(res.error.message);
  });
  if (done) return <p role="status" className="border border-blue/60 bg-blue/10 p-4 text-sm">{done}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="micro mb-2 block">Account email</label>
        <input id="email" type="email" autoComplete="username" autoFocus className="field" aria-invalid={errors.email ? true : undefined} {...register("email")} />
        <Err id="email-err" msg={errors.email?.message} />
      </div>
      {error && <p role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{error}</p>}
      <button className="btn w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Sending…</> : "Send reset link"}</button>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ password: string }>({ resolver: zodResolver(resetSchema) });
  const onSubmit = handleSubmit(async (v) => {
    setError("");
    const res = await api("/api/admin/auth/reset", { json: v });
    if (!res.ok) { setError(res.error.message); return; }
    setDone(true);
    setTimeout(() => { router.replace("/admin/dashboard"); router.refresh(); }, 1200);
  });
  if (done) return <p role="status" className="border border-blue/60 bg-blue/10 p-4 text-sm">Password updated. Taking you to the dashboard…</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="password" className="micro mb-2 block">New password</label>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} autoComplete="new-password" autoFocus className="field pr-12" aria-invalid={errors.password ? true : undefined} aria-describedby="pw-help" {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-muted hover:text-fg">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <p id="pw-help" className="mt-1 text-xs text-muted">At least 12 characters, with upper-case, lower-case and a number.</p>
        <Err id="pw-err" msg={errors.password?.message} />
      </div>
      {error && <p role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{error} <Link href="/admin/forgot-password" className="underline">Request a new link</Link></p>}
      <button className="btn w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Saving…</> : "Set new password"}</button>
    </form>
  );
}

export function MfaChallengeForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ code: string }>({ resolver: zodResolver(mfaCodeSchema) });
  const onSubmit = handleSubmit(async (v) => {
    setError("");
    const res = await api("/api/admin/auth/mfa", { json: v });
    if (!res.ok) { setError(res.error.message); return; }
    router.replace("/admin/dashboard");
    router.refresh();
  });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="code" className="micro mb-2 block">6-digit code</label>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus className="field text-center text-2xl tracking-[.5em]" aria-invalid={errors.code ? true : undefined} {...register("code")} />
        <Err id="code-err" msg={errors.code?.message} />
      </div>
      {error && <p role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{error}</p>}
      <button className="btn w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Checking…</> : "Verify and continue"}</button>
    </form>
  );
}

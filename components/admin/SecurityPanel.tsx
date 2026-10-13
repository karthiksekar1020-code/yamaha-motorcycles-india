"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { resetSchema } from "@/lib/admin/schemas";
import { api } from "@/lib/admin/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { Card, FieldError, StatusPill } from "./ui";

export function PasswordCard() {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = [pw.length >= 12, /[a-z]/.test(pw), /[A-Z]/.test(pw), /[0-9]/.test(pw)].filter(Boolean).length + (pw.length >= 16 ? 1 : 0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk("");
    if (pw !== again) { setErr("The two passwords do not match."); return; }
    const parsed = resetSchema.safeParse({ password: pw });
    if (!parsed.success) { setErr(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const res = await api("/api/admin/auth/reset", { json: parsed.data });
    setBusy(false);
    if (!res.ok) { setErr(res.error.message); return; }
    setPw(""); setAgain(""); setOk("Password changed. Other devices have been signed out.");
  };
  return (
    <Card className="sec-card">
      <h2 className="display text-2xl">Change password</h2>
      <form onSubmit={submit} noValidate className="mt-4 max-w-md space-y-4">
        <div><label htmlFor="new-pw" className="micro mb-2 block">New password</label><input id="new-pw" type="password" autoComplete="new-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="pw-rules" />
          <div className="strength mt-2" data-level={pw ? strength : 0} aria-hidden>{[0, 1, 2, 3, 4].map((k) => <span key={k} className={k < strength ? "on" : ""} />)}</div>
          <p id="pw-rules" className="mt-1 text-xs text-muted">At least 12 characters with upper-case, lower-case and a number.</p></div>
        <div><label htmlFor="new-pw2" className="micro mb-2 block">Repeat new password</label><input id="new-pw2" type="password" autoComplete="new-password" className="field" value={again} onChange={(e) => setAgain(e.target.value)} /></div>
        {err && <div role="alert"><FieldError msg={err} /></div>}
        {ok && <p role="status" className="border border-emerald-400/50 bg-emerald-400/10 p-3 text-sm">{ok}</p>}
        <button className="btn btn-sm" disabled={busy}>{busy ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Saving…</> : "Change password"}</button>
      </form>
    </Card>
  );
}

export function MfaCard({ factorId }: { factorId: string | null }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  const start = async () => {
    setBusy(true); setErr("");
    const res = await api<{ factorId: string; qrCode: string; secret: string }>("/api/admin/mfa", { method: "POST" });
    setBusy(false);
    if (!res.ok) { setErr(res.error.message); return; }
    setSetup(res.data);
  };
  const confirm = async (e: React.FormEvent) => {
    e.preventDefault(); if (!setup) return;
    setBusy(true); setErr("");
    const res = await api("/api/admin/mfa", { method: "PUT", json: { factorId: setup.factorId, code } });
    setBusy(false);
    if (!res.ok) { setErr(res.error.fields?.code ?? res.error.message); return; }
    setSetup(null); setCode(""); router.refresh();
  };
  const turnOff = async () => {
    if (!factorId) return;
    setBusy(true); setErr("");
    const res = await api("/api/admin/mfa", { method: "DELETE", json: { factorId } });
    setBusy(false);
    if (!res.ok) { setErr(res.error.message); return; }
    setConfirmOff(false); router.refresh();
  };

  return (
    <Card className="sec-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display flex items-center gap-2 text-2xl"><ShieldCheck size={22} aria-hidden /> Two-step sign-in</h2>
        <StatusPill on={Boolean(factorId)} onLabel="On" offLabel="Off" />
      </div>
      <p className="mt-2 max-w-xl text-sm text-muted">Adds a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…) to every sign-in. Strongly recommended for the owner account.</p>

      {factorId && !setup && (
        <div className="mt-4"><button onClick={() => setConfirmOff(true)} className="btn btn-ghost btn-sm text-danger">Turn off</button></div>
      )}
      {!factorId && !setup && <div className="mt-4"><button onClick={start} disabled={busy} className="btn btn-sm">{busy ? "Starting…" : "Set up an authenticator app"}</button></div>}

      {setup && (
        <form onSubmit={confirm} noValidate className="mt-5 grid grid-cols-1 max-w-2xl gap-6 sm:grid-cols-[180px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qrCode} alt="QR code to scan with your authenticator app" width={180} height={180} className="bg-white p-2" />
          <div className="space-y-3">
            <p className="text-sm">1. Scan the code with your app, or type this key in: <code className="num break-all text-blue-bright">{setup.secret}</code></p>
            <div><label htmlFor="mfa-code" className="micro mb-2 block">2. Enter the 6-digit code it shows</label><input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field max-w-[200px] text-center tracking-[.4em]" value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <div className="flex gap-3"><button className="btn btn-sm" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Turn on"}</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSetup(null); setCode(""); setErr(""); }}>Cancel</button></div>
          </div>
        </form>
      )}
      {err && <div className="mt-3" role="alert"><FieldError msg={err} /></div>}
      <ConfirmDialog open={confirmOff} title="Turn off two-step sign-in?" confirmLabel="Turn off" busy={busy} error={err} onConfirm={turnOff} onCancel={() => setConfirmOff(false)}>
        Sign-in will need only your password. You can turn it back on at any time.
      </ConfirmDialog>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = await r.json().catch(() => ({}));
      if (r.ok) { router.replace("/admin"); router.refresh(); return; }
      setFields(body.error?.fields ?? {});
      setError(body.error?.message ?? "Sign-in failed. Please try again.");
      setPassword("");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-5 border border-line p-6 md:p-8">
      <div>
        <label htmlFor="admin-email" className="micro mb-2 block">Email</label>
        <input id="admin-email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={fields.email ? true : undefined} />
        {fields.email && <p role="alert" className="mt-1 text-xs text-danger">{fields.email}</p>}
      </div>
      <div>
        <label htmlFor="admin-password" className="micro mb-2 block">Password</label>
        <div className="relative">
          <input id="admin-password" type={show ? "text" : "password"} autoComplete="current-password" className="field pr-12" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={fields.password ? true : undefined} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-muted hover:text-fg">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {fields.password && <p role="alert" className="mt-1 text-xs text-danger">{fields.password}</p>}
      </div>
      {error && <p role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

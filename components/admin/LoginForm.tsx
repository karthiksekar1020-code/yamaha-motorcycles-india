"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema } from "@/lib/admin/schemas";
import { api, safeNext } from "@/lib/admin/client";

type Values = { email: string; password: string };

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(loginSchema), mode: "onSubmit" });

  const onSubmit = handleSubmit(async (values) => {
    setError("");
    const res = await api<{ mfaRequired: boolean }>("/api/admin/auth/login", { json: values });
    if (!res.ok) { setError(res.error.message); return; }
    router.replace(res.data.mfaRequired ? "/admin/mfa" : safeNext(next));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby={error ? "login-error" : undefined}>
      <div>
        <label htmlFor="email" className="micro mb-2 block">Email</label>
        <input id="email" type="email" inputMode="email" autoComplete="username" autoFocus className="field" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "email-err" : undefined} {...register("email")} />
        {errors.email && <p id="email-err" role="alert" className="mt-1 text-xs text-danger">{errors.email.message}</p>}
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="password" className="micro">Password</label>
          <Link href="/admin/forgot-password" className="text-xs text-muted underline hover:text-fg">Forgot password?</Link>
        </div>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="field pr-12" aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? "password-err" : undefined} {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-muted hover:text-fg">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p id="password-err" role="alert" className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </div>
      {error && <p id="login-error" role="alert" className="border border-danger/60 bg-danger/10 p-3 text-sm">{error}</p>}
      <button className="btn w-full" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Signing in…</> : "Sign in"}
      </button>
    </form>
  );
}

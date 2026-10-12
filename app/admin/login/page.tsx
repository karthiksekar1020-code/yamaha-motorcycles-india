import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, NotConfiguredNotice } from "@/components/admin/AuthShell";
import { LoginForm } from "@/components/admin/LoginForm";
import { requireAdmin } from "@/lib/admin/auth";
import { HttpError } from "@/lib/admin/errors";
import { safeNext } from "@/lib/admin/client";
import { adminBackendConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  forbidden: "That account does not have access to the admin area.",
  link: "That reset link is invalid or has expired. Request a new one.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const configured = adminBackendConfigured();
  if (configured) {
    let to: string | null = null;
    try { await requireAdmin(); to = safeNext(sp.next); } catch (e) { if (e instanceof HttpError && e.code === "MFA_REQUIRED") to = "/admin/mfa"; }
    if (to) redirect(to); // redirect() must run outside the try block
  }
  const notice = sp.error ? MESSAGES[sp.error] : undefined;
  return (
    <AuthShell title="Owner sign-in" intro="Sign in to manage motorcycles, photos and page content." footer={<>Visitors do not need an account. <Link href="/" className="underline hover:text-fg">Return to the website</Link>.</>}>
      {notice && <p role="alert" className="mb-5 border border-danger/60 bg-danger/10 p-3 text-sm">{notice}</p>}
      {configured ? <LoginForm next={sp.next} /> : <NotConfiguredNotice />}
    </AuthShell>
  );
}

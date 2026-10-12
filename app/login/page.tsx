import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { adminConfigured, isAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = adminConfigured();
  return (
    <section className="container-x pb-16 pt-32">
      <p className="micro">Staff only</p>
      <h1 className="display mt-2 text-4xl md:text-6xl">Admin login</h1>
      <p className="mb-10 mt-4 max-w-2xl text-muted">Sign in to review test-ride requests. Visitors do not need an account to browse the site or request a test ride.</p>
      {configured ? (
        <LoginForm />
      ) : (
        <div className="max-w-2xl border border-line bg-elevated p-6">
          <p className="micro !text-fg">Admin sign-in not set up</p>
          <p className="mt-2 text-sm text-muted">Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> (32 or more random characters) in the server environment, then restart the server (see README).</p>
        </div>
      )}
    </section>
  );
}

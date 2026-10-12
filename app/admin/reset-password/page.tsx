import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, NotConfiguredNotice } from "@/components/admin/AuthShell";
import { ResetForm } from "@/components/admin/RecoveryForms";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!adminBackendConfigured()) {
    return <AuthShell title="Choose a new password"><NotConfiguredNotice /></AuthShell>;
  }
  // Only reachable through the emailed link: it created a short-lived session in this browser.
  const supabase = await createUserClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login?error=link");
  return (
    <AuthShell title="Choose a new password" intro="Pick a strong password you don't use anywhere else." footer={<Link href="/admin/login" className="underline hover:text-fg">Cancel</Link>}>
      <ResetForm />
    </AuthShell>
  );
}

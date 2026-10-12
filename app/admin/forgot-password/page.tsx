import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, NotConfiguredNotice } from "@/components/admin/AuthShell";
import { ForgotForm } from "@/components/admin/RecoveryForms";
import { adminBackendConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" intro="Enter the owner account's email and we'll send a link to choose a new password." footer={<Link href="/admin/login" className="underline hover:text-fg">← Back to sign in</Link>}>
      {adminBackendConfigured() ? <ForgotForm /> : <NotConfiguredNotice />}
    </AuthShell>
  );
}

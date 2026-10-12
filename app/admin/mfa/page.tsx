import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell, NotConfiguredNotice } from "@/components/admin/AuthShell";
import { MfaChallengeForm } from "@/components/admin/RecoveryForms";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Two-step sign-in" };
export const dynamic = "force-dynamic";

export default async function MfaPage() {
  if (!adminBackendConfigured()) return <AuthShell title="Two-step sign-in"><NotConfiguredNotice /></AuthShell>;
  const supabase = await createUserClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.currentLevel === "aal2" || aal.data?.nextLevel !== "aal2") redirect("/admin/dashboard");
  return (
    <AuthShell title="Enter your code" intro="Open your authenticator app and type the 6-digit code for Yamaha Motorcycles India.">
      <MfaChallengeForm />
    </AuthShell>
  );
}

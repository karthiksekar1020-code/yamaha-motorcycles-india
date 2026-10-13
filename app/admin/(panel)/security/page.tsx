import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { MfaCard, PasswordCard } from "@/components/admin/SecurityPanel";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Account security" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { supabase, user } = await requireAdminPage();
  const factors = await supabase.auth.mfa.listFactors();
  const factorId = factors.data?.totp?.[0]?.id ?? null;
  return (
    <>
      <PageHeader eyebrow="Security" title="Account security" />
      <div className="security-page max-w-4xl space-y-6">
        <Card className="sec-card">
          <h2 className="display flex items-center gap-3 text-2xl"><LockKeyhole size={24} className="sec-lock text-blue-bright" aria-hidden /> Signed in as <span className="live-dot ml-1" title="Session active" /></h2>
          <p className="mt-2 text-sm">{user.email}</p>
          <p className="mt-1 text-xs text-muted">Sessions end after 8 hours without activity. Use “Sign out” in the menu to end this one right away.</p>
        </Card>
        <PasswordCard />
        <MfaCard factorId={factorId} />
      </div>
    </>
  );
}

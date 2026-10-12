import type { Metadata } from "next";
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
      <div className="max-w-4xl space-y-6">
        <Card>
          <h2 className="display text-2xl">Signed in as</h2>
          <p className="mt-2 text-sm">{user.email}</p>
          <p className="mt-1 text-xs text-muted">Sessions end after 8 hours without activity. Use “Sign out” in the menu to end this one right away.</p>
        </Card>
        <PasswordCard />
        <MfaCard factorId={factorId} />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Contact", description: "How to get in touch about this motorcycle concept project." };

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <PageShell eyebrow="Get in touch" title="Contact">
      <p>For anything about a motorcycle, use the <Link href="/test-ride">test-ride request</Link>: it is stored securely and followed up by a representative.</p>
      {email ? (
        <p>General enquiries about this project: <a href={`mailto:${email}`}>{email}</a></p>
      ) : (
        <div className="border border-line bg-elevated p-5 text-sm">
          <p className="micro !text-fg">Contact details not configured</p>
          <p className="mt-2">No verified contact address has been set for this deployment, so none is shown. Set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> in the environment to display one. For official Yamaha support, use the manufacturer’s own website or an authorised dealer.</p>
        </div>
      )}
    </PageShell>
  );
}

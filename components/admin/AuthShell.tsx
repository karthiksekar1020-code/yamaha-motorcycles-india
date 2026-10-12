import Image from "next/image";
import Link from "next/link";
import { configDiagnostics } from "@/lib/supabase/config";
import type { ReactNode } from "react";

/**
 * Shared frame for the sign-in family of pages: a dark, bike-led panel on the left (hidden on small screens)
 * and the form on the right. Uses the same colours, fonts and buttons as the public site.
 */
export function AuthShell({ title, intro, children, footer }: { title: string; intro?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.1fr_1fr]">
      <aside aria-hidden className="auth-hero relative hidden overflow-hidden border-r border-line lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_60%_55%,rgba(22,119,255,.32),transparent),linear-gradient(160deg,#07123a,#030818_70%)]" />
        <div className="absolute inset-0 opacity-60 [background:repeating-linear-gradient(115deg,transparent_0_70px,rgba(255,255,255,.035)_70px_71px)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <p className="display text-3xl tracking-[.14em]">YAMAHA</p>
            <p className="micro mt-1">Motorcycles India · Owner console</p>
          </div>
          <div className="auth-bike relative mx-auto w-full max-w-[640px]">
            <Image src="/images/models/r15-v4-1.webp" alt="" width={1200} height={800} priority sizes="(min-width:1024px) 45vw, 0px" className="h-auto w-full drop-shadow-[0_40px_60px_rgba(22,119,255,.4)]" />
          </div>
          <div>
            <p className="display text-4xl leading-tight">Manage the lineup.<br /><span className="text-blue-bright">Keep it precise.</span></p>
            <p className="mt-3 max-w-sm text-sm text-muted">Update models, photos and pages. Visitors always see the published site; only you can change it.</p>
          </div>
        </div>
      </aside>

      <main id="main" className="relative flex items-center justify-center bg-[radial-gradient(80%_50%_at_50%_0%,rgba(22,119,255,.14),transparent)] px-5 py-12 sm:px-10">
        <div className="auth-card w-full max-w-md">
          <Link href="/" className="micro mb-8 inline-flex items-center gap-2 hover:text-fg">← Back to the website</Link>
          <p className="micro !text-blue-bright">Staff only</p>
          <h1 className="display mt-2 text-4xl md:text-5xl">{title}</h1>
          {intro && <p className="mt-3 text-sm text-muted">{intro}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/**
 * Shown on every sign-in page when the Supabase settings are missing or malformed: the form is not offered at all.
 * Lists which variables need attention by NAME only; values are never displayed.
 */
export function NotConfiguredNotice() {
  const { missing, problems } = configDiagnostics();
  return (
    <div className="border border-line bg-elevated p-5 text-sm" role="note">
      <p className="micro !text-fg">Admin sign-in is not set up</p>
      <p className="mt-2 text-muted">This server is not connected to Supabase yet, so nobody can sign in.</p>
      {(missing.length > 0 || problems.length > 0) && (
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {missing.map((m) => <li key={m}><code>{m}</code> is not set</li>)}
          {problems.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      <p className="mt-3 text-muted">
        Fix: put the values in <code>.env.local</code>, apply the database migrations, create the owner account, then
        <strong> restart the server</strong> (it only reads that file when it starts). The README lists every step.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Bike, FileText, Images } from "lucide-react";
import { CountUp } from "@/components/admin/CountUp";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { actionLabel } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase } = await requireAdminPage();
  const count = async (table: string, filter?: [string, unknown]) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return (await q).count ?? 0;
  };
  const [motos, motosLive, photos, photosLive, blocksLive, recent] = await Promise.all([
    count("motorcycles"), count("motorcycles", ["is_published", true]), count("gallery_images"), count("gallery_images", ["is_published", true]),
    count("site_content", ["status", "published"]),
    supabase.from("audit_logs").select("id, action, entity, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const stats = [
    { label: "Motorcycles", value: motos, sub: `${motosLive} published · ${motos - motosLive} draft`, href: "/admin/motorcycles", icon: Bike },
    { label: "Gallery photos", value: photos, sub: `${photosLive} published · ${photos - photosLive} draft`, href: "/admin/gallery", icon: Images },
    { label: "Edited page blocks", value: blocksLive, sub: "of 4 published (hero, headings, menu, banner)", href: "/admin/content", icon: FileText },
  ];

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard">
        <Link href="/admin/motorcycles/new" className="btn btn-sm">Add motorcycle</Link>
        <Link href="/admin/gallery" className="btn btn-ghost btn-sm">Upload photos</Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ label, value, sub, href, icon: Icon }, i) => (
          <Link key={label} href={href} style={{ "--i": i } as React.CSSProperties} className="stat-card group border border-line bg-surface p-5 hover:border-blue-bright">
            <div className="flex items-center justify-between"><p className="micro">{label}</p><Icon size={18} className="stat-icon text-blue-bright" aria-hidden /></div>
            <p className="display num mt-3 text-5xl"><CountUp value={value} /></p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between"><h2 className="display text-2xl">Recent activity</h2><Link href="/admin/audit" className="link-underline micro activity-viewall !text-fg">View all <span aria-hidden className="activity-arrow">→</span></Link></div>
        {recent.error ? (
          <p role="alert" className="mt-4 text-sm text-danger">Couldn’t load recent activity.</p>
        ) : recent.data && recent.data.length > 0 ? (
          <ul className="activity-list mt-4 divide-y divide-line text-sm">
            {recent.data.map((r, i) => (
              <li key={r.id as number} style={{ "--i": i } as React.CSSProperties} className={"activity-row flex flex-wrap items-center justify-between gap-2 py-3" + (i === 0 ? " is-latest" : "")}>
                <span className="flex items-center gap-3"><span aria-hidden className="activity-dot" />{actionLabel(r.action as string)}</span>
                <time dateTime={r.created_at as string} className="text-xs text-muted">{new Date(r.created_at as string).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Nothing yet. Changes you make will be listed here.</p>
        )}
      </Card>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted"><StatusPill on onLabel="Public site safe" /> Visitors only ever see published items.</p>
    </>
  );
}

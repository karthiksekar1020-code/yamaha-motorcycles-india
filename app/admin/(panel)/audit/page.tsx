import type { Metadata } from "next";
import { EmptyState, PageHeader, Pager } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { actionLabel } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Activity log" };
export const dynamic = "force-dynamic";

const SIZE = 25;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase } = await requireAdminPage();
  const page = Math.max(1, Math.min(10_000, Number((await searchParams).page) || 1));
  const from = (page - 1) * SIZE;
  const { data, count, error } = await supabase.from("audit_logs").select("id, action, entity, entity_id, details, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(from, from + SIZE - 1);

  return (
    <>
      <PageHeader eyebrow="Security" title="Activity log" />
      <p className="mb-6 max-w-2xl text-sm text-muted">Every sign-in and every change to models, photos and page content is recorded here with the time. Entries cannot be edited or deleted, and never contain passwords.</p>
      {error ? (
        <p role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm">Couldn’t load the activity log. Please refresh and try again.</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title="No activity yet">Sign-ins and changes will be listed here.</EmptyState>
      ) : (
        <>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Administrator activity, newest first</caption>
              <thead className="bg-surface text-xs uppercase tracking-[.14em] text-muted"><tr><th scope="col" className="p-3">When</th><th scope="col" className="p-3">Action</th><th scope="col" className="p-3">Item</th></tr></thead>
              <tbody>
                {data.map((r) => {
                  const d = (r.details ?? {}) as Record<string, unknown>;
                  const what = typeof d.slug === "string" ? d.slug : typeof d.name === "string" ? d.name : (r.entity_id as string | null) ?? "";
                  return (
                    <tr key={r.id as number} className="border-t border-line align-top">
                      <td className="num whitespace-nowrap p-3 text-muted"><time dateTime={r.created_at as string}>{new Date(r.created_at as string).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></td>
                      <td className="p-3">{actionLabel(r.action as string)}</td>
                      <td className="max-w-[260px] truncate p-3 text-muted" title={String(what)}>{r.entity ? `${r.entity}${what ? `: ${what}` : ""}` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={count ?? data.length} pageSize={SIZE} href={(p) => `/admin/audit?page=${p}`} />
        </>
      )}
    </>
  );
}

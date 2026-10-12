import type { Metadata } from "next";
import Link from "next/link";
import { MotorcycleRowActions } from "@/components/admin/MotorcycleRowActions";
import { EmptyState, PageHeader, Pager, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { toFormValues } from "@/lib/admin/form-values";
import { PAGE_SIZE, cleanSearch } from "@/lib/admin/schemas";
import { fromRow } from "@/lib/motorcycles/mapping";
import { CATEGORIES } from "@/types/motorcycle";

export const metadata: Metadata = { title: "Motorcycles" };
export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; category?: string; page?: string };

export default async function MotorcyclesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { supabase } = await requireAdminPage();
  const sp = await searchParams;
  const q = cleanSearch(sp.q ?? null);
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : "all";
  const category = (CATEGORIES as readonly string[]).includes(sp.category ?? "") ? sp.category! : "";
  const page = Math.max(1, Math.min(10_000, Number(sp.page) || 1));

  let query = supabase.from("motorcycles").select("*", { count: "exact" }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status === "published") query = query.eq("is_published", true);
  if (status === "draft") query = query.eq("is_published", false);
  if (category) query = query.eq("category", category);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  const items = (data ?? []).map(fromRow);
  const href = (p: number) => `/admin/motorcycles?${new URLSearchParams({ ...(q && { q }), ...(status !== "all" && { status }), ...(category && { category }), page: String(p) })}`;

  return (
    <>
      <PageHeader eyebrow="Content" title="Motorcycles">
        <Link href="/admin/motorcycles/new" className="btn btn-sm">Add motorcycle</Link>
      </PageHeader>

      <form method="get" role="search" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div><label htmlFor="q" className="sr-only">Search models</label><input id="q" name="q" defaultValue={q} placeholder="Search by name or slug" className="field" /></div>
        <div><label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={status} className="field"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
        <div><label htmlFor="category" className="sr-only">Category</label>
          <select id="category" name="category" defaultValue={category} className="field"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <button className="btn btn-sm h-12">Filter</button>
      </form>

      {error ? (
        <p role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm">Couldn’t load motorcycles. Please refresh and try again.</p>
      ) : items.length === 0 ? (
        <EmptyState title={q || status !== "all" || category ? "No matches" : "No motorcycles yet"}>
          {q || status !== "all" || category ? "Try a different search or clear the filters." : <>Add your first model, or run <code>supabase/seed.sql</code> to load the demo lineup.</>}
        </EmptyState>
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">Motorcycle models</caption>
              <thead className="bg-surface text-xs uppercase tracking-[.14em] text-muted">
                <tr><th scope="col" className="p-3">Model</th><th scope="col" className="p-3">Category</th><th scope="col" className="p-3">Market</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-t border-line align-top">
                    <td className="p-3"><p className="font-semibold">{m.name}{m.isFeatured && <span className="ml-2 text-xs text-blue-bright" title="Featured on the homepage">★ Featured</span>}</p><p className="text-xs text-muted">/{m.slug}</p></td>
                    <td className="p-3">{m.category}</td>
                    <td className="p-3">{m.market}</td>
                    <td className="p-3"><StatusPill on={m.isPublished} /></td>
                    <td className="p-3"><MotorcycleRowActions id={m.id!} slug={m.slug} name={m.name} published={m.isPublished} values={toFormValues(m)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((m) => (
              <li key={m.id} className="border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{m.name}{m.isFeatured && <span className="ml-2 text-xs text-blue-bright">★</span>}</p><p className="text-xs text-muted">{m.category} · {m.market}</p></div><StatusPill on={m.isPublished} /></div>
                <div className="mt-3"><MotorcycleRowActions id={m.id!} slug={m.slug} name={m.name} published={m.isPublished} values={toFormValues(m)} /></div>
              </li>
            ))}
          </ul>
          <Pager page={page} total={count ?? items.length} pageSize={PAGE_SIZE} href={href} />
        </>
      )}
    </>
  );
}

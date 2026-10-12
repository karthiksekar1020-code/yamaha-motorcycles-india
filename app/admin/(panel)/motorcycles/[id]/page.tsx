import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MotorcycleForm } from "@/components/admin/MotorcycleForm";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { toFormValues } from "@/lib/admin/form-values";
import { uuidSchema } from "@/lib/admin/schemas";
import { fromRow } from "@/lib/motorcycles/mapping";

export const metadata: Metadata = { title: "Edit motorcycle" };
export const dynamic = "force-dynamic";

export default async function EditMotorcyclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { data } = await supabase.from("motorcycles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const m = fromRow(data);
  const { created } = await searchParams;

  return (
    <>
      <PageHeader eyebrow="Motorcycles" title={m.name}>
        <StatusPill on={m.isPublished} />
        {m.isPublished && <Link href={`/motorcycles/${m.slug}`} target="_blank" className="btn btn-ghost btn-sm">View on website</Link>}
      </PageHeader>
      {created && <p role="status" className="mb-6 max-w-4xl border border-emerald-400/50 bg-emerald-400/10 p-3 text-sm">Created. It is a private draft until you tick “Published”.</p>}
      <MotorcycleForm id={id} initial={toFormValues(m)} />
    </>
  );
}

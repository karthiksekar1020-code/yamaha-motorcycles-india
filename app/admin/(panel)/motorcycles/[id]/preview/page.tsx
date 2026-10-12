import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/admin/ui";
import { MotorcycleView } from "@/components/motorcycles/MotorcycleView";
import { requireAdminPage } from "@/lib/admin/auth";
import { uuidSchema } from "@/lib/admin/schemas";
import { fromRow } from "@/lib/motorcycles/mapping";
import { attachImages } from "@/lib/motorcycles/images";

export const metadata: Metadata = { title: "Preview" };
export const dynamic = "force-dynamic";

/** Shows a model exactly as the public page will, including drafts. Only the signed-in owner can open this. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { data } = await supabase.from("motorcycles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const m = attachImages([fromRow(data)])[0]!;
  const { data: others } = await supabase.from("motorcycles").select("*").eq("is_published", true).neq("id", id).limit(3);
  const related = attachImages((others ?? []).map(fromRow));

  return (
    <div className="-mx-4 -my-8 sm:-mx-8 lg:-mx-10">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-blue/60 bg-blue/20 px-5 py-3 backdrop-blur">
        <p className="flex items-center gap-3 text-sm"><strong>Preview</strong> <StatusPill on={m.isPublished} onLabel="Live" offLabel="Draft: not public" /> This is how visitors will see the page.</p>
        <Link href={`/admin/motorcycles/${id}`} className="btn btn-sm">Back to editing</Link>
      </div>
      <MotorcycleView m={m} related={related} />
    </div>
  );
}

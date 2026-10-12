import type { Metadata } from "next";
import { GalleryManager, type GalleryItemData } from "@/components/admin/GalleryManager";
import { RestoreBuiltins } from "@/components/admin/RestoreBuiltins";
import { PageHeader } from "@/components/admin/ui";
import { getHiddenBuiltins } from "@/lib/gallery-server";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryAdminPage() {
  const { supabase } = await requireAdminPage();
  const removed = await getHiddenBuiltins();
  const [photos, models] = await Promise.all([
    supabase.from("gallery_images").select("id, caption, alt_text, motorcycle_id, sort_order, is_published, width, height, updated_at").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("motorcycles").select("id, name").order("name", { ascending: true }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Content" title="Gallery" />
      <p className="mb-6 max-w-2xl text-sm text-muted">Photos you upload start as private drafts. Publish one to show it in the website gallery, or link it to a model to use it on that model’s page. To remove a photo, open the public Gallery page while signed in: every photo has a remove button.</p>
      <RestoreBuiltins items={removed.map((r) => ({ id: r.id, title: r.title, src: r.src, alt: r.alt }))} />
      {photos.error ? (
        <p role="alert" className="border border-danger/60 bg-danger/10 p-4 text-sm">Couldn’t load the gallery. Please refresh and try again.</p>
      ) : (
        <GalleryManager initial={(photos.data ?? []) as GalleryItemData[]} models={(models.data ?? []) as { id: string; name: string }[]} />
      )}
    </>
  );
}

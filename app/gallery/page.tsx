import { T } from "@/components/i18n/I18nProvider";
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { BackToTop } from "@/components/gallery/BackToTop";
import { getGalleryItems } from "@/lib/gallery-server";
import { isAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Gallery", description: "Official product images of the Yamaha India motorcycle and scooter lineup." };

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [items, canRemove] = await Promise.all([getGalleryItems(), isAdminSession()]);
  return (
    <section className="container-x pb-8 pt-32">
      <p className="micro"><T k="page.gallery.eyebrow" /></p>
      <h1 className="display mt-2 text-4xl md:text-6xl"><T k="page.gallery.title" /></h1>
      <p className="mb-10 mt-4 max-w-2xl text-muted"><T k="page.gallery.intro" /></p>
      <GalleryGrid items={items} viewerTile canRemove={canRemove} />
      <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
        <BackToTop />
        <Link href="/motorcycles" className="btn">Browse all motorcycles</Link>
      </div>
    </section>
  );
}

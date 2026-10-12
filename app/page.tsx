import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { getAllMotorcycles } from "@/lib/motorcycles/repository";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedStage } from "@/components/home/FeaturedStage";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { EngineeringSection } from "@/components/home/EngineeringSection";
import { ENGINEERING_MODELS } from "@/lib/engineering";
import { ComparisonPreview } from "@/components/home/ComparisonPreview";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { GALLERY } from "@/lib/gallery";
import { LazyVideo } from "@/components/ui/LazyVideo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let all;
  try { all = await getAllMotorcycles(); } catch {
    return <section className="container-x pt-40" role="alert"><h1 className="display text-4xl">We’ll be right back</h1><p className="mt-3 text-muted">The catalogue is temporarily unavailable.</p></section>;
  }
  if (all.length === 0) return <section className="container-x pt-40"><h1 className="display text-4xl">No motorcycles listed yet</h1></section>;

  const ordered = [...all].sort((a, b) => Number(a.availability === "upcoming") - Number(b.availability === "upcoming") || Number(Boolean(b.image)) - Number(Boolean(a.image)) || Number(b.market === "India") - Number(a.market === "India") || (b.engineCc ?? 0) - (a.engineCc ?? 0));
  const hero = ordered.find((m) => m.category === "Supersport") ?? ordered[0]!;
  const featured = ordered.slice(0, 4);
  const engineeringModels = ENGINEERING_MODELS.flatMap(({ slug }) => {
    const m = all.find((x) => x.slug === slug);
    const src = m?.image?.photos[0]?.src;
    return m && src ? [{ slug, name: m.name, src }] : [];
  });

  return (
    <>
      <HeroSection motorcycle={hero} />
      <FeaturedStage models={featured} />
      <CategoryShowcase all={all} />
      <EngineeringSection models={engineeringModels} />
      <ComparisonPreview models={all} />
      <section className="container-x pb-20 md:pb-28">
        <div className="flex items-end justify-between"><div><p className="micro"><T k="home.gallery" /></p><h2 className="display mt-2 text-3xl md:text-5xl"><T k="home.inFocus" /></h2></div><Link href="/gallery" className="link-underline micro !text-fg"><T k="home.viewAll" /></Link></div>
        <div className="mt-8"><GalleryGrid items={GALLERY.slice(0, 6)} /></div>
        <div className="mt-10 text-center"><Link href="/gallery" className="btn">View full image gallery</Link></div>
      </section>
      <section className="relative isolate overflow-hidden border-t border-line py-28 text-center md:py-40">
        <LazyVideo className="-z-20" src="/videos/test-ride.mp4" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", objectFit: "cover" }} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(22,119,255,.3),transparent)] bg-black/55" aria-hidden="true" />
        <div className="container-x relative">
          <h2 className="display text-[clamp(2.25rem,6vw,4.5rem)]"><T k="home.nextMove" /></h2>
          <Link href="/test-ride" className="btn mt-10"><T k="nav.requestTestRide" /></Link>
        </div>
      </section>
    </>
  );
}

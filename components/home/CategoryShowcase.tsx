import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { BikeArt, variantFor } from "@/components/ui/BikeArt";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { TiltCard } from "@/components/ui/TiltCard";
import { Parallax } from "@/components/ui/Parallax";
import { CATEGORY_ACCENT } from "@/lib/utils/accent";
import { CATEGORIES, type Category, type Motorcycle } from "@/types/motorcycle";

const BLURB: Record<Category, string> = {
  Supersport: "Track-bred geometry and full-fairing aerodynamics.",
  Street: "Light, upright and made for the city.",
  "Hyper Naked": "Raw torque with the fairing stripped away.",
  "Sport Touring": "Performance with room to cover distance.",
  Heritage: "Retro character with modern engineering.",
  Scooter: "Easy, efficient everyday mobility.",
  Electric: "Zero-tailpipe-emission mobility.",
};

export function CategoryShowcase({ all }: { all: Motorcycle[] }) {
  return (
    <section className="container-x py-20 md:py-28">
      <Parallax speed={-30}>
        <p className="micro"><T k="home.chooseRide" /></p>
        <h2 className="display mt-2 text-3xl md:text-5xl"><T k="home.categories" /></h2>
      </Parallax>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.filter((c) => all.some((m) => m.category === c)).map((c, i) => {
          const inCat = all.filter((m) => m.category === c);
          const india = inCat.filter((m) => m.market === "India").length;
          const withImage = inCat.find((m) => m.image);
          return (
            <li key={c}>
              <TiltCard index={i} className="h-full">
              <Link href={`/motorcycles?category=${encodeURIComponent(c)}`} className="group relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden border border-line bg-surface p-5 transition-colors hover:border-blue-bright">
                <div>
                  <h3 className="display text-3xl">{c}</h3>
                  <p className="mt-2 text-sm text-muted">{BLURB[c]}</p>
                </div>
                {withImage ? <ModelPicture m={withImage} className="my-4 h-36 w-full transition-transform duration-500 group-hover:scale-110 [transform:translate(calc(var(--mx,0)*20px),calc(var(--my,0)*12px))]" sizes="(min-width:1024px) 22vw, 50vw" /> : <BikeArt accent={CATEGORY_ACCENT[c]} variant={variantFor(c)} className="my-4 w-full opacity-80 transition-transform duration-500 group-hover:translate-x-3 group-hover:scale-105" />}
                <p className="micro !text-fg">
                  {inCat.length === 0 ? "No models listed" : `${inCat.length} ${inCat.length === 1 ? "model" : "models"} · ${india === 0 ? "none India-market listed" : `${india} India-market`}`} →
                </p>
              </Link>
              </TiltCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

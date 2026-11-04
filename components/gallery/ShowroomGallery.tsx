import Image from "next/image";
import { SHOWROOM_PHOTOS } from "@/lib/showroom";
import { SHOP_ADDRESS_ONE_LINE } from "@/lib/config";

/** Responsive grid of showroom photo cards (Server Component, so images are optimised and lazy-loaded by next/image). */
export function ShowroomGallery({ heading = "Our showroom", priorityFirst = false, inArticle = false }: { heading?: string; priorityFirst?: boolean; inArticle?: boolean }) {
  return (
    <section aria-labelledby="showroom-heading" className="not-prose">
      <h2 id="showroom-heading" className={inArticle ? "mt-10 text-3xl text-fg" : "display text-3xl text-fg md:text-4xl"}>{heading}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">A look at the Vignesh Bikez showroom at {SHOP_ADDRESS_ONE_LINE}. Some photos were taken while the final fit-out was still in progress.</p>
      <ul className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${inArticle ? "" : "lg:grid-cols-3"}`}>
        {SHOWROOM_PHOTOS.map((p, i) => (
          <li key={p.id} className="!ml-0 list-none group flex flex-col overflow-hidden border border-line bg-elevated shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-blue-bright hover:shadow-xl hover:shadow-blue/20">
            <figure className="m-0 flex h-full flex-col">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  sizes={inArticle ? "(min-width:640px) 370px, 100vw" : "(min-width:1024px) 31vw, (min-width:640px) 48vw, 100vw"}
                  priority={priorityFirst && i === 0}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="micro absolute left-3 top-3 bg-black/70 px-2 py-1 !text-fg backdrop-blur">{p.tag}</span>
              </div>
              <figcaption className="flex-1 p-5">
                <h3 className="display text-xl text-fg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m as motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type { GalleryItem } from "@/lib/gallery";

function Art({ g, className = "", sizes, card = false }: { g: GalleryItem; className?: string; sizes: string; card?: boolean }) {
  return (
    <div className={`${card ? "absolute inset-0" : "relative"} overflow-hidden bg-[radial-gradient(70%_70%_at_50%_65%,rgba(22,119,255,.2),#0a1538_75%)] ${className}`}>
      <Image src={g.src} alt={g.alt} fill sizes={sizes} className="object-contain p-3" />
    </div>
  );
}

export function GalleryGrid({ items, viewerTile = false }: { items: GalleryItem[]; viewerTile?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, step]);

  const g = open === null ? null : items[open]!;
  const gap = (3 - (items.length % 3)) % 3;
  const narrow = gap === 1; // the tile has a single column on desktop: drop the photo stack and shrink the text
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((it, i) => (
          <motion.li
            key={it.id}
            // Scroll reveal: each card rises and fades in once as it enters the viewport, staggered across its row of 3.
            initial={reduced ? false : { opacity: 0, y: 56, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.75, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <button onClick={() => setOpen(i)} aria-label={`Open image: ${it.title}`} aria-haspopup="dialog" className="gallery-card group relative block aspect-[3/2] w-full overflow-hidden border border-line text-left hover:border-blue-bright">
              <motion.div
                className="absolute inset-0"
                initial={reduced ? false : { scale: 1.2 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 1.2, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <Art g={it} card sizes="(min-width:768px) 30vw, 50vw" className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.08]" />
              </motion.div>
              <span className="gallery-label absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 to-transparent p-3"><span className="micro !text-fg">{it.kind}</span><span className="block text-sm">{it.title}</span></span>
            </button>
          </motion.li>
        ))}
        {viewerTile && items.length > 0 && (
          // Image-style tile that fills the empty slots of the last row: opens the viewer, or adds the visitor's own photos.
          <motion.li
            className={`col-span-2 ${gap === 0 ? "md:col-span-3" : gap === 1 ? "md:col-span-1" : "md:col-span-2"}`}
            initial={reduced ? false : { opacity: 0, y: 56, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="group relative flex h-full min-h-[210px] w-full items-center justify-between gap-6 overflow-hidden border border-blue-bright/50 bg-[radial-gradient(80%_120%_at_20%_50%,rgba(22,119,255,.35),#0a1538_75%)] p-6 transition-colors hover:border-blue-bright md:p-8">
              <button onClick={() => setOpen(0)} aria-haspopup="dialog" aria-label={`Open the image viewer with all ${items.length} photos`} className="absolute inset-0 z-0" />
              <div className="pointer-events-none relative z-10">
                <span className={`display block ${narrow ? "text-3xl md:text-2xl" : "text-3xl md:text-4xl"}`}>View all {items.length} photos</span>
                <span className="micro mt-2 block !text-fg">{narrow ? "Open the viewer →" : "Open the full-screen image viewer →"}</span>
              </div>
              <span aria-hidden className={`pointer-events-none relative hidden h-28 w-44 shrink-0 sm:block ${narrow ? "md:hidden" : ""}`}>
                {items.slice(0, 3).map((it, k) => (
                  <span key={it.id} className="absolute top-0 h-24 w-32 overflow-hidden border border-line bg-surface shadow-lg transition-transform duration-500 group-hover:translate-x-2" style={{ left: k * 28, top: k * 6, zIndex: k, transform: `rotate(${(k - 1) * 5}deg)` }}>
                    <Image src={it.src} alt="" fill sizes="128px" className="object-contain p-1" />
                  </span>
                ))}
              </span>
            </div>
          </motion.li>
        )}
      </ul>
      <ModalDialog open={open !== null} onClose={() => setOpen(null)} label="Image viewer" className="fixed inset-0 h-full w-full">
        {g && (
          <div className="flex h-full w-full flex-col bg-black/95 p-4 md:p-8">
            <div className="flex items-center justify-between"><p className="micro num">{(open ?? 0) + 1} / {items.length} · {g.kind}</p><button aria-label="Close image viewer" onClick={() => setOpen(null)} className="p-2"><X size={24} /></button></div>
            <div className="relative my-4 flex min-h-0 flex-1 items-center justify-center">
              <button aria-label="Previous image" onClick={() => step(-1)} className="absolute left-0 z-10 grid h-12 w-12 place-items-center border border-line bg-bg/70"><ChevronLeft /></button>
              <Art g={g} sizes="90vw" className="aspect-[3/2] max-h-full w-full max-w-5xl border border-line" />
              <button aria-label="Next image" onClick={() => step(1)} className="absolute right-0 z-10 grid h-12 w-12 place-items-center border border-line bg-bg/70"><ChevronRight /></button>
            </div>
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="display text-2xl">{g.title}</h3>
              <p className="mt-1 text-sm text-muted">{g.caption}</p>
            </div>
          </div>
        )}
      </ModalDialog>
    </>
  );
}

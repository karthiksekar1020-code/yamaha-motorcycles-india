"use client";
import { useState } from "react";
import Image from "next/image";
import { BikeArt, variantFor } from "@/components/ui/BikeArt";
import { TiltStage } from "./TiltStage";
import { CATEGORY_ACCENT } from "@/lib/utils/accent";
import type { Motorcycle } from "@/types/motorcycle";

/** 3D tilt view of the selected official photo, plus a thumbnail per image (up to two). */
export function ImageGallery({ m, className = "" }: { m: Motorcycle; className?: string }) {
  const img = m.image;
  const items = img
    ? img.photos.length
      ? img.photos.map((p) => ({ src: p.src, w: p.width, h: p.height, label: p.label, alt: p.alt }))
      : [{ src: img.thumb, w: 321, h: 313, label: "Official image", alt: img.alt }]
    : [];
  const [i, setI] = useState(0);
  const cur = items[Math.min(i, items.length - 1)];

  return (
    <div className={className}>
      {cur ? (
        <TiltStage src={cur.src} width={cur.w} height={cur.h} alt={cur.alt} label={cur.label} credit={img?.credit} />
      ) : (
        <figure className="relative flex aspect-[4/3] w-full items-center justify-center border border-line bg-[radial-gradient(60%_60%_at_50%_70%,rgba(22,119,255,.25),#0a1538_80%)] md:aspect-[16/9]">
          <BikeArt accent={CATEGORY_ACCENT[m.category]} variant={variantFor(m.category)} className="w-[80%]" title={`${m.name} illustrative placeholder artwork`} />
          <figcaption className="absolute bottom-2 left-3 text-[10px] text-muted">No official image available</figcaption>
        </figure>
      )}

      {items.length > 1 && (
        <div className="mt-3 flex gap-3" role="group" aria-label={`${m.name} images`}>
          {items.map((it, n) => (
            <button key={it.src} onClick={() => setI(n)} aria-pressed={n === i} aria-label={`Show image ${n + 1} of ${items.length}: ${it.label}`}
              className="relative flex h-20 w-28 items-center justify-center border border-line bg-surface p-1 transition-colors hover:border-blue-bright aria-pressed:border-blue-bright aria-pressed:bg-blue/20">
              <Image src={it.src} alt="" width={it.w} height={it.h} sizes="112px" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">The 3D tilt view moves the official photo in perspective. It is not a 360° model, so side and rear angles aren’t available.</p>
    </div>
  );
}

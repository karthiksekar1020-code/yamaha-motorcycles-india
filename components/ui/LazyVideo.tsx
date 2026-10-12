"use client";
import { useEffect, useRef } from "react";

/**
 * Decorative looping background video that costs nothing until it is needed: the file is requested only when the
 * element nears the viewport, and never for visitors who prefer reduced motion or have Data Saver on. It also
 * pauses while scrolled out of view so it does not keep decoding in the background.
 */
export function LazyVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (e.isIntersecting) {
        if (!v.getAttribute("src")) v.setAttribute("src", src);
        v.play().catch(() => { /* autoplay blocked: the poster-less gradient behind it still looks right */ });
      } else {
        v.pause();
      }
    }, { rootMargin: "200px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return <video ref={ref} className={className} style={style} muted loop playsInline preload="none" aria-hidden="true" />;
}

"use client";
import { useEffect, useState } from "react";

/** Counts up from 0 to `value` once when the page opens. The real number is the first thing rendered, and it is shown as-is for visitors who prefer reduced motion. */
export function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (value <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{n}</>;
}

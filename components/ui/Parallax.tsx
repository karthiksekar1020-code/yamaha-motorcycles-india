"use client";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { m as motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

/**
 * Moves its children vertically as the element crosses the viewport.
 * `speed` is the travel in pixels from entering to leaving: positive drifts down (appears to lag behind the page),
 * negative drifts up. Does nothing when the visitor prefers reduced motion.
 */
export function Parallax({ children, speed = 60, className, style }: { children: ReactNode; speed?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -speed / 2, reduced ? 0 : speed / 2]);
  return (
    <motion.div ref={ref} style={{ ...style, y }} className={className}>
      {children}
    </motion.div>
  );
}

"use client";
import { useRef } from "react";
import { m as motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

/**
 * Animated card shell:
 *  - scroll reveal: rises, un-tilts and fades in once, staggered by `index`
 *  - hover (mouse only): 3D tilt that follows the cursor, a blue light glare, a lift and a glow
 *  - exposes --mx / --my (-0.5..0.5) so children can shift with the cursor for a parallax effect,
 *    e.g. className="[transform:translate(calc(var(--mx,0)*18px),calc(var(--my,0)*12px))]"
 * Reduced-motion visitors get a static card.
 */
export function TiltCard({ children, index = 0, className = "", max = 9 }: { children: React.ReactNode; index?: number; className?: string; max?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0), glow = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 20, mass: 0.4 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const px = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const py = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(260px circle at ${px}% ${py}%, rgba(57,139,255,.16), transparent 60%)`;
  const shadow = useTransform(glow, [0, 1], ["0 0 0 rgba(22,119,255,0)", "0 24px 60px -18px rgba(22,119,255,.55)"]);

  const move = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
    glow.set(1);
  };
  const leave = () => { x.set(0); y.set(0); glow.set(0); };

  return (
    <motion.div
      className={className}
      style={{ perspective: 900 }}
      initial={reduced ? false : { opacity: 0, y: 70, scale: 0.92, rotateX: 14 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.09, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        whileHover={reduced ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={reduced ? undefined : ({ rotateX, rotateY, boxShadow: shadow, transformStyle: "preserve-3d", "--mx": sx, "--my": sy } as never)}
        className="relative h-full"
      >
        {children}
        {!reduced && (
          <motion.span aria-hidden className="pointer-events-none absolute inset-0 z-10 mix-blend-screen" style={{ background: glare, opacity: glow }} />
        )}
      </motion.div>
    </motion.div>
  );
}

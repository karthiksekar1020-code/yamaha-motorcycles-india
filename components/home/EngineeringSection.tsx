"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m as motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ENGINEERING_MODELS, ENGINEERING_SOURCE, HOTSPOTS } from "@/lib/engineering";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";
import { useI18n } from "@/components/i18n/I18nProvider";

export interface EngineeringModel { slug: string; name: string; src: string }

const AUTO_MS = 5500;

export function EngineeringSection({ models }: { models: EngineeringModel[] }) {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<(typeof HOTSPOTS)[number]>(HOTSPOTS[0]!);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false); // stop auto-advance for good once the visitor picks a bike themselves
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const n = models.length;
  const m = models[i]!;
  const entry = ENGINEERING_MODELS.find((x) => x.slug === m.slug)!;
  const pos = entry.pos;
  const text = entry.facts[active.id] ?? active.description;
  const go = (to: number) => {
    const next = (to + n) % n;
    setDir(next >= i ? 1 : -1);
    setI(next);
    setTouched(true);
  };

  // Cursor-follow tilt and spotlight for the image card.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 140, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 140, damping: 18 });
  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${useTransform(mx, (v) => `${v * 100}%`)} ${useTransform(my, (v) => `${v * 100}%`)}, rgba(80,160,255,.22), transparent 70%)`;
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || touched || paused || !inView || n < 2) return;
    const id = window.setTimeout(() => { setDir(1); setI((v) => (v + 1) % n); }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [i, reduced, touched, paused, inView, n]);

  return (
    <section className="border-y border-line bg-surface py-20 md:py-28">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="micro">{t("home.engineering")}</p>
          <h2 className="display mt-2 text-4xl md:text-6xl">{t("home.builtAround")}</h2>
          <p className="mt-6 max-w-md text-muted">Select a point on the machine, or switch bikes, to read how that system is built on each model.</p>
          <div className="mt-8 min-h-[190px] border border-line bg-elevated p-5" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${m.slug}-${active.id}`} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <p className="micro !text-blue-bright">{active.label} · {m.name}</p>
                <p className="mt-2 text-sm leading-relaxed">{text}</p>
                <p className="mt-3 text-xs text-muted">{ENGINEERING_SOURCE}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Component selector">
            {HOTSPOTS.map((h) => (
              <button key={h.id} aria-pressed={active.id === h.id} onClick={() => setActive(h)} className="border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] aria-pressed:border-blue-bright aria-pressed:bg-blue/25">{h.label}</button>
            ))}
          </div>
        </div>

        <div className="min-w-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <div ref={box} onMouseMove={onMove} onMouseLeave={onLeave} className="relative aspect-[3/2] overflow-hidden border border-line bg-[radial-gradient(70%_70%_at_50%_60%,rgba(22,119,255,.25),transparent)] transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(22,119,255,.35)]">
            {!reduced && <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: spotlight }} />}
            {!reduced && <motion.div key={`${m.slug}-sweep`} aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{ left: "-40%" }} animate={{ left: "120%" }} transition={{ duration: 1.1, ease: "easeInOut" }} />}
            <motion.div className="absolute inset-0" style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1100 }}>
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={m.slug}
                className="absolute inset-0"
                initial={reduced ? false : { opacity: 0, x: dir * 70, scale: 1.04 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, x: dir * -70, scale: 0.97 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={m.src} alt={`${m.name}, official product image, with engine, suspension and brake hotspots`} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-contain" />
                {HOTSPOTS.map((h, k) => (
                  <motion.button
                    key={h.id}
                    aria-label={`${h.label} hotspot`}
                    aria-pressed={active.id === h.id}
                    onClick={() => setActive(h)}
                    style={pos[h.id]}
                    initial={reduced ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: reduced ? 0 : 0.45 + k * 0.1 }}
                    whileHover={reduced ? undefined : { scale: 1.2 }}
                    whileTap={reduced ? undefined : { scale: 0.92 }}
                    className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-blue text-sm font-bold shadow-[0_0_0_7px_rgba(22,119,255,.25)] hover:brightness-125 aria-pressed:bg-blue-bright"
                  >
                    {!reduced && (
                      <>
                        <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-blue-bright" animate={{ scale: [1, 2.4], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: k * 0.35 }} />
                        {active.id === h.id && <motion.span aria-hidden className="pointer-events-none absolute -inset-2 rounded-full border border-white/70" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} style={{ borderStyle: "dashed" }} />}
                      </>
                    )}
                    <motion.span animate={{ rotate: active.id === h.id ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>+</motion.span>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
            </motion.div>

            <button aria-label="Previous bike in engineering view" onClick={() => go(i - 1)} className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center border border-line bg-bg/70 backdrop-blur hover:border-blue-bright"><ChevronLeft size={20} /></button>
            <button aria-label="Next bike in engineering view" onClick={() => go(i + 1)} className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center border border-line bg-bg/70 backdrop-blur hover:border-blue-bright"><ChevronRight size={20} /></button>
            <p className="micro absolute left-3 top-3 z-10 border border-line bg-bg/70 px-2 py-1 backdrop-blur" aria-live="polite">{m.name} · {i + 1}/{n}</p>
            <span className="absolute bottom-2 right-3 z-10 text-[10px] text-muted">Image © Yamaha Motor India Pvt. Ltd.</span>
            {!reduced && !touched && inView && !paused && n > 1 && (
              <motion.span key={`${m.slug}-bar`} aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-[3px] origin-left bg-blue-bright" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: AUTO_MS / 1000, ease: "linear" }} />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose motorcycle">
            {models.map((x, k) => (
              <button key={x.slug} aria-pressed={k === i} onClick={() => go(k)} className="border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] hover:border-blue-bright aria-pressed:border-blue-bright aria-pressed:bg-blue/25">{x.name}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

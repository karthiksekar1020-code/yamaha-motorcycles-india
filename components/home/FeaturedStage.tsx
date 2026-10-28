"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, m as motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { Parallax } from "@/components/ui/Parallax";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { fmtMeasure, fmtNum } from "@/lib/utils/format";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";
import type { Motorcycle } from "@/types/motorcycle";
import { useI18n } from "@/components/i18n/I18nProvider";

// Counts the leading number of a value like "155 cc" up from zero, keeping the unit and decimals.
function CountUp({ value, reduced, delay }: { value: string; reduced: boolean; delay: number }) {
  const match = value.match(/^([\d,.]+)(.*)$/);
  const target = match ? parseFloat(match[1]!.replace(/,/g, "")) : NaN;
  const decimals = match?.[1]?.split(".")[1]?.length ?? 0;
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduced || Number.isNaN(target)) { setShown(value); return; }
    const controls = animate(0, target, {
      duration: 1.1,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setShown(`${v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${match![2]}`),
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
  }, [value, reduced, delay, target, decimals]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{shown}</>;
}

export function FeaturedStage({ models }: { models: Motorcycle[] }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const reduced = usePrefersReducedMotion();
  const m = models[i]!;
  const go = (n: number) => setI((n + models.length) % models.length);

  // Only metrics that exist for this model are shown.
  const metrics = [
    ["Displacement", m.engineCc !== null ? fmtNum(m.engineCc, "cc") : null],
    ["Max power", m.power ? fmtMeasure(m.power) : null],
    ["Kerb weight", m.kerbWeightKg !== null ? fmtNum(m.kerbWeightKg, "kg") : null],
  ].filter((x): x is [string, string] => x[1] !== null);

  return (
    <section id="featured" className="relative overflow-hidden border-y border-line bg-surface py-16 md:py-24" aria-roledescription="carousel" aria-label="Featured motorcycles">
      <Parallax speed={120} className="pointer-events-none absolute -inset-y-24 inset-x-0">
        <div aria-hidden className="h-full w-full bg-[radial-gradient(50%_60%_at_70%_50%,rgba(22,119,255,.16),transparent),repeating-linear-gradient(115deg,transparent_0_70px,rgba(255,255,255,.03)_70px_71px)]" />
      </Parallax>
      <div className="container-x relative">
        <div className="flex items-end justify-between">
          <p className="micro">{t("home.featured")}</p>
          <div className="flex gap-2">
            <button aria-label="Previous motorcycle" onClick={() => go(i - 1)} className="grid h-11 w-11 place-items-center border border-line hover:border-blue-bright"><ChevronLeft /></button>
            <button aria-label="Next motorcycle" onClick={() => go(i + 1)} className="grid h-11 w-11 place-items-center border border-line hover:border-blue-bright"><ChevronRight /></button>
          </div>
        </div>

        <div className="relative mt-6 min-h-[360px] md:min-h-[380px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={m.slug} initial={reduced ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -40 }} transition={{ duration: 0.35 }} className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.3fr] md:items-center">
              <div>
                <p className="micro">{m.category}{m.engineCc ? ` · ${m.engineCc} cc class` : ""}</p>
                <h2 className="display mt-2 text-4xl md:text-6xl">{m.name}</h2>
                <p className="mt-4 max-w-sm text-sm text-muted">{m.description}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`/motorcycles/${m.slug}`} className="btn">View motorcycle</Link>
                  <Link href={`/experience?model=${encodeURIComponent(m.slug)}`} className="btn btn-ghost">Configure</Link>
                  <CompareToggle slug={m.slug} name={m.name} className="h-12" />
                </div>
              </div>
              <Parallax speed={-70} className="relative">
                <ModelPicture m={m} className="mx-auto h-auto w-full max-w-3xl drop-shadow-[0_30px_50px_rgba(22,119,255,.25)]" sizes="(min-width:768px) 55vw, 100vw" />
              </Parallax>
            </motion.div>
          </AnimatePresence>
        </div>

        <dl className="num mt-8 grid grid-cols-3 border border-line">
          {metrics.map(([k, v], n) => (
            <motion.div
              key={`${m.slug}-${k}`}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: n * 0.12, ease: "easeOut" }}
              whileHover={reduced ? undefined : { backgroundColor: "rgba(22,119,255,.12)" }}
              className="group relative overflow-hidden border-r border-line p-4 last:border-r-0"
            >
              <dt className="micro">{k}</dt>
              <dd className="display mt-1 text-2xl md:text-4xl"><CountUp value={v} reduced={reduced} delay={n * 0.12} /></dd>
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-blue-bright transition-transform duration-500 group-hover:scale-x-100" />
            </motion.div>
          ))}
        </dl>

        <div role="tablist" aria-label="Choose featured motorcycle" className="mt-6 flex gap-2">
          {models.map((x, n) => (
            <button key={x.slug} role="tab" aria-selected={n === i} aria-label={x.name} onClick={() => setI(n)} className="group flex-1 py-2">
              <span className={`block h-[3px] transition-colors ${n === i ? "bg-blue-bright" : "bg-line group-hover:bg-metal"}`} />
              <span className={`micro mt-2 block ${n === i ? "!text-fg" : ""}`}>{x.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Product images © Yamaha Motor India Pvt. Ltd. Models without an official image show illustrative artwork.</p>
      </div>
    </section>
  );
}

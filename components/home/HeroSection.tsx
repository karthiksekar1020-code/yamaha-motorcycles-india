"use client";
import Link from "next/link";
import { m as motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { AnimatedLine } from "./AnimatedHeadline";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";
import type { Motorcycle } from "@/types/motorcycle";
import { useI18n } from "@/components/i18n/I18nProvider";

export function HeroSection({ motorcycle }: { motorcycle: Motorcycle }) {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, reduced ? 0 : 140]);
  const bgX = useTransform(scrollY, [0, 800], [0, reduced ? 0 : -60]);
  // The bike drifts and grows slightly as you scroll, at a different rate from the background.
  const bikeScale = useTransform(scrollY, [0, 800], [1, reduced ? 1 : 1.14]);
  const bikeX = useTransform(scrollY, [0, 800], [0, reduced ? 0 : 50]);
  const bikeY = useTransform(scrollY, [0, 800], [0, reduced ? 0 : -50]);
  const textY = useTransform(scrollY, [0, 800], [0, reduced ? 0 : 60]);
  const fade = useTransform(scrollY, [0, 600], [1, reduced ? 1 : 0.2]);

  const rise = (delay: number) => (reduced ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden pb-14 pt-24 md:items-center md:pb-0" aria-labelledby="hero-title">
      <motion.div aria-hidden style={{ y: bgY, x: bgX }} className="absolute -inset-x-16 inset-y-0 bg-[radial-gradient(60%_70%_at_75%_55%,rgba(22,119,255,.22),transparent),repeating-linear-gradient(115deg,transparent_0_70px,rgba(255,255,255,.035)_70px_71px)]" />
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-x-0 top-[72px] h-[48svh] md:pointer-events-auto md:inset-y-0 md:left-[47%] md:right-0 md:top-0 md:h-auto">
        <div className="flex h-full w-full items-center justify-center md:pl-6">
            <motion.div style={{ x: bikeX, y: bikeY, scale: bikeScale }} className="w-full max-w-[720px]">
              <motion.div
                initial={reduced ? false : { opacity: 0, x: 220, scale: 0.78 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div animate={reduced ? undefined : { y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                  <ModelPicture m={motorcycle} priority className="h-auto w-full drop-shadow-[0_40px_60px_rgba(22,119,255,.35)]" sizes="(min-width:768px) 60vw, 100vw" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
      </motion.div>

      <div className="container-x relative z-10">
        <motion.div style={{ y: textY }} className="max-w-[640px]">
          <motion.p {...rise(0.05)} className="micro !text-blue-bright">{t("hero.eyebrow")}</motion.p>
          <h1 id="hero-title" className="display mt-3 text-[clamp(3rem,7.4vw,6.5rem)]">
            <span className="sr-only">{t("hero.line1")} {t("hero.line2")}</span>
            <AnimatedLine text={t("hero.line1")} delay={0.1} />
            <AnimatedLine text={t("hero.line2")} delay={0.5} wave className="text-blue-bright" />
          </h1>
          <motion.p {...rise(0.4)} className="mt-6 max-w-md text-base text-muted md:text-lg">{t("hero.lead")}</motion.p>
          <motion.div {...rise(0.5)} className="mt-8 flex flex-wrap gap-3">
            <Link href="/motorcycles" className="btn">{t("hero.cta1")}</Link>
            <Link href="/experience" className="btn btn-ghost">{t("hero.cta2")}</Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="hero-meta absolute inset-x-0 bottom-5 z-10">
        <div className="container-x flex items-center justify-between">
          <span className="micro">{t("hero.meta")}</span>
          <a href="#featured" onClick={(e) => { e.preventDefault(); document.getElementById("featured")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }} className="micro flex items-center gap-1 !text-fg" aria-label="Scroll to featured motorcycle">{t("hero.scroll")} <ChevronDown size={16} /></a>
        </div>
      </div>
    </section>
  );
}

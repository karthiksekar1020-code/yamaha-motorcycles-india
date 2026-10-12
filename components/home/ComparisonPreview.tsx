"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m as motion } from "framer-motion";
import { ModelPicture } from "@/components/ui/ModelPicture";
import { NA, SPEC_ROWS } from "@/lib/utils/format";
import type { Motorcycle } from "@/types/motorcycle";
import { useI18n } from "@/components/i18n/I18nProvider";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

const KEYS = ["cc", "power", "torque", "weight", "seat", "fuel"];

export function ComparisonPreview({ models }: { models: Motorcycle[] }) {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const EASE = [0.22, 1, 0.36, 1] as const;
  const [a, setA] = useState(models[0]!.slug);
  const [b, setB] = useState((models[1] ?? models[0])!.slug);
  const A = models.find((m) => m.slug === a)!, B = models.find((m) => m.slug === b)!;
  const rows = SPEC_ROWS.filter((r) => KEYS.includes(r.key));
  const select = (id: string, label: string, v: string, set: (s: string) => void) => (
    <div><label htmlFor={id} className="micro mb-2 block">{label}</label>
      <select id={id} className="field" value={v} onChange={(e) => set(e.target.value)}>{models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}</select></div>
  );
  return (
    <section className="container-x overflow-x-clip py-20 md:py-28">
      <p className="micro">{t("home.compare")}</p>
      <h2 className="display mt-2 text-4xl md:text-6xl">{t("home.precision")}</h2>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {[[A, select("cmp-a", "First motorcycle", a, setA)], [B, select("cmp-b", "Second motorcycle", b, setB)]].map(([m, sel], i) => (
          // Panels slide in from opposite sides on scroll; the bike slides out and the new one slides in when the model changes.
          <motion.div
            key={i}
            initial={reduced ? false : { opacity: 0, x: i ? 70 : -70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="compare-panel border border-line p-5"
          >
            {sel as React.ReactNode}
            <div className="relative my-4 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={(m as Motorcycle).slug}
                  initial={reduced ? false : { opacity: 0, x: i ? 80 : -80, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, x: i ? -80 : 80, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <ModelPicture m={m as Motorcycle} className="compare-bike mx-auto h-52 w-auto max-w-full md:h-72" sizes="(min-width:768px) 50vw, 100vw" />
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="micro">{(m as Motorcycle).category}</p>
          </motion.div>
        ))}
      </div>
      <table className="num mt-6 w-full text-left text-sm" aria-live="polite">
        <caption className="sr-only">Key specification comparison</caption>
        <thead><tr><th scope="col" className="py-2"><span className="sr-only">Specification</span></th><th scope="col" className="py-2 text-xs uppercase tracking-[.14em]">{A.name}</th><th scope="col" className="py-2 text-xs uppercase tracking-[.14em]">{B.name}</th></tr></thead>
        <tbody>
          {rows.map((r, n) => {
            const va = r.get(A), vb = r.get(B);
            return (
              <motion.tr
                key={r.key}
                initial={reduced ? false : { opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -5% 0px" }}
                transition={{ duration: 0.5, delay: n * 0.07, ease: EASE }}
                className="compare-row border-t border-line"
              >
                <th scope="row" className="py-3 pr-3 text-xs font-semibold uppercase tracking-[.14em] text-muted">{r.label}</th>
                {/* keyed by value: a changed spec fades and rises into place */}
                <motion.td key={`a-${a}-${va}`} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`py-3 ${va !== vb ? "text-blue-bright" : ""} ${va === NA ? "text-muted" : ""}`}>{va}</motion.td>
                <motion.td key={`b-${b}-${vb}`} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`py-3 ${va !== vb ? "text-blue-bright" : ""} ${vb === NA ? "text-muted" : ""}`}>{vb}</motion.td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {A.market !== B.market && <p className="mt-4 text-xs text-muted">These models are listed for different markets; specifications and availability may differ.</p>}
      <Link href={`/compare?m=${A.slug}${B.slug !== A.slug ? `,${B.slug}` : ""}`} className="btn mt-8">Open full comparison</Link>
    </section>
  );
}

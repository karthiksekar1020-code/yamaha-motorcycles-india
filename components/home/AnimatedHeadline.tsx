"use client";
import { m as motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

/** Splits into user-perceived characters so Devanagari conjuncts and vowel signs are never broken apart. */
function graphemes(word: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word), (s) => s.segment);
  }
  return [...word];
}

/**
 * Headline line animated letter by letter: a staggered blur-to-sharp rise, then (for `wave`)
 * a soft light wave that keeps travelling across the letters. Letters lift on hover.
 * The parent heading carries the real text for assistive tech; these letters are hidden from it.
 */
export function AnimatedLine({ text, delay = 0, wave = false, className = "" }: { text: string; delay?: number; wave?: boolean; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(" ");
  let n = 0;
  return (
    <span className={`block ${className}`} aria-hidden>
      {words.map((word, wi) => (
        <span key={`${text}-${wi}`} className="inline-block whitespace-nowrap">
          {graphemes(word).map((ch) => {
            const i = n++;
            return (
              <motion.span
                key={`${text}-${i}`}
                className={`inline-block ${wave ? "hero-wave" : ""}`}
                style={{ ["--i" as string]: i, ["--d" as string]: `${delay + 0.9}s` }}
                initial={reduced ? false : { opacity: 0, y: 48, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: delay + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduced ? undefined : { y: -10, scale: 1.08, transition: { duration: 0.18 } }}
              >
                {ch}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block w-[0.28em]" />}
        </span>
      ))}
    </span>
  );
}

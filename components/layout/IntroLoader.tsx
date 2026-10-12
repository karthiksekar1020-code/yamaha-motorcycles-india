"use client";
import { useEffect, useRef, useState } from "react";
import { m as motion } from "framer-motion";

/**
 * Intro animation: the brand name fills the screen, scales down and centres, then flies into the
 * top-left logo spot in the header and becomes the real logo.
 *
 * - The overlay is server-rendered, so it covers the page from the first paint (no flash of content).
 * - An inline script flags <html data-intro="play|skip"> before first paint (skip: already seen this
 *   session, or the visitor prefers reduced motion). See the data-intro rules in globals.css.
 * - The word copies the header logo's font, so scaling it onto the logo's measured box is pixel-exact.
 */

const SEEN_KEY = "ymi.intro";
const DURATION = 3.2;
// Segments: fill the screen -> hold -> scale down to centre -> hold -> fly to the header logo.
const TIMES = [0, 0.3, 0.52, 0.64, 1];
const EASE = ["linear", [0.76, 0, 0.24, 1], "linear", [0.76, 0, 0.24, 1]] as const;
const BASE_PX = 100;

type Frames = { x: number[]; y: number[]; scale: number[]; mark: { x: number[]; y: number[]; scale: number[] } | null };

export function IntroLoader({ brand = "YAMAHA", oncePerSession = true, logoSrc = null }: { brand?: string; oncePerSession?: boolean; logoSrc?: string | null }) {
  const wordRef = useRef<HTMLDivElement>(null);
  const [frames, setFrames] = useState<Frames | null>(null);
  const [gone, setGone] = useState(false);

  const finish = () => {
    document.documentElement.setAttribute("data-intro", "done");
    if (oncePerSession) try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    setGone(true);
  };

  useEffect(() => {
    if (document.documentElement.getAttribute("data-intro") !== "play") { setGone(true); return; }
    let cancelled = false;
    const failsafe = window.setTimeout(finish, 6000); // never trap the visitor behind the overlay

    (async () => {
      try { await document.fonts.ready; } catch {}
      const word = wordRef.current;
      const target = document.querySelector<HTMLElement>(".logo-lockup .l1");
      if (cancelled || !word || !target) return;

      // Copy the logo's typography so both render the same glyph shapes.
      const cs = getComputedStyle(target);
      const fs = parseFloat(cs.fontSize) || 24;
      const ls = parseFloat(cs.letterSpacing);
      word.style.fontFamily = cs.fontFamily;
      word.style.fontWeight = cs.fontWeight;
      word.style.textTransform = cs.textTransform;
      word.style.letterSpacing = `${(Number.isNaN(ls) ? 0 : ls / fs) * BASE_PX}px`;
      word.style.lineHeight = String((parseFloat(cs.lineHeight) || fs * 1.02) / fs);
      word.textContent = target.textContent || brand;

      const ww = word.offsetWidth, wh = word.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight;
      const place = (scale: number) => ({ x: (vw - ww * scale) / 2, y: (vh - wh * scale) / 2, scale });
      const big = place((vw * 0.9) / ww);
      const mid = place(Math.min((vw * 0.9) / ww, (vw * 0.34) / ww) * (vw < 640 ? 1.6 : 1));
      const r = target.getBoundingClientRect();
      const end = { x: r.left, y: r.top, scale: r.width / ww };

      // Brand mark (optional): spins in above the centred name, then flies to the header mark with the word.
      const markTarget = logoSrc ? document.querySelector<HTMLElement>(".brand-mark") : null;
      let mark: Frames["mark"] = null;
      if (markTarget) {
        const mr = markTarget.getBoundingClientRect();
        const MS = 0.8; // centred size: 80px
        // The mark is BASE_PX square and scales about its centre, so convert a wanted top-left into a translate.
        const at = (left: number, top: number, sc: number) => ({ x: left - BASE_PX / 2 + (BASE_PX * sc) / 2, y: top - BASE_PX / 2 + (BASE_PX * sc) / 2, scale: sc });
        const gap = 18, midH = wh * mid.scale;
        const pop = at((vw - BASE_PX * MS) / 2, (vh - midH) / 2 - BASE_PX * MS - gap, MS * 0.25);
        const rest = at((vw - BASE_PX * MS) / 2, (vh - midH) / 2 - BASE_PX * MS - gap, MS);
        const land = at(mr.left, mr.top, mr.width / BASE_PX);
        mark = { x: [pop.x, pop.x, rest.x, rest.x, land.x], y: [pop.y, pop.y, rest.y, rest.y, land.y], scale: [pop.scale, pop.scale, rest.scale, rest.scale, land.scale] };
      }

      window.clearTimeout(failsafe);
      setFrames({
        x: [big.x, big.x, mid.x, mid.x, end.x],
        y: [big.y, big.y, mid.y, mid.y, end.y],
        scale: [big.scale, big.scale, mid.scale, mid.scale, end.scale],
        mark,
      });
    })();

    return () => { cancelled = true; window.clearTimeout(failsafe); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <>
      <script
        // Static string, no user input: decides before first paint whether the intro plays.
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document.documentElement;try{var s=${oncePerSession ? `sessionStorage.getItem("${SEEN_KEY}")||` : ""}matchMedia("(prefers-reduced-motion: reduce)").matches;d.setAttribute("data-intro",s?"skip":"play")}catch(e){d.setAttribute("data-intro","play")}})();`,
        }}
      />
      <div className="intro-overlay fixed inset-0 z-[200]" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-bg"
          initial={{ opacity: 1 }}
          animate={frames ? { opacity: [1, 1, 0] } : undefined}
          transition={{ duration: DURATION, times: [0, 0.64, 0.97], ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[14vh] left-1/2 h-px w-[min(240px,50vw)] -translate-x-1/2 origin-left bg-blue"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={frames ? { scaleX: [0, 1, 1], opacity: [1, 1, 0] } : undefined}
          transition={{ duration: DURATION, times: [0, 0.5, 0.6], ease: "easeInOut" }}
        />
        {logoSrc && frames?.mark && (
          <motion.img
            src={logoSrc}
            alt=""
            width={BASE_PX}
            height={BASE_PX}
            className="absolute left-0 top-0"
            style={{ width: BASE_PX, height: BASE_PX, transformOrigin: "50% 50%", willChange: "transform" }}
            initial={{ opacity: 0, rotate: -220, x: frames.mark.x[0], y: frames.mark.y[0], scale: frames.mark.scale[0] }}
            animate={{ x: frames.mark.x, y: frames.mark.y, scale: frames.mark.scale, opacity: [0, 0, 1, 1, 1], rotate: [-220, -220, 0, 0, 360] }}
            transition={{ duration: DURATION, times: TIMES, ease: EASE as never }}
          />
        )}
        <motion.div
          ref={wordRef}
          className="display absolute left-0 top-0 whitespace-nowrap text-fg"
          style={{ fontSize: BASE_PX, transformOrigin: "0 0", visibility: frames ? "visible" : "hidden", willChange: "transform" }}
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          animate={frames ? { x: frames.x, y: frames.y, scale: frames.scale, clipPath: "inset(0% 0% 0% 0%)" } : undefined}
          transition={{
            x: { duration: DURATION, times: TIMES, ease: EASE as never },
            y: { duration: DURATION, times: TIMES, ease: EASE as never },
            scale: { duration: DURATION, times: TIMES, ease: EASE as never },
            clipPath: { duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
          }}
          onAnimationComplete={(def) => { if (typeof def === "object" && "x" in def) finish(); }}
        >
          {brand}
        </motion.div>
      </div>
    </>
  );
}

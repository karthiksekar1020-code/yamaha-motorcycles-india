"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Expand, Minus, Pause, Play, Plus, RotateCcw, RotateCw, Shrink } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

interface Props {
  src: string; width: number; height: number; alt: string; label: string; credit?: string;
}

const MAX_YAW = 32, MAX_PITCH = 10;

/**
 * 3D tilt view of an official photo: perspective tilt (drag), zoom, pan, auto-sway, reset and fullscreen.
 * It tilts the photo in 3D space; it is NOT a 360° model (the source has a single camera angle).
 */
export function TiltStage({ src, width, height, alt, label, credit }: Props) {
  const reduced = usePrefersReducedMotion();
  const host = useRef<HTMLElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: -14 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);

  const isBanner = width / height > 1.9; // wide promotional images: keep them flat
  const maxZoom = 3;

  const pitch = isBanner ? 0 : tilt.x;
  const stageTransform = (sway: number) => `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(${pitch}deg) rotateY(${isBanner ? 0 : tilt.y + sway}deg)`;
  // the ground shadow shifts opposite to the tilt for depth
  const shadowTransform = (sway: number) => { const yaw = isBanner ? 0 : tilt.y + sway; return `translateX(${-yaw * 1.2}px) scaleX(${1 - Math.abs(yaw) / 120})`; };
  const latest = useRef({ stageTransform, shadowTransform });
  latest.current = { stageTransform, shadowTransform };

  // Auto-sway (pauses when dragging, zoomed, off-screen, hidden or reduced motion). The sway is written straight to the
  // DOM every frame instead of through state, so React does not re-render this whole component 30 times a second.
  useEffect(() => {
    const paint = (sway: number) => {
      if (stage.current) stage.current.style.transform = latest.current.stageTransform(sway);
      if (shadow.current) shadow.current.style.transform = latest.current.shadowTransform(sway);
    };
    if (!playing || reduced || dragging || zoom > 1 || !inView || isBanner) { paint(0); return; }
    let raf = 0, last = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (now - last > 33) { last = now; paint(Math.sin((now - t0) / 1400) * 14); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, dragging, zoom, inView, isBanner]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [canFs, setCanFs] = useState(false);
  useEffect(() => setCanFs(Boolean(document.fullscreenEnabled)), []); // after mount: server and first client render must match

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === host.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    const el = area.current;
    const lx = el ? ((z - 1) * el.clientWidth) / 2 : 0, ly = el ? ((z - 1) * el.clientHeight) / 2 : 0;
    return { x: Math.max(-lx, Math.min(lx, p.x)), y: Math.max(-ly, Math.min(ly, p.y)) };
  }, []);

  const setZ = useCallback((f: number) => setZoom((z) => {
    const nz = Math.max(1, Math.min(maxZoom, +(z * f).toFixed(3)));
    setPan((p) => clampPan(p, nz));
    return nz;
  }), [clampPan]);

  const reset = useCallback(() => { setTilt({ x: 0, y: -14 }); setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const rotate = (d: number) => setTilt((t) => ({ ...t, y: Math.max(-MAX_YAW, Math.min(MAX_YAW, t.y + d)) }));

  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    if (zoom > 1) setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, zoom));
    else setTilt((t) => ({ x: Math.max(-MAX_PITCH, Math.min(MAX_PITCH, t.x - dy * 0.15)), y: Math.max(-MAX_YAW, Math.min(MAX_YAW, t.y + dx * 0.3)) }));
  };
  const onPointerUp = () => { drag.current = null; setDragging(false); };

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, () => void> = {
      ArrowLeft: () => (zoom > 1 ? setPan((p) => clampPan({ ...p, x: p.x + 30 }, zoom)) : rotate(-6)),
      ArrowRight: () => (zoom > 1 ? setPan((p) => clampPan({ ...p, x: p.x - 30 }, zoom)) : rotate(6)),
      ArrowUp: () => (zoom > 1 ? setPan((p) => clampPan({ ...p, y: p.y + 30 }, zoom)) : setTilt((t) => ({ ...t, x: Math.min(MAX_PITCH, t.x + 3) }))),
      ArrowDown: () => (zoom > 1 ? setPan((p) => clampPan({ ...p, y: p.y - 30 }, zoom)) : setTilt((t) => ({ ...t, x: Math.max(-MAX_PITCH, t.x - 3) }))),
      "+": () => setZ(1.25), "=": () => setZ(1.25), "-": () => setZ(0.8), "0": reset, " ": () => setPlaying((p) => !p),
    };
    const fn = map[e.key];
    if (fn) { e.preventDefault(); fn(); }
  };

  const toggleFs = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await host.current?.requestFullscreen(); } catch { /* unsupported or denied */ }
  };

  const btn = "grid h-10 w-10 place-items-center border border-line bg-bg/70 backdrop-blur hover:border-blue-bright hover:text-blue-bright disabled:opacity-40";
  const smooth = dragging || (!reduced && playing && zoom === 1 && !isBanner) ? "none" : "transform .35s ease-out";

  return (
    <figure ref={host} className="relative aspect-[4/3] w-full overflow-hidden border border-line bg-[radial-gradient(60%_60%_at_50%_70%,rgba(22,119,255,.28),#0a1538_80%)] md:aspect-[16/9]">
      <div
        ref={area} tabIndex={0} role="group" onKeyDown={onKey}
        aria-label={`3D tilt view of ${alt}. Drag to tilt, plus and minus to zoom, zero to reset, space to pause the sway.`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ touchAction: zoom > 1 ? "none" : "pan-y", perspective: "1100px" }}
        className={`absolute inset-0 flex select-none items-center justify-center ${dragging ? "cursor-grabbing" : "cursor-grab"} focus-visible:outline-offset-[-3px]`}
      >
        <div ref={shadow} aria-hidden className="absolute bottom-[13%] h-[6%] w-[58%] rounded-[50%] bg-black/55 blur-xl" style={{ transform: shadowTransform(0) }} />
        <div
          ref={stage}
          style={{ transform: stageTransform(0), transition: smooth, transformStyle: "preserve-3d", willChange: "transform" }}
          className="relative flex h-[88%] w-[88%] items-center justify-center"
        >
          <Image key={src} src={src} alt={alt} width={width} height={height} priority draggable={false} sizes="(min-width:1024px) 60vw, 100vw"
            className="pointer-events-none h-full w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.45)]" />
        </div>
      </div>

      <div className="absolute bottom-8 left-3 flex flex-wrap gap-1.5" role="toolbar" aria-label="3D view controls">
        <button className={btn} aria-label="Tilt left" onClick={() => rotate(-12)} disabled={isBanner}><RotateCcw size={18} /></button>
        <button className={btn} aria-label="Tilt right" onClick={() => rotate(12)} disabled={isBanner}><RotateCw size={18} /></button>
        <button className={btn} aria-label="Zoom in" onClick={() => setZ(1.3)} disabled={zoom >= maxZoom}><Plus size={18} /></button>
        <button className={btn} aria-label="Zoom out" onClick={() => setZ(1 / 1.3)} disabled={zoom <= 1}><Minus size={18} /></button>
        <button className={btn} aria-label={playing ? "Pause auto sway" : "Play auto sway"} aria-pressed={playing} onClick={() => setPlaying((p) => !p)} disabled={isBanner}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button className={btn} aria-label="Reset view" onClick={reset}><span className="text-[10px] font-bold">RESET</span></button>
        {canFs && <button className={btn} aria-label={fs ? "Exit fullscreen" : "Enter fullscreen"} onClick={toggleFs}>{fs ? <Shrink size={18} /> : <Expand size={18} />}</button>}
      </div>

      <figcaption className="absolute bottom-2 left-3 right-3 flex justify-between gap-3 text-[10px] text-muted">
        <span>{label}</span>
        {credit && <span className="text-right">{credit}</span>}
      </figcaption>
    </figure>
  );
}

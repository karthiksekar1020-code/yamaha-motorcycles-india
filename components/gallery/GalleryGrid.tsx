"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from "lucide-react";
import { m as motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/lib/admin/client";
import { ACCEPT, MAX_FILE_MB, MAX_PHOTOS, deletePhoto, listPhotos, savePhoto, shrink } from "./myPhotos";
import type { GalleryItem } from "@/lib/gallery";

type Item = GalleryItem & { mine?: boolean };

function Art({ g, className = "", sizes, card = false }: { g: GalleryItem; className?: string; sizes: string; card?: boolean }) {
  return (
    <div className={`${card ? "absolute inset-0" : "relative"} overflow-hidden bg-[radial-gradient(70%_70%_at_50%_65%,rgba(22,119,255,.2),#0a1538_75%)] ${className}`}>
      <Image src={g.src} alt={g.alt} fill sizes={sizes} className="object-contain p-3" />
    </div>
  );
}

const toItem = (id: string, name: string, url: string): Item => {
  const title = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 60) || "My photo";
  return { id: `mine-${id}`, title, caption: "Added from this device. Only you can see it; it is stored in this browser.", kind: "Your photo", src: url, width: 1600, height: 1067, alt: title, mine: true };
};

/**
 * `canRemove` is true only when the SERVER confirmed the visitor is the signed-in owner. It only decides whether the
 * buttons are drawn: the actual removal is refused by the server and the database unless the request comes from the owner.
 */
export function GalleryGrid({ items: base, viewerTile = false, canRemove = false }: { items: GalleryItem[]; viewerTile?: boolean; canRemove?: boolean }) {
  const router = useRouter();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [toRemove, setToRemove] = useState<Item | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [mine, setMine] = useState<Item[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const urls = useRef<Map<string, string>>(new Map());
  const fileInput = useRef<HTMLInputElement>(null);
  const reduced = usePrefersReducedMotion();

  // "Your photos" only exist on the gallery page (viewerTile); they come back from this browser's storage.
  useEffect(() => {
    if (!viewerTile) return;
    let off = false;
    const map = urls.current;
    listPhotos().then((rows) => {
      if (off) return;
      setMine(rows.map((r) => { const u = URL.createObjectURL(r.blob); map.set(r.id, u); return toItem(r.id, r.name, u); }));
    }).catch(() => { /* storage blocked (private mode): adding still works for this visit only if it can, else a message shows */ });
    return () => { off = true; map.forEach((u) => URL.revokeObjectURL(u)); map.clear(); };
  }, [viewerTile]);

  const items: Item[] = (viewerTile ? [...base, ...mine] : base).filter((x) => !removed.has(x.id));
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, step]);

  const addFiles = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (fileInput.current) fileInput.current.value = "";
    if (files.length === 0) return;
    setBusy(true);
    let added = 0;
    const problems: string[] = [];
    let count = mine.length;
    for (const f of files) {
      if (count >= MAX_PHOTOS) { problems.push(`limit of ${MAX_PHOTOS} photos reached`); break; }
      if (!ACCEPT.includes(f.type)) { problems.push(`${f.name}: not a supported image (use JPG, PNG, WebP, GIF or AVIF)`); continue; }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { problems.push(`${f.name}: larger than ${MAX_FILE_MB} MB`); continue; }
      try {
        const blob = await shrink(f);
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        await savePhoto({ id, name: f.name, blob, addedAt: Date.now() });
        const u = URL.createObjectURL(blob);
        urls.current.set(id, u);
        setMine((m) => [...m, toItem(id, f.name, u)]);
        count++; added++;
      } catch {
        problems.push(`${f.name}: could not be added (browser storage may be blocked)`);
      }
    }
    setBusy(false);
    setStatus([added ? `Added ${added} photo${added === 1 ? "" : "s"}. They appear just above this button and are saved in this browser only.` : "", ...problems].filter(Boolean).join(" "));
  };

  const removeMine = async (it: Item) => {
    const id = it.id.replace(/^mine-/, "");
    try { await deletePhoto(id); } catch { /* ignore */ }
    const u = urls.current.get(id);
    if (u) { URL.revokeObjectURL(u); urls.current.delete(id); }
    setOpen(null);
    setMine((m) => m.filter((x) => x.id !== it.id));
    setStatus("Photo removed.");
  };

  // Owner removal of a built-in or uploaded photo goes through the protected API; a visitor's own device photo is just deleted locally.
  const confirmRemove = async () => {
    const it = toRemove;
    if (!it) return;
    setRemoving(true); setRemoveError("");
    if (it.mine) { await removeMine(it); setRemoving(false); setToRemove(null); return; }
    const res = it.id.startsWith("upload-")
      ? await api(`/api/admin/gallery/${it.id.slice("upload-".length)}`, { method: "DELETE" })
      : await api("/api/admin/gallery/hide", { json: { itemId: it.id } });
    setRemoving(false);
    if (!res.ok) { setRemoveError(res.status === 401 || res.status === 403 ? "Your owner session has ended. Sign in again to remove photos." : res.error.message); return; }
    setRemoved((r) => new Set(r).add(it.id));
    setOpen(null); setToRemove(null);
    setStatus(`Removed “${it.title}” from the gallery.`);
    router.refresh(); // re-read the gallery from the server so the page matches the database
  };
  const mayRemove = (it: Item) => Boolean(it.mine) || canRemove;

  const g = open === null ? null : items[open]!;
  const gap = (3 - (items.length % 3)) % 3;
  const narrow = gap === 1; // the tile has a single column on desktop: drop the photo stack and shrink the text
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((it, i) => (
          <motion.li
            key={it.id}
            // Scroll reveal: each card rises and fades in once as it enters the viewport, staggered across its row of 3.
            initial={reduced ? false : { opacity: 0, y: 56, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.75, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {mayRemove(it) && (
              <button
                onClick={() => { setRemoveError(""); setToRemove(it); }}
                aria-label={`Remove photo: ${it.title}`}
                title="Remove this photo"
                className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur transition-colors hover:border-danger hover:bg-danger"
              ><Trash2 size={16} aria-hidden /></button>
            )}
            <button onClick={() => setOpen(i)} aria-label={`Open image: ${it.title}`} aria-haspopup="dialog" className="gallery-card group relative block aspect-[3/2] w-full overflow-hidden border border-line text-left hover:border-blue-bright">
              <motion.div
                className="absolute inset-0"
                initial={reduced ? false : { scale: 1.2 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 1.2, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <Art g={it} card sizes="(min-width:768px) 30vw, 50vw" className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.08]" />
              </motion.div>
              <span className="gallery-label absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 to-transparent p-3"><span className="micro !text-fg">{it.kind}</span><span className="block text-sm">{it.title}</span></span>
            </button>
          </motion.li>
        ))}
        {viewerTile && items.length > 0 && (
          // Image-style tile that fills the empty slots of the last row: opens the viewer, or adds the visitor's own photos.
          <motion.li
            className={`col-span-2 ${gap === 0 ? "md:col-span-3" : gap === 1 ? "md:col-span-1" : "md:col-span-2"}`}
            initial={reduced ? false : { opacity: 0, y: 56, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="group relative flex h-full min-h-[210px] w-full items-center justify-between gap-6 overflow-hidden border border-blue-bright/50 bg-[radial-gradient(80%_120%_at_20%_50%,rgba(22,119,255,.35),#0a1538_75%)] p-6 transition-colors hover:border-blue-bright md:p-8">
              <button onClick={() => setOpen(0)} aria-haspopup="dialog" aria-label={`Open the image viewer with all ${items.length} photos`} className="absolute inset-0 z-0" />
              <div className="pointer-events-none relative z-10">
                <span className={`display block ${narrow ? "text-3xl md:text-2xl" : "text-3xl md:text-4xl"}`}>View all {items.length} photos</span>
                <span className="micro mt-2 block !text-fg">{narrow ? "Open the viewer →" : "Open the full-screen image viewer →"}</span>
                <input ref={fileInput} id="add-photo" type="file" multiple accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => addFiles(e.target.files)} disabled={busy} />
                <label htmlFor="add-photo" className={`btn btn-ghost btn-sm pointer-events-auto mt-4 cursor-pointer whitespace-nowrap ${busy ? "opacity-60" : ""}`}>
                  <ImagePlus size={16} /> {busy ? "Adding…" : "Add photo"}
                </label>
              </div>
              <span aria-hidden className={`pointer-events-none relative hidden h-28 w-44 shrink-0 sm:block ${narrow ? "md:hidden" : ""}`}>
                {items.slice(0, 3).map((it, k) => (
                  <span key={it.id} className="absolute top-0 h-24 w-32 overflow-hidden border border-line bg-surface shadow-lg transition-transform duration-500 group-hover:translate-x-2" style={{ left: k * 28, top: k * 6, zIndex: k, transform: `rotate(${(k - 1) * 5}deg)` }}>
                    <Image src={it.src} alt="" fill sizes="128px" className="object-contain p-1" />
                  </span>
                ))}
              </span>
            </div>
          </motion.li>
        )}
      </ul>
      {viewerTile && (
        <p className="mt-3 min-h-5 text-xs text-muted" role="status" aria-live="polite">
          {status || `Add photos from your device (JPG, PNG, WebP, GIF or AVIF, up to ${MAX_FILE_MB} MB each, ${MAX_PHOTOS} max). They are saved in this browser only and are not uploaded.`}
        </p>
      )}

      <ModalDialog open={open !== null} onClose={() => setOpen(null)} label="Image viewer" className="fixed inset-0 h-full w-full">
        {g && (
          <div className="flex h-full w-full flex-col bg-black/95 p-4 md:p-8">
            <div className="flex items-center justify-between"><p className="micro num">{(open ?? 0) + 1} / {items.length} · {g.kind}</p><button aria-label="Close image viewer" onClick={() => setOpen(null)} className="p-2"><X size={24} /></button></div>
            <div className="relative my-4 flex min-h-0 flex-1 items-center justify-center">
              <button aria-label="Previous image" onClick={() => step(-1)} className="absolute left-0 z-10 grid h-12 w-12 place-items-center border border-line bg-bg/70"><ChevronLeft /></button>
              <Art g={g} sizes="90vw" className="aspect-[3/2] max-h-full w-full max-w-5xl border border-line" />
              <button aria-label="Next image" onClick={() => step(1)} className="absolute right-0 z-10 grid h-12 w-12 place-items-center border border-line bg-bg/70"><ChevronRight /></button>
            </div>
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="display text-2xl">{g.title}</h3>
              <p className="mt-1 text-sm text-muted">{g.caption}</p>
              {mayRemove(g as Item) && (
                <button onClick={() => { setRemoveError(""); setToRemove(g as Item); }} className="btn btn-ghost btn-sm mt-3"><Trash2 size={16} /> Remove this photo</button>
              )}
            </div>
          </div>
        )}
      </ModalDialog>

      <ConfirmDialog
        open={toRemove !== null}
        title="Remove this photo?"
        confirmLabel="Remove photo"
        busy={removing}
        error={removeError}
        onConfirm={confirmRemove}
        onCancel={() => { setToRemove(null); setRemoveError(""); }}
      >
        {toRemove?.mine
          ? "This deletes the photo you added from this browser."
          : toRemove?.id.startsWith("upload-")
            ? `“${toRemove.title}” is deleted from the website and from storage. This cannot be undone.`
            : `“${toRemove?.title}” is taken off the public gallery for everyone. You can restore it later from Admin → Gallery.`}
      </ConfirmDialog>
    </>
  );
}

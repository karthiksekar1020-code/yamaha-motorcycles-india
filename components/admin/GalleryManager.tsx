"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Replace, Trash2, UploadCloud } from "lucide-react";
import { api } from "@/lib/admin/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, StatusPill } from "./ui";

export interface GalleryItemData {
  id: string; caption: string; alt_text: string; motorcycle_id: string | null; sort_order: number; is_published: boolean;
  width: number; height: number; updated_at: string;
}
interface Model { id: string; name: string }

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_MB = 10;
const MAX_FILES = 10;

interface Picked { key: string; file: File; url: string; problem?: string }

/** fetch() cannot report upload progress, so uploads use XMLHttpRequest. The server still validates every file itself. */
function upload(form: FormData, onProgress: (pct: number) => void): Promise<{ status: number; body: { results?: { name: string; ok: boolean; id?: string; error?: string }[]; error?: { message: string } } }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/gallery");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { let body = {}; try { body = JSON.parse(xhr.responseText); } catch { /* keep empty */ } resolve({ status: xhr.status, body }); };
    xhr.onerror = () => resolve({ status: 0, body: { error: { message: "Couldn't reach the server. Check your connection and try again." } } });
    xhr.send(form);
  });
}

export function GalleryManager({ initial, models }: { initial: GalleryItemData[]; models: Model[] }) {
  const [items, setItems] = useState<GalleryItemData[]>(initial);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<Picked[]>([]);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [modelId, setModelId] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; details?: string[] } | null>(null);
  const [drag, setDrag] = useState(false);
  const [toDelete, setToDelete] = useState<GalleryItemData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => { urls.current.forEach(URL.revokeObjectURL); }, []);

  const addFiles = (list: FileList | File[]) => {
    const next: Picked[] = [];
    for (const file of Array.from(list)) {
      let problem: string | undefined;
      if (!OK_TYPES.includes(file.type)) problem = "Use a JPEG, PNG, WebP or AVIF image.";
      else if (file.size > MAX_MB * 1024 * 1024) problem = `Larger than ${MAX_MB} MB.`;
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      next.push({ key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`, file, url, problem });
    }
    setPicked((p) => [...p, ...next].slice(0, MAX_FILES));
    setMessage(null);
  };
  const removePicked = (key: string) => setPicked((p) => p.filter((x) => x.key !== key));

  const startUpload = async () => {
    const good = picked.filter((p) => !p.problem);
    if (good.length === 0) return;
    const form = new FormData();
    for (const p of good) form.append("files", p.file);
    form.append("caption", caption); form.append("altText", altText); if (modelId) form.append("motorcycleId", modelId);
    setProgress(0); setMessage(null);
    const { status, body } = await upload(form, setProgress);
    setProgress(null);
    const results = body.results ?? [];
    const failed = results.filter((r) => !r.ok);
    if (results.length === 0) { setMessage({ kind: "error", text: body.error?.message ?? (status === 401 || status === 403 ? "Your session has ended. Sign in again." : "The upload failed.") }); return; }
    const okCount = results.length - failed.length;
    setMessage({ kind: failed.length ? "error" : "ok", text: `${okCount} photo${okCount === 1 ? "" : "s"} added as drafts.${failed.length ? ` ${failed.length} could not be added:` : " Publish them when you are ready."}`, details: failed.map((f) => `${f.name}: ${f.error}`) });
    setPicked((p) => p.filter((x) => x.problem)); // keep only the ones the browser already rejected, so the reasons stay visible
    const fresh = await api<{ items: GalleryItemData[] }>("/api/admin/gallery");
    if (fresh.ok) setItems(fresh.data.items);
  };

  const patch = async (it: GalleryItemData, change: Record<string, unknown>, apply: Partial<GalleryItemData>) => {
    setBusyId(it.id); setRowError((e) => ({ ...e, [it.id]: "" }));
    const res = await api(`/api/admin/gallery/${it.id}`, { method: "PATCH", json: change });
    setBusyId(null);
    if (!res.ok) { setRowError((e) => ({ ...e, [it.id]: res.error.message })); return false; }
    setItems((list) => list.map((x) => (x.id === it.id ? { ...x, ...apply } : x)));
    return true;
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j]!, next[index]!];
    const prev = items;
    setItems(next.map((x, i) => ({ ...x, sort_order: (i + 1) * 10 })));
    const res = await api("/api/admin/gallery/reorder", { json: { ids: next.map((x) => x.id) } });
    if (!res.ok) { setItems(prev); setMessage({ kind: "error", text: res.error.message }); }
  };

  const replace = async (it: GalleryItemData, file: File) => {
    setBusyId(it.id); setRowError((e) => ({ ...e, [it.id]: "" }));
    const form = new FormData(); form.append("file", file);
    const res = await api(`/api/admin/gallery/${it.id}`, { method: "PUT", form });
    setBusyId(null);
    if (!res.ok) { setRowError((e) => ({ ...e, [it.id]: res.error.message })); return; }
    setVersions((v) => ({ ...v, [it.id]: (v[it.id] ?? 0) + 1 }));
    const fresh = await api<{ items: GalleryItemData[] }>("/api/admin/gallery");
    if (fresh.ok) setItems(fresh.data.items);
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    const res = await api(`/api/admin/gallery/${toDelete.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) { setRowError((e) => ({ ...e, [toDelete.id]: res.error.message })); setToDelete(null); return; }
    setItems((l) => l.filter((x) => x.id !== toDelete.id));
    setToDelete(null);
  };

  const good = picked.filter((p) => !p.problem).length;
  return (
    <div className="space-y-8">
      <section aria-labelledby="up-h" className="border border-line bg-surface p-5">
        <h2 id="up-h" className="display text-2xl">Upload photos</h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          className={`mt-4 grid place-items-center border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-blue-bright bg-blue/10" : "border-line"}`}
        >
          <UploadCloud size={32} className="text-blue-bright" aria-hidden />
          <p className="mt-2 text-sm">Drag photos here, or</p>
          <input ref={input} id="gallery-files" type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          <label htmlFor="gallery-files" className="btn btn-ghost btn-sm mt-3 cursor-pointer"><ImagePlus size={16} aria-hidden /> Choose photos</label>
          <p className="mt-3 text-xs text-muted">JPEG, PNG, WebP or AVIF · up to {MAX_MB} MB each · {MAX_FILES} at a time · at least 200 × 200 pixels. Photos are re-saved as WebP and start as drafts.</p>
        </div>

        {picked.length > 0 && (
          <>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {picked.map((p) => (
                <li key={p.key} className={`relative border ${p.problem ? "border-danger/60" : "border-line"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="aspect-[3/2] w-full object-cover" />
                  <button onClick={() => removePicked(p.key)} aria-label={`Remove ${p.file.name}`} className="absolute right-1 top-1 bg-black/70 px-2 py-0.5 text-xs">✕</button>
                  <p className="truncate px-2 pt-1 text-xs" title={p.file.name}>{p.file.name}</p>
                  {p.problem && <p role="alert" className="px-2 pb-1 text-xs text-danger">{p.problem}</p>}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label htmlFor="up-caption" className="micro mb-2 block">Caption (optional)</label><input id="up-caption" className="field" maxLength={200} value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
              <div><label htmlFor="up-alt" className="micro mb-2 block">Alt text (optional)</label><input id="up-alt" className="field" maxLength={300} value={altText} onChange={(e) => setAltText(e.target.value)} /></div>
              <div><label htmlFor="up-model" className="micro mb-2 block">Link to a model (optional)</label>
                <select id="up-model" className="field" value={modelId} onChange={(e) => setModelId(e.target.value)}><option value="">None</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button onClick={startUpload} disabled={progress !== null || good === 0} className="btn btn-sm">{progress !== null ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Uploading…</> : `Upload ${good} photo${good === 1 ? "" : "s"}`}</button>
              {progress !== null && (
                <div className="flex min-w-[200px] flex-1 items-center gap-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Upload progress">
                  <div className="h-2 flex-1 bg-line"><div className="h-full bg-blue-bright transition-[width]" style={{ width: `${progress}%` }} /></div>
                  <span className="num text-xs">{progress}%</span>
                </div>
              )}
            </div>
          </>
        )}
        {message && (
          <div role={message.kind === "error" ? "alert" : "status"} className={`mt-4 border p-3 text-sm ${message.kind === "error" ? "border-danger/60 bg-danger/10" : "border-emerald-400/50 bg-emerald-400/10"}`}>
            <p>{message.text}</p>
            {message.details && <ul className="mt-1 list-disc pl-5 text-xs">{message.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          </div>
        )}
      </section>

      <section aria-labelledby="lib-h">
        <h2 id="lib-h" className="display text-2xl">Your photos <span className="num text-base text-muted">({items.length})</span></h2>
        {items.length === 0 ? (
          <div className="mt-4"><EmptyState title="No uploaded photos yet">Photos you upload appear here. The built-in official photos on the website are not listed.</EmptyState></div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((it, i) => (
              <li key={it.id} className="flex flex-col border border-line bg-surface">
                <div className="relative aspect-[3/2] bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/admin/gallery/${it.id}/file?v=${versions[it.id] ?? 0}-${encodeURIComponent(it.updated_at)}`} alt={it.alt_text || it.caption || "Gallery photo"} className="h-full w-full object-contain" loading="lazy" />
                  <div className="absolute left-2 top-2"><StatusPill on={it.is_published} /></div>
                  {busyId === it.id && <div className="absolute inset-0 grid place-items-center bg-black/50"><Loader2 className="animate-spin" aria-label="Working" /></div>}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <CaptionFields it={it} models={models} onSave={(change, apply) => patch(it, change, apply)} />
                  {rowError[it.id] && <p role="alert" className="text-xs text-danger">{rowError[it.id]}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <button onClick={() => patch(it, { isPublished: !it.is_published }, { is_published: !it.is_published })} disabled={busyId === it.id} className="btn btn-sm">{it.is_published ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="btn btn-ghost btn-sm !px-3"><ArrowUp size={16} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later" className="btn btn-ghost btn-sm !px-3"><ArrowDown size={16} /></button>
                    <label className="btn btn-ghost btn-sm cursor-pointer !px-3" title="Replace the picture"><Replace size={16} aria-hidden /><span className="sr-only">Replace photo</span>
                      <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replace(it, f); e.target.value = ""; }} /></label>
                    <button onClick={() => setToDelete(it)} aria-label="Delete photo" className="btn btn-ghost btn-sm !px-3 text-danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog open={toDelete !== null} title="Delete this photo?" confirmLabel="Delete photo" busy={busyId === toDelete?.id} onConfirm={remove} onCancel={() => setToDelete(null)}>
        The picture is removed from the website and from storage. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

function CaptionFields({ it, models, onSave }: { it: GalleryItemData; models: Model[]; onSave: (change: Record<string, unknown>, apply: Partial<GalleryItemData>) => Promise<boolean> }) {
  const [caption, setCaption] = useState(it.caption);
  const [alt, setAlt] = useState(it.alt_text);
  const dirty = caption !== it.caption || alt !== it.alt_text;
  return (
    <div className="space-y-3">
      <div><label htmlFor={`cap-${it.id}`} className="micro mb-1 block">Caption</label><input id={`cap-${it.id}`} className="field !h-10" maxLength={200} value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
      <div><label htmlFor={`alt-${it.id}`} className="micro mb-1 block">Alt text</label><input id={`alt-${it.id}`} className="field !h-10" maxLength={300} value={alt} onChange={(e) => setAlt(e.target.value)} /></div>
      <div><label htmlFor={`mdl-${it.id}`} className="micro mb-1 block">Linked model</label>
        <select id={`mdl-${it.id}`} className="field !h-10" value={it.motorcycle_id ?? ""} onChange={(e) => void onSave({ motorcycleId: e.target.value || null }, { motorcycle_id: e.target.value || null })}>
          <option value="">None</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select></div>
      {dirty && <button onClick={() => void onSave({ caption, altText: alt }, { caption, alt_text: alt })} className="btn btn-ghost btn-sm">Save text</button>}
      <p className="text-xs text-muted">{it.width} × {it.height} px</p>
    </div>
  );
}

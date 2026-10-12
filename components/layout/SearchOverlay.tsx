"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type { Motorcycle } from "@/types/motorcycle";

/** Compact search panel that drops down under the header, leaving the page visible behind it. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Motorcycle[] | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); setFailed(false); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/motorcycles?q=${encodeURIComponent(q.trim())}&pageSize=6`, { signal: ctl.signal });
        if (!r.ok) throw new Error();
        setResults((await r.json()).items);
        setFailed(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      }
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  return (
    <ModalDialog
      open={open} onClose={onClose} label="Search motorcycles" backdrop="light"
      className="fixed bottom-auto left-1/2 top-[80px] h-fit w-[min(94vw,640px)] -translate-x-1/2"
    >
      <div className="border border-line bg-surface shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="micro">Search the lineup</span>
          <button onClick={onClose} aria-label="Close search" className="p-1.5 text-muted hover:text-fg"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onClose(); router.push(`/motorcycles?q=${encodeURIComponent(q.trim())}`); }} role="search" className="px-4 pb-3 pt-2">
          <label htmlFor="global-search" className="sr-only">Search motorcycles</label>
          <div className="flex items-center gap-3 border border-line bg-bg px-3 focus-within:border-blue-bright">
            <Search size={18} className="shrink-0 text-metal" aria-hidden />
            <input id="global-search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Model, category or engine class" autoComplete="off"
              className="h-12 w-full bg-transparent text-base text-fg outline-none focus-visible:!outline-none placeholder:text-metal/70" />
          </div>
        </form>
        <div aria-live="polite" className="max-h-[50vh] overflow-y-auto px-2 pb-2">
          {failed && <p className="px-2 pb-3 text-sm text-danger">Search is unavailable right now. Please try again.</p>}
          {results && results.length === 0 && <p className="px-2 pb-3 text-sm text-muted">No motorcycles match “{q}”.</p>}
          <ul>
            {results?.map((m) => (
              <li key={m.slug}>
                <Link href={`/motorcycles/${m.slug}`} onClick={onClose} className="flex items-baseline justify-between gap-3 px-2 py-3 hover:bg-blue/15">
                  <span className="display text-xl">{m.name}</span>
                  <span className="micro">{m.category}{m.engineCc ? ` · ${m.engineCc}cc` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalDialog>
  );
}

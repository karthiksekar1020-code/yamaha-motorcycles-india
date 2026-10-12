"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/client";

export interface RemovedPhoto { id: string; title: string; src: string; alt: string }

/** Built-in official photos the owner removed from the public gallery, each with a one-click restore. */
export function RestoreBuiltins({ items }: { items: RemovedPhoto[] }) {
  const router = useRouter();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const list = items.filter((i) => !gone.has(i.id));
  if (list.length === 0) return null;

  const restore = async (id: string) => {
    setBusy(id); setError("");
    const res = await api("/api/admin/gallery/hide", { method: "DELETE", json: { itemId: id } });
    setBusy(null);
    if (!res.ok) { setError(res.error.message); return; }
    setGone((g) => new Set(g).add(id));
    router.refresh();
  };

  return (
    <section aria-labelledby="removed-h" className="mb-8 border border-line bg-surface p-5">
      <h2 id="removed-h" className="display text-2xl">Removed built-in photos <span className="num text-base text-muted">({list.length})</span></h2>
      <p className="mt-1 text-sm text-muted">These official photos are hidden from the public gallery. Restore one to show it again.</p>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {list.map((p) => (
          <li key={p.id} className="border border-line">
            <div className="relative aspect-[3/2] bg-bg"><Image src={p.src} alt={p.alt} fill sizes="200px" className="object-contain p-2" /></div>
            <p className="truncate px-2 pt-2 text-xs" title={p.title}>{p.title}</p>
            <button onClick={() => restore(p.id)} disabled={busy === p.id} className="btn btn-ghost btn-sm m-2 disabled:opacity-60">{busy === p.id ? "Restoring…" : "Restore"}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "./CompareProvider";

export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const path = usePathname();
  if (items.length === 0 || path === "/compare") return null;
  const ready = items.length >= 2;
  return (
    <div role="region" aria-label="Comparison selection" className="fixed inset-x-0 bottom-0 z-40 border-t border-blue bg-surface/95 backdrop-blur">
      <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
        <ul className="flex flex-wrap items-center gap-2">
          {items.map((i) => (
            <li key={i.slug} className="flex items-center gap-1 border border-line px-3 py-1.5 text-sm">
              {i.name}
              <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.slug)} className="text-muted hover:text-fg"><X size={14} /></button>
            </li>
          ))}
          {!ready && <li className="text-xs text-muted">Select at least one more model to compare.</li>}
        </ul>
        <div className="flex gap-2">
          <button onClick={clear} className="btn btn-ghost btn-sm">Clear</button>
          <Link href={`/compare?m=${items.map((i) => i.slug).join(",")}`} aria-disabled={!ready} tabIndex={ready ? 0 : -1} className="btn btn-sm">Compare</Link>
        </div>
      </div>
    </div>
  );
}

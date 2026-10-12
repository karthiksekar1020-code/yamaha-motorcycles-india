"use client";
import { Check, Plus } from "lucide-react";
import { useCompare } from "./CompareProvider";
import { MAX_COMPARE } from "@/lib/utils/format";

export function CompareToggle({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { has, toggle, items } = useCompare();
  const on = has(slug);
  const full = !on && items.length >= MAX_COMPARE;
  return (
    <button
      type="button" aria-pressed={on} disabled={full}
      title={full ? `You can compare up to ${MAX_COMPARE} models. Remove one to add another.` : undefined}
      aria-label={on ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
      onClick={() => toggle({ slug, name })}
      className={`inline-flex items-center gap-1.5 border border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-[.12em] transition hover:border-blue-bright disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:border-blue-bright aria-pressed:bg-blue/25 ${className}`}
    >
      {on ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />}{on ? "Added" : "Compare"}
    </button>
  );
}

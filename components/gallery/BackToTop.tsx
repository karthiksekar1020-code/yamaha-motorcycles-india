"use client";
import { ArrowUp } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/utils/hooks";

export function BackToTop({ className = "btn btn-ghost" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  return (
    <button type="button" className={className} onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}>
      <ArrowUp size={16} /> Back to top
    </button>
  );
}

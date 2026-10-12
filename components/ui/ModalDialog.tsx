"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Accessible modal built on the native <dialog>: focus trap, Escape to close and focus
 * restoration to the opener come from the browser. Adds backdrop-click close and scroll lock.
 * `backdrop="light"` dims the page only slightly (for compact panels that should not hide the page).
 */
export function ModalDialog({ open, onClose, label, className = "", backdrop = "dark", children }: {
  open: boolean; onClose: () => void; label: string; className?: string; backdrop?: "dark" | "light"; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!open && d.open) d.close();
    if (!open) document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const bd = backdrop === "light" ? "backdrop:bg-black/35" : "backdrop:bg-black/70 backdrop:backdrop-blur-sm";
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-0 max-h-none max-w-none bg-transparent p-0 text-fg ${bd} ${className}`}
    >
      {open && children}
    </dialog>
  );
}

"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";

/**
 * Confirmation step for destructive actions. When `typeToConfirm` is given, the delete button stays disabled until
 * that exact text is typed (the server checks it again, so skipping this dialog cannot delete anything).
 */
export function ConfirmDialog({ open, title, children, confirmLabel, typeToConfirm, busy, error, onConfirm, onCancel }: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; typeToConfirm?: string; busy?: boolean; error?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (!open) setTyped(""); }, [open]);
  const ready = !typeToConfirm || typed === typeToConfirm;
  return (
    <ModalDialog open={open} onClose={onCancel} label={title} className="fixed left-1/2 top-1/2 h-fit w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2">
      <div className="border border-line bg-surface p-6 shadow-2xl shadow-black/60">
        <h2 className="display text-2xl">{title}</h2>
        <div className="mt-3 text-sm text-muted">{children}</div>
        {typeToConfirm && (
          <div className="mt-4">
            <label htmlFor="confirm-text" className="micro mb-2 block">Type <strong className="text-fg">{typeToConfirm}</strong> to confirm</label>
            <input id="confirm-text" className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
        )}
        {error && <p role="alert" className="mt-4 border border-danger/60 bg-danger/10 p-3 text-sm">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn btn-ghost btn-sm" disabled={busy}>Cancel</button>
          <button onClick={onConfirm} disabled={!ready || busy} className="btn btn-sm !bg-none !bg-danger">
            {busy ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./ConfirmDialog";
import { api } from "@/lib/admin/client";
import type { MotorcycleFormValues } from "@/lib/admin/schemas";

/** Edit / preview / publish-toggle / delete for one row of the motorcycle list. */
export function MotorcycleRowActions({ id, slug, name, published, values }: { id: string; slug: string; name: string; published: boolean; values: MotorcycleFormValues }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggle = async () => {
    setBusy(true); setError("");
    const res = await api(`/api/admin/motorcycles/${id}`, { method: "PUT", json: { ...values, isPublished: !published } });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    router.refresh();
  };
  const remove = async () => {
    setBusy(true); setError("");
    const res = await api(`/api/admin/motorcycles/${id}`, { method: "DELETE", json: { confirm: slug } });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    setConfirmDelete(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <Link href={`/admin/motorcycles/${id}`} className="underline hover:text-blue-bright">Edit</Link>
      <Link href={`/admin/motorcycles/${id}/preview`} target="_blank" className="underline hover:text-blue-bright">Preview</Link>
      <button onClick={toggle} disabled={busy} className="underline hover:text-blue-bright disabled:opacity-60">{published ? "Unpublish" : "Publish"}</button>
      <button onClick={() => setConfirmDelete(true)} disabled={busy} className="text-danger underline disabled:opacity-60">Delete</button>
      {error && <span role="alert" className="w-full text-xs text-danger">{error}</span>}
      <ConfirmDialog open={confirmDelete} title={`Delete ${name}?`} confirmLabel="Delete motorcycle" typeToConfirm={slug} busy={busy} error={error} onConfirm={remove} onCancel={() => { setConfirmDelete(false); setError(""); }}>
        This permanently removes the model{published ? " from the public website" : ""}. Photos linked to it stay in the gallery. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

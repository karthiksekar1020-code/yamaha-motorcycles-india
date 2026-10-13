import Link from "next/link";
import type { ReactNode } from "react";

export const PageHeader = ({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="micro">{eyebrow}</p>}
      <h1 className="display mt-1 text-3xl md:text-5xl">{title}</h1>
    </div>
    {children && <div className="flex flex-wrap gap-3">{children}</div>}
  </div>
);

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`border border-line bg-surface p-5 ${className}`}>{children}</div>
);

export const StatusPill = ({ on, onLabel = "Published", offLabel = "Draft" }: { on: boolean; onLabel?: string; offLabel?: string }) => (
  <span className={`status-pill inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[.12em] ${on ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-line text-muted"}`}>
    <span aria-hidden className={`status-dot h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-300 is-live" : "bg-metal"}`} />{on ? onLabel : offLabel}
  </span>
);

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="border border-dashed border-line p-10 text-center">
    <p className="display text-2xl">{title}</p>
    {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</div>}
  </div>
);

/** Previous/next pager driven by the URL, so it works without scripts and stays bookmarkable. */
export function Pager({ page, total, pageSize, href }: { page: number; total: number; pageSize: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="mt-4 text-xs text-muted">{total} {total === 1 ? "item" : "items"}</p>;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3 text-sm">
      <p className="text-xs text-muted">Page {page} of {pages} · {total} items</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className="btn btn-ghost btn-sm">Previous</Link> : <span className="btn btn-ghost btn-sm pointer-events-none opacity-40" aria-disabled>Previous</span>}
        {page < pages ? <Link href={href(page + 1)} className="btn btn-ghost btn-sm">Next</Link> : <span className="btn btn-ghost btn-sm pointer-events-none opacity-40" aria-disabled>Next</span>}
      </div>
    </nav>
  );
}

export const FieldError = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="mt-1 text-xs text-danger">{msg}</p> : null);

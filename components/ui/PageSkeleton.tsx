/**
 * Placeholder rendered by route-level loading.tsx files. It appears instantly on navigation (and is prefetched
 * with the link), so the page switches at once while the server finishes the real content.
 * Not used for routes that can respond 404: a loading boundary would stream a 200 status before notFound() runs.
 */
export function PageSkeleton() {
  return (
    <section className="container-x pb-16 pt-32" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-3 w-28 animate-pulse bg-line" />
      <div className="mt-4 h-12 w-2/3 max-w-xl animate-pulse bg-line" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse border border-line bg-surface" />)}
      </div>
    </section>
  );
}

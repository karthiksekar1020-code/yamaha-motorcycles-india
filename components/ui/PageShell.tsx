export function PageShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="container-x pb-8 pt-32">
      <p className="micro">{eyebrow}</p>
      <h1 className="display mt-2 text-4xl md:text-6xl">{title}</h1>
      <div className="mt-10 max-w-3xl space-y-5 leading-relaxed text-muted [&_a]:text-fg [&_a]:underline [&_h2]:display [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}

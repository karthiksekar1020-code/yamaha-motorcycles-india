import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-32">
      <p className="micro">Error 404</p>
      <h1 className="display mt-3 text-4xl md:text-6xl">Off the map.</h1>
      <p className="mt-4 max-w-md text-muted">That page doesn’t exist or the motorcycle record couldn’t be found.</p>
      <div className="mt-8 flex gap-3"><Link href="/" className="btn">Home</Link><Link href="/motorcycles" className="btn btn-ghost">Browse motorcycles</Link></div>
    </section>
  );
}

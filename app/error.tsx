"use client";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-32" role="alert">
      <p className="micro">Something went wrong</p>
      <h1 className="display mt-3 text-3xl md:text-5xl">We hit a bump.</h1>
      <p className="mt-4 max-w-md text-muted">
        {error.message === "CATALOGUE_UNAVAILABLE" ? "The motorcycle catalogue is temporarily unavailable." : "An unexpected error occurred."} Please try again.
      </p>
      <button onClick={reset} className="btn mt-8">Try again</button>
    </section>
  );
}

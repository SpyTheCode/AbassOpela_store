"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 sm:px-8 py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">
        A thread came loose
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-2">
        An unexpected error occurred. Please try again — if it keeps happening,
        contact the house.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-ink-3">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex justify-center">
        <button type="button" onClick={reset} className="btn btn-solid btn-sm">
          Try again
        </button>
      </div>
    </section>
  );
}

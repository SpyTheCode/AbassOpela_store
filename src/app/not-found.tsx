import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-5 sm:px-8 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl font-light tracking-tight">
        This piece has moved on
      </h1>
      <p className="mt-4 text-sm leading-7 text-ink-2">
        The page you are looking for is no longer here. Perhaps the look was
        retired, or the address was mistyped.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/" className="btn btn-solid btn-sm">
          Back home
        </Link>
        <Link href="/collections" className="btn btn-outline btn-sm">
          View collections
        </Link>
      </div>
    </section>
  );
}

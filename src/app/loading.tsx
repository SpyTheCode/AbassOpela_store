export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-24" role="status" aria-live="polite">
      <p className="eyebrow">Loading</p>
      <div className="mt-6 space-y-4">
        <div className="h-10 w-2/3 max-w-md animate-pulse bg-wash" />
        <div className="h-4 w-1/3 max-w-xs animate-pulse bg-wash" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-wash" />
          ))}
        </div>
      </div>
    </div>
  );
}

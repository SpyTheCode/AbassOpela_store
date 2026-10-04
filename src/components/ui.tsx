import Image from "next/image";
import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 md:pt-20 pb-10 md:pb-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl font-light leading-[1.05] tracking-tight">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-2xl text-base md:text-lg leading-7 md:leading-8 text-ink-2">
          {lede}
        </p>
      ) : null}
      {children}
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line-strong bg-card/60 px-6 py-16 text-center">
      <p className="font-display text-2xl text-ink-2">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-sm text-ink-3">{hint}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-3">
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5 animate-spin rounded-full border border-line-strong border-t-brass"
      />
      {label}
    </span>
  );
}

export type MediaRef = {
  id: string;
  kind: "image" | "video";
  file_name: string;
  alt: string;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
};

/** Renders an optimized <Image> or a <video> for user uploads. */
export function MediaView({
  media,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className = "",
  preload = false,
  controls = true,
  muted = true,
}: {
  media: MediaRef;
  sizes?: string;
  className?: string;
  preload?: boolean;
  controls?: boolean;
  muted?: boolean;
}) {
  if (media.kind === "video") {
    return (
      <video
        src={media.file_name}
        className={`bg-ink ${className}`}
        controls={controls}
        muted={muted}
        playsInline
        preload="metadata"
        aria-label={media.alt || "Customer video"}
      />
    );
  }
  return (
    <Image
      src={media.file_name}
      alt={media.alt || "Image"}
      width={media.width ?? 1200}
      height={media.height ?? 1600}
      blurDataURL={media.blur_data_url ?? undefined}
      placeholder={media.blur_data_url ? "blur" : "empty"}
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}

"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMedia } from "@/app/actions/admin";
import { formatBytes } from "@/lib/constants";

type Item = {
  id: string;
  file_name: string;
  kind: "image" | "video";
  byte_size: number;
  created_at: number;
  owner: string | null;
  alt: string;
};

export default function MediaLibrary({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });
  }

  return (
    <div>
      {error ? (
        <p className="notice notice-error mb-4" role="alert">{error}</p>
      ) : null}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <li key={m.id} className="border border-line bg-card">
            <div className="relative aspect-[4/5] bg-wash">
              {m.kind === "video" ? (
                <video
                  src={m.file_name}
                  className="h-full w-full object-cover bg-ink"
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={m.alt || "Video"}
                />
              ) : (
                <Image
                  src={m.file_name}
                  alt={m.alt || "Library image"}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                  unoptimized={/\.(heic|heif)$/i.test(m.file_name)}
                />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs text-ink-3">
                {m.owner ? m.owner : "Brand library"} · {formatBytes(m.byte_size)}
              </p>
              <button
                type="button"
                className="mt-2 text-xs uppercase tracking-[0.14em] text-danger link-underline disabled:opacity-50"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Remove this image from the library?")) {
                    run(() => deleteMedia(m.id));
                  }
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

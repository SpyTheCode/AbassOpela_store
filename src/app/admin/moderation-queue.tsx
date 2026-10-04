"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaView } from "@/components/ui";
import { decidePost, deletePostAsAdmin } from "@/app/actions/admin";

type Item = {
  id: string;
  caption: string;
  created_at: number;
  file_name: string;
  kind: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  author: string;
  email: string;
};

export default function ModerationQueue({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
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
      <ul className="space-y-6">
        {items.map((p) => (
          <li key={p.id} className="border border-line bg-card">
            <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
              <div className="w-full sm:w-[180px] h-[180px] overflow-hidden bg-wash">
                <MediaView
                  media={{
                    id: p.id,
                    kind: p.kind,
                    file_name: p.file_name,
                    alt: p.alt,
                    width: p.width,
                    height: p.height,
                    blur_data_url: p.blur,
                  }}
                  sizes="180px"
                  className="h-full w-full object-cover"
                  controls={false}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-ink-2">
                  <strong className="text-ink">{p.author}</strong>{" "}
                  <span className="text-ink-3">({p.email})</span>
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {p.caption || <em>No caption</em>}
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  {p.alt ? `Alt: ${p.alt} · ` : ""}
                  {new Date(p.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {rejecting === p.id ? (
                  <div className="mt-4">
                    <label htmlFor={`reason-${p.id}`} className="field-label">
                      Reason (shown to the customer)
                    </label>
                    <input
                      id={`reason-${p.id}`}
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Photo is out of focus"
                    />
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={pending}
                        onClick={() => {
                          run(() => decidePost(p.id, "rejected", reason));
                          setRejecting(null);
                          setReason("");
                        }}
                      >
                        Confirm rejection
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setRejecting(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn btn-brass btn-sm"
                      disabled={pending}
                      onClick={() => run(() => decidePost(p.id, "approved"))}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={pending}
                      onClick={() => setRejecting(p.id)}
                    >
                      Reject…
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm("Delete this upload and its file permanently?")) {
                          run(() => deletePostAsAdmin(p.id));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

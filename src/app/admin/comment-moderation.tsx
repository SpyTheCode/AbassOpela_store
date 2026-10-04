"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCommentStatus, deleteCommentAsAdmin } from "@/app/actions/admin";

type Item = {
  id: string;
  body: string;
  created_at: number;
  status: "visible" | "hidden";
  author: string;
  post_id: string;
  post_caption: string;
};

export default function CommentModeration({ items }: { items: Item[] }) {
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
      <ul className="divide-y divide-line border border-line bg-card">
        {items.map((c) => (
          <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${c.status === "hidden" ? "text-ink-3 line-through" : "text-ink-2"}`}>
                {c.body}
              </p>
              <p className="mt-1 text-xs text-ink-3">
                {c.author} · on{" "}
                <Link href={`/gallery/${c.post_id}`} className="link-underline">
                  {c.post_caption}
                </Link>{" "}
                · {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {c.status === "hidden" ? " · hidden" : ""}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              {c.status === "visible" ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pending}
                  onClick={() => run(() => setCommentStatus(c.id, "hidden"))}
                >
                  Hide
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pending}
                  onClick={() => run(() => setCommentStatus(c.id, "visible"))}
                >
                  Restore
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this comment permanently?")) {
                    run(() => deleteCommentAsAdmin(c.id));
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

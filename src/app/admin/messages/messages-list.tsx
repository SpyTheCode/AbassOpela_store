"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markMessageHandled, deleteMessage } from "@/app/actions/admin";

type Msg = {
  id: string;
  name: string;
  email: string;
  body: string;
  created_at: number;
  handled: number;
};

export default function MessagesList({ items }: { items: Msg[] }) {
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
      <ul className="space-y-4">
        {items.map((m) => (
          <li
            key={m.id}
            className={`border bg-card p-5 ${m.handled ? "border-line opacity-70" : "border-line-strong"}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <p className="text-sm">
                <strong className="text-ink">{m.name}</strong>{" "}
                <a href={`mailto:${m.email}`} className="link-underline text-ink-3">
                  {m.email}
                </a>
              </p>
              <p className="text-xs text-ink-3">
                {new Date(m.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {m.handled ? " · handled" : ""}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-2">{m.body}</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pending}
                onClick={() => run(() => markMessageHandled(m.id, !m.handled))}
              >
                {m.handled ? "Mark as new" : "Mark handled"}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this message?")) {
                    run(() => deleteMessage(m.id));
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

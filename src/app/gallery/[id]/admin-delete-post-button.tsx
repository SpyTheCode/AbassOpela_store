"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePostAsAdmin } from "@/app/actions/admin";

export default function AdminDeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function removePost() {
    if (!window.confirm("Delete this post and its uploaded media permanently?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePostAsAdmin(postId);
      if (!result.ok) {
        setError(result.error ?? "The post could not be deleted.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        className="btn btn-danger btn-sm"
        disabled={pending}
        onClick={removePost}
      >
        {pending ? "Deleting…" : "Delete this post"}
      </button>
      {error ? (
        <p className="notice notice-error mt-3" role="alert">{error}</p>
      ) : null}
    </div>
  );
}

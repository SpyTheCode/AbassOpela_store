"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addComment, type CommentActionState } from "@/app/actions/gallery";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid btn-sm" disabled={pending}>
      {pending ? "Posting…" : "Post comment"}
    </button>
  );
}

export default function CommentSection({
  postId,
  comments,
  signedIn,
}: {
  postId: string;
  comments: Array<{ id: string; body: string; created_at: number; author: string }>;
  signedIn: boolean;
}) {
  const [state, formAction] = useActionState<CommentActionState, FormData>(
    async (prev, formData) => addComment(prev, formData),
    { ok: false },
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the field after a successful post.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section aria-label="Comments" className="mt-10">
      <h2 className="font-display text-2xl font-light">
        Comments{" "}
        <span className="text-ink-3 text-lg">({comments.length})</span>
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">
          No comments yet — start the conversation.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-line pb-4">
              <p className="text-sm leading-6 text-ink-2">{c.body}</p>
              <p className="mt-1 text-xs text-ink-3">
                {c.author} ·{" "}
                {new Date(c.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        {signedIn ? (
          <form ref={formRef} action={formAction}>
            <input type="hidden" name="postId" value={postId} />
            <label htmlFor="comment-body" className="field-label">
              Add a comment
            </label>
            <textarea
              id="comment-body"
              name="body"
              required
              maxLength={1000}
              rows={3}
              placeholder="Say something kind…"
              className="input resize-y"
            />
            <div className="mt-3 flex items-center gap-4">
              <SubmitButton />
              {state.error ? (
                <p className="notice notice-error flex-1" role="alert">
                  {state.error}
                </p>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="text-sm text-ink-3">
            <a href="/signin" className="link-underline text-ink">
              Sign in
            </a>{" "}
            to join the conversation.
          </p>
        )}
      </div>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setSharedCustomerCredentials } from "@/app/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending}>
      {pending ? "Saving…" : "Save shared login"}
    </button>
  );
}

export default function SharedCustomerCredentialsForm({
  username,
  status,
  posts,
  comments,
}: {
  username: string;
  status: "active" | "suspended";
  posts: number;
  comments: number;
}) {
  const [state, formAction] = useActionState(setSharedCustomerCredentials, { ok: false });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-line bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-3">Access</p>
          <p className="mt-1 text-sm text-ink-2">{status === "active" ? "Login active" : "Not set up"}</p>
        </div>
        <div className="border border-line bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-3">Posts</p>
          <p className="mt-1 text-sm text-ink-2">{posts}</p>
        </div>
        <div className="border border-line bg-card p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-3">Comments</p>
          <p className="mt-1 text-sm text-ink-2">{comments}</p>
        </div>
      </div>

      <form action={formAction} className="border border-line bg-card p-5">
        {state.message ? (
          <p className="notice notice-ok mb-4" role="status">{state.message}</p>
        ) : null}
        {state.error ? (
          <p className="notice notice-error mb-4" role="alert">{state.error}</p>
        ) : null}

        <div>
          <label htmlFor="shared-username" className="field-label">Customer username</label>
          <input
            id="shared-username"
            name="username"
            required
            minLength={3}
            maxLength={40}
            defaultValue={username}
            autoComplete="off"
            className="input"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="shared-password" className="field-label">
            {username ? "New shared password" : "Shared password"}{" "}
            <span className="normal-case tracking-normal text-ink-3">(min 12 characters)</span>
          </label>
          <input
            id="shared-password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="input"
          />
          <p className="mt-2 text-xs leading-5 text-ink-3">
            For security, the current password cannot be viewed here. Choose a new one and share it with all customers.
          </p>
        </div>
        <div className="mt-5">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

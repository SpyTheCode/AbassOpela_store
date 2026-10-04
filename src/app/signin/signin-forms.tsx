"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { recoverAdmin, signIn } from "@/app/actions/auth";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function SignInForms() {
  const [recovering, setRecovering] = useState(false);
  const [signInState, signInAction] = useActionState(signIn, { ok: false });
  const [recoveryState, recoveryAction] = useActionState(recoverAdmin, { ok: false });

  return (
    <div className="mt-8">
      {recovering ? (
        <>
          <h1 className="font-display text-3xl font-light">Recover admin login</h1>
          <p className="mt-2 text-sm leading-6 text-ink-3">
            Enter the recovery name set by the admin, then choose a new admin username and password.
          </p>
          <form action={recoveryAction} className="mt-8 space-y-5">
            <div>
              <label htmlFor="recovery-answer" className="field-label">Admin recovery name</label>
              <input
                id="recovery-answer"
                name="recovery_answer"
                type="password"
                required
                autoComplete="off"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="recovery-username" className="field-label">New admin username</label>
              <input
                id="recovery-username"
                name="username"
                required
                minLength={3}
                maxLength={40}
                autoComplete="username"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="recovery-password" className="field-label">
                New admin password <span className="normal-case tracking-normal text-ink-3">(min 12 characters)</span>
              </label>
              <input
                id="recovery-password"
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className="input"
              />
            </div>
            {recoveryState.error ? (
              <p className="notice notice-error" role="alert">{recoveryState.error}</p>
            ) : null}
            {recoveryState.message ? (
              <p className="notice notice-ok" role="status">{recoveryState.message}</p>
            ) : null}
            <Submit label="Reset admin login" pendingLabel="Resetting…" />
          </form>
          <button
            type="button"
            onClick={() => setRecovering(false)}
            className="mt-5 link-underline text-sm text-ink-2"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-light">Welcome</h1>
          <p className="mt-2 text-sm leading-6 text-ink-3">
            Customers share one login provided by the house. Sign in to post a look and comment in the gallery.
          </p>
          <form action={signInAction} className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="field-label">Username</label>
              <input
                id="username"
                name="username"
                required
                autoComplete="username"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>
            {signInState.error ? (
              <p className="notice notice-error" role="alert">{signInState.error}</p>
            ) : null}
            <Submit label="Sign in" pendingLabel="Signing in…" />
          </form>
          <p className="mt-6 text-xs leading-5 text-ink-3">
            Need the customer login? Contact the house. Only the admin can change or reset shared customer credentials.
          </p>
          <button
            type="button"
            onClick={() => setRecovering(true)}
            className="mt-4 link-underline text-sm text-ink-2"
          >
            Admin locked out? Recover account
          </button>
        </>
      )}
    </div>
  );
}

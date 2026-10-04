"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { changeAdminCredentials } from "@/app/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending}>
      {pending ? "Updating…" : "Update admin login"}
    </button>
  );
}

export default function AdminCredentialsForm({
  username,
}: {
  username: string;
}) {
  const [state, formAction] = useActionState(changeAdminCredentials, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="border border-line bg-card p-5">
      {state.ok && state.message ? (
        <p className="notice notice-ok mb-4" role="status">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="notice notice-error mb-4" role="alert">{state.error}</p>
      ) : null}

      <div>
        <label htmlFor="admin-username" className="field-label">Admin username</label>
        <input
          id="admin-username"
          name="username"
          required
          minLength={3}
          maxLength={40}
          defaultValue={username}
          autoComplete="username"
          className="input"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="admin-current-password" className="field-label">Current password</label>
        <input
          id="admin-current-password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="admin-new-password" className="field-label">
          New password <span className="normal-case tracking-normal text-ink-3">(min 12 characters)</span>
        </label>
        <input
          id="admin-new-password"
          name="new_password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="input"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="admin-confirm-password" className="field-label">Confirm new password</label>
        <input
          id="admin-confirm-password"
          name="confirm_password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="input"
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-3">
        Updating your login signs out other admin sessions but keeps this session active.
      </p>
      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setAdminRecoveryAnswer } from "@/app/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending}>
      {pending ? "Saving…" : "Set permanent recovery name"}
    </button>
  );
}

export default function RecoveryForm({ configured }: { configured: boolean }) {
  const [state, formAction] = useActionState(setAdminRecoveryAnswer, { ok: false });

  if (configured) {
    return (
      <p className="notice notice-ok" role="status">
        Admin recovery name is set permanently. It cannot be viewed or changed here.
      </p>
    );
  }

  return (
    <form action={formAction} className="border border-line bg-card p-5">
      <p className="text-sm leading-6 text-ink-3">
        Set the admin&apos;s mother&apos;s full name once. It is stored as a password hash and cannot be changed later. Anyone who knows it can reset the admin login, so use a private answer.
      </p>
      {state.message ? (
        <p className="notice notice-ok mt-4" role="status">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="notice notice-error mt-4" role="alert">{state.error}</p>
      ) : null}
      <div className="mt-4">
        <label htmlFor="admin-recovery-answer" className="field-label">Mother&apos;s full name</label>
        <input
          id="admin-recovery-answer"
          name="recovery_answer"
          type="password"
          required
          minLength={3}
          maxLength={200}
          autoComplete="off"
          className="input"
        />
      </div>
      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}

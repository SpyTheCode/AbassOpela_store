"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendMessage } from "@/app/actions/contact";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending}>
      {pending ? "Sending…" : "Send note"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendMessage, { ok: false });

  return (
    <div className="border border-line bg-card p-6 md:p-10 self-start w-full">
      {state.ok ? (
        <div role="status" className="notice notice-ok">
          {state.message}
        </div>
      ) : null}
      <form action={formAction} className={state.ok ? "mt-6" : ""} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="field-label">Name</label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className="input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="mt-5">
          <label htmlFor="body" className="field-label">Your note</label>
          <textarea
            id="body"
            name="body"
            required
            rows={6}
            minLength={10}
            maxLength={2000}
            className="input resize-y"
            placeholder="Tell us about the piece, the occasion, or the fitting you have in mind…"
          />
        </div>
        {state.error ? (
          <p className="notice notice-error mt-5" role="alert">{state.error}</p>
        ) : null}
        <div className="mt-6">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

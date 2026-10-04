"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCollection } from "@/app/actions/admin";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid btn-sm" disabled={pending}>
      {pending ? "Creating…" : "Create collection"}
    </button>
  );
}

export default function NewCollectionForm() {
  const [state, formAction] = useActionState(saveCollection, { ok: false });

  return (
    <form action={formAction} className="border border-line bg-card p-5">
      {state.ok && state.message ? (
        <p className="notice notice-ok mb-4" role="status">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="notice notice-error mb-4" role="alert">{state.error}</p>
      ) : null}
      <input type="hidden" name="id" value="" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nc-title" className="field-label">Title</label>
          <input id="nc-title" name="title" required className="input" placeholder="e.g. Salt & Cedar" />
        </div>
        <div>
          <label htmlFor="nc-season" className="field-label">Season</label>
          <input id="nc-season" name="season" className="input" placeholder="e.g. Spring 2027" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="nc-description" className="field-label">Description</label>
        <textarea id="nc-description" name="description" rows={2} className="input resize-y" />
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" name="published" defaultChecked className="h-4 w-4 accent-[#a4762a]" />
        Published
      </label>
      <div className="mt-5">
        <Submit />
      </div>
    </form>
  );
}

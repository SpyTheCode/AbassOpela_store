"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSettings } from "@/app/actions/admin";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

export default function SettingsForm({
  values,
}: {
  values: Record<string, string>;
}) {
  const [state, formAction] = useActionState(saveSettings, { ok: false });

  return (
    <form action={formAction} className="border border-line bg-card p-5">
      {state.ok && state.message ? (
        <p className="notice notice-ok mb-4" role="status">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="notice notice-error mb-4" role="alert">{state.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="set-name" className="field-label">Brand name</label>
          <input id="set-name" name="brand_name" defaultValue={values.brand_name} className="input" />
        </div>
        <div>
          <label htmlFor="set-tagline" className="field-label">Tagline</label>
          <input id="set-tagline" name="brand_tagline" defaultValue={values.brand_tagline} className="input" />
        </div>
        <div>
          <label htmlFor="set-email" className="field-label">Contact email</label>
          <input id="set-email" name="contact_email" type="email" defaultValue={values.contact_email} className="input" />
        </div>
        <div>
          <label htmlFor="set-location" className="field-label">Location line</label>
          <input id="set-location" name="contact_location" defaultValue={values.contact_location} className="input" />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="set-logo" className="field-label">
          Replace logo <span className="normal-case tracking-normal text-ink-3">(JPEG, PNG, WebP or SVG · max 2 MB)</span>
        </label>
        <input
          id="set-logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="block w-full text-sm text-ink-2 file:mr-3 file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-[0.14em]"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="set-intro" className="field-label">About — intro line</label>
        <input id="set-intro" name="about_intro" defaultValue={values.about_intro} className="input" />
      </div>
      <div className="mt-4">
        <label htmlFor="set-body" className="field-label">
          About — body <span className="normal-case tracking-normal text-ink-3">(blank line = new paragraph)</span>
        </label>
        <textarea id="set-body" name="about_body" defaultValue={values.about_body} rows={6} className="input resize-y" />
      </div>
      <div className="mt-4">
        <label htmlFor="set-blurb" className="field-label">Contact page note</label>
        <textarea id="set-blurb" name="contact_blurb" defaultValue={values.contact_blurb} rows={2} className="input resize-y" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="set-ig" className="field-label">Instagram URL</label>
          <input id="set-ig" name="instagram" defaultValue={values.instagram} className="input" />
        </div>
        <div>
          <label htmlFor="set-pin" className="field-label">Pinterest URL</label>
          <input id="set-pin" name="pinterest" defaultValue={values.pinterest} className="input" />
        </div>
      </div>

      <div className="mt-6">
        <Submit />
      </div>
    </form>
  );
}

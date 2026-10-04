"use server";

import { db, ensureSeeded, now, randomId } from "@/lib/db";
import { cleanMultiline, cleanText, isEmail, MAX_MESSAGE_LENGTH } from "@/lib/validate";

export type ContactActionState = { ok: boolean; error?: string; message?: string };

export async function sendMessage(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  ensureSeeded();
  const name = cleanText(formData.get("name"), 120);
  const email = cleanText(formData.get("email"), 200);
  const body = cleanMultiline(formData.get("body"), MAX_MESSAGE_LENGTH);

  if (!name) return { ok: false, error: "Please tell us your name." };
  if (!isEmail(email)) return { ok: false, error: "Please enter a valid email address." };
  if (body.length < 10) {
    return { ok: false, error: "Please write a little more (at least 10 characters)." };
  }

  db.prepare(
    "INSERT INTO messages (id, name, email, body, created_at) VALUES (?,?,?,?,?)",
  ).run(randomId(), name, email, body, now());

  return {
    ok: true,
    message: "Thank you — your note is with the house. We reply personally.",
  };
}

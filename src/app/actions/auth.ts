"use server";

import { redirect } from "next/navigation";
import { db, ensureSeeded, getSetting, now, setSetting } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { createSession, destroySession, revokeUserSessions } from "@/lib/sessions";
import { cleanText } from "@/lib/validate";

export type AuthActionState = { ok: boolean; error?: string; message?: string };

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,40}$/;

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await ensureSeeded();
  const username = cleanText(formData.get("username"), 40);
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { ok: false, error: "Enter your username and password." };
  }

  const user = db
    .prepare("SELECT id, password_hash, status, role FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as
    | { id: string; password_hash: string; status: string; role: string }
    | undefined;

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, error: "That username and password combination is not right." };
  }
  if (user.status === "suspended") {
    return { ok: false, error: "This account is not currently available. Please contact the house." };
  }

  await createSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/account");
}

export async function recoverAdmin(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await ensureSeeded();

  const lockedUntil = Number(getSetting("admin_recovery_locked_until") ?? "0");
  if (lockedUntil > now()) {
    return { ok: false, error: "Too many attempts. Please try account recovery again in 15 minutes." };
  }

  const storedAnswer = getSetting("admin_recovery_hash");
  const recoveryAnswer = cleanText(formData.get("recovery_answer"), 200).toLocaleLowerCase();
  const username = cleanText(formData.get("username"), 40);
  const password = String(formData.get("password") ?? "");

  if (!storedAnswer) {
    return {
      ok: false,
      error: "Admin recovery has not been set up. Please contact the site administrator.",
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Choose a username with 3–40 letters, numbers, dots, underscores or hyphens." };
  }
  if (password.length < 12) {
    return { ok: false, error: "Choose a password with at least 12 characters." };
  }

  const admin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1")
    .get() as { id: string } | undefined;
  if (!admin) throw new Error("Admin recovery cannot continue: no administrator account exists.");

  const collision = db
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id <> ?")
    .get(username, admin.id);
  const answerIsValid = await verifyPassword(recoveryAnswer, storedAnswer);
  if (!answerIsValid || collision) {
    const failures = Number(getSetting("admin_recovery_failures") ?? "0") + 1;
    setSetting("admin_recovery_failures", String(failures));
    if (failures >= 5) {
      setSetting("admin_recovery_failures", "0");
      setSetting("admin_recovery_locked_until", String(now() + 15 * 60 * 1000));
    }
    return {
      ok: false,
      error: "Those recovery details could not be confirmed. Check them and try again.",
    };
  }

  db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE id = ?").run(
    username,
    await hashPassword(password),
    admin.id,
  );
  revokeUserSessions(admin.id);
  setSetting("admin_recovery_failures", "0");
  setSetting("admin_recovery_locked_until", "0");

  return { ok: true, message: "Admin login reset. Sign in with your new credentials." };
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}

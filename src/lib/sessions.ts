import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db, now, type DbUser } from "./db";

/**
 * Opaque session tokens stored server-side; the browser only holds a random
 * token in an http-only cookie. Sessions last 30 days, sliding expiry.
 */

const COOKIE = "abass_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<void> {
  // The token itself is the session lookup key — 64 hex chars of entropy.
  const token = randomBytes(32).toString("hex");
  const t = now();
  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?,?,?,?)",
  ).run(token, userId, t + SESSION_TTL_MS, t);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  // Opportunistic cleanup of expired sessions.
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(t);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
  }
  jar.delete(COOKIE);
}

/** Delete every session belonging to a user (e.g. after suspension). */
export function revokeUserSessions(userId: string): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

/** Keep the current session active while invalidating older sessions. */
export async function revokeOtherUserSessions(userId: string): Promise<void> {
  const jar = await cookies();
  const currentToken = jar.get(COOKIE)?.value;
  if (currentToken) {
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").run(userId, currentToken);
  } else {
    revokeUserSessions(userId);
  }
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "customer" | "admin";
  status: "active" | "suspended";
  created_at: number;
};

/** Returns the signed-in user, or null. Suspended users are signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.status, u.created_at, u.username, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(token) as
    | (DbUser & { expires_at: number })
    | undefined;

  if (!row) return null;

  const t = now();
  if (row.expires_at < t) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }
  if (row.status === "suspended") {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }

  // Slide the expiry forward (at most once a day) to keep active users signed in.
  if (row.expires_at - t < SESSION_TTL_MS - 24 * 60 * 60 * 1000) {
    db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(
      t + SESSION_TTL_MS,
      token,
    );
  }

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

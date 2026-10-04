"use server";

import { revalidatePath } from "next/cache";
import { db, getSetting, now, randomId, setSetting } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { revokeOtherUserSessions, revokeUserSessions, requireAdmin } from "@/lib/sessions";
import { cleanMultiline, cleanText, slugify } from "@/lib/validate";
import fs from "node:fs";
import path from "node:path";

export type AdminState = { ok: boolean; error?: string; message?: string };

export async function changeAdminCredentials(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const currentPassword = String(formData.get("current_password") ?? "");
  const username = cleanText(formData.get("username"), 40);
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return { ok: false, error: "Username must be 3–40 letters, numbers, dots, underscores or hyphens." };
  }
  if (newPassword.length < 12) {
    return { ok: false, error: "Choose a new password with at least 12 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "The new passwords do not match." };
  }

  const account = db
    .prepare("SELECT password_hash FROM users WHERE id = ? AND role = 'admin'")
    .get(admin.id) as { password_hash: string } | undefined;
  if (!account) throw new Error("Administrator account is missing.");
  if (!(await verifyPassword(currentPassword, account.password_hash))) {
    return { ok: false, error: "The current password is not correct." };
  }

  const collision = db
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id <> ?")
    .get(username, admin.id);
  if (collision) return { ok: false, error: "That username is already assigned to the shared customer account." };

  db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE id = ?").run(
    username,
    await hashPassword(newPassword),
    admin.id,
  );
  await revokeOtherUserSessions(admin.id);
  revalidatePath("/admin/settings");
  revalidatePath("/signin");
  return { ok: true, message: "Admin login updated. This session stays signed in; other admin sessions have been signed out." };
}

function okResult(message: string): AdminState {
  revalidatePath("/admin");
  revalidatePath("/gallery");
  revalidatePath("/collections");
  revalidatePath("/");
  return { ok: true, message };
}

/* ------------------------------------------------------------- moderation */

export async function decidePost(
  postId: string,
  decision: "approved" | "rejected",
  reason = "",
): Promise<AdminState> {
  const admin = await requireAdmin();
  db.prepare(
    "UPDATE posts SET status = ?, reject_reason = ?, decided_at = ?, decided_by = ? WHERE id = ?",
  ).run(decision, decision === "rejected" ? reason : "", now(), admin.id, postId);
  revalidatePath("/admin");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true, message: `Post ${decision}.` };
}

export async function deletePostAsAdmin(postId: string): Promise<AdminState> {
  await requireAdmin();
  const post = db
    .prepare("SELECT media_id FROM posts WHERE id = ?")
    .get(postId) as { media_id: string } | undefined;
  if (!post) return { ok: false, error: "Post not found." };

  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);

  // If nothing else references the media (no collection usage), remove it and its bytes.
  const inCollection = db
    .prepare("SELECT 1 FROM collection_items WHERE media_id = ?")
    .get(post.media_id);
  const ownerStillHasIt = db
    .prepare("SELECT 1 FROM media WHERE id = ? AND owner_id IS NULL")
    .get(post.media_id);
  if (!inCollection && !ownerStillHasIt) {
    const m = db
      .prepare("SELECT file_name FROM media WHERE id = ?")
      .get(post.media_id) as { file_name: string } | undefined;
    db.prepare("DELETE FROM media WHERE id = ?").run(post.media_id);
    if (m?.file_name.startsWith("/media/")) {
      try {
        fs.rmSync(path.join(process.cwd(), "data", "media", path.basename(m.file_name)), { force: true });
      } catch {
        /* best effort */
      }
    }
  }
  return okResult("Post deleted.");
}

export async function setCommentStatus(commentId: string, status: "visible" | "hidden"): Promise<AdminState> {
  await requireAdmin();
  db.prepare("UPDATE comments SET status = ? WHERE id = ?").run(status, commentId);
  return okResult(`Comment ${status === "hidden" ? "hidden" : "restored"}.`);
}

export async function deleteCommentAsAdmin(commentId: string): Promise<AdminState> {
  await requireAdmin();
  db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
  return okResult("Comment deleted.");
}

/* -------------------------------------------------------------- customers */

export async function setSharedCustomerCredentials(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const username = cleanText(formData.get("username"), 40);
  const password = String(formData.get("password") ?? "");

  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return { ok: false, error: "Username must be 3–40 letters, numbers, dots, underscores or hyphens." };
  }
  if (password.length < 12) {
    return { ok: false, error: "Choose a password with at least 12 characters." };
  }

  const customer = db
    .prepare("SELECT id FROM users WHERE role = 'customer' LIMIT 1")
    .get() as { id: string } | undefined;
  if (!customer) throw new Error("Shared customer account is missing; database migration did not complete.");

  const collision = db
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id <> ?")
    .get(username, customer.id);
  if (collision) return { ok: false, error: "That username is already assigned to the admin account." };

  db.prepare(
    "UPDATE users SET username = ?, password_hash = ?, status = 'active' WHERE id = ?",
  ).run(username, await hashPassword(password), customer.id);
  revokeUserSessions(customer.id);
  setSetting("shared_customer_default_credentials_active", "0");
  revalidatePath("/admin/customers");
  revalidatePath("/signin");
  return { ok: true, message: "Shared customer login saved. All customers must now use these credentials." };
}

export async function setAdminRecoveryAnswer(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  if (getSetting("admin_recovery_hash")) {
    return { ok: false, error: "The admin recovery name has already been set and cannot be changed." };
  }

  const answer = cleanText(formData.get("recovery_answer"), 200).toLocaleLowerCase();
  if (answer.length < 3) {
    return { ok: false, error: "Enter the admin's mother's full name (at least 3 characters)." };
  }

  const inserted = db
    .prepare(
      "INSERT INTO settings (key, value) VALUES ('admin_recovery_hash', ?) ON CONFLICT(key) DO NOTHING",
    )
    .run(await hashPassword(answer));
  if (!inserted.changes) {
    return { ok: false, error: "The admin recovery name has already been set and cannot be changed." };
  }
  revalidatePath("/admin/settings");
  return { ok: true, message: "Admin recovery name saved permanently." };
}

/* ------------------------------------------------------------ collections */

export async function saveCollection(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = cleanText(formData.get("title"), 120);
  const season = cleanText(formData.get("season"), 60);
  const description = cleanMultiline(formData.get("description"), 600);
  const coverMediaId = String(formData.get("cover") ?? "");
  const published = formData.get("published") === "on" || formData.get("published") === "true";
  const mediaIds = formData
    .getAll("looks")
    .map((v) => String(v))
    .filter((v) => /^[a-z0-9]+$/i.test(v));

  if (!title) return { ok: false, error: "A title is required." };

  const t = now();
  let collectionId = id;

  if (collectionId) {
    db.prepare(
      "UPDATE collections SET title = ?, season = ?, description = ?, published = ?, updated_at = ? WHERE id = ?",
    ).run(title, season, description, published ? 1 : 0, t, collectionId);
  } else {
    collectionId = "col_" + randomId();
    let slug = slugify(title) || "collection";
    const clash = db.prepare("SELECT 1 FROM collections WHERE slug = ?").get(slug);
    if (clash) slug = `${slug}-${randomId().slice(0, 4)}`;
    db.prepare(
      "INSERT INTO collections (id, slug, title, season, description, cover_media_id, published, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,(SELECT COALESCE(MAX(position),0)+1 FROM collections),?,?)",
    ).run(collectionId, slug, title, season, description, null, published ? 1 : 0, t, t);
  }

  if (/^[a-z0-9]+$/i.test(coverMediaId)) {
    db.prepare("UPDATE collections SET cover_media_id = ? WHERE id = ?").run(coverMediaId, collectionId);
  }

  if (formData.has("looksSubmitted")) {
    db.prepare("DELETE FROM collection_items WHERE collection_id = ?").run(collectionId);
    const insert = db.prepare(
      "INSERT OR IGNORE INTO collection_items (collection_id, media_id, position) VALUES (?,?,?)",
    );
    mediaIds.forEach((mid, i) => insert.run(collectionId, mid, i));
    if (!/^[a-z0-9]+$/i.test(coverMediaId) && mediaIds.length > 0) {
      db.prepare("UPDATE collections SET cover_media_id = ? WHERE id = ?").run(mediaIds[0], collectionId);
    }
  }

  return okResult(`Collection “${title}” saved.`);
}

export async function deleteCollection(collectionId: string): Promise<AdminState> {
  await requireAdmin();
  db.prepare("DELETE FROM collections WHERE id = ?").run(collectionId);
  return okResult("Collection removed. Its images remain in the library.");
}

/* ---------------------------------------------------------------- settings */

export async function saveSettings(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const str = (k: string, max = 300) => cleanMultiline(formData.get(k), max);

  setSetting("brand_name", str("brand_name", 80) || "Abass Opela");
  setSetting("brand_tagline", str("brand_tagline", 120));
  setSetting("contact_email", str("contact_email", 200));
  setSetting("contact_location", str("contact_location", 120));
  setSetting("about_intro", str("about_intro", 400));
  setSetting("about_body", cleanMultiline(formData.get("about_body"), 4000));
  setSetting("contact_blurb", cleanMultiline(formData.get("contact_blurb"), 600));
  setSetting("instagram", str("instagram", 200));
  setSetting("pinterest", str("pinterest", 200));

  // Optional logo upload (multipart file input)
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return { ok: false, error: "Logo must be a JPEG, PNG, WebP or SVG file." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, error: "Logo must be under 2 MB." };
    }
    const ext = file.type === "image/svg+xml" ? ".svg" : file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    const id = "logo_" + randomId();
    const dir = path.join(process.cwd(), "data", "media");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, id + ext), Buffer.from(await file.arrayBuffer()));
    setSetting("logo_src", "/api/media/" + id + ext);
  }

  return okResult("Settings saved.");
}

/* --------------------------------------------------------------- messages */

export async function markMessageHandled(messageId: string, handled: boolean): Promise<AdminState> {
  await requireAdmin();
  db.prepare("UPDATE messages SET handled = ? WHERE id = ?").run(handled ? 1 : 0, messageId);
  return okResult(handled ? "Marked as handled." : "Marked as new.");
}

export async function deleteMessage(messageId: string): Promise<AdminState> {
  await requireAdmin();
  db.prepare("DELETE FROM messages WHERE id = ?").run(messageId);
  return okResult("Message deleted.");
}

/* -------------------------------------------------------- media library */

export async function deleteMedia(mediaId: string): Promise<AdminState> {
  await requireAdmin();
  const usedInCollection = db
    .prepare("SELECT 1 FROM collection_items WHERE media_id = ?")
    .get(mediaId);
  const usedInPost = db.prepare("SELECT 1 FROM posts WHERE media_id = ?").get(mediaId);
  const isCover = db
    .prepare("SELECT 1 FROM collections WHERE cover_media_id = ?")
    .get(mediaId);
  if (usedInCollection || usedInPost || isCover) {
    return { ok: false, error: "That image is still used by a collection or a gallery post." };
  }

  const m = db
    .prepare("SELECT file_name FROM media WHERE id = ?")
    .get(mediaId) as { file_name: string } | undefined;
  if (!m) return { ok: false, error: "Image not found." };

  db.prepare("DELETE FROM media WHERE id = ?").run(mediaId);
  if (m.file_name.startsWith("/media/")) {
    try {
      fs.rmSync(path.join(process.cwd(), "data", "media", path.basename(m.file_name)), { force: true });
    } catch {
      /* best effort */
    }
  }
  return okResult("Image removed from the library.");
}

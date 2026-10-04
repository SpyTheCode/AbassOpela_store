"use server";

import { revalidatePath } from "next/cache";
import { db, now, randomId } from "@/lib/db";
import { getSessionUser } from "@/lib/sessions";
import { cleanMultiline, MAX_COMMENT_LENGTH } from "@/lib/validate";

export type CommentActionState = { ok: boolean; error?: string; message?: string };

export async function addComment(
  _prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to comment." };

  const postId = String(formData.get("postId") ?? "");
  const body = cleanMultiline(formData.get("body"), MAX_COMMENT_LENGTH);
  if (!body) return { ok: false, error: "Write a comment first." };

  const post = db
    .prepare("SELECT id, status FROM posts WHERE id = ?")
    .get(postId) as { id: string; status: string } | undefined;
  if (!post || post.status !== "approved") {
    return { ok: false, error: "This post is not open for comments." };
  }

  db.prepare(
    "INSERT INTO comments (id, post_id, author_id, body, status, created_at) VALUES (?,?,?,?, 'visible', ?)",
  ).run(randomId(), postId, user.id, body, now());

  revalidatePath(`/gallery/${postId}`);
  revalidatePath("/gallery");
  return { ok: true, message: "Comment posted." };
}

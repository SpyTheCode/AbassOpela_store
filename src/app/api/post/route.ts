import { NextRequest, NextResponse } from "next/server";
import { db, ensureSeeded, now, randomId } from "@/lib/db";
import { getSessionUser } from "@/lib/sessions";
import { MAX_CAPTION_LENGTH } from "@/lib/validate";

export const runtime = "nodejs";

/** POST /api/post — create a (pending) gallery post from an uploaded media id. */
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { mediaId?: string; caption?: string };
  try {
    body = (await req.json()) as { mediaId?: string; caption?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mediaId = String(body.mediaId ?? "");
  const caption = String(body.caption ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CAPTION_LENGTH);

  if (!/^[a-z0-9]+$/i.test(mediaId)) {
    return NextResponse.json({ error: "Invalid media reference." }, { status: 400 });
  }

  const media = db
    .prepare("SELECT id, owner_id FROM media WHERE id = ?")
    .get(mediaId) as { id: string; owner_id: string | null } | undefined;
  if (!media) {
    return NextResponse.json({ error: "That upload no longer exists. Try again." }, { status: 404 });
  }
  if (media.owner_id !== user.id) {
    return NextResponse.json(
      { error: "You can only publish your own uploads." },
      { status: 403 },
    );
  }

  const alreadyUsed = db
    .prepare("SELECT id FROM posts WHERE media_id = ?")
    .get(mediaId) as { id: string } | undefined;
  if (alreadyUsed) {
    return NextResponse.json(
      { error: "This upload is already a gallery post." },
      { status: 409 },
    );
  }

  const id = randomId();
  db.prepare(
    "INSERT INTO posts (id, author_id, media_id, caption, status, created_at) VALUES (?,?,?,?, 'pending', ?)",
  ).run(id, user.id, mediaId, caption, now());

  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}

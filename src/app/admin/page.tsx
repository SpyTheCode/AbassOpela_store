import { db, ensureSeeded } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import ModerationQueue from "./moderation-queue";
import CommentModeration from "./comment-moderation";
import MediaLibrary from "./media-library";

export const dynamic = "force-dynamic";

type PendingPost = {
  id: string;
  caption: string;
  created_at: number;
  file_name: string;
  kind: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  author: string;
  email: string;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: number;
  status: "visible" | "hidden";
  author: string;
  post_id: string;
  post_caption: string;
};

type MediaRow = {
  id: string;
  file_name: string;
  kind: "image" | "video";
  byte_size: number;
  created_at: number;
  owner: string | null;
  alt: string;
};

export default function AdminModerationPage() {
  ensureSeeded();

  const pending = db
    .prepare(
      `SELECT p.id, p.caption, p.created_at, m.file_name, m.kind, m.alt, m.width, m.height, m.blur_data_url AS blur,
              u.name AS author, u.email
       FROM posts p JOIN media m ON m.id = p.media_id JOIN users u ON u.id = p.author_id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`,
    )
    .all()
    .map((row) => ({ ...row })) as PendingPost[];

  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.status, u.name AS author,
              p.id AS post_id, COALESCE(NULLIF(p.caption, ''), 'a look') AS post_caption
       FROM comments c
       JOIN users u ON u.id = c.author_id
       JOIN posts p ON p.id = c.post_id
       ORDER BY c.created_at DESC
       LIMIT 30`,
    )
    .all()
    .map((row) => ({ ...row })) as CommentRow[];

  const media = db
    .prepare(
      `SELECT m.id, m.file_name, m.kind, m.byte_size, m.created_at, m.alt, u.name AS owner
       FROM media m LEFT JOIN users u ON u.id = m.owner_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 60`,
    )
    .all()
    .map((row) => ({ ...row })) as MediaRow[];

  return (
    <div className="space-y-16">
      <section aria-labelledby="queue-title">
        <h2 id="queue-title" className="font-display text-2xl font-light">
          Awaiting review{" "}
          <span className="text-ink-3 text-lg">
            ({pending.length})
          </span>
        </h2>
        <p className="mt-1 text-sm text-ink-3">
          Customer uploads become public only after you approve them here.
        </p>
        <div className="mt-6">
          {pending.length === 0 ? (
            <EmptyState title="Queue is clear" hint="New customer uploads will appear here." />
          ) : (
            <ModerationQueue items={pending} />
          )}
        </div>
      </section>

      <section aria-labelledby="comments-title">
        <h2 id="comments-title" className="font-display text-2xl font-light">
          Recent comments
        </h2>
        <p className="mt-1 text-sm text-ink-3">
          Hide or delete anything unkind. Hidden comments stay visible to you only.
        </p>
        <div className="mt-6">
          {comments.length === 0 ? (
            <EmptyState title="No comments yet" />
          ) : (
            <CommentModeration items={comments} />
          )}
        </div>
      </section>

      <section aria-labelledby="media-title">
        <h2 id="media-title" className="font-display text-2xl font-light">
          Media library
        </h2>
        <p className="mt-1 text-sm text-ink-3">
          Every image and upload on the site. Seeded brand photography can be
          removed here too.
        </p>
        <div className="mt-6">
          {media.length === 0 ? (
            <EmptyState title="No media yet" />
          ) : (
            <MediaLibrary items={media} />
          )}
        </div>
      </section>
    </div>
  );
}

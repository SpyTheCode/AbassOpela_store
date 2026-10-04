import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, ensureSeeded } from "@/lib/db";
import { getSessionUser } from "@/lib/sessions";
import { MediaView } from "@/components/ui";
import CommentSection from "@/components/comment-section";
import AdminDeletePostButton from "./admin-delete-post-button";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  caption: string;
  status: string;
  created_at: number;
  file_name: string;
  kind: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  author: string;
  author_id: string;
};

async function getPost(id: string) {
  ensureSeeded();
  const row = db
    .prepare(
      `SELECT p.id, p.caption, p.status, p.created_at,
              m.file_name, m.kind, m.alt, m.width, m.height, m.blur_data_url AS blur,
              u.name AS author, u.id AS author_id
       FROM posts p
       JOIN media m ON m.id = p.media_id
       JOIN users u ON u.id = p.author_id
       WHERE p.id = ?`,
    )
    .get(id) as Post | undefined;
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.status !== "approved") return { title: "Post not found" };
  const title = post.caption
    ? `“${post.caption.slice(0, 60)}” by ${post.author}`
    : `A look by ${post.author}`;
  return {
    title,
    description: post.caption || `A look shared in the ${"Abass Opela"} customer gallery.`,
    alternates: { canonical: `/gallery/${post.id}` },
  };
}

export default async function GalleryPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  const user = await getSessionUser();

  // Only approved posts are public; authors and admins can preview others.
  if (!post) notFound();
  const canSee =
    post.status === "approved" ||
    (user && (user.role === "admin" || user.id === post.author_id));
  if (!canSee) notFound();

  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.name AS author, c.author_id
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ? AND c.status = 'visible'
       ORDER BY c.created_at ASC`,
    )
    .all(post.id)
    .map((row) => ({ ...row })) as Array<{
      id: string;
      body: string;
      created_at: number;
      author: string;
      author_id: string;
    }>;

  const jsonLd =
    post.status === "approved"
      ? {
          "@context": "https://schema.org",
          "@type": "SocialMediaPosting",
          headline: post.caption || `A look by ${post.author}`,
          datePublished: new Date(post.created_at).toISOString(),
          author: { "@type": "Person", name: post.author },
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: comments.length,
          },
        }
      : null;

  return (
    <article className="mx-auto max-w-5xl px-5 sm:px-8 pt-10 md:pt-14 pb-20">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.16em] text-ink-3">
        <Link href="/gallery" className="link-underline hover:text-ink">
          ← Customer gallery
        </Link>
      </nav>

      {post.status !== "approved" ? (
        <p className="notice notice-error mt-6" role="status">
          This post is <strong>{post.status}</strong> and is only visible to you
          {user?.role === "admin" ? " and the studio" : ""} until it is approved.
        </p>
      ) : null}

      <div className="mt-6 md:mt-8">
        <MediaView
          media={{
            id: post.id,
            kind: post.kind,
            file_name: post.file_name,
            alt: post.alt,
            width: post.width,
            height: post.height,
            blur_data_url: post.blur,
          }}
          sizes="(min-width: 1024px) 896px, 100vw"
          preload
        />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.6fr_1fr]">
        <div>
          {post.caption ? (
            <p className="font-display text-2xl md:text-3xl font-light leading-snug">
              {post.caption}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-ink-3">
            {post.author} ·{" "}
            {new Date(post.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {user?.role === "admin" ? (
            <AdminDeletePostButton postId={post.id} />
          ) : null}

          <CommentSection postId={post.id} comments={comments} signedIn={!!user} />
        </div>

        <aside className="text-sm text-ink-2">
          <p className="eyebrow">About the gallery</p>
          <p className="mt-3 leading-6">
            Every submission is reviewed by the house before it appears in the
            public gallery. Be kind in the comments — unkind words are removed.
          </p>
          <Link href="/gallery" className="mt-6 inline-flex btn btn-outline btn-sm">
            Back to gallery
          </Link>
        </aside>
      </div>
    </article>
  );
}

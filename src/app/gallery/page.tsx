import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db, ensureSeeded } from "@/lib/db";
import { getSessionUser } from "@/lib/sessions";
import { PageIntro, EmptyState } from "@/components/ui";
import CardCarousel from "@/components/card-carousel";
import { ScrollReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Gallery",
  description:
    "How clients of the house wear Abass Opela — photographs and film shared by customers, curated by the atelier.",
};

type Post = {
  id: string;
  file_name: string;
  kind: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  caption: string;
  author: string;
  author_id: string;
  created_at: number;
  comment_count: number;
};

export default async function GalleryPage() {
  ensureSeeded();
  const user = await getSessionUser();

  const posts = db
    .prepare(
      `SELECT p.id, m.file_name, m.kind, m.alt, m.width, m.height, m.blur_data_url AS blur,
              p.caption, u.name AS author, p.author_id, p.created_at,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'visible') AS comment_count
       FROM posts p
       JOIN media m ON m.id = p.media_id
       JOIN users u ON u.id = p.author_id
       WHERE p.status = 'approved'
       ORDER BY p.created_at DESC`,
    )
    .all() as Post[];

  return (
    <>
      <PageIntro
        eyebrow="Worn by you"
        title="Customer gallery"
        lede="Clients of the house share how they wear Abass Opela. Every post is reviewed by the atelier before it appears here."
      >
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {user ? (
            <Link href="/account" className="btn btn-solid btn-sm">
              Upload yours
            </Link>
          ) : (
            <Link href="/signin" className="btn btn-solid btn-sm">
              Sign in to share
            </Link>
          )}
          <p className="text-xs text-ink-3">
            Photos up to 10 MB · Videos up to 100 MB · MP4, WebM, MOV, JPEG, PNG, WebP, HEIC
          </p>
        </div>
      </PageIntro>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        {posts.length === 0 ? (
          <EmptyState
            title="No looks yet"
            hint={
              user
                ? "Be the first — upload a photograph or a short film of how you wear the house."
                : "Sign in with your customer account to share the first look."
            }
            action={
              <Link href={user ? "/account" : "/signin"} className="btn btn-solid btn-sm">
                {user ? "Upload a look" : "Sign in"}
              </Link>
            }
          />
        ) : (
          <CardCarousel label="customer gallery" slideClassName="carousel-slide-gallery">
            {posts.map((p, i) => (
              <ScrollReveal key={p.id} delay={Math.min(i % 4 * 70, 210)}>
                <article className="group block">
                  <Link href={`/gallery/${p.id}`} className="block overflow-hidden bg-wash">
                    {p.kind === "video" ? (
                      <video
                        src={p.file_name}
                        className="w-full bg-ink"
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={p.alt || `Look by ${p.author}`}
                      />
                    ) : (
                      <Image
                        src={p.file_name}
                        alt={p.alt || `Look by ${p.author}`}
                        width={p.width ?? 900}
                        height={p.height ?? 1200}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized={/\.(heic|heif)$/i.test(p.file_name)}
                        className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    )}
                  </Link>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-2">
                        <Link href={`/gallery/${p.id}`} className="hover:text-ink">
                          {p.caption || "Untitled look"}
                        </Link>
                      </p>
                      <p className="text-xs text-ink-3">
                        {p.author} ·{" "}
                        {new Date(p.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-3">
                      {p.comment_count > 0 ? `${p.comment_count} 💬` : ""}
                    </span>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </CardCarousel>
        )}
      </section>
    </>
  );
}

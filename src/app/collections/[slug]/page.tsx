import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db, ensureSeeded } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import CardCarousel from "@/components/card-carousel";
import { ScrollReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

type Col = {
  id: string;
  slug: string;
  title: string;
  season: string;
  description: string;
  cover: string | null;
};

type Look = {
  id: string;
  file_name: string;
  alt: string;
  width: number | null;
  height: number | null;
  blur: string | null;
  caption: string;
};

async function getCollection(slug: string): Promise<Col | null> {
  ensureSeeded();
  const row = db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.season, c.description, m.file_name AS cover
       FROM collections c LEFT JOIN media m ON m.id = c.cover_media_id
       WHERE c.slug = ? AND c.published = 1`,
    )
    .get(slug) as Col | undefined;
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const col = await getCollection(slug);
  if (!col) return { title: "Collection not found" };
  return {
    title: `${col.title} — ${col.season}`,
    description: col.description,
    openGraph: {
      title: `${col.title} — ${col.season}`,
      description: col.description,
      images: col.cover ? [{ url: col.cover }] : undefined,
    },
    alternates: { canonical: `/collections/${col.slug}` },
  };
}

export default async function CollectionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const col = await getCollection(slug);
  if (!col) notFound();

  const looks = db
    .prepare(
      `SELECT m.id, m.file_name, m.alt, m.width, m.height, m.blur_data_url AS blur, '' AS caption
       FROM collection_items ci
       JOIN media m ON m.id = ci.media_id
       WHERE ci.collection_id = ?
       ORDER BY ci.position ASC`,
    )
    .all(col.id) as Look[];

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${col.title} — ${col.season}`,
    description: col.description,
    url: `${BASE}/collections/${col.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 md:pt-16 pb-10">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.16em] text-ink-3">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/collections" className="link-underline hover:text-ink">
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink-2">
              {col.title}
            </li>
          </ol>
        </nav>
        <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="eyebrow">{col.season || "Collection"}</p>
            <h1 className="mt-3 font-display text-4xl md:text-6xl font-light leading-[1.02] tracking-tight">
              {col.title}
            </h1>
          </div>
          <p className="max-w-md text-sm md:text-base leading-7 text-ink-2">
            {col.description}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        {looks.length === 0 ? (
          <EmptyState
            title="Looks are being photographed"
            hint="This lookbook has not been filled yet. Check back soon."
          />
        ) : (
          <CardCarousel label={`${col.title} collection looks`} slideClassName="carousel-slide-third">
            {looks.map((look, i) => (
              <ScrollReveal key={look.id} delay={Math.min(i % 4 * 70, 210)}>
                <figure className="group">
                  <div className="relative overflow-hidden bg-wash">
                    <Image
                      src={look.file_name}
                      alt={look.alt}
                      width={look.width ?? 1200}
                      height={look.height ?? 1600}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      placeholder={look.blur ? "blur" : "empty"}
                      blurDataURL={look.blur ?? undefined}
                      preload={i === 0}
                      className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  {look.caption ? (
                    <figcaption className="mt-2 text-xs text-ink-3 tracking-wide">
                      {look.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </ScrollReveal>
            ))}
          </CardCarousel>
        )}

        <div className="mt-16 border-t border-line pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-ink-2 max-w-md">
            Pieces from this collection are available in person or by personal
            arrangement — the house does not sell online.
          </p>
          <Link href="/contact" className="btn btn-solid btn-sm shrink-0">
            Enquire
          </Link>
        </div>
      </section>
    </>
  );
}

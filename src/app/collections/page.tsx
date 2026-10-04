import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db, ensureSeeded } from "@/lib/db";
import { PageIntro, EmptyState } from "@/components/ui";
import CardCarousel from "@/components/card-carousel";
import { ScrollReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore Abass Opela collections — current seasons and the archive, photographed as lookbooks.",
};

type Col = {
  id: string;
  slug: string;
  title: string;
  season: string;
  description: string;
  cover: string | null;
  count: number;
};

export default function CollectionsPage() {
  ensureSeeded();

  const collections = db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.season, c.description, m.file_name AS cover,
              (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS count
       FROM collections c
       LEFT JOIN media m ON m.id = c.cover_media_id
       WHERE c.published = 1
       ORDER BY c.position ASC, c.created_at ASC`,
    )
    .all() as Col[];

  return (
    <>
      <PageIntro
        eyebrow="Lookbooks"
        title="Collections"
        lede="Each season is photographed as a lookbook — fabric, fit and movement, considered in sequence."
      />

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        {collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            hint="The house is between seasons. Lookbooks will appear here as they are released."
          />
        ) : (
          <div className="mt-10">
          <CardCarousel label="collection lookbooks" slideClassName="carousel-slide-wide">
            {collections.map((c, i) => (
              <ScrollReveal key={c.id} delay={Math.min(i * 100, 300)}>
                <article
                  className={`grid gap-6 md:grid-cols-2 md:gap-12 items-center ${
                    i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <Link
                    href={`/collections/${c.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-wash"
                    aria-label={`Open the ${c.title} lookbook`}
                  >
                    {c.cover ? (
                      <Image
                        src={c.cover}
                        alt={`${c.title} — ${c.season} collection cover`}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-3xl text-ink-3">
                        {c.title}
                      </div>
                    )}
                  </Link>
                  <div className={i % 2 === 1 ? "md:pr-8" : "md:pl-8"}>
                    <p className="eyebrow">{c.season || "Collection"}</p>
                    <h2 className="mt-2 font-display text-3xl md:text-5xl font-light tracking-tight">
                      <Link href={`/collections/${c.slug}`} className="hover:text-brass-deep transition-colors">
                        {c.title}
                      </Link>
                    </h2>
                    <p className="mt-4 max-w-lg text-sm md:text-base leading-7 text-ink-2">
                      {c.description}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink-3">
                      {c.count} {c.count === 1 ? "look" : "looks"}
                    </p>
                    <Link href={`/collections/${c.slug}`} className="mt-6 inline-flex btn btn-outline btn-sm">
                      View lookbook
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </CardCarousel>
          </div>
        )}
      </section>
    </>
  );
}

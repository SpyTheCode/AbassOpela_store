import Link from "next/link";
import Image from "next/image";
import { db, ensureSeeded } from "@/lib/db";
import { getBrand } from "@/lib/brand";
import { EmptyState } from "@/components/ui";
import CardCarousel from "@/components/card-carousel";
import HeroWaterRipple from "@/components/hero-water-ripple";
import { ScrollReveal } from "@/components/scroll-reveal";

export const dynamic = "force-dynamic";

type Col = { id: string; slug: string; title: string; season: string; cover: string; count: number };
type Post = { id: string; file_name: string; kind: "image" | "video"; alt: string; width: number | null; height: number | null; blur: string | null; caption: string; author: string };

export default function Home() {
  ensureSeeded();
  const brand = getBrand();

  const collections = db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.season, m.file_name AS cover,
              (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS count
       FROM collections c LEFT JOIN media m ON m.id = c.cover_media_id
       WHERE c.published = 1
       ORDER BY c.position ASC, c.created_at ASC
       LIMIT 3`,
    )
    .all() as Col[];

  const posts = db
    .prepare(
      `SELECT p.id, m.file_name, m.kind, m.alt, m.width, m.height, m.blur_data_url AS blur, p.caption, u.name AS author
       FROM posts p
       JOIN media m ON m.id = p.media_id
       JOIN users u ON u.id = p.author_id
       WHERE p.status = 'approved'
       ORDER BY p.created_at DESC
       LIMIT 6`,
    )
    .all() as Post[];

  // Distinct hero image: the first look not used as a collection cover.
  const hero = db
    .prepare(
      `SELECT m.file_name, m.width, m.height, m.blur_data_url AS blur FROM media m
       WHERE m.file_name LIKE '/images/%'
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 1`,
    )
    .get() as { file_name: string; width: number | null; height: number | null; blur: string | null } | undefined;

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[540px] w-full overflow-hidden bg-ink">
          <HeroWaterRipple>
            {hero ? (
              <Image
                src={hero.file_name}
                alt="Abass Opela editorial look — model in tailored silhouette"
                fill
                preload
                sizes="100vw"
                placeholder={hero.blur ? "blur" : "empty"}
                blurDataURL={hero.blur ?? undefined}
                className="hero-water-image object-cover object-[50%_30%] opacity-95"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-paper/60 font-display text-3xl">
                {brand.name}
              </div>
            )}
          </HeroWaterRipple>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25"
          />
          <div className="hero-copy absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 pb-12 md:pb-16">
              <p className="eyebrow text-paper/80">{brand.tagline}</p>
              <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-7xl font-light leading-[0.98] tracking-tight text-paper">
                Dress with
                <span className="block italic">intention.</span>
              </h1>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href="/collections" className="btn btn-brass">
                  View collections
                </Link>
                <Link
                  href="/gallery"
                  className="btn border border-paper/70 text-paper hover:bg-paper hover:text-ink"
                >
                  Customer gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- featured collections */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 md:py-24" aria-labelledby="home-collections">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The house</p>
            <h2 id="home-collections" className="mt-2 font-display text-3xl md:text-5xl font-light tracking-tight">
              Current collections
            </h2>
          </div>
          <Link
            href="/collections"
            className="hidden sm:inline-flex link-underline text-sm uppercase tracking-[0.16em] text-ink-2 hover:text-ink shrink-0"
          >
            All collections
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Collections are being prepared"
              hint="The atelier is between seasons. Check back shortly."
            />
          </div>
        ) : (
          <div className="mt-10">
          <CardCarousel label="featured collections" slideClassName="carousel-slide-third">
            {collections.map((c, i) => (
              <ScrollReveal key={c.id} delay={Math.min(i * 80, 240)}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-wash">
                    {c.cover ? (
                      <Image
                        src={c.cover}
                        alt={`${c.title} — ${c.season} collection cover`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : null}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between text-paper">
                      <div>
                        <p className="eyebrow text-paper/85">{c.season}</p>
                        <p className="font-display text-2xl mt-1">{c.title}</p>
                      </div>
                      <span className="text-xs tracking-[0.18em] uppercase opacity-80">
                        {c.count} {c.count === 1 ? "look" : "looks"}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </CardCarousel>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- gallery preview */}
      <section className="bg-ink text-paper py-16 md:py-24" aria-labelledby="home-gallery">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-paper/60">Worn by you</p>
              <h2 id="home-gallery" className="mt-2 font-display text-3xl md:text-5xl font-light tracking-tight">
                The customer gallery
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-paper/70">
                Clients of the house share how they wear Abass Opela. Sign in to
                add your own photographs and film.
              </p>
            </div>
            <Link
              href="/gallery"
              className="hidden sm:inline-flex link-underline text-sm uppercase tracking-[0.16em] text-paper/80 hover:text-paper shrink-0"
            >
              Open gallery
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="mt-10 border border-dashed border-paper/25 px-6 py-14 text-center">
              <p className="font-display text-2xl text-paper/85">
                The first looks are on their way
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-paper/60">
                Be the first to share how you wear the house — sign in and upload
                a photograph or a short film.
              </p>
            </div>
          ) : (
            <div className="mt-10">
            <CardCarousel label="customer gallery preview" slideClassName="carousel-slide-sixth">
              {posts.map((p, i) => (
                <ScrollReveal key={p.id} delay={Math.min(i * 60, 240)}>
                  <Link
                    href={`/gallery/${p.id}`}
                    className="group relative block overflow-hidden bg-black/30"
                  >
                    {p.kind === "video" ? (
                      <video
                        src={p.file_name}
                        className="aspect-[3/4] w-full object-cover"
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
                        sizes="(min-width: 1024px) 16vw, 50vw"
                        className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    )}
                    <span className="sr-only">View post by {p.author}</span>
                  </Link>
                </ScrollReveal>
              ))}
            </CardCarousel>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- manifesto */}
      <section className="mx-auto max-w-4xl px-5 sm:px-8 py-16 md:py-24 text-center">
        <p className="eyebrow">The house view</p>
        <p className="mt-5 font-display text-2xl md:text-4xl font-light leading-snug md:leading-[1.3] tracking-tight text-ink-2">
          “Fabric first, then feeling. We cut for movement, in limited runs,
          and let the people who wear the clothes finish the story.”
        </p>
        <Link
          href="/about"
          className="mt-8 inline-flex link-underline text-sm uppercase tracking-[0.16em] text-ink-2 hover:text-ink"
        >
          About the house
        </Link>
      </section>

      {/* --------------------------------------------------------- cta band */}
      <section className="border-y border-line bg-brass-soft/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-light tracking-tight">
              Ready to wear {brand.name}?
            </h2>
            <p className="mt-2 text-sm text-ink-2 max-w-md">
              Purchases happen in person or by personal arrangement. Send a note
              and the house replies directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/contact" className="btn btn-solid">
              Contact the house
            </Link>
            <Link href="/signin" className="btn btn-outline">
              Join the gallery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

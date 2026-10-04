import Link from "next/link";
import Image from "next/image";

export default function SiteFooter({
  brand,
  socials,
}: {
  brand: { name: string; logo: string; email: string; location: string; tagline: string };
  socials: { instagram: string; pinterest: string };
}) {
  return (
    <footer className="mt-24 border-t border-line bg-wash/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative block h-10 w-10 overflow-hidden rounded-full ring-1 ring-line-strong">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  fill
                  sizes="40px"
                />
              </span>
              <span className="font-display text-2xl">{brand.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-3">
              {brand.tagline} Purchases are made in person or by personal
              arrangement — browse the collections, then say hello.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2 text-sm">
              {[
                ["/collections", "Collections"],
                ["/gallery", "Customer gallery"],
                ["/about", "About the house"],
                ["/contact", "Contact"],
                ["/signin", "Sign in"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="link-underline text-ink-2 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow mb-4">Correspondence</p>
            <ul className="space-y-2 text-sm text-ink-2">
              <li>
                <a href={`mailto:${brand.email}`} className="link-underline hover:text-ink">
                  {brand.email}
                </a>
              </li>
              <li>{brand.location}</li>
              {socials.instagram ? (
                <li>
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline hover:text-ink"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
              {socials.pinterest ? (
                <li>
                  <a
                    href={socials.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline hover:text-ink"
                  >
                    Pinterest
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-3">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>Photography belongs to the house and its clients.</p>
        </div>
      </div>
    </footer>
  );
}

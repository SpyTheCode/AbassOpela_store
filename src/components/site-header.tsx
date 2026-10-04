"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/sessions";

const NAV = [
  { href: "/collections", label: "Collections" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Tracks the current pathname with an external-store subscription so the
 * drawer can close on navigation without setState-in-effect cascades. */
function useActivePath() {
  const [path, setPath] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}

export default function SiteHeader({
  brand,
  user,
}: {
  brand: { name: string; logo: string; tagline: string };
  user: Pick<SessionUser, "id" | "name" | "role"> | null;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activePath = useActivePath();

  // Close the drawer whenever the route changes (derived during render —
  // the "adjust state when props change" pattern, no effect needed).
  const [lastPath, setLastPath] = useState<string | null>(null);
  if (activePath !== null && activePath !== lastPath) {
    setLastPath(activePath);
    if (open) setOpen(false);
  }

  // Add a hairline + blur once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    activePath === href || (activePath?.startsWith(href + "/") ?? false);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "bg-paper/90 backdrop-blur border-b border-line"
          : "bg-paper border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
            aria-label={`${brand.name} — home`}
          >
            <span className="relative block h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-full ring-1 ring-line-strong">
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
            <span className="font-display text-xl md:text-2xl leading-none tracking-wide">
              {brand.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="link-underline text-[0.8rem] uppercase tracking-[0.18em] text-ink-2 hover:text-ink data-[active=true]:text-ink"
                    data-active={isActive(item.href)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={user.role === "admin" ? "/admin" : "/account"}
                className="hidden md:inline-flex btn btn-outline btn-sm"
              >
                {user.role === "admin" ? "Studio" : user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link href="/signin" className="hidden md:inline-flex btn btn-solid btn-sm">
                Sign in
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center border border-line-strong"
            >
              <span className="relative block h-3 w-5" aria-hidden="true">
                <span
                  className={`absolute left-0 top-0 h-px w-full bg-ink transition-transform duration-200 ${
                    open ? "translate-y-[6px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-px w-full bg-ink transition-opacity duration-150 ${
                    open ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-3 h-px w-full bg-ink transition-transform duration-200 ${
                    open ? "-translate-y-[6px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="md:hidden border-t border-line bg-paper"
      >
        <nav aria-label="Mobile" className="px-5 py-4">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="block py-3 font-display text-2xl text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-3 pt-3 border-t border-line">
              {user ? (
                <Link
                  href={user.role === "admin" ? "/admin" : "/account"}
                  className="block py-2 text-sm uppercase tracking-[0.18em] text-ink-2"
                >
                  {user.role === "admin" ? "Studio" : "My account"}
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="block py-2 text-sm uppercase tracking-[0.18em] text-ink-2"
                >
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

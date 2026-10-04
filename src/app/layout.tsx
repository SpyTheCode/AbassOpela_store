import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getBrand, getSocials } from "@/lib/brand";
import { getSessionUser } from "@/lib/sessions";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrand();
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(BASE),
    title: {
      default: `${brand.name} — ${brand.tagline}`,
      template: `%s — ${brand.name}`,
    },
    description: BRAND_DESCRIPTION(brand),
    openGraph: {
      title: `${brand.name} — ${brand.tagline}`,
      description: BRAND_DESCRIPTION(brand),
      type: "website",
      siteName: brand.name,
      images: [{ url: brand.logo, width: 1080, height: 1080, alt: `${brand.name} logo` }],
    },
    twitter: {
      card: "summary_large_image",
    },
    icons: {
      icon: brand.logo,
    },
  };
}

function BRAND_DESCRIPTION(brand: { name: string }) {
  return `${brand.name} is a fashion house crafting considered pieces for people who dress with intention. Explore the collections and the customers who wear them.`;
}

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const brand = getBrand();
  const user = await getSessionUser();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    logo: brand.logo,
    email: brand.email,
    description: BRAND_DESCRIPTION(brand),
  };

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <SiteHeader brand={brand} user={user} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter brand={brand} socials={getSocials()} />
      </body>
    </html>
  );
}

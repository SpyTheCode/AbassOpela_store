import type { MetadataRoute } from "next";
import { db, ensureSeeded } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  ensureSeeded();
  const statics: MetadataRoute.Sitemap = [
    "",
    "/collections",
    "/gallery",
    "/about",
    "/contact",
    "/signin",
  ].map((p) => ({
    url: BASE + p,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const collections = db
    .prepare("SELECT slug, updated_at FROM collections WHERE published = 1")
    .all() as Array<{ slug: string; updated_at: number }>;

  const collectionUrls: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE}/collections/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const posts = db
    .prepare(
      "SELECT p.id, p.created_at FROM posts p WHERE p.status = 'approved'",
    )
    .all() as Array<{ id: string; created_at: number }>;

  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/gallery/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...statics, ...collectionUrls, ...postUrls];
}

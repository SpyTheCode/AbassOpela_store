/** Brand + platform constants shared across the app. */

export const BRAND = {
  name: "Abass Opela",
  shortName: "AO",
  tagline: "Fashion, curated.",
  email: "hello@abassopela.com",
  location: "Lagos · Worldwide",
  description:
    "Abass Opela is a fashion house crafting considered pieces for people who dress with intention. Explore the collections and the customers who wear them.",
  /** Default logo, used until an admin uploads a replacement. */
  defaultLogo: "/images/logo.jpeg",
} as const;

/** Upload limits. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_COMMENT_LENGTH = 1000;
export const MAX_CAPTION_LENGTH = 280;
export const MAX_MESSAGE_LENGTH = 2000;

/** human readable byte size, e.g. "1.5 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

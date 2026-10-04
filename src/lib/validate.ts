import { MAX_COMMENT_LENGTH, MAX_MESSAGE_LENGTH, MAX_CAPTION_LENGTH } from "./constants";

export { MAX_COMMENT_LENGTH, MAX_MESSAGE_LENGTH, MAX_CAPTION_LENGTH };

/** Validation helpers shared by server actions and route handlers. */

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function cleanText(
  v: FormDataEntryValue | null | undefined,
  max: number,
): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Multiline text: collapse CRLF, trim, cap length. */
export function cleanMultiline(
  v: FormDataEntryValue | null | undefined,
  max: number,
): string {
  return String(v ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export type ActionState = { ok: boolean; error?: string; message?: string };

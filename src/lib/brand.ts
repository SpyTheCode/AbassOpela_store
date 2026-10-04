import { db, ensureSeeded, getSetting } from "./db";
import { BRAND } from "./constants";

/** Brand identity from settings (admin-manageable), with constants as fallback. */
export function getBrand() {
  ensureSeeded();
  const name = getSetting("brand_name") || BRAND.name;
  const tagline = getSetting("brand_tagline") || BRAND.tagline;
  const email = getSetting("contact_email") || BRAND.email;
  const location = getSetting("contact_location") || BRAND.location;
  const logo = getSetting("logo_src") || BRAND.defaultLogo;
  return { name, tagline, email, location, logo };
}

export function getSocials() {
  ensureSeeded();
  return {
    instagram: getSetting("instagram") || "",
    pinterest: getSetting("pinterest") || "",
  };
}

/** Small helper used by list queries in this file and pages. */
export function all<T = Record<string, unknown>>(
  sql: string,
  ...params: (string | number | null)[]
): T[] {
  return db.prepare(sql).all(...params) as T[];
}

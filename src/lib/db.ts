import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

/**
 * SQLite (node:sqlite, zero-dependency) persistence layer.
 * All timestamps are unix milliseconds (INTEGER).
 */

const DATA_DIR = process.env.ABASS_DATA_DIR
  ? path.resolve(process.env.ABASS_DATA_DIR)
  : path.join(process.cwd(), "data");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, "abassopela.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 8000;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL DEFAULT '',
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
    avatar_media_id TEXT,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id         TEXT PRIMARY KEY,
    owner_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    kind       TEXT NOT NULL CHECK (kind IN ('image','video')),
    mime_type  TEXT NOT NULL,
    file_name  TEXT NOT NULL,
    byte_size  INTEGER NOT NULL,
    alt        TEXT NOT NULL DEFAULT '',
    width      INTEGER,
    height     INTEGER,
    blur_data_url TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id          TEXT PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    season      TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    cover_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
    published   INTEGER NOT NULL DEFAULT 1,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collection_items (
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    media_id      TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, media_id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id           TEXT PRIMARY KEY,
    author_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id     TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    caption      TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reject_reason TEXT NOT NULL DEFAULT '',
    created_at   INTEGER NOT NULL,
    decided_at   INTEGER,
    decided_by   TEXT REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    body       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    handled    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
if (!userColumns.some((column) => column.name === "username")) {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''");
}
db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE) WHERE username <> ''",
);
db.prepare(
  "UPDATE collections SET slug = 'atelier-prive' WHERE slug = 'atelier-privé' AND NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'atelier-prive')",
).run();

/* ---------------------------------------------------------------- helpers */

export function now(): number {
  return Date.now();
}

export function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

/* ---------------------------------------------------------------- seeding */

/** Settings helpers — logo, brand contact details, etc. */
export function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value);
}

function statSafe(p: string): number {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

/**
 * Seed the database once. Content lives in the repo's `images/` folder and is
 * referenced by URL — no copying — so the supplied photography, including the
 * HEIC files, can be used immediately. Everything seeded here is fully
 * manageable (and removable) from the admin area afterwards.
 */
async function seed() {
  if (getSetting("seeded")) {
    await ensureAuthAccounts();
    return;
  }

  // Multiple server processes can race to seed (e.g. build workers).
  // BEGIN IMMEDIATE serializes them; losers re-check and skip.
  try {
    db.exec("BEGIN IMMEDIATE");
  } catch {
    return; // another process holds the write lock and is seeding
  }
  try {
    if (getSetting("seeded")) {
      db.exec("ROLLBACK");
      await ensureAuthAccounts();
      return;
    }
    await seedContent();
    await ensureAuthAccounts();
    setSetting("seeded", "v2");
    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already rolled back */
    }
    throw err;
  }
}

async function seedContent() {
  const t = now();
  const legacyImgDir = path.join(process.cwd(), "images");
  let hasLegacy = false;
  try {
    hasLegacy = fs.statSync(legacyImgDir).isDirectory();
  } catch {
    hasLegacy = false;
  }

  // ---- brand + admin ----
  setSetting("brand_name", "Abass Opela");
  setSetting("brand_tagline", "Fashion, curated.");
  setSetting("contact_email", "hello@abassopela.com");
  setSetting("contact_location", "Lagos · Worldwide");
  setSetting("logo_src", hasLegacy ? "/images/logo.jpeg" : "");
  setSetting("about_intro", "Abass Opela is a fashion house crafting considered pieces for people who dress with intention.");
  setSetting("about_body", "Every collection begins with fabric and feeling — muted palettes, precise tailoring, silhouettes that move. The house works closely with a small atelier, producing in limited runs so each piece keeps its character.\n\nThe customer gallery is the heart of the brand: clients wear Abass Opela their own way, and the house celebrates that. Purchases happen in person or over direct conversation — browse here, then reach out.");
  setSetting("contact_blurb", "For commissions, fittings and availability, send a note — the house replies personally.");
  setSetting("instagram", "https://instagram.com/abassopela");
  setSetting("pinterest", "");

  const insertMedia = db.prepare(
    "INSERT INTO media (id, owner_id, kind, mime_type, file_name, byte_size, alt, width, height, blur_data_url, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  );

  async function seedImage(url: string, alt: string): Promise<string> {
    const id = "seed_" + randomId();
    const ext = url.toLowerCase();
    const kind = /\.(mp4|webm|mov)$/.test(ext) ? "video" : "image";
    const mime =
      kind === "video"
        ? ext.endsWith(".webm")
          ? "video/webm"
          : ext.endsWith(".mov")
            ? "video/quicktime"
            : "video/mp4"
        : ext.endsWith(".png")
          ? "image/png"
          : ext.endsWith(".webp")
            ? "image/webp"
            : ext.endsWith(".gif")
              ? "image/gif"
              : ext.endsWith(".heic") || ext.endsWith(".heif")
                ? "image/heic"
                : "image/jpeg";
    const onDisk = url.startsWith("/images/")
      ? path.join(process.cwd(), "images", path.basename(url))
      : null;
    insertMedia.run(
      id,
      null,
      kind,
      mime,
      url,
      onDisk ? statSafe(onDisk) : 0,
      alt,
      null,
      null,
      null,
      t,
    );
    return id;
  }

  if (hasLegacy) {
    const files = fs.readdirSync(legacyImgDir);
    const looksLikeLogo = (f: string) => /logo/i.test(f);
    const photos = files
      .filter((f) => !f.startsWith(".") && !looksLikeLogo(f) && /\.(jpe?g|png|webp|gif|heic|heif|mp4|webm|mov)$/i.test(f))
      .sort();

    const seededIds: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const url = "/images/" + photos[i];
      seededIds.push(
        await seedImage(url, "Abass Opela look — editorial fashion photography, look " + (i + 1)),
      );
    }

    // ---- collections: distribute the looks across three curated sets ----
    const insertCollection = db.prepare(
      "INSERT INTO collections (id, slug, title, season, description, cover_media_id, published, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    );
    const insertItem = db.prepare(
      "INSERT INTO collection_items (collection_id, media_id, position) VALUES (?,?,?)",
    );

    const defs: Array<{ slug: string; title: string; season: string; description: string; range: [number, number] }> = [
      {
        slug: "monochrome-hours",
        title: "Monochrome Hours",
        season: "Resort 2026",
        description:
          "Black, bone and smoke — a study in restraint. Tailoring cut for evening air and long corridors.",
        range: [0, 12],
      },
      {
        slug: "terracotta-diaries",
        title: "Terracotta Diaries",
        season: "Autumn 2026",
        description:
          "Warm clay tones and unbothered silhouettes, photographed between Lagos and the coast.",
        range: [12, 24],
      },
      {
        slug: "atelier-prive",
        title: "Atelier Privé",
        season: "Archive",
        description:
          "One-of-one commissions and studio experiments — the closer, hand-finished side of the house.",
        range: [24, Math.max(25, seededIds.length)],
      },
    ];

    defs.forEach((d, ci) => {
      const cid = "col_" + randomId();
      const slice = seededIds.slice(d.range[0], d.range[1]);
      if (slice.length === 0) return;
      insertCollection.run(cid, d.slug, d.title, d.season, d.description, slice[0], 1, ci, t, t);
      slice.forEach((mid, i) => insertItem.run(cid, mid, i));
    });
  }
}

async function ensureAuthAccounts() {
  const { hashPassword, verifyPassword } = await import("./passwords");
  const time = now();
  const defaultAdminUsername = process.env.ABASS_ADMIN_USERNAME?.trim() || "OPELA_USERNAME";
  const defaultAdminPassword = process.env.ABASS_ADMIN_PASSWORD || "OPELA_PASSWORD";
  let admin = db
    .prepare("SELECT id, username, password_hash FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1")
    .get() as { id: string; username: string; password_hash: string } | undefined;

  if (!admin) {
    const username = defaultAdminUsername;
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
      throw new Error("ABASS_ADMIN_USERNAME must be 3-40 letters, numbers, dots, underscores, or hyphens.");
    }

    const id = randomId();
    const passwordHash = await hashPassword(defaultAdminPassword);
    db.prepare(
      "INSERT INTO users (id, username, email, name, password_hash, role, status, created_at) VALUES (?,?,?,?,?,'admin','active',?)",
    ).run(id, username, "admin@abassopela.com", "Abass Opela", passwordHash, time);
    admin = { id, username, password_hash: passwordHash };
  } else {
    if (
      getSetting("admin_default_credentials_migrated") !== "1" &&
      admin.username === "admin" &&
      getSetting("admin_initial_credentials_printed") === "1"
    ) {
      const passwordHash = await hashPassword(defaultAdminPassword);
      db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE id = ?").run(
        defaultAdminUsername,
        passwordHash,
        admin.id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(admin.id);
      admin.username = defaultAdminUsername;
      admin.password_hash = passwordHash;
    }

    if (!admin.username) {
      if (!/^[a-zA-Z0-9._-]{3,40}$/.test(defaultAdminUsername)) {
        throw new Error("ABASS_ADMIN_USERNAME must be 3-40 letters, numbers, dots, underscores, or hyphens.");
      }
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(defaultAdminUsername, admin.id);
      admin.username = defaultAdminUsername;
    }

    if (
      getSetting("admin_default_password_removed") !== "1" &&
      await verifyPassword("Abass2026!", admin.password_hash)
    ) {
      const passwordHash = await hashPassword(defaultAdminPassword);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
        passwordHash,
        admin.id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(admin.id);
      setSetting("admin_default_password_removed", "1");
      admin.password_hash = passwordHash;
    }
  }
  setSetting("admin_default_credentials_migrated", "1");

  const recoveryAnswer = process.env.ABASS_ADMIN_RECOVERY_ANSWER?.trim().toLocaleLowerCase();
  if (recoveryAnswer && !getSetting("admin_recovery_hash")) {
    setSetting("admin_recovery_hash", await hashPassword(recoveryAnswer));
  }

  if (getSetting("shared_customer_credentials_migrated") !== "1") {
    const customers = db
      .prepare("SELECT id FROM users WHERE role = 'customer' ORDER BY created_at")
      .all() as Array<{ id: string }>;
    const customerId = customers[0]?.id ?? randomId();

    if (!customers.length) {
      db.prepare(
        "INSERT INTO users (id, username, email, name, password_hash, role, status, created_at) VALUES (?,'','customers@abassopela.local','Customer',?,'customer','suspended',?)",
      ).run(customerId, await hashPassword(randomBytes(24).toString("base64url")), time);
    } else {
      for (const customer of customers.slice(1)) {
        db.prepare("UPDATE posts SET author_id = ? WHERE author_id = ?").run(customerId, customer.id);
        db.prepare("UPDATE comments SET author_id = ? WHERE author_id = ?").run(customerId, customer.id);
        db.prepare("UPDATE media SET owner_id = ? WHERE owner_id = ?").run(customerId, customer.id);
        db.prepare("DELETE FROM sessions WHERE user_id = ?").run(customer.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(customer.id);
      }
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(customerId);
      db.prepare(
        "UPDATE users SET username = '', email = 'customers@abassopela.local', name = 'Customer', password_hash = ?, status = 'suspended' WHERE id = ?",
      ).run(await hashPassword(randomBytes(24).toString("base64url")), customerId);
    }
    setSetting("shared_customer_credentials_migrated", "1");
  }

  if (getSetting("shared_customer_default_credentials_migrated") !== "1") {
    const customer = db
      .prepare("SELECT id, username FROM users WHERE role = 'customer' ORDER BY created_at LIMIT 1")
      .get() as { id: string; username: string } | undefined;
    if (!customer) {
      throw new Error("Shared customer account is missing; database migration did not complete.");
    }

    if (!customer.username) {
      const username = "USER001";
      const collision = db
        .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id <> ?")
        .get(username, customer.id);
      if (collision) {
        throw new Error("Cannot set the default shared customer login because USER001 is already in use.");
      }
      db.prepare(
        "UPDATE users SET username = ?, password_hash = ?, status = 'active' WHERE id = ?",
      ).run(username, await hashPassword("PASSWORD12345"), customer.id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(customer.id);
      setSetting("shared_customer_default_credentials_active", "1");
    } else {
      setSetting("shared_customer_default_credentials_active", "0");
    }
    setSetting("shared_customer_default_credentials_migrated", "1");
  }
}

let seedPromise: Promise<void> | null = null;
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

export type DbUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  password_hash: string;
  role: "customer" | "admin";
  status: "active" | "suspended";
  avatar_media_id: string | null;
  created_at: number;
};

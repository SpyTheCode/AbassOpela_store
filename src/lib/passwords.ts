import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

/** scrypt hash in the form `scrypt$<saltHex>$<hashHex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

/** Constant-time password verification. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, saltHex, hashHex] = parts;
  const hash = await scrypt(password, saltHex, KEYLEN);
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== hash.length) return false;
  return timingSafeEqual(hash, expected);
}

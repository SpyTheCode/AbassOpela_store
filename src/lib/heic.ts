import convertHeic from "heic-convert";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const conversions = new Map<string, Promise<Buffer>>();

export async function getBrowserJpeg(sourcePath: string, cachePath: string): Promise<Buffer> {
  try {
    return await fs.promises.readFile(cachePath);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  const pending = conversions.get(cachePath);
  if (pending) return pending;

  const conversion = (async () => {
    const decoded = await convertHeic({
      buffer: await fs.promises.readFile(sourcePath),
      format: "JPEG",
      quality: 0.82,
    });
    const optimized = await sharp(decoded)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.promises.writeFile(cachePath, optimized);
    return optimized;
  })();
  conversions.set(cachePath, conversion);
  try {
    return await conversion;
  } finally {
    conversions.delete(cachePath);
  }
}

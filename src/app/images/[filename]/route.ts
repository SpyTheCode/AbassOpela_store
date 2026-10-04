import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getBrowserJpeg } from "@/lib/heic";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[\w.-]+$/.test(filename) || filename === "." || filename === "..") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === ".heic" || ext === ".heif" ? "image/jpeg" : MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "images", filename);
  try {
    const stat = fs.statSync(filePath);
    const isHeic = ext === ".heic" || ext === ".heif";
    const body = isHeic
      ? new Uint8Array(
          await getBrowserJpeg(
            filePath,
            path.join(
              process.env.ABASS_DATA_DIR
                ? path.resolve(process.env.ABASS_DATA_DIR)
                : path.join(process.cwd(), "data"),
              "optimized-media",
              `${path.basename(filename, ext)}.jpg`,
            ),
          ),
        )
      : Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream<Uint8Array>;
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        ...(isHeic
          ? {}
          : { "Content-Length": String(stat.size) }),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    throw error;
  }
}

import { NextRequest, NextResponse } from "next/server";
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

/**
 * GET /api/media/[id] — serves uploaded files from data/media.
 * Uploaded videos are served with Range support so scrubbing/seeking works.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  // ids are our own random tokens; tolerate the extension too
  const safeId = id.replace(/\.[a-z0-9]+$/i, "");
  if (!/^[a-z0-9]+$/i.test(safeId)) {
    return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
  }

  const fs = await import("node:fs");
  const path = await import("node:path");
  const mediaDir = path.join(process.cwd(), "data", "media");

  // find the file with any known extension
  let filePath: string | null = null;
  let ext = "";
  for (const candidate of Object.keys(MIME)) {
    const p = path.join(mediaDir, safeId + candidate);
    if (fs.existsSync(p)) {
      filePath = p;
      ext = candidate;
      break;
    }
  }
  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const isHeic = ext === ".heic" || ext === ".heif";
  const type = isHeic ? "image/jpeg" : MIME[ext] ?? "application/octet-stream";
  const heicJpeg = isHeic
    ? await getBrowserJpeg(
        filePath,
        path.join(
          process.env.ABASS_DATA_DIR
            ? path.resolve(process.env.ABASS_DATA_DIR)
            : path.join(process.cwd(), "data"),
          "optimized-media",
          `${safeId}.jpg`,
        ),
      )
    : null;
  const size = heicJpeg?.byteLength ?? stat.size;
  const baseHeaders: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (start >= size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const safeEnd = Math.min(end, size - 1);
      const chunk = Buffer.alloc(safeEnd - start + 1);
      if (heicJpeg) {
        heicJpeg.copy(chunk, 0, start, safeEnd + 1);
      } else {
        const fd = fs.openSync(filePath, "r");
        try {
          fs.readSync(fd, chunk, 0, chunk.length, start);
        } finally {
          fs.closeSync(fd);
        }
      }
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${safeEnd}/${size}`,
          "Content-Length": String(chunk.length),
        },
      });
    }
  }

  if (heicJpeg) {
    return new NextResponse(new Uint8Array(heicJpeg), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(heicJpeg.byteLength),
      },
    });
  }

  const buf = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(stat.size),
    },
  });
}

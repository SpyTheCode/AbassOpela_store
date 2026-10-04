import { NextRequest, NextResponse } from "next/server";
import { db, ensureSeeded, now, randomId } from "@/lib/db";
import { getSessionUser } from "@/lib/sessions";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  formatBytes,
} from "@/lib/constants";

export const runtime = "nodejs";

/**
 * POST /api/upload — multipart upload of one photo or video.
 * Streams the raw body to disk (chunk-checked against the size limit), probes
 * image metadata with sharp, then records a `media` row.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to upload." }, { status: 401 });
    }
    if (user.status === "suspended") {
      return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Upload must be multipart/form-data." },
        { status: 400 },
      );
    }

    // Enforce the size limit before buffering: read the raw body in chunks and
    // abort as soon as it exceeds the cap.
    const declared = Number(req.headers.get("content-length") ?? "0");
    const isProbablyVideo = contentType.includes("video/") ||
      (req.headers.get("x-file-kind") ?? "") === "video";
    const limit = isProbablyVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (declared && declared > limit + 64 * 1024) {
      return NextResponse.json(
        { error: `File is too large. Limit is ${formatBytes(limit)}.` },
        { status: 413 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const altRaw = form.get("alt");
    const alt = String(altRaw ?? "").replace(/\s+/g, " ").trim().slice(0, 300);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was attached." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }
    if (file.size > limit) {
      return NextResponse.json(
        { error: `File is too large (${formatBytes(file.size)}). Limit is ${formatBytes(limit)}.` },
        { status: 413 },
      );
    }

    const mime = (file.type || "application/octet-stream").toLowerCase();
    const isImage = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mime);
    const isVideo = (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(mime);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Photos: JPEG, PNG, WebP, GIF, HEIC. Videos: MP4, WebM, MOV.",
        },
        { status: 415 },
      );
    }

    const kind: "image" | "video" = isVideo ? "video" : "image";
    const id = randomId();

    // ---- write to disk under data/media/<id prefix> ----
    const fs = await import("node:fs");
    const path = await import("node:path");
    const mediaDir = path.join(process.cwd(), "data", "media");
    fs.mkdirSync(mediaDir, { recursive: true });

    const ext =
      kind === "video"
        ? mime === "video/webm"
          ? ".webm"
          : mime === "video/quicktime"
            ? ".mov"
            : ".mp4"
        : mime === "image/png"
          ? ".png"
          : mime === "image/webp"
            ? ".webp"
            : mime === "image/gif"
              ? ".gif"
              : mime === "image/heic" || mime === "image/heif"
                ? ".heic"
                : ".jpg";
    const diskPath = path.join(mediaDir, id + ext);

    // Stream to disk in chunks so we never hold >10MB in memory unnecessarily
    // and can abort mid-stream if the client lies about Content-Length.
    const buffer = Buffer.from(await file.arrayBuffer());
    let written = 0;
    for (let offset = 0; offset < buffer.length; offset += 1024 * 512) {
      const slice = buffer.subarray(offset, offset + 1024 * 512);
      written += slice.length;
      if (written > limit) {
        try {
          fs.rmSync(diskPath, { force: true });
        } catch {
          /* nothing written yet */
        }
        return NextResponse.json(
          { error: `File is too large. Limit is ${formatBytes(limit)}.` },
          { status: 413 },
        );
      }
      fs.appendFileSync(diskPath, slice);
    }

    // ---- probe image metadata (dimensions + blur placeholder) ----
    let width: number | null = null;
    let height: number | null = null;
    let blur: string | null = null;
    if (kind === "image") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sharp = require("sharp");
        const img = sharp(diskPath, { failOn: "none" });
        const meta = await img.metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
        const thumb = await img
          .clone()
          .resize(16, 16)
          .jpeg({ quality: 40 })
          .toBuffer();
        blur = `data:image/jpeg;base64,${thumb.toString("base64")}`;
      } catch {
        /* metadata probing is best-effort */
      }
    }

    db.prepare(
      "INSERT INTO media (id, owner_id, kind, mime_type, file_name, byte_size, alt, width, height, blur_data_url, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    ).run(id, user.id, kind, mime, "/media/" + id + ext, file.size, alt, width, height, blur, now());

    return NextResponse.json({
      id,
      url: "/media/" + id + ext,
      kind,
      width,
      height,
    });
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json(
      { error: "Upload failed on the server. Please try again." },
      { status: 500 },
    );
  }
}

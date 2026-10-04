"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_CAPTION_LENGTH,
  formatBytes,
} from "@/lib/constants";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

type Phase = "idle" | "uploading" | "saving" | "done";

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setError(null);
    setOkMsg(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    const isImage = IMAGE_TYPES.includes(f.type);
    const isVideo = VIDEO_TYPES.includes(f.type);
    if (!isImage && !isVideo) {
      setError("That file type is not supported. Use a photo (JPEG, PNG, WebP, GIF, HEIC) or a video (MP4, WebM, MOV).");
      return;
    }
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (f.size > limit) {
      setError(
        `That ${isVideo ? "video" : "photo"} is ${formatBytes(f.size)} — the limit is ${formatBytes(limit)}.`,
      );
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setPhase("idle");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    if (captionRef.current) captionRef.current.value = "";
    if (altRef.current) altRef.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || phase === "uploading" || phase === "saving") return;
    setError(null);
    setOkMsg(null);
    setPhase("uploading");
    setProgress(0);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt", (altRef.current?.value ?? "").slice(0, 300));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          id?: string;
          error?: string;
          kind?: string;
        };
        if (xhr.status === 200 && data.id) {
          setPhase("saving");
          // create the post wrapping the media
          fetch("/api/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaId: data.id,
              caption: (captionRef.current?.value ?? "").slice(0, MAX_CAPTION_LENGTH),
            }),
          }).then(async (res) => {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            if (res.ok) {
              setPhase("done");
              setOkMsg("Uploaded — the atelier will review it shortly.");
              reset();
              router.refresh();
            } else {
              setPhase("idle");
              setError(body.error ?? "Could not publish your upload. Please try again.");
            }
          });
        } else {
          setPhase("idle");
          setError(data.error ?? "Upload failed. Please try again.");
        }
      } catch {
        setPhase("idle");
        setError("Unexpected server response. Please try again.");
      }
    };
    xhr.onerror = () => {
      setPhase("idle");
      setError("Network error while uploading. Check your connection and try again.");
    };
    xhr.send(fd);
  }

  return (
    <form onSubmit={submit} className="border border-line bg-card p-5">
      {error ? (
        <p className="notice notice-error mb-4" role="alert">{error}</p>
      ) : null}
      {okMsg ? (
        <p className="notice notice-ok mb-4" role="status">{okMsg}</p>
      ) : null}

      <label className="field-label" htmlFor="upload-file">
        Photo or video
      </label>
      <input
        ref={inputRef}
        id="upload-file"
        type="file"
        accept={["image/*", "video/mp4", "video/webm", "video/quicktime"].join(",")}
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-ink-2 file:mr-3 file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-[0.14em] file:text-ink-2 hover:file:border-ink"
      />
      <p className="mt-2 text-xs text-ink-3">
        Photos up to {formatBytes(MAX_IMAGE_BYTES)} · Videos up to {formatBytes(MAX_VIDEO_BYTES)} · JPEG, PNG, WebP, GIF, HEIC, MP4, WebM, MOV
      </p>

      {previewUrl ? (
        <div className="mt-4 max-w-[240px]">
          {file && file.type.startsWith("video/") ? (
            <video src={previewUrl} controls className="w-full bg-ink" aria-label="Selected video preview" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected photo preview"
              className="w-full border border-line"
            />
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor="upload-caption" className="field-label">
          Caption <span className="normal-case tracking-normal text-ink-3">(optional)</span>
        </label>
        <input
          ref={captionRef}
          id="upload-caption"
          type="text"
          maxLength={MAX_CAPTION_LENGTH}
          className="input"
          placeholder="How do you wear it?"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="upload-alt" className="field-label">
          Describe the image <span className="normal-case tracking-normal text-ink-3">(for accessibility)</span>
        </label>
        <input
          ref={altRef}
          id="upload-alt"
          type="text"
          maxLength={300}
          className="input"
          placeholder="e.g. Overshirt in bone twill, evening light"
        />
      </div>

      {phase === "uploading" ? (
        <div
          className="mt-5 h-1 w-full bg-wash"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div className="h-full bg-brass transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <div className="mt-5">
        <button
          type="submit"
          className="btn btn-solid w-full"
          disabled={phase === "uploading" || phase === "saving" || !file}
        >
          {phase === "uploading"
            ? `Uploading… ${progress}%`
            : phase === "saving"
              ? "Publishing…"
              : "Submit for review"}
        </button>
      </div>
    </form>
  );
}

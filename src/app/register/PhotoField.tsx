"use client";

// Two-mode photo input: pick from gallery OR launch rear camera.
// On selection we IMMEDIATELY compress (HEIC -> JPEG, resize to 800px,
// q=0.7) and show a thumbnail preview + before/after file size. The
// student sees confirmation that their photo is ready BEFORE they tap
// submit, instead of crossing their fingers and hoping it worked.
//
// The compressed File is held in component state and pushed into a
// hidden <input name="photo"> via DataTransfer so the existing FormData
// pipeline picks it up without changes.

import { useEffect, useRef, useState } from "react";
import { compressImage, formatBytes, type CompressResult } from "@/lib/image-compress";

type Status =
  | { kind: "idle" }
  | { kind: "processing"; original: File }
  | { kind: "ready"; result: CompressResult; previewUrl: string }
  | { kind: "error"; message: string };

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function PhotoField() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Whenever a fresh compressed File is ready, push it into the hidden
  // input that the surrounding form serialises into FormData.
  useEffect(() => {
    if (status.kind !== "ready" || !hiddenInputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(status.result.file);
    hiddenInputRef.current.files = dt.files;
  }, [status]);

  // Clean up the previous preview URL when state changes
  useEffect(() => {
    return () => {
      if (status.kind === "ready") URL.revokeObjectURL(status.previewUrl);
    };
  }, [status]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus({ kind: "processing", original: file });
    try {
      const result = await compressImage(file);
      const previewUrl = URL.createObjectURL(result.file);
      setStatus({ kind: "ready", result, previewUrl });
    } catch (e) {
      setStatus({
        kind: "error",
        message:
          e instanceof Error
            ? e.message
            : "Could not process this photo. Try a different one.",
      });
    }
  }

  function reset() {
    setStatus({ kind: "idle" });
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Hidden input that the surrounding form picks up via name="photo".
          Required at submit time - the parent form's onSubmit checks for
          a file here before firing the server action. */}
      <input
        ref={hiddenInputRef}
        type="file"
        name="photo"
        accept={ACCEPT}
        className="hidden"
        tabIndex={-1}
      />

      {status.kind === "idle" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <PickerCard
            label="Upload from gallery"
            tone="muted"
            accept={ACCEPT}
            onPick={handleFile}
          />
          <PickerCard
            label="Take a new photo"
            tone="accent"
            accept={ACCEPT}
            capture="environment"
            onPick={handleFile}
          />
        </div>
      )}

      {status.kind === "processing" && (
        <div className="flex items-center gap-3 rounded-md border border-brand-border bg-brand-bg p-4">
          <Spinner />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-brand-text">
              Processing photo&hellip;
            </p>
            <p className="text-xs text-brand-muted">
              {status.original.name} &middot; {formatBytes(status.original.size)} &middot;
              compressing for upload
            </p>
          </div>
        </div>
      )}

      {status.kind === "ready" && (
        <div className="flex items-start gap-4 rounded-md border border-brand-green/40 bg-brand-green/5 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={status.previewUrl}
            alt="Photo preview"
            className="h-24 w-20 rounded border border-brand-border object-cover bg-white"
          />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-brand-green-dark">
              Photo ready &middot; {formatBytes(status.result.afterBytes)}
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              {status.result.convertedFromHeic && "Converted from iPhone HEIC. "}
              Resized to {status.result.width}&times;{status.result.height}px,
              compressed from{" "}
              {formatBytes(status.result.beforeBytes)}.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 text-xs font-medium text-brand-blue hover:underline"
            >
              Change photo
            </button>
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-semibold text-red-700">Couldn&apos;t process that photo</p>
          <p className="mt-1 text-red-700">{status.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs font-medium text-brand-blue hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function PickerCard({
  label,
  tone,
  accept,
  capture,
  onPick,
}: {
  label: string;
  tone: "muted" | "accent";
  accept: string;
  capture?: "environment" | "user";
  onPick: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cardClasses =
    tone === "accent"
      ? "border-brand-green/40 bg-brand-green/5 hover:bg-brand-green/10"
      : "border-brand-border bg-brand-surface hover:bg-brand-bg";
  const iconColor =
    tone === "accent" ? "text-brand-green-dark" : "text-brand-muted";

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors ${cardClasses}`}
    >
      <Icon kind={capture ? "camera" : "gallery"} className={`h-7 w-7 ${iconColor}`} />
      <span className="text-sm font-semibold text-brand-text">{label}</span>
      <span className="text-[11px] text-brand-muted">Tap to choose</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-brand-blue"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Icon({ kind, className }: { kind: "camera" | "gallery"; className?: string }) {
  if (kind === "camera") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 7h3l2-3h8l2 3h3v12H3V7z" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" strokeLinejoin="round" />
    </svg>
  );
}

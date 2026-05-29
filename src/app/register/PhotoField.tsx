"use client";

// Two-mode photo input: pick from gallery OR launch rear camera.
// Compresses + previews before submit. Defensive:
//  - 12-second per-step timeout in compressImage; on failure we
//    pass through the original file with a clear warning so the
//    student is never stuck on a spinner.
//  - "Use anyway" button if processing is taking long.

import { useEffect, useRef, useState } from "react";
import { compressImage, formatBytes, type CompressResult } from "@/lib/image-compress";

type Status =
  | { kind: "idle" }
  | { kind: "processing"; original: File; startedAt: number }
  | { kind: "ready"; result: CompressResult; previewUrl: string }
  | { kind: "error"; message: string };

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function PhotoField({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Used by the "Use anyway" escape hatch when processing is slow.
  const fallbackRef = useRef<File | null>(null);
  // Tick counter so the "elapsed seconds" label re-renders during processing.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status.kind !== "processing") return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [status.kind]);

  // Hard auto-fallback: if processing has been going for 8 seconds, force
  // the original through. The student is never trapped, even if they
  // didn't see the manual button.
  useEffect(() => {
    if (status.kind !== "processing") return;
    const elapsed = Date.now() - status.startedAt;
    if (elapsed >= 8000) {
      // eslint-disable-next-line no-console
      console.warn(
        "[PhotoField] auto-fallback at 8s - using original file"
      );
      useOriginalAnyway();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status]);

  useEffect(() => {
    if (status.kind === "ready") onChange(status.result.file);
    else onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    return () => {
      if (status.kind === "ready") URL.revokeObjectURL(status.previewUrl);
    };
  }, [status]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    fallbackRef.current = file;
    setStatus({ kind: "processing", original: file, startedAt: Date.now() });
    try {
      const result = await compressImage(file);
      const previewUrl = URL.createObjectURL(result.file);
      setStatus({ kind: "ready", result, previewUrl });
    } catch (e) {
      // compressImage shouldn't throw anymore, but if it does, fall back.
      const message =
        e instanceof Error ? e.message : "Could not process this photo.";
      // eslint-disable-next-line no-console
      console.error("[PhotoField] compress threw:", e);
      const previewUrl = URL.createObjectURL(file);
      setStatus({
        kind: "ready",
        result: {
          file,
          beforeBytes: file.size,
          afterBytes: file.size,
          width: 0,
          height: 0,
          convertedFromHeic: false,
          compressionSkipped: true,
          skipReason: message,
        },
        previewUrl,
      });
    }
  }

  function useOriginalAnyway() {
    const f = fallbackRef.current;
    if (!f) return;
    const previewUrl = URL.createObjectURL(f);
    setStatus({
      kind: "ready",
      result: {
        file: f,
        beforeBytes: f.size,
        afterBytes: f.size,
        width: 0,
        height: 0,
        convertedFromHeic: false,
        compressionSkipped: true,
        skipReason: "User chose to skip compression",
      },
      previewUrl,
    });
  }

  function reset() {
    setStatus({ kind: "idle" });
    fallbackRef.current = null;
  }

  const elapsed =
    status.kind === "processing"
      ? Math.floor((Date.now() - status.startedAt) / 1000)
      : 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tickKeeper = tick; // keep tick in closure so re-renders fire

  return (
    <div className="space-y-3">
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
        <div className="rounded-md border border-brand-border bg-brand-bg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Spinner />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-brand-text">
                Processing photo&hellip; {elapsed > 0 && `(${elapsed}s)`}
              </p>
              <p className="text-xs text-brand-muted">
                {status.original.name} &middot; {formatBytes(status.original.size)}
              </p>
            </div>
          </div>
          {/* Escape hatch appears at 2 seconds - tap to skip compression. */}
          {elapsed >= 2 && (
            <button
              type="button"
              onClick={useOriginalAnyway}
              className="w-full rounded-md bg-brand-green px-4 py-3 text-base font-bold text-white hover:bg-brand-green-dark active:scale-[0.98] shadow-md"
            >
              ⚡ Tap here to use photo NOW
            </button>
          )}
          {elapsed >= 2 && (
            <p className="text-xs text-center text-brand-muted">
              Skip the wait - photo will upload at original size
            </p>
          )}
        </div>
      )}

      {status.kind === "ready" && (
        <div
          className={`flex items-start gap-4 rounded-md border p-4 ${
            status.result.compressionSkipped
              ? "border-amber-300 bg-amber-50"
              : "border-brand-green/40 bg-brand-green/5"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={status.previewUrl}
            alt="Photo preview"
            className="h-24 w-20 rounded border border-brand-border object-cover bg-white"
          />
          <div className="flex-1 text-sm">
            <p
              className={`font-semibold ${
                status.result.compressionSkipped
                  ? "text-amber-900"
                  : "text-brand-green-dark"
              }`}
            >
              Photo ready &middot; {formatBytes(status.result.afterBytes)}
            </p>
            {status.result.compressionSkipped ? (
              <p className="mt-1 text-xs text-amber-800">
                Uploading original size. Submit should still work.
              </p>
            ) : (
              <p className="mt-1 text-xs text-brand-muted">
                {status.result.convertedFromHeic && "Converted from iPhone HEIC. "}
                Resized to {status.result.width}&times;{status.result.height}px,
                compressed from {formatBytes(status.result.beforeBytes)}.
              </p>
            )}
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
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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

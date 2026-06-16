"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { StudyMaterial, StudyMaterialSlide } from "@/generated/prisma/client";

interface SlideViewerProps {
  material: StudyMaterial;
  slides: StudyMaterialSlide[];
  internId: string;
  internEmail: string;
  lastSlideViewed: number;
  slideUrls: Record<number, string>; // slideNumber → /api/intern/slide?...
}

export function SlideViewer({
  material,
  slides,
  internId,
  internEmail,
  lastSlideViewed,
  slideUrls,
}: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(lastSlideViewed);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const slide = slides[currentSlide - 1];

  const logView = useCallback(async (slideNum: number) => {
    try {
      await fetch("/api/intern/materials/view-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: material.id, slideNumber: slideNum }),
      });
    } catch { /* non-critical */ }
  }, [material.id]);

  // Load slide image and burn watermark onto canvas
  useEffect(() => {
    if (!slide) return;

    const url = slideUrls[slide.slideNumber];
    if (!url) {
      setIsLoading(false);
      setLoadError(true);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    setWatermarkedImage(null);

    const img = new Image();
    // Same-origin proxy URL — no crossOrigin attribute needed, canvas won't be tainted
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Watermark: email + timestamp at bottom
      const timestamp = new Date().toLocaleString("en-IN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      const watermarkText = `${internEmail} • ${timestamp}`;
      const fontSize = Math.max(Math.floor(img.height / 25), 14);
      ctx.font = `${fontSize}px monospace`;
      const padding = 10;
      const boxHeight = fontSize + padding * 2;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(0, img.height - boxHeight, img.width, boxHeight);
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.fillText(watermarkText, padding, img.height - padding - fontSize / 4);

      setWatermarkedImage(canvas.toDataURL("image/jpeg", 0.92));
      setIsLoading(false);
      logView(currentSlide);
    };

    img.onerror = () => {
      console.error("Slide failed to load:", url);
      setIsLoading(false);
      setLoadError(true);
    };

    img.src = url;
  }, [slide, currentSlide, internEmail, logView, slideUrls]);

  // Update reading progress
  useEffect(() => {
    fetch("/api/intern/materials/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId: material.id,
        lastSlide: currentSlide,
        slidesViewed: currentSlide,
      }),
    }).catch(() => {});
  }, [currentSlide, material.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentSlide > 1) setCurrentSlide((p) => p - 1);
      else if (e.key === "ArrowRight" && currentSlide < slides.length) setCurrentSlide((p) => p + 1);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSlide, slides.length]);

  // Fullscreen change
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    try {
      if (!document.fullscreenElement) await viewerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* fullscreen not supported */ }
  };

  const progress = Math.round((currentSlide / slides.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <Link href="/intern/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-1 text-xl font-bold text-white">{material.title}</h1>
          </div>
          <div className="text-sm text-gray-400">Slide {currentSlide} of {slides.length}</div>
        </div>
      </header>

      {/* Viewer */}
      <div
        ref={viewerRef}
        className={`flex-1 flex items-center justify-center bg-black p-4 ${isFullscreen ? "p-0" : ""}`}
      >
        <div className="relative w-full max-w-4xl">
          {/* Hidden canvas for watermarking */}
          <canvas ref={canvasRef} className="hidden" />

          {isLoading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3 text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-sm text-gray-400">Loading slide {currentSlide}…</p>
            </div>
          ) : loadError ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <p className="text-red-400">Failed to load slide</p>
              <button
                onClick={() => { setLoadError(false); setIsLoading(true); }}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : watermarkedImage ? (
            <>
              <img
                src={watermarkedImage}
                alt={`Slide ${currentSlide}`}
                className="w-full rounded-lg shadow-2xl"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {!isFullscreen && (
                <>
                  {currentSlide > 1 && (
                    <button
                      onClick={() => setCurrentSlide((p) => p - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition"
                    >←</button>
                  )}
                  {currentSlide < slides.length && (
                    <button
                      onClick={() => setCurrentSlide((p) => p + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition"
                    >→</button>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <footer className="border-t border-gray-700 bg-gray-900 px-6 py-4">
          <div className="mx-auto max-w-6xl space-y-3">
            <div className="h-1 w-full rounded-full bg-gray-700 overflow-hidden">
              <div className="h-full bg-brand-green transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">{currentSlide} / {slides.length} • {progress}% complete</div>
              <div className="flex gap-3">
                <button
                  onClick={() => currentSlide > 1 && setCurrentSlide((p) => p - 1)}
                  disabled={currentSlide === 1}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >← Previous</button>
                <button
                  onClick={toggleFullscreen}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                >⛶ Fullscreen</button>
                <button
                  onClick={() => currentSlide < slides.length && setCurrentSlide((p) => p + 1)}
                  disabled={currentSlide === slides.length}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >Next →</button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              💡 Use arrow keys to navigate. Press F for fullscreen. Your views are logged for attendance tracking.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

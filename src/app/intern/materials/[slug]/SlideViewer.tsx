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
  signedUrls: Record<string, string>;
}

export function SlideViewer({
  material,
  slides,
  internId,
  internEmail,
  lastSlideViewed,
  signedUrls,
}: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(lastSlideViewed);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const slide = slides[currentSlide - 1];

  // Log view to backend
  const logView = useCallback(async (slideNum: number) => {
    try {
      await fetch("/api/intern/materials/view-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: material.id,
          slideNumber: slideNum,
        }),
      });
    } catch (err) {
      console.error("Failed to log view:", err);
    }
  }, [material.id]);

  // Create watermarked image
  useEffect(() => {
    if (!slide) return;

    const loadAndWatermark = async () => {
      setIsLoading(true);
      try {
        // Use server-generated signed URL (works for private buckets)
        const url = signedUrls[slide.imagePath];
        if (!url) {
          console.error("No signed URL for slide:", slide.imagePath);
          setIsLoading(false);
          return;
        }

        // Load image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Add watermark
          const timestamp = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          const watermarkText = `${internEmail} • ${timestamp}`;

          // Semi-transparent white box at bottom
          const fontSize = Math.max(Math.floor(img.height / 25), 14);
          ctx.font = `${fontSize}px monospace`;
          const textMetrics = ctx.measureText(watermarkText);
          const padding = 10;
          const boxHeight = fontSize + padding * 2;

          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillRect(0, img.height - boxHeight, img.width, boxHeight);

          // White text
          ctx.fillStyle = "#000000";
          ctx.textAlign = "left";
          ctx.fillText(watermarkText, padding, img.height - padding - (fontSize / 2 - 5));

          // Convert to data URL
          setWatermarkedImage(canvas.toDataURL());
          setIsLoading(false);

          // Log the view
          logView(currentSlide);
        };

        img.onerror = () => {
          console.error("Failed to load image");
          setIsLoading(false);
        };

        img.src = url;
      } catch (err) {
        console.error("Error loading slide:", err);
        setIsLoading(false);
      }
    };

    loadAndWatermark();
  }, [slide, currentSlide, internEmail, logView, signedUrls]);

  // Update progress
  useEffect(() => {
    const updateProgress = async () => {
      try {
        await fetch("/api/intern/materials/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId: material.id,
            lastSlide: currentSlide,
            slidesViewed: currentSlide,
          }),
        });
      } catch (err) {
        console.error("Failed to update progress:", err);
      }
    };

    updateProgress();
  }, [currentSlide, material.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentSlide > 1) {
        setCurrentSlide((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentSlide < slides.length) {
        setCurrentSlide((prev) => prev + 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentSlide, slides.length]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await viewerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen request failed:", err);
    }
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
          <div className="text-sm text-gray-400">
            Slide {currentSlide} of {slides.length}
          </div>
        </div>
      </header>

      {/* Viewer */}
      <div
        ref={viewerRef}
        className={`flex-1 flex items-center justify-center bg-black p-4 ${
          isFullscreen ? "p-0" : ""
        }`}
      >
        <div className="relative w-full max-w-4xl">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center text-white">
              <p>Loading slide...</p>
            </div>
          ) : watermarkedImage ? (
            <>
              {/* Canvas (hidden, used for watermarking) */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Display watermarked image */}
              <img
                src={watermarkedImage}
                alt={`Slide ${currentSlide}`}
                className="w-full rounded-lg shadow-2xl"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Navigation Overlays */}
              {!isFullscreen && (
                <>
                  {/* Previous Button */}
                  {currentSlide > 1 && (
                    <button
                      onClick={() => setCurrentSlide((prev) => prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition"
                      title="Previous slide (← arrow key)"
                    >
                      ←
                    </button>
                  )}

                  {/* Next Button */}
                  {currentSlide < slides.length && (
                    <button
                      onClick={() => setCurrentSlide((prev) => prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition"
                      title="Next slide (→ arrow key)"
                    >
                      →
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex h-96 items-center justify-center text-red-400">
              <p>Failed to load slide</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      {!isFullscreen && (
        <footer className="border-t border-gray-700 bg-gray-900 px-6 py-4">
          <div className="mx-auto max-w-6xl space-y-3">
            {/* Progress Bar */}
            <div className="h-1 w-full rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-brand-green transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {currentSlide} / {slides.length} • {progress}% complete
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => currentSlide > 1 && setCurrentSlide((prev) => prev - 1)}
                  disabled={currentSlide === 1}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                  title="Fullscreen (f key)"
                >
                  ⛶ Fullscreen
                </button>

                <button
                  onClick={() => currentSlide < slides.length && setCurrentSlide((prev) => prev + 1)}
                  disabled={currentSlide === slides.length}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
              💡 Use arrow keys to navigate. Press F for fullscreen. Your views are logged for attendance tracking.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

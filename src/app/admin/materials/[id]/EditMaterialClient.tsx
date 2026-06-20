"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import {
  updateMaterialAction,
  deleteSlideAction,
  addSlidesAction,
  deleteMaterialAction,
} from "./actions";

const DEPARTMENT_OPTIONS = [
  { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { value: "MBA_HR", label: "MBA HR" },
];

async function compressSlide(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_W = 1280;
      const scale = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

type Slide = { id: string; slideNumber: number; imagePath: string; signedUrl: string };

type Props = {
  material: {
    id: string;
    title: string;
    description: string | null;
    audienceDepartments: string | null;
    displayOrder: number;
    isActive: boolean;
  };
  slides: Slide[];
};

export function EditMaterialClient({ material, slides: initialSlides }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCompressing, setIsCompressing] = useState(false);
  const [slides, setSlides] = useState(initialSlides);

  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description ?? "");
  const [targetDepts, setTargetDepts] = useState<string[]>(
    material.audienceDepartments ? material.audienceDepartments.split(",").filter(Boolean) : []
  );
  const [displayOrder, setDisplayOrder] = useState(String(material.displayOrder));
  const [isActive, setIsActive] = useState(material.isActive);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const toggleDept = (dept: string) =>
    setTargetDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("targetDepts", targetDepts.join(","));
      fd.append("displayOrder", displayOrder);
      fd.append("isActive", String(isActive));

      const result = await updateMaterialAction(material.id, fd);
      if (result.success) {
        toast.success("Module saved.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Save failed");
      }
    });
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!confirm("Delete this slide? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteSlideAction(slideId, material.id);
      if (result.success) {
        setSlides((prev) =>
          prev
            .filter((s) => s.id !== slideId)
            .map((s, i) => ({ ...s, slideNumber: i + 1 }))
        );
        toast.success("Slide deleted.");
      } else {
        toast.error(result.error ?? "Delete failed");
      }
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!raw.length) return;

    setIsCompressing(true);
    toast.info(`Compressing ${raw.length} slide(s)…`);
    const compressed = await Promise.all(raw.map(compressSlide));
    setNewFiles((prev) => [...prev, ...compressed]);
    compressed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    toast.success(`${compressed.length} slide(s) ready to upload.`);
    setIsCompressing(false);
  };

  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, j) => j !== i));
    setNewPreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleUploadNew = () => {
    if (!newFiles.length) return;
    startTransition(async () => {
      const fd = new FormData();
      newFiles.forEach((f, i) => fd.append(`slide_${i}`, f));
      const result = await addSlidesAction(material.id, fd);
      if (result.success) {
        toast.success(`${result.added} slide(s) uploaded. Refreshing…`);
        setNewFiles([]);
        setNewPreviews([]);
        router.refresh();
      } else {
        toast.error(result.error ?? "Upload failed");
      }
    });
  };

  const handleDeleteModule = () => {
    if (!confirm(`Delete the entire module "${title}"? All slides will be removed. This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteMaterialAction(material.id);
      if (result.success) {
        toast.success("Module deleted.");
        router.push("/admin/materials");
      } else {
        toast.error("Delete failed");
      }
    });
  };

  const busy = isPending || isCompressing;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Module details */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-semibold text-brand-text mb-5">Module details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              rows={3}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Display order</label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Status</label>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                disabled={busy}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isActive ? "✓ Active" : "✗ Archived"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              Target departments
              <span className="ml-1 text-xs font-normal text-brand-muted">(leave blank = all interns)</span>
            </label>
            <div className="flex gap-4 mt-1">
              {DEPARTMENT_OPTIONS.map((d) => (
                <label key={d.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={targetDepts.includes(d.value)}
                    onChange={() => toggleDept(d.value)}
                    disabled={busy}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3 border-t border-brand-border pt-5">
          <Button onClick={handleSave} disabled={busy}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/materials")} disabled={busy}>
            Back to list
          </Button>
        </div>
      </section>

      {/* Existing slides */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-semibold text-brand-text mb-1">
          Slides
          <span className="ml-2 text-sm font-normal text-brand-muted">({slides.length})</span>
        </h2>
        {slides.length === 0 ? (
          <p className="mt-4 text-sm text-brand-muted">No slides yet — upload some below.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {slides.map((slide) => (
              <div key={slide.id} className="relative rounded-lg overflow-hidden border border-brand-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.signedUrl}
                  alt={`Slide ${slide.slideNumber}`}
                  className="h-20 w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                  <span className="text-white text-xs font-bold">#{slide.slideNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id)}
                    disabled={busy}
                    className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
                <div className="bg-brand-bg px-2 py-0.5 text-[10px] text-brand-muted font-medium">
                  #{slide.slideNumber}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add more slides */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-semibold text-brand-text mb-4">Add more slides</h2>
        <div className="rounded-lg border-2 border-dashed border-brand-border p-5 text-center">
          <input
            id="new-slide-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            disabled={busy}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("new-slide-input")?.click()}
            disabled={busy}
          >
            {isCompressing ? "Compressing…" : "Select images"}
          </Button>
          <p className="mt-2 text-xs text-brand-muted">
            Auto-compressed to max 1280 px / JPEG 85%
          </p>
        </div>
        {newFiles.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-3">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-brand-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`New slide ${i + 1}`} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    disabled={busy}
                    className="absolute top-1 right-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={handleUploadNew} disabled={busy} className="mt-4">
              {isPending ? "Uploading…" : `Upload ${newFiles.length} slide(s)`}
            </Button>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Danger zone</h2>
        <p className="text-xs text-red-600 mb-4">
          Deleting this module removes all slides from storage and cannot be undone.
        </p>
        <Button
          variant="outline"
          onClick={handleDeleteModule}
          disabled={busy}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Delete entire module
        </Button>
      </section>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { createMaterialAction } from "@/lib/admin/materials-action";

const DEPARTMENT_OPTIONS = [
  { value: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { value: "MBA_HR", label: "MBA HR" },
];

// Resize to max 1280px wide and re-encode as JPEG 85% quality.
// Turns a 2 MB PNG slide into ~150–300 KB — ~8× smaller.
async function compressSlide(file: File): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 1280;
      const scale = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          );
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MaterialForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCompressing, setIsCompressing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDepts, setTargetDepts] = useState<string[]>([]);
  const [displayOrder, setDisplayOrder] = useState("0");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [originalSizes, setOriginalSizes] = useState<number[]>([]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = ""; // allow re-selecting same files
    if (rawFiles.length === 0) {
      toast.error("Please select image files (PNG, JPG, etc.)");
      return;
    }

    setIsCompressing(true);
    toast.info(`Compressing ${rawFiles.length} slide(s)…`);

    const origSizes = rawFiles.map((f) => f.size);
    const compressed = await Promise.all(rawFiles.map(compressSlide));

    setFiles((prev) => [...prev, ...compressed]);
    setOriginalSizes((prev) => [...prev, ...origSizes]);

    compressed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });

    const totalOrig = origSizes.reduce((a, b) => a + b, 0);
    const totalComp = compressed.reduce((a, f) => a + f.size, 0);
    const saving = Math.round((1 - totalComp / totalOrig) * 100);
    toast.success(
      `${compressed.length} slide(s) added · ${formatBytes(totalOrig)} → ${formatBytes(totalComp)} (${saving}% smaller)`
    );
    setIsCompressing(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setOriginalSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDept = (dept: string) => {
    setTargetDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (files.length === 0) { toast.error("Please select at least one slide image"); return; }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("targetDepts", targetDepts.join(","));
      formData.append("displayOrder", displayOrder);
      files.forEach((file, i) => formData.append(`slide_${i}`, file));

      const result = await createMaterialAction(formData);
      if (result.success) {
        toast.success("Module created successfully!");
        router.push("/admin/materials");
      } else {
        toast.error(result.error || "Failed to create module");
      }
    });
  };

  const busy = isPending || isCompressing;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-brand-border bg-brand-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-brand-text">Module Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text">Title *</label>
            <Input
              type="text"
              placeholder="e.g., Digital Marketing Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text">Description</label>
            <Textarea
              placeholder="Optional: brief description of this module"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text">Target Departments</label>
            <p className="mt-1 text-xs text-brand-muted">
              Leave unchecked to make available to all departments
            </p>
            <div className="mt-3 space-y-2">
              {DEPARTMENT_OPTIONS.map((dept) => (
                <label key={dept.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={targetDepts.includes(dept.value)}
                    onChange={() => toggleDept(dept.value)}
                    disabled={busy}
                  />
                  <span className="text-sm text-brand-text">{dept.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text">Display Order</label>
            <Input
              type="number"
              placeholder="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* File Upload */}
          <div className="mt-6 border-t border-brand-border pt-6">
            <h3 className="mb-1 font-semibold text-brand-text">Slide Images *</h3>
            <p className="mb-4 text-xs text-brand-muted">
              Images are automatically compressed to max 1280 px / JPEG 85% before upload — typically 5–10× smaller than raw PNGs.
            </p>
            <div className="rounded-lg border-2 border-dashed border-brand-border p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                disabled={busy}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button
                  type="button"
                  onClick={() => document.getElementById("file-input")?.click()}
                  disabled={busy}
                >
                  {isCompressing ? "Compressing…" : "Select Images"}
                </Button>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-brand-text">
                  {files.length} slide{files.length === 1 ? "" : "s"} ready ·{" "}
                  <span className="text-brand-muted">
                    {formatBytes(files.reduce((a, f) => a + f.size, 0))} total
                  </span>
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt={`Slide ${i + 1}`}
                        className="h-24 w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={busy}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 flex justify-between items-center">
                        <p className="text-xs text-white">#{i + 1}</p>
                        <p className="text-xs text-green-400">{formatBytes(files[i].size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-brand-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || files.length === 0}>
              {isPending ? "Creating…" : "Create Module"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

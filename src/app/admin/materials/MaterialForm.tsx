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

export function MaterialForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Material metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDepts, setTargetDepts] = useState<string[]>([]);
  const [displayOrder, setDisplayOrder] = useState("0");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) {
      toast.error("Please select image files (PNG, JPG, etc.)");
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Generate previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`Added ${newFiles.length} image(s)`);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDept = (dept: string) => {
    setTargetDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one slide image");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("targetDepts", targetDepts.join(","));
      formData.append("displayOrder", displayOrder);

      files.forEach((file, i) => {
        formData.append(`slide_${i}`, file);
      });

      const result = await createMaterialAction(formData);

      if (result.success) {
        toast.success("Module created successfully!");
        router.push("/admin/materials");
      } else {
        toast.error(result.error || "Failed to create module");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Metadata Section */}
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
              disabled={isPending}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text">Description</label>
            <Textarea
              placeholder="Optional: brief description of this module"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
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
                    disabled={isPending}
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
              disabled={isPending}
            />
          </div>

          {/* File Upload */}
          <div className="mt-6 border-t border-brand-border pt-6">
            <h3 className="mb-4 font-semibold text-brand-text">Slide Images *</h3>
            <div className="rounded-lg border-2 border-dashed border-brand-border p-6 text-center">
              <p className="text-sm text-brand-muted mb-3">
                Upload slide images in order (PNG, JPG, GIF, WebP)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                disabled={isPending}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button
                  type="button"
                  onClick={() => document.getElementById("file-input")?.click()}
                  disabled={isPending}
                >
                  Select Images
                </Button>
              </label>
            </div>

            {/* Preview */}
            {files.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-brand-text">
                  {files.length} slide{files.length === 1 ? "" : "s"} ready
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
                          disabled={isPending}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                        <p className="text-xs text-white">Slide {i + 1}</p>
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || files.length === 0}>
              {isPending ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

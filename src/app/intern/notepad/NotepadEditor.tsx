"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface NotepadEditorProps {
  initialContent: string;
  internId: string;
}

export function NotepadEditor({ initialContent, internId }: NotepadEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [charCount, setCharCount] = useState(initialContent.length);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save function
  const saveNotepad = useCallback(async (textContent: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/intern/notepad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textContent,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      } else {
        console.error("Failed to save notepad");
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle content change with debounced auto-save
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharCount(newContent.length);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (30 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      saveNotepad(newContent);
    }, 30000);
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save on unmount
      if (content !== initialContent) {
        saveNotepad(content);
      }
    };
  }, [content, initialContent, saveNotepad]);

  // Keyboard shortcut: Ctrl+S to save immediately
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveNotepad(content);
        toast.success("Saved!");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [content, saveNotepad]);

  const wordCount = content.trim().split(/\s+/).filter((word) => word.length > 0).length;
  const lineCount = content.split("\n").length;

  return (
    <div className="space-y-4">
      {/* Editor */}
      <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden shadow-sm">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Start typing your notes here... They'll auto-save every 30 seconds. Or press Ctrl+S to save immediately."
          className="w-full h-96 p-6 resize-none border-0 outline-none bg-brand-surface text-brand-text placeholder-brand-muted font-mono text-sm"
          spellCheck="true"
        />
      </div>

      {/* Stats & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-sm text-brand-muted">
          <div>
            <span className="font-medium text-brand-text">{charCount}</span> characters
          </div>
          <div>
            <span className="font-medium text-brand-text">{wordCount}</span> words
          </div>
          <div>
            <span className="font-medium text-brand-text">{lineCount}</span> lines
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="text-xs text-brand-muted">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-brand-muted">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Saving...
            </div>
          )}
          <button
            onClick={() => saveNotepad(content)}
            disabled={isSaving}
            className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Now"}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
        <p className="text-xs text-brand-muted">
          💡 <strong>Tips:</strong> Your notes are private and only visible to you. Use this space to
          record learnings, tasks, and reflections during your internship. Auto-save happens every 30
          seconds — press Ctrl+S to save immediately.
        </p>
      </div>
    </div>
  );
}

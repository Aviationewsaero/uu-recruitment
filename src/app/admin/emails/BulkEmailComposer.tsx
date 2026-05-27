"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { FormField, Label, FieldError, FieldHint } from "@/components/ui/Form";
import { STATUS_OPTIONS } from "@/lib/admin/student-filters";
import { previewAudienceAction, sendBulkAction } from "@/lib/admin/bulk-email";

export function BulkEmailComposer({
  courses,
  semesters,
}: {
  courses: string[];
  semesters: string[];
}) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [preview, setPreview] = useState<{
    count: number;
    sample: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audience = { status, course, semester };

  const doPreview = () =>
    start(async () => {
      setError(null);
      try {
        const p = await previewAudienceAction(audience);
        setPreview(p);
        if (p.count === 0)
          toast.warning("No students match this audience");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preview failed");
      }
    });

  const doSend = () => {
    if (!preview || preview.count === 0) {
      setError("Preview the audience first");
      return;
    }
    if (
      !confirm(
        `Send "${subject}" to ${preview.count} student${preview.count === 1 ? "" : "s"}? This cannot be undone.`
      )
    )
      return;
    start(async () => {
      setError(null);
      const r = await sendBulkAction({ audience, subject, htmlBody });
      if (!r.ok) {
        setError(r.error);
        toast.error(r.error);
        return;
      }
      toast.success(
        `Sent ${r.sent}${r.failed ? `, ${r.failed} failed` : ""}`
      );
      setSubject("");
      setHtmlBody("");
      setPreview(null);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* LEFT — composer */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-semibold text-brand-text">Message</h2>
        <div className="mt-4 space-y-4">
          <FormField>
            <Label required>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Update on your recruitment status"
            />
          </FormField>
          <FormField>
            <Label required>Body (HTML allowed)</Label>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
              placeholder={`Dear student,\n\nThank you for participating in the recruitment drive…\n\n<p><strong>Use HTML</strong> for formatting.</p>`}
            />
            <FieldHint>
              Email is wrapped in the EWS brand shell automatically. Use{" "}
              <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>,{" "}
              <code>&lt;a href&gt;</code> as needed.
            </FieldHint>
          </FormField>
        </div>
      </section>

      {/* RIGHT — audience + send */}
      <aside className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-base font-semibold text-brand-text">Audience</h2>
        <div className="mt-4 space-y-4">
          <FormField>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label>Course</Label>
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label>Semester</Label>
            <Select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">All semesters</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={doPreview}
            disabled={pending}
          >
            {pending ? "Counting…" : "Preview audience"}
          </Button>

          {preview && (
            <div className="rounded-md bg-brand-bg border border-brand-border p-3 text-xs">
              <p className="font-semibold text-brand-text">
                {preview.count.toLocaleString()} recipient
                {preview.count === 1 ? "" : "s"}
              </p>
              {preview.sample.length > 0 && (
                <p className="mt-1 text-brand-muted truncate">
                  e.g. {preview.sample.slice(0, 3).join(", ")}
                  {preview.count > 3 && ` and ${preview.count - 3} more…`}
                </p>
              )}
            </div>
          )}

          <FieldError message={error ?? undefined} />

          <Button
            type="button"
            className="w-full"
            onClick={doSend}
            disabled={pending || !preview}
          >
            {pending ? "Sending…" : "Send to audience →"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { FormField, Label, FieldHint } from "@/components/ui/Form";

export function ReportForm({ defaultDate }: { defaultDate: string }) {
  const [driveDate, setDriveDate] = useState(defaultDate);
  const [driveTitle, setDriveTitle] = useState(
    "UU Aviation Recruitment Drive 2026"
  );
  const [university, setUniversity] = useState(
    "Uttaranchal University, Dehradun"
  );
  const [notes, setNotes] = useState("");

  // Build the download URL with our form values as query params. The
  // PDF endpoint reads these to populate the cover sheet.
  const params = new URLSearchParams();
  if (driveDate.trim()) params.set("driveDate", driveDate.trim());
  if (driveTitle.trim()) params.set("driveTitle", driveTitle.trim());
  if (university.trim()) params.set("university", university.trim());
  if (notes.trim()) params.set("notes", notes.trim());
  const downloadUrl = `/api/admin/status-report.pdf?${params.toString()}`;

  return (
    <div className="space-y-4">
      <FormField>
        <Label>Drive date (as it should appear on the cover)</Label>
        <Input
          value={driveDate}
          onChange={(e) => setDriveDate(e.target.value)}
          placeholder="e.g. 03 June 2026"
          maxLength={50}
        />
        <FieldHint>Defaults to today in IST. Edit freely.</FieldHint>
      </FormField>

      <FormField>
        <Label>Report title</Label>
        <Input
          value={driveTitle}
          onChange={(e) => setDriveTitle(e.target.value)}
          maxLength={120}
        />
      </FormField>

      <FormField>
        <Label>Host university name</Label>
        <Input
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          maxLength={200}
        />
      </FormField>

      <FormField>
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional context to include on the cover sheet."
          maxLength={1000}
        />
        <FieldHint>
          Tip: mention &quot;allocation to airport locations begins August
          2026&quot; if you want to reinforce the placement timeline.
        </FieldHint>
      </FormField>

      <div className="pt-2 flex gap-3">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
        >
          Generate &amp; download PDF →
        </a>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDriveDate(defaultDate);
            setDriveTitle("UU Aviation Recruitment Drive 2026");
            setUniversity("Uttaranchal University, Dehradun");
            setNotes("");
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function QRActions({ targetUrl }: { targetUrl: string }) {
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [url, setUrl] = useState(targetUrl);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlEditor((v) => !v)}
        >
          {showUrlEditor ? "Done" : "Change URL"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(targetUrl);
            toast.success("URL copied to clipboard");
          }}
        >
          Copy URL
        </Button>
        <Button
          size="sm"
          onClick={() => window.print()}
        >
          🖨 Print / Save as PDF
        </Button>
      </div>

      {showUrlEditor && (
        <form
          className="flex gap-2 w-[500px]"
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (url && url !== targetUrl) params.set("url", url);
            window.location.search = params.toString();
          }}
        >
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Regenerate
          </Button>
        </form>
      )}
    </div>
  );
}

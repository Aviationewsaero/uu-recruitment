// Console email "sender" — for local dev. Prints a clean summary.
import type { EmailPayload } from "./index";

export async function send(payload: EmailPayload): Promise<{ id?: string }> {
  // eslint-disable-next-line no-console
  console.log(
    [
      "",
      "📨 \x1b[1;36m[MOCK EMAIL]\x1b[0m",
      `  To:      ${payload.to}`,
      `  Subject: ${payload.subject}`,
      `  ─ Body preview ─`,
      stripHtml(payload.html).slice(0, 300) +
        (payload.html.length > 300 ? "…" : ""),
      "",
    ].join("\n")
  );
  return { id: `mock_${Date.now()}` };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

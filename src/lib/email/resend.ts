// Resend email sender - prod.
import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailPayload } from "./index";

let _client: Resend | undefined;
function client() {
  if (!_client) _client = new Resend(env.RESEND_API_KEY);
  return _client;
}

// Resend's HTTP layer (undici) enforces ByteString (chars 0-255) on header
// fields including subject and from. A stray em-dash (U+2014) or smart quote
// crashes the send with "Cannot convert argument to a ByteString…". Common
// offenders: em-dash, en-dash, smart quotes, ellipsis, accented chars.
//
// Defensive sanitiser: replace the known typographic chars with ASCII
// equivalents, then strip anything else above 255 as a backstop. We keep
// the HTML body untouched - that goes as JSON, not headers, and can carry
// any UTF-8 freely.
const ASCII_REPLACEMENTS: Record<string, string> = {
  "—": "-", // em dash
  "–": "-", // en dash
  "‘": "'", // left single quote
  "’": "'", // right single quote
  "“": '"', // left double quote
  "”": '"', // right double quote
  "…": "...", // horizontal ellipsis
  " ": " ", // non-breaking space
  " ": " ", // narrow no-break space
  "​": "", // zero-width space
  "‌": "", // zero-width non-joiner
  "‍": "", // zero-width joiner
  "﻿": "", // zero-width no-break space / BOM
};

function sanitiseHeaderValue(s: string | undefined): string {
  if (!s) return "";
  let out = s;
  for (const [from, to] of Object.entries(ASCII_REPLACEMENTS)) {
    out = out.split(from).join(to);
  }
  // Strip any remaining char > 0xFF (e.g. emoji) as a backstop. They never
  // belong in From/Subject for deliverability anyway.
  out = Array.from(out)
    .filter((ch) => ch.codePointAt(0)! <= 0xff)
    .join("");
  return out.trim();
}

/** Render a string as a hex-codepoint trail, e.g. "A-B" -> "A(41) -(2D) B(42)".
 *  Used in the error path so we can see EXACTLY what high-codepoint char
 *  is still slipping through after sanitisation. */
function debugCodepoints(s: string): string {
  return Array.from(s)
    .map((ch) => `${ch}(${ch.codePointAt(0)!.toString(16).toUpperCase()})`)
    .join(" ");
}

export async function send(payload: EmailPayload): Promise<{ id?: string }> {
  const from = sanitiseHeaderValue(env.EMAIL_FROM);
  const replyTo = sanitiseHeaderValue(env.EMAIL_REPLY_TO);
  const subject = sanitiseHeaderValue(payload.subject);
  const to = sanitiseHeaderValue(payload.to);

  try {
    const { data, error } = await client().emails.send({
      from,
      to,
      replyTo,
      subject,
      html: payload.html, // body stays UTF-8 - JSON-encoded, no ByteString limit
      text: payload.text,
    });
    if (error) throw new Error(error.message);
    return { id: data?.id };
  } catch (e) {
    // Re-throw with a much more helpful message that includes a codepoint
    // trail of every header field, so the diagnostic page (and Vercel logs)
    // surface exactly where the offending char lives.
    const orig = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${orig}\n` +
        `  from   : ${debugCodepoints(from)}\n` +
        `  to     : ${debugCodepoints(to)}\n` +
        `  replyTo: ${debugCodepoints(replyTo)}\n` +
        `  subject: ${debugCodepoints(subject)}`
    );
  }
}

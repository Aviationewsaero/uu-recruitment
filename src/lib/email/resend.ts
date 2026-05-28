// Resend email sender - prod.
import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailPayload } from "./index";

let _client: Resend | undefined;
function client() {
  if (!_client) {
    // Sanitise the API key too - if someone pasted it from a Notes/Word/
    // Slack message, smart quotes or em-dashes could've snuck in.
    const cleanKey = sanitiseHeaderValue(env.RESEND_API_KEY);
    _client = new Resend(cleanKey);
  }
  return _client;
}

/** Find the first codepoint > 0xFF in a string. Returns null if all-ASCII. */
function firstHighCodepoint(s: string): { index: number; cp: number; ch: string } | null {
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i)!;
    if (cp > 0xff) return { index: i, cp, ch: s[i] };
  }
  return null;
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
  // The HTML body is supposed to be JSON-safe UTF-8, BUT undici's
  // Headers.set() trips on chars > 0xFF in some Resend SDK versions when
  // building internal headers off the body. Sanitise defensively.
  const html = sanitiseHtmlBody(payload.html);
  const text = payload.text ? sanitiseHtmlBody(payload.text) : undefined;

  // Up-front scan of the HEADER fields (HTML body is JSON-encoded so
  // emoji etc are fine there). Surfaces a clear error BEFORE the request
  // fires if anything has a high codepoint, rather than chasing undici's
  // opaque "index N value M" trace.
  const apiKey = sanitiseHeaderValue(env.RESEND_API_KEY);
  for (const [name, value] of [
    ["RESEND_API_KEY (post-sanitise)", apiKey],
    ["from", from],
    ["to", to],
    ["replyTo", replyTo],
    ["subject", subject],
  ] as const) {
    const hit = firstHighCodepoint(value);
    if (hit) {
      throw new Error(
        `Pre-flight: field "${name}" has char > 0xFF at index ${hit.index}: ` +
          `'${hit.ch}' (U+${hit.cp.toString(16).toUpperCase()}). ` +
          `Sanitise this at the source.`
      );
    }
  }

  try {
    const { data, error } = await client().emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message);
    return { id: data?.id };
  } catch (e) {
    const orig = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${orig}\n` +
        `  apiKeyLen: ${apiKey.length}\n` +
        `  from   : ${debugCodepoints(from)}\n` +
        `  to     : ${debugCodepoints(to)}\n` +
        `  replyTo: ${debugCodepoints(replyTo)}\n` +
        `  subject: ${debugCodepoints(subject)}\n` +
        `  htmlLen: ${html.length}  htmlPreview: ${html.slice(0, 60)}…`
    );
  }
}

/** Apply the same typographic substitutions to body content so a stray
 *  em-dash in a template doesn't break the send. */
function sanitiseHtmlBody(s: string): string {
  let out = s;
  for (const [from, to] of Object.entries(ASCII_REPLACEMENTS)) {
    out = out.split(from).join(to);
  }
  return out;
}

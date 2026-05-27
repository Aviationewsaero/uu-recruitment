// Resend email sender — prod.
import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailPayload } from "./index";

let _client: Resend | undefined;
function client() {
  if (!_client) _client = new Resend(env.RESEND_API_KEY);
  return _client;
}

export async function send(payload: EmailPayload): Promise<{ id?: string }> {
  const { data, error } = await client().emails.send({
    from: env.EMAIL_FROM,
    to: payload.to,
    replyTo: env.EMAIL_REPLY_TO,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  if (error) throw new Error(error.message);
  return { id: data?.id };
}

import { Resend } from "resend";

let _resend: Resend | undefined;

export function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@example.com";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;

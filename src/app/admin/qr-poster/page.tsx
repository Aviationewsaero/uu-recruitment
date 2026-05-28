import QRCode from "qrcode";
import { requireRole } from "@/lib/auth-user";
import { env } from "@/lib/env";
import { QRActions } from "./QRActions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ url?: string; size?: string }>;

export default async function QRPosterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("SUPER_ADMIN", "DESK_OPERATOR");
  const sp = await searchParams;
  const targetUrl = sp.url || `${env.APP_URL}/register`;

  // Server-render QR as data URL (PNG, big enough for A3 print at 300dpi)
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1200,
    color: { dark: "#1E3A8A", light: "#FFFFFF" },
  });

  return (
    <>
      {/* Toolbar (hidden when printing) */}
      <div className="no-print p-6 border-b border-brand-border bg-brand-bg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-text">
            Registration QR poster
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Print on A3, mount at the registration desk. Students scan, register, get token.
          </p>
        </div>
        <QRActions targetUrl={targetUrl} />
      </div>

      {/* The printable poster — landscape A4/A3 */}
      <div className="qr-poster-page mx-auto bg-white px-12 py-10 print:p-0">
        <article className="qr-poster mx-auto max-w-[800px] border-2 border-brand-navy rounded-2xl p-10 text-center bg-white print:border-0 print:rounded-none print:max-w-none">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-brand-muted">
            <span className="inline-block h-px w-10 bg-brand-green" />
            Elite World Services
            <span className="inline-block h-px w-10 bg-brand-green" />
          </div>

          <h2 className="mt-4 text-5xl font-bold text-brand-navy leading-tight">
            Aviation Recruitment
            <br />
            <span className="text-brand-green">2026</span>
          </h2>

          <p className="mt-4 text-2xl text-brand-text font-semibold">
            Scan to register
          </p>

          {/* QR */}
          <div className="my-8 inline-block p-4 bg-white border-4 border-brand-navy rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code to register for UU Aviation Recruitment 2026"
              className="block w-[400px] h-[400px]"
            />
          </div>

          {/* Steps */}
          <ol className="text-left max-w-md mx-auto space-y-3 text-base text-brand-text">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm">
                1
              </span>
              <span>Open the camera on your phone</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm">
                2
              </span>
              <span>Point it at this QR code</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm">
                3
              </span>
              <span>Tap the link that appears</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm">
                4
              </span>
              <span>Verify your email, fill the form, get your token</span>
            </li>
          </ol>

          {/* URL fallback */}
          <div className="mt-8 pt-6 border-t border-brand-border text-sm text-brand-muted">
            <p className="mb-1">Or visit directly:</p>
            <p className="text-base font-mono text-brand-navy break-all">
              {targetUrl}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-xs text-brand-muted">
            Powered by Elite World Services · aviation@ews.aero
          </div>
        </article>
      </div>
    </>
  );
}

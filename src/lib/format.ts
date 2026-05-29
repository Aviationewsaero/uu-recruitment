// Date + time formatters that ALWAYS display in IST (Asia/Kolkata).
//
// The Next.js server runs on Vercel in UTC. `toLocaleString("en-IN")`
// uses Indian locale conventions but the underlying timezone is still
// UTC unless we pass `timeZone: "Asia/Kolkata"` explicitly. These
// helpers do that so dates rendered on the server look right to a
// student/operator in India.

const IST = "Asia/Kolkata";

/** "28 May 2026, 2:47:31 pm" — full timestamp for audit feeds, PDFs */
export function fmtIstDateTime(d: Date | string | number): string {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: IST,
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

/** "2:47 pm" — short time, for live monitor + ticker */
export function fmtIstTime(d: Date | string | number): string {
  return new Date(d).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** "2:47:31 pm" — long time, for second-precise feeds */
export function fmtIstTimeWithSeconds(d: Date | string | number): string {
  return new Date(d).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** "28 May 2026" — date only */
export function fmtIstDate(d: Date | string | number): string {
  return new Date(d).toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "14" — hour bucket (24h), used for hourly chart x-axis labels */
export function fmtIstHour(d: Date | string | number): string {
  return new Date(d).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    hour12: false,
  });
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IST_TZ = "Asia/Kolkata";

type D = Date | string | null | undefined;
const toDate = (d: Exclude<D, null | undefined>) =>
  d instanceof Date ? d : new Date(d);

/** "23 Mar 2026" in IST */
export function formatDate(d: D) {
  if (!d) return "";
  return toDate(d).toLocaleDateString("en-IN", {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "10:45 AM" in IST */
export function formatTime(d: D) {
  if (!d) return "";
  return toDate(d)
    .toLocaleTimeString("en-IN", {
      timeZone: IST_TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

export const formatDateTime = (d: D) =>
  d ? `${formatDate(d)}, ${formatTime(d)}` : "";

/** "HH:mm" (24h) → "11:00 AM" */
export function formatClock(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Today's date in IST as yyyy-MM-dd */
export function todayIst(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString(
    "en-CA",
    {
      timeZone: IST_TZ,
    },
  );
}

/** IST wall-clock "yyyy-MM-ddTHH:mm" → ISO string */
export function istLocalToIso(local: string) {
  return new Date(`${local}:00+05:30`).toISOString();
}

/** ISO → IST wall-clock "yyyy-MM-ddTHH:mm" (for datetime-local inputs) */
export function isoToIstLocal(d: D) {
  if (!d) return "";
  const s = toDate(d).toLocaleString("sv-SE", { timeZone: IST_TZ });
  return s.replace(" ", "T").slice(0, 16);
}

export function relativeTime(d: D) {
  if (!d) return "";
  const diff = toDate(d).getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 30 * 86_400_000)
    return rtf.format(Math.round(diff / 86_400_000), "day");
  return formatDate(d);
}

/** Uploaded paths are served same-origin under /uploads. */
export const imageUrl = (path?: string | null) => path ?? "";

export function waLink(phone: string, text = "") {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function prettyPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91"))
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return `+${d}`;
}

export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Date-only column → "yyyy-MM-dd". Eden parses "2026-09-27" into a Date
 * (UTC midnight), so accept both shapes. */
export function ymd(d: string | Date) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : d.slice(0, 10);
}

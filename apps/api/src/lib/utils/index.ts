/** Digits-only phone with Indian country code by default: "98765 43210" → "919876543210". */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0"))
    return `91${digits.slice(1)}`;
  return digits;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ok<T>(data: T, message = "OK") {
  return { success: true as const, message, data };
}

export function fail(message: string) {
  return { success: false as const, message, data: null };
}

/** Replace {{name}}, {{link}} … placeholders in a WhatsApp template. */
export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Extracts the 11-char video id from any common YouTube / YouTube Music URL
 * (watch?v=, youtu.be/, /shorts/, /embed/, /live/) or a bare id.
 */
export function youtubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (host === "youtu.be") return url.pathname.slice(1, 12) || null;
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

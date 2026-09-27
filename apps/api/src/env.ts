export const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://sonal@localhost:5432/shimlawale";

export const IS_PROD = process.env.NODE_ENV === "production";

export const PORT = Number(process.env.PORT ?? 4200);

/** Rolling session length for opaque auth tokens (auths table + in-memory cache). */
export const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 30);

export const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

/** Public site origin — used to build share links in WhatsApp messages. */
export const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL || "https://shimlawale.com";

export const ALLOWED_ORIGIN_HOSTS = [
  "https://shimlawale.com",
  "https://www.shimlawale.com",
];

export const SMTP = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  notify: process.env.ADMIN_NOTIFY_EMAIL || "",
};

export const SOCIAL_KEYS = {
  fbPageId: process.env.FB_PAGE_ID || "",
  fbPageToken: process.env.FB_PAGE_TOKEN || "",
  igUserId: process.env.IG_USER_ID || "",
  igToken: process.env.IG_TOKEN || "",
  ytChannelId: process.env.YT_CHANNEL_ID || "",
  ytApiKey: process.env.YT_API_KEY || "",
};

export const WA_CLOUD = {
  token: process.env.WA_CLOUD_TOKEN || "",
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID || "",
};

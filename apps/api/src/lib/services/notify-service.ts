import nodemailer from "nodemailer";
import { SMTP } from "$/env";

/** Optional admin email alert. Silently no-ops when SMTP isn't configured. */
class NotifyService {
  #transport = SMTP.host
    ? nodemailer.createTransport({
        host: SMTP.host,
        port: SMTP.port,
        secure: SMTP.port === 465,
        auth: { user: SMTP.user, pass: SMTP.pass },
      })
    : null;

  async adminAlert(subject: string, lines: Record<string, unknown>) {
    if (!this.#transport || !SMTP.notify) return;
    const text = Object.entries(lines)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");
    try {
      await this.#transport.sendMail({
        from: SMTP.user,
        to: SMTP.notify,
        subject: `[Shimla Wale] ${subject}`,
        text,
      });
    } catch (error) {
      console.error("admin alert email failed", error);
    }
  }
}

export const notifyService = new NotifyService();

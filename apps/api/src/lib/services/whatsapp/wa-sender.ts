import { WA_CLOUD } from "$/env";

export type WaSendResult =
  | { mode: "link"; url: string }
  | { mode: "api"; messageId: string };

export interface WaSender {
  readonly mode: "link" | "api";
  send(to: string, text: string): Promise<WaSendResult>;
}

/** Click-to-send: builds a wa.me deep link the admin opens in WhatsApp. */
export class WaLinkSender implements WaSender {
  readonly mode = "link" as const;
  async send(to: string, text: string): Promise<WaSendResult> {
    return { mode: "link", url: waLink(to, text) };
  }
}

/**
 * WhatsApp Cloud API (Meta). Not active until WA_CLOUD_TOKEN and
 * WA_PHONE_NUMBER_ID are set; free-form text only works inside the 24h
 * customer-service window — outside it Meta requires approved templates.
 */
export class WaCloudApiSender implements WaSender {
  readonly mode = "api" as const;
  async send(to: string, text: string): Promise<WaSendResult> {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WA_CLOUD.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WA_CLOUD.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      },
    );
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}`);
    const json = (await res.json()) as { messages?: { id: string }[] };
    return { mode: "api", messageId: json.messages?.[0]?.id ?? "" };
  }
}

export function waLink(to: string, text: string) {
  return `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

// Cloud API is wired but intentionally not selected yet — click-to-send is
// the agreed mode until the Meta Business number is verified.
export const waSender: WaSender = new WaLinkSender();

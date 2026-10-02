import { SOCIAL_KEYS } from "$/env";
import type { SocialPostInput, SocialProvider } from "./social-provider";

const GRAPH = "https://graph.facebook.com/v21.0";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Social API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Facebook Page posts via Graph API. Needs FB_PAGE_ID + FB_PAGE_TOKEN. */
export class FacebookGraphProvider implements SocialProvider {
  readonly platform = "facebook" as const;
  readonly isMock = false;

  async fetchLatest(limit: number): Promise<SocialPostInput[]> {
    type Resp = {
      data: {
        id: string;
        message?: string;
        full_picture?: string;
        permalink_url: string;
        created_time: string;
      }[];
    };
    const url = `${GRAPH}/${SOCIAL_KEYS.fbPageId}/posts?fields=id,message,full_picture,permalink_url,created_time&limit=${limit}&access_token=${SOCIAL_KEYS.fbPageToken}`;
    const { data } = await getJson<Resp>(url);
    return data.map((p) => ({
      externalId: p.id,
      caption: p.message ?? "",
      mediaType: p.full_picture ? "image" : "text",
      mediaUrl: p.full_picture ?? null,
      thumbnailUrl: p.full_picture ?? null,
      permalink: p.permalink_url,
      publishedAt: new Date(p.created_time),
      stats: {},
    }));
  }
}

/** Instagram Business account media. Needs IG_USER_ID + IG_TOKEN. */
export class InstagramGraphProvider implements SocialProvider {
  readonly platform = "instagram" as const;
  readonly isMock = false;

  async fetchLatest(limit: number): Promise<SocialPostInput[]> {
    type Resp = {
      data: {
        id: string;
        caption?: string;
        media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
        media_url?: string;
        thumbnail_url?: string;
        permalink: string;
        timestamp: string;
        like_count?: number;
        comments_count?: number;
      }[];
    };
    const url = `${GRAPH}/${SOCIAL_KEYS.igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${SOCIAL_KEYS.igToken}`;
    const { data } = await getJson<Resp>(url);
    return data.map((p) => ({
      externalId: p.id,
      caption: p.caption ?? "",
      mediaType: p.media_type === "VIDEO" ? "video" : "image",
      mediaUrl: p.media_url ?? null,
      thumbnailUrl: p.thumbnail_url ?? p.media_url ?? null,
      permalink: p.permalink,
      publishedAt: new Date(p.timestamp),
      stats: { likes: p.like_count, comments: p.comments_count },
    }));
  }
}

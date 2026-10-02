import { resolve4 } from "node:dns/promises";
import { type YoutubeContentKind, youtubeContentKinds } from "$/db/schema";
import { SOCIAL_KEYS } from "$/env";
import type { SocialPostInput } from "./social-provider";

const API = "https://www.googleapis.com/youtube/v3";
const CHANNEL_ID = /^UC[\w-]{22}$/;
/** First path segments of youtube.com URLs that aren't a channel. */
const NOT_A_CHANNEL = new Set([
  "watch",
  "playlist",
  "shorts",
  "results",
  "feed",
  "embed",
  "live",
  "hashtag",
]);

/**
 * Every channel has hidden per-kind playlists next to its "UU…" uploads
 * playlist. Reading them costs 1 quota unit a page, where the search endpoint
 * costs 100 and can't tell Shorts from long videos.
 */
const KIND_PLAYLIST: Record<YoutubeContentKind, string> = {
  videos: "UULF",
  shorts: "UUSH",
  live: "UULV",
};

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason = "",
  ) {
    super(message);
  }
}

export type YoutubeChannel = {
  id: string;
  handle: string | null;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  url: string;
};

export type YoutubeKindCounts = Record<YoutubeContentKind, number>;

type GoogleError = {
  error?: {
    message?: string;
    status?: string;
    errors?: { reason?: string }[];
    details?: { reason?: string }[];
  };
};

function friendlyError(status: number, body: GoogleError | null) {
  const e = body?.error;
  const reason =
    e?.details?.find((d) => d.reason)?.reason ??
    e?.errors?.[0]?.reason ??
    e?.status ??
    "";
  const message = e?.message ?? `YouTube API error ${status}`;
  if (/quota|rateLimit|dailyLimit/i.test(reason)) {
    return new YouTubeApiError(
      "YouTube API quota is used up for today. It resets at midnight Pacific time.",
      status,
      reason,
    );
  }
  if (reason === "API_KEY_INVALID" || /API key not valid/i.test(message)) {
    return new YouTubeApiError(
      "The YouTube API key is not valid. Check YOUTUBE_API_KEY on the server.",
      status,
      reason,
    );
  }
  if (/SERVICE_DISABLED|accessNotConfigured/i.test(reason)) {
    return new YouTubeApiError(
      "YouTube Data API v3 is not enabled for this API key's Google Cloud project.",
      status,
      reason,
    );
  }
  if (/BLOCKED|ipRefererBlocked/i.test(reason)) {
    return new YouTubeApiError(
      "The YouTube API key's restrictions (IP / referrer / API) block this server.",
      status,
      reason,
    );
  }
  return new YouTubeApiError(message, status, reason);
}

/**
 * Google publishes IPv6 addresses first and Bun's fetch tries them without
 * falling back, so on a host whose IPv6 route is dead (our production box)
 * every call hangs until it times out. Connecting to an IPv4 address avoids
 * that; the certificate is still checked against the real hostname.
 */
async function fetchOverIpv4(url: URL) {
  const signal = AbortSignal.timeout(15_000);
  const [ip] = await resolve4(url.hostname).catch(() => []);
  if (!ip) return fetch(url, { signal });
  const direct = new URL(url);
  direct.hostname = ip;
  return fetch(direct, {
    signal,
    headers: { Host: url.hostname },
    tls: { serverName: url.hostname },
  });
}

async function yt<T>(path: string, params: Record<string, string>) {
  if (!SOCIAL_KEYS.ytApiKey) {
    throw new YouTubeApiError(
      "YOUTUBE_API_KEY is not set on the server.",
      400,
      "noKey",
    );
  }
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", SOCIAL_KEYS.ytApiKey);
  let res: Response;
  try {
    res = await fetchOverIpv4(url);
  } catch {
    // Never rethrow the fetch error: its message can contain the URL + key.
    throw new YouTubeApiError("Couldn't reach YouTube. Try again.", 0, "net");
  }
  if (res.ok) return (await res.json()) as T;
  throw friendlyError(
    res.status,
    (await res.json().catch(() => null)) as GoogleError | null,
  );
}

/**
 * Accepts what an admin is likely to paste: "@handle", "handle", a channel
 * URL (/@handle, /channel/UC…, /c/name, /user/name, /name) or a channel id.
 */
export function parseChannelRef(
  input: string,
): { kind: "id" | "name"; value: string } | null {
  const s = input.trim();
  if (!s) return null;
  if (CHANNEL_ID.test(s)) return { kind: "id", value: s };
  if (s.includes("/") || /youtube\.com/i.test(s)) {
    try {
      const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      if (url.hostname.replace(/^(www\.|m\.)/, "") !== "youtube.com") {
        return null;
      }
      const [first = "", second = ""] = url.pathname
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent);
      if (first === "channel") {
        return CHANNEL_ID.test(second) ? { kind: "id", value: second } : null;
      }
      if (first === "c" || first === "user") {
        return second ? { kind: "name", value: second } : null;
      }
      if (!first || NOT_A_CHANNEL.has(first)) return null;
      return { kind: "name", value: first.replace(/^@/, "") };
    } catch {
      return null;
    }
  }
  const name = s.replace(/^@/, "");
  return /^[^\s/?#@]{3,60}$/.test(name) ? { kind: "name", value: name } : null;
}

type ChannelResp = {
  items?: {
    id: string;
    snippet: {
      title: string;
      customUrl?: string;
      thumbnails?: Record<string, { url: string } | undefined>;
    };
    statistics?: {
      subscriberCount?: string;
      videoCount?: string;
      hiddenSubscriberCount?: boolean;
    };
  }[];
};

const num = (v: string | undefined) => (v === undefined ? null : Number(v));

/** Recent lookups, so "Test" followed by "Add" asks YouTube only once. */
const resolved = new Map<string, { at: number; channel: YoutubeChannel }>();
const RESOLVE_TTL_MS = 10 * 60 * 1000;

/** Looks a channel up by handle / legacy username / id. null = not found. */
export async function resolveChannel(
  input: string,
): Promise<YoutubeChannel | null> {
  const ref = parseChannelRef(input);
  if (!ref) return null;
  const cacheKey = `${ref.kind}:${ref.value.toLowerCase()}`;
  const hit = resolved.get(cacheKey);
  if (hit && Date.now() - hit.at < RESOLVE_TTL_MS) return hit.channel;
  // Old channels still answer to a legacy username that isn't their @handle
  // (youtube.com/shimlawale → @shimlawaleofficial), so try both.
  const lookups: Record<string, string>[] =
    ref.kind === "id"
      ? [{ id: ref.value }]
      : [{ forHandle: `@${ref.value}` }, { forUsername: ref.value }];
  for (const lookup of lookups) {
    const { items } = await yt<ChannelResp>("channels", {
      part: "snippet,statistics",
      ...lookup,
    });
    const c = items?.[0];
    if (!c) continue;
    const handle = c.snippet.customUrl?.startsWith("@")
      ? c.snippet.customUrl
      : null;
    const t = c.snippet.thumbnails;
    const channel: YoutubeChannel = {
      id: c.id,
      handle,
      title: c.snippet.title,
      thumbnailUrl: t?.medium?.url ?? t?.default?.url ?? null,
      subscriberCount: c.statistics?.hiddenSubscriberCount
        ? null
        : num(c.statistics?.subscriberCount),
      videoCount: num(c.statistics?.videoCount),
      url: `https://www.youtube.com/${handle ?? `channel/${c.id}`}`,
    };
    resolved.set(cacheKey, { at: Date.now(), channel });
    return channel;
  }
  return null;
}

type PlaylistResp = {
  pageInfo?: { totalResults?: number };
  items?: {
    contentDetails: { videoId: string; videoPublishedAt?: string };
  }[];
};

/** Newest uploads of one kind, plus how many of that kind the channel has. */
async function listKind(
  channelId: string,
  kind: YoutubeContentKind,
  limit: number,
) {
  try {
    const res = await yt<PlaylistResp>("playlistItems", {
      part: "contentDetails",
      playlistId: KIND_PLAYLIST[kind] + channelId.slice(2),
      maxResults: String(limit),
    });
    return {
      total: res.pageInfo?.totalResults ?? 0,
      items: (res.items ?? []).map((i) => ({
        id: i.contentDetails.videoId,
        at: i.contentDetails.videoPublishedAt ?? "",
        kind,
      })),
    };
  } catch (error) {
    // The playlist doesn't exist when the channel has nothing of that kind.
    if (error instanceof YouTubeApiError && error.status === 404) {
      return { total: 0, items: [] };
    }
    throw error;
  }
}

type VideosResp = {
  items?: {
    id: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails?: Record<string, { url: string } | undefined>;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    status?: { privacyStatus?: string; embeddable?: boolean };
  }[];
};

type Picked = { id: string; at: string; kind: YoutubeContentKind };

/** Titles, thumbnails and counts for the picked videos, newest first. */
async function details(channelId: string, picked: Picked[]) {
  if (picked.length === 0) return [];
  const kindOf = new Map(picked.map((p) => [p.id, p.kind]));
  const { items } = await yt<VideosResp>("videos", {
    part: "snippet,statistics,status",
    id: picked.map((p) => p.id).join(","),
    maxResults: "50",
  });
  return (items ?? [])
    .filter((v) => v.status?.privacyStatus === "public")
    .map((v) => {
      const t = v.snippet.thumbnails;
      const s = v.statistics;
      const kind = kindOf.get(v.id) ?? "videos";
      return {
        kind,
        externalId: v.id,
        caption: v.snippet.title,
        mediaType: "video",
        // Uploaders can forbid embedding; those open on YouTube instead.
        mediaUrl:
          v.status?.embeddable === false
            ? null
            : `https://www.youtube.com/embed/${v.id}`,
        // standard/high are 4:3 with black bars, which the 16:9 cards crop.
        thumbnailUrl:
          t?.standard?.url ??
          t?.maxres?.url ??
          t?.high?.url ??
          t?.medium?.url ??
          null,
        permalink:
          kind === "shorts"
            ? `https://www.youtube.com/shorts/${v.id}`
            : `https://www.youtube.com/watch?v=${v.id}`,
        publishedAt: new Date(v.snippet.publishedAt),
        stats: {
          ...(s?.viewCount !== undefined && { views: Number(s.viewCount) }),
          ...(s?.likeCount !== undefined && { likes: Number(s.likeCount) }),
          ...(s?.commentCount !== undefined && {
            comments: Number(s.commentCount),
          }),
        },
        sourceId: channelId,
      } satisfies SocialPostInput & { kind: YoutubeContentKind };
    })
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * The channel's newest uploads of the wanted kinds, newest first, with view /
 * like / comment counts. Costs one quota unit per kind plus one for details
 * (the daily allowance is 10,000).
 */
export async function latestVideos(
  channelId: string,
  include: readonly YoutubeContentKind[],
  limit: number,
): Promise<SocialPostInput[]> {
  const max = Math.max(1, Math.min(limit, 50));
  const lists = await Promise.all(
    include.map((kind) => listKind(channelId, kind, max)),
  );
  const picked = new Map<string, Picked>();
  for (const item of lists.flatMap((l) => l.items)) {
    if (!picked.has(item.id)) picked.set(item.id, item);
  }
  const newest = [...picked.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, max);
  const posts = await details(channelId, newest);
  return posts.map(({ kind: _kind, ...post }) => post);
}

const PREVIEW_PER_KIND = 4;

/** For the admin's "Test" button: how many uploads of each kind the channel
 * has and its newest few of each, so the kind boxes can be tried without
 * asking YouTube again. */
export async function previewChannel(channelId: string) {
  const lists = await Promise.all(
    youtubeContentKinds.map((kind) =>
      listKind(channelId, kind, PREVIEW_PER_KIND),
    ),
  );
  const counts = Object.fromEntries(
    youtubeContentKinds.map((kind, i) => [kind, lists[i]?.total ?? 0]),
  ) as YoutubeKindCounts;
  const picked = new Map<string, Picked>();
  for (const item of lists.flatMap((l) => l.items)) {
    if (!picked.has(item.id)) picked.set(item.id, item);
  }
  return { counts, sample: await details(channelId, [...picked.values()]) };
}

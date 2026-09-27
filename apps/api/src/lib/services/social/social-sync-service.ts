import { sql } from "drizzle-orm";
import { db } from "$/db";
import {
  type SocialPlatform,
  socialPlatforms,
  socialPostsTable,
} from "$/db/schema";
import { SOCIAL_KEYS } from "$/env";
import {
  FacebookGraphProvider,
  InstagramGraphProvider,
  YouTubeDataProvider,
} from "./graph-providers";
import { MockSocialProvider } from "./mock-provider";
import type { SocialProvider } from "./social-provider";

const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;

function providerFor(platform: SocialPlatform): SocialProvider {
  switch (platform) {
    case "facebook":
      return SOCIAL_KEYS.fbPageId && SOCIAL_KEYS.fbPageToken
        ? new FacebookGraphProvider()
        : new MockSocialProvider("facebook");
    case "instagram":
      return SOCIAL_KEYS.igUserId && SOCIAL_KEYS.igToken
        ? new InstagramGraphProvider()
        : new MockSocialProvider("instagram");
    case "youtube":
      return SOCIAL_KEYS.ytChannelId && SOCIAL_KEYS.ytApiKey
        ? new YouTubeDataProvider()
        : new MockSocialProvider("youtube");
  }
}

class SocialSyncService {
  status() {
    return socialPlatforms.map((p) => ({
      platform: p,
      mode: providerFor(p).isMock ? ("mock" as const) : ("live" as const),
    }));
  }

  /** Pulls the latest posts and upserts them into social_posts. */
  async sync(platform: SocialPlatform, limit = 12) {
    const provider = providerFor(platform);
    const posts = await provider.fetchLatest(limit);
    if (posts.length === 0)
      return { platform, synced: 0, mock: provider.isMock };

    await db
      .insert(socialPostsTable)
      .values(posts.map((p) => ({ ...p, platform })))
      .onConflictDoUpdate({
        target: [socialPostsTable.platform, socialPostsTable.externalId],
        set: {
          caption: sql`excluded.caption`,
          mediaUrl: sql`excluded.media_url`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          permalink: sql`excluded.permalink`,
          stats: sql`excluded.stats`,
        },
      });
    return { platform, synced: posts.length, mock: provider.isMock };
  }

  async syncAll() {
    const results = [];
    for (const p of socialPlatforms) {
      try {
        results.push(await this.sync(p));
      } catch (error) {
        console.error(`social sync ${p} failed`, error);
        results.push({ platform: p, synced: 0, error: String(error) });
      }
    }
    return results;
  }

  /** Background refresh — only when at least one live provider is configured. */
  startSchedule() {
    if (this.status().every((s) => s.mode === "mock")) return;
    const timer = setInterval(() => void this.syncAll(), SYNC_EVERY_MS);
    if (typeof timer === "object" && "unref" in timer) timer.unref();
    console.info("[SocialSync] scheduled every 6h");
  }
}

export const socialSyncService = new SocialSyncService();

import {
  and,
  asc,
  eq,
  isNull,
  notInArray,
  notLike,
  or,
  sql,
} from "drizzle-orm";
import { db } from "$/db";
import {
  type InsertSocialFeed,
  type SelectSocialFeed,
  type SelectSocialPost,
  type SelectYoutubeChannel,
  type SocialPlatform,
  socialFeedsTable,
  socialPlatforms,
  socialPostsTable,
  youtubeChannelsTable,
} from "$/db/schema";
import { SOCIAL_KEYS } from "$/env";
import {
  FacebookGraphProvider,
  InstagramGraphProvider,
} from "./graph-providers";
import { MockSocialProvider } from "./mock-provider";
import type { SocialPostInput, SocialProvider } from "./social-provider";
import { latestVideos } from "./youtube-api";

/** How often the scheduler looks for feeds whose sync interval has passed.
 * A tick only reads settings from the database; no API is called unless a
 * feed is actually due. */
const TICK_MS = 10 * 60 * 1000;
/** A failed sync is retried no sooner than this, so errors don't burn quota. */
const RETRY_MS = 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function defaultFeed(platform: SocialPlatform): SelectSocialFeed {
  return {
    platform,
    showOnSite: true,
    autoSync: true,
    syncEveryHours: 6,
    maxPosts: 12,
    arrangement: "newest",
    lastSyncedAt: null,
    lastSyncCount: null,
    lastSyncError: null,
    updatedAt: new Date(),
  };
}

/** Facebook / Instagram / demo data. Live YouTube is synced per channel. */
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
      return new MockSocialProvider("youtube");
  }
}

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const notManual = notLike(socialPostsTable.externalId, "manual-%");

class SocialSyncService {
  private lastAttempt = new Map<SocialPlatform, number>();

  /** Settings for every platform; ones never saved come back as defaults. */
  async feeds(): Promise<SelectSocialFeed[]> {
    const rows = await db.select().from(socialFeedsTable);
    return socialPlatforms.map(
      (p) => rows.find((r) => r.platform === p) ?? defaultFeed(p),
    );
  }

  async feed(platform: SocialPlatform): Promise<SelectSocialFeed> {
    const [row] = await db
      .select()
      .from(socialFeedsTable)
      .where(eq(socialFeedsTable.platform, platform))
      .limit(1);
    return row ?? defaultFeed(platform);
  }

  async saveFeed(
    platform: SocialPlatform,
    patch: Omit<Partial<InsertSocialFeed>, "platform">,
  ) {
    await db
      .insert(socialFeedsTable)
      .values({ platform, ...patch })
      .onConflictDoUpdate({ target: socialFeedsTable.platform, set: patch });
  }

  /** The admin's YouTube channels in their chosen order. */
  channels(): Promise<SelectYoutubeChannel[]> {
    return db
      .select()
      .from(youtubeChannelsTable)
      .orderBy(
        asc(youtubeChannelsTable.sortOrder),
        asc(youtubeChannelsTable.id),
      );
  }

  /** YouTube is live once the key is set and a channel has been added. */
  private isLive(platform: SocialPlatform, channels: SelectYoutubeChannel[]) {
    return platform === "youtube"
      ? Boolean(SOCIAL_KEYS.ytApiKey) && channels.length > 0
      : !providerFor(platform).isMock;
  }

  async status() {
    const [feeds, channels] = await Promise.all([
      this.feeds(),
      this.channels(),
    ]);
    return {
      youtubeKeySet: Boolean(SOCIAL_KEYS.ytApiKey),
      channels,
      feeds: feeds.map((f) => ({
        ...f,
        mode: this.isLive(f.platform, channels)
          ? ("live" as const)
          : ("mock" as const),
      })),
    };
  }

  /** What the public "Latest" section needs to lay itself out: which tabs
   * to show and, for YouTube, the channels to offer as filters. */
  async publicLayout() {
    const [feeds, channels] = await Promise.all([
      this.feeds(),
      this.channels(),
    ]);
    return {
      platforms: feeds.filter((f) => f.showOnSite).map((f) => f.platform),
      youtubeChannels: channels
        .filter((c) => c.isActive)
        .map((c) => ({ channelId: c.channelId, name: c.label || c.title })),
    };
  }

  /**
   * Orders one platform's cached posts the way the admin arranged the feed:
   * pinned first, then either newest first or channels taking turns.
   */
  async arrange(platform: SocialPlatform, posts: SelectSocialPost[]) {
    const byDate = (a: SelectSocialPost, b: SelectSocialPost) =>
      b.publishedAt.getTime() - a.publishedAt.getTime();
    const pinned = posts.filter((p) => p.isPinned).sort(byDate);
    const rest = posts.filter((p) => !p.isPinned).sort(byDate);
    const { arrangement } = await this.feed(platform);
    if (platform !== "youtube" || arrangement !== "balanced") {
      return [...pinned, ...rest];
    }
    const order = (await this.channels()).map((c) => c.channelId);
    const rank = (p: SelectSocialPost) => {
      const i = p.sourceId ? order.indexOf(p.sourceId) : -1;
      return i === -1 ? order.length : i;
    };
    // Round-robin: every channel's newest, then every channel's 2nd newest…
    const turn = new Map<number, number>();
    const keyed = rest.map((post) => {
      const r = rank(post);
      const n = turn.get(r) ?? 0;
      turn.set(r, n + 1);
      return { post, n, r };
    });
    keyed.sort((a, b) => a.n - b.n || a.r - b.r);
    return [...pinned, ...keyed.map((k) => k.post)];
  }

  private async upsert(platform: SocialPlatform, posts: SocialPostInput[]) {
    if (posts.length === 0) return;
    await db
      .insert(socialPostsTable)
      .values(posts.map((p) => ({ ...p, platform })))
      .onConflictDoUpdate({
        target: [socialPostsTable.platform, socialPostsTable.externalId],
        set: {
          caption: sql`excluded.caption`,
          mediaType: sql`excluded.media_type`,
          mediaUrl: sql`excluded.media_url`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          permalink: sql`excluded.permalink`,
          publishedAt: sql`excluded.published_at`,
          stats: sql`excluded.stats`,
          sourceId: sql`excluded.source_id`,
        },
      });
  }

  /**
   * Refreshes social_posts, the cache the public site reads. A live sync
   * mirrors the platform: synced posts that are no longer among the latest
   * are dropped (demo rows included); manually added ones are kept.
   */
  async sync(platform: SocialPlatform) {
    this.lastAttempt.set(platform, Date.now());
    try {
      const channels = await this.channels();
      const live = this.isLive(platform, channels);
      let synced: number;
      if (platform === "youtube" && live) {
        synced = await this.syncYoutube(channels);
      } else {
        const feed = await this.feed(platform);
        const posts = await providerFor(platform).fetchLatest(feed.maxPosts);
        if (live) {
          await db.delete(socialPostsTable).where(
            and(
              eq(socialPostsTable.platform, platform),
              notManual,
              posts.length
                ? notInArray(
                    socialPostsTable.externalId,
                    posts.map((p) => p.externalId),
                  )
                : undefined,
            ),
          );
        }
        await this.upsert(platform, posts);
        synced = posts.length;
      }
      await this.saveFeed(platform, {
        lastSyncedAt: new Date(),
        lastSyncCount: synced,
        lastSyncError: null,
      });
      return { platform, synced, mock: !live };
    } catch (error) {
      await this.saveFeed(platform, { lastSyncError: errorText(error) }).catch(
        () => {},
      );
      throw error;
    }
  }

  /**
   * Syncs the active channels (or just `only`). One channel failing doesn't
   * stop the others; its videos stay as they were and the error is kept on
   * its row. Throws only when every channel failed.
   */
  private async syncYoutube(channels: SelectYoutubeChannel[], only?: number) {
    const active = channels.filter((c) => c.isActive);
    const targets = active.filter((c) => only === undefined || c.id === only);
    let synced = 0;
    const errors: string[] = [];
    for (const channel of targets) {
      try {
        const posts = await latestVideos(
          channel.channelId,
          channel.include,
          channel.maxVideos,
        );
        await db.delete(socialPostsTable).where(
          and(
            eq(socialPostsTable.platform, "youtube"),
            eq(socialPostsTable.sourceId, channel.channelId),
            posts.length
              ? notInArray(
                  socialPostsTable.externalId,
                  posts.map((p) => p.externalId),
                )
              : undefined,
          ),
        );
        await this.upsert("youtube", posts);
        await db
          .update(youtubeChannelsTable)
          .set({
            lastSyncedAt: new Date(),
            lastSyncCount: posts.length,
            lastSyncError: null,
          })
          .where(eq(youtubeChannelsTable.id, channel.id));
        synced += posts.length;
      } catch (error) {
        console.error(`[SocialSync] youtube ${channel.title} failed`, error);
        errors.push(`${channel.title}: ${errorText(error)}`);
        await db
          .update(youtubeChannelsTable)
          .set({ lastSyncError: errorText(error) })
          .where(eq(youtubeChannelsTable.id, channel.id));
      }
    }
    // Videos of removed or paused channels leave the feed, and so do the
    // demo rows, but only once a channel has real videos to show instead.
    const anySynced = errors.length < targets.length;
    await db.delete(socialPostsTable).where(
      and(
        eq(socialPostsTable.platform, "youtube"),
        notManual,
        active.length
          ? or(
              anySynced ? isNull(socialPostsTable.sourceId) : undefined,
              notInArray(
                socialPostsTable.sourceId,
                active.map((c) => c.channelId),
              ),
            )
          : undefined,
      ),
    );
    if (targets.length > 0 && errors.length === targets.length) {
      throw new Error(errors.join("; "));
    }
    return synced;
  }

  /** After a channel was added or its settings changed: refresh only it. */
  async syncChannel(id: number) {
    return this.syncYoutube(await this.channels(), id);
  }

  async syncAll() {
    const results = [];
    for (const p of socialPlatforms) {
      try {
        results.push(await this.sync(p));
      } catch (error) {
        console.error(`social sync ${p} failed`, error);
        results.push({ platform: p, synced: 0, error: errorText(error) });
      }
    }
    return results;
  }

  /** Syncs every live feed with auto-sync on whose interval has passed. */
  async syncDue() {
    const now = Date.now();
    const channels = await this.channels();
    for (const feed of await this.feeds()) {
      if (!feed.autoSync || !this.isLive(feed.platform, channels)) continue;
      const every = feed.syncEveryHours * HOUR_MS;
      const sinceSync = now - (feed.lastSyncedAt?.getTime() ?? 0);
      const sinceTry = now - (this.lastAttempt.get(feed.platform) ?? 0);
      if (sinceSync < every || sinceTry < Math.min(every, RETRY_MS)) continue;
      try {
        const r = await this.sync(feed.platform);
        console.info(`[SocialSync] ${feed.platform}: ${r.synced} posts`);
      } catch (error) {
        console.error(`[SocialSync] ${feed.platform} failed`, error);
      }
    }
  }

  /** Background refresh. Reads settings each tick, so admin changes to the
   * interval or the channels apply without a restart. */
  startSchedule() {
    const tick = () =>
      void this.syncDue().catch((error) =>
        console.error("[SocialSync] tick failed", error),
      );
    for (const timer of [
      setTimeout(tick, 15_000),
      setInterval(tick, TICK_MS),
    ]) {
      if (typeof timer === "object" && "unref" in timer) timer.unref();
    }
    console.info("[SocialSync] scheduler started");
  }
}

export const socialSyncService = new SocialSyncService();

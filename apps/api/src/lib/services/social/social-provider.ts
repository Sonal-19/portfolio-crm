import type { SocialMediaType, SocialPlatform, SocialStats } from "$/db/schema";

export type SocialPostInput = {
  externalId: string;
  caption: string;
  mediaType: SocialMediaType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  publishedAt: Date;
  stats: SocialStats;
};

export interface SocialProvider {
  readonly platform: SocialPlatform;
  readonly isMock: boolean;
  fetchLatest(limit: number): Promise<SocialPostInput[]>;
}

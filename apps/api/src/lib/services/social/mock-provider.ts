import type { SocialPlatform } from "$/db/schema";
import { socialSeedData } from "$/db/seed/social-data";
import type { SocialPostInput, SocialProvider } from "./social-provider";

/** Serves the bundled dummy posts until real API keys are configured. */
export class MockSocialProvider implements SocialProvider {
  readonly isMock = true;
  constructor(readonly platform: SocialPlatform) {}

  async fetchLatest(limit: number): Promise<SocialPostInput[]> {
    return socialSeedData
      .filter((p) => p.platform === this.platform)
      .slice(0, limit)
      .map(({ platform: _p, ...rest }) => rest);
  }
}

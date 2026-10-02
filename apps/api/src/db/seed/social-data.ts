import type { SocialPlatform } from "$/db/schema";
import type { SocialPostInput } from "$/lib/services/social/social-provider";

const ytSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`Bhai Gurpreet Singh Shimla Wale ${q}`)}`;

/**
 * Dummy feed used by MockSocialProvider until the Facebook / Instagram /
 * YouTube APIs are connected. YouTube titles are real releases; links go to
 * a YouTube search because we don't store the real video ids yet.
 */
export const socialSeedData: (SocialPostInput & {
  platform: SocialPlatform;
})[] = [
  // YouTube
  {
    platform: "youtube",
    externalId: "yt-satgur-tumre-kaaj-saware",
    caption: "Bhai Gurpreet Singh Shimla Wale – Satgur Tumre Kaaj Saware",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-1.svg",
    permalink: ytSearch("Satgur Tumre Kaaj Saware"),
    publishedAt: new Date("2024-12-16T10:00:00+05:30"),
    stats: { views: 182000 },
  },
  {
    platform: "youtube",
    externalId: "yt-aukhi-ghadi-na-dekhan-deyi",
    caption: "Bhai Gurpreet Singh Shimla Wale – Aukhi Ghadi Na Dekhan Deyi",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-2.svg",
    permalink: ytSearch("Aukhi Ghadi Na Dekhan Deyi"),
    publishedAt: new Date("2023-02-19T10:00:00+05:30"),
    stats: { views: 245000 },
  },
  {
    platform: "youtube",
    externalId: "yt-narayan",
    caption: "Narayan – Bhai Gurpreet Singh Shimla Wale (Full Album)",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-3.svg",
    permalink: ytSearch("Narayan"),
    publishedAt: new Date("2021-08-10T10:00:00+05:30"),
    stats: { views: 410000 },
  },
  {
    platform: "youtube",
    externalId: "yt-best-of-non-stop-kirtan",
    caption:
      "Best Of Bhai Gurpreet Singh Shimla Wale – Non Stop Kirtan (Vol. 1)",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-4.svg",
    permalink: ytSearch("Best Of Non Stop Kirtan"),
    publishedAt: new Date("2016-02-12T10:00:00+05:30"),
    stats: { views: 6600000 },
  },
  {
    platform: "youtube",
    externalId: "yt-best-of-vol-2",
    caption:
      "Best Of Bhai Gurpreet Singh Ji Shimla Wale – Audio Jukebox Vol. 2",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-5.svg",
    permalink: ytSearch("Best Of Vol 2"),
    publishedAt: new Date("2017-06-04T10:00:00+05:30"),
    stats: { views: 1200000 },
  },
  {
    platform: "youtube",
    externalId: "yt-live-gurpurab-samagam",
    caption: "Live Kirtan – Gurpurab Samagam, Ludhiana",
    mediaType: "video",
    mediaUrl: null,
    thumbnailUrl: "/uploads/social/yt-6.svg",
    permalink: ytSearch("Live Kirtan Ludhiana"),
    publishedAt: new Date("2025-11-05T19:00:00+05:30"),
    stats: { views: 54000 },
  },
  // Facebook
  ...[
    [
      "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏 Tonight's kirtan diwan at Gurdwara Sahib, Ghanta Ghar Ludhiana — sangat is warmly invited.",
      "2026-09-20T18:30:00+05:30",
    ],
    [
      "Kirtan darbar at Gurdwara Sri Guru Singh Sabha, Amritsar today. Families and committees can now book kirtan on our website 🙏",
      "2026-09-12T14:00:00+05:30",
    ],
    [
      "Thank you sangat for 66 lakh+ views on the Non Stop Kirtan jukebox. Guru Sahib's kirpa.",
      "2026-08-28T11:00:00+05:30",
    ],
    [
      "Behind the scenes: music video shoot for 'Satgur Tumre Kaaj Saware'.",
      "2026-08-10T16:00:00+05:30",
    ],
    [
      "Gurpurab programme schedule for this month is out. Follow the WhatsApp channel for updates.",
      "2026-07-30T09:00:00+05:30",
    ],
    [
      "Harmonium & tabla workshop for children this Sunday. Free for all.",
      "2026-07-15T10:00:00+05:30",
    ],
  ].map(([caption, at], i) => ({
    platform: "facebook" as const,
    externalId: `fb-demo-${i + 1}`,
    caption: caption as string,
    mediaType: "image" as const,
    mediaUrl: `/uploads/social/fb-${i + 1}.svg`,
    thumbnailUrl: `/uploads/social/fb-${i + 1}.svg`,
    permalink: "https://www.facebook.com/shimlawaleofficial/",
    publishedAt: new Date(at as string),
    stats: { likes: 800 + i * 137, comments: 40 + i * 9 },
  })),
  // Instagram
  ...[
    [
      "ਸਤਿਗੁਰ ਤੁਮਰੇ ਕਾਜ ਸਵਾਰੇ 🙏 #gurbani #kirtan #shimlawale",
      "2026-09-22T08:00:00+05:30",
    ],
    [
      "Silent Kirtan, Ulhasnagar — 3 AM Prabhat Pheri with headphones 🎧",
      "2026-09-14T13:00:00+05:30",
    ],
    ["Amrit vela simran. Waheguru 🌅", "2026-09-05T05:30:00+05:30"],
    ["Seva with sangat at the langar hall 🙏", "2026-08-25T12:00:00+05:30"],
    ["New shabad coming soon… stay tuned ✨", "2026-08-18T19:00:00+05:30"],
    [
      "Rehearsal with the jatha before the samagam 🎶",
      "2026-08-02T17:00:00+05:30",
    ],
  ].map(([caption, at], i) => ({
    platform: "instagram" as const,
    externalId: `ig-demo-${i + 1}`,
    caption: caption as string,
    mediaType: "image" as const,
    mediaUrl: `/uploads/social/ig-${i + 1}.svg`,
    thumbnailUrl: `/uploads/social/ig-${i + 1}.svg`,
    permalink: "https://www.instagram.com/shimlawaleofficial/",
    publishedAt: new Date(at as string),
    stats: { likes: 3200 + i * 411, comments: 90 + i * 13 },
  })),
];

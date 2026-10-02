import type { InsertRelease } from "$/db/schema";

const YT = "https://www.youtube.com/shimlawale";
const YTM =
  "https://music.youtube.com/search?q=Bhai+Gurpreet+Singh+Shimla+Wale";
const SPOTIFY =
  "https://open.spotify.com/search/Bhai%20Gurpreet%20Singh%20Shimla%20Wale";
const APPLE =
  "https://music.apple.com/in/search?term=Bhai%20Gurpreet%20Singh%20Shimla%20Wale";

/** Dummy hero-carousel posters. The admin replaces them under Releases. */
export const releaseSeed: InsertRelease[] = [
  {
    title: "Amritvela Simran",
    subtitle: "New Release · 2026",
    caption:
      "Wake with Naam — an hour of Waheguru Simran recorded live at an Amritvela Trust samagam.",
    posterPath: "/uploads/releases/release-1.svg",
    aspect: "square",
    links: [
      { platform: "youtube_music", url: YTM },
      { platform: "spotify", url: SPOTIFY },
      { platform: "apple_music", url: APPLE },
    ],
    releaseDate: "2026-09-20",
    sortOrder: 0,
  },
  {
    title: "Satgur Tumre Kaaj Saware",
    subtitle: "Official Video",
    caption:
      "Shabad kirtan with full jatha — the Guru completes every task of His Sikh.",
    posterPath: "/uploads/releases/release-2.svg",
    aspect: "wide",
    links: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=bFoQyydNFLw",
      },
      { platform: "youtube_music", url: YTM },
      { platform: "spotify", url: SPOTIFY },
    ],
    releaseDate: "2024-12-16",
    sortOrder: 1,
  },
  {
    title: "Narayan",
    subtitle: "Album",
    caption: "A full album of raag-based shabads, now on every platform.",
    posterPath: "/uploads/releases/release-3.svg",
    aspect: "square",
    links: [
      { platform: "spotify", url: SPOTIFY },
      { platform: "apple_music", url: APPLE },
      { platform: "jiosaavn", url: "https://www.jiosaavn.com/" },
      { platform: "youtube_music", url: YTM },
    ],
    releaseDate: "2024-04-14",
    sortOrder: 2,
  },
  {
    title: "Aukhi Ghadi Na Dekhan Deyi",
    subtitle: "Shabad · Video",
    caption: "A prayer that the Guru keep us through every difficult hour.",
    posterPath: "/uploads/releases/release-4.svg",
    aspect: "wide",
    links: [
      { platform: "youtube", url: YT },
      { platform: "apple_music", url: APPLE },
    ],
    releaseDate: "2023-02-19",
    sortOrder: 3,
  },
  {
    title: "Best Of — Non Stop Kirtan",
    subtitle: "Jukebox · 66 Lakh+ views",
    caption: "The most-loved shabads in one non-stop jukebox.",
    posterPath: "/uploads/releases/release-5.svg",
    aspect: "square",
    links: [
      { platform: "youtube", url: YT },
      { platform: "spotify", url: SPOTIFY },
      { platform: "apple_music", url: APPLE },
    ],
    releaseDate: "2016-02-12",
    sortOrder: 4,
  },
];

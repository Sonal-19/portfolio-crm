import type { IconType } from "react-icons";
import { FaAmazon, FaInstagram, FaLink, FaMusic } from "react-icons/fa6";
import {
  SiApplemusic,
  SiSpotify,
  SiYoutube,
  SiYoutubemusic,
} from "react-icons/si";

/** Platforms a release poster can link to (mirrors the API enum). */
export const RELEASE_PLATFORMS = [
  "youtube",
  "youtube_music",
  "spotify",
  "apple_music",
  "jiosaavn",
  "amazon_music",
  "gaana",
  "instagram",
  "other",
] as const;
export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

export const PLATFORM_META: Record<
  ReleasePlatform,
  { label: string; icon: IconType; color: string }
> = {
  youtube: { label: "YouTube", icon: SiYoutube, color: "#FF0000" },
  youtube_music: {
    label: "YouTube Music",
    icon: SiYoutubemusic,
    color: "#FF0000",
  },
  spotify: { label: "Spotify", icon: SiSpotify, color: "#1DB954" },
  apple_music: { label: "Apple Music", icon: SiApplemusic, color: "#FA243C" },
  jiosaavn: { label: "JioSaavn", icon: FaMusic, color: "#2BC5B4" },
  amazon_music: { label: "Amazon Music", icon: FaAmazon, color: "#25D1DA" },
  gaana: { label: "Gaana", icon: FaMusic, color: "#E72C30" },
  instagram: { label: "Instagram", icon: FaInstagram, color: "#E1306C" },
  other: { label: "Listen", icon: FaLink, color: "#d4a64a" },
};

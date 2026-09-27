import {
  FaApple,
  FaFacebookF,
  FaInstagram,
  FaSpotify,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";

export const PLATFORM_ICON = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  x: FaXTwitter,
  spotify: FaSpotify,
  apple: FaApple,
  whatsapp: FaWhatsapp,
} as const;

export function socialLinks(s?: SiteSettings) {
  if (!s) return [];
  return [
    { key: "youtube", label: "YouTube", href: s.youtubeUrl },
    { key: "instagram", label: "Instagram", href: s.instagramUrl },
    { key: "facebook", label: "Facebook", href: s.facebookUrl },
    { key: "x", label: "X (Twitter)", href: s.xUrl },
    { key: "spotify", label: "Spotify", href: s.spotifyUrl },
    { key: "apple", label: "Apple Music", href: s.appleMusicUrl },
  ].filter(
    (
      l,
    ): l is { key: keyof typeof PLATFORM_ICON; label: string; href: string } =>
      !!l.href,
  );
}

export function SocialIconRow({
  settings,
  className,
  itemClassName,
}: {
  settings?: SiteSettings;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {socialLinks(settings).map(({ key, label, href }) => {
        const Icon = PLATFORM_ICON[key];
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className={cn(
              "grid size-10 place-items-center rounded-full border border-gold/40 text-gold-light transition hover:border-gold hover:bg-gold hover:text-navy",
              itemClassName,
            )}
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}

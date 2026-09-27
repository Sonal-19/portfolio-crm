import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Play } from "lucide-react";
import { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa6";
import { SectionHeading } from "@/components/common/section-heading";
import { Spinner } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { api, call } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

type Platform = "youtube" | "instagram" | "facebook";

const TABS: { key: Platform; label: string; Icon: typeof FaYoutube }[] = [
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
];

const compact = (n?: number) =>
  n === undefined
    ? ""
    : new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);

export function SocialFeedSection({ s }: { s?: SiteSettings }) {
  const [tab, setTab] = useState<Platform>("youtube");
  const [playing, setPlaying] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["public", "social", tab],
    queryFn: () =>
      call(api.public.social.get({ query: { platform: tab, limit: "6" } })),
  });

  const profile =
    tab === "youtube"
      ? s?.youtubeUrl
      : tab === "instagram"
        ? s?.instagramUrl
        : s?.facebookUrl;
  const TabIcon = TABS.find((t) => t.key === tab)?.Icon ?? FaYoutube;

  return (
    <section
      id="latest"
      className="relative bg-navy bg-mandala py-20 text-cream sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          tone="dark"
          kicker="Latest from the sangat"
          title="Kirtan, moments & updates"
          subtitle="Fresh from YouTube, Instagram and Facebook."
        />

        <div
          role="tablist"
          className="mx-auto mt-10 flex w-full max-w-md rounded-full border border-white/15 bg-white/5 p-1"
        >
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setPlaying(null);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                tab === key
                  ? "bg-gradient-to-r from-gold to-saffron text-navy"
                  : "text-cream/70 hover:text-cream",
              )}
            >
              <Icon className="size-4" />{" "}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid h-60 place-items-center">
            <Spinner />
          </div>
        ) : (
          <div
            className={cn(
              "mt-10 grid gap-5",
              tab === "instagram"
                ? "grid-cols-2 md:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {data?.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-gold/50"
              >
                <div
                  className={cn(
                    "relative overflow-hidden bg-navy-2",
                    tab === "instagram" ? "aspect-square" : "aspect-video",
                  )}
                >
                  {playing === p.id &&
                  p.mediaUrl?.includes("youtube.com/embed") ? (
                    <iframe
                      src={`${p.mediaUrl}?autoplay=1`}
                      title={p.caption}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="size-full"
                    />
                  ) : (
                    <>
                      <img
                        src={p.thumbnailUrl ?? p.mediaUrl ?? "/og-image.svg"}
                        alt={p.caption}
                        loading="lazy"
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      {p.mediaType === "video" && (
                        <button
                          type="button"
                          aria-label={`Play ${p.caption}`}
                          onClick={() =>
                            p.mediaUrl?.includes("youtube.com/embed")
                              ? setPlaying(p.id)
                              : window.open(p.permalink, "_blank", "noopener")
                          }
                          className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/30"
                        >
                          <span className="grid size-14 place-items-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110">
                            <Play className="size-6 fill-current" />
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4"
                >
                  <p
                    className={cn(
                      "text-sm text-cream/90",
                      tab === "youtube"
                        ? "line-clamp-2 font-medium"
                        : "line-clamp-3",
                    )}
                  >
                    {p.caption}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-cream/50">
                    <span>{formatDate(p.publishedAt)}</span>
                    {p.stats.views !== undefined && (
                      <span>{compact(p.stats.views)} views</span>
                    )}
                    {p.stats.likes !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3" /> {compact(p.stats.likes)}
                      </span>
                    )}
                    {p.stats.comments !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="size-3" />{" "}
                        {compact(p.stats.comments)}
                      </span>
                    )}
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}

        {profile && (
          <div className="mt-10 text-center">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-gold/50 bg-transparent text-cream hover:bg-white/5 hover:text-gold-light"
            >
              <a href={profile} target="_blank" rel="noreferrer">
                <TabIcon /> Follow on {TABS.find((t) => t.key === tab)?.label}
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

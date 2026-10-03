import { queryOptions, useQuery } from "@tanstack/react-query";
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

/** Posts are cached on the server and change a few times a day at most. */
const STALE_MS = 5 * 60 * 1000;

export const socialLayoutQuery = queryOptions({
  queryKey: ["public", "social", "layout"] as const,
  queryFn: () => call(api.public.social.layout.get()),
  staleTime: STALE_MS,
});

export function SocialFeedSection({ s }: { s?: SiteSettings }) {
  const [picked, setPicked] = useState<Platform>("youtube");
  const [source, setSource] = useState<string | undefined>();
  const [playing, setPlaying] = useState<number | null>(null);
  const { data: layout } = useQuery(socialLayoutQuery);

  // Tabs the admin switched off in Admin → Social feed are left out.
  const tabs = TABS.filter((t) => layout?.platforms.includes(t.key) ?? true);
  const tab = tabs.some((t) => t.key === picked) ? picked : tabs[0]?.key;
  const channels = tab === "youtube" ? (layout?.youtubeChannels ?? []) : [];
  const channel = channels.some((c) => c.channelId === source)
    ? source
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["public", "social", tab, channel ?? "all"],
    queryFn: () =>
      call(
        api.public.social.get({
          query: { platform: tab ?? "youtube", source: channel, limit: "6" },
        }),
      ),
    enabled: Boolean(tab),
    staleTime: STALE_MS,
  });
  if (!tab) return null;

  const profile =
    tab === "youtube"
      ? s?.youtubeUrl
      : tab === "instagram"
        ? s?.instagramUrl
        : s?.facebookUrl;
  const TabIcon = TABS.find((t) => t.key === tab)?.Icon ?? FaYoutube;
  const names = tabs.map((t) => t.label);
  const channelName = new Map(channels.map((c) => [c.channelId, c.name]));

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
          subtitle={`Fresh from ${[names.slice(0, -1).join(", "), names.at(-1)].filter(Boolean).join(" and ")}.`}
        />

        <div
          role="tablist"
          className={cn(
            "mx-auto mt-10 flex w-full max-w-md rounded-full border border-white/15 bg-white/5 p-1",
            tabs.length < 2 && "hidden",
          )}
        >
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setPicked(key);
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

        {channels.length > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[{ channelId: undefined, name: "All" }, ...channels].map((c) => (
              <button
                key={c.channelId ?? "all"}
                type="button"
                aria-pressed={channel === c.channelId}
                onClick={() => {
                  setSource(c.channelId);
                  setPlaying(null);
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                  channel === c.channelId
                    ? "border-gold bg-gold/15 text-gold-light"
                    : "border-white/15 text-cream/70 hover:border-white/30 hover:text-cream",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid h-60 place-items-center">
            <Spinner />
          </div>
        ) : data?.length === 0 ? (
          <p className="grid h-40 place-items-center text-sm text-cream/60">
            Nothing here yet. Check back soon.
          </p>
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
                className="group flex flex-col overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-lg shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-2xl hover:shadow-gold/10"
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
                  className="flex flex-1 flex-col p-4 sm:p-5"
                >
                  <p
                    className={cn(
                      "text-sm font-semibold text-navy transition-colors duration-200 group-hover:text-primary leading-snug",
                      tab === "youtube"
                        ? "line-clamp-2"
                        : "line-clamp-3",
                    )}
                  >
                    {p.caption}
                  </p>
                  {!channel && channels.length > 1 && p.sourceId && (
                    <p className="mt-1.5 truncate text-xs font-medium text-primary">
                      {channelName.get(p.sourceId)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3.5 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                    <span>{formatDate(p.publishedAt)}</span>
                    {p.stats.views !== undefined && (
                      <span>{compact(p.stats.views)} views</span>
                    )}
                    {p.stats.likes !== undefined && (
                      <span className="inline-flex items-center gap-1 transition-colors group-hover:text-primary">
                        <Heart className="size-3 text-primary/70" /> {compact(p.stats.likes)}
                      </span>
                    )}
                    {p.stats.comments !== undefined && (
                      <span className="inline-flex items-center gap-1 transition-colors group-hover:text-primary">
                        <MessageCircle className="size-3 text-primary/70" />{" "}
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

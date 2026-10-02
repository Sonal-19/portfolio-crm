import { queryOptions, useQuery } from "@tanstack/react-query";
import { CalendarDays, Disc3, Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { type CSSProperties, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, call } from "@/lib/api";
import { PLATFORM_META, type ReleasePlatform } from "@/lib/releases";
import { cn, formatDate, ymd } from "@/lib/utils";

export const releasesQuery = queryOptions({
  queryKey: ["public", "releases"] as const,
  queryFn: () => call(api.public.releases.get()),
  staleTime: 5 * 60 * 1000,
});

export type ReleaseCardData = {
  title: string;
  subtitle?: string | null;
  caption: string;
  posterPath: string;
  aspect: "square" | "wide";
  links: { platform: ReleasePlatform; url: string }[];
  releaseDate?: string | Date | null;
};

/** At least this many cards per half of the marquee, so the loop never
 * shows a gap on wide screens. */
const MIN_PER_LOOP = 8;
const SECONDS_PER_CARD = 6;

export function PlatformButton({
  platform,
  url,
  size = "sm",
}: {
  platform: ReleasePlatform;
  url: string;
  size?: "sm" | "lg";
}) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.other;
  const Icon = meta.icon;
  if (size === "lg") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-cream transition hover:border-gold/50 hover:bg-white/10"
      >
        <Icon className="size-5 shrink-0" style={{ color: meta.color }} />
        <span className="flex-1">{meta.label}</span>
        <span className="text-xs font-medium text-gold-light">Open ↗</span>
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={meta.label}
      aria-label={`Open on ${meta.label}`}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto grid size-8 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:scale-110 hover:border-gold hover:bg-black/70 sm:size-9"
    >
      <Icon className="size-4" style={{ color: meta.color }} />
    </a>
  );
}

/** One poster: album art (1:1) or video thumbnail (16:9), at a shared height
 * so both shapes sit in one row. */
export function ReleaseCard({
  r,
  isNew,
  onOpen,
  className,
}: {
  r: ReleaseCardData;
  isNew?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group/card relative h-48 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-navy-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-gold/10 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_18px_50px_-12px_rgba(240,138,36,0.35)] sm:h-60 lg:h-72",
        r.aspect === "wide" ? "aspect-video" : "aspect-square",
        className,
      )}
    >
      <img
        src={r.posterPath}
        alt={r.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      />
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${r.title}: details and links`}
          className="absolute inset-0 z-0 cursor-pointer"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {isNew && (
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-saffron px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-navy shadow sm:text-xs">
          <Sparkles className="size-3" /> NEW
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
        {r.subtitle && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light sm:text-xs">
            {r.subtitle}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-1 font-display text-base font-bold text-cream sm:text-lg">
          {r.title}
        </h3>
        {r.caption && (
          <p className="mt-0.5 hidden text-xs leading-snug text-cream/75 sm:line-clamp-2">
            {r.caption}
          </p>
        )}
        {r.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.links.slice(0, 5).map((l) => (
              <PlatformButton
                key={`${l.platform}-${l.url}`}
                platform={l.platform}
                url={l.url}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ReleaseDialog({
  r,
  onClose,
}: {
  r: ReleaseCardData | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto border-gold/20 bg-[#0b1229] p-0 text-cream sm:max-w-lg">
        {r && (
          <>
            <div className="bg-black/40">
              <img
                src={r.posterPath}
                alt={r.title}
                className={cn(
                  "mx-auto w-full object-contain",
                  r.aspect === "wide" ? "aspect-video" : "aspect-square",
                )}
              />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div>
                {r.subtitle && (
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
                    {r.subtitle}
                  </p>
                )}
                <DialogTitle className="mt-1 font-display text-2xl text-cream">
                  {r.title}
                </DialogTitle>
                {r.releaseDate && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-cream/60">
                    <CalendarDays className="size-3.5" />
                    Released{" "}
                    {formatDate(`${ymd(r.releaseDate)}T00:00:00+05:30`)}
                  </p>
                )}
              </div>
              <DialogDescription className="text-sm leading-relaxed text-cream/80">
                {r.caption || "Listen on your favourite platform."}
              </DialogDescription>
              <div className="grid gap-2">
                {r.links.map((l) => (
                  <PlatformButton
                    key={`${l.platform}-${l.url}`}
                    platform={l.platform}
                    url={l.url}
                    size="lg"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Admin-managed posters for the latest albums / songs, auto-scrolling in an
 * endless loop at the top of the hero. Renders nothing when there are none. */
export function ReleaseCarousel() {
  const { data } = useQuery(releasesQuery);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<ReleaseCardData | null>(null);

  const items = (data ?? []) as ReleaseCardData[];
  const newest = useMemo(() => {
    let best: { i: number; d: string } | null = null;
    items.forEach((r, i) => {
      const d = r.releaseDate ? ymd(r.releaseDate) : "";
      if (d && (!best || d > best.d)) best = { i, d };
    });
    return (best as { i: number; d: string } | null)?.i ?? 0;
  }, [items]);

  if (items.length === 0) return null;

  const animated = items.length >= 3 && !reduceMotion;
  const loop = animated
    ? Array.from(
        { length: Math.ceil(MIN_PER_LOOP / items.length) },
        () => items,
      ).flat()
    : items;

  return (
    <div className="relative mb-12 sm:mb-16">
      <div className="mx-auto mb-4 flex max-w-7xl items-end justify-between gap-4 px-4 sm:mb-5 sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-brand text-xs tracking-[0.3em] text-gold-light sm:text-sm">
            <Disc3 className="size-4 animate-[spin_6s_linear_infinite] text-saffron" />
            LATEST RELEASES
          </p>
          <p className="mt-1 text-xs text-cream/60 sm:text-sm">
            Listen everywhere: YouTube, YouTube Music, Spotify & Apple Music
          </p>
        </div>
        <span className="hidden h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent sm:block" />
      </div>

      {animated ? (
        <div
          className="marquee marquee-fade overflow-hidden py-3"
          data-paused={open ? "true" : "false"}
        >
          <div
            className="marquee-track flex w-max"
            style={
              {
                "--marquee-duration": `${loop.length * SECONDS_PER_CARD}s`,
              } as CSSProperties
            }
          >
            {[0, 1].map((half) =>
              loop.map((r, i) => (
                <div
                  key={`${half}-${i}`}
                  className="pr-4 sm:pr-6"
                  aria-hidden={half === 1 || i >= items.length}
                >
                  <ReleaseCard
                    r={r}
                    isNew={i % items.length === newest}
                    onOpen={() => setOpen(r)}
                  />
                </div>
              )),
            )}
          </div>
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-3 sm:justify-center sm:gap-6 sm:px-6 [scrollbar-width:none]">
          {items.map((r, i) => (
            <ReleaseCard
              key={i}
              r={r}
              isNew={i === newest}
              onOpen={() => setOpen(r)}
              className="snap-center"
            />
          ))}
        </div>
      )}

      <ReleaseDialog r={open} onClose={() => setOpen(null)} />
    </div>
  );
}

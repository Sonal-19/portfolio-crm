import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Disc3,
  ExternalLink,
  Music2,
  Music4,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { api, call } from "@/lib/api";
import { PLATFORM_META, type ReleasePlatform } from "@/lib/releases";
import { cn, ymd } from "@/lib/utils";

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
        className="group/btn flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-navy-2/80 px-3.5 py-2 text-sm font-semibold text-cream transition-all duration-300 hover:border-gold/60 hover:bg-white/10 hover:shadow-[0_8px_25px_-5px_rgba(212,166,74,0.25)]"
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover/btn:scale-110"
          style={{
            backgroundColor: `${meta.color}22`,
            border: `1px solid ${meta.color}44`,
          }}
        >
          <Icon className="size-4" style={{ color: meta.color }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-cream">{meta.label}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold-light group-hover/btn:border-gold/60 group-hover/btn:bg-gold/20">
          Open <ExternalLink className="size-3" />
        </span>
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`Listen on ${meta.label}`}
      aria-label={`Open on ${meta.label}`}
      onClick={(e) => e.stopPropagation()}
      className="group/plat pointer-events-auto relative flex h-7.5 sm:h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 sm:px-3 text-[11px] sm:text-xs font-medium text-cream backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-gold/80 hover:bg-black/85 active:scale-95 shadow-sm"
    >
      <Icon
        className="size-3.5 shrink-0 transition-transform duration-300 group-hover/plat:scale-110"
        style={{ color: meta.color }}
      />
      <span className="text-cream/90">{meta.label}</span>
    </a>
  );
}

/** Clean standalone card used in Admin previews & fallback grids */
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
      onClick={onOpen}
      className={cn(
        "group/card relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-[#091126] shadow-[0_16px_45px_-10px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-gold/60 hover:shadow-[0_25px_60px_-12px_rgba(240,138,36,0.35)] cursor-pointer",
        r.aspect === "wide" ? "aspect-video" : "aspect-square",
        className,
      )}
    >
      {/* 100% UN-SHADOWED, CRYSTAL CLEAR ARTWORK */}
      <img
        src={r.posterPath}
        alt={r.title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-103"
      />

      {/* Floating Badges */}
      <div className="pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
        {isNew && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold via-gold-light to-saffron px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider text-navy shadow-md ring-1 ring-white/40">
            <Sparkles className="size-3 fill-current text-navy animate-pulse" />
            NEW
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gold-light backdrop-blur-md shadow-sm">
          {r.aspect === "wide" ? (
            <>
              <Play className="size-2.5 fill-current text-saffron" /> Video
            </>
          ) : (
            <>
              <Music2 className="size-2.5 text-gold-light" /> Audio
            </>
          )}
        </span>
      </div>

      {/* Direct Streaming Platform Buttons */}
      {r.links && r.links.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-center gap-1.5 p-2.5 sm:p-3.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
          {r.links.map((link) => (
            <PlatformButton
              key={`${link.platform}-${link.url}`}
              platform={link.platform}
              url={link.url}
            />
          ))}
        </div>
      )}

      {/* Subtle rim highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/10 group-hover/card:ring-gold/50 transition-all duration-300"
        aria-hidden="true"
      />
    </article>
  );
}

/** 3D Perspective Coverflow Carousel with large, unshadowed poster artwork,
 * responsive mobile swipe, side angle tilts, and compact metadata card. */
export function ReleaseCarousel() {
  const { data } = useQuery(releasesQuery);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items = (data ?? []) as ReleaseCardData[];
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const newest = useMemo(() => {
    let best: { i: number; d: string } | null = null;
    items.forEach((r, i) => {
      const d = r.releaseDate ? ymd(r.releaseDate) : "";
      if (d && (!best || d > best.d)) best = { i, d };
    });
    return (best as { i: number; d: string } | null)?.i ?? 0;
  }, [items]);

  const handlePrev = () => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  // Auto-advance every 5 seconds when not paused
  useEffect(() => {
    if (isPaused || items.length <= 1 || reduceMotion) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, items.length, reduceMotion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length]);

  if (items.length === 0) return null;

  // Spacing offsets for the 3D arc (responsive)
  const offset1 = isMobile ? 150 : isTablet ? 270 : 380;
  const offset2 = isMobile ? 260 : isTablet ? 470 : 640;

  const getCardAnimation = (diff: number) => {
    if (diff === 0) {
      return {
        x: 0,
        z: 80,
        rotateY: 0,
        scale: 1,
        opacity: 1,
        filter: "brightness(1)",
      };
    }
    if (diff === -1) {
      return {
        x: -offset1,
        z: -100,
        rotateY: 28,
        scale: isMobile ? 0.82 : 0.88,
        opacity: 0.75,
        filter: "brightness(0.72)",
      };
    }
    if (diff === 1) {
      return {
        x: offset1,
        z: -100,
        rotateY: -28,
        scale: isMobile ? 0.82 : 0.88,
        opacity: 0.75,
        filter: "brightness(0.72)",
      };
    }
    if (diff === -2) {
      return {
        x: -offset2,
        z: -220,
        rotateY: 40,
        scale: 0.72,
        opacity: isMobile ? 0 : 0.35,
        filter: "brightness(0.45)",
      };
    }
    if (diff === 2) {
      return {
        x: offset2,
        z: -220,
        rotateY: -40,
        scale: 0.72,
        opacity: isMobile ? 0 : 0.35,
        filter: "brightness(0.45)",
      };
    }
    return {
      x: diff < 0 ? -offset2 * 1.3 : offset2 * 1.3,
      z: -350,
      rotateY: diff < 0 ? 45 : -45,
      scale: 0.5,
      opacity: 0,
      filter: "brightness(0.2)",
    };
  };

  // Touch swipe support
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartX = t.clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const deltaX = t.clientX - touchStartX;
    if (deltaX > 40) handlePrev();
    else if (deltaX < -40) handleNext();
  };

  return (
    <div className="relative mb-8 sm:mb-12">
      {/* Header section with brand typography, live indicator, and controls */}
      <div className="hidden mx-auto mb-4 sm:mb-6 flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Disc3 className="size-4 animate-[spin_6s_linear_infinite] text-saffron" />
            </span>
            <p className="font-brand text-xs tracking-[0.25em] text-gold-light sm:text-sm whitespace-nowrap">
              LATEST RELEASES
            </p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-cream/70 whitespace-nowrap">
              {items.length} Releases
            </span>
          </div>
          <p className="mt-1 text-xs text-cream/65 sm:text-sm line-clamp-1 sm:line-clamp-none">
            Listen everywhere: YouTube, YouTube Music, Spotify & Apple Music
          </p>
        </div>

        {/* Carousel controls */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-navy-2/80 px-3 py-1.5 text-xs font-medium text-gold-light backdrop-blur-sm transition-colors hover:border-gold hover:bg-gold/15 active:scale-95"
            title={isPaused ? "Resume continuous auto-play" : "Pause auto-play"}
            aria-label={isPaused ? "Resume auto-play" : "Pause auto-play"}
          >
            {isPaused ? (
              <>
                <Play className="size-3 fill-current text-saffron" />
                <span>Play</span>
              </>
            ) : (
              <>
                <Pause className="size-3 fill-current text-gold-light" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- 3D PERSPECTIVE COVERFLOW STAGE --- */}
      <div
        className="relative mx-auto w-full max-w-7xl h-[260px] sm:h-[350px] lg:h-[420px] flex items-center justify-center overflow-visible select-none py-2"
        style={{ perspective: 1400 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Floating Left Navigation Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 z-40 flex size-10 sm:size-12 items-center justify-center rounded-full border border-gold/40 bg-black/70 text-gold-light backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.7)] transition-all hover:scale-110 hover:border-gold hover:bg-gold/25 active:scale-95"
          aria-label="Previous release"
        >
          <ChevronLeft className="size-5 sm:size-6" />
        </button>

        {/* Floating Right Navigation Arrow */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 sm:right-6 z-40 flex size-10 sm:size-12 items-center justify-center rounded-full border border-gold/40 bg-black/70 text-gold-light backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.7)] transition-all hover:scale-110 hover:border-gold hover:bg-gold/25 active:scale-95"
          aria-label="Next release"
        >
          <ChevronRight className="size-5 sm:size-6" />
        </button>

        {/* 3D Arc of Release Cards */}
        {items.map((r, i) => {
          let diff = i - activeIndex;
          if (diff > items.length / 2) diff -= items.length;
          if (diff < -items.length / 2) diff += items.length;

          const zIndex = diff === 0 ? 30 : Math.abs(diff) === 1 ? 20 : 10;
          const isCenter = diff === 0;

          return (
            <motion.div
              key={i}
              className={cn(
                "pointer-events-auto absolute left-1/2 top-1/2",
                isCenter ? "cursor-default" : "cursor-pointer",
              )}
              style={{
                transformStyle: "preserve-3d",
                zIndex,
              }}
              initial={false}
              animate={getCardAnimation(diff)}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 26,
                mass: 0.7,
              }}
              onClick={() => {
                if (!isCenter) {
                  setActiveIndex(i);
                }
              }}
            >
              <div
                className={cn(
                  "relative -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl sm:rounded-3xl",
                  "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] transition-all duration-300",
                  isCenter
                    ? "ring-2 ring-gold/75 shadow-[0_25px_60px_-10px_rgba(240,138,36,0.35),0_15px_40px_rgba(0,0,0,0.9)]"
                    : "ring-1 ring-white/20 hover:ring-gold/50",
                  // Large responsive dimensions:
                  r.aspect === "wide"
                    ? "w-[290px] h-[163px] sm:w-[480px] sm:h-[270px] lg:w-[620px] lg:h-[349px]"
                    : "w-[210px] h-[210px] sm:w-[310px] sm:h-[310px] lg:w-[370px] lg:h-[370px]",
                )}
              >
                {/* 100% CLEAN, UN-SHADOWED ARTWORK - ALL TEXT & DETAILS CRYSTAL CLEAR */}
                <img
                  src={r.posterPath}
                  alt={r.title}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="size-full object-cover select-none"
                />

                {/* Subtle glass reflection highlight on the top edge */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent opacity-60"
                  aria-hidden="true"
                />

                {/* Badges on the card */}
                <div className="pointer-events-none absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 flex items-center gap-1.5 z-10">
                  {i === newest && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold via-gold-light to-saffron px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-navy shadow-md ring-1 ring-white/40">
                      <Music4 className="size-3" /> NEW
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-gold-light backdrop-blur-md shadow-sm">
                    {r.aspect === "wide" ? (
                      <>
                        <Play className="size-2.5 fill-current text-saffron" /> Video
                      </>
                    ) : (
                      <>
                        <Music2 className="size-2.5 text-gold-light" /> Audio
                      </>
                    )}
                  </span>
                </div>

                {/* Direct Streaming Platform Buttons */}
                {r.links && r.links.length > 0 && (
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2.5 pb-2.5 pt-8 sm:px-3.5 sm:pb-3.5 sm:pt-10",
                      "bg-gradient-to-t from-black/90 via-black/50 to-transparent",
                      "transition-all duration-300",
                      isCenter
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none sm:pointer-events-auto sm:opacity-75 sm:hover:opacity-100",
                    )}
                  >
                    {r.links.map((link) => (
                      <PlatformButton
                        key={`${link.platform}-${link.url}`}
                        platform={link.platform}
                        url={link.url}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Subtle indicator dots */}
      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === activeIndex
                  ? "w-6 bg-gradient-to-r from-gold to-saffron shadow-[0_0_8px_rgba(240,138,36,0.5)]"
                  : "w-1.5 bg-white/25 hover:bg-white/50",
              )}
              aria-label={`Jump to release ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


import { youtubeId } from "@api/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Disc3,
  ExternalLink,
  HeartHandshake,
  Loader2,
  HandHeart,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FaApple, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { useIsTouch, useLiteMotion } from "@/hooks/use-media-query";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";
import { ReleaseCarousel } from "./release-carousel";

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YouTubeEvent {
  target: YouTubePlayerInstance;
  data?: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: YouTubeEvent) => void;
            onStateChange?: (event: YouTubeEvent) => void;
          };
        },
      ) => YouTubePlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const goldenParticles = [
  { top: "14%", left: "10%", size: 3.5, delay: 0, duration: 7 },
  { top: "25%", right: "12%", size: 4, delay: 1.2, duration: 8 },
  { top: "45%", left: "6%", size: 3, delay: 2.5, duration: 7.5 },
  { top: "68%", right: "8%", size: 4.5, delay: 0.8, duration: 9 },
  { top: "35%", left: "42%", size: 3, delay: 1.8, duration: 6.8 },
  { top: "82%", left: "22%", size: 3.5, delay: 3, duration: 8.2 },
  { top: "18%", right: "32%", size: 3, delay: 2.1, duration: 7.2 },
  { top: "58%", right: "38%", size: 4, delay: 3.8, duration: 8.5 },
  { top: "75%", left: "55%", size: 3.5, delay: 1.5, duration: 9.2 },
  { top: "30%", left: "20%", size: 2.5, delay: 0.5, duration: 6.5 },
  { top: "88%", right: "20%", size: 3.5, delay: 2.7, duration: 7.8 },
  { top: "12%", left: "65%", size: 4, delay: 3.2, duration: 8.8 },
];

const floatingMusicElements = [
  { symbol: "♫", left: "6%", delay: 0, duration: 12, size: 20, title: "Music" },
  {
    symbol: "ੴ",
    left: "16%",
    delay: 2.2,
    duration: 15,
    size: 28,
    title: "Ik Onkar",
  },
  {
    symbol: "♬",
    left: "26%",
    delay: 4.5,
    duration: 13,
    size: 18,
    title: "Raag",
  },
  { symbol: "ਸ", left: "36%", delay: 1.1, duration: 14, size: 22, title: "Sa" },
  {
    symbol: "♪",
    left: "48%",
    delay: 3.5,
    duration: 11,
    size: 22,
    title: "Sur",
  },
  { symbol: "ਰੇ", left: "58%", delay: 5.2, duration: 16, size: 22, title: "Re" },
  {
    symbol: "♫",
    left: "70%",
    delay: 0.8,
    duration: 13,
    size: 20,
    title: "Kirtan",
  },
  { symbol: "ਗ", left: "80%", delay: 2.8, duration: 15, size: 22, title: "Ga" },
  {
    symbol: "ੴ",
    left: "90%",
    delay: 4.1,
    duration: 14,
    size: 26,
    title: "Ik Onkar",
  },
  { symbol: "ਮ", left: "42%", delay: 6.0, duration: 17, size: 22, title: "Ma" },
  { symbol: "ਪ", left: "12%", delay: 7.2, duration: 14, size: 22, title: "Pa" },
  {
    symbol: "ਧ",
    left: "75%",
    delay: 6.8,
    duration: 15,
    size: 22,
    title: "Dha",
  },
  {
    symbol: "ਨੀ",
    left: "64%",
    delay: 8.5,
    duration: 16,
    size: 22,
    title: "Ni",
  },
];

const equalizerBars = [
  { h: ["5px", "16px", "7px", "14px", "5px"], d: 1.3, delay: 0 },
  { h: ["12px", "6px", "18px", "8px", "12px"], d: 1.1, delay: 0.2 },
  { h: ["7px", "17px", "9px", "15px", "7px"], d: 1.4, delay: 0.35 },
  { h: ["14px", "7px", "16px", "6px", "14px"], d: 1.2, delay: 0.15 },
  { h: ["6px", "13px", "5px", "15px", "6px"], d: 1.3, delay: 0.25 },
];

export function HeroSection({ s }: { s?: SiteSettings }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastToggleRef = useRef(0);

  const isTouch = useIsTouch();
  const lite = useLiteMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const inView = useInView(heroRef, { margin: "80px" });
  // Continuous background motion only on capable devices, and only while visible.
  const animate = !lite && inView;

  // Track chosen by the admin (Settings → Hero music) with resilient default.
  const videoId = youtubeId(s?.heroTrackUrl) || "bFoQyydNFLw";
  const trackTitle = s?.heroTrackTitle || "Satgur Tumre Kaaj Saware";
  const trackSubtitle = s?.heroTrackSubtitle || "66 Lakh+ views";
  const trackUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const isDefaultTrack = !s?.heroTrackUrl || videoId === "bFoQyydNFLw";

  const updateMediaSession = (playing: boolean) => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackTitle,
          artist: "Bhai Gurpreet Singh Ji Shimla Wale",
          album: "Gurbani Kirtan",
          artwork: [
            {
              src: s?.heroImagePath ?? "/uploads/brand/mum9yvx9-r53u7sxm.webp",
              sizes: "512x512",
              type: "image/webp",
            },
          ],
        });
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
        navigator.mediaSession.setActionHandler("play", () => {
          if (audioRef.current?.paused) {
            audioRef.current.play().catch(() => {});
          }
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          audioRef.current?.pause();
        });
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } catch {}
    };
  }, []);

  // Smooth mouse-following luxury golden spotlight for desktop
  const mouseX = useMotionValue(55);
  const mouseY = useMotionValue(40);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 25 });
  const mouseGlow = useMotionTemplate`radial-gradient(750px circle at ${springX}% ${springY}%, rgba(240, 138, 36, 0.14), rgba(212, 166, 74, 0.06) 40%, transparent 75%)`;

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !window.YT?.Player) return;
      const iframe = document.getElementById(
        "hero-yt-iframe",
      ) as HTMLIFrameElement | null;
      if (!iframe) return;

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player("hero-yt-iframe", {
          events: {
            onReady: (event: YouTubeEvent) => {
              if (!isMounted) return;
              try {
                event.target.setVolume(100);
                if (isPlayingRef.current && !isDefaultTrack) {
                  event.target.playVideo();
                  event.target.unMute();
                }
              } catch {}
            },
            onStateChange: (event: YouTubeEvent) => {
              if (!isMounted) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                isPlayingRef.current = true;
                setPending(false);
                try {
                  event.target.unMute();
                  event.target.setVolume(100);
                } catch {}
              } else if (event.data === 2) {
                if (!isDefaultTrack) {
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                }
                setPending(false);
              } else if (event.data === 0) {
                if (isPlayingRef.current && !isDefaultTrack) {
                  event.target.playVideo();
                } else if (!isDefaultTrack) {
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                }
              }
            },
          },
        });
      } catch {}
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [videoId, isDefaultTrack]);

  const handleTogglePlay = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();

    // Prevent double-activation if multiple rapid clicks occur
    const now = Date.now();
    if (now - lastToggleRef.current < 250) return;
    lastToggleRef.current = now;

    const audio = audioRef.current;

    // 1. If currently playing: PAUSE
    if (isPlayingRef.current || (audio && !audio.paused)) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setPending(false);
      try {
        if (audio) {
          audio.pause();
        }
      } catch {}
      try {
        playerRef.current?.pauseVideo();
      } catch {}
      const iframe =
        iframeRef.current ??
        (document.getElementById("hero-yt-iframe") as HTMLIFrameElement | null);
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*",
      );
      updateMediaSession(false);
      return;
    }

    // 2. If currently paused: PLAY
    setPending(true);

    if (isDefaultTrack) {
      if (audio) {
        // Ensure unmuted & full volume for mobile Android/iOS
        audio.muted = false;
        audio.volume = 1.0;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              setPending(false);
              updateMediaSession(true);
            })
            .catch((err) => {
              console.warn("Direct HTML5 audio play error:", err);
              setIsPlaying(false);
              isPlayingRef.current = false;
              setPending(false);
              // Fallback to YouTube iframe
              try {
                playerRef.current?.playVideo();
                playerRef.current?.unMute();
                playerRef.current?.setVolume(100);
              } catch {}
            });
        } else {
          setIsPlaying(true);
          isPlayingRef.current = true;
          setPending(false);
        }
      } else {
        setPending(false);
      }
    } else {
      // Custom track via YouTube player
      try {
        playerRef.current?.playVideo();
        playerRef.current?.unMute();
        playerRef.current?.setVolume(100);
      } catch {}

      const iframe =
        iframeRef.current ??
        (document.getElementById("hero-yt-iframe") as HTMLIFrameElement | null);
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: "" }),
          "*",
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: "" }),
          "*",
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
          "*",
        );
      }
      setIsPlaying(true);
      isPlayingRef.current = true;
      setPending(false);
      updateMediaSession(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mouseX.set(x);
    mouseY.set(y);
  };

  const listen = [
    { href: s?.youtubeUrl, label: "YouTube", Icon: FaYoutube },
    { href: s?.spotifyUrl, label: "Spotify", Icon: FaSpotify },
    { href: s?.appleMusicUrl, label: "Apple Music", Icon: FaApple },
  ].filter((l) => l.href);

  const statsItems = [
    {
      value: s?.stats?.views ?? "66 Lakh+",
      label: "YouTube views",
      Icon: FaYoutube,
      badgeColor: "text-red-600 bg-white border-red-400/20",
    },
    {
      value: s?.stats?.followers ?? "94K+",
      label: "Instagram family",
      Icon: FaInstagram,
      badgeColor: "text-pink-600 bg-white border-pink-400/20",
    },
    {
      value: s?.stats?.years ?? "20+",
      label: "Years of seva",
      Icon: HeartHandshake,
      badgeColor: "text-gold bg-white border-gold/25",
    },
    {
      value: s?.stats?.albums ?? "25+",
      label: "Albums & releases",
      Icon: Disc3,
      badgeColor: "text-saffron bg-white border-saffron/25",
    },
  ];

  return (
    <section
      id="home"
      ref={heroRef}
      onMouseMove={lite ? undefined : handleMouseMove}
      className="relative overflow-hidden bg-[#070b18] pt-28 pb-16 text-cream sm:pt-32 lg:pb-24"
    >
      {/* 1. Cinematic Gurmat Sangeet & Sikh Heritage Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Base midnight dark gradient */}
        <div className="absolute inset-0 bg-[#070b18]" />

        {/* Gurmat Sangeet Artwork Backdrop Image with gentle zoom & parallax breathing */}
        <motion.div
          animate={animate ? { scale: [1, 1.05, 1], y: [0, -8, 0] } : undefined}
          transition={{
            duration: 22,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute inset-0"
        >
          <picture>
            <source srcSet="/gurmat-sangeet-hero-bg.webp" type="image/webp" />
            <img
              src="/gurmat-sangeet-hero-bg.jpg"
              alt=""
              role="presentation"
              fetchPriority="high"
              decoding="async"
              className={cn(
                "size-full object-cover object-center",
                // Blend modes + filters on a full-bleed image are costly on mobile GPUs.
                lite
                  ? "opacity-75"
                  : "opacity-90 mix-blend-screen filter brightness-110 contrast-115 lg:opacity-80",
              )}
            />
          </picture>
        </motion.div>

        {/* Multi-directional Gradients for crystal-clear readability & cinematic contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b18] via-transparent to-[#070b18]/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b18]/95 via-[#070b18]/70 to-[#070b18]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#070b18]/40 to-[#070b18]/90" />

        {/* Golden-amber ethereal warm glow behind portrait side */}
        <motion.div
          animate={
            animate
              ? {
                  scale: isPlaying ? [1, 1.22, 1] : [1, 1.12, 1],
                  opacity: isPlaying ? [0.6, 0.85, 0.6] : [0.4, 0.65, 0.4],
                }
              : undefined
          }
          transition={{
            duration: isPlaying ? 3 : 7,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute -top-16 right-0 rounded-full bg-gradient-to-br from-saffron/25 via-gold/18 to-transparent",
            lite
              ? "size-[360px] opacity-60 blur-3xl"
              : "w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] blur-[130px]",
          )}
        />

        {/* Deep royal indigo secondary ambient bloom */}
        {!lite && (
          <div className="absolute -bottom-20 left-0 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full bg-gradient-to-tr from-navy-2/60 via-navy/35 to-transparent blur-[120px] opacity-80" />
        )}

        {/* Center warm ambient light bloom */}
        <motion.div
          animate={
            animate
              ? {
                  scale: isPlaying ? [1, 1.25, 1] : [1, 1.15, 1],
                  opacity: isPlaying ? [0.55, 0.8, 0.55] : [0.35, 0.6, 0.35],
                }
              : undefined
          }
          transition={{
            duration: isPlaying ? 3.5 : 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute top-1/4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-gold/15 via-saffron/10 to-transparent",
            lite
              ? "size-[320px] opacity-50 blur-3xl"
              : "size-[450px] sm:size-[650px] blur-[100px]",
          )}
        />

        {/* Divine Golden Rays (God Rays cascading from above) */}
        {!lite && (
          <>
            <div className="absolute -top-24 left-1/4 w-[360px] h-[650px] -rotate-12 bg-gradient-to-b from-gold/18 via-saffron/6 to-transparent blur-3xl opacity-70" />
            <div className="absolute -top-28 right-1/4 w-[380px] h-[700px] rotate-15 bg-gradient-to-b from-gold/15 via-gold/4 to-transparent blur-3xl opacity-60" />
          </>
        )}

        {/* Sacred Celestial Rotating Sikh Mandala / Darbar Sahib Rosette */}
        <motion.div
          animate={animate ? { rotate: 360 } : undefined}
          transition={{
            duration: 120,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[850px] lg:size-[1050px] opacity-15 pointer-events-none select-none"
        >
          <svg
            viewBox="0 0 400 400"
            className="size-full fill-none stroke-gold/40 stroke-[0.75]"
          >
            <circle cx="200" cy="200" r="185" strokeDasharray="3 6" />
            <circle cx="200" cy="200" r="160" />
            <circle cx="200" cy="200" r="135" strokeDasharray="2 4" />
            <circle cx="200" cy="200" r="105" />
            <circle cx="200" cy="200" r="65" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="28" />
            {Array.from({ length: 16 }).map((_, idx) => {
              const angle = (idx * 360) / 16;
              return (
                <g key={idx} transform={`rotate(${angle} 200 200)`}>
                  <path
                    d="M200,45 C215,80 235,115 200,155 C165,115 185,80 200,45 Z"
                    fill="rgba(240, 138, 36, 0.04)"
                    stroke="rgba(243, 213, 138, 0.35)"
                  />
                  <line
                    x1="200"
                    y1="20"
                    x2="200"
                    y2="45"
                    stroke="rgba(243, 213, 138, 0.4)"
                  />
                  <circle
                    cx="200"
                    cy="18"
                    r="2"
                    fill="rgba(243, 213, 138, 0.5)"
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Audio-Reactive Soundwave Radiating Rings (Active when playing) */}
        {isPlaying && animate && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                animate={{
                  scale: [0.6, 2.4],
                  opacity: [0.55, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: ring * 1.3,
                  ease: "easeOut",
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 size-[350px] sm:size-[500px] rounded-full border border-gold/30 shadow-[0_0_25px_rgba(240,138,36,0.3)]"
              />
            ))}
          </div>
        )}

        {/* Desktop Interactive Smooth Spotlight */}
        {!lite && (
          <motion.div
            style={{ background: mouseGlow }}
            className="absolute inset-0 hidden lg:block"
          />
        )}

        {/* Floating Divine Swaras & Musical Notes (Ascending like fragrant Ardaas incense) */}
        {animate &&
          floatingMusicElements.map((el, i) => (
            <motion.div
              key={i}
              initial={{ y: 80, opacity: 0 }}
              animate={{
                y: [-20, -500],
                x: [-14, 14, -10, 12, -14],
                opacity: [0, 0.75, 0.85, 0.2, 0],
                scale: [0.75, 1.15, 0.9],
                rotate: [-10, 10, -5, 8, -10],
              }}
              transition={{
                duration: el.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: el.delay,
              }}
              style={{
                left: el.left,
                bottom: "5%",
                fontSize: `${el.size}px`,
              }}
              className="absolute font-gurmukhi select-none text-gold-light/65 drop-shadow-[0_0_10px_rgba(243,213,138,0.7)] pointer-events-none"
              title={el.title}
            >
              {el.symbol}
            </motion.div>
          ))}

        {/* Floating Delicate Golden Bokeh Particles */}
        {animate &&
          goldenParticles.map((p, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-12, 12, -12],
                x: [-6, 6, -6],
                opacity: [0.25, 0.85, 0.25],
                scale: [0.85, 1.35, 0.85],
              }}
              transition={{
                duration: p.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: p.delay,
              }}
              style={{
                top: p.top,
                left: p.left,
                right: p.right,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              className="absolute rounded-full bg-gold-light/80 shadow-[0_0_10px_rgba(243,213,138,0.9)]"
            />
          ))}
      </div>

      {/* Latest album / song posters (admin → Releases) */}
      <ReleaseCarousel />

      {/* Main Grid: Title & Floating Glass Card */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Header / Title Section (order-2 on Mobile, order-1 on Desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="order-2 text-center lg:order-1 lg:text-left"
        >
          {/* Sacred Gurmukhi Benediction Badge */}
          <motion.div
            whileHover={{
              scale: 1.025,
              borderColor: "rgba(212, 166, 74, 0.6)",
            }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex cursor-default items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 lg:backdrop-blur-md shadow-sm transition-colors hover:bg-gold/15"
          >
            <p className="font-gurmukhi text-xs sm:text-sm font-medium text-gold-light tracking-wide">
              ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ
            </p>
          </motion.div>

          {/* Main Title / Artist Branding */}
          <h1 className="mt-4 sm:mt-5 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
            <span className="block text-cream/90 text-2xl sm:text-3xl lg:text-4xl font-normal">
              Bhai
            </span>
            <span className="text-gold-gradient font-bold tracking-tight drop-shadow-[0_2px_18px_rgba(240,138,36,0.3)]">
              Gurpreet Singh Ji
            </span>
            <span className="mt-1 block font-brand text-3xl tracking-[0.14em] text-cream sm:text-4xl lg:text-5xl">
              Shimla Wale
            </span>
          </h1>

          <p className="mx-auto mt-4 sm:mt-5 max-w-xl text-base sm:text-lg text-cream/75 leading-relaxed font-sans lg:mx-0">
            {s?.tagline ??
              "Gurbani Kirtan · 30+ Years of Seva · Chairman, Amritvela Trust"}
          </p>

          {/* Gurmat Sangeet Classical Heritage Badge */}
          <div className="mt-3.5 flex items-center justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-medium text-gold-light lg:backdrop-blur-md shadow-sm">
              <span className="size-1.5 rounded-full bg-gold animate-pulse" />
              <span>
                Harmonium · Tabla · Tanti Saaj · Sri Guru Granth Sahib Raags
              </span>
            </span>
          </div>

          {/* Interactive CTAs */}
          <div className="mt-7 sm:mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden h-12 sm:h-13 w-full sm:w-auto rounded-full bg-gradient-to-r from-gold via-saffron to-gold bg-[length:200%_auto] px-7 text-sm sm:text-base font-semibold text-navy shadow-lg shadow-saffron/25 transition-all duration-300 hover:shadow-saffron/40 hover:brightness-105 active:scale-[0.98] cursor-pointer"
              >
                <Link
                  to="/kirtan/book"
                  className="flex items-center justify-center gap-2 relative z-10"
                >
                  <HandHeart className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                  <span>Book Kirtan</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group h-12 sm:h-13 w-full sm:w-auto rounded-full border border-gold/50 bg-white/5 lg:backdrop-blur-md px-7 text-sm sm:text-base font-medium text-cream shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-gold hover:text-gold-light active:scale-[0.98] cursor-pointer"
              >
                <a
                  href="#latest"
                  className="flex items-center justify-center gap-2"
                >
                  <Play className="size-4 shrink-0 fill-current/30 transition-transform duration-300 group-hover:scale-110 group-hover:fill-gold" />
                  <span>Latest Kirtan</span>
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Interactive Streaming Badges */}
          {listen.length > 0 && (
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2.5 sm:gap-3 text-sm text-cream/65 lg:justify-start">
              <span className="text-xs uppercase tracking-widest font-semibold text-gold-light/70 mr-0.5">
                Listen on
              </span>
              <div className="flex gap-1 sm:gap-2">
                {listen.map(({ href, label, Icon }) => (
                  <motion.a
                    key={label}
                    href={href ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -3, scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 lg:backdrop-blur-md px-3.5 py-1.5 text-xs sm:text-sm font-medium text-cream/90 shadow-sm transition-all duration-200 hover:border-gold hover:bg-gold/15 hover:text-gold-light"
                  >
                    <Icon className="size-3.5 sm:size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 text-gold-light" />
                    <span>{label}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Transparent Silhouette Artist Showcase (order-1 on Mobile, order-2 on Desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block order-1 relative mx-auto flex flex-col items-center w-full max-w-[320px] sm:max-w-[400px] lg:order-2 lg:max-w-[480px] xl:max-w-[520px] mb-6 sm:mb-8 lg:mb-0"
        >
          {/* Luminous Warm Golden Halo Aura directly behind Bhai Sahib */}
          <div className="pointer-events-none absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 size-[260px] sm:size-[340px] lg:size-[400px] rounded-full bg-gradient-to-b from-gold/35 via-saffron/20 to-transparent blur-3xl opacity-80" />

          {/* Delicate Sacred Celestial Halo Rings */}
          <div className="pointer-events-none absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 size-[240px] sm:size-[310px] lg:size-[360px] rounded-full border border-gold/25 opacity-60" />
          <div className="pointer-events-none absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 size-[210px] sm:size-[270px] lg:size-[310px] rounded-full border border-gold-light/15 border-dashed opacity-45" />

          {/* Transparent Cutout Image of Bhai Sahib */}
          <div className="relative w-full flex justify-center select-none">
            <motion.img
              src={
                s?.heroImagePath ?? "/uploads/brand/profile-transparent.webp"
              }
              alt={s?.artistName ?? "Bhai Gurpreet Singh Ji Shimla Wale"}
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              fetchPriority="high"
              className={cn(
                "relative z-10 w-full max-h-[440px] sm:max-h-[500px] lg:max-h-[560px] object-contain object-bottom border-2 border-gold/15 rounded-3xl cursor-pointer",
                // Stacked drop-shadow filters on a large image are expensive on phones.
                lite
                  ? "shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                  : "drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] drop-shadow-[0_0_35px_rgba(212,166,74,0.2)]",
              )}
            />

            {/* Seamless Soft Fade at the Bottom of the Silhouette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-[#070b18] via-[#070b18]/70 to-transparent z-20" />
          </div>

          {/* Native HTML5 Audio Engine for instant sound on Android Chrome, iOS Safari & Mobile */}
          <audio
            ref={audioRef}
            id="hero-native-audio"
            preload="metadata"
            playsInline
            loop
            aria-hidden="true"
            onPlay={() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              setPending(false);
              updateMediaSession(true);
            }}
            onPlaying={() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              setPending(false);
            }}
            onPause={() => {
              setIsPlaying(false);
              isPlayingRef.current = false;
              setPending(false);
              updateMediaSession(false);
            }}
            onWaiting={() => {
              setPending(true);
            }}
            onEnded={() => {
              setIsPlaying(false);
              isPlayingRef.current = false;
              setPending(false);
              updateMediaSession(false);
            }}
            onError={(e) => {
              console.warn("Hero audio element error:", e.currentTarget.error);
              setIsPlaying(false);
              isPlayingRef.current = false;
              setPending(false);
            }}
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              left: "-9999px",
              bottom: 0,
            }}
          >
            <source src="/audio/hero-music.m4a?v=2" type="audio/mp4" />
            <source src="/audio/hero-music.mp3?v=2" type="audio/mpeg" />
          </audio>

          {/* Floating Glass Music Track Card (track set in Admin → Settings) */}
          {videoId && (
            <motion.div
              onClick={(e) => handleTogglePlay(e)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTogglePlay(e);
                }
              }}
              role="button"
              tabIndex={0}
              title={
                isPlaying ? `Pause '${trackTitle}'` : `Play '${trackTitle}'`
              }
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="group relative z-30 -mt-8 sm:-mt-10 flex w-full max-w-[340px] sm:max-w-[420px] items-center justify-between gap-3 rounded-2xl border border-gold/35 bg-[#070b18]/95 p-3 sm:p-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.75)] lg:backdrop-blur-xl transition-all duration-300 hover:border-gold hover:shadow-[0_0_25px_rgba(212,166,74,0.25)] cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Dedicated & Distinct Play / Pause Music Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay(e);
                  }}
                  aria-label={
                    isPlaying ? "Pause website music" : "Play music on website"
                  }
                  title={
                    isPlaying ? "Pause website music" : "Play music on website"
                  }
                  className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold via-saffron to-gold-dark text-navy font-bold shadow-lg shadow-gold/25 transition-all duration-200 hover:scale-110 hover:shadow-gold/40 active:scale-95 cursor-pointer z-10"
                >
                  {pending ? (
                    <Loader2 className="size-5 animate-spin text-navy" />
                  ) : isPlaying ? (
                    <Pause className="size-5 fill-navy text-navy transition-transform duration-200" />
                  ) : (
                    <Play className="size-5 fill-navy text-navy ml-0.5 transition-transform duration-200" />
                  )}
                </button>

                <div className="min-w-0 text-left">
                  <p className="truncate text-xs sm:text-sm font-semibold text-cream font-display group-hover:text-gold-light transition-colors">
                    {trackTitle}
                  </p>
                  <div className="truncate text-[10px] sm:text-xs flex items-center gap-1.5 mt-0.5">
                    {isPlaying ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Playing now</span>
                      </span>
                    ) : pending ? (
                      <span className="text-gold-light/80">Starting…</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gold-light/80">
                        <Volume2 className="size-3 shrink-0" />
                        <span>{isTouch ? "Tap to play" : "Click to play"}</span>
                      </span>
                    )}
                    {trackSubtitle && (
                      <>
                        <span className="text-white/30">·</span>
                        <span className="text-cream/60">{trackSubtitle}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Soundwave Equalizer + YouTube Link Pill */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pr-1">
                {/* Soundwave Frequency Equalizer */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  aria-hidden="true"
                >
                  {equalizerBars.map((b, idx) => (
                    <motion.span
                      key={idx}
                      animate={isPlaying ? { height: b.h } : { height: "4px" }}
                      transition={
                        isPlaying
                          ? {
                              duration: b.d,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: b.delay,
                            }
                          : { duration: 0.3 }
                      }
                      className={`w-[2px] sm:w-[2.5px] rounded-full inline-block transition-all duration-300 ${
                        isPlaying
                          ? idx % 2 === 0
                            ? "bg-gold"
                            : "bg-saffron"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>

                {/* YouTube external badge */}
                <a
                  href={trackUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      audioRef.current?.pause();
                    } catch {}
                    try {
                      playerRef.current?.pauseVideo();
                    } catch {}
                    const iframe =
                      iframeRef.current ??
                      (document.getElementById(
                        "hero-yt-iframe",
                      ) as HTMLIFrameElement | null);
                    iframe?.contentWindow?.postMessage(
                      JSON.stringify({
                        event: "command",
                        func: "pauseVideo",
                        args: "",
                      }),
                      "*",
                    );
                    isPlayingRef.current = false;
                    setIsPlaying(false);
                    setPending(false);
                    updateMediaSession(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-red-600/20 border border-red-500/40 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-red-300 group-hover:bg-red-600 group-hover:text-white transition-colors duration-200"
                  title="Open on YouTube"
                >
                  <FaYoutube className="size-3.5 text-red-500 group-hover:text-white transition-colors" />
                  <ExternalLink className="size-2.5 opacity-70 group-hover:opacity-100" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Background YouTube Player (in viewport, active layout so mobile browsers don't suspend audio) */}
          <div
            className="pointer-events-none fixed bottom-0 right-0 z-[-1] size-[200px] opacity-[0.001] overflow-hidden"
            aria-hidden="true"
          >
            <iframe
              id="hero-yt-iframe"
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&loop=1&playlist=${videoId}&playsinline=1&controls=0&rel=0&modestbranding=1`}
              title={trackTitle}
              allow="autoplay; encrypted-media"
              className="size-full border-0"
            />
          </div>
        </motion.div>
      </div>

      {/* Interactive Glassmorphism Stats Cards */}
      {/* <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="relative mx-auto mt-14 sm:mt-16 max-w-5xl px-4 sm:px-6"
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statsItems.map(({ value, label, Icon, badgeColor }) => (
            <motion.div
              key={label}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 text-center lg:backdrop-blur-md shadow-xl transition-all duration-300 hover:border-gold/45 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-gold/10 cursor-pointer"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold/0 to-transparent transition-all duration-500 group-hover:via-gold/90" />
              <div
                className={`mx-auto mb-2 flex size-8 sm:size-9 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-110 ${badgeColor}`}
              >
                <Icon className="size-4 sm:size-4.5" />
              </div>

              <dd className="font-display text-2xl font-bold tracking-tight text-gold-gradient sm:text-3xl">
                {value}
              </dd>
              <dt className="mt-1 text-[11px] sm:text-xs uppercase tracking-widest font-medium text-cream/65 group-hover:text-cream/90 transition-colors">
                {label}
              </dt>
            </motion.div>
          ))}
        </div>
      </motion.div> */}
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { HandHeart, Play } from "lucide-react";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import type React from "react";
import { useRef, useState } from "react";
import { FaApple, FaSpotify, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { useLiteMotion } from "@/hooks/use-media-query";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { type ReleaseCardData, ReleaseCarousel } from "./release-carousel";

const floatingNotes = [
  { symbol: "ੴ", left: "8%", delay: 0, duration: 14, size: 26 },
  { symbol: "♫", left: "22%", delay: 3.2, duration: 12, size: 18 },
  { symbol: "ਸ", left: "38%", delay: 6.1, duration: 15, size: 20 },
  { symbol: "♪", left: "62%", delay: 1.6, duration: 13, size: 20 },
  { symbol: "ਰੇ", left: "78%", delay: 4.4, duration: 16, size: 20 },
  { symbol: "ੴ", left: "92%", delay: 7.5, duration: 14, size: 24 },
];

const TAP_SYMBOLS = ["♪", "♫", "ੴ", "♬", "ਸ", "ਰੇ"];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

const wordVariants: Variants = {
  hidden: { y: "110%", rotate: 4 },
  show: { y: "0%", rotate: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 18, rotateX: -80 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const groupVariants = (stagger: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

/** Splits "A · B · C" settings text into its parts (no new content). */
const splitDots = (text: string) =>
  text
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

/** Pulls its child gently toward the cursor (disabled on touch / lite). */
function Magnetic({
  children,
  disabled,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 15 });
  const springY = useSpring(y, { stiffness: 220, damping: 15 });

  return (
    <motion.div
      onMouseMove={
        disabled
          ? undefined
          : (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              x.set((e.clientX - (rect.left + rect.width / 2)) * 0.3);
              y.set((e.clientY - (rect.top + rect.height / 2)) * 0.4);
            }
      }
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={disabled ? undefined : { x: springX, y: springY }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** One bar of the bottom waveform: swells when the cursor / finger is near. */
function WaveBar({
  index,
  count,
  cursor,
  animate,
}: {
  index: number;
  count: number;
  cursor: MotionValue<number>;
  animate: boolean;
}) {
  const pos = (index / (count - 1)) * 100;
  const height = useTransform(cursor, (c) => {
    const d = (c - pos) / 8;
    return 18 + 72 * Math.exp(-d * d);
  });
  const base = 0.3 + 0.7 * Math.abs(Math.sin(index * 1.7));

  return (
    <motion.div style={{ height }} className="flex flex-1 items-end">
      <motion.span
        animate={animate ? { scaleY: [base, 1, base * 0.55, base] } : undefined}
        transition={{
          duration: 1.6 + (index % 5) * 0.3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: (index % 7) * 0.15,
        }}
        style={{ scaleY: base, transformOrigin: "bottom" }}
        className="block h-full w-full rounded-t-full bg-gradient-to-t from-saffron/45 via-gold/30 to-gold-light/5"
      />
    </motion.div>
  );
}

export function HeroSection({ s }: { s?: SiteSettings }) {
  const lite = useLiteMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const inView = useInView(heroRef, { margin: "80px" });
  // Continuous background motion only on capable devices, and only while visible.
  const animate = !lite && inView;

  // The release in front of the carousel tints the whole hero background.
  const [active, setActive] = useState<ReleaseCardData | null>(null);

  // Cursor spotlight + headline parallax (desktop only).
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(35);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 25 });
  const spotlight = useMotionTemplate`radial-gradient(700px circle at ${springX}% ${springY}%, rgba(240, 138, 36, 0.13), rgba(212, 166, 74, 0.05) 40%, transparent 75%)`;
  const titleX = useTransform(springX, [0, 100], [-14, 14]);
  const titleY = useTransform(springY, [0, 100], [-8, 8]);
  const auraX = useTransform(springX, [0, 100], [30, -30]);
  const auraY = useTransform(springY, [0, 100], [20, -20]);

  // Waveform follows the pointer on every device (mouse hover or finger drag).
  const waveTarget = useMotionValue(-50);
  const waveX = useSpring(waveTarget, { stiffness: 120, damping: 20 });
  const waveCount = lite ? 28 : 64;

  // Tapping / clicking the hero releases a musical note that floats up.
  const [tapNotes, setTapNotes] = useState<
    { id: number; x: number; y: number; symbol: string }[]
  >([]);
  const tapNoteId = useRef(0);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    waveTarget.set(x);
    if (lite) return;
    mouseX.set(x);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++tapNoteId.current;
    setTapNotes((prev) => [
      ...prev.slice(-5),
      {
        id,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        symbol: TAP_SYMBOLS[id % TAP_SYMBOLS.length] ?? "♪",
      },
    ]);
    waveTarget.set(((e.clientX - rect.left) / rect.width) * 100);
  };

  const listen = [
    { href: s?.youtubeUrl, label: "YouTube", Icon: FaYoutube },
    { href: s?.spotifyUrl, label: "Spotify", Icon: FaSpotify },
    { href: s?.appleMusicUrl, label: "Apple Music", Icon: FaApple },
  ].filter((l) => l.href);

  const heritageParts = splitDots(
    "Harmonium · Tabla · Tanti Saaj · Sri Guru Granth Sahib Raags · Gurmat Sangeet · Amritvela Kirtan",
  );

  return (
    <section
      id="home"
      ref={heroRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => waveTarget.set(-50)}
      className="relative overflow-hidden bg-[#05070f] pt-20 text-cream sm:pt-24"
    >
      {/* ── Background ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* <AnimatePresence>
          {active ? (
            <motion.img
              key={active.posterPath}
              src={active.posterPath}
              alt=""
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: lite ? 0.35 : 0.5, scale: 1.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute inset-0 size-full object-cover blur-3xl saturate-150"
            />
          ) : (
            <motion.picture
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <source srcSet="/gurmat-sangeet-hero-bg.webp" type="image/webp" />
              <img
                src="/gurmat-sangeet-hero-bg.jpg"
                alt=""
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            </motion.picture>
          )}
        </AnimatePresence> */}

        {/* Readability veil: dark top for the headline, dark bottom edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/90 via-[#05070f]/55 to-[#05070f]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,#05070f_80%)] opacity-70" />

        {/* Fine dot grid that fades out from the centre */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(243,213,138,0.16)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_50%_30%,#000_10%,transparent_65%)]" />

        {/* Warm horizon glow behind the carousel */}
        {/* <div className="absolute inset-x-0 bottom-[18%] mx-auto h-[45%] max-w-5xl rounded-[100%] bg-gradient-to-t from-saffron/25 via-gold/10 to-transparent blur-3xl" /> */}

        {/* Cursor spotlight */}
        {!lite && (
          <motion.div
            style={{ background: spotlight }}
            className="absolute inset-0"
          />
        )}

        {/* Rising notes, like incense at Amritvela */}
        {animate &&
          floatingNotes.map((n, i) => (
            <motion.span
              key={i}
              initial={{ y: 60, opacity: 0 }}
              animate={{
                y: [0, -520],
                x: [-10, 10, -8, 10],
                opacity: [0, 0.7, 0.5, 0],
              }}
              transition={{
                duration: n.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: n.delay,
              }}
              style={{ left: n.left, bottom: "10%", fontSize: n.size }}
              className="absolute select-none font-gurmukhi text-gold-light/60 drop-shadow-[0_0_10px_rgba(243,213,138,0.6)]"
            >
              {n.symbol}
            </motion.span>
          ))}

        {/* Notes that rise from wherever the hero is clicked / tapped */}
        {tapNotes.map((n) => (
          <motion.span
            key={n.id}
            initial={{ opacity: 0, y: 0, scale: 0.6, rotate: -10 }}
            animate={{
              opacity: [0, 1, 0],
              y: -110,
              x: [0, 12, -8],
              scale: 1.2,
              rotate: 10,
            }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            onAnimationComplete={() =>
              setTapNotes((prev) => prev.filter((p) => p.id !== n.id))
            }
            style={{ left: n.x - 12, top: n.y - 16 }}
            className="absolute select-none font-gurmukhi text-2xl text-gold-light drop-shadow-[0_0_12px_rgba(243,213,138,0.9)]"
          >
            {n.symbol}
          </motion.span>
        ))}
      </div>

      {/* ── Latest releases stage ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: EASE_OUT }}
        className="relative"
      >
        {/* {active && (
          <div className="mx-auto mb-3 flex max-w-3xl flex-col items-center gap-1.5 px-4 text-center sm:mb-5 sm:px-6">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-3.5 items-end gap-[2px]"
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.span
                    key={i}
                    animate={
                      animate ? { scaleY: [0.3, 1, 0.5, 0.9, 0.3] } : undefined
                    }
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.15,
                    }}
                    style={{
                      scaleY: 0.4 + (i % 2) * 0.5,
                      transformOrigin: "bottom",
                    }}
                    className="block h-full w-[3px] rounded-full bg-saffron"
                  />
                ))}
              </span>
              <span className="font-brand text-[11px] tracking-[0.3em] text-gold-light sm:text-xs">
                LATEST RELEASES
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={active.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="line-clamp-1 font-display text-lg text-cream sm:text-2xl"
              >
                {active.title}
              </motion.p>
            </AnimatePresence>
          </div>
        )} */}

        <ReleaseCarousel onActiveChange={setActive} />
      </motion.div>

    {/* ── Headline ───────────────────────────────────────────────── */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-5xl px-4 text-center sm:px-6"
      >
        {/* Ik Onkar watermark behind the name: slow breathing glow + shimmer */}
        <motion.div
          aria-hidden="true"
          style={lite ? undefined : { x: auraX, y: auraY }}
          className="pointer-events-none absolute inset-x-0 top-2 flex justify-center sm:-top-4"
        >
          <motion.span
            animate={
              animate
                ? {
                    opacity: [0.12, 0.22, 0.12],
                    scale: [1, 1.04, 1],
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }
                : undefined
            }
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              backgroundSize: "200% auto",
              WebkitTextStroke: "1px rgba(243, 213, 138, 0.5)",
              ...(lite ? { opacity: 0.14 } : {}),
            }}
            className="select-none bg-gradient-to-r from-gold/10 via-gold-light/60 to-saffron/10 bg-clip-text font-gurmukhi text-[15rem] leading-none text-transparent blur-[0.5px] sm:text-[22rem] lg:text-[26rem]"
          >
            ੴ
          </motion.span>
        </motion.div>

        {/* Gurmukhi benediction between two drawn rules */}
        <motion.div
          variants={riseVariants}
          className="relative flex items-center justify-center gap-3 sm:gap-4"
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_OUT }}
            className="h-px w-8 origin-right bg-gradient-to-l from-gold/80 to-transparent sm:w-20"
          />
          <p className="font-gurmukhi text-xs font-medium tracking-wide text-gold-light sm:text-sm">
            ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ
          </p>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_OUT }}
            className="h-px w-8 origin-left bg-gradient-to-r from-gold/80 to-transparent sm:w-20"
          />
        </motion.div>

        <motion.h1
          style={lite ? undefined : { x: titleX, y: titleY }}
          className="relative mt-3 font-display leading-[0.95] sm:mt-5"
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, letterSpacing: "0.6em" },
              show: {
                opacity: 1,
                letterSpacing: "0.35em",
                transition: { duration: 1, ease: EASE_OUT },
              },
            }}
            className="block font-bold text-base md:text-xl uppercase text-cream/70"
          >
            Bhai
          </motion.span>

          <motion.span
            variants={groupVariants(0.1)}
            className="mt-1 mb-2 sm:mb-0 flex flex-wrap justify-center gap-x-[0.25em] text-[clamp(2rem,10vw,3rem)] leading-[1.1] drop-shadow-[0_4px_30px_rgba(240,138,36,0.35)] sm:mt-3 sm:text-7xl lg:text-8xl"
          >
            {"Gurpreet Singh Ji".split(" ").map((word) => (
              <span
                key={word}
                className="-mx-[0.1em] -my-[0.15em] inline-block overflow-hidden"
              >
                <motion.span variants={wordVariants} className="inline-block">
                  <motion.span
                    animate={
                      animate
                        ? {
                            backgroundPosition: [
                              "0% 50%",
                              "100% 50%",
                              "0% 50%",
                            ],
                          }
                        : undefined
                    }
                    transition={{
                      duration: 6,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    style={{ backgroundSize: "200% auto" }}
                    className="inline-block px-[0.1em] py-[0.15em] font-bold italic tracking-tight text-gold-gradient"
                  >
                    {word}
                  </motion.span>
                </motion.span>
              </span>
            ))}
          </motion.span>

          {/* Outlined brand name: each letter fills with gold on hover / tap */}
          <motion.span
            variants={groupVariants(0.05)}
            aria-label="Shimla Wale"
            className="flex justify-center font-brand text-[2.1rem] font-semibold tracking-[0.12em] [perspective:600px] sm:mt-3 sm:text-6xl lg:text-7xl"
          >
            {"Shimla Wale".split("").map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                aria-hidden="true"
                variants={letterVariants}
                whileHover={{ y: -8, color: "var(--gold-light)" }}
                whileTap={{ y: -8, color: "var(--gold-light)" }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                style={{ WebkitTextStroke: "1px rgba(243, 213, 138, 0.85)" }}
                className="inline-block cursor-default text-transparent"
              >
                {ch === " " ? " " : ch}
              </motion.span>
            ))}
          </motion.span>
        </motion.h1>
      </motion.div>

      {/* CTAs + streaming links */}
      <motion.div
        variants={riseVariants}
        className="relative mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center"
      >
        <div className="flex justify-center items-center gap-4">
          <Magnetic disabled={lite} className="w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="group relative h-12 w-full cursor-pointer overflow-hidden rounded-lg bg-gradient-to-r from-gold via-saffron to-gold bg-[length:200%_auto] px-7 text-sm font-semibold text-navy shadow-lg shadow-saffron/25 transition-all duration-300 hover:shadow-saffron/40 hover:brightness-105 sm:w-auto sm:text-base"
            >
              <Link
                to="/kirtan/book"
                className="relative z-10 flex items-center justify-center gap-2"
              >
                <HandHeart className="size-4 shrink-0 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                <span>Book Kirtan</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </Button>
          </Magnetic>

          <Magnetic disabled={lite} className="w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group h-12 w-full cursor-pointer rounded-lg border border-gold/50 bg-white/5 px-7 text-sm font-medium text-cream transition-all duration-300 hover:border-gold hover:bg-white/10 hover:text-gold-light sm:w-auto sm:text-base"
            >
              <a
                href="#latest"
                className="flex items-center justify-center gap-2"
              >
                <Play className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:fill-gold" />
                <span>Latest Kirtan</span>
              </a>
            </Button>
          </Magnetic>
        </div>

        {listen.length > 0 && (
          <div className="flex items-center gap-2 sm:ml-2 sm:border-l sm:border-white/15 sm:pl-4">
            {listen.map(({ href, label, Icon }) => (
              <motion.a
                key={label}
                href={href ?? "#"}
                target="_blank"
                rel="noreferrer"
                aria-label={`Listen on ${label}`}
                title={`Listen on ${label}`}
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gold-light transition-colors hover:border-gold hover:bg-gold/15"
              >
                <Icon className="size-4.5" />
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Heritage ticker ───────────────────────────────────────── */}
      <div className="marquee marquee-fade relative mt-6 overflow-hidden border-y border-gold/15 bg-[#05070f]/40 py-3 sm:mt-10">
        <div
          className="marquee-track flex w-max items-center"
          style={{ "--marquee-duration": "35s" } as React.CSSProperties}
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center"
            >
              {heritageParts.map((part) => (
                <span
                  key={part}
                  className="flex items-center gap-6 pr-6 font-brand text-xs tracking-[0.25em] text-gold-light/70 uppercase sm:text-sm"
                >
                  {part}
                  <span className="font-gurmukhi text-base text-saffron/70 tracking-normal">
                    ੴ
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Interactive waveform floor ───────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative flex h-14 items-end sm:h-[90px] gap-[3px] px-2 opacity-80 sm:gap-1"
      >
        {Array.from({ length: waveCount }).map((_, i) => (
          <WaveBar
            key={i}
            index={i}
            count={waveCount}
            cursor={waveX}
            animate={animate}
          />
        ))}
      </div>
    </section>
  );
}

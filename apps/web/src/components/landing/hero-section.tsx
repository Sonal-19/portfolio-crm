import { Link } from "@tanstack/react-router";
import { Disc3, HeartHandshake, Mic2, Play, Volume2 } from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import type React from "react";
import { FaApple, FaInstagram, FaSpotify, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/hooks/use-site-settings";

const goldenParticles = [
  { top: "18%", left: "12%", size: 3.5, delay: 0, duration: 7 },
  { top: "28%", right: "15%", size: 4, delay: 1.2, duration: 8 },
  { top: "52%", left: "8%", size: 3, delay: 2.5, duration: 7.5 },
  { top: "70%", right: "10%", size: 4, delay: 0.8, duration: 9 },
  { top: "38%", left: "46%", size: 3, delay: 1.8, duration: 6.8 },
  { top: "85%", left: "25%", size: 3.5, delay: 3, duration: 8.2 },
];

const equalizerBars = [
  { h: ["5px", "16px", "7px", "14px", "5px"], d: 1.3, delay: 0 },
  { h: ["12px", "6px", "18px", "8px", "12px"], d: 1.1, delay: 0.2 },
  { h: ["7px", "17px", "9px", "15px", "7px"], d: 1.4, delay: 0.35 },
  { h: ["14px", "7px", "16px", "6px", "14px"], d: 1.2, delay: 0.15 },
  { h: ["6px", "13px", "5px", "15px", "6px"], d: 1.3, delay: 0.25 },
];

export function HeroSection({ s }: { s?: SiteSettings }) {
  // Smooth mouse-following luxury golden spotlight for desktop
  const mouseX = useMotionValue(55);
  const mouseY = useMotionValue(40);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 25 });
  const mouseGlow = useMotionTemplate`radial-gradient(750px circle at ${springX}% ${springY}%, rgba(240, 138, 36, 0.14), rgba(212, 166, 74, 0.06) 40%, transparent 75%)`;

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
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden bg-[#070b18] pt-28 pb-16 text-cream sm:pt-32 lg:pb-24"
    >
      {/* 1. Cinematic Deep Mesh & Amber Aurora Background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Deep midnight velvet gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090f24] via-[#070b18] to-[#050813]" />

        {/* Golden-amber ethereal warm glow behind portrait side */}
        <div className="absolute -top-16 right-0 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] rounded-full bg-gradient-to-br from-saffron/18 via-gold/12 to-transparent blur-[130px] opacity-90" />

        {/* Deep royal indigo secondary ambient bloom */}
        <div className="absolute -bottom-20 left-0 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full bg-gradient-to-tr from-navy-2/50 via-navy/30 to-transparent blur-[120px] opacity-80" />

        {/* Center warm ambient light bloom */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.45, 0.7, 0.45],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[450px] sm:size-[600px] rounded-full bg-gradient-to-b from-gold/10 via-saffron/6 to-transparent blur-[100px]"
        />

        {/* Desktop Interactive Smooth Spotlight */}
        <motion.div
          style={{ background: mouseGlow }}
          className="absolute inset-0 hidden lg:block"
        />

        {/* Floating Delicate Golden Bokeh Particles */}
        {goldenParticles.map((p, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-10, 10, -10],
              x: [-4, 4, -4],
              opacity: [0.2, 0.75, 0.2],
              scale: [0.9, 1.25, 0.9],
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
            className="absolute rounded-full bg-gold-light/70 shadow-[0_0_8px_rgba(243,213,138,0.8)]"
          />
        ))}
      </div>

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
            className="inline-flex cursor-default items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 backdrop-blur-md shadow-sm transition-colors hover:bg-gold/15"
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
            {s?.tagline ?? "Gurbani Kirtan · Raagi · Seva through Sangeet"}
          </p>

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
                  to="/studio/book"
                  className="flex items-center justify-center gap-2 relative z-10"
                >
                  <Mic2 className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                  <span>Book a Free Studio Session</span>
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
                className="group h-12 sm:h-13 w-full sm:w-auto rounded-full border border-gold/50 bg-white/5 backdrop-blur-md px-7 text-sm sm:text-base font-medium text-cream shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-gold hover:text-gold-light active:scale-[0.98] cursor-pointer"
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
                  className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs sm:text-sm font-medium text-cream/90 shadow-sm transition-all duration-200 hover:border-gold hover:bg-gold/15 hover:text-gold-light"
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
          className="order-1 relative mx-auto flex flex-col items-center w-full max-w-[320px] sm:max-w-[400px] lg:order-2 lg:max-w-[480px] xl:max-w-[520px] mb-6 sm:mb-8 lg:mb-0"
        >
          {/* Luminous Warm Golden Halo Aura directly behind Bhai Sahib */}
          <div className="pointer-events-none absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 size-[260px] sm:size-[340px] lg:size-[400px] rounded-full bg-gradient-to-b from-gold/35 via-saffron/20 to-transparent blur-3xl opacity-80" />

          {/* Delicate Sacred Celestial Halo Rings */}
          <div className="pointer-events-none absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 size-[240px] sm:size-[310px] lg:size-[360px] rounded-full border border-gold/25 opacity-60" />
          <div className="pointer-events-none absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 size-[210px] sm:size-[270px] lg:size-[310px] rounded-full border border-gold-light/15 border-dashed opacity-45" />

          {/* Transparent Cutout Image of Bhai Sahib */}
          <div className="relative w-full flex justify-center select-none">
            <motion.img
              src={s?.heroImagePath ?? "/uploads/brand/profile-transparent.webp"}
              alt={s?.artistName ?? "Bhai Gurpreet Singh Ji Shimla Wale"}
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative z-10 w-full max-h-[440px] sm:max-h-[500px] lg:max-h-[560px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] drop-shadow-[0_0_35px_rgba(212,166,74,0.2)] border-2 border-gold/15 rounded-3xl cursor-pointer"
            />

            {/* Seamless Soft Fade at the Bottom of the Silhouette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-[#070b18] via-[#070b18]/70 to-transparent z-20" />
          </div>

          {/* Floating Glass Music Track Card */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative z-30 -mt-8 sm:-mt-10 flex w-full max-w-[320px] sm:max-w-[380px] items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-[#070b18]/90 p-3 sm:p-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-300 hover:border-gold/60 hover:shadow-gold/15"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 12,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/25 to-saffron/20 border border-gold/40 text-gold-light shadow-md"
              >
                <Disc3 className="size-5" />
              </motion.div>

              <div className="min-w-0 text-left">
                <p className="truncate text-xs sm:text-sm font-semibold text-cream font-display">
                  Satgur Tumre Kaaj Saware
                </p>
                <p className="truncate text-[10px] sm:text-xs text-gold-light/80 flex items-center gap-1.5">
                  <Volume2 className="size-3 shrink-0" />
                  <span>66 Lakh+ Views · Gurbani Kirtan</span>
                </p>
              </div>
            </div>

            {/* Live Soundwave Frequency Equalizer */}
            <div
              className="flex items-center gap-0.5 shrink-0 pr-1"
              aria-hidden="true"
            >
              {equalizerBars.map((b, idx) => (
                <motion.span
                  key={idx}
                  animate={{ height: b.h }}
                  transition={{
                    duration: b.d,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: b.delay,
                  }}
                  className={`w-[2px] sm:w-[2.5px] rounded-full inline-block ${
                    idx % 2 === 0 ? "bg-gold" : "bg-saffron"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Interactive Glassmorphism Stats Cards */}
      <motion.div
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
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 text-center backdrop-blur-md shadow-xl transition-all duration-300 hover:border-gold/45 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-gold/10 cursor-pointer"
            >
              {/* Golden Gradient Shimmer Line on Hover */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold/0 to-transparent transition-all duration-500 group-hover:via-gold/90" />

              {/* Icon Orb */}
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
      </motion.div>
    </section>
  );
}

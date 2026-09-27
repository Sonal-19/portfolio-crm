import { Link } from "@tanstack/react-router";
import { Mic2, Play } from "lucide-react";
import { motion } from "motion/react";
import { FaApple, FaSpotify, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/hooks/use-site-settings";

export function HeroSection({ s }: { s?: SiteSettings }) {
  const listen = [
    { href: s?.youtubeUrl, label: "YouTube", Icon: FaYoutube },
    { href: s?.spotifyUrl, label: "Spotify", Icon: FaSpotify },
    { href: s?.appleMusicUrl, label: "Apple Music", Icon: FaApple },
  ].filter((l) => l.href);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-navy bg-mandala pt-28 pb-16 text-cream sm:pt-32 lg:pb-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center lg:text-left"
        >
          <p className="font-gurmukhi text-sm text-gold-light/90 sm:text-base">
            ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
            <span className="block text-cream/90 text-2xl sm:text-3xl lg:text-4xl">
              Bhai
            </span>
            <span className="text-gold-gradient">Gurpreet Singh Ji</span>
            <span className="mt-1 block font-brand text-3xl tracking-[0.12em] text-cream sm:text-4xl lg:text-5xl">
              Shimla Wale
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/75 lg:mx-0">
            {s?.tagline ?? "Gurbani Kirtan · Raagi · Seva through Sangeet"}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-gradient-to-r from-gold to-saffron px-7 text-base text-navy shadow-lg shadow-saffron/20 hover:opacity-90 sm:w-auto"
            >
              <Link to="/studio/book">
                <Mic2 /> Book a Free Studio Session
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-gold/50 bg-transparent px-7 text-base text-cream hover:bg-white/5 hover:text-gold-light sm:w-auto"
            >
              <a href="#latest">
                <Play /> Latest Kirtan
              </a>
            </Button>
          </div>

          {listen.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-cream/60 lg:justify-start">
              <span>Listen on</span>
              {listen.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-cream/85 transition hover:border-gold hover:text-gold-light"
                >
                  <Icon className="size-4" /> {label}
                </a>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm lg:max-w-md"
        >
          <div className="absolute -inset-4 rounded-t-full bg-gradient-to-b from-gold/40 via-saffron/20 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-t-full border-2 border-gold/60 bg-navy-2 p-2 shadow-2xl">
            <img
              src={
                s?.heroImagePath ?? "/uploads/brand/portrait-placeholder.svg"
              }
              alt="Bhai Gurpreet Singh Ji Shimla Wale"
              className="aspect-[4/5] w-full rounded-t-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-1/2 w-max -translate-x-1/2 rounded-full border border-gold/40 bg-navy px-5 py-2 text-xs tracking-widest text-gold-light shadow-lg">
            GURBANI KIRTAN · LUDHIANA
          </div>
        </motion.div>
      </div>

      {s?.stats && (
        <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {[
              [s.stats.views, "YouTube views"],
              [s.stats.followers, "Instagram family"],
              [s.stats.years, "Years of seva"],
              [s.stats.albums, "Albums & releases"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="flex flex-col bg-navy/80 px-4 py-5 text-center backdrop-blur"
              >
                <dt className="order-2 text-xs uppercase tracking-widest text-cream/55">
                  {label}
                </dt>
                <dd className="order-1 font-display text-2xl text-gold-light sm:text-3xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

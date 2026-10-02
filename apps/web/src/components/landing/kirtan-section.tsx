import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CalendarCheck,
  Drum,
  Footprints,
  HandHeart,
  Headphones,
  Heart,
  Home,
  Landmark,
  Music2,
  Phone,
  Piano,
  ScrollText,
  Sparkles,
  Sunrise,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { FaWhatsapp } from "react-icons/fa6";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { cn, waLink } from "@/lib/utils";

/** Icons the admin can pick for each gallery photo (Settings → Kirtan moments). */
export const GALLERY_ICONS = {
  khanda: Sparkles,
  harmonium: Piano,
  tabla: Drum,
  sangat: Users,
  pheri: Footprints,
  headphones: Headphones,
} as const;

const PROGRAMS = [
  {
    icon: BookOpen,
    title: "Sukhmani Sahib",
    text: "Path and kirtan at home or gurdwara for peace and blessings.",
  },
  {
    icon: ScrollText,
    title: "Akhand / Sehaj Path Bhog",
    text: "Bhog kirtan, Anand Sahib and Ardas with the full jatha.",
  },
  {
    icon: Heart,
    title: "Anand Karaj",
    text: "Laavan kirtan and shabads for the wedding ceremony.",
  },
  {
    icon: Landmark,
    title: "Gurpurab Samagam",
    text: "Evening kirtan darbars for gurdwara committees and sangat.",
  },
  {
    icon: Sunrise,
    title: "Amritvela Simran",
    text: "Early-morning Naam Simran programs, 3:00 to 5:00 AM.",
  },
  {
    icon: Headphones,
    title: "Silent Kirtan & Prabhat Pheri",
    text: "Headphone kirtan through the streets without disturbing anyone.",
  },
  {
    icon: Home,
    title: "Family Functions",
    text: "Griha pravesh, birthdays, anniversaries and business openings.",
  },
  {
    icon: HandHeart,
    title: "Antim Ardas",
    text: "Vairag kirtan and Ardas to bring comfort to the family.",
  },
];

// Dummy line-up until real names and photos are added.
const JATHA = [
  { name: "Bhai Gurpreet Singh Ji", role: "Lead raagi · Harmonium" },
  { name: "Bhai Harjit Singh", role: "Second raagi · Harmonium" },
  { name: "Bhai Manjit Singh", role: "Tabla" },
  { name: "Bhai Ravinder Singh", role: "Sound & live stream" },
];

const STEPS = [
  {
    icon: ScrollText,
    title: "Send a request",
    text: "Tell us the program, date, time and venue.",
  },
  {
    icon: Phone,
    title: "We call you",
    text: "Our team calls or WhatsApps you within 24 hours.",
  },
  {
    icon: CalendarCheck,
    title: "Confirmed",
    text: "Date, timing and arrangements are fixed together.",
  },
  {
    icon: Music2,
    title: "Kirtan darbar",
    text: "The jatha arrives early, sets up and does kirtan.",
  },
];

const initials = (name: string) =>
  name
    .replace(/^Bhai\s+/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

export function KirtanSection({ s }: { s?: SiteSettings }) {
  const gallery = s?.gallery ?? [];
  const years = s?.stats?.years ?? "30+";

  return (
    <section
      id="kirtan"
      className="relative overflow-hidden bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          kicker="Kirtan Seva"
          title="Invite the jatha to your sangat"
          subtitle={s?.kirtanIntro}
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          {[
            { icon: Music2, text: `${years} Years of Kirtan Seva` },
            { icon: Landmark, text: "Chairman, Amritvela Trust" },
            { icon: Award, text: "World Book of Records, London" },
          ].map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-accent/50 px-3.5 py-1.5 text-xs font-semibold text-navy sm:text-sm"
            >
              <b.icon className="size-4 text-primary" /> {b.text}
            </span>
          ))}
        </div>

        {/* World record highlight */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative mt-12 overflow-hidden rounded-3xl bg-navy text-cream shadow-xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-mandala opacity-25" />
          <div className="relative grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-3 py-1 text-xs font-bold text-navy">
                <Award className="size-3.5" /> WORLD RECORD
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight sm:text-3xl lg:text-4xl">
                43-day Prabhat Pheri &{" "}
                <span className="text-gold-gradient">Silent Kirtan</span>
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
                Organised by the Amritvela Trust in Ulhasnagar during the Guru
                Nanak Jayanti celebrations. Every morning from 3:00 to 5:00 AM
                the sangat walked with wireless headphones, so the kirtan filled
                every heart while the streets stayed quiet. Recognised by the
                World Book of Records, London.
              </p>
              <dl className="mt-6 grid max-w-md grid-cols-3 gap-3">
                {[
                  ["43", "Days"],
                  ["3–5 AM", "Amritvela"],
                  ["🎧", "Headphone kirtan"],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="rounded-2xl border border-gold/25 bg-white/5 p-3 text-center"
                  >
                    <dt className="font-display text-xl text-gold-light sm:text-2xl">
                      {v}
                    </dt>
                    <dd className="mt-0.5 text-[11px] text-cream/65 sm:text-xs">
                      {l}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative mx-auto grid size-44 place-items-center sm:size-56">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border border-gold/40"
                  animate={{ scale: [0.6, 1.15], opacity: [0.7, 0] }}
                  transition={{
                    duration: 3,
                    delay: i,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                />
              ))}
              <div className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-gold-light via-gold to-saffron text-navy shadow-[0_0_60px_rgba(240,138,36,0.45)] sm:size-36">
                <Headphones className="size-14 sm:size-16" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Programs */}
        <div className="mt-16">
          <h3 className="text-center font-display text-2xl text-navy sm:text-3xl">
            Programs we perform
          </h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.06 }}
                className="group rounded-2xl border bg-cream/50 p-5 transition hover:-translate-y-1 hover:border-gold/60 hover:bg-white hover:shadow-lg"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-accent text-primary transition group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-saffron group-hover:text-navy">
                  <p.icon className="size-5" />
                </div>
                <p className="mt-3 font-semibold text-navy">{p.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Jatha + How it works */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              The jatha
            </p>
            <h3 className="mt-1 font-display text-2xl text-navy">
              A professional kirtani team
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Led by Bhai Gurpreet Singh Ji, with {years} years of kirtan across
              India and abroad.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {JATHA.map((m, i) => (
                <li
                  key={m.name}
                  className="flex items-center gap-3 rounded-2xl bg-cream/70 p-3"
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
                      i === 0
                        ? "bg-gradient-to-br from-gold to-saffron text-navy"
                        : "bg-navy text-gold-light",
                    )}
                  >
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.role}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border bg-cream/40 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              How it works
            </p>
            <h3 className="mt-1 font-display text-2xl text-navy">
              From request to kirtan darbar
            </h3>
            <ol className="mt-6 space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-gold/60 bg-white text-primary">
                    <step.icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-navy">
                      <span className="mr-1.5 text-gold">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Gallery (photos managed in Admin → Settings) */}
        {gallery.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <div className="mb-8 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Kirtan moments
              </span>
              <h3 className="mt-1.5 font-display text-2xl font-bold text-navy sm:text-3xl">
                With the sangat across India
              </h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((f, i) => {
                const Icon = GALLERY_ICONS[f.icon] ?? Sparkles;
                return (
                  <motion.figure
                    key={`${f.imagePath}-${i}`}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-navy/10 bg-navy shadow-md transition-all duration-300 hover:border-gold/50 hover:shadow-xl",
                      gallery.length % 2 === 1 &&
                        i === gallery.length - 1 &&
                        "sm:col-span-2 lg:col-span-1",
                    )}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy-2">
                      <img
                        src={f.imagePath}
                        alt={f.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent opacity-80" />
                      <div className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border border-gold/30 bg-navy/80 text-gold-light shadow-md backdrop-blur-md">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <figcaption className="p-4 sm:p-5">
                      <h4 className="font-display text-lg font-bold text-cream">
                        {f.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-cream/70 sm:text-sm">
                        {f.description}
                      </p>
                    </figcaption>
                  </motion.figure>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-navy to-navy-2 p-6 text-center text-cream sm:p-10 md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-display text-2xl sm:text-3xl">
              Planning a path, wedding or samagam?
            </p>
            <p className="mt-2 text-sm text-cream/70 sm:text-base">
              Share your program details and our team will get in touch to plan
              it with you.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-gold to-saffron font-semibold text-navy hover:opacity-90"
            >
              <Link to="/kirtan/book">
                <HandHeart /> Book Kirtan
              </Link>
            </Button>
            {s?.whatsappNumber && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 text-cream hover:bg-white/10 hover:text-cream"
              >
                <a
                  href={waLink(
                    s.whatsappNumber,
                    "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏 I'd like to book kirtan.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaWhatsapp /> WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

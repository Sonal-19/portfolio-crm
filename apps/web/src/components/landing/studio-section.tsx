import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  Disc3,
  HandHeart,
  Headphones,
  Mic2,
  ScrollText,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { api, call } from "@/lib/api";
import { cn } from "@/lib/utils";

export const studioCatalogQuery = {
  queryKey: ["public", "studio-catalog"] as const,
  queryFn: () => call(api.public.studio.catalog.get()),
  staleTime: 5 * 60 * 1000,
};

const ICONS: Record<string, typeof Mic2> = {
  mic: Mic2,
  disc: Disc3,
  sliders: SlidersHorizontal,
  video: Video,
};

const STEPS = [
  {
    icon: ScrollText,
    title: "Apply",
    text: "Tell us about yourself and share a sample of your work.",
  },
  {
    icon: CheckCircle2,
    title: "Review",
    text: "Our team listens and calls you on WhatsApp.",
  },
  {
    icon: CalendarCheck,
    title: "Scheduled",
    text: "We fix a date and time that suits you.",
  },
  {
    icon: Mic2,
    title: "Record",
    text: "Record, mix, master or shoot your video: all free.",
  },
];

/** Icons the admin can pick for each studio photo (Settings → Studio photos). */
export const GALLERY_ICONS = {
  sliders: SlidersHorizontal,
  mic: Mic2,
  video: Video,
  disc: Disc3,
  headphones: Headphones,
  camera: Camera,
} as const;

export function StudioSection({ s }: { s?: SiteSettings }) {
  const { data } = useQuery(studioCatalogQuery);
  const gallery = s?.studioGallery ?? [];

  return (
    <section
      id="studio"
      className="relative overflow-hidden bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex justify-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            <HandHeart className="size-4" /> 100% Free: seva for talented
            artists
          </span>
        </div>
        <SectionHeading
          kicker="Professional Studio Recording"
          title="Record with us at Ghanta Ghar, Ludhiana"
          subtitle={s?.studioIntro}
        />

        {/* How it works */}
        <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border bg-cream/60 p-5"
            >
              <span className="absolute top-4 right-4 font-display text-3xl text-gold/40">
                {i + 1}
              </span>
              <step.icon className="size-7 text-primary" />
              <p className="mt-3 font-semibold text-navy">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>

        {/* Packages */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data?.packages.map((p, i) => {
            const Icon = ICONS[p.icon] ?? Mic2;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
                  p.isFeatured ? "border-gold bg-navy text-cream" : "bg-white",
                )}
              >
                {p.isFeatured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-gold to-saffron px-3 py-0.5 text-xs font-bold text-navy">
                    Most requested
                  </span>
                )}
                <div
                  className={cn(
                    "grid size-12 place-items-center rounded-xl",
                    p.isFeatured
                      ? "bg-gold/15 text-gold-light"
                      : "bg-accent text-primary",
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <h3
                  className={cn(
                    "mt-4 font-display text-xl",
                    p.isFeatured ? "text-cream" : "text-navy",
                  )}
                >
                  {p.name}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    p.isFeatured ? "text-cream/70" : "text-muted-foreground",
                  )}
                >
                  {p.description}
                </p>
                <p
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 text-sm font-medium",
                    p.isFeatured ? "text-gold-light" : "text-primary",
                  )}
                >
                  <Clock className="size-4" /> {p.durationHours} hours · Free
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.includes.map((inc) => (
                    <li key={inc} className="flex gap-2">
                      <CheckCircle2
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          p.isFeatured ? "text-gold" : "text-emerald-600",
                        )}
                      />
                      {inc}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn(
                    "mt-6 rounded-full",
                    p.isFeatured
                      ? "bg-gradient-to-r from-gold to-saffron text-navy hover:opacity-90"
                      : "bg-navy text-cream hover:bg-navy-2",
                  )}
                >
                  <Link to="/studio/book" search={{ package: p.slug }}>
                    Apply for this session
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gold/60 bg-accent/40 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-xl text-navy">
              Build your own session
            </p>
            <p className="text-sm text-muted-foreground">
              Pick instruments, duration, sound engineer, mixing, mastering and
              video shoot. Still free.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/studio/book" search={{ package: "custom" }}>
              <SlidersHorizontal /> Customise my session
            </Link>
          </Button>
        </div>

        {/* Facilities Showcase (photos managed in Admin → Settings) */}
        {gallery.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <div className="mb-8 flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Inside Our Studio · Ghanta Ghar, Ludhiana
              </span>
              <h3 className="mt-1.5 font-display text-2xl font-bold text-navy sm:text-3xl">
                World-Class Studio Facilities
              </h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Equipped with broadcast-grade acoustics, industry-standard
                analog & digital gear, and high-definition video production.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((f, i) => {
                const Icon = GALLERY_ICONS[f.icon] ?? Mic2;
                return (
                  <motion.figure
                    key={`${f.imagePath}-${i}`}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-navy/10 bg-navy shadow-md transition-all duration-300 hover:border-gold/50 hover:shadow-xl",
                      // Odd last card spans the full row on 2-column tablets
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
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60" />

                      {/* Floating Icon Badge */}
                      <div className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border border-gold/30 bg-navy/80 text-gold-light shadow-md backdrop-blur-md">
                        <Icon className="size-4" />
                      </div>
                    </div>

                    <figcaption className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-light">
                        <span>Facility {String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <h4 className="mt-1 font-display text-lg font-bold text-cream">
                        {f.title}
                      </h4>
                      <p className="mt-1 text-xs text-cream/70 sm:text-sm leading-relaxed">
                        {f.description}
                      </p>
                    </figcaption>
                  </motion.figure>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

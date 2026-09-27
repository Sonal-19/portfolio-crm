import { motion } from "motion/react";
import { Markdown } from "@/components/common/markdown";
import { SectionHeading } from "@/components/common/section-heading";
import type { SiteSettings } from "@/hooks/use-site-settings";

export function AboutSection({ s }: { s?: SiteSettings }) {
  return (
    <section id="about" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -top-4 -left-4 size-full rounded-3xl border-2 border-gold/50" />
          <img
            src={s?.aboutImagePath ?? "/uploads/brand/about-placeholder.svg"}
            alt="Bhai Gurpreet Singh Ji performing kirtan"
            className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-xl"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            align="left"
            kicker="Introduction"
            title="A voice devoted to Gurbani"
          />
          <Markdown className="mt-6 text-[17px] text-foreground/85">
            {s?.bio ?? ""}
          </Markdown>
        </motion.div>
      </div>
    </section>
  );
}

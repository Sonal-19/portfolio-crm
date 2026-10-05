import { createFileRoute } from "@tanstack/react-router";
import { Award, Landmark, Music2 } from "lucide-react";
import { KirtanBookingForm } from "@/components/kirtan/kirtan-booking-form";
import { PublicLayout } from "@/components/layout/public-layout";
import { siteSettingsQuery, useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/kirtan/book")({
  loader: ({ context }) => context.queryClient.prefetchQuery(siteSettingsQuery),
  component: BookKirtanPage,
});

function BookKirtanPage() {
  const { data: s } = useSiteSettings();
  return (
    <PublicLayout>
      <section className="bg-navy bg-mandala px-4 pt-28 pb-14 text-center text-cream">
        <p className="font-gurmukhi text-sm text-gold-light">
          ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Book Kirtan</h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/75">
          Invite Bhai Gurpreet Singh Ji Shimla Wale and his jatha for your path,
          wedding, gurpurab or family program, anywhere in India.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            {
              icon: Music2,
              text: `${s?.stats?.years ?? "30+"} years of kirtan`,
            },
            { icon: Landmark, text: "Amritvela Trust" },
            { icon: Award, text: "World Book of Records" },
          ].map((b) => (
            <span
              key={b.text}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-light"
            >
              <b.icon className="size-3.5" /> {b.text}
            </span>
          ))}
        </div>
      </section>
      <section className="bg-cream py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <KirtanBookingForm />
        </div>
      </section>
    </PublicLayout>
  );
}

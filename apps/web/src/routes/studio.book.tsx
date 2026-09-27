import { createFileRoute } from "@tanstack/react-router";
import { HandHeart } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { BookingWizard } from "@/components/studio/booking-wizard";

export const Route = createFileRoute("/studio/book")({
  validateSearch: (search: Record<string, unknown>): { package?: string } => ({
    package: typeof search.package === "string" ? search.package : undefined,
  }),
  component: BookPage,
});

function BookPage() {
  const { package: pkg } = Route.useSearch();
  return (
    <PublicLayout>
      <section className="bg-navy bg-mandala pt-28 pb-14 text-center text-cream">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
          <HandHeart className="size-4" /> 100% Free: seva for talented artists
        </span>
        <h1 className="mt-5 px-4 font-display text-4xl sm:text-5xl">
          Record with Us
        </h1>
        <p className="mx-auto mt-3 max-w-xl px-4 text-cream/70">
          Book time at our professional recording studio at Ghanta Ghar,
          Ludhiana. Choose a preset session or build your own.
        </p>
      </section>
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BookingWizard key={pkg ?? "none"} initialPackage={pkg} />
        </div>
      </section>
    </PublicLayout>
  );
}

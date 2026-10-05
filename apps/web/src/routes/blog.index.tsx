import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoader } from "@/components/common/states";
import {
  BlogCard,
  blogListQuery,
} from "@/components/landing/blog-preview-section";
import { PublicLayout } from "@/components/layout/public-layout";
import { siteSettingsQuery } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.prefetchQuery(siteSettingsQuery),
  component: BlogIndex,
});

function BlogIndex() {
  const { data, isLoading } = useQuery(blogListQuery(50));
  return (
    <PublicLayout>
      <section className="bg-navy bg-mandala pt-28 pb-14 text-center text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          Reflections & Kirtan Diaries
        </h1>
      </section>
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {isLoading ? (
            <PageLoader />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

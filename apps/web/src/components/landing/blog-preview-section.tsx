import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { api, call } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const blogListQuery = (limit: number) => ({
  queryKey: ["public", "blog", limit] as const,
  queryFn: () => call(api.public.blog.get({ query: { limit: String(limit) } })),
});

type Post = NonNullable<
  Awaited<ReturnType<ReturnType<typeof blogListQuery>["queryFn"]>>
>[number];

export function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[16/9] overflow-hidden bg-navy">
        <img
          src={post.coverImagePath ?? "/og-image.svg"}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          {post.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground"
            >
              {t}
            </span>
          ))}
          <span className="text-muted-foreground">
            {formatDate(post.publishedAt)}
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl leading-snug text-navy group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Read more{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function BlogPreviewSection() {
  const { data } = useQuery(blogListQuery(3));
  if (!data?.length) return null;
  return (
    <section id="blog" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          kicker="From the blog"
          title="Reflections, releases & kirtan diaries"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {data.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/blog">
              View all posts <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

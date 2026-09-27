import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { Markdown } from "@/components/common/markdown";
import { ErrorState, PageLoader } from "@/components/common/states";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { api, call } from "@/lib/api";
import { copyToClipboard, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public", "blog-post", slug],
    queryFn: () => call(api.public.blog({ slug }).get()),
  });

  useEffect(() => {
    if (post) document.title = `${post.seoTitle || post.title} · Shimla Wale`;
  }, [post]);

  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <PublicLayout>
      <div className="bg-navy pt-24" />
      <article className="bg-cream pb-20">
        {isLoading ? (
          <PageLoader />
        ) : error || !post ? (
          <div className="mx-auto max-w-3xl px-4 py-16">
            <ErrorState error={error ?? new Error("Post not found")} />
          </div>
        ) : (
          <>
            {post.coverImagePath && (
              <div className="bg-navy">
                <img
                  src={post.coverImagePath}
                  alt=""
                  className="mx-auto aspect-[16/7] w-full max-w-6xl object-cover"
                />
              </div>
            )}
            <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="size-4" /> All posts
              </Link>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                {post.tags.map((t) => (
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
              <h1 className="mt-3 font-display text-4xl leading-tight text-navy sm:text-5xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
              <Markdown className="mt-8 text-[17px] text-foreground/90">
                {post.body}
              </Markdown>
              <div className="mt-12 flex flex-wrap gap-3 border-t pt-6">
                <Button
                  asChild
                  className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${post.title}\n${url}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaWhatsapp /> Share on WhatsApp
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={async () => {
                    if (await copyToClipboard(url))
                      toast.success("Link copied");
                  }}
                >
                  <Share2 /> Copy link
                </Button>
              </div>
            </div>
          </>
        )}
      </article>
    </PublicLayout>
  );
}

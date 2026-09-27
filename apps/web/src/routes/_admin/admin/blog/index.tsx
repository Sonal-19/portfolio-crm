import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api, call } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/blog/")({
  component: BlogAdmin,
});

function BlogAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: () => call(api.admin.blog.get()),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "blog"] });
    qc.invalidateQueries({ queryKey: ["public", "blog"] });
  };
  const toggle = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      call(
        api.admin
          .blog({ id })
          .patch({ status: published ? "published" : "draft" }),
      ),
    onSuccess: (_, v) => {
      toast.success(v.published ? "Published on website" : "Moved to drafts");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.blog({ id }).delete()),
    onSuccess: () => {
      toast.success("Post deleted");
      refresh();
    },
  });

  return (
    <>
      <PageHeader
        title="Blog"
        description="Posts appear on shimlawale.com as soon as they're published."
        actions={
          <Button asChild>
            <Link to="/admin/blog/$id" params={{ id: "new" }}>
              <Plus /> New post
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <PageLoader />
      ) : error || !data ? (
        <ErrorState error={error} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="size-8" />}
          title="No posts yet"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="gap-0 overflow-hidden p-0">
              <div className="aspect-video bg-navy">
                {p.coverImagePath && (
                  <img
                    src={p.coverImagePath}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2 text-xs">
                  <Pill tone={p.status === "published" ? "green" : "gray"}>
                    {p.status === "published" ? "Published" : "Draft"}
                  </Pill>
                  <span className="text-muted-foreground">
                    {p.publishedAt
                      ? formatDate(p.publishedAt)
                      : `Edited ${formatDate(p.updatedAt)}`}
                  </span>
                </div>
                <p className="font-display text-lg leading-snug text-navy">
                  {p.title}
                </p>
                <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {p.excerpt}
                </p>
                <div className="flex items-center justify-between border-t pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={p.status === "published"}
                      onCheckedChange={(v) =>
                        toggle.mutate({ id: p.id, published: v })
                      }
                    />{" "}
                    Live
                  </label>
                  <div className="flex gap-1">
                    {p.status === "published" && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        asChild
                        title="View on site"
                      >
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink />
                        </a>
                      </Button>
                    )}
                    <Button size="icon-sm" variant="ghost" asChild title="Edit">
                      <Link to="/admin/blog/$id" params={{ id: String(p.id) }}>
                        <Pencil />
                      </Link>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      title="Delete"
                      onClick={() =>
                        confirm(`Delete "${p.title}"?`) && del.mutate(p.id)
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

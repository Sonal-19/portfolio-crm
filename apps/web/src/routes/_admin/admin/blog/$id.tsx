import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field } from "@/components/common/field";
import { Markdown } from "@/components/common/markdown";
import { PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/blog/$id")({
  component: BlogEditor,
});

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImagePath: null as string | null,
  tags: "",
  seoTitle: "",
  seoDescription: "",
};

function BlogEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blog", id],
    queryFn: () => call(api.admin.blog({ id: Number(id) }).get()),
    enabled: !isNew,
  });
  useEffect(() => {
    if (data)
      setF({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        body: data.body,
        coverImagePath: data.coverImagePath,
        tags: data.tags.join(", "),
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
      });
  }, [data]);

  const save = useMutation({
    mutationFn: async (status?: "draft" | "published") => {
      const body = {
        title: f.title,
        slug: f.slug || undefined,
        excerpt: f.excerpt,
        body: f.body,
        coverImagePath: f.coverImagePath,
        tags: f.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        seoTitle: f.seoTitle || null,
        seoDescription: f.seoDescription || null,
        ...(status ? { status } : {}),
      };
      return isNew
        ? call(api.admin.blog.post({ ...body, status: status ?? "draft" }))
        : call(api.admin.blog({ id: Number(id) }).patch(body));
    },
    onSuccess: (post, status) => {
      toast.success(status === "published" ? "Published 🎉" : "Saved");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      qc.invalidateQueries({ queryKey: ["public", "blog"] });
      if (isNew && post)
        navigate({
          to: "/admin/blog/$id",
          params: { id: String(post.id) },
          replace: true,
        });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isNew && isLoading) return <PageLoader />;
  const published = data?.status === "published";

  return (
    <>
      <Link
        to="/admin/blog"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> All posts
      </Link>
      <PageHeader
        title={isNew ? "New post" : "Edit post"}
        actions={
          <>
            <Button
              variant="outline"
              disabled={!f.title || !f.body || save.isPending}
              onClick={() => save.mutate(isNew ? "draft" : undefined)}
            >
              <Save /> {isNew ? "Save draft" : "Save"}
            </Button>
            {!published && (
              <Button
                disabled={!f.title || !f.body || save.isPending}
                onClick={() => save.mutate("published")}
              >
                <Send /> Publish
              </Button>
            )}
            {published && data && (
              <Button variant="ghost" asChild>
                <a href={`/blog/${data.slug}`} target="_blank" rel="noreferrer">
                  <Eye /> View
                </a>
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-4 p-5">
          <Field label="Title" required>
            <Input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              className="text-lg"
            />
          </Field>
          <Field label="Excerpt" hint="Shown on cards and in link previews.">
            <Textarea
              rows={2}
              value={f.excerpt}
              onChange={(e) => setF({ ...f, excerpt: e.target.value })}
            />
          </Field>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                Body{" "}
                <span className="font-normal text-muted-foreground">
                  (Markdown: ## heading, **bold**, - list, [link](url))
                </span>
              </span>
              <div className="flex rounded-md border p-0.5">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded px-3 py-1 text-xs capitalize",
                      tab === t && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {tab === "write" ? (
              <Textarea
                rows={22}
                className="font-mono text-sm"
                value={f.body}
                onChange={(e) => setF({ ...f, body: e.target.value })}
              />
            ) : (
              <div className="min-h-96 rounded-md border bg-cream/40 p-5">
                <Markdown>{f.body || "_Nothing to preview_"}</Markdown>
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="gap-3 p-5">
            <p className="text-sm font-medium">Cover image</p>
            <ImageUpload
              folder="blog"
              value={f.coverImagePath}
              onChange={(p) => setF({ ...f, coverImagePath: p })}
            />
          </Card>
          <Card className="gap-4 p-5">
            <Field label="Tags" hint="Comma separated">
              <Input
                value={f.tags}
                onChange={(e) => setF({ ...f, tags: e.target.value })}
              />
            </Field>
            <Field label="URL slug" hint="Leave empty to generate from title">
              <Input
                value={f.slug}
                onChange={(e) => setF({ ...f, slug: e.target.value })}
              />
            </Field>
            <Field label="SEO title">
              <Input
                value={f.seoTitle}
                onChange={(e) => setF({ ...f, seoTitle: e.target.value })}
              />
            </Field>
            <Field label="SEO description">
              <Textarea
                rows={3}
                value={f.seoDescription}
                onChange={(e) => setF({ ...f, seoDescription: e.target.value })}
              />
            </Field>
          </Card>
        </div>
      </div>
    </>
  );
}

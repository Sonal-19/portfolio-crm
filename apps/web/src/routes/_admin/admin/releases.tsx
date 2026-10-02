import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Disc3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import {
  PlatformButton,
  ReleaseCard,
} from "@/components/landing/release-carousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import {
  PLATFORM_META,
  RELEASE_PLATFORMS,
  type ReleasePlatform,
} from "@/lib/releases";
import { cn, formatDate, ymd } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/releases")({
  component: ReleasesAdmin,
});

const releasesQuery = {
  queryKey: ["admin", "releases"],
  queryFn: () => call(api.admin.releases.get()),
};
type Release = NonNullable<
  Awaited<ReturnType<typeof releasesQuery.queryFn>>
>[number];

type Draft = {
  id?: number;
  title: string;
  subtitle: string;
  caption: string;
  posterPath: string | null;
  aspect: "square" | "wide";
  links: { platform: ReleasePlatform; url: string }[];
  releaseDate: string;
  isActive: boolean;
  sortOrder: number;
};

const toDraft = (r?: Release, sortOrder = 0): Draft =>
  r
    ? {
        id: r.id,
        title: r.title,
        subtitle: r.subtitle ?? "",
        caption: r.caption,
        posterPath: r.posterPath,
        aspect: r.aspect,
        links: r.links.map((l) => ({ ...l })),
        releaseDate: r.releaseDate ? ymd(r.releaseDate) : "",
        isActive: r.isActive,
        sortOrder: r.sortOrder,
      }
    : {
        title: "",
        subtitle: "",
        caption: "",
        posterPath: null,
        aspect: "square",
        links: [{ platform: "youtube", url: "" }],
        releaseDate: "",
        isActive: true,
        sortOrder,
      };

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "releases"] });
    qc.invalidateQueries({ queryKey: ["public", "releases"] });
  };
}
const onError = (e: Error) => toast.error(e.message);

function ReleasesAdmin() {
  const { data, isLoading, error } = useQuery(releasesQuery);
  const [edit, setEdit] = useState<Draft | null>(null);
  const refresh = useRefresh();

  const toggle = useMutation({
    mutationFn: (r: Release) =>
      call(api.admin.releases({ id: r.id }).patch({ isActive: !r.isActive })),
    onSuccess: refresh,
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.releases({ id }).delete()),
    onSuccess: () => {
      toast.success("Release deleted");
      refresh();
    },
    onError,
  });
  const reorder = useMutation({
    mutationFn: (ids: number[]) =>
      call(api.admin.releases.reorder.patch({ ids })),
    onSuccess: refresh,
    onError,
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} />;

  const move = (i: number, dir: -1 | 1) => {
    const ids = data.map((r) => r.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j] as number, ids[i] as number];
    reorder.mutate(ids);
  };

  return (
    <>
      <PageHeader
        title="Releases"
        description="Album and song posters that auto-scroll at the top of the home page. Add the platform links where people can listen."
        actions={
          <Button onClick={() => setEdit(toDraft(undefined, data.length))}>
            <Plus /> Add release
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState icon={<Disc3 className="size-8" />} title="No releases yet">
          Upload a poster for the latest album or song to show it on the home
          page.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((r, i) => (
            <Card
              key={r.id}
              className={cn(
                "flex-col gap-4 p-4 sm:flex-row sm:items-center",
                !r.isActive && "opacity-60",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={i === 0 || reorder.isPending}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={i === data.length - 1 || reorder.isPending}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <img
                  src={r.posterPath}
                  alt=""
                  className={cn(
                    "h-20 shrink-0 rounded-lg bg-navy object-cover",
                    r.aspect === "wide" ? "aspect-video" : "aspect-square",
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy">{r.title}</p>
                  {r.subtitle && <Pill tone="navy">{r.subtitle}</Pill>}
                  {!r.isActive && <Pill>Hidden</Pill>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {r.caption}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {r.links.map((l) => {
                    const meta = PLATFORM_META[l.platform];
                    return (
                      <a
                        key={`${l.platform}-${l.url}`}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:border-primary"
                      >
                        <meta.icon style={{ color: meta.color }} />
                        {meta.label}
                      </a>
                    );
                  })}
                  {r.releaseDate && (
                    <span>
                      · {formatDate(`${ymd(r.releaseDate)}T00:00:00+05:30`)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1">
                <label className="mr-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={r.isActive}
                    onCheckedChange={() => toggle.mutate(r)}
                    aria-label="Show on home page"
                  />
                  Visible
                </label>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={() => setEdit(toDraft(r))}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  aria-label="Delete"
                  onClick={() =>
                    confirm(`Delete "${r.title}"?`) && del.mutate(r.id)
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReleaseDialog draft={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function ReleaseDialog({
  draft,
  onClose,
}: {
  draft: Draft | null;
  onClose: () => void;
}) {
  const [d, setD] = useState<Draft | null>(draft);
  const [prev, setPrev] = useState(draft);
  if (draft !== prev) {
    setPrev(draft);
    setD(draft);
  }
  const refresh = useRefresh();

  const save = useMutation({
    mutationFn: (x: Draft) => {
      const body = {
        title: x.title.trim(),
        subtitle: x.subtitle.trim() || null,
        caption: x.caption.trim(),
        posterPath: x.posterPath ?? "",
        aspect: x.aspect,
        links: x.links
          .map((l) => ({ ...l, url: l.url.trim() }))
          .filter((l) => l.url),
        releaseDate: x.releaseDate || null,
        isActive: x.isActive,
        sortOrder: x.sortOrder,
      };
      return x.id
        ? call(api.admin.releases({ id: x.id }).patch(body))
        : call(api.admin.releases.post(body));
    },
    onSuccess: () => {
      toast.success("Release saved");
      refresh();
      onClose();
    },
    onError,
  });

  const setLink = (i: number, patch: Partial<Draft["links"][number]>) =>
    d &&
    setD({
      ...d,
      links: d.links.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    });

  const submit = () => {
    if (!d) return;
    if (!d.posterPath) return toast.error("Upload a poster image");
    if (!d.title.trim()) return toast.error("Add a title");
    const bad = d.links.find(
      (l) => l.url.trim() && !/^https?:\/\//.test(l.url.trim()),
    );
    if (bad) return toast.error("Links must start with https://");
    save.mutate(d);
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{d?.id ? "Edit release" : "New release"}</DialogTitle>
        </DialogHeader>
        {d && (
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              <Field label="Poster shape">
                <div className="flex gap-2">
                  {(
                    [
                      ["square", "Square · album art (1:1)"],
                      ["wide", "Wide · video thumbnail (16:9)"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setD({ ...d, aspect: v })}
                      className={cn(
                        "flex-1 rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition sm:text-sm",
                        d.aspect === v
                          ? "border-primary bg-accent/50"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field
                label="Poster image"
                required
                hint="JPG/PNG/WebP. Square 1000×1000 or wide 1280×720 works best."
              >
                <ImageUpload
                  folder="releases"
                  aspect={
                    d.aspect === "wide"
                      ? "aspect-video"
                      : "aspect-square max-w-60"
                  }
                  value={d.posterPath}
                  onChange={(p) => setD({ ...d, posterPath: p })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title" required>
                  <Input
                    value={d.title}
                    maxLength={160}
                    placeholder="e.g. Satgur Tumre Kaaj Saware"
                    onChange={(e) => setD({ ...d, title: e.target.value })}
                  />
                </Field>
                <Field label="Label" hint="Small line above the title.">
                  <Input
                    value={d.subtitle}
                    maxLength={120}
                    placeholder="e.g. New Album · 2026"
                    onChange={(e) => setD({ ...d, subtitle: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Caption / description">
                <Textarea
                  rows={3}
                  maxLength={600}
                  value={d.caption}
                  onChange={(e) => setD({ ...d, caption: e.target.value })}
                />
              </Field>
              <Field label="Listen / watch links">
                <div className="space-y-2">
                  {d.links.map((l, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center sm:border-0 sm:p-0"
                    >
                      <NativeSelect
                        className="w-full sm:w-44"
                        value={l.platform}
                        onChange={(e) =>
                          setLink(i, {
                            platform: e.target.value as ReleasePlatform,
                          })
                        }
                      >
                        {RELEASE_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {PLATFORM_META[p].label}
                          </option>
                        ))}
                      </NativeSelect>
                      <div className="flex flex-1 gap-2">
                        <Input
                          type="url"
                          placeholder="https://"
                          value={l.url}
                          onChange={(e) => setLink(i, { url: e.target.value })}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove link"
                          onClick={() =>
                            setD({
                              ...d,
                              links: d.links.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={d.links.length >= 10}
                    onClick={() =>
                      setD({
                        ...d,
                        links: [...d.links, { platform: "spotify", url: "" }],
                      })
                    }
                  >
                    <Plus /> Add link
                  </Button>
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Release date">
                  <Input
                    type="date"
                    value={d.releaseDate}
                    onChange={(e) =>
                      setD({ ...d, releaseDate: e.target.value })
                    }
                  />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <Switch
                    checked={d.isActive}
                    onCheckedChange={(v) => setD({ ...d, isActive: v })}
                  />
                  Show on home page
                </label>
              </div>
            </div>

            {/* live preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <div className="grid place-items-center overflow-hidden rounded-xl bg-[#070b18] p-4">
                {d.posterPath ? (
                  <ReleaseCard
                    className="!h-auto w-full"
                    r={{
                      ...d,
                      posterPath: d.posterPath,
                      links: d.links.filter((l) => l.url.trim()),
                    }}
                    isNew
                  />
                ) : (
                  <p className="py-16 text-center text-xs text-cream/60">
                    Upload a poster to preview
                  </p>
                )}
              </div>
              {d.links.some((l) => l.url.trim()) && (
                <div className="space-y-1.5 rounded-xl bg-[#0b1229] p-3">
                  {d.links
                    .filter((l) => l.url.trim())
                    .map((l, i) => (
                      <PlatformButton
                        key={i}
                        platform={l.platform}
                        url={l.url}
                        size="lg"
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            Save release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

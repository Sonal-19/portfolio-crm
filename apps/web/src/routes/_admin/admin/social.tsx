import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, call } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/social")({
  component: SocialAdmin,
});

type Platform = "youtube" | "instagram" | "facebook";
const ICON = {
  youtube: FaYoutube,
  instagram: FaInstagram,
  facebook: FaFacebookF,
};

function SocialAdmin() {
  const [platform, setPlatform] = useState<Platform | undefined>();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "social", platform],
    queryFn: () => call(api.admin.social.get({ query: { platform } })),
  });
  const { data: status } = useQuery({
    queryKey: ["admin", "social-status"],
    queryFn: () => call(api.admin.social.status.get()),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "social"] });
    qc.invalidateQueries({ queryKey: ["public", "social"] });
  };
  const sync = useMutation({
    mutationFn: () => call(api.admin.social.sync.post({ platform })),
    onSuccess: (res) => {
      toast.success(
        `Synced ${res?.reduce((s, r) => s + r.synced, 0) ?? 0} posts`,
      );
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const hide = useMutation({
    mutationFn: ({ id, isHidden }: { id: number; isHidden: boolean }) =>
      call(api.admin.social({ id }).patch({ isHidden })),
    onSuccess: refresh,
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.social({ id }).delete()),
    onSuccess: refresh,
  });

  return (
    <>
      <PageHeader
        title="Social feed"
        description="Posts shown in the 'Latest' section of the website. Hide anything you don't want displayed."
        actions={
          <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={cn(sync.isPending && "animate-spin")} /> Sync
            now
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {status?.map((s) => {
          const Icon = ICON[s.platform];
          return (
            <Card key={s.platform} className="flex-row items-center gap-3 p-4">
              <Icon className="size-5" />
              <span className="flex-1 font-medium capitalize">
                {s.platform}
              </span>
              <Pill tone={s.mode === "live" ? "green" : "amber"}>
                {s.mode === "live" ? "API connected" : "Demo data"}
              </Pill>
            </Card>
          );
        })}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        To go live, set FB_PAGE_ID/FB_PAGE_TOKEN, IG_USER_ID/IG_TOKEN and
        YT_CHANNEL_ID/YT_API_KEY in the API's .env. The feed then refreshes
        every 6 hours.
      </p>
      <div className="mb-4 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant={!platform ? "secondary" : "ghost"}
          onClick={() => setPlatform(undefined)}
        >
          All
        </Button>
        {(["youtube", "instagram", "facebook"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={platform === p ? "secondary" : "ghost"}
            onClick={() => setPlatform(p)}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <PageLoader />
      ) : error || !data ? (
        <ErrorState error={error} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((p) => {
            const Icon = ICON[p.platform];
            return (
              <Card
                key={p.id}
                className={cn(
                  "gap-0 overflow-hidden p-0",
                  p.isHidden && "opacity-50",
                )}
              >
                <div className="relative aspect-video bg-navy">
                  {(p.thumbnailUrl ?? p.mediaUrl) && (
                    <img
                      src={p.thumbnailUrl ?? p.mediaUrl ?? ""}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-white/90">
                    <Icon className="size-3.5" />
                  </span>
                  {p.isHidden && (
                    <span className="absolute top-2 right-2">
                      <Pill tone="gray">Hidden</Pill>
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 flex-1 text-sm">{p.caption}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(p.publishedAt)}</span>
                    <div className="flex">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        asChild
                        title="Open"
                      >
                        <a href={p.permalink} target="_blank" rel="noreferrer">
                          <ExternalLink />
                        </a>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title={p.isHidden ? "Show on site" : "Hide from site"}
                        onClick={() =>
                          hide.mutate({ id: p.id, isHidden: !p.isHidden })
                        }
                      >
                        {p.isHidden ? <Eye /> : <EyeOff />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        title="Remove"
                        onClick={() =>
                          confirm("Remove this post from the cache?") &&
                          del.mutate(p.id)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

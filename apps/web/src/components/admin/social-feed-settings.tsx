import type { FeedArrangement, YoutubeContentKind } from "@api/db/schema";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { Pill } from "@/components/admin/badges";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, call, callMsg } from "@/lib/api";
import { cn, formatDate, relativeTime } from "@/lib/utils";

export const socialStatusQuery = queryOptions({
  queryKey: ["admin", "social-status"] as const,
  queryFn: () => call(api.admin.social.status.get()),
});

type Status = NonNullable<
  Awaited<ReturnType<NonNullable<typeof socialStatusQuery.queryFn>>>
>;
type Feed = Status["feeds"][number];
type Channel = Status["channels"][number];
type FeedPatch = {
  showOnSite?: boolean;
  autoSync?: boolean;
  syncEveryHours?: number;
  arrangement?: FeedArrangement;
};
type ChannelPatch = {
  label?: string;
  include?: YoutubeContentKind[];
  maxVideos?: number;
  isActive?: boolean;
};

export const SOCIAL_ICON = {
  youtube: FaYoutube,
  instagram: FaInstagram,
  facebook: FaFacebookF,
};

const KINDS: { key: YoutubeContentKind; label: string }[] = [
  { key: "videos", label: "Videos" },
  { key: "shorts", label: "Shorts" },
  { key: "live", label: "Live streams" },
];
const SYNC_HOURS = [1, 3, 6, 12, 24];
const CHANNEL_SIZES = [3, 6, 9, 12, 18, 24];

const compact = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);

/** Select options, plus the stored value when it isn't one of the presets. */
const withCurrent = (options: number[], current: number) =>
  options.includes(current)
    ? options
    : [...options, current].sort((a, b) => a - b);

/**
 * Every settings endpoint answers with the fresh status, so a save updates
 * the cards without a refetch. `onChanged` lets the page reload its posts.
 */
function useSave<V>(
  fn: (v: V) => Promise<{ data: Status | null; message: string }>,
  onChanged: () => void,
  announce = false,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: ({ data, message }) => {
      if (data) qc.setQueryData(socialStatusQuery.queryKey, data);
      if (announce) toast.success(message);
      onChanged();
    },
    onError: (e) => {
      toast.error(e.message);
      // A failed sync may still have saved the change (e.g. a new channel).
      qc.invalidateQueries({ queryKey: socialStatusQuery.queryKey });
    },
  });
}

/** Admin → Social feed: YouTube channels plus per-platform "show on website"
 * switches. `onChanged` fires after anything is saved. */
export function SocialFeedSettings({ onChanged }: { onChanged: () => void }) {
  const { data: status } = useQuery(socialStatusQuery);
  const patchFeed = useSave(
    ({ platform, ...body }: FeedPatch & Pick<Feed, "platform">) =>
      callMsg(api.admin.social.feeds({ platform }).patch(body)),
    onChanged,
  );
  if (!status) return null;
  const youtube = status.feeds.find((f) => f.platform === "youtube");

  return (
    <div className="mb-6 space-y-4">
      {youtube && (
        <YoutubeCard
          feed={youtube}
          channels={status.channels}
          keySet={status.youtubeKeySet}
          saving={patchFeed.isPending}
          onPatchFeed={(body) =>
            patchFeed.mutate({ platform: "youtube", ...body })
          }
          onChanged={onChanged}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {status.feeds.map((f) => {
          const Icon = SOCIAL_ICON[f.platform];
          return (
            <Card key={f.platform} className="gap-3 p-4">
              <div className="flex items-center gap-3">
                <Icon className="size-5" />
                <span className="flex-1 font-medium capitalize">
                  {f.platform}
                </span>
                <Pill tone={f.mode === "live" ? "green" : "amber"}>
                  {f.mode === "live" ? "Live data" : "Demo data"}
                </Pill>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                Show on website
                <Switch
                  checked={f.showOnSite}
                  disabled={patchFeed.isPending}
                  onCheckedChange={(showOnSite) =>
                    patchFeed.mutate({ platform: f.platform, showOnSite })
                  }
                />
              </label>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Facebook and Instagram show demo posts until FB_PAGE_ID/FB_PAGE_TOKEN
        and IG_USER_ID/IG_TOKEN are set in the API's .env. Switch off "Show on
        website" to hide a platform's tab until then.
      </p>
    </div>
  );
}

function YoutubeCard({
  feed,
  channels,
  keySet,
  saving,
  onPatchFeed,
  onChanged,
}: {
  feed: Feed;
  channels: Channel[];
  keySet: boolean;
  saving: boolean;
  onPatchFeed: (body: FeedPatch) => void;
  onChanged: () => void;
}) {
  const patch = useSave(
    ({ id, ...body }: ChannelPatch & { id: number }) =>
      callMsg(api.admin.social.youtube.channels({ id }).patch(body)),
    onChanged,
  );
  const reorder = useSave(
    (ids: number[]) =>
      callMsg(api.admin.social.youtube.channels.order.put({ ids })),
    onChanged,
  );
  const remove = useSave(
    (id: number) => callMsg(api.admin.social.youtube.channels({ id }).delete()),
    onChanged,
    true,
  );
  const busy = patch.isPending || reorder.isPending || remove.isPending;

  const move = (index: number, by: -1 | 1) => {
    const ids = channels.map((c) => c.id);
    const [id] = ids.splice(index, 1);
    if (id === undefined) return;
    ids.splice(index + by, 0, id);
    reorder.mutate(ids);
  };

  return (
    <Card className="gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-navy">
            <FaYoutube className="size-4 text-red-600" /> YouTube channels
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The YouTube tab of the website's "Latest" section shows the newest
            uploads of these channels. Videos are saved here and the website
            reads the saved copy, so visitors never wait on YouTube.
          </p>
        </div>
        <Pill tone={keySet && channels.length ? "green" : "amber"}>
          {!keySet
            ? "API key missing"
            : channels.length
              ? `${channels.length} connected`
              : "Not connected"}
        </Pill>
      </div>

      {!keySet && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          YOUTUBE_API_KEY is not set in the API's .env, so the site shows demo
          videos. Add the key and restart the API to connect a channel.
        </p>
      )}

      {channels.length > 0 && (
        <ul className="space-y-3">
          {channels.map((c, i) => (
            <ChannelRow
              key={c.id}
              channel={c}
              busy={busy}
              canMoveUp={i > 0}
              canMoveDown={i < channels.length - 1}
              onMove={(by) => move(i, by)}
              onPatch={(body) => patch.mutate({ id: c.id, ...body })}
              onRemove={() =>
                confirm(
                  `Remove ${c.title}? Its videos leave the website's feed.`,
                ) && remove.mutate(c.id)
              }
            />
          ))}
        </ul>
      )}

      {keySet && <AddChannel onChanged={onChanged} />}

      {channels.length > 0 && (
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-3">
          <Field
            label="Auto-refresh"
            hint={
              feed.lastSyncedAt
                ? `Last checked ${relativeTime(feed.lastSyncedAt)}`
                : "Not checked yet"
            }
          >
            <div className="flex h-9 items-center">
              <Switch
                checked={feed.autoSync}
                disabled={saving}
                onCheckedChange={(autoSync) => onPatchFeed({ autoSync })}
              />
            </div>
          </Field>
          <Field
            label="Check YouTube for new videos"
            htmlFor="yt-every"
            hint="Between checks the saved videos are used"
          >
            <NativeSelect
              id="yt-every"
              className="w-full"
              value={feed.syncEveryHours}
              disabled={saving || !feed.autoSync}
              onChange={(e) =>
                onPatchFeed({ syncEveryHours: Number(e.target.value) })
              }
            >
              {withCurrent(SYNC_HOURS, feed.syncEveryHours).map((h) => (
                <option key={h} value={h}>
                  {h === 1
                    ? "Every hour"
                    : h === 24
                      ? "Once a day"
                      : `Every ${h} hours`}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Order on the website"
            htmlFor="yt-arrange"
            hint="Pinned videos always come first"
          >
            <NativeSelect
              id="yt-arrange"
              className="w-full"
              value={feed.arrangement}
              disabled={saving}
              onChange={(e) =>
                onPatchFeed({
                  arrangement: e.target.value as FeedArrangement,
                })
              }
            >
              <option value="newest">Newest first, all channels mixed</option>
              <option value="balanced">
                Channels take turns, in list order
              </option>
            </NativeSelect>
          </Field>
          {feed.lastSyncError && (
            <p className="flex items-start gap-1.5 text-xs text-destructive sm:col-span-3">
              <TriangleAlert className="mt-px size-3.5 shrink-0" /> Last refresh
              failed: {feed.lastSyncError}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ChannelRow({
  channel: c,
  busy,
  canMoveUp,
  canMoveDown,
  onMove,
  onPatch,
  onRemove,
}: {
  channel: Channel;
  busy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (by: -1 | 1) => void;
  onPatch: (body: ChannelPatch) => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(c.label ?? "");
  const toggleKind = (kind: YoutubeContentKind, on: boolean) => {
    const include = KINDS.map((k) => k.key).filter((k) =>
      k === kind ? on : c.include.includes(k),
    );
    if (include.length === 0) {
      toast.error("A channel needs at least one kind of video");
      return;
    }
    onPatch({ include });
  };

  return (
    <li
      className={cn(
        "space-y-3 rounded-lg border p-3",
        !c.isActive && "bg-muted/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-5"
            title="Move up"
            disabled={busy || !canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ArrowUp />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-5"
            title="Move down"
            disabled={busy || !canMoveDown}
            onClick={() => onMove(1)}
          >
            <ArrowDown />
          </Button>
        </div>
        <ChannelLine
          title={c.title}
          handle={c.handle}
          thumbnailUrl={c.thumbnailUrl}
          subscriberCount={c.subscriberCount}
          videoCount={c.videoCount}
          url={`https://www.youtube.com/${c.handle ?? `channel/${c.channelId}`}`}
          dimmed={!c.isActive}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {c.isActive ? "Showing" : "Paused"}
          <Switch
            checked={c.isActive}
            disabled={busy}
            onCheckedChange={(isActive) => onPatch({ isActive })}
          />
        </label>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive"
          title="Remove channel"
          disabled={busy}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field label="Name on the website" htmlFor={`yt-label-${c.id}`}>
          <Input
            id={`yt-label-${c.id}`}
            placeholder={c.title}
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() =>
              label.trim() !== (c.label ?? "") && onPatch({ label })
            }
          />
        </Field>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Show</p>
          <div className="flex h-9 flex-wrap items-center gap-x-4 gap-y-1">
            {KINDS.map((k) => (
              <label key={k.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={c.include.includes(k.key)}
                  disabled={busy}
                  onCheckedChange={(on) => toggleKind(k.key, on === true)}
                />
                {k.label}
              </label>
            ))}
          </div>
        </div>
        <Field label="Keep" htmlFor={`yt-size-${c.id}`}>
          <NativeSelect
            id={`yt-size-${c.id}`}
            value={c.maxVideos}
            disabled={busy}
            onChange={(e) => onPatch({ maxVideos: Number(e.target.value) })}
          >
            {withCurrent(CHANNEL_SIZES, c.maxVideos).map((n) => (
              <option key={n} value={n}>
                Latest {n}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {c.lastSyncError ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <TriangleAlert className="mt-px size-3.5 shrink-0" /> Last refresh
          failed: {c.lastSyncError}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {!c.isActive
            ? "Paused: its videos are off the website until you switch it back on."
            : c.lastSyncedAt
              ? `${c.lastSyncCount ?? 0} videos saved · refreshed ${relativeTime(c.lastSyncedAt)}`
              : "Not refreshed yet"}
        </p>
      )}
    </li>
  );
}

/** Look a channel up by handle, preview it, then add it to the list. */
function AddChannel({ onChanged }: { onChanged: () => void }) {
  const [channel, setChannel] = useState("");
  const [include, setInclude] = useState<YoutubeContentKind[]>([
    "videos",
    "live",
  ]);
  const [maxVideos, setMaxVideos] = useState(6);
  const ready = channel.trim() !== "";

  const test = useMutation({
    mutationFn: () => call(api.admin.social.youtube.test.post({ channel })),
  });
  const add = useSave(
    () =>
      callMsg(
        api.admin.social.youtube.channels.post({ channel, include, maxVideos }),
      ),
    () => {
      setChannel("");
      test.reset();
      onChanged();
    },
    true,
  );
  // The test returns a few uploads of every kind, so ticking the boxes
  // re-filters the preview without asking YouTube again.
  const sample = (test.data?.sample ?? [])
    .filter((v) => include.includes(v.kind))
    .slice(0, 6);

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) test.mutate();
        }}
      >
        <Field
          label="Add a channel"
          htmlFor="yt-channel"
          hint="Type the channel's @handle, paste its link or its channel ID, then test it."
        >
          <div className="flex gap-2">
            <Input
              id="yt-channel"
              placeholder="@shimlawaleofficial"
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                test.reset();
              }}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!ready || test.isPending}
            >
              {test.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              Test
            </Button>
          </div>
        </Field>
      </form>

      {test.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {test.error.message}
        </p>
      )}

      {test.data && (
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="size-3.5" /> Channel found
          </p>
          <ChannelLine {...test.data.channel} />
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Show</p>
              <div className="flex h-9 flex-wrap items-center gap-x-4 gap-y-1">
                {KINDS.map((k) => (
                  <label
                    key={k.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={include.includes(k.key)}
                      onCheckedChange={(on) =>
                        setInclude(
                          KINDS.map((x) => x.key).filter((x) =>
                            x === k.key ? on === true : include.includes(x),
                          ),
                        )
                      }
                    />
                    {k.label}
                    <span className="text-muted-foreground">
                      ({compact(test.data.counts[k.key])})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Keep" htmlFor="yt-new-size">
              <NativeSelect
                id="yt-new-size"
                value={maxVideos}
                onChange={(e) => setMaxVideos(Number(e.target.value))}
              >
                {CHANNEL_SIZES.map((n) => (
                  <option key={n} value={n}>
                    Latest {n}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          {sample.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {include.length === 0
                ? "Pick at least one kind of video."
                : "This channel has no uploads of the selected kinds."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sample.map((v) => (
                <a
                  key={v.externalId}
                  href={v.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="group text-xs"
                >
                  <div className="aspect-video overflow-hidden rounded-md bg-navy">
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 font-medium group-hover:underline">
                    {v.caption}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(v.publishedAt)}
                    {v.stats.views !== undefined &&
                      ` · ${compact(v.stats.views)} views`}
                  </p>
                </a>
              ))}
            </div>
          )}
          <Button
            disabled={include.length === 0 || add.isPending}
            onClick={() => add.mutate(undefined)}
          >
            {add.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Add channel
          </Button>
        </div>
      )}
    </div>
  );
}

function ChannelLine({
  title,
  handle,
  thumbnailUrl,
  subscriberCount,
  videoCount,
  url,
  dimmed,
}: {
  title: string;
  handle: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  url: string;
  dimmed?: boolean;
}) {
  const facts = [
    handle,
    subscriberCount !== null && `${compact(subscriberCount)} subscribers`,
    videoCount !== null && `${compact(videoCount)} uploads`,
  ].filter(Boolean);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 basis-52 items-center gap-3",
        dimmed && "opacity-60",
      )}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="size-11 shrink-0 rounded-full"
        />
      )}
      <div className="min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-medium text-navy hover:underline"
        >
          <span className="truncate">{title}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
        <p className="truncate text-xs text-muted-foreground">
          {facts.join(" · ")}
        </p>
      </div>
    </div>
  );
}

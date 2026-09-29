import { youtubeId } from "@api/lib/utils";
import {
  CheckCircle2,
  ExternalLink,
  Music2,
  TriangleAlert,
} from "lucide-react";
import { Field } from "@/components/common/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Value = {
  heroTrackUrl: string | null;
  heroTrackTitle: string | null;
  heroTrackSubtitle: string | null;
};

/** Settings card: which YouTube track the landing page hero plays. */
export function HeroMusicCard({
  value,
  onChange,
}: {
  value: Value;
  onChange: (patch: Partial<Value>) => void;
}) {
  const url = value.heroTrackUrl ?? "";
  const id = youtubeId(url);
  const invalid = url.trim() !== "" && !id;

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Music2 className="size-4" /> Hero music
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The track visitors can play from the music card on the home page.
          Paste any YouTube or YouTube Music link. Leave empty to hide the card.
        </p>
      </div>
      <Field label="YouTube / YouTube Music link">
        <Input
          placeholder="https://www.youtube.com/watch?v=…"
          value={url}
          aria-invalid={invalid}
          onChange={(e) => onChange({ heroTrackUrl: e.target.value || null })}
        />
        {invalid && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3.5" /> This doesn't look like a
            YouTube video link.
          </p>
        )}
        {id && (
          <p className="flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="size-3.5" /> Video found ({id})
          </p>
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Track title" hint="Shown on the music card">
          <Input
            placeholder="Satgur Tumre Kaaj Saware"
            value={value.heroTrackTitle ?? ""}
            onChange={(e) =>
              onChange({ heroTrackTitle: e.target.value || null })
            }
          />
        </Field>
        <Field label="Small line under title" hint="e.g. 66 Lakh+ views">
          <Input
            value={value.heroTrackSubtitle ?? ""}
            onChange={(e) =>
              onChange({ heroTrackSubtitle: e.target.value || null })
            }
          />
        </Field>
      </div>
      {id && (
        <div className="overflow-hidden rounded-xl border bg-navy">
          <iframe
            key={id}
            src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
            title="Hero music preview"
            allow="encrypted-media; picture-in-picture"
            className="aspect-video w-full"
          />
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-end gap-1 px-3 py-2 text-xs text-cream/70 hover:text-cream"
          >
            Open on YouTube <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </Card>
  );
}

export function isHeroTrackValid(url: string | null | undefined) {
  return !url?.trim() || !!youtubeId(url);
}

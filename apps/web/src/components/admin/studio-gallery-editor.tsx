import type { StudioGalleryItem } from "@api/db/schema";
import { ArrowDown, ArrowUp, Images, Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { GALLERY_ICONS } from "@/components/landing/studio-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { titleCase } from "@/lib/utils";
import { ImageUpload } from "./image-upload";

const MAX_ITEMS = 12;
const ICON_KEYS = Object.keys(GALLERY_ICONS) as StudioGalleryItem["icon"][];

/** Settings card: the "Inside our studio" photo cards on the home page. */
export function StudioGalleryEditor({
  items,
  onChange,
}: {
  items: StudioGalleryItem[];
  onChange: (items: StudioGalleryItem[]) => void;
}) {
  const update = (i: number, patch: Partial<StudioGalleryItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const [it] = next.splice(i, 1);
    if (it) next.splice(i + dir, 0, it);
    onChange(next);
  };

  return (
    <Card className="gap-4 p-5 xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-navy">
            <Images className="size-4" /> Studio photos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Photo cards shown under "World-Class Studio Facilities" on the home
            page, in this order. Cards without a photo are skipped.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= MAX_ITEMS}
          onClick={() =>
            onChange([
              ...items,
              { imagePath: "", title: "", description: "", icon: "mic" },
            ])
          }
        >
          <Plus /> Add photo
        </Button>
      </div>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No studio photos yet. The facilities section is hidden on the website.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photo {i + 1}
              </span>
              <div className="flex">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move up"
                  title="Move earlier"
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                  title="Move later"
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  aria-label="Remove photo"
                  title="Remove"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <ImageUpload
              folder="studio"
              aspect="aspect-[16/10]"
              value={it.imagePath || null}
              onChange={(p) => update(i, { imagePath: p ?? "" })}
            />
            <div className="grid grid-cols-[1fr_130px] gap-2">
              <Field label="Title">
                <Input
                  maxLength={80}
                  value={it.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                />
              </Field>
              <Field label="Icon">
                <NativeSelect
                  className="w-full"
                  value={it.icon}
                  onChange={(e) =>
                    update(i, {
                      icon: e.target.value as StudioGalleryItem["icon"],
                    })
                  }
                >
                  {ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {titleCase(k)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                rows={2}
                maxLength={240}
                value={it.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>
    </Card>
  );
}

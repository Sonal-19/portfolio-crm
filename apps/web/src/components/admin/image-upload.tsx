import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { api, call } from "@/lib/api";
import { cn } from "@/lib/utils";

type Folder = "brand" | "gallery" | "blog" | "studio" | "social";

/** Uploads to the API (converted to WebP) and returns the stored /uploads/… path. */
export function ImageUpload({
  value,
  onChange,
  folder,
  aspect = "aspect-video",
  className,
}: {
  value?: string | null;
  onChange: (path: string | null) => void;
  folder: Folder;
  aspect?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: (file: File) => call(api.admin.uploads.post({ file, folder })),
    onSuccess: (res) => {
      if (res?.path) onChange(res.path);
      toast.success("Image uploaded");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "relative grid w-full place-items-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/40 transition hover:border-primary/60",
          aspect,
        )}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <ImagePlus className="size-6" /> Click to upload
          </span>
        )}
        {upload.isPending && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Spinner />
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload.mutate(f);
          e.target.value = "";
        }}
      />
      {value && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => input.current?.click()}
          >
            Replace
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onChange(null)}
          >
            <Trash2 /> Remove
          </Button>
        </div>
      )}
    </div>
  );
}

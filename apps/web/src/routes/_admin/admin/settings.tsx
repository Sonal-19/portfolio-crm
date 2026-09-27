import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field } from "@/components/common/field";
import { ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/settings")({
  component: SettingsPage,
});

type Settings = NonNullable<Awaited<ReturnType<typeof fetchSettings>>>;
const fetchSettings = () => call(api.admin.settings.get());

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchSettings,
  });
  const [f, setF] = useState<Settings | null>(null);
  useEffect(() => {
    if (data) setF(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (s: Settings) => {
      const { id: _id, updatedAt: _u, ...body } = s;
      return call(api.admin.settings.patch(body));
    },
    onSuccess: () => {
      toast.success("Settings saved. The website is updated.");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public", "site-settings"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader />;
  if (error || !f) return <ErrorState error={error} />;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setF({ ...f, [k]: v });
  const text = (k: keyof Settings) => ({
    value: (f[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(k, e.target.value as never),
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything the public website shows about Bhai Sahib, the studio and contact details."
        actions={
          <Button onClick={() => save.mutate(f)} disabled={save.isPending}>
            <Save /> Save changes
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="font-semibold text-navy">Profile</h2>
          <Field label="Artist name">
            <Input {...text("artistName")} />
          </Field>
          <Field label="Tagline">
            <Input {...text("tagline")} />
          </Field>
          <Field
            label="Introduction / bio"
            hint="Markdown supported: **bold**, *italic*, blank line for new paragraph."
          >
            <Textarea rows={10} {...text("bio")} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["views", "followers", "years", "albums"] as const).map((k) => (
              <Field
                key={k}
                label={
                  {
                    views: "YouTube views",
                    followers: "Followers",
                    years: "Years",
                    albums: "Albums",
                  }[k]
                }
              >
                <Input
                  value={f.stats[k]}
                  onChange={(e) =>
                    set("stats", { ...f.stats, [k]: e.target.value })
                  }
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-semibold text-navy">Photos</h2>
          <p className="-mt-2 text-sm text-muted-foreground">
            Upload real photos of Bhai Sahib to replace the placeholder artwork.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Hero portrait">
              <ImageUpload
                folder="brand"
                aspect="aspect-[4/5]"
                value={f.heroImagePath}
                onChange={(p) => set("heroImagePath", p)}
              />
            </Field>
            <Field label="About photo">
              <ImageUpload
                folder="brand"
                aspect="aspect-[4/5]"
                value={f.aboutImagePath}
                onChange={(p) => set("aboutImagePath", p)}
              />
            </Field>
            <Field label="Studio photo">
              <ImageUpload
                folder="studio"
                aspect="aspect-[4/5]"
                value={f.studioImagePath}
                onChange={(p) => set("studioImagePath", p)}
              />
            </Field>
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-semibold text-navy">Studio & contact</h2>
          <Field label="Studio introduction">
            <Textarea rows={4} {...text("studioIntro")} />
          </Field>
          <Field label="Studio address">
            <Input {...text("studioAddress")} />
          </Field>
          <Field label="Google Maps embed URL">
            <Input {...text("mapEmbedUrl")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Phone">
              <Input {...text("phone")} />
            </Field>
            <Field
              label="WhatsApp number"
              hint="Digits with country code, e.g. 919876543210"
            >
              <Input {...text("whatsappNumber")} />
            </Field>
            <Field label="Email">
              <Input type="email" {...text("email")} />
            </Field>
          </div>
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-semibold text-navy">Social & streaming links</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="YouTube">
              <Input {...text("youtubeUrl")} />
            </Field>
            <Field label="Instagram">
              <Input {...text("instagramUrl")} />
            </Field>
            <Field label="Facebook">
              <Input {...text("facebookUrl")} />
            </Field>
            <Field label="X (Twitter)">
              <Input {...text("xUrl")} />
            </Field>
            <Field label="Spotify">
              <Input {...text("spotifyUrl")} />
            </Field>
            <Field label="Apple Music">
              <Input {...text("appleMusicUrl")} />
            </Field>
            <Field label="WhatsApp Channel" className="sm:col-span-2">
              <Input {...text("whatsappChannelUrl")} />
            </Field>
          </div>
        </Card>

        <PasswordCard />
      </div>
    </>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const change = useMutation({
    mutationFn: () => call(api.admin.settings.password.post({ current, next })),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Card className="gap-4 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-navy">
        <KeyRound className="size-4" /> Change password
      </h2>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate();
        }}
      >
        <Field label="Current password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="outline"
          className="w-fit"
          disabled={change.isPending}
        >
          Update password
        </Button>
      </form>
    </Card>
  );
}

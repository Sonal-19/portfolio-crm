import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { ErrorState, PageLoader } from "@/components/common/states";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import { titleCase } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/studio")({
  component: StudioAdmin,
});

const catalogQuery = {
  queryKey: ["admin", "studio-catalog"],
  queryFn: () => call(api.admin.studio.catalog.get()),
};
type Catalog = NonNullable<Awaited<ReturnType<typeof catalogQuery.queryFn>>>;

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "studio-catalog"] });
    qc.invalidateQueries({ queryKey: ["public", "studio-catalog"] });
  };
}
const onError = (e: Error) => toast.error(e.message);

function StudioAdmin() {
  const { data, isLoading, error } = useQuery(catalogQuery);
  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <>
      <PageHeader
        title="Studio catalog"
        description="Session types, instruments, engineers and extras offered on the free booking form. No prices; the studio is seva."
      />
      <Tabs defaultValue="packages">
        <TabsList className="mb-4">
          <TabsTrigger value="packages">Session types</TabsTrigger>
          <TabsTrigger value="instruments">Instruments</TabsTrigger>
          <TabsTrigger value="engineers">Engineers</TabsTrigger>
          <TabsTrigger value="addons">Extras</TabsTrigger>
        </TabsList>
        <TabsContent value="packages">
          <Packages rows={data.packages} />
        </TabsContent>
        <TabsContent value="instruments">
          <Instruments rows={data.instruments} />
        </TabsContent>
        <TabsContent value="engineers">
          <Engineers rows={data.engineers} />
        </TabsContent>
        <TabsContent value="addons">
          <Addons rows={data.addons} />
        </TabsContent>
      </Tabs>
    </>
  );
}

type Pkg = Catalog["packages"][number];
function Packages({ rows }: { rows: Pkg[] }) {
  const [edit, setEdit] = useState<Partial<Pkg> | null>(null);
  const refresh = useRefresh();
  const save = useMutation({
    mutationFn: (p: Partial<Pkg>) => {
      const body = {
        name: p.name ?? "",
        description: p.description ?? "",
        durationHours: Number(p.durationHours ?? 2),
        includes: p.includes ?? [],
        icon: p.icon ?? "mic",
        isFeatured: p.isFeatured ?? false,
        sortOrder: Number(p.sortOrder ?? 0),
        isActive: p.isActive ?? true,
      };
      return p.id
        ? call(api.admin.studio.packages({ id: p.id }).patch(body))
        : call(api.admin.studio.packages.post(body));
    },
    onSuccess: () => {
      toast.success("Saved");
      setEdit(null);
      refresh();
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) =>
      call(api.admin.studio.packages({ id }).delete()),
    onSuccess: refresh,
    onError,
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      call(api.admin.studio.packages({ id }).patch({ isActive })),
    onSuccess: refresh,
  });

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button
          onClick={() =>
            setEdit({
              includes: [],
              durationHours: 2,
              icon: "mic",
              isActive: true,
            })
          }
        >
          <Plus /> Add session type
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id} className="gap-2 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 font-semibold text-navy">
                  {p.name}{" "}
                  {p.isFeatured && (
                    <Star className="size-4 fill-gold text-gold" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.durationHours} hours · order {p.sortOrder}
                </p>
              </div>
              <Switch
                checked={p.isActive}
                onCheckedChange={(v) =>
                  toggle.mutate({ id: p.id, isActive: v })
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">{p.description}</p>
            <div className="flex flex-wrap gap-1">
              {p.includes.map((i) => (
                <Pill key={i}>{i}</Pill>
              ))}
            </div>
            <div className="flex gap-1 pt-1">
              <Button size="sm" variant="outline" onClick={() => setEdit(p)}>
                <Pencil /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => confirm(`Delete ${p.name}?`) && del.mutate(p.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit session type" : "New session type"}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <Input
                  value={edit.name ?? ""}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={edit.description ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Duration (hours)">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={edit.durationHours ?? 2}
                  onChange={(e) =>
                    setEdit({ ...edit, durationHours: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Icon">
                <NativeSelect
                  className="w-full"
                  value={edit.icon ?? "mic"}
                  onChange={(e) => setEdit({ ...edit, icon: e.target.value })}
                >
                  {["mic", "disc", "sliders", "video"].map((i) => (
                    <option key={i} value={i}>
                      {titleCase(i)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field
                label="What's included (one per line)"
                className="sm:col-span-2"
              >
                <Textarea
                  rows={4}
                  value={(edit.includes ?? []).join("\n")}
                  onChange={(e) =>
                    setEdit({ ...edit, includes: e.target.value.split("\n") })
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={edit.sortOrder ?? 0}
                  onChange={(e) =>
                    setEdit({ ...edit, sortOrder: Number(e.target.value) })
                  }
                />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <Switch
                  checked={edit.isFeatured ?? false}
                  onCheckedChange={(v) => setEdit({ ...edit, isFeatured: v })}
                />{" "}
                Highlight as "Most requested"
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={!edit?.name || save.isPending}
              onClick={() =>
                edit &&
                save.mutate({
                  ...edit,
                  includes: (edit.includes ?? [])
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Instruments({ rows }: { rows: Catalog["instruments"] }) {
  const [name, setName] = useState("");
  const refresh = useRefresh();
  const add = useMutation({
    mutationFn: () =>
      call(
        api.admin.studio.instruments.post({ name, sortOrder: rows.length + 1 }),
      ),
    onSuccess: () => {
      setName("");
      refresh();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      call(api.admin.studio.instruments({ id }).patch({ isActive })),
    onSuccess: refresh,
  });
  const del = useMutation({
    mutationFn: (id: number) =>
      call(api.admin.studio.instruments({ id }).delete()),
    onSuccess: refresh,
    onError,
  });
  return (
    <Card className="gap-4 p-5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
      >
        <Input
          placeholder="New instrument, e.g. Sarinda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit">
          <Plus /> Add
        </Button>
      </form>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span
              className={i.isActive ? "" : "text-muted-foreground line-through"}
            >
              {i.name}
            </span>
            <span className="flex items-center gap-2">
              <Switch
                checked={i.isActive}
                onCheckedChange={(v) =>
                  toggle.mutate({ id: i.id, isActive: v })
                }
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => confirm(`Delete ${i.name}?`) && del.mutate(i.id)}
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type Eng = Catalog["engineers"][number];
function Engineers({ rows }: { rows: Eng[] }) {
  const [edit, setEdit] = useState<Partial<Eng> | null>(null);
  const refresh = useRefresh();
  const save = useMutation({
    mutationFn: (e: Partial<Eng>) => {
      const body = {
        name: e.name ?? "",
        bio: e.bio ?? "",
        photoPath: e.photoPath ?? null,
        isActive: e.isActive ?? true,
      };
      return e.id
        ? call(api.admin.studio.engineers({ id: e.id }).patch(body))
        : call(api.admin.studio.engineers.post(body));
    },
    onSuccess: () => {
      toast.success("Saved");
      setEdit(null);
      refresh();
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) =>
      call(api.admin.studio.engineers({ id }).delete()),
    onSuccess: refresh,
    onError,
  });
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEdit({ isActive: true })}>
          <Plus /> Add engineer
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((e) => (
          <Card key={e.id} className="flex-row items-center gap-4 p-4">
            <div className="size-14 shrink-0 overflow-hidden rounded-full bg-navy">
              {e.photoPath && (
                <img
                  src={e.photoPath}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">
                {e.name} {!e.isActive && <Pill>Inactive</Pill>}
              </p>
              <p className="text-sm text-muted-foreground">{e.bio}</p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setEdit(e)}
              aria-label="Edit"
            >
              <Pencil />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => confirm(`Delete ${e.name}?`) && del.mutate(e.id)}
              aria-label="Delete"
            >
              <Trash2 />
            </Button>
          </Card>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit engineer" : "New engineer"}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <ImageUpload
                folder="studio"
                aspect="aspect-square"
                value={edit.photoPath}
                onChange={(p) => setEdit({ ...edit, photoPath: p })}
              />
              <div className="space-y-3">
                <Field label="Name">
                  <Input
                    value={edit.name ?? ""}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </Field>
                <Field label="Bio">
                  <Textarea
                    rows={3}
                    value={edit.bio ?? ""}
                    onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={edit.isActive ?? true}
                    onCheckedChange={(v) => setEdit({ ...edit, isActive: v })}
                  />{" "}
                  Available for booking
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={!edit?.name || save.isPending}
              onClick={() => edit && save.mutate(edit)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type Addon = Catalog["addons"][number];
const KINDS = ["mixing", "mastering", "video_shoot", "other"] as const;
function Addons({ rows }: { rows: Addon[] }) {
  const [edit, setEdit] = useState<Partial<Addon> | null>(null);
  const refresh = useRefresh();
  const save = useMutation({
    mutationFn: (a: Partial<Addon>) => {
      const body = {
        name: a.name ?? "",
        description: a.description ?? "",
        kind: a.kind ?? "other",
        isActive: a.isActive ?? true,
      };
      return a.id
        ? call(api.admin.studio.addons({ id: a.id }).patch(body))
        : call(api.admin.studio.addons.post(body));
    },
    onSuccess: () => {
      toast.success("Saved");
      setEdit(null);
      refresh();
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.studio.addons({ id }).delete()),
    onSuccess: refresh,
    onError,
  });
  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEdit({ kind: "other", isActive: true })}>
          <Plus /> Add extra
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((a) => (
          <Card key={a.id} className="flex-row items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">
                {a.name} <Pill tone="navy">{titleCase(a.kind)}</Pill>{" "}
                {!a.isActive && <Pill>Inactive</Pill>}
              </p>
              <p className="text-sm text-muted-foreground">{a.description}</p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setEdit(a)}
              aria-label="Edit"
            >
              <Pencil />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => confirm(`Delete ${a.name}?`) && del.mutate(a.id)}
              aria-label="Delete"
            >
              <Trash2 />
            </Button>
          </Card>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit extra" : "New extra"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Field label="Name">
                <Input
                  value={edit.name ?? ""}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={edit.description ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Kind">
                <NativeSelect
                  className="w-full"
                  value={edit.kind ?? "other"}
                  onChange={(e) =>
                    setEdit({ ...edit, kind: e.target.value as Addon["kind"] })
                  }
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {titleCase(k)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={edit.isActive ?? true}
                  onCheckedChange={(v) => setEdit({ ...edit, isActive: v })}
                />{" "}
                Offered on the booking form
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={!edit?.name || save.isPending}
              onClick={() => edit && save.mutate(edit)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

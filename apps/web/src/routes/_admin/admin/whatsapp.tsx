import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  Filter,
  Pencil,
  Plus,
  Radio,
  Send,
  SkipForward,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { LEAD_STATUS_TONE, Pill, StatusPill } from "@/components/admin/badges";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  type LeadSource,
  type LeadStatus,
} from "@/components/admin/lead-constants";
import { LeadPicker } from "@/components/admin/lead-picker";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { EmptyState, PageLoader, Spinner } from "@/components/common/states";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { api, call, callMsg } from "@/lib/api";
import {
  copyToClipboard,
  formatDateTime,
  prettyPhone,
  renderTemplate,
  titleCase,
} from "@/lib/utils";

type TabKey = "lists" | "templates" | "send" | "history" | "channel";
type Search = { tab?: TabKey; broadcast?: number };

export const Route = createFileRoute("/_admin/admin/whatsapp")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: ["lists", "templates", "send", "history", "channel"].includes(
      s.tab as string,
    )
      ? (s.tab as TabKey)
      : undefined,
    broadcast: Number(s.broadcast) > 0 ? Number(s.broadcast) : undefined,
  }),
  component: WhatsappPage,
});

const onError = (e: Error) => toast.error(e.message);

function WhatsappPage() {
  const { tab = "lists", broadcast } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Broadcast lists, message templates, content sharing and your community channel. Messages open in WhatsApp for you to send (click-to-send)."
      />
      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ search: { tab: v as TabKey } })}
      >
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="lists">Broadcast lists</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Send / share</TabsTrigger>
          <TabsTrigger value="history">Sending queue</TabsTrigger>
          <TabsTrigger value="channel">Community channel</TabsTrigger>
        </TabsList>
        <TabsContent value="lists">
          <ListsTab />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="send">
          <SendTab
            onCreated={(id) =>
              navigate({ search: { tab: "history", broadcast: id } })
            }
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab
            openId={broadcast}
            onOpen={(id) =>
              navigate({ search: { tab: "history", broadcast: id } })
            }
          />
        </TabsContent>
        <TabsContent value="channel">
          <ChannelTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ───────────── Lists ───────────── */
function ListsTab() {
  const qc = useQueryClient();
  const { data: lists, isLoading } = useQuery({
    queryKey: ["admin", "wa-lists"],
    queryFn: () => call(api.admin.whatsapp.lists.get()),
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [newList, setNewList] = useState<{
    name: string;
    description: string;
  } | null>(null);
  useEffect(() => {
    if (!selected && lists?.[0]) setSelected(lists[0].id);
  }, [lists, selected]);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "wa-lists"] });
  const create = useMutation({
    mutationFn: () =>
      call(api.admin.whatsapp.lists.post(newList ?? { name: "" })),
    onSuccess: (l) => {
      setNewList(null);
      refresh();
      if (l) setSelected(l.id);
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.whatsapp.lists({ id }).delete()),
    onSuccess: () => {
      setSelected(null);
      refresh();
    },
  });

  if (isLoading) return <PageLoader />;
  const current = lists?.find((l) => l.id === selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2">
        {lists?.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSelected(l.id)}
            className={`w-full rounded-xl border bg-white p-4 text-left transition hover:shadow-sm ${selected === l.id ? "border-primary ring-2 ring-primary/20" : ""}`}
          >
            <p className="flex items-center justify-between font-semibold text-navy">
              {l.name}{" "}
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Users className="size-3" />
                {l.members}
              </span>
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {l.description}
            </p>
          </button>
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setNewList({ name: "", description: "" })}
        >
          <Plus /> New list
        </Button>
      </div>
      {current ? (
        <ListMembers
          list={current}
          onDelete={() =>
            confirm(`Delete list "${current.name}"?`) && del.mutate(current.id)
          }
        />
      ) : (
        <EmptyState title="Create a broadcast list to get started" />
      )}
      <Dialog open={!!newList} onOpenChange={(o) => !o && setNewList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New broadcast list</DialogTitle>
          </DialogHeader>
          <Field label="Name">
            <Input
              value={newList?.name ?? ""}
              onChange={(e) =>
                setNewList({
                  name: e.target.value,
                  description: newList?.description ?? "",
                })
              }
            />
          </Field>
          <Field label="Description">
            <Input
              value={newList?.description ?? ""}
              onChange={(e) =>
                setNewList({
                  name: newList?.name ?? "",
                  description: e.target.value,
                })
              }
            />
          </Field>
          <DialogFooter>
            <Button
              disabled={!newList?.name || create.isPending}
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListMembers({
  list,
  onDelete,
}: {
  list: { id: number; name: string; description: string };
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const { data: members, isLoading } = useQuery({
    queryKey: ["admin", "wa-list-members", list.id],
    queryFn: () =>
      call(api.admin.whatsapp.lists({ id: list.id }).members.get()),
  });
  const [filter, setFilter] = useState<{
    status?: LeadStatus;
    source?: LeadSource;
    tag?: string;
  }>({});
  const [adding, setAdding] = useState(false);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "wa-list-members", list.id] });
    qc.invalidateQueries({ queryKey: ["admin", "wa-lists"] });
  };
  const add = useMutation({
    mutationFn: (body: { leadIds?: number[]; filter?: typeof filter }) =>
      callMsg(api.admin.whatsapp.lists({ id: list.id }).members.post(body)),
    onSuccess: ({ message }) => {
      toast.success(message);
      refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (leadId: number) =>
      call(
        api.admin.whatsapp.lists({ id: list.id }).members({ leadId }).delete(),
      ),
    onSuccess: refresh,
  });
  const { data: tags } = useQuery({
    queryKey: ["admin", "lead-tags"],
    queryFn: () => call(api.admin.leads.tags.get()),
  });

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-navy">{list.name}</h2>
          <p className="text-sm text-muted-foreground">{list.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAdding((a) => !a)}
          >
            <Plus /> Add one lead
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {adding && (
        <div className="rounded-lg bg-muted/50 p-3">
          <LeadPicker
            value={null}
            onChange={(id) => add.mutate({ leadIds: [id] })}
          />
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-3">
        <Filter className="mb-2 size-4 text-muted-foreground" />
        <NativeSelect
          value={filter.status ?? ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              status: (e.target.value || undefined) as LeadStatus | undefined,
            })
          }
        >
          <option value="">Any status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={filter.source ?? ""}
          onChange={(e) =>
            setFilter({
              ...filter,
              source: (e.target.value || undefined) as LeadSource | undefined,
            })
          }
        >
          <option value="">Any source</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={filter.tag ?? ""}
          onChange={(e) =>
            setFilter({ ...filter, tag: e.target.value || undefined })
          }
        >
          <option value="">Any tag</option>
          {tags?.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </NativeSelect>
        <Button
          size="sm"
          onClick={() => add.mutate({ filter })}
          disabled={add.isPending}
        >
          Add all matching leads
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : members?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {members?.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <Link
                to="/admin/leads/$id"
                params={{ id: String(m.id) }}
                className="flex-1 font-medium hover:text-primary"
              >
                {m.name}
              </Link>
              <span className="hidden text-muted-foreground sm:inline">
                {prettyPhone(m.phone)}
              </span>
              <StatusPill value={m.status} map={LEAD_STATUS_TONE} />
              {!m.whatsappOptIn && <Pill tone="red">Opted out</Pill>}
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove.mutate(m.id)}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ───────────── Templates ───────────── */
type Tpl = {
  id?: number;
  name: string;
  body: string;
  category: "broadcast" | "followup" | "share";
};
function TemplatesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wa-templates"],
    queryFn: () => call(api.admin.whatsapp.templates.get()),
  });
  const [edit, setEdit] = useState<Tpl | null>(null);
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["admin", "wa-templates"] });
  const save = useMutation({
    mutationFn: (t: Tpl) => {
      const body = { name: t.name, body: t.body, category: t.category };
      return t.id
        ? call(api.admin.whatsapp.templates({ id: t.id }).patch(body))
        : call(api.admin.whatsapp.templates.post(body));
    },
    onSuccess: () => {
      toast.success("Template saved");
      setEdit(null);
      refresh();
    },
    onError,
  });
  const del = useMutation({
    mutationFn: (id: number) =>
      call(api.admin.whatsapp.templates({ id }).delete()),
    onSuccess: refresh,
  });
  if (isLoading) return <PageLoader />;
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Use <code className="rounded bg-muted px-1">{"{{name}}"}</code> for
          the first name and{" "}
          <code className="rounded bg-muted px-1">{"{{link}}"}</code> for a
          shared link.
        </p>
        <Button
          onClick={() => setEdit({ name: "", body: "", category: "broadcast" })}
        >
          <Plus /> New template
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((t) => (
          <Card key={t.id} className="gap-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy">
                {t.name}{" "}
                <Pill tone="navy" className="ml-1">
                  {titleCase(t.category)}
                </Pill>
              </p>
              <div className="flex">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEdit(t)}
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    confirm("Delete template?") && del.mutate(t.id)
                  }
                  aria-label="Delete"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <p className="rounded-lg bg-[#e7ffdb] p-3 text-sm whitespace-pre-wrap">
              {t.body}
            </p>
          </Card>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit template" : "New template"}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Field label="Name">
                <Input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <NativeSelect
                  className="w-full"
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      category: e.target.value as Tpl["category"],
                    })
                  }
                >
                  <option value="broadcast">Broadcast</option>
                  <option value="followup">Follow-up</option>
                  <option value="share">Share content</option>
                </NativeSelect>
              </Field>
              <Field label="Message">
                <Textarea
                  rows={6}
                  value={edit.body}
                  onChange={(e) => setEdit({ ...edit, body: e.target.value })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={!edit?.name || !edit.body || save.isPending}
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

/* ───────────── Send / share ───────────── */
function useShareables() {
  return useQuery({
    queryKey: ["admin", "wa-shareables"],
    queryFn: () => call(api.admin.whatsapp.shareables.get()),
  });
}

function SendTab({ onCreated }: { onCreated: (id: number) => void }) {
  const qc = useQueryClient();
  const { data: lists } = useQuery({
    queryKey: ["admin", "wa-lists"],
    queryFn: () => call(api.admin.whatsapp.lists.get()),
  });
  const { data: templates } = useQuery({
    queryKey: ["admin", "wa-templates"],
    queryFn: () => call(api.admin.whatsapp.templates.get()),
  });
  const { data: shareables } = useShareables();
  const [listId, setListId] = useState<number | "">("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const create = useMutation({
    mutationFn: () =>
      callMsg(
        api.admin.whatsapp.broadcasts.post({
          listId: Number(listId),
          templateId: templateId === "" ? undefined : templateId,
          title,
          message,
          shareLink: link || undefined,
        }),
      ),
    onSuccess: ({ data, message: m }) => {
      toast.success(m);
      qc.invalidateQueries({ queryKey: ["admin", "wa-broadcasts"] });
      if (data) onCreated(data.id);
    },
    onError,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="gap-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Send to list" required>
            <NativeSelect
              className="w-full"
              value={listId}
              onChange={(e) =>
                setListId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Choose a list…</option>
              {lists?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.members})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Template">
            <NativeSelect
              className="w-full"
              value={templateId}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : "";
                setTemplateId(id);
                const t = templates?.find((x) => x.id === id);
                if (t) {
                  setMessage(t.body);
                  if (!title) setTitle(t.name);
                }
              }}
            >
              <option value="">Write your own…</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field
          label="Share content ({{link}})"
          hint="Pick a blog post, social post or the booking page, or paste any URL."
        >
          <NativeSelect
            className="w-full"
            value=""
            onChange={(e) => e.target.value && setLink(e.target.value)}
          >
            <option value="">Pick content to share…</option>
            {shareables?.map((s) => (
              <option key={s.url} value={s.url}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
          <Input
            className="mt-2"
            placeholder="https://"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </Field>
        <Field label="Broadcast title (for your records)" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message" required>
          <Textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
        <Button
          className="w-fit bg-[#25D366] text-white hover:bg-[#1ebe5a]"
          disabled={!listId || !title || !message || create.isPending}
          onClick={() => create.mutate()}
        >
          <Send /> Prepare broadcast
        </Button>
      </Card>
      <div>
        <p className="mb-2 text-sm font-medium">Preview</p>
        <div className="rounded-2xl bg-[#efe7dd] p-4">
          <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] p-3 text-sm whitespace-pre-wrap shadow-sm">
            {renderTemplate(message || "Your message…", {
              name: "Jaskaran",
              link: link || "https://shimlawale.com",
            })}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Only opted-in members receive broadcasts. You'll get a queue to send
          each message in WhatsApp.
        </p>
      </div>
    </div>
  );
}

/* ───────────── Queue / history ───────────── */
function HistoryTab({
  openId,
  onOpen,
}: {
  openId?: number;
  onOpen: (id: number) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wa-broadcasts"],
    queryFn: () => call(api.admin.whatsapp.broadcasts.get()),
  });
  if (isLoading) return <PageLoader />;
  if (!data?.length)
    return (
      <EmptyState
        icon={<Radio className="size-8" />}
        title="No broadcasts yet"
      />
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-2">
        {data.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onOpen(b.id)}
            className={`w-full rounded-xl border bg-white p-4 text-left ${openId === b.id ? "border-primary ring-2 ring-primary/20" : ""}`}
          >
            <p className="font-semibold text-navy">{b.title}</p>
            <p className="text-xs text-muted-foreground">
              {b.listName ?? "Deleted list"} · {formatDateTime(b.createdAt)}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#25D366]"
                style={{ width: `${b.total ? (b.sent / b.total) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {b.sent}/{b.total} sent
            </p>
          </button>
        ))}
      </div>
      {openId ? (
        <BroadcastQueue id={openId} />
      ) : (
        <EmptyState title="Select a broadcast to continue sending" />
      )}
    </div>
  );
}

function BroadcastQueue({ id }: { id: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wa-broadcast", id],
    queryFn: () => call(api.admin.whatsapp.broadcasts({ id }).get()),
  });
  const mark = useMutation({
    mutationFn: ({
      rid,
      status,
    }: {
      rid: number;
      status: "sent" | "skipped" | "pending";
    }) => call(api.admin.whatsapp.recipients({ id: rid }).patch({ status })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "wa-broadcast", id] });
      qc.invalidateQueries({ queryKey: ["admin", "wa-broadcasts"] });
    },
  });
  if (isLoading || !data) return <PageLoader />;
  const next = data.recipients.find((r) => r.status === "pending");
  const sendTo = (r: (typeof data.recipients)[number]) => {
    window.open(r.link, "_blank", "noopener");
    mark.mutate({ rid: r.id, status: "sent" });
  };
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-navy">{data.title}</h2>
          {data.shareLink && (
            <a
              href={data.shareLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline"
            >
              {data.shareLink} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        {next ? (
          <Button
            className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            onClick={() => sendTo(next)}
          >
            <FaWhatsapp /> Send next: {next.name.split(" ")[0]}
          </Button>
        ) : (
          <Pill tone="green">All done 🎉</Pill>
        )}
      </div>
      <ul className="divide-y rounded-lg border">
        {data.recipients.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.message}
              </p>
            </div>
            <Pill
              tone={
                r.status === "sent"
                  ? "green"
                  : r.status === "skipped"
                    ? "gray"
                    : "amber"
              }
            >
              {titleCase(r.status)}
            </Pill>
            {r.status === "pending" ? (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => sendTo(r)}>
                  <FaWhatsapp className="text-[#25D366]" /> Open
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Skip"
                  onClick={() => mark.mutate({ rid: r.id, status: "skipped" })}
                >
                  <SkipForward />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => mark.mutate({ rid: r.id, status: "pending" })}
              >
                Undo
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ───────────── Channel ───────────── */
function ChannelTab() {
  const qc = useQueryClient();
  const { data: s } = useSiteSettings();
  const { data: shareables } = useShareables();
  const { data: templates } = useQuery({
    queryKey: ["admin", "wa-templates"],
    queryFn: () => call(api.admin.whatsapp.templates.get()),
  });
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  useEffect(() => {
    if (s?.whatsappChannelUrl) setUrl(s.whatsappChannelUrl);
  }, [s?.whatsappChannelUrl]);

  const saveUrl = useMutation({
    mutationFn: () =>
      call(api.admin.settings.patch({ whatsappChannelUrl: url || null })),
    onSuccess: () => {
      toast.success(
        "Channel link saved. It shows on the website's contact section.",
      );
      qc.invalidateQueries({ queryKey: ["public", "site-settings"] });
    },
    onError,
  });
  const post = renderTemplate(text, { name: "sangat", link });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="gap-4 p-5">
        <h2 className="font-semibold text-navy">Channel link</h2>
        <p className="text-sm text-muted-foreground">
          Your WhatsApp Channel invite link. Shown as "Join WhatsApp Channel" on
          the website.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://whatsapp.com/channel/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={() => saveUrl.mutate()} disabled={saveUrl.isPending}>
            Save
          </Button>
        </div>
        {url && (
          <Button variant="outline" asChild className="w-fit">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink /> Open channel
            </a>
          </Button>
        )}
      </Card>
      <Card className="gap-4 p-5">
        <h2 className="font-semibold text-navy">Compose a channel post</h2>
        <p className="text-sm text-muted-foreground">
          WhatsApp doesn't allow posting to channels via API. Compose here,
          copy, then paste in your channel.
        </p>
        <NativeSelect
          value=""
          onChange={(e) => {
            const t = templates?.find((x) => x.id === Number(e.target.value));
            if (t) setText(t.body);
          }}
        >
          <option value="">Start from a template…</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value=""
          onChange={(e) => e.target.value && setLink(e.target.value)}
        >
          <option value="">Attach content link…</option>
          {shareables?.map((sh) => (
            <option key={sh.url} value={sh.url}>
              {sh.label}
            </option>
          ))}
        </NativeSelect>
        <Textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your post… use {{link}} for the attached link"
        />
        {text && (
          <p className="rounded-lg bg-[#d9fdd3] p-3 text-sm whitespace-pre-wrap">
            {post}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            disabled={!text}
            onClick={async () => {
              if (await copyToClipboard(post))
                toast.success("Copied. Paste it in your channel.");
            }}
          >
            <Copy /> Copy post
          </Button>
          {url && (
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <FaWhatsapp /> Open channel
              </a>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

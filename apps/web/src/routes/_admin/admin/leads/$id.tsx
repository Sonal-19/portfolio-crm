import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Inbox,
  Mail,
  MapPin,
  MessageSquarePlus,
  Mic2,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BOOKING_STATUS_TONE,
  LEAD_STATUS_TONE,
  Pill,
  SOURCE_TONE,
  StatusPill,
} from "@/components/admin/badges";
import { FollowUpForm } from "@/components/admin/follow-up-form";
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type LeadPriority,
  type LeadStatus,
} from "@/components/admin/lead-constants";
import { WhatsappQuickSend } from "@/components/admin/whatsapp-quick-send";
import { NativeSelect } from "@/components/common/native-select";
import { ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import {
  cn,
  formatDate,
  formatDateTime,
  prettyPhone,
  relativeTime,
  titleCase,
  ymd,
} from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/leads/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const leadId = Number(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const key = ["admin", "lead", leadId];
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => call(api.admin.leads({ id: leadId }).get()),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const onError = (e: Error) => toast.error(e.message);

  const update = useMutation({
    mutationFn: (
      body: Parameters<ReturnType<typeof api.admin.leads>["patch"]>[0],
    ) => call(api.admin.leads({ id: leadId }).patch(body)),
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError,
  });
  const [note, setNote] = useState("");
  const addNote = useMutation({
    mutationFn: () =>
      call(api.admin.leads({ id: leadId }).notes.post({ body: note })),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError,
  });
  const delNote = useMutation({
    mutationFn: (noteId: number) =>
      call(api.admin.leads.notes({ noteId }).delete()),
    onSuccess: invalidate,
    onError,
  });
  const setFollowUp = useMutation({
    mutationFn: ({
      fid,
      status,
    }: {
      fid: number;
      status: "done" | "pending" | "missed";
    }) => call(api.admin["follow-ups"]({ id: fid }).patch({ status })),
    onSuccess: invalidate,
    onError,
  });
  const delFollowUp = useMutation({
    mutationFn: (fid: number) =>
      call(api.admin["follow-ups"]({ id: fid }).delete()),
    onSuccess: invalidate,
    onError,
  });
  const delLead = useMutation({
    mutationFn: () => call(api.admin.leads({ id: leadId }).delete()),
    onSuccess: () => {
      toast.success("Lead deleted");
      invalidate();
      navigate({ to: "/admin/leads" });
    },
    onError,
  });
  const [tagInput, setTagInput] = useState("");

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} />;
  const { lead, notes, followUps, activities, bookings, queries } = data;
  const pending = followUps.filter((f) => f.status === "pending");
  const past = followUps.filter((f) => f.status !== "pending");

  return (
    <>
      <Link
        to="/admin/leads"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Leads
      </Link>

      <Card className="mb-6 flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy font-display text-2xl text-gold-light">
          {lead.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl text-navy">{lead.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3.5" /> {prettyPhone(lead.phone)}
            </span>
            {lead.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" /> {lead.email}
              </span>
            )}
            {lead.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {lead.city}
              </span>
            )}
            <span>Added {formatDate(lead.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusPill value={lead.status} map={LEAD_STATUS_TONE} />
            <StatusPill value={lead.source} map={SOURCE_TONE} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`tel:+${lead.phone}`}>
              <Phone /> Call
            </a>
          </Button>
          <WhatsappQuickSend
            leadId={lead.id}
            name={lead.name}
            phone={lead.phone}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr_340px]">
        {/* Profile */}
        <div className="space-y-6">
          <Card className="gap-4 p-5">
            <h2 className="font-semibold text-navy">Pipeline</h2>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Status</span>
              <NativeSelect
                className="w-full"
                value={lead.status}
                onChange={(e) =>
                  update.mutate({ status: e.target.value as LeadStatus })
                }
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Priority</span>
              <NativeSelect
                className="w-full"
                value={lead.priority}
                onChange={(e) =>
                  update.mutate({ priority: e.target.value as LeadPriority })
                }
              >
                {LEAD_PRIORITIES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((t) => (
                  <Pill key={t} className="gap-1">
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove ${t}`}
                      onClick={() =>
                        update.mutate({
                          tags: lead.tags.filter((x) => x !== t),
                        })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Pill>
                ))}
              </div>
              <form
                className="flex gap-2 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = tagInput.trim().toLowerCase();
                  if (t && !lead.tags.includes(t))
                    update.mutate({ tags: [...lead.tags, t] });
                  setTagInput("");
                }}
              >
                <Input
                  className="h-8"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <Button size="sm" variant="outline" type="submit">
                  Add
                </Button>
              </form>
            </div>
            <label className="flex items-center justify-between text-sm">
              <span>WhatsApp broadcasts opt-in</span>
              <Switch
                checked={lead.whatsappOptIn}
                onCheckedChange={(v) => update.mutate({ whatsappOptIn: v })}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Last contacted:{" "}
              {lead.lastContactedAt
                ? relativeTime(lead.lastContactedAt)
                : "never"}
            </p>
          </Card>

          <Card className="gap-3 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <Mic2 className="size-4" /> Studio requests
            </h2>
            {bookings.length === 0 && (
              <p className="text-sm text-muted-foreground">None</p>
            )}
            {bookings.map((b) => (
              <Link
                key={b.id}
                to="/admin/bookings"
                search={{ id: b.id }}
                className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    #{b.id} {b.projectTitle ?? "Session"}
                  </span>
                  <StatusPill value={b.status} map={BOOKING_STATUS_TONE} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.scheduledStart
                    ? `Scheduled ${formatDateTime(b.scheduledStart)}`
                    : `Preferred ${formatDate(`${ymd(b.preferredDate)}T00:00:00+05:30`)} ${b.preferredStartTime}`}
                </p>
              </Link>
            ))}
            <h2 className="flex items-center gap-2 pt-2 font-semibold text-navy">
              <Inbox className="size-4" /> Queries
            </h2>
            {queries.length === 0 && (
              <p className="text-sm text-muted-foreground">None</p>
            )}
            {queries.map((q) => (
              <div key={q.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{q.subject}</p>
                <p className="mt-1 text-muted-foreground">{q.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(q.createdAt)}
                </p>
              </div>
            ))}
          </Card>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() =>
              confirm(`Delete ${lead.name} and all their history?`) &&
              delLead.mutate()
            }
          >
            <Trash2 /> Delete lead
          </Button>
        </div>

        {/* Remarks & follow-ups */}
        <div className="space-y-6">
          <Card className="gap-4 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <Clock className="size-4" /> Follow-ups
            </h2>
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pending follow-ups.
              </p>
            )}
            <ul className="space-y-2">
              {pending.map((f) => {
                const overdue = new Date(f.dueAt).getTime() < Date.now();
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                      overdue && "border-red-200 bg-red-50/50",
                    )}
                  >
                    <button
                      type="button"
                      title="Mark done"
                      onClick={() =>
                        setFollowUp.mutate({ fid: f.id, status: "done" })
                      }
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="size-3" />
                    </button>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium">{f.title}</p>
                      <p
                        className={cn(
                          "text-xs",
                          overdue ? "text-red-600" : "text-muted-foreground",
                        )}
                      >
                        {titleCase(f.type)} · {formatDateTime(f.dueAt)} (
                        {relativeTime(f.dueAt)})
                      </p>
                      {f.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => delFollowUp.mutate(f.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="rounded-lg bg-muted/50 p-4">
              <FollowUpForm leadId={lead.id} />
            </div>
            {past.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  {past.length} completed / missed
                </summary>
                <ul className="mt-2 space-y-1">
                  {past.map((f) => (
                    <li
                      key={f.id}
                      className="flex justify-between gap-2 text-muted-foreground"
                    >
                      <span
                        className={cn(f.status === "done" && "line-through")}
                      >
                        {f.title}
                      </span>
                      <span className="shrink-0 text-xs">
                        {formatDate(f.completedAt ?? f.dueAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Card>

          <Card className="gap-4 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <MessageSquarePlus className="size-4" /> Remarks
            </h2>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) addNote.mutate();
              }}
            >
              <Textarea
                rows={3}
                placeholder="Add a remark about this conversation…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                size="sm"
                type="submit"
                disabled={!note.trim() || addNote.isPending}
              >
                Save remark
              </Button>
            </form>
            <ul className="space-y-3">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="group rounded-lg border-l-4 border-gold bg-cream/60 p-3 text-sm"
                >
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDateTime(n.createdAt)}</span>
                    <button
                      type="button"
                      className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                      onClick={() => delNote.mutate(n.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="h-fit gap-3 p-5">
          <h2 className="font-semibold text-navy">Activity timeline</h2>
          <ol className="relative space-y-4 border-l pl-5">
            {activities.map((a) => (
              <li key={a.id} className="relative text-sm">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-white bg-primary ring-1 ring-primary/30" />
                <p>{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {titleCase(a.kind)} · {relativeTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  Mic2,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import {
  BOOKING_STATUS_TONE,
  Pill,
  StatusPill,
} from "@/components/admin/badges";
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from "@/components/admin/lead-constants";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import {
  EmptyState,
  ErrorState,
  PageLoader,
  Spinner,
} from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, call, callMsg } from "@/lib/api";
import {
  formatClock,
  formatDate,
  formatDateTime,
  isoToIstLocal,
  istLocalToIso,
  prettyPhone,
  titleCase,
  ymd,
} from "@/lib/utils";

type SearchParams = { status?: BookingStatus; id?: number };

export const Route = createFileRoute("/_admin/admin/bookings")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    status: BOOKING_STATUSES.includes(s.status as BookingStatus)
      ? (s.status as BookingStatus)
      : undefined,
    id: Number(s.id) > 0 ? Number(s.id) : undefined,
  }),
  component: BookingsPage,
});

const prefDate = (d: string | Date) => formatDate(`${ymd(d)}T00:00:00+05:30`);

function BookingsPage() {
  const { status, id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "bookings", status, search],
    queryFn: () =>
      call(
        api.admin.bookings.get({
          query: { status, search: search || undefined },
        }),
      ),
  });

  return (
    <>
      <PageHeader
        title="Studio requests"
        description="Free recording & video-shoot applications. Review, schedule and track each one."
      />
      <Card className="mb-4 flex-row flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, phone, project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={!status ? "secondary" : "ghost"}
            onClick={() =>
              navigate({ search: (p) => ({ ...p, status: undefined }) })
            }
          >
            All
          </Button>
          {BOOKING_STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "secondary" : "ghost"}
              onClick={() => navigate({ search: (p) => ({ ...p, status: s }) })}
            >
              {titleCase(s)}
            </Button>
          ))}
        </div>
      </Card>
      {isLoading ? (
        <PageLoader />
      ) : error || !data ? (
        <ErrorState error={error} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Mic2 className="size-8" />}
          title="No studio requests here"
        />
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Preferred / scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ search: (p) => ({ ...p, id: b.id }) })
                  }
                >
                  <TableCell className="text-muted-foreground">
                    {b.id}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-navy">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {titleCase(b.artistType)}
                      {b.city ? ` · ${b.city}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{b.packageName ?? "Custom session"}</p>
                    <p className="max-w-60 truncate text-xs text-muted-foreground">
                      {b.projectTitle}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.scheduledStart ? (
                      <span className="font-medium text-orange-700">
                        {formatDateTime(b.scheduledStart)}
                      </span>
                    ) : (
                      <span>
                        {prefDate(b.preferredDate)},{" "}
                        {formatClock(b.preferredStartTime)}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {b.durationHours}h
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusPill value={b.status} map={BOOKING_STATUS_TONE} />
                  </TableCell>
                  <TableCell>
                    <Eye className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <BookingDialog
        id={id}
        onClose={() => navigate({ search: (p) => ({ ...p, id: undefined }) })}
      />
    </>
  );
}

function BookingDialog({ id, onClose }: { id?: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: b, isLoading } = useQuery({
    queryKey: ["admin", "booking", id],
    queryFn: () => call(api.admin.bookings({ id: id as number }).get()),
    enabled: !!id,
  });
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [remark, setRemark] = useState("");

  const setStatus = useMutation({
    mutationFn: (status: BookingStatus) =>
      callMsg(
        api.admin.bookings({ id: id as number }).status.patch({
          status,
          scheduledStart:
            status === "scheduled"
              ? istLocalToIso(
                  when ||
                    `${b ? ymd(b.preferredDate) : ""}T${b?.preferredStartTime}`,
                )
              : undefined,
          durationHours: hours ?? undefined,
          adminRemark: remark || undefined,
        }),
      ),
    onSuccess: ({ message }) => {
      toast.success(message);
      setRemark("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e.message, { duration: 6000 }),
  });

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {isLoading || !b ? (
          <div className="grid h-40 place-items-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Request #{b.id}: {b.name}{" "}
                <StatusPill value={b.status} map={BOOKING_STATUS_TONE} />
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <dl className="space-y-2">
                <Row k="Phone">{prettyPhone(b.phone)}</Row>
                {b.email && <Row k="Email">{b.email}</Row>}
                <Row k="Artist">
                  {titleCase(b.artistType)}
                  {b.city ? `, ${b.city}` : ""}
                </Row>
                {b.experience && <Row k="Experience">{b.experience}</Row>}
                {b.sampleLink && (
                  <Row k="Sample">
                    <a
                      href={b.sampleLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline"
                    >
                      Open <ExternalLink className="size-3" />
                    </a>
                  </Row>
                )}
                {b.leadId && (
                  <Row k="Lead">
                    <Link
                      to="/admin/leads/$id"
                      params={{ id: String(b.leadId) }}
                      className="text-primary underline"
                    >
                      View lead & timeline
                    </Link>
                  </Row>
                )}
              </dl>
              <dl className="space-y-2">
                <Row k="Session">
                  {b.packageName ?? "Custom session"} · {b.durationHours}h
                </Row>
                {b.projectTitle && <Row k="Project">{b.projectTitle}</Row>}
                {b.instruments.length > 0 && (
                  <Row k="Instruments">
                    {b.instruments.map((i) => i.name).join(", ")}
                  </Row>
                )}
                {b.engineerName && <Row k="Engineer">{b.engineerName}</Row>}
                {b.addons.length > 0 && (
                  <Row k="Extras">{b.addons.map((a) => a.name).join(", ")}</Row>
                )}
                <Row k="Preferred">
                  {prefDate(b.preferredDate)},{" "}
                  {formatClock(b.preferredStartTime)}
                </Row>
                {b.scheduledStart && (
                  <Row k="Scheduled">
                    <Pill tone="orange">
                      {formatDateTime(b.scheduledStart)} –{" "}
                      {formatClock(isoToIstLocal(b.scheduledEnd).slice(11))}
                    </Pill>
                  </Row>
                )}
              </dl>
            </div>
            {(b.about || b.notes) && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                {b.about && (
                  <p>
                    <span className="font-medium">About: </span>
                    {b.about}
                  </p>
                )}
                {b.notes && (
                  <p>
                    <span className="font-medium">Notes: </span>
                    {b.notes}
                  </p>
                )}
              </div>
            )}
            {b.adminRemark && (
              <p className="rounded-lg border-l-4 border-gold bg-cream p-3 text-sm">
                <span className="font-medium">Your remark: </span>
                {b.adminRemark}
              </p>
            )}

            <div className="space-y-4 rounded-xl border p-4">
              <p className="font-semibold text-navy">Review</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Field label="Schedule at (IST)">
                  <Input
                    type="datetime-local"
                    value={
                      when ||
                      isoToIstLocal(b.scheduledStart) ||
                      `${ymd(b.preferredDate)}T${b.preferredStartTime}`
                    }
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </Field>
                <Field label="Hours">
                  <NativeSelect
                    className="w-full"
                    value={hours ?? b.durationHours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field label="Remark (optional, saved on the request & timeline)">
                <Textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {b.status === "pending" && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus.mutate("under_review")}
                    disabled={setStatus.isPending}
                  >
                    <Eye /> Mark under review
                  </Button>
                )}
                {["pending", "under_review"].includes(b.status) && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus.mutate("approved")}
                    disabled={setStatus.isPending}
                  >
                    <CheckCircle2 /> Approve
                  </Button>
                )}
                {!["completed", "rejected", "cancelled"].includes(b.status) && (
                  <Button
                    onClick={() => setStatus.mutate("scheduled")}
                    disabled={setStatus.isPending}
                  >
                    <CalendarCheck />{" "}
                    {b.status === "scheduled" ? "Reschedule" : "Schedule"}
                  </Button>
                )}
                {b.status === "scheduled" && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setStatus.mutate("completed")}
                    disabled={setStatus.isPending}
                  >
                    <CheckCircle2 /> Mark recorded
                  </Button>
                )}
                {["pending", "under_review", "approved"].includes(b.status) && (
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setStatus.mutate("rejected")}
                    disabled={setStatus.isPending}
                  >
                    <XCircle /> Reject
                  </Button>
                )}
                {["approved", "scheduled"].includes(b.status) && (
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setStatus.mutate("cancelled")}
                    disabled={setStatus.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

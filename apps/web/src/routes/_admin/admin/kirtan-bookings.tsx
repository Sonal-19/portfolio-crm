import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  HandHeart,
  MapPin,
  Phone,
  PhoneCall,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import {
  KIRTAN_STATUS_TONE,
  Pill,
  StatusPill,
} from "@/components/admin/badges";
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
  eventLabel,
  KIRTAN_EVENT_TYPES,
  KIRTAN_STATUSES,
  type KirtanEventType,
  type KirtanStatus,
  languageLabel,
  requirementLabel,
  sangatLabel,
  venueLabel,
} from "@/lib/kirtan";
import {
  formatClock,
  formatDate,
  formatDateTime,
  isoToIstLocal,
  istLocalToIso,
  prettyPhone,
  titleCase,
  waLink,
  ymd,
} from "@/lib/utils";

type SearchParams = {
  status?: KirtanStatus;
  eventType?: KirtanEventType;
  id?: number;
};

const EVENT_VALUES = KIRTAN_EVENT_TYPES.map(([v]) => v) as string[];

export const Route = createFileRoute("/_admin/admin/kirtan-bookings")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    status: KIRTAN_STATUSES.includes(s.status as KirtanStatus)
      ? (s.status as KirtanStatus)
      : undefined,
    eventType: EVENT_VALUES.includes(s.eventType as string)
      ? (s.eventType as KirtanEventType)
      : undefined,
    id: Number(s.id) > 0 ? Number(s.id) : undefined,
  }),
  component: KirtanBookingsPage,
});

const day = (d: string | Date) => formatDate(`${ymd(d)}T00:00:00+05:30`);

function When({
  b,
}: {
  b: {
    scheduledStart: Date | string | null;
    eventDate: string | Date;
    startTime: string;
    durationHours: number;
  };
}) {
  return b.scheduledStart ? (
    <span className="font-medium text-orange-700">
      {formatDateTime(b.scheduledStart)}
    </span>
  ) : (
    <span>
      {day(b.eventDate)}, {formatClock(b.startTime)}
    </span>
  );
}

function KirtanBookingsPage() {
  const { status, eventType, id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "kirtan-bookings", status, eventType, search],
    queryFn: () =>
      call(
        api.admin["kirtan-bookings"].get({
          query: { status, eventType, search: search || undefined },
        }),
      ),
  });
  const open = (bid: number) =>
    navigate({ search: (p) => ({ ...p, id: bid }) });

  return (
    <>
      <PageHeader
        title="Kirtan bookings"
        description="Requests from the Book Kirtan form. Call the family or committee, confirm the program and track it to completion."
      />
      <Card className="mb-4 gap-3 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, phone, city, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <NativeSelect
            className="sm:w-56"
            value={eventType ?? ""}
            onChange={(e) =>
              navigate({
                search: (p) => ({
                  ...p,
                  eventType: (e.target.value || undefined) as
                    | KirtanEventType
                    | undefined,
                }),
              })
            }
          >
            <option value="">All programs</option>
            {KIRTAN_EVENT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          <Button
            size="sm"
            variant={!status ? "secondary" : "ghost"}
            onClick={() =>
              navigate({ search: (p) => ({ ...p, status: undefined }) })
            }
          >
            All
          </Button>
          {KIRTAN_STATUSES.map((s) => (
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
          icon={<HandHeart className="size-8" />}
          title="No kirtan bookings here"
        />
      ) : (
        <>
          {/* phones: cards */}
          <div className="space-y-3 md:hidden">
            {data.map((b) => (
              <Card
                key={b.id}
                className="cursor-pointer gap-2 p-4"
                onClick={() => open(b.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{b.id} · {eventLabel(b.eventType)}
                    </p>
                  </div>
                  <StatusPill value={b.status} map={KIRTAN_STATUS_TONE} />
                </div>
                <p className="line-clamp-1 text-sm">{b.subject}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="size-3.5" /> <When b={b} />
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {b.city}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* tablet & desktop: table */}
          <Card className="hidden gap-0 overflow-hidden p-0 md:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Date / time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer"
                    onClick={() => open(b.id)}
                  >
                    <TableCell className="text-muted-foreground">
                      {b.id}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-navy">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {prettyPhone(b.phone)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{eventLabel(b.eventType)}</p>
                      <p className="max-w-60 truncate text-xs text-muted-foreground">
                        {b.subject}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <When b={b} />
                      <p className="text-xs text-muted-foreground">
                        {b.durationHours}h
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{b.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {venueLabel(b.venueType)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusPill value={b.status} map={KIRTAN_STATUS_TONE} />
                    </TableCell>
                    <TableCell>
                      <Eye className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
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
    queryKey: ["admin", "kirtan-booking", id],
    queryFn: () =>
      call(api.admin["kirtan-bookings"]({ id: id as number }).get()),
    enabled: !!id,
  });
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [remark, setRemark] = useState("");

  const setStatus = useMutation({
    mutationFn: (status: KirtanStatus) =>
      callMsg(
        api.admin["kirtan-bookings"]({ id: id as number }).status.patch({
          status,
          scheduledStart:
            status === "confirmed"
              ? istLocalToIso(
                  when ||
                    isoToIstLocal(b?.scheduledStart) ||
                    `${b ? ymd(b.eventDate) : ""}T${b?.startTime}`,
                )
              : undefined,
          durationHours: hours ?? undefined,
          adminRemark: remark || undefined,
        }),
      ),
    onSuccess: ({ data, message }) => {
      if (data?.warning) toast.warning(data.warning, { duration: 8000 });
      else toast.success(message);
      setRemark("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e.message, { duration: 6000 }),
  });

  const act = (status: KirtanStatus) => {
    if (status === "declined" && !remark.trim()) {
      toast.error("Add a remark explaining why it was declined");
      return;
    }
    setStatus.mutate(status);
  };

  const closed = b && ["completed", "declined", "cancelled"].includes(b.status);
  const wa = b?.whatsapp || b?.phone;

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {isLoading || !b ? (
          <div className="grid h-40 place-items-center">
            <Spinner />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-left">
                #{b.id} · {b.name}
                <StatusPill value={b.status} map={KIRTAN_STATUS_TONE} />
              </DialogTitle>
              <p className="text-left text-sm text-muted-foreground">
                {eventLabel(b.eventType)} — {b.subject}
              </p>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={`tel:+${b.phone}`}>
                  <PhoneCall /> Call
                </a>
              </Button>
              {wa && (
                <Button
                  asChild
                  size="sm"
                  className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                >
                  <a
                    href={waLink(
                      wa,
                      `Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh ${b.name.split(" ")[0]} ji 🙏 Thank you for your kirtan request for ${day(b.eventDate)}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>
                </Button>
              )}
              {b.leadId && (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/admin/leads/$id" params={{ id: String(b.leadId) }}>
                    View lead & timeline
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <dl className="space-y-2">
                <Row k="Mobile">{prettyPhone(b.phone)}</Row>
                {b.whatsapp && b.whatsapp !== b.phone && (
                  <Row k="WhatsApp">{prettyPhone(b.whatsapp)}</Row>
                )}
                {b.email && <Row k="Email">{b.email}</Row>}
                <Row k="Language">{languageLabel(b.language)}</Row>
                {b.expectedSangat && (
                  <Row k="Sangat">{sangatLabel(b.expectedSangat)}</Row>
                )}
                {b.referralSource && (
                  <Row k="Heard via">{b.referralSource}</Row>
                )}
              </dl>
              <dl className="space-y-2">
                <Row k="Requested">
                  {day(b.eventDate)}, {formatClock(b.startTime)} ·{" "}
                  {b.durationHours}h
                </Row>
                {b.alternateDate && (
                  <Row k="Alternate">{day(b.alternateDate)}</Row>
                )}
                {b.scheduledStart && (
                  <Row k="Confirmed">
                    <Pill tone="orange">
                      {formatDateTime(b.scheduledStart)} –{" "}
                      {formatClock(isoToIstLocal(b.scheduledEnd).slice(11))}
                    </Pill>
                  </Row>
                )}
                <Row k="Venue">
                  {venueLabel(b.venueType)}
                  {b.venueName ? `: ${b.venueName}` : ""}
                </Row>
                <Row k="Address">
                  {[b.address, b.city, b.state, b.pincode]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.venueName, b.address, b.city, b.state].filter(Boolean).join(", "))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Map
                  </a>
                </Row>
              </dl>
            </div>
            {b.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {b.requirements.map((r) => (
                  <Pill key={r} tone="navy">
                    {requirementLabel(r)}
                  </Pill>
                ))}
              </div>
            )}
            {b.message && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="font-medium">Message: </span>
                {b.message}
              </p>
            )}
            {b.adminRemark && (
              <p className="rounded-lg border-l-4 border-gold bg-cream p-3 text-sm">
                <span className="font-medium">Your remark: </span>
                {b.adminRemark}
              </p>
            )}

            <div className="space-y-4 rounded-xl border p-4">
              <p className="font-semibold text-navy">Update</p>
              {!closed && (
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <Field label="Program date & time (IST)">
                    <Input
                      type="datetime-local"
                      value={
                        when ||
                        isoToIstLocal(b.scheduledStart) ||
                        `${ymd(b.eventDate)}T${b.startTime}`
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
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              )}
              <Field label="Remark (saved on the booking & lead timeline)">
                <Textarea
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {b.status === "new" && (
                  <Button
                    variant="outline"
                    onClick={() => act("contacted")}
                    disabled={setStatus.isPending}
                  >
                    <Phone /> Mark contacted
                  </Button>
                )}
                {!closed && (
                  <Button
                    onClick={() => act("confirmed")}
                    disabled={setStatus.isPending}
                  >
                    <CalendarCheck />{" "}
                    {b.status === "confirmed"
                      ? "Reschedule"
                      : "Confirm & schedule"}
                  </Button>
                )}
                {b.status === "confirmed" && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => act("completed")}
                    disabled={setStatus.isPending}
                  >
                    <CheckCircle2 /> Mark completed
                  </Button>
                )}
                {["new", "contacted"].includes(b.status) && (
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => act("declined")}
                    disabled={setStatus.isPending}
                  >
                    <XCircle /> Decline
                  </Button>
                )}
                {!closed && (
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => act("cancelled")}
                    disabled={setStatus.isPending}
                  >
                    Cancelled by host
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

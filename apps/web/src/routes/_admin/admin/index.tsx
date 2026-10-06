import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  HandHeart,
  Inbox,
  Phone,
  TrendingUp,
  UserPlus,
  type Users,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { PageHeader } from "@/components/admin/admin-shell";
import { LEAD_STATUS_TONE, Pill } from "@/components/admin/badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import { Card } from "@/components/ui/card";
import { api, call } from "@/lib/api";
import { eventLabel } from "@/lib/kirtan";
import {
  cn,
  formatDateTime,
  formatTime,
  relativeTime,
  titleCase,
  waLink,
} from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/")({
  component: Dashboard,
});

const SOURCE_COLOR: Record<string, string> = {
  kirtan_booking: "#f08a24",
  query: "#3b82f6",
  whatsapp: "#22c55e",
  event: "#8b5cf6",
  manual: "#94a3b8",
};

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone: string;
  to?: string;
}) {
  const body = (
    <Card className="h-full flex-col items-start gap-2.5 p-3.5 transition hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl sm:size-11",
          tone,
        )}
      >
        <Icon className="size-4.5 sm:size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight text-navy sm:text-2xl">
          {value}
        </p>
        <p className="text-xs leading-snug text-muted-foreground sm:truncate">
          {label}
        </p>
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => call(api.admin.dashboard.summary.get()),
    refetchInterval: 60_000,
  });
  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} />;
  const { kpis } = data;
  const sourceTotal = data.bySource.reduce((s, r) => s + r.n, 0) || 1;
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Sat Sri Akal ji 🙏"
        description={new Date().toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label="New leads this week"
          value={kpis.newLeadsWeek}
          icon={UserPlus}
          tone="bg-blue-50 text-blue-600"
          to="/admin/leads"
        />
        <Kpi
          label="New kirtan requests"
          value={kpis.newKirtanRequests}
          icon={HandHeart}
          tone="bg-orange-50 text-orange-600"
          to="/admin/kirtan-bookings"
        />
        <Kpi
          label="Follow-ups today"
          value={kpis.followUpsToday}
          icon={CalendarClock}
          tone="bg-amber-50 text-amber-600"
          to="/admin/calendar"
        />
        <Kpi
          label="Overdue follow-ups"
          value={kpis.followUpsOverdue}
          icon={AlarmClock}
          tone="bg-red-50 text-red-600"
          to="/admin/calendar"
        />
        <Kpi
          label="Unread queries"
          value={kpis.unreadQueries}
          icon={Inbox}
          tone="bg-violet-50 text-violet-600"
          to="/admin/queries"
        />
        <Kpi
          label="Programs this month"
          value={kpis.programsThisMonth}
          icon={TrendingUp}
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-3">
        {/* Follow-ups due */}
        <Card className="gap-0 p-0 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="font-semibold text-navy">Due today & overdue</h2>
            <Link
              to="/admin/calendar"
              className="text-sm text-primary hover:underline"
            >
              Calendar
            </Link>
          </div>
          {data.todaysFollowUps.length === 0 ? (
            <EmptyState title="All caught up 🙏" className="m-5" />
          ) : (
            <ul className="divide-y">
              {data.todaysFollowUps.map((f) => {
                const overdue = new Date(f.dueAt).getTime() < now;
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-5"
                  >
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                      <div className="min-w-0 sm:flex-1">
                        <Link
                          to="/admin/leads/$id"
                          params={{ id: String(f.leadId) }}
                          className="line-clamp-2 font-medium text-navy hover:text-primary"
                        >
                          {f.leadName}
                        </Link>
                        <p className="truncate text-sm text-muted-foreground">
                          {f.title}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-0 sm:shrink-0">
                        <Pill tone={overdue ? "red" : "amber"}>
                          {overdue
                            ? `Overdue · ${relativeTime(f.dueAt)}`
                            : formatTime(f.dueAt)}
                        </Pill>
                        <Pill tone="navy">{titleCase(f.type)}</Pill>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={`tel:+${f.leadPhone}`}
                        className="grid size-9 place-items-center rounded-md border hover:bg-muted sm:size-8"
                        title="Call"
                      >
                        <Phone className="size-4" />
                      </a>
                      <a
                        href={waLink(
                          f.leadPhone,
                          `Sat Sri Akal ${f.leadName.split(" ")[0]} ji 🙏`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-9 place-items-center rounded-md border text-[#25D366] hover:bg-muted sm:size-8"
                        title="WhatsApp"
                      >
                        <FaWhatsapp className="size-4" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Lead sources */}
        <Card className="p-4 sm:p-5">
          <h2 className="font-semibold text-navy">Leads by source</h2>
          <p className="-mt-4 text-xs text-muted-foreground">
            {kpis.totalLeads} total · {kpis.completedRate}% completed
          </p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {data.bySource.map((s) => (
              <div
                key={s.key}
                style={{
                  width: `${(s.n / sourceTotal) * 100}%`,
                  background: SOURCE_COLOR[s.key],
                }}
                title={`${s.key}: ${s.n}`}
              />
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            {[...data.bySource]
              .sort((a, b) => b.n - a.n)
              .map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: SOURCE_COLOR[s.key] }}
                  />
                  <span className="flex-1">{titleCase(s.key)}</span>
                  <span className="font-medium tabular-nums">{s.n}</span>
                </li>
              ))}
          </ul>
          <h3 className="pt-2 font-semibold text-navy">Pipeline</h3>
          <div className="flex flex-wrap gap-2">
            {data.byStatus.map((s) => (
              <Link key={s.key} to="/admin/leads" search={{ status: s.key }}>
                <Pill tone={LEAD_STATUS_TONE[s.key]}>
                  {titleCase(s.key)} · {s.n}
                </Pill>
              </Link>
            ))}
          </div>
        </Card>

        {/* Upcoming programs */}
        <Card className="gap-0 p-0 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="font-semibold text-navy">
              Upcoming kirtan programs
            </h2>
            <Link
              to="/admin/kirtan-bookings"
              className="text-sm text-primary hover:underline"
            >
              All bookings
            </Link>
          </div>
          {data.upcomingPrograms.length === 0 ? (
            <EmptyState title="No programs confirmed" className="m-5" />
          ) : (
            <ul className="divide-y">
              {data.upcomingPrograms.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/admin/kirtan-bookings"
                    search={{ id: b.id }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 sm:px-5"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                      <HandHeart className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy">{b.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {eventLabel(b.eventType)} · {b.city}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-navy sm:hidden">
                        {formatDateTime(b.scheduledStart)}
                      </p>
                    </div>
                    <p className="hidden shrink-0 text-right text-sm sm:block">
                      {formatDateTime(b.scheduledStart)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Activity */}
        <Card className="gap-0 p-0">
          <div className="border-b px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="font-semibold text-navy">Recent activity</h2>
          </div>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm sm:px-5">
                <Link
                  to="/admin/leads/$id"
                  params={{ id: String(a.leadId) }}
                  className="font-medium text-navy hover:text-primary"
                >
                  {a.leadName}
                </Link>
                <p className="text-muted-foreground">{a.message}</p>
                <p className="text-xs text-muted-foreground/70">
                  {relativeTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/leads"
            className="flex items-center justify-center gap-1 border-t py-3 text-sm text-primary"
          >
            All leads <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}

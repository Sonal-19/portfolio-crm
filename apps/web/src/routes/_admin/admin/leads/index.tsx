import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Kanban, List, Phone, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { AddLeadDialog } from "@/components/admin/add-lead-dialog";
import { PageHeader } from "@/components/admin/admin-shell";
import {
  LEAD_STATUS_TONE,
  Pill,
  PRIORITY_TONE,
  SOURCE_TONE,
  StatusPill,
} from "@/components/admin/badges";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  type LeadSource,
  type LeadStatus,
} from "@/components/admin/lead-constants";
import { NativeSelect } from "@/components/common/native-select";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, call } from "@/lib/api";
import {
  cn,
  formatDate,
  prettyPhone,
  relativeTime,
  titleCase,
  waLink,
} from "@/lib/utils";

type SearchParams = {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  tag?: string;
  page?: number;
  view?: "table" | "board";
};

export const Route = createFileRoute("/_admin/admin/leads/")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    search: typeof s.search === "string" && s.search ? s.search : undefined,
    status: LEAD_STATUSES.includes(s.status as LeadStatus)
      ? (s.status as LeadStatus)
      : undefined,
    source: LEAD_SOURCES.includes(s.source as LeadSource)
      ? (s.source as LeadSource)
      : undefined,
    tag: typeof s.tag === "string" && s.tag ? s.tag : undefined,
    page: Number(s.page) > 1 ? Number(s.page) : undefined,
    view: s.view === "board" ? "board" : undefined,
  }),
  component: LeadsPage,
});

async function fetchLeads(q: SearchParams, pageSize: number) {
  return call(
    api.admin.leads.get({
      query: {
        search: q.search,
        status: q.status,
        source: q.source,
        tag: q.tag,
        page: String(q.page ?? 1),
        pageSize: String(pageSize),
      },
    }),
  );
}
type LeadRow = NonNullable<
  Awaited<ReturnType<typeof fetchLeads>>
>["rows"][number];

function LeadsPage() {
  const q = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [text, setText] = useState(q.search ?? "");
  const board = q.view === "board";
  const pageSize = board ? 100 : 20;

  useEffect(() => {
    const t = setTimeout(() => {
      if ((q.search ?? "") !== text)
        navigate({
          search: (p) => ({ ...p, search: text || undefined, page: undefined }),
        });
    }, 350);
    return () => clearTimeout(t);
  }, [text, q.search, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "leads", q, pageSize],
    queryFn: () => fetchLeads(q, pageSize),
    placeholderData: keepPreviousData,
  });
  const { data: tags } = useQuery({
    queryKey: ["admin", "lead-tags"],
    queryFn: () => call(api.admin.leads.tags.get()),
  });

  const exportUrl = `/api/admin/leads/export?${new URLSearchParams(
    Object.entries({
      search: q.search,
      status: q.status,
      source: q.source,
      tag: q.tag,
    }).filter(([, v]) => v) as [string, string][],
  )}`;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone who booked the studio, sent a query, or was added by you."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={exportUrl}>
                <Download /> Export CSV
              </a>
            </Button>
            <AddLeadDialog />
          </>
        }
      />
      <Card className="mb-4 flex-row flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, phone, email, city…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <NativeSelect
          value={q.status ?? ""}
          onChange={(e) =>
            navigate({
              search: (p) => ({
                ...p,
                status: (e.target.value || undefined) as LeadStatus | undefined,
                page: undefined,
              }),
            })
          }
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={q.source ?? ""}
          onChange={(e) =>
            navigate({
              search: (p) => ({
                ...p,
                source: (e.target.value || undefined) as LeadSource | undefined,
                page: undefined,
              }),
            })
          }
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={q.tag ?? ""}
          onChange={(e) =>
            navigate({
              search: (p) => ({
                ...p,
                tag: e.target.value || undefined,
                page: undefined,
              }),
            })
          }
        >
          <option value="">All tags</option>
          {tags?.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </NativeSelect>
        <div className="flex rounded-md border p-0.5">
          <Button
            size="sm"
            variant={board ? "ghost" : "secondary"}
            onClick={() =>
              navigate({ search: (p) => ({ ...p, view: undefined }) })
            }
          >
            <List /> Table
          </Button>
          <Button
            size="sm"
            variant={board ? "secondary" : "ghost"}
            onClick={() =>
              navigate({
                search: (p) => ({ ...p, view: "board", page: undefined }),
              })
            }
          >
            <Kanban /> Board
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <PageLoader />
      ) : error || !data ? (
        <ErrorState error={error} />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No leads match these filters" />
      ) : board ? (
        <LeadBoard rows={data.rows} />
      ) : (
        <LeadTable
          rows={data.rows}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          onPage={(page) =>
            navigate({
              search: (p) => ({ ...p, page: page > 1 ? page : undefined }),
            })
          }
        />
      )}
    </>
  );
}

function ContactButtons({ phone, name }: { phone: string; name: string }) {
  return (
    <div className="flex gap-1">
      <a
        href={`tel:+${phone}`}
        onClick={(e) => e.stopPropagation()}
        className="grid size-8 place-items-center rounded-md border bg-white hover:bg-muted"
        title="Call"
      >
        <Phone className="size-3.5" />
      </a>
      <a
        href={waLink(phone, `Sat Sri Akal ${name.split(" ")[0]} ji 🙏`)}
        onClick={(e) => e.stopPropagation()}
        target="_blank"
        rel="noreferrer"
        className="grid size-8 place-items-center rounded-md border bg-white text-[#25D366] hover:bg-muted"
        title="WhatsApp"
      >
        <FaWhatsapp className="size-3.5" />
      </a>
    </div>
  );
}

function LeadTable({
  rows,
  total,
  page,
  pageSize,
  onPage,
}: {
  rows: LeadRow[];
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<LeadRow>[]>(
    () => [
      {
        header: "Lead",
        cell: ({ row: { original: l } }) => (
          <div className="min-w-40">
            <p className="font-medium text-navy">{l.name}</p>
            <p className="text-xs text-muted-foreground">
              {prettyPhone(l.phone)}
              {l.city ? ` · ${l.city}` : ""}
            </p>
          </div>
        ),
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <StatusPill value={row.original.status} map={LEAD_STATUS_TONE} />
        ),
      },
      {
        header: "Source",
        cell: ({ row }) => (
          <StatusPill value={row.original.source} map={SOURCE_TONE} />
        ),
      },
      {
        header: "Priority",
        cell: ({ row }) => (
          <StatusPill value={row.original.priority} map={PRIORITY_TONE} />
        ),
      },
      {
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex max-w-56 flex-wrap gap-1">
            {row.original.tags.slice(0, 3).map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        ),
      },
      {
        header: "Next follow-up",
        cell: ({ row: { original: l } }) =>
          l.nextFollowUp ? (
            <span
              className={cn(
                "text-sm",
                new Date(l.nextFollowUp).getTime() < Date.now() &&
                  "font-medium text-red-600",
              )}
            >
              {relativeTime(l.nextFollowUp)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        header: "Added",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ContactButtons phone={row.original.phone} name={row.original.name} />
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() =>
                navigate({
                  to: "/admin/leads/$id",
                  params: { id: String(row.original.id) },
                })
              }
            >
              {row.getVisibleCells().map((c) => (
                <TableCell key={c.id}>
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <span>
          {total} lead{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

function LeadBoard({ rows }: { rows: LeadRow[] }) {
  const qc = useQueryClient();
  const move = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      call(api.admin.leads({ id }).patch({ status })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4">
      <div className="grid min-w-[1100px] grid-cols-6 gap-3">
        {LEAD_STATUSES.map((status) => {
          const col = rows.filter((r) => r.status === status);
          return (
            <div
              key={status}
              className="rounded-xl bg-muted/60 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = Number(e.dataTransfer.getData("text/lead"));
                if (id && rows.find((r) => r.id === id)?.status !== status)
                  move.mutate({ id, status });
              }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <Pill tone={LEAD_STATUS_TONE[status]}>{titleCase(status)}</Pill>
                <span className="text-xs text-muted-foreground">
                  {col.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.map((l) => (
                  <Link
                    key={l.id}
                    to="/admin/leads/$id"
                    params={{ id: String(l.id) }}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/lead", String(l.id))
                    }
                    className="block rounded-lg border bg-white p-3 shadow-xs transition hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-navy">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.city ?? prettyPhone(l.phone)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusPill value={l.source} map={SOURCE_TONE} />
                      {l.priority === "high" && <Pill tone="red">High</Pill>}
                    </div>
                    {l.nextFollowUp && (
                      <p className="mt-2 text-xs text-amber-700">
                        ⏰ {relativeTime(l.nextFollowUp)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: drag a card to another column to change its status.
      </p>
    </div>
  );
}

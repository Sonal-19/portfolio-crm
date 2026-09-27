import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, call } from "@/lib/api";
import { cn, formatDateTime, prettyPhone, waLink } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/queries")({
  component: QueriesPage,
});

function QueriesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "queries"],
    queryFn: () => call(api.admin.queries.get()),
  });
  const mark = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      call(api.admin.queries({ id }).patch({ isRead })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => call(api.admin.queries({ id }).delete()),
    onSuccess: () => {
      toast.success("Query deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <>
      <PageHeader
        title="Queries"
        description="Messages from the website contact form. Each one is linked to a lead."
      />
      {data.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-8" />}
          title="No queries yet"
        />
      ) : (
        <div className="space-y-3">
          {data.map((q) => (
            <Card
              key={q.id}
              className={cn(
                "gap-3 p-4 sm:p-5",
                !q.isRead && "border-l-4 border-l-primary",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">
                    {q.subject}{" "}
                    {!q.isRead && (
                      <Pill tone="orange" className="ml-1">
                        New
                      </Pill>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {q.leadId ? (
                      <Link
                        to="/admin/leads/$id"
                        params={{ id: String(q.leadId) }}
                        className="font-medium text-primary hover:underline"
                      >
                        {q.name}
                      </Link>
                    ) : (
                      q.name
                    )}
                    {" · "}
                    {prettyPhone(q.phone)}
                    {q.email ? ` · ${q.email}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(q.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{q.message}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={`tel:+${q.phone}`}>
                    <Phone /> Call
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={waLink(
                      q.phone,
                      `Sat Sri Akal ${q.name.split(" ")[0]} ji 🙏 Thank you for your message about "${q.subject}".`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      !q.isRead && mark.mutate({ id: q.id, isRead: true })
                    }
                  >
                    <FaWhatsapp className="text-[#25D366]" /> Reply
                  </a>
                </Button>
                {q.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`mailto:${q.email}?subject=Re: ${encodeURIComponent(q.subject)}`}
                    >
                      <Mail /> Email
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => mark.mutate({ id: q.id, isRead: !q.isRead })}
                >
                  <MailOpen /> Mark {q.isRead ? "unread" : "read"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    confirm("Delete this query?") && del.mutate(q.id)
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

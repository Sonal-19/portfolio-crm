import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { api, call } from "@/lib/api";
import { cn, prettyPhone } from "@/lib/utils";

export function LeadPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number, name: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["admin", "leads", "picker", q],
    queryFn: () =>
      call(
        api.admin.leads.get({
          query: { search: q || undefined, pageSize: "8" },
        }),
      ),
  });
  return (
    <div className="space-y-2">
      <Input
        placeholder="Search lead by name or phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="max-h-44 overflow-y-auto rounded-md border">
        {data?.rows.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onChange(l.id, l.name)}
              className={cn(
                "flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                value === l.id && "bg-accent font-medium",
              )}
            >
              <span>{l.name}</span>
              <span className="text-xs text-muted-foreground">
                {prettyPhone(l.phone)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

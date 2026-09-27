import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, callMsg } from "@/lib/api";
import { titleCase } from "@/lib/utils";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  type LeadPriority,
  type LeadSource,
} from "./lead-constants";

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "manual" as LeadSource,
    priority: "medium" as LeadPriority,
    tags: "",
  });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: () =>
      callMsg(
        api.admin.leads.post({
          ...f,
          email: f.email || undefined,
          city: f.city || undefined,
          tags: f.tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
      ),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      qc.invalidateQueries({ queryKey: ["admin"] });
      setOpen(false);
      if (data)
        navigate({ to: "/admin/leads/$id", params: { id: String(data.id) } });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
        </DialogHeader>
        <form
          id="add-lead"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Name" required>
            <Input
              required
              minLength={2}
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </Field>
          <Field label="Phone / WhatsApp" required>
            <Input
              required
              minLength={10}
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </Field>
          <Field label="City">
            <Input
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
            />
          </Field>
          <Field label="Source">
            <NativeSelect
              className="w-full"
              value={f.source}
              onChange={(e) =>
                setF({ ...f, source: e.target.value as LeadSource })
              }
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Priority">
            <NativeSelect
              className="w-full"
              value={f.priority}
              onChange={(e) =>
                setF({ ...f, priority: e.target.value as LeadPriority })
              }
            >
              {LEAD_PRIORITIES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Tags"
            hint="Comma separated, e.g. raagi, event"
            className="sm:col-span-2"
          >
            <Input
              value={f.tags}
              onChange={(e) => setF({ ...f, tags: e.target.value })}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="add-lead" disabled={create.isPending}>
            Create lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

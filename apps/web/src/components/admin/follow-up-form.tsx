import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, callMsg } from "@/lib/api";
import { istLocalToIso, titleCase, todayIst } from "@/lib/utils";
import { FOLLOW_UP_TYPES, type FollowUpType } from "./lead-constants";

export function FollowUpForm({
  leadId,
  defaultDate,
  onDone,
}: {
  leadId: number;
  defaultDate?: string;
  onDone?: () => void;
}) {
  const [dueAt, setDueAt] = useState(`${defaultDate ?? todayIst(1)}T11:00`);
  const [type, setType] = useState<FollowUpType>("call");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () =>
      callMsg(
        api.admin["follow-ups"].post({
          leadId,
          dueAt: istLocalToIso(dueAt),
          type,
          title,
          notes: notes || undefined,
        }),
      ),
    onSuccess: ({ message }) => {
      toast.success(message);
      setTitle("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onDone?.();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <Field label="When (IST)">
        <Input
          type="datetime-local"
          required
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </Field>
      <Field label="Type">
        <NativeSelect
          className="w-full"
          value={type}
          onChange={(e) => setType(e.target.value as FollowUpType)}
        >
          {FOLLOW_UP_TYPES.filter((t) => t !== "program").map((t) => (
            <option key={t} value={t}>
              {titleCase(t)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="What to do" className="sm:col-span-2">
        <Input
          required
          minLength={2}
          placeholder="e.g. Call to confirm program date"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={create.isPending}>
          <CalendarPlus /> Add to calendar
        </Button>
      </div>
    </form>
  );
}

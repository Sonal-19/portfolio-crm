import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import { renderTemplate, waLink } from "@/lib/utils";

/** Pick a template, personalise it, open WhatsApp and log it on the lead's timeline. */
export function WhatsappQuickSend({
  leadId,
  name,
  phone,
}: {
  leadId: number;
  name: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(`${window.location.origin}/studio/book`);
  const [text, setText] = useState(`Sat Sri Akal ${name.split(" ")[0]} ji 🙏 `);
  const qc = useQueryClient();
  const { data: templates } = useQuery({
    queryKey: ["admin", "wa-templates"],
    queryFn: () => call(api.admin.whatsapp.templates.get()),
    enabled: open,
  });
  const log = useMutation({
    mutationFn: (message: string) =>
      call(api.admin.leads({ id: leadId })["whatsapp-log"].post({ message })),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "lead", leadId] }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#25D366] text-white hover:bg-[#1ebe5a]">
          <FaWhatsapp /> WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message {name}</DialogTitle>
          <DialogDescription>
            Opens WhatsApp with this message ready to send, and records it on
            the timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Template">
            <NativeSelect
              className="w-full"
              defaultValue=""
              onChange={(e) => {
                const t = templates?.find(
                  (x) => x.id === Number(e.target.value),
                );
                if (t)
                  setText(
                    renderTemplate(t.body, {
                      name: name.split(" ")[0] ?? name,
                      link,
                    }),
                  );
              }}
            >
              <option value="">Choose a template…</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Link for {{link}}">
            <Input value={link} onChange={(e) => setLink(e.target.value)} />
          </Field>
          <Field label="Message">
            <Textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            disabled={!text.trim()}
            onClick={() => {
              window.open(waLink(phone, text), "_blank", "noopener");
              log.mutate(text);
              setOpen(false);
            }}
          >
            <FaWhatsapp /> Open WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

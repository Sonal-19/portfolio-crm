import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { cn, waLink } from "@/lib/utils";

type Value = SiteSettings["quickBooking"];
type Contact = Value["contacts"][number];

const MODES = [
  ["choose", "Visitor chooses a number"],
  ["rotate", "Random active number"],
] as const;

/** Settings card: the floating "Book Kirtan" WhatsApp button. */
export function QuickBookingCard({
  value,
  onChange,
}: {
  value: Value;
  onChange: (v: Value) => void;
}) {
  const set = (patch: Partial<Value>) => onChange({ ...value, ...patch });
  const setContact = (id: string, patch: Partial<Contact>) =>
    set({
      contacts: value.contacts.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });
  const active = value.contacts.filter((c) => c.isActive);

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-navy">
            <FaWhatsapp className="size-4 text-[#25d366]" /> Floating Book
            button
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A WhatsApp button fixed to the corner of every public page. Visitors
            tap it and the chat opens with your message already typed, so they
            only press send. No form to fill.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
          {value.enabled ? "Shown" : "Hidden"}
          <Switch
            checked={value.enabled}
            onCheckedChange={(enabled) => set({ enabled })}
            aria-label="Show the floating Book button"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text">
          <Input
            maxLength={40}
            value={value.label}
            onChange={(e) => set({ label: e.target.value })}
          />
        </Field>
        <Field
          label="With several active numbers"
          hint={
            value.mode === "rotate"
              ? "Spreads chats across the team."
              : "Shows a small list with each number's name."
          }
        >
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {MODES.map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => set({ mode })}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-medium transition",
                  value.mode === mode
                    ? "bg-card text-navy shadow-sm"
                    : "text-muted-foreground hover:text-navy",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field
        label="Prefilled message"
        hint="The text waiting in the visitor's chat box."
      >
        <Textarea
          rows={3}
          maxLength={500}
          value={value.message}
          onChange={(e) => set({ message: e.target.value })}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            WhatsApp numbers{" "}
            <span className="font-normal text-muted-foreground">
              ({active.length} active)
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={value.contacts.length >= 10}
            onClick={() =>
              set({
                contacts: [
                  ...value.contacts,
                  {
                    id: crypto.randomUUID().slice(0, 8),
                    label: "",
                    number: "",
                    isActive: true,
                  },
                ],
              })
            }
          >
            <Plus /> Add number
          </Button>
        </div>
        {value.contacts.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Add at least one number to show the button.
          </p>
        )}
        {value.contacts.map((c) => (
          <div
            key={c.id}
            className={cn(
              "grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_1fr_auto]",
              !c.isActive && "bg-muted/60",
            )}
          >
            <Input
              placeholder="Name, e.g. Bhai Sahib's office"
              maxLength={60}
              value={c.label}
              onChange={(e) => setContact(c.id, { label: e.target.value })}
            />
            <Input
              placeholder="919876543210"
              inputMode="tel"
              maxLength={20}
              value={c.number}
              onChange={(e) => setContact(c.id, { number: e.target.value })}
            />
            <div className="flex items-center justify-end gap-1">
              <Switch
                checked={c.isActive}
                onCheckedChange={(isActive) => setContact(c.id, { isActive })}
                aria-label={`${c.label || "Number"} active`}
              />
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={cn(!c.number && "pointer-events-none opacity-40")}
              >
                <a
                  href={waLink(c.number, value.message)}
                  target="_blank"
                  rel="noreferrer"
                  title="Test this chat link"
                >
                  <ExternalLink />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Remove"
                onClick={() =>
                  set({
                    contacts: value.contacts.filter((x) => x.id !== c.id),
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Digits with country code. 10-digit Indian numbers get 91 added
          automatically. Switched-off numbers are never sent to the website.
        </p>
      </div>
    </Card>
  );
}

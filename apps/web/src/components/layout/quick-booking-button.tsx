import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type SiteSettings, useSiteSettings } from "@/hooks/use-site-settings";
import { cn, prettyPhone, waLink } from "@/lib/utils";

type QuickBooking = SiteSettings["quickBooking"];
type Contact = QuickBooking["contacts"][number];

/** Where a contact's chat opens. Add a case per channel (email, …). */
function contactHref(q: QuickBooking, c: Contact) {
  switch (q.channel) {
    case "whatsapp":
      return waLink(c.number, q.message);
  }
}

const fabClass =
  "group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25d366] py-3 pr-5 pl-3 font-semibold text-white shadow-lg shadow-black/25 ring-4 ring-white/40 transition hover:scale-105 hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-white sm:right-6 sm:bottom-6 print:hidden";

/**
 * Floating "Book Kirtan" button: one tap opens a WhatsApp chat with the
 * message already typed, so the visitor only has to press send. Settings come
 * from the route loader's prefetched site settings, so it renders with the page.
 */
export function QuickBookingButton() {
  const { data } = useSiteSettings();
  const q = data?.quickBooking;
  // Picked once per visit so a re-render never swaps the number mid-click.
  const [seed] = useState(Math.random);

  if (!q?.enabled || q.contacts.length === 0) return null;

  const icon = <FaWhatsapp aria-hidden className="size-7 shrink-0" />;

  if (q.mode === "rotate" || q.contacts.length === 1) {
    const contact =
      q.contacts[Math.floor(seed * q.contacts.length)] ?? q.contacts[0]!;
    return (
      <a
        href={contactHref(q, contact)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${q.label} on WhatsApp`}
        className={fabClass}
      >
        <Pulse />
        {icon}
        <span>{q.label}</span>
      </a>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(fabClass, "data-[state=open]:scale-100")}
        aria-label={`${q.label} on WhatsApp: choose a number`}
      >
        <Pulse />
        {icon}
        <span>{q.label}</span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="w-72 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
          <p className="text-sm font-semibold">Chat with us on WhatsApp</p>
          <FaWhatsapp aria-hidden className="size-5" />
        </div>
        <ul className="divide-y">
          {q.contacts.map((c) => (
            <li key={c.id}>
              <a
                href={contactHref(q, c)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25d366]/15 text-[#128c7e]">
                  <FaWhatsapp aria-hidden className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">
                    {c.label || "WhatsApp"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {prettyPhone(c.number)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Soft attention ring; disabled for users who prefer reduced motion. */
function Pulse() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366]/40 [animation-duration:2.5s] motion-reduce:hidden group-hover:hidden group-data-[state=open]:hidden"
    />
  );
}

import { useMutation } from "@tanstack/react-query";
import {
  HandHeart,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { SectionHeading } from "@/components/common/section-heading";
import { Spinner } from "@/components/common/states";
import { KirtanBookingForm } from "@/components/kirtan/kirtan-booking-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/hooks/use-site-settings";
import { api, call } from "@/lib/api";
import { cn, waLink } from "@/lib/utils";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

function QueryForm() {
  const [f, setF] = useState(EMPTY);
  const send = useMutation({
    mutationFn: () =>
      call(
        api.public.contact.query.post({ ...f, email: f.email || undefined }),
      ),
    onSuccess: () => {
      toast.success("Thank you! We'll get back to you soon. 🙏");
      setF(EMPTY);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form
      className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        send.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="qname" required>
          <Input
            id="qname"
            required
            minLength={2}
            maxLength={120}
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Phone / WhatsApp" htmlFor="qphone" required>
          <Input
            id="qphone"
            required
            type="tel"
            inputMode="tel"
            minLength={10}
            maxLength={20}
            placeholder="98765 43210"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Email" htmlFor="qemail">
        <Input
          id="qemail"
          type="email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </Field>
      <Field label="Subject" htmlFor="qsubject" required>
        <Input
          id="qsubject"
          required
          minLength={2}
          maxLength={160}
          placeholder="Kirtan booking, event, collaboration…"
          value={f.subject}
          onChange={(e) => setF({ ...f, subject: e.target.value })}
        />
      </Field>
      <Field label="Message" htmlFor="qmsg" required>
        <Textarea
          id="qmsg"
          required
          minLength={5}
          rows={5}
          maxLength={4000}
          value={f.message}
          onChange={(e) => setF({ ...f, message: e.target.value })}
        />
      </Field>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={f.website}
        onChange={(e) => setF({ ...f, website: e.target.value })}
      />
      <Button
        type="submit"
        className="w-full rounded-full sm:w-auto sm:px-8"
        disabled={send.isPending}
      >
        {send.isPending ? <Spinner className="text-white" /> : <Send />} Send
        query
      </Button>
    </form>
  );
}

export function ContactSection({ s }: { s?: SiteSettings }) {
  const [tab, setTab] = useState<"query" | "kirtan">("query");
  return (
    <section id="contact" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          kicker="Get in touch"
          title="Contact & Book Kirtan"
          subtitle="Send us a query, or invite Bhai Sahib and the jatha for kirtan at your gurdwara, home or function."
        />

        <div
          role="tablist"
          className="mx-auto mt-10 flex w-full max-w-lg rounded-full border bg-cream p-1"
        >
          {[
            {
              key: "query" as const,
              label: "Send a Query",
              Icon: MessageSquareText,
            },
            { key: "kirtan" as const, label: "Book Kirtan", Icon: HandHeart },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition",
                tab === key
                  ? "bg-navy text-cream shadow"
                  : "text-navy/70 hover:text-navy",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {tab === "kirtan" ? (
            <KirtanBookingForm />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <QueryForm />
              <aside className="space-y-4">
                <div className="space-y-4 rounded-3xl bg-navy p-6 text-sm text-cream/85">
                  <p className="font-brand text-xs tracking-[0.25em] text-gold-light">
                    OFFICE · AMRITVELA TRUST
                  </p>
                  <p className="flex gap-3">
                    <MapPin className="size-5 shrink-0 text-gold" />
                    {s?.address}
                  </p>
                  {s?.phone && (
                    <p className="flex gap-3">
                      <Phone className="size-5 shrink-0 text-gold" />
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`}>
                        {s.phone}
                      </a>
                    </p>
                  )}
                  {s?.email && (
                    <p className="flex gap-3">
                      <Mail className="size-5 shrink-0 text-gold" />
                      <a href={`mailto:${s.email}`}>{s.email}</a>
                    </p>
                  )}
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row lg:flex-col">
                    {s?.whatsappNumber && (
                      <Button
                        asChild
                        className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                      >
                        <a
                          href={waLink(
                            s.whatsappNumber,
                            "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏",
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaWhatsapp /> Chat on WhatsApp
                        </a>
                      </Button>
                    )}
                    {s?.whatsappChannelUrl && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full border-[#25D366]/60 bg-transparent text-cream hover:bg-white/5 hover:text-cream"
                      >
                        <a
                          href={s.whatsappChannelUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaWhatsapp className="text-[#25D366]" /> Join
                          WhatsApp Channel
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                {s?.mapEmbedUrl && (
                  <iframe
                    title="Office location"
                    src={s.mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 w-full rounded-3xl border"
                  />
                )}
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

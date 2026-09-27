import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  HandHeart,
  Mic2,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { Spinner } from "@/components/common/states";
import { studioCatalogQuery } from "@/components/landing/studio-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { api, call } from "@/lib/api";
import { cn, formatClock, formatDate, todayIst, waLink } from "@/lib/utils";

const ARTIST_TYPES = [
  ["raagi", "Raagi"],
  ["kirtani_jatha", "Kirtani Jatha"],
  ["singer", "Singer"],
  ["band", "Band"],
  ["other", "Other"],
] as const;
type ArtistType = (typeof ARTIST_TYPES)[number][0];

const STEPS = [
  { label: "Session", icon: Mic2 },
  { label: "Details", icon: SlidersHorizontal },
  { label: "Date & time", icon: CalendarDays },
  { label: "About you", icon: User },
];

const toMin = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const selectCls =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function BookingWizard({
  initialPackage,
  className,
}: {
  /** package slug or "custom" */
  initialPackage?: string;
  className?: string;
}) {
  const { data: catalog, isLoading } = useQuery(studioCatalogQuery);
  const { data: settings } = useSiteSettings();

  const [step, setStep] = useState(0);
  const [pkgSlug, setPkgSlug] = useState<string | null>(initialPackage ?? null);
  const [instrumentIds, setInstrumentIds] = useState<number[]>([]);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  const [engineerId, setEngineerId] = useState<number | "">("");
  const [customHours, setCustomHours] = useState(2);
  const [projectTitle, setProjectTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayIst(1));
  const [time, setTime] = useState("");
  const [person, setPerson] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    artistType: "raagi" as ArtistType,
    experience: "",
    sampleLink: "",
    about: "",
    website: "",
  });
  const [done, setDone] = useState<number | null>(null);

  const pkg = catalog?.packages.find((p) => p.slug === pkgSlug) ?? null;
  const isCustom = pkgSlug === "custom";
  const hours = pkg ? pkg.durationHours : customHours;

  const { data: avail, isFetching: availLoading } = useQuery({
    queryKey: ["public", "availability", date],
    queryFn: () =>
      call(api.public.studio.availability.get({ query: { date } })),
    enabled: step >= 2 && !!date,
  });

  const slots = useMemo(() => {
    if (!avail) return [];
    const now = new Date();
    const isToday = date === todayIst();
    const [nh = 0, nm = 0] = now
      .toLocaleTimeString("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .split(":")
      .map(Number);
    const nowMin = nh * 60 + nm;
    const out: { time: string; free: boolean }[] = [];
    for (let h = avail.openHour; h + hours <= avail.closeHour; h++) {
      const start = h * 60;
      const end = start + hours * 60;
      const clash = avail.busy.some(
        (b) => start < toMin(b.end) && end > toMin(b.start),
      );
      const past = isToday && start <= nowMin + 60;
      out.push({
        time: `${String(h).padStart(2, "0")}:00`,
        free: !clash && !past,
      });
    }
    return out;
  }, [avail, date, hours]);

  const submit = useMutation({
    mutationFn: () =>
      call(
        api.public.studio.bookings.post({
          ...person,
          email: person.email || undefined,
          city: person.city || undefined,
          experience: person.experience || undefined,
          sampleLink: person.sampleLink || undefined,
          about: person.about || undefined,
          packageId: pkg?.id,
          instrumentIds,
          engineerId: engineerId === "" ? undefined : engineerId,
          addonIds: isCustom ? addonIds : [],
          durationHours: hours,
          projectTitle: projectTitle || undefined,
          notes: notes || undefined,
          preferredDate: date,
          preferredStartTime: time,
        }),
      ),
    onSuccess: (res) => setDone(res?.id ?? 0),
    onError: (e) => toast.error(e.message),
  });

  const toggle = (list: number[], set: (v: number[]) => void, id: number) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const canNext = [
    !!pkgSlug,
    true,
    !!date && !!time && slots.some((s) => s.time === time && s.free),
    person.name.trim().length >= 2 &&
      person.phone.replace(/\D/g, "").length >= 10,
  ][step];

  const instrumentNames =
    catalog?.instruments
      .filter((i) => instrumentIds.includes(i.id))
      .map((i) => i.name) ?? [];
  const addonNames =
    catalog?.addons.filter((a) => addonIds.includes(a.id)).map((a) => a.name) ??
    [];
  const engineerName = catalog?.engineers.find(
    (e) => e.id === engineerId,
  )?.name;

  if (isLoading || !catalog) {
    return (
      <div className="grid h-72 place-items-center">
        <Spinner />
      </div>
    );
  }

  if (done !== null) {
    return (
      <div
        className={cn(
          "rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-12",
          className,
        )}
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-9" />
        </div>
        <h3 className="mt-5 font-display text-3xl text-navy">
          Request received 🙏
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Thank you, {person.name.split(" ")[0]} ji. Your free studio request
          {done ? ` #${done}` : ""} for{" "}
          <strong>{formatDate(`${date}T00:00:00+05:30`)}</strong> at{" "}
          <strong>{formatClock(time)}</strong> is with our team. We'll contact
          you on WhatsApp to confirm.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {settings?.whatsappNumber && (
            <Button
              asChild
              className="rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            >
              <a
                href={waLink(
                  settings.whatsappNumber,
                  `Sat Sri Akal ji, I just applied for a studio session (request #${done}).`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp /> Message us on WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_300px]", className)}>
      <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-8">
        {/* stepper */}
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 text-sm transition",
                  i < step && "border-emerald-500 bg-emerald-500 text-white",
                  i === step && "border-primary bg-primary text-white",
                  i > step && "border-border text-muted-foreground",
                )}
              >
                {i < step ? (
                  <Check className="size-4" />
                ) : (
                  <s.icon className="size-4" />
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium sm:text-xs",
                  i === step ? "text-navy" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-3">
            <h3 className="font-display text-2xl text-navy">
              Choose your session
            </h3>
            <p className="text-sm text-muted-foreground">
              Every session is free of cost.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.packages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPkgSlug(p.slug)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition hover:border-primary/60",
                    pkgSlug === p.slug
                      ? "border-primary bg-accent/50"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy">{p.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.durationHours}h
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPkgSlug("custom")}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-4 text-left transition hover:border-primary/60 sm:col-span-2",
                  isCustom ? "border-primary bg-accent/50" : "border-border",
                )}
              >
                <p className="flex items-center gap-2 font-semibold text-navy">
                  <SlidersHorizontal className="size-4 text-primary" /> Build
                  your own session
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select instruments, duration, sound engineer, mixing,
                  mastering and video shoot.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-display text-2xl text-navy">
              {isCustom ? "Build your session" : pkg?.name}
            </h3>
            {pkg && (
              <ul className="grid gap-2 rounded-2xl bg-cream p-4 text-sm sm:grid-cols-2">
                {pkg.includes.map((inc) => (
                  <li key={inc} className="flex gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" /> {inc}
                  </li>
                ))}
              </ul>
            )}
            <Field label="Instruments you'll need">
              <div className="flex flex-wrap gap-2">
                {catalog.instruments.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() =>
                      toggle(instrumentIds, setInstrumentIds, i.id)
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      instrumentIds.includes(i.id)
                        ? "border-primary bg-primary text-white"
                        : "hover:border-primary/60",
                    )}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {isCustom && (
                <Field label="Duration" htmlFor="duration">
                  <select
                    id="duration"
                    className={selectCls}
                    value={customHours}
                    onChange={(e) => setCustomHours(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} hour{h > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Sound engineer" htmlFor="engineer">
                <select
                  id="engineer"
                  className={selectCls}
                  value={engineerId}
                  onChange={(e) =>
                    setEngineerId(e.target.value ? Number(e.target.value) : "")
                  }
                >
                  <option value="">No preference</option>
                  {catalog.engineers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {isCustom && (
              <Field label="Mixing, mastering & video">
                <div className="grid gap-2 sm:grid-cols-2">
                  {catalog.addons.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                        addonIds.includes(a.id)
                          ? "border-primary bg-accent/40"
                          : "hover:border-primary/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-[var(--primary)]"
                        checked={addonIds.includes(a.id)}
                        onChange={() => toggle(addonIds, setAddonIds, a.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {a.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {a.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Shabad / project title" htmlFor="title">
              <Input
                id="title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Mere Man Lochai"
                maxLength={160}
              />
            </Field>
            <Field label="Anything else we should know?" htmlFor="notes">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-display text-2xl text-navy">
              Pick a preferred date & time
            </h3>
            <Field
              label="Preferred date"
              htmlFor="date"
              hint="We'll confirm the final slot with you."
            >
              <Input
                id="date"
                type="date"
                min={todayIst()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                className="max-w-xs"
              />
            </Field>
            <Field label={`Start time (${hours}h session)`}>
              {availLoading ? (
                <Spinner />
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slots on this day.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.free}
                      onClick={() => setTime(s.time)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm transition",
                        !s.free &&
                          "cursor-not-allowed bg-muted text-muted-foreground/60 line-through",
                        s.free &&
                          time === s.time &&
                          "border-primary bg-primary text-white",
                        s.free && time !== s.time && "hover:border-primary/60",
                      )}
                    >
                      {formatClock(s.time)}
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block size-3 rounded bg-muted" />{" "}
              Greyed-out times are already booked.
            </p>
          </div>
        )}

        {step === 3 && (
          <form
            id="booking-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <h3 className="font-display text-2xl text-navy">
              Tell us about yourself
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="bname" required>
                <Input
                  id="bname"
                  required
                  value={person.name}
                  onChange={(e) =>
                    setPerson({ ...person, name: e.target.value })
                  }
                  maxLength={120}
                />
              </Field>
              <Field label="WhatsApp number" htmlFor="bphone" required>
                <Input
                  id="bphone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  value={person.phone}
                  onChange={(e) =>
                    setPerson({ ...person, phone: e.target.value })
                  }
                  maxLength={20}
                />
              </Field>
              <Field label="Email" htmlFor="bemail">
                <Input
                  id="bemail"
                  type="email"
                  value={person.email}
                  onChange={(e) =>
                    setPerson({ ...person, email: e.target.value })
                  }
                />
              </Field>
              <Field label="City" htmlFor="bcity">
                <Input
                  id="bcity"
                  value={person.city}
                  onChange={(e) =>
                    setPerson({ ...person, city: e.target.value })
                  }
                />
              </Field>
              <Field label="You are a" htmlFor="btype">
                <select
                  id="btype"
                  className={selectCls}
                  value={person.artistType}
                  onChange={(e) =>
                    setPerson({
                      ...person,
                      artistType: e.target.value as ArtistType,
                    })
                  }
                >
                  {ARTIST_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Experience" htmlFor="bexp">
                <Input
                  id="bexp"
                  placeholder="e.g. 5 years of kirtan seva"
                  value={person.experience}
                  onChange={(e) =>
                    setPerson({ ...person, experience: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field
              label="Link to a sample of your work"
              htmlFor="bsample"
              hint="YouTube, Instagram, Google Drive or any audio link."
            >
              <Input
                id="bsample"
                type="url"
                placeholder="https://"
                value={person.sampleLink}
                onChange={(e) =>
                  setPerson({ ...person, sampleLink: e.target.value })
                }
              />
            </Field>
            <Field label="A few words about you" htmlFor="babout">
              <Textarea
                id="babout"
                rows={3}
                value={person.about}
                onChange={(e) =>
                  setPerson({ ...person, about: e.target.value })
                }
                maxLength={2000}
              />
            </Field>
            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              value={person.website}
              onChange={(e) =>
                setPerson({ ...person, website: e.target.value })
              }
            />
          </form>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft /> Back
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              className="rounded-full px-6"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button
              type="submit"
              form="booking-form"
              className="rounded-full px-6"
              disabled={!canNext || submit.isPending}
            >
              {submit.isPending ? (
                <Spinner className="text-white" />
              ) : (
                <HandHeart />
              )}{" "}
              Send free request
            </Button>
          )}
        </div>
      </div>

      {/* summary */}
      <aside className="h-fit rounded-3xl border bg-navy p-6 text-cream lg:sticky lg:top-24">
        <p className="font-brand text-xs tracking-[0.25em] text-gold-light">
          YOUR SESSION
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-cream/50">Session</dt>
            <dd className="font-medium">
              {isCustom ? "Custom session" : (pkg?.name ?? "Not selected")}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gold" /> {hours} hour
            {hours > 1 ? "s" : ""}
          </div>
          {instrumentNames.length > 0 && (
            <div>
              <dt className="text-cream/50">Instruments</dt>
              <dd>{instrumentNames.join(", ")}</dd>
            </div>
          )}
          {engineerName && (
            <div>
              <dt className="text-cream/50">Engineer</dt>
              <dd>{engineerName}</dd>
            </div>
          )}
          {addonNames.length > 0 && (
            <div>
              <dt className="text-cream/50">Extras</dt>
              <dd>{addonNames.join(", ")}</dd>
            </div>
          )}
          {step >= 2 && date && (
            <div>
              <dt className="text-cream/50">Preferred</dt>
              <dd>
                {formatDate(`${date}T00:00:00+05:30`)}
                {time && `, ${formatClock(time)}`}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-emerald-300">
            <HandHeart className="size-4" /> Free of cost
          </p>
          <p className="mt-1 text-cream/70">
            No charges for recording, mixing, mastering or video shoots. This
            studio is seva.
          </p>
        </div>
      </aside>
    </div>
  );
}

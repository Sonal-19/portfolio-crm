import { cn, titleCase } from "@/lib/utils";

const TONES = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  navy: "bg-[#0f1b3d]/5 text-[#0f1b3d] ring-[#0f1b3d]/15",
} as const;
type Tone = keyof typeof TONES;

export const LEAD_STATUS_TONE: Record<string, Tone> = {
  new: "blue",
  contacted: "violet",
  follow_up: "amber",
  confirmed: "orange",
  completed: "green",
  closed: "gray",
};

export const KIRTAN_STATUS_TONE: Record<string, Tone> = {
  new: "amber",
  contacted: "violet",
  confirmed: "orange",
  completed: "green",
  declined: "red",
  cancelled: "gray",
};

export const PRIORITY_TONE: Record<string, Tone> = {
  low: "gray",
  medium: "blue",
  high: "red",
};

export const SOURCE_TONE: Record<string, Tone> = {
  kirtan_booking: "orange",
  query: "blue",
  manual: "gray",
  whatsapp: "green",
  event: "violet",
};

export function Pill({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  value,
  map,
}: {
  value: string;
  map: Record<string, Tone>;
}) {
  return <Pill tone={map[value] ?? "gray"}>{titleCase(value)}</Pill>;
}

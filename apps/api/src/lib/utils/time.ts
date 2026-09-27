import { and, gte, inArray, lt } from "drizzle-orm";
import { db } from "$/db";
import { studioBookingsTable } from "$/db/schema";

/** The studio runs on Indian Standard Time regardless of server TZ. */
export const STUDIO_TZ = "Asia/Kolkata";
export const IST_OFFSET = "+05:30";
export const STUDIO_OPEN_HOUR = 9;
export const STUDIO_CLOSE_HOUR = 21;

export function istDate(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

export function istDayBounds(date: string) {
  const start = istDate(date);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function istTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: STUDIO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Scheduled sessions on a date, as IST "HH:mm" ranges (no personal data). */
export async function busyRangesForDate(date: string) {
  const { start, end } = istDayBounds(date);
  const rows = await db
    .select({
      start: studioBookingsTable.scheduledStart,
      end: studioBookingsTable.scheduledEnd,
    })
    .from(studioBookingsTable)
    .where(
      and(
        inArray(studioBookingsTable.status, ["approved", "scheduled"]),
        gte(studioBookingsTable.scheduledStart, start),
        lt(studioBookingsTable.scheduledStart, end),
      ),
    );
  return {
    date,
    openHour: STUDIO_OPEN_HOUR,
    closeHour: STUDIO_CLOSE_HOUR,
    busy: rows
      .filter((r) => r.start && r.end)
      .map((r) => ({
        start: istTime(r.start as Date),
        end: istTime(r.end as Date),
      })),
  };
}

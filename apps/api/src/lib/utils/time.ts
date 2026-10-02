/** Programs and follow-ups run on Indian Standard Time regardless of server TZ. */
export const IST_TZ = "Asia/Kolkata";
export const IST_OFFSET = "+05:30";

export function istDate(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

export function istDayBounds(date: string) {
  const start = istDate(date);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function istTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: IST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

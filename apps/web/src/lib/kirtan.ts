/** Labels for the Book Kirtan form and the admin Kirtan Bookings page.
 * Values mirror the enums in apps/api/src/db/schema/kirtan/. */

export const KIRTAN_EVENT_TYPES = [
  ["sukhmani_sahib", "Sukhmani Sahib Path"],
  ["akhand_path_bhog", "Akhand Path Bhog"],
  ["sehaj_path_bhog", "Sehaj Path Bhog"],
  ["anand_karaj", "Anand Karaj (Wedding)"],
  ["gurpurab", "Gurpurab Samagam"],
  ["amritvela_simran", "Amritvela Simran"],
  ["prabhat_pheri", "Prabhat Pheri"],
  ["silent_kirtan", "Silent (Headphone) Kirtan"],
  ["griha_pravesh", "Griha Pravesh (New Home)"],
  ["birthday_anniversary", "Birthday / Anniversary"],
  ["antim_ardas", "Antim Ardas / Bhog"],
  ["business_opening", "Business Opening"],
  ["other", "Other Program"],
] as const;
export type KirtanEventType = (typeof KIRTAN_EVENT_TYPES)[number][0];

export const VENUE_TYPES = [
  ["gurdwara", "Gurdwara"],
  ["home", "Home"],
  ["banquet_hall", "Banquet / Hall"],
  ["open_ground", "Open Ground / Pandal"],
  ["other", "Other"],
] as const;
export type VenueType = (typeof VENUE_TYPES)[number][0];

export const SANGAT_SIZES = [
  ["under_50", "Under 50"],
  ["50_200", "50 – 200"],
  ["200_500", "200 – 500"],
  ["500_plus", "500+"],
] as const;
export type SangatSize = (typeof SANGAT_SIZES)[number][0];

export const KIRTAN_LANGUAGES = [
  ["either", "Any"],
  ["punjabi", "Punjabi"],
  ["hindi", "Hindi"],
] as const;
export type KirtanLanguage = (typeof KIRTAN_LANGUAGES)[number][0];

export const KIRTAN_REQUIREMENTS = [
  ["sound_available", "We have a sound system"],
  ["need_sound", "Jatha to bring sound system"],
  ["silent_kirtan_headphones", "Silent Kirtan headphones"],
  ["langar_arranged", "Langar is arranged"],
  ["live_stream", "Live stream / recording"],
] as const;
export type KirtanRequirement = (typeof KIRTAN_REQUIREMENTS)[number][0];

export const KIRTAN_DURATIONS = [1, 2, 3, 4, 6] as const;

export const KIRTAN_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;
export type KirtanStatus = (typeof KIRTAN_STATUSES)[number];

const toMap = (list: readonly (readonly [string, string])[]) =>
  Object.fromEntries(list) as Record<string, string>;
const EVENT_LABEL = toMap(KIRTAN_EVENT_TYPES);
const VENUE_LABEL = toMap(VENUE_TYPES);
const SANGAT_LABEL = toMap(SANGAT_SIZES);
const LANGUAGE_LABEL = toMap(KIRTAN_LANGUAGES);
const REQUIREMENT_LABEL = toMap(KIRTAN_REQUIREMENTS);

export const eventLabel = (v: string) => EVENT_LABEL[v] ?? v;
export const venueLabel = (v: string) => VENUE_LABEL[v] ?? v;
export const sangatLabel = (v?: string | null) =>
  v ? (SANGAT_LABEL[v] ?? v) : "";
export const languageLabel = (v: string) => LANGUAGE_LABEL[v] ?? v;
export const requirementLabel = (v: string) => REQUIREMENT_LABEL[v] ?? v;

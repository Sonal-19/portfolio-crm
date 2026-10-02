export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "confirmed",
  "completed",
  "closed",
] as const;
export const LEAD_SOURCES = [
  "kirtan_booking",
  "query",
  "manual",
  "whatsapp",
  "event",
] as const;
export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;
export const FOLLOW_UP_TYPES = [
  "call",
  "whatsapp",
  "visit",
  "email",
  "meeting",
  "program",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

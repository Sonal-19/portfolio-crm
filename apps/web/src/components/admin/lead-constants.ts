export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "shortlisted",
  "recorded",
  "closed",
] as const;
export const LEAD_SOURCES = [
  "booking",
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
  "session",
] as const;
export const BOOKING_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "scheduled",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Interactions that may be recorded for a visitor who gave consent (as tags on their contact, nothing else). */
export const EVENTS = ["viewed-training", "opened-booking", "used-blueprint", "asked-assistant", "viewed-security", "replayed-quest", "returned"] as const;
export type SiteEvent = (typeof EVENTS)[number];

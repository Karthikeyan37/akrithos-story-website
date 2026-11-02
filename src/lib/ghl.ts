import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GoHighLevel (LeadConnector API v2) from the server only. The token never reaches the browser.
 *
 * Needs a Private Integration token from the sub-account (Settings, Private Integrations) with the contacts.write
 * scope, and the sub-account's location id:
 *   GHL_PRIVATE_TOKEN, GHL_LOCATION_ID
 * Optional:
 *   GHL_API_BASE   (default https://services.leadconnectorhq.com)
 *   GHL_FIELD_IDS  JSON map of our field names to your custom field ids, for personalised emails, for example
 *                  {"ak_level":"abc123","ak_score":"def456","ak_first_agent":"...","ak_path":"...","ak_hours_year":"...","ak_industry":"..."}
 *   LEAD_SIGNING_SECRET  at least 32 random characters; lets a visitor's later interactions be added to their contact.
 *
 * Tags are added with the Add Tags call, never sent with the upsert (the upsert replaces all of a contact's tags).
 */
const VERSION = "2021-07-28";
const TIMEOUT_MS = 10_000;

export function ghlConfigured(): boolean {
  return Boolean(process.env.GHL_PRIVATE_TOKEN && process.env.GHL_LOCATION_ID);
}

function base() {
  return (process.env.GHL_API_BASE || "https://services.leadconnectorhq.com").replace(/\/+$/, "");
}

async function call(path: string, body: unknown): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base()}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
        Version: VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    // Status only: never log the visitor's details or the token.
    if (!res.ok) throw new Error(`GoHighLevel ${path.split("/")[1]} returned ${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function fieldIds(): Record<string, string> {
  try {
    const parsed = JSON.parse(process.env.GHL_FIELD_IDS || "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([k, v]) => /^[a-z_]{2,40}$/.test(k) && typeof v === "string" && /^[\w-]{4,64}$/.test(v))) as Record<string, string>;
  } catch {
    return {};
  }
}

export type Lead = {
  email: string;
  firstName: string;
  companyName?: string;
  source: string;
  fields?: Record<string, string | number>;
  tags: string[];
  note?: string;
};

/** Creates or updates the contact (matched by the location's duplicate rules), then adds tags and a note. */
export async function sendLead(lead: Lead): Promise<{ contactId: string }> {
  const ids = fieldIds();
  const customFields = Object.entries(lead.fields ?? {})
    .filter(([k]) => ids[k])
    .map(([k, v]) => ({ id: ids[k], field_value: String(v) }));
  const up = await call("/contacts/upsert", {
    locationId: process.env.GHL_LOCATION_ID,
    email: lead.email,
    firstName: lead.firstName,
    ...(lead.companyName ? { companyName: lead.companyName } : {}),
    source: lead.source,
    ...(customFields.length ? { customFields } : {}),
  });
  const contact = (up.contact ?? {}) as { id?: string };
  if (!contact.id) throw new Error("GoHighLevel upsert returned no contact id");
  await addTags(contact.id, lead.tags);
  if (lead.note) await call(`/contacts/${encodeURIComponent(contact.id)}/notes`, { body: lead.note.slice(0, 5000) }).catch(() => undefined);
  return { contactId: contact.id };
}

export async function addTags(contactId: string, tags: string[]): Promise<void> {
  const clean = [...new Set(tags.filter((t) => /^[a-z0-9-]{2,60}$/.test(t)))];
  if (clean.length) await call(`/contacts/${encodeURIComponent(contactId)}/tags`, { tags: clean });
}

// ---- Interaction tokens: let a contact's later visits add tags, without anyone being able to tag someone else ----
const DAY = 86_400_000;

function secret(): string | null {
  const s = process.env.LEAD_SIGNING_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

export function signContact(contactId: string, days = 120): string | null {
  const key = secret();
  if (!key) return null;
  const payload = `${contactId}.${Date.now() + days * DAY}`;
  const mac = createHmac("sha256", key).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${mac}`;
}

export function verifyContact(token: unknown): string | null {
  const key = secret();
  if (!key || typeof token !== "string" || token.length > 400) return null;
  const [p, mac] = token.split(".");
  if (!p || !mac) return null;
  const payload = Buffer.from(p, "base64url").toString("utf8");
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [contactId, exp] = payload.split(".");
  if (!contactId || !/^[\w-]{4,64}$/.test(contactId) || !(Number(exp) > Date.now())) return null;
  return contactId;
}

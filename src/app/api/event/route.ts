import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, sameOrigin } from "@/lib/guard";
import { addTags, ghlConfigured, verifyContact } from "@/lib/ghl";
import { EVENTS } from "@/lib/events";

/**
 * What a known visitor (one who gave consent and received a signed token) does on the site later, as a tag on their
 * contact, so the nurture follows what they are interested in. Only these events exist; nothing else is recorded.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!rateLimit(`event:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const event = EVENTS.find((e) => e === body.event);
  const contactId = verifyContact(body.token);
  if (!event || !contactId) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!ghlConfigured()) return NextResponse.json({ ok: true, delivered: false });
  try {
    await addTags(contactId, [`ak-event-${event}`]);
    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("Event not sent:", (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

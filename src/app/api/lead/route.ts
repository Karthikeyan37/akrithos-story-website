import { NextRequest, NextResponse } from "next/server";
import { EMAIL, cleanText, clientIp, rateLimit, sameOrigin } from "@/lib/guard";
import { ghlConfigured, sendLead, signContact } from "@/lib/ghl";
import { cleanAnswers, score, summary } from "@/lib/quest";

/**
 * A visitor asks for something (their Agent Quest report, a follow-up from the assistant, their blueprint) and
 * agrees to hear from Akrithos. The contact goes to GoHighLevel with tags that start the matching nurture workflow.
 *
 * Only what the visitor chose to send is stored, and only with their consent. Scores are recomputed here from the
 * answers; nothing a browser claims about a score is trusted.
 */
const KINDS = ["quest", "assistant", "blueprint"] as const;
type Kind = (typeof KINDS)[number];

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`lead:${ip}`, Number(process.env.LEAD_RATE_LIMIT) > 0 ? Number(process.env.LEAD_RATE_LIMIT) : 5, 10 * 60_000)) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // A field people never see: bots fill it in. Pretend it worked.
  if (cleanText(body.website, 200)) return NextResponse.json({ ok: true, delivered: true });

  const kind = KINDS.includes(body.kind as Kind) ? (body.kind as Kind) : null;
  const email = cleanText(body.email, 254).toLowerCase();
  const firstName = cleanText(body.firstName, 60);
  const company = cleanText(body.company, 80);
  if (!kind) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!firstName) return NextResponse.json({ error: "Please add your first name.", field: "firstName" }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "That email address does not look right.", field: "email" }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "Please tick the box so we may send it to you.", field: "consent" }, { status: 400 });

  const tags = ["ak-website", `ak-source-${kind}`, "ak-consent-email"];
  let note = "";
  let fields: Record<string, string | number> = {};
  if (kind === "quest") {
    const answers = cleanAnswers(body.answers);
    if (!answers.bottleneck || !answers.timing) return NextResponse.json({ error: "Finish the quest first." }, { status: 400 });
    const result = score(answers);
    tags.push(...result.tags);
    note = summary(answers, result);
    fields = { ak_level: result.level.name, ak_score: result.score, ak_first_agent: result.agent?.name ?? "", ak_path: result.path, ak_hours_year: result.hoursPerYear, ak_industry: answers.industry ?? "" };
  } else {
    // The visitor's own words about what they need (asked not to include personal or health details).
    const topic = cleanText(body.topic, 400);
    if (topic) note = `${kind === "assistant" ? "Asked the website assistant" : "Built a workflow blueprint"} about: ${topic}`;
    const interest = cleanText(body.interest, 40);
    if (/^(diagnostic|training|blueprint|agent)$/.test(interest)) tags.push(`ak-interest-${interest}`);
  }

  if (!ghlConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("Lead not sent: GHL_PRIVATE_TOKEN or GHL_LOCATION_ID is not set.");
      return NextResponse.json({ error: "We could not save this right now. Please email info@akrithos.com." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, delivered: false, preview: true });
  }

  try {
    const { contactId } = await sendLead({ email, firstName, companyName: company || undefined, source: `Website: ${kind}`, tags, note, fields });
    return NextResponse.json({ ok: true, delivered: true, token: signContact(contactId) });
  } catch (err) {
    console.error("Lead not sent:", (err as Error).message);
    return NextResponse.json({ error: "We could not save this right now. Please try again, or email info@akrithos.com." }, { status: 502 });
  }
}

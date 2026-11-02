import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, sameOrigin } from "@/lib/guard";

const MAX_INPUT_LENGTH = 600;
const REQUEST_TIMEOUT_MS = 28000;

const SYSTEM_PROMPT = `You produce a short, illustrative workflow blueprint preview for a business
automation discussion. Given a workflow description, respond with ONLY a JSON
object (no markdown, no prose, no code fences) matching exactly this shape:
{
  "summary": "one sentence describing the workflow",
  "likelyInputs": ["input 1", "input 2"],
  "proposedStages": ["stage 1", "stage 2", "stage 3"],
  "humanReviewPoint": "one sentence naming where a person should review before anything ships",
  "clarifyingQuestions": ["question 1", "question 2"],
  "diagnosticFocus": "one sentence suggesting what to bring to the Diagnostic"
}
Never include a price, a time estimate, a savings figure, a compliance conclusion, or
a guarantee. This is a discussion starter, not a scoped plan. Keep every field concrete
and specific to what the person described, not generic.`;

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!rateLimit(`plan:${clientIp(req)}`, 8, 10 * 60_000)) return NextResponse.json({ error: "That is a lot of blueprints. Give it a few minutes." }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { workflow } = (body ?? {}) as { workflow?: unknown };

  if (!workflow || typeof workflow !== "string" || workflow.trim().length < 5) {
    return NextResponse.json(
      { error: "Describe a real workflow in a sentence or two." },
      { status: 400 },
    );
  }
  if (workflow.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `Keep this under ${MAX_INPUT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;

  // No invented default model. If either is missing, this is not configured
  // for live generation — return a clearly labeled illustrative example
  // rather than guessing at a model string or silently degrading.
  if (!apiKey || !model) {
    return NextResponse.json({
      demo: true,
      summary: "Follows up with leads who have gone quiet for a set number of days.",
      likelyInputs: ["Contact activity history", "Last outreach timestamp"],
      proposedStages: ["Detect inactivity", "Draft a follow-up", "Queue for send"],
      humanReviewPoint: "A person reviews and approves each drafted message before it sends.",
      clarifyingQuestions: [
        "How many days of silence should count as 'gone quiet'?",
        "Who should be notified if a reply arrives?",
      ],
      diagnosticFocus: "Bring your actual follow-up cadence and who currently owns it.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (workspaceId) headers["anthropic-workspace-id"] = workspaceId;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: workflow }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("generate-plan upstream error, status:", res.status);
      return NextResponse.json(
        { error: "The blueprint preview is temporarily unavailable." },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("generate-plan: model returned non-JSON output");
      return NextResponse.json(
        { error: "The blueprint preview is temporarily unavailable." },
        { status: 502 },
      );
    }

    const p = parsed as Record<string, unknown>;
    const valid =
      typeof p.summary === "string" &&
      Array.isArray(p.likelyInputs) &&
      Array.isArray(p.proposedStages) &&
      typeof p.humanReviewPoint === "string" &&
      Array.isArray(p.clarifyingQuestions) &&
      typeof p.diagnosticFocus === "string";

    if (!valid) {
      console.error("generate-plan: model output failed schema validation");
      return NextResponse.json(
        { error: "The blueprint preview is temporarily unavailable." },
        { status: 502 },
      );
    }

    return NextResponse.json({ demo: false, ...p });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return NextResponse.json({ error: "That took too long. Try again." }, { status: 504 });
    }
    console.error("generate-plan route failed:", err);
    return NextResponse.json(
      { error: "The blueprint preview is temporarily unavailable." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

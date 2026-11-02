/**
 * Agent Quest: the rules of the readiness game. Pure functions, used by the page and checked again by the server
 * (the server never trusts scores sent from a browser; it recomputes them from the answers).
 */

export type Choice = { id: string; label: string; insight: string };
export type Round =
  | { id: "industry" | "bottleneck" | "knowledge" | "boundary" | "approval" | "timing"; kind: "choice"; prompt: string; badge: string; choices: Choice[] }
  | { id: "hours"; kind: "range"; prompt: string; badge: string; min: number; max: number; step: number; initial: number };

export const ROUNDS: Round[] = [
  {
    id: "industry",
    kind: "choice",
    prompt: "First, who are we helping?",
    badge: "Mission set",
    choices: [
      { id: "healthcare", label: "Healthcare or home care", insight: "Care teams lose hours to paperwork, scheduling and the same family questions. Agents can do the admin so your staff can focus on care." },
      { id: "finance", label: "Financial services", insight: "Finance teams spend days matching numbers, checking documents and getting sign-offs. When the rules are clear, agents do this well." },
      { id: "government", label: "Government or public sector", insight: "Public teams handle lots of the same requests under strict rules. Agents help here, as long as every step is recorded and checked." },
      { id: "services", label: "Professional services", insight: "Firms are paid for expertise, yet lose hours to proposals, new client forms and status updates. Agents give that time back." },
      { id: "commerce", label: "Retail or e-commerce", insight: "Orders, returns and product questions repeat all day. Agents answer instantly and hand real problems to your team." },
      { id: "other", label: "Something else", insight: "Every business has a few tasks that repeat, with small differences. We will find yours." },
    ],
  },
  {
    id: "bottleneck",
    kind: "choice",
    prompt: "Where does your team lose the most hours?",
    badge: "Bottleneck found",
    choices: [
      { id: "leads", label: "Chasing and qualifying leads", insight: "A revenue agent reads every enquiry, picks out the ones most likely to buy, and passes them to sales within minutes." },
      { id: "knowledge", label: "Answering the same questions", insight: "A knowledge copilot answers from documents you approve, shows where each answer came from, and asks an expert when it is unsure." },
      { id: "documents", label: "Documents, data entry and approvals", insight: "An operations agent reads and checks documents, sends them to the right place, and gets each decision ready so the right person can approve it in seconds." },
      { id: "service", label: "Customer requests and follow-ups", insight: "A service agent handles everyday requests day and night, and passes sensitive moments to your people with the full story." },
      { id: "scheduling", label: "Scheduling and coordination", insight: "An operations agent matches people and times to your rules, and only asks a person when something clashes." },
      { id: "reporting", label: "Reports nobody has time to build", insight: "An operations agent gathers the numbers, writes a first draft and points out what changed, ready for a person to sign off." },
    ],
  },
  { id: "hours", kind: "range", prompt: "Roughly how many hours a week does that take, across everyone?", badge: "Prize sized", min: 2, max: 200, step: 1, initial: 20 },
  {
    id: "knowledge",
    kind: "choice",
    prompt: "Where is the know-how for that work today?",
    badge: "Knowledge mapped",
    choices: [
      { id: "documents", label: "Written down in documents and policies", insight: "Written rules are the best place to start. An agent can use them from day one." },
      { id: "system", label: "Inside a CRM or main business system", insight: "Organised systems help agents be accurate. We give the agent only the access it needs, nothing more." },
      { id: "scattered", label: "Scattered across email, drives and chats", insight: "Very common, and fixable. Part of the job is gathering the information the agent may use, and nothing else." },
      { id: "heads", label: "Mostly in people's heads", insight: "Then the first win is writing it down. We talk to your experts and turn what they know into rules the agent follows." },
    ],
  },
  {
    id: "boundary",
    kind: "choice",
    prompt: "What has to stay inside your walls?",
    badge: "Boundary drawn",
    choices: [
      { id: "none", label: "Nothing especially sensitive", insight: "That keeps things simple: a secure cloud setup, with every step recorded." },
      { id: "customer", label: "Customer and staff records", insight: "We agree exactly what the agent may see, and keep everything else out of reach." },
      { id: "regulated", label: "Regulated data, like health or money records", insight: "We can keep it in your region, on your own servers, or a mix, wherever the rules say. This is what we know best." },
      { id: "classified", label: "Government or classified material", insight: "Our leaders come from secure defence and government work. A fully separate setup is possible." },
    ],
  },
  {
    id: "approval",
    kind: "choice",
    prompt: "Before an agent acts, who should approve?",
    badge: "Gatekeeper named",
    choices: [
      { id: "nobody", label: "Nobody, if it is low risk", insight: "Fine for low-risk steps. We still record every step, so you can always see what happened and why." },
      { id: "lead", label: "A team lead, for anything unusual", insight: "A strong pattern: agents handle the routine, a lead approves the exceptions." },
      { id: "expert", label: "A named expert for each kind of decision", insight: "The best setup. When it is clear who owns each decision, it is safe to hand more to agents, sooner." },
      { id: "always", label: "Always a person, every time", insight: "A good way to start. Agents prepare the work, people press go, and trust grows from there." },
    ],
  },
  {
    id: "timing",
    kind: "choice",
    prompt: "When would you like your first agent working?",
    badge: "Clock started",
    choices: [
      { id: "month", label: "This month", insight: "Then the Diagnostic is your fastest route: one session to agree the goal, what the agent may see, and who checks its work." },
      { id: "quarter", label: "This quarter", insight: "Plenty of time to start with one workflow, prove it, then add the next." },
      { id: "exploring", label: "Just exploring for now", insight: "Exploring is how good projects start. Our live training shows how agents are built, step by step." },
    ],
  },
];

export type Answers = Partial<Record<Exclude<Round["id"], "hours">, string>> & { hours?: number };

export const AGENT_FOR: Record<string, { index: number; name: string; does: string; decides: string }> = {
  leads: { index: 0, name: "Revenue agent", does: "Reads every enquiry, picks out the ones most likely to buy, and sends each to the right person with a short note.", decides: "Sales confirms each qualified opportunity." },
  knowledge: { index: 1, name: "Knowledge copilot", does: "Answers from documents you approve, shows where each answer came from, and asks an expert when unsure.", decides: "An expert checks any answer it is unsure about." },
  documents: { index: 2, name: "Operations control", does: "Reads and checks documents, then gets each decision ready in one short summary.", decides: "A named owner approves each action." },
  scheduling: { index: 2, name: "Operations control", does: "Matches people and times to your rules, and only flags what clashes.", decides: "A coordinator approves changes that affect people." },
  reporting: { index: 2, name: "Operations control", does: "Gathers the numbers, drafts the report and flags what changed.", decides: "A manager signs the report off." },
  service: { index: 3, name: "Service agent", does: "Handles everyday requests at any hour, and passes sensitive moments to your team with the full story.", decides: "Your team owns every sensitive conversation." },
};

export const LEVELS = [
  { min: 0, name: "Scout", line: "You have spotted the opportunity. The next step is shaping it." },
  { min: 45, name: "Builder", line: "You have the raw material for a first agent. A focused plan gets it working." },
  { min: 65, name: "Operator", line: "You are ready for a first agent in production, with clear owners and limits." },
  { min: 82, name: "Orchestrator", line: "You are set up to run several agents together. Start with one and scale with proof." },
] as const;

const KNOWLEDGE_SCORE: Record<string, number> = { documents: 90, system: 85, scattered: 55, heads: 35 };
const APPROVAL_SCORE: Record<string, number> = { expert: 95, lead: 85, always: 75, nobody: 45 };
const BOUNDARY_BONUS: Record<string, number> = { none: 0, customer: 5, regulated: 8, classified: 8 };
const TIMING_SCORE: Record<string, number> = { month: 95, quarter: 75, exploring: 35 };

export type Result = {
  meters: { opportunity: number; readiness: number; control: number; momentum: number };
  score: number;
  level: (typeof LEVELS)[number];
  agent: (typeof AGENT_FOR)[string] | null;
  hoursPerYear: number;
  path: "diagnostic" | "blueprint" | "training";
  tags: string[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const valid = (round: Round["id"], value: string | undefined) => {
  const r = ROUNDS.find((x) => x.id === round);
  return Boolean(r && r.kind === "choice" && value && r.choices.some((c) => c.id === value));
};

/** The answers, checked against the rounds (anything unknown is dropped). */
export function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  for (const round of ROUNDS) {
    if (round.kind === "range") {
      const n = Number(r.hours);
      if (Number.isFinite(n)) out.hours = Math.round(clamp(n, round.min, round.max));
    } else if (typeof r[round.id] === "string" && valid(round.id, r[round.id] as string)) {
      out[round.id] = r[round.id] as string;
    }
  }
  return out;
}

export function score(a: Answers): Result {
  const hours = a.hours ?? 0;
  const opportunity = clamp(Math.round(30 + Math.sqrt(hours) * 6.5));
  const readiness = KNOWLEDGE_SCORE[a.knowledge ?? ""] ?? 50;
  const control = clamp((APPROVAL_SCORE[a.approval ?? ""] ?? 50) + (BOUNDARY_BONUS[a.boundary ?? ""] ?? 0));
  const momentum = TIMING_SCORE[a.timing ?? ""] ?? 50;
  const total = Math.round(opportunity * 0.35 + readiness * 0.2 + control * 0.2 + momentum * 0.25);
  const level = [...LEVELS].reverse().find((l) => total >= l.min) ?? LEVELS[0];
  const agent = a.bottleneck ? AGENT_FOR[a.bottleneck] ?? null : null;
  const path = a.timing !== "exploring" && opportunity >= 55 ? "diagnostic" : opportunity >= 55 ? "blueprint" : a.timing === "exploring" ? "training" : "blueprint";
  const tags = [
    "ak-quest-done",
    a.industry && `ak-industry-${a.industry}`,
    a.bottleneck && `ak-bottleneck-${a.bottleneck}`,
    a.boundary && `ak-boundary-${a.boundary}`,
    a.timing && `ak-timing-${a.timing}`,
    `ak-level-${level.name.toLowerCase()}`,
    `ak-path-${path}`,
    path === "diagnostic" ? "ak-hot" : path === "blueprint" ? "ak-warm" : "ak-learn",
  ].filter((t): t is string => Boolean(t));
  return { meters: { opportunity, readiness, control, momentum }, score: total, level, agent, hoursPerYear: hours * 48, path, tags };
}

/** A plain-text summary for the CRM note (no free text from the visitor, only their choices). */
export function summary(a: Answers, r: Result): string {
  const label = (id: Round["id"]) => {
    const round = ROUNDS.find((x) => x.id === id);
    if (!round) return "";
    if (round.kind === "range") return `${a.hours ?? "?"} hours a week`;
    return round.choices.find((c) => c.id === a[id as keyof Answers])?.label ?? "not answered";
  };
  return [
    `Agent Quest result: ${r.level.name}, score ${r.score}/100, path: ${r.path}.`,
    `First agent: ${r.agent?.name ?? "not chosen"}.`,
    `Meters: opportunity ${r.meters.opportunity}, readiness ${r.meters.readiness}, control ${r.meters.control}, momentum ${r.meters.momentum}.`,
    ...ROUNDS.map((round) => `${round.prompt} ${label(round.id)}`),
    `Hours at stake (their estimate): about ${r.hoursPerYear.toLocaleString("en-US")} a year.`,
  ].join("\n");
}

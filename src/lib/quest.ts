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
      { id: "healthcare", label: "Healthcare or home care", insight: "Care teams lose hours to intake, scheduling and the same family questions. Agents can carry the admin while clinicians keep the care." },
      { id: "finance", label: "Financial services", insight: "Finance teams spend days on reconciliations, document checks and approvals that follow clear rules. That is exactly where agents shine." },
      { id: "government", label: "Government or public sector", insight: "Public teams handle high volumes of the same requests under strict rules. Agents work well here when every action is logged and reviewed." },
      { id: "services", label: "Professional services", insight: "Firms bill for expertise, yet lose hours to proposals, intake and status updates. Agents give that time back to client work." },
      { id: "commerce", label: "Retail or e-commerce", insight: "Orders, returns and product questions repeat all day. Agents answer instantly and hand real problems to your team." },
      { id: "other", label: "Something else", insight: "Every business has a few workflows that repeat with small variations. We will find yours." },
    ],
  },
  {
    id: "bottleneck",
    kind: "choice",
    prompt: "Where does your team lose the most hours?",
    badge: "Bottleneck found",
    choices: [
      { id: "leads", label: "Chasing and qualifying leads", insight: "A revenue agent reads every enquiry, scores it against your criteria and puts the best ones in front of sales within minutes." },
      { id: "knowledge", label: "Answering the same questions", insight: "A knowledge copilot answers from your approved documents, cites where the answer came from and sends unclear cases to an expert." },
      { id: "documents", label: "Documents, data entry and approvals", insight: "An operations agent extracts, checks and routes documents, and prepares each decision so a named owner can approve it in seconds." },
      { id: "service", label: "Customer requests and follow-ups", insight: "A service agent resolves routine requests around the clock and passes sensitive moments to your people with the full context." },
      { id: "scheduling", label: "Scheduling and coordination", insight: "An operations agent matches people, times and rules, then asks a person only when something conflicts." },
      { id: "reporting", label: "Reports nobody has time to build", insight: "An operations agent gathers the numbers, drafts the report and flags what changed, ready for a person to sign off." },
    ],
  },
  { id: "hours", kind: "range", prompt: "Roughly how many hours a week does that take, across everyone?", badge: "Prize sized", min: 2, max: 200, step: 1, initial: 20 },
  {
    id: "knowledge",
    kind: "choice",
    prompt: "Where does the know-how for that work live today?",
    badge: "Knowledge mapped",
    choices: [
      { id: "documents", label: "Written down in documents and policies", insight: "Written rules are the best starting point. An agent can work from them on day one." },
      { id: "system", label: "Inside a CRM or core system", insight: "Structured systems make agents precise. We connect to them with the narrowest access that does the job." },
      { id: "scattered", label: "Scattered across email, drives and chats", insight: "Common, and fixable. Part of the work is gathering the sources an agent may use, and nothing else." },
      { id: "heads", label: "Mostly in people's heads", insight: "Then the first win is capturing it. We interview the experts and turn their judgement into rules the agent follows." },
    ],
  },
  {
    id: "boundary",
    kind: "choice",
    prompt: "What has to stay inside your walls?",
    badge: "Boundary drawn",
    choices: [
      { id: "none", label: "Nothing especially sensitive", insight: "That keeps the path simple: a secure cloud deployment with clear logs." },
      { id: "customer", label: "Customer and staff records", insight: "We scope exactly which fields an agent may see, and keep everything else out of reach." },
      { id: "regulated", label: "Regulated data, like health or financial records", insight: "Regional, on-premises or hybrid deployment keeps regulated data where the rules require. This is our home ground." },
      { id: "classified", label: "Government or classified material", insight: "Our principals come from secure defence and government environments. Isolated deployments are on the table." },
    ],
  },
  {
    id: "approval",
    kind: "choice",
    prompt: "Before an agent acts, who should approve?",
    badge: "Gatekeeper named",
    choices: [
      { id: "nobody", label: "Nobody, if it is low risk", insight: "Fine for low-risk steps. We still log every action so you can see what happened and why." },
      { id: "lead", label: "A team lead, for anything unusual", insight: "A strong pattern: agents handle the routine, a lead approves the exceptions." },
      { id: "expert", label: "A named expert for each kind of decision", insight: "The gold standard. Clear owners make it safe to automate more, faster." },
      { id: "always", label: "Always a person, every time", insight: "A good way to start. Agents prepare the work, people press go, and trust grows from there." },
    ],
  },
  {
    id: "timing",
    kind: "choice",
    prompt: "When would you like your first agent working?",
    badge: "Clock started",
    choices: [
      { id: "month", label: "This month", insight: "Then the Diagnostic is your fastest route: one session to define the target, the boundary and the review path." },
      { id: "quarter", label: "This quarter", insight: "Plenty of time to start with one workflow, prove it, then add the next." },
      { id: "exploring", label: "Just exploring for now", insight: "Exploring is how good projects start. Our live training shows you how agents are built, step by step." },
    ],
  },
];

export type Answers = Partial<Record<Exclude<Round["id"], "hours">, string>> & { hours?: number };

export const AGENT_FOR: Record<string, { index: number; name: string; does: string; decides: string }> = {
  leads: { index: 0, name: "Revenue agent", does: "Reads every enquiry, scores it against your criteria and routes the best to the right person with a short brief.", decides: "Sales confirms each qualified opportunity." },
  knowledge: { index: 1, name: "Knowledge copilot", does: "Answers from your approved documents with the source attached, and sends unclear questions to an expert.", decides: "An expert reviews low-confidence answers." },
  documents: { index: 2, name: "Operations control", does: "Extracts and checks documents, then prepares each decision as a short packet.", decides: "A named owner approves each action." },
  scheduling: { index: 2, name: "Operations control", does: "Matches people, times and rules, and raises only the conflicts.", decides: "A coordinator approves changes that affect people." },
  reporting: { index: 2, name: "Operations control", does: "Gathers the numbers, drafts the report and flags what changed.", decides: "A manager signs the report off." },
  service: { index: 3, name: "Service agent", does: "Resolves routine requests at any hour and hands sensitive moments to your team with the full context.", decides: "Your team owns every sensitive conversation." },
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

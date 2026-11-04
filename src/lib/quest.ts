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
    prompt: "First, what kind of business are you?",
    badge: "Mission set",
    choices: [
      { id: "healthcare", label: "Healthcare or home care", insight: "Care teams lose hours to paperwork, schedules and the same questions from families. An agent can do the admin, so your staff can care for people." },
      { id: "finance", label: "Banking, insurance or money", insight: "Money teams spend days matching numbers, checking papers and getting sign-offs. When the rules are clear, an agent does this well." },
      { id: "government", label: "Government or public service", insight: "Public teams get lots of the same requests and must follow strict rules. An agent can help, as long as every step is written down and checked." },
      { id: "services", label: "Professional services, like law or consulting", insight: "Your clients pay for your know-how, yet hours go on forms, proposals and updates. An agent gives that time back." },
      { id: "commerce", label: "Shop or online store", insight: "Orders, returns and product questions come in all day. An agent answers right away and passes real problems to your team." },
      { id: "other", label: "Something else", insight: "Every business has a few jobs that repeat, with small changes each time. We will find yours." },
    ],
  },
  {
    id: "bottleneck",
    kind: "choice",
    prompt: "Which job eats up the most of your team's time?",
    badge: "Pile found",
    choices: [
      { id: "leads", label: "Following up with people who might buy", insight: "A revenue agent reads every new enquiry, spots the people most likely to buy, and passes them to sales within minutes." },
      { id: "knowledge", label: "Answering the same questions again and again", insight: "A knowledge copilot answers using only documents you approve, shows where each answer came from, and asks an expert when it is not sure." },
      { id: "documents", label: "Paperwork, typing and sign-offs", insight: "An operations agent reads and checks paperwork, sends it to the right place, and gets each decision ready so a person can approve it in seconds." },
      { id: "service", label: "Helping customers who call or write", insight: "A service agent helps with everyday requests day and night, and passes hard or sensitive ones to your people with the full story." },
      { id: "scheduling", label: "Booking and scheduling", insight: "An operations agent books people and times using your rules, and only asks a person when something clashes." },
      { id: "reporting", label: "Making reports", insight: "An operations agent gathers the numbers, writes a first draft and points out what changed, ready for a person to sign off." },
    ],
  },
  { id: "hours", kind: "range", prompt: "About how many hours a week does your whole team spend on that job?", badge: "Pile measured", min: 2, max: 200, step: 1, initial: 20 },
  {
    id: "knowledge",
    kind: "choice",
    prompt: "How does your team know how to do that job?",
    badge: "Know-how found",
    choices: [
      { id: "documents", label: "It is written down in guides and rules", insight: "Written rules are the best place to start. An agent can follow them from day one." },
      { id: "system", label: "It is inside our main software, like a CRM", insight: "Tidy software helps an agent get things right. We give it only the access it needs, nothing more." },
      { id: "scattered", label: "It is spread across emails, files and chats", insight: "Very common, and fixable. Part of the job is gathering what the agent may use, and nothing else." },
      { id: "heads", label: "It is mostly in people's heads", insight: "Then the first win is writing it down. We talk to your experts and turn what they know into rules the agent follows." },
    ],
  },
  {
    id: "boundary",
    kind: "choice",
    prompt: "What information must stay private?",
    badge: "Walls built",
    choices: [
      { id: "none", label: "Nothing very private", insight: "That keeps things simple: a safe cloud setup, with every step written down." },
      { id: "customer", label: "Customer and staff details", insight: "We agree exactly what the agent may see, and keep everything else out of reach." },
      { id: "regulated", label: "Health or money records that have strict rules", insight: "We can keep it in your region, on your own servers, or a mix, wherever the rules say. This is what we know best." },
      { id: "classified", label: "Government or secret material", insight: "Our leaders come from defence and government work. A fully separate setup is possible." },
    ],
  },
  {
    id: "approval",
    kind: "choice",
    prompt: "Who should say yes before the agent acts?",
    badge: "Checker named",
    choices: [
      { id: "nobody", label: "No one, if it is low risk", insight: "Fine for low-risk jobs. We still write down every step, so you can always see what happened and why." },
      { id: "lead", label: "A team leader, for anything unusual", insight: "A strong setup: the agent handles the everyday jobs, and a leader says yes to the unusual ones." },
      { id: "expert", label: "The right expert for each kind of decision", insight: "The best setup. When everyone knows who owns each decision, it is safe to give the agent more, sooner." },
      { id: "always", label: "A person, every single time", insight: "A good way to start. The agent gets the work ready, a person presses go, and trust grows from there." },
    ],
  },
  {
    id: "timing",
    kind: "choice",
    prompt: "When do you want your first agent working?",
    badge: "Clock started",
    choices: [
      { id: "month", label: "This month", insight: "Then the Diagnostic is your fastest way in: one session to agree the goal, what the agent may see, and who checks its work." },
      { id: "quarter", label: "In the next 3 months", insight: "Plenty of time to start with one job, prove it works, then add the next." },
      { id: "exploring", label: "Just looking for now", insight: "Looking around is how good projects start. Our live training shows how agents are built, step by step." },
    ],
  },
];

export type Answers = Partial<Record<Exclude<Round["id"], "hours">, string>> & { hours?: number };

export const AGENT_FOR: Record<string, { index: number; name: string; does: string; decides: string }> = {
  leads: { index: 0, name: "Revenue agent", does: "Reads every new enquiry, spots the people most likely to buy, and sends each one to the right salesperson with a short note.", decides: "Your sales team says yes to each one." },
  knowledge: { index: 1, name: "Knowledge copilot", does: "Answers questions using only documents you approve, and shows where each answer came from.", decides: "An expert checks any answer it is not sure about." },
  documents: { index: 2, name: "Operations control", does: "Reads and checks paperwork, then gets each decision ready in one short summary.", decides: "The right person approves each one." },
  scheduling: { index: 2, name: "Operations control", does: "Books people and times using your rules, and only asks for help when something clashes.", decides: "A coordinator approves changes that affect people." },
  reporting: { index: 2, name: "Operations control", does: "Gathers the numbers, writes a first draft of the report, and points out what changed.", decides: "A manager checks the report and signs it off." },
  service: { index: 3, name: "Service agent", does: "Helps customers with everyday requests at any hour, and passes hard or sensitive ones to your team with the full story.", decides: "Your team handles every sensitive conversation." },
};

export const LEVELS = [
  { min: 0, name: "Scout", line: "You found a good place to start. Next, we turn it into a plan." },
  { min: 45, name: "Builder", line: "You have what you need for a first agent. A clear plan gets it working." },
  { min: 65, name: "Operator", line: "You are ready to put a first agent to work, with clear rules and people in charge." },
  { min: 82, name: "Orchestrator", line: "You are ready to run several agents together. Start with one, prove it works, then add more." },
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

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useMotionVisibility } from "@/hooks/use-motion-visibility";

type Stage = { label: string; detail: string; kind: "input" | "plan" | "control" | "review" | "output" };

type Scenario = {
  label: string;
  request: string;
  owner: string;
  boundary: string;
  review: string;
  stages: readonly Stage[];
  output: string;
  artifactDetail: string;
};

const SCENARIOS: readonly Scenario[] = [
  {
    label: "Revenue",
    request: "Qualify and route a high-intent opportunity",
    owner: "Revenue Operations",
    boundary: "Approved intake fields only",
    review: "Sales confirms qualification before routing",
    stages: [
      { label: "Intake", detail: "Request and approved fields captured.", kind: "input" },
      { label: "Plan", detail: "Qualification sequence prepared.", kind: "plan" },
      { label: "Policy", detail: "Data and routing boundaries applied.", kind: "control" },
      { label: "Review", detail: "Sales confirmation requested.", kind: "review" },
      { label: "Deliver", detail: "Opportunity brief assembled.", kind: "output" },
    ],
    output: "Qualified opportunity brief",
    artifactDetail: "Intent, urgency, missing information, recommended owner, and required confirmation.",
  },
  {
    label: "Operations",
    request: "Triage a flagged invoice exception",
    owner: "Finance Operations",
    boundary: "Policy-scoped operational data",
    review: "Named finance owner approves the next step",
    stages: [
      { label: "Intake", detail: "Exception and trigger captured.", kind: "input" },
      { label: "Plan", detail: "Assessment sequence prepared.", kind: "plan" },
      { label: "Policy", detail: "Approval threshold evaluated.", kind: "control" },
      { label: "Review", detail: "Finance approval requested.", kind: "review" },
      { label: "Deliver", detail: "Exception packet assembled.", kind: "output" },
    ],
    output: "Exception packet awaiting approval",
    artifactDetail: "Trigger, applicable policy, unresolved condition, recommended action, and approval owner.",
  },
  {
    label: "Knowledge",
    request: "Answer a policy question with cited sources",
    owner: "Knowledge Operations",
    boundary: "Selected knowledge sources only",
    review: "Expert checks unresolved or low-confidence claims",
    stages: [
      { label: "Intake", detail: "Question and context captured.", kind: "input" },
      { label: "Plan", detail: "Retrieval sequence prepared.", kind: "plan" },
      { label: "Ground", detail: "Claims checked against sources.", kind: "control" },
      { label: "Review", detail: "Expert review condition applied.", kind: "review" },
      { label: "Deliver", detail: "Grounded answer assembled.", kind: "output" },
    ],
    output: "Grounded answer with cited sources",
    artifactDetail: "Answer summary, approved source references, confidence state, and unresolved question.",
  },
];

const STAGE_DELAYS_MS = [350, 1250, 2350, 3550, 4850] as const;
const COMPLETE_DELAY_MS = 5600;
const NEXT_SCENARIO_DELAY_MS = 9800;

function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ExecutionBrief() {
  const reduced = useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false);
  const [sectionRef, motionVisible] = useMotionVisibility<HTMLElement>();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(-1);
  const [autoCycling, setAutoCycling] = useState(true);
  const timers = useRef<number[]>([]);
  const scenarioRef = useRef(0);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  const stopAutomatic = useCallback(() => {
    clearTimers();
    setAutoCycling(false);
  }, [clearTimers]);

  const playScenario = useCallback(
    (index: number) => {
      clearTimers();
      const scenario = SCENARIOS[index];
      scenarioRef.current = index;
      setScenarioIndex(index);
      setStageIndex(-1);
      STAGE_DELAYS_MS.forEach((delay, nextStage) => {
        timers.current.push(window.setTimeout(() => setStageIndex(nextStage), delay));
      });
      timers.current.push(window.setTimeout(() => setStageIndex(scenario.stages.length), COMPLETE_DELAY_MS));
    },
    [clearTimers],
  );

  useEffect(() => {
    if (reduced || !autoCycling || !motionVisible) return;
    let cancelled = false;

    function schedule(index: number) {
      if (cancelled) return;
      clearTimers();
      const scenario = SCENARIOS[index];
      scenarioRef.current = index;
      setScenarioIndex(index);
      setStageIndex(-1);
      STAGE_DELAYS_MS.forEach((delay, nextStage) => {
        timers.current.push(window.setTimeout(() => setStageIndex(nextStage), delay));
      });
      timers.current.push(window.setTimeout(() => setStageIndex(scenario.stages.length), COMPLETE_DELAY_MS));
      timers.current.push(window.setTimeout(() => schedule((index + 1) % SCENARIOS.length), NEXT_SCENARIO_DELAY_MS));
    }

    schedule(scenarioRef.current);
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [autoCycling, clearTimers, motionVisible, reduced]);

  function selectScenario(index: number) {
    stopAutomatic();
    scenarioRef.current = index;
    setScenarioIndex(index);
    setStageIndex(SCENARIOS[index].stages.length);
  }

  function replay() {
    stopAutomatic();
    if (reduced) {
      setStageIndex(SCENARIOS[scenarioIndex].stages.length);
    } else {
      playScenario(scenarioIndex);
    }
  }

  const scenario = SCENARIOS[scenarioIndex];
  const effectiveStageIndex = reduced ? scenario.stages.length : stageIndex;
  const complete = effectiveStageIndex >= scenario.stages.length;
  const progress = complete ? 100 : effectiveStageIndex < 0 ? 0 : ((effectiveStageIndex + 1) / scenario.stages.length) * 100;

  return (
    <section ref={sectionRef} className="overflow-hidden rounded-feature border border-stone-100 bg-ink text-paper shadow-lift" aria-labelledby="execution-brief-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-600 px-5 py-4">
        <div>
          <p className="font-mono text-overline uppercase text-bronze">Operational canvas</p>
          <h2 id="execution-brief-title" className="mt-1 text-body font-semibold">Illustrative execution brief</h2>
        </div>
        <span className="rounded-pill border border-stone-600 px-3 py-2 font-mono text-overline uppercase text-stone-400">
          {complete ? "Artifact ready" : autoCycling ? "Guided preview" : "In progress"}
        </span>
      </div>

      <div className="h-1 bg-stone-600" aria-hidden="true">
        <div className="h-full bg-terracotta transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose an example workflow">
            {SCENARIOS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={index === scenarioIndex}
                onClick={() => selectScenario(index)}
                className={`rounded-pill border px-3 py-2 text-label font-semibold transition-colors ${
                  index === scenarioIndex ? "border-terracotta bg-terracotta text-paper" : "border-stone-600 text-stone-100 hover:border-bronze hover:text-paper"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={replay} className="text-label font-semibold text-bronze hover:text-paper">
            Replay flow
          </button>
        </div>

        <div role="tabpanel" className="mt-5">
          <div className="rounded-card border border-stone-600 bg-paper p-4 text-ink">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-overline uppercase text-terracotta">Business request</p>
                <h3 className="mt-2 text-h3 font-semibold">{scenario.request}</h3>
              </div>
              <span className="shrink-0 font-mono text-overline text-bronze">IN</span>
            </div>
            <p className="mt-3 text-label text-stone-600">Owner · {scenario.owner}</p>
          </div>

          <ol className="flow-stages mt-4 grid gap-2 sm:grid-cols-5" aria-label="Workflow stages">
            {scenario.stages.map((stage, index) => {
              const state = complete || index < effectiveStageIndex ? "complete" : index === effectiveStageIndex ? "active" : "pending";
              return (
                <li
                  key={stage.label}
                  data-stage-state={state}
                  className={`relative z-10 rounded-card border p-3 transition-colors duration-300 ${
                    state === "active"
                      ? "border-terracotta bg-terracotta text-paper"
                      : state === "complete"
                        ? "border-bronze bg-paper text-ink"
                        : "border-stone-600 bg-stone-600/20 text-stone-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-overline">0{index + 1}</span>
                    <span aria-hidden="true">{state === "complete" ? "●" : state === "active" ? "◉" : "○"}</span>
                  </div>
                  <p className="mt-2 text-label font-semibold">{stage.label}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-2 rounded-card border border-stone-600 bg-stone-600/20 px-4 py-3" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-overline uppercase text-bronze">Current action</p>
              <p className="font-mono text-overline uppercase text-stone-100">
                {complete ? "Flow complete" : effectiveStageIndex >= 0 ? scenario.stages[effectiveStageIndex].label : "Preparing"}
              </p>
            </div>
            <p className="mt-2 text-label leading-6 text-paper">
              {complete
                ? "The controlled path is complete and its reviewable artifact is ready."
                : effectiveStageIndex >= 0
                  ? scenario.stages[effectiveStageIndex].detail
                  : "Preparing the request for a controlled execution path."}
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className={`rounded-card border p-4 transition-colors ${effectiveStageIndex >= 2 || complete ? "border-bronze bg-paper text-ink" : "border-stone-600 text-stone-100"}`}>
              <p className="font-mono text-overline uppercase text-terracotta">Data boundary</p>
              <p className="mt-2 text-label font-semibold">{scenario.boundary}</p>
            </div>
            <div className={`rounded-card border p-4 transition-colors ${effectiveStageIndex >= 3 || complete ? "border-bronze bg-paper text-ink" : "border-stone-600 text-stone-100"}`}>
              <p className="font-mono text-overline uppercase text-terracotta">Human gate</p>
              <p className="mt-2 text-label font-semibold">{scenario.review}</p>
            </div>
          </div>

          <div className={`mt-4 overflow-hidden rounded-card border transition-all duration-500 ${complete ? "border-terracotta bg-paper text-ink" : "max-h-0 border-stone-600 opacity-0"}`} aria-live="polite">
            {complete ? (
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-overline uppercase text-terracotta">Output artifact</p>
                  <span className="rounded-pill bg-stone-50 px-3 py-2 font-mono text-overline text-bronze">Prepared</span>
                </div>
                <p className="mt-3 text-body font-semibold">{scenario.output}</p>
                <p className="mt-2 text-label leading-6 text-stone-600">{scenario.artifactDetail}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="border-t border-stone-600 px-5 py-3 font-mono text-overline uppercase leading-5 text-stone-100">
        Illustrative workflow · no client data · no business action executed
      </p>
    </section>
  );
}

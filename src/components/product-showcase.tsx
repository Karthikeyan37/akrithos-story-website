"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

import { useMotionVisibility } from "@/hooks/use-motion-visibility";
import { usePointerLean } from "@/hooks/use-pointer-lean";

/** The four example agents, in plain words. Shared with the agent picker in the story. */
export const systems = [
  {
    id: "revenue",
    short: "Revenue agent",
    plain: "Answers new enquiries",
    title: "Spots the enquiries worth your time.",
    summary: "Calls, forms and emails become one short note your sales team can act on.",
    effect: "Faster replies to people who are ready to buy",
    inputLabel: "New enquiries",
    inputs: ["Voicemail", "Web form", "Email"],
    work: ["Need", "Urgency", "Who calls"],
    outputLabel: "A ready-to-call note",
    outputs: ["What they need", "Who to talk to", "Next step ready"],
    human: "Your sales team says yes",
  },
  {
    id: "knowledge",
    short: "Knowledge copilot",
    plain: "Answers questions from your documents",
    title: "Answers your team can trust.",
    summary: "It only uses documents you approve, and shows where each answer came from.",
    effect: "Less time spent searching for answers",
    inputLabel: "Your approved documents",
    inputs: ["Policies", "How-to guides", "Product info"],
    work: ["Find", "Check", "Write"],
    outputLabel: "A clear answer",
    outputs: ["Source shown", "How sure it is", "Gaps flagged"],
    human: "An expert checks anything unsure",
  },
  {
    id: "operations",
    short: "Operations control",
    plain: "Catches problems early",
    title: "Stops small problems before they get costly.",
    summary: "When something looks wrong, it checks your rules and asks the right person to approve.",
    effect: "Less checking by hand, clear sign-off",
    inputLabel: "Something looks wrong",
    inputs: ["Invoice over limit", "Missing details", "Stuck order"],
    work: ["Read", "Check rules", "Send"],
    outputLabel: "Ready to approve",
    outputs: ["Proof attached", "Rule named", "Owner told"],
    human: "The right person approves",
  },
  {
    id: "service",
    short: "Service agent",
    plain: "Helps customers any time",
    title: "Quick replies, and a real person when it matters.",
    summary: "It answers calls and chats, solves simple requests, and passes harder ones to your team with the full story.",
    effect: "Help around the clock, with a clear handover",
    inputLabel: "A customer gets in touch",
    inputs: ["Phone", "Chat", "Message"],
    work: ["Understand", "Look up", "Hand over"],
    outputLabel: "Solved or passed on",
    outputs: ["Request understood", "Nothing lost", "Right person assigned"],
    human: "Your team handles sensitive moments",
  },
] as const;

type System = (typeof systems)[number];
type SystemId = System["id"];

const steps = ["Work comes in", "The agent gets it ready", "A person checks", "Done"] as const;
/** One plain sentence for the step in progress, so there is only ever one thing to read. */
const say = (s: System, step: number) => [
  `Work comes in: ${s.inputs.join(", ").toLowerCase()}.`,
  `The agent works through it: ${s.work.join(", ").toLowerCase()}.`,
  `Nothing goes out until a person checks. ${s.human}.`,
  `Done: ${s.outputLabel.toLowerCase()}.`,
][step];
const STEP_MS = 2600; // slow enough to read each sentence

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * See what Akrithos can build: pick one agent and watch one task go through it, step by step. It never moves on by
 * itself; each choice plays once, slowly, then holds the finished result. "Play again" replays it.
 */
export function ProductShowcase() {
  const [sectionRef, visible] = useMotionVisibility<HTMLElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [activeId, setActiveId] = useState<SystemId>(systems[0].id);
  const [run, setRun] = useState(0);
  const [seen, setSeen] = useState(false);
  // 0 work comes in, 1 the agent gets it ready, 2 a person checks, 3 done. Server and reduced motion show it finished.
  const [step, setStep] = useState(3);
  const reduced = useReducedMotion();
  const active = systems.find((system) => system.id === activeId) ?? systems[0];
  const shownStep = reduced ? 3 : step;

  usePointerLean(stageRef);

  // Play once the first time the section is seen; after that, only when the visitor picks an agent or presses Play again.
  useEffect(() => {
    if (visible && !seen) { const t = window.setTimeout(() => { setSeen(true); setRun((r) => r + 1); }, 0); return () => window.clearTimeout(t); }
  }, [visible, seen]);

  useEffect(() => {
    if (!run || reduced) return;
    const timers = steps.map((_, i) => window.setTimeout(() => setStep(i), i * STEP_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [run, reduced]);

  // The agent's cursor moves to the part of the path in progress, and the route line follows the row.
  useLayoutEffect(() => {
    const system = systemRef.current;
    const stage = stageRef.current;
    if (!system || !stage) return;
    const place = () => {
      const parts = system.querySelectorAll<HTMLElement>("[data-step-anchor]");
      const target = parts[shownStep];
      const box = system.getBoundingClientRect();
      if (target && cursorRef.current) {
        const r = target.getBoundingClientRect();
        const [fx, fy] = shownStep === 2 ? [0.84, 0.82] : shownStep === 1 ? [0.9, 0.9] : [0.62, 0.58]; // rest beside the words, not on them
        cursorRef.current.style.transform = `translate3d(${Math.round(r.left - box.left + r.width * fx)}px, ${Math.round(r.top - box.top + r.height * fy)}px, 0)`;
      }
      const core = parts[1]?.getBoundingClientRect();
      if (core) stage.style.setProperty("--route-y", `${Math.round(core.top + core.height / 2 - stage.getBoundingClientRect().top)}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(system);
    return () => observer.disconnect();
  }, [shownStep, activeId]);

  function selectSystem(id: SystemId) {
    setActiveId(id);
    setSeen(true);
    setRun((r) => r + 1);
  }

  const stepState = (i: number) => (i < shownStep ? "done" : i === shownStep ? "now" : "next");

  return (
    <section ref={sectionRef} id="platform" className="showcase-section section scroll-mt-header bg-ink text-paper lg:py-7">
      <div className="mx-auto max-w-content">
        <div className="showcase-heading">
          <div>
            <p className="eyebrow text-bronze">Examples only · built around how you work</p>
            <h2 className="mt-3 max-w-copy text-h2 font-semibold text-paper">See what Akrithos can build.</h2>
          </div>
          <p className="showcase-intro">Pick one agent. Watch it handle one task, step by step, from start to finish.</p>
        </div>

        <div className="showcase-tabs" role="tablist" aria-label="Example agents">
          {systems.map((system) => (
            <button
              key={system.id}
              type="button"
              role="tab"
              aria-selected={system.id === activeId}
              aria-controls="system-showcase-panel"
              onClick={() => selectSystem(system.id)}
              className={system.id === activeId ? "is-active" : undefined}
            >
              <strong>{system.plain}</strong>
              <small>{system.short}</small>
            </button>
          ))}
          <button type="button" className="showcase-play-control" onClick={() => setRun((r) => r + 1)} disabled={reduced}>
            <span aria-hidden="true">↻</span>
            Play again
          </button>
        </div>

        <div
          ref={stageRef}
          id="system-showcase-panel"
          role="tabpanel"
          className="showcase-stage"
          data-system={active.id}
          data-step={shownStep}
          style={{ "--p": shownStep / (steps.length - 1) } as CSSProperties}
        >
          <div className="showcase-stage-grid" aria-hidden="true" />
          <svg className="showcase-routes" viewBox="0 0 1200 680" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="showcase-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            <path className="showcase-route-base" markerEnd="url(#showcase-arrow)" d="M300 385 L360 385" />
            <path className="showcase-route-base" markerEnd="url(#showcase-arrow)" d="M520 385 L580 385" />
            <path className="showcase-route-base" markerEnd="url(#showcase-arrow)" d="M780 385 L845 385" />
            <path className="showcase-route-live" d="M165 385 L995 385" />
          </svg>

          <header className="showcase-stage-header">
            <div>
              <p>{active.short}</p>
              <h3>{active.title}</h3>
            </div>
            <div className="showcase-effect">
              <span>What you get</span>
              <strong>{active.effect}</strong>
            </div>
          </header>

          <ol className="showcase-flow-legend" aria-label="How it works">
            {steps.map((label, i) => <li key={label} data-state={stepState(i)}>{label}</li>)}
          </ol>
          <p className="showcase-now">{say(active, shownStep)}</p>

          <div ref={systemRef} className="showcase-system" key={active.id}>
            <span ref={cursorRef} className="showcase-agent-cursor" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 2.5 20 11l-7.2 1.9L9.6 20z" /></svg>
              <i />
            </span>

            <article className="showcase-console showcase-input" data-step-anchor data-state={stepState(0)}>
              <span className="showcase-node-role">{steps[0]}</span>
              <p>{active.inputLabel}</p>
              <ul>
                {active.inputs.map((item) => <li key={item}><span className="showcase-source-icon" aria-hidden="true">{item[0]}</span><strong>{item}</strong><i aria-hidden="true" /></li>)}
              </ul>
            </article>

            <div className="showcase-core-column" data-state={stepState(1)}>
              <div className="showcase-core" aria-label="The agent at work" data-step-anchor>
                <svg className="showcase-core-ring" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="47" pathLength="1" />
                  <circle cx="50" cy="50" r="47" pathLength="1" />
                </svg>
                <strong>A</strong>
                <p>Agent<br />at work</p>
                <small>Following your rules</small>
              </div>
              <ol className="showcase-work" aria-label="What the agent does">
                {active.work.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>

            <div className="showcase-human-gate" data-step-anchor data-state={stepState(2)}>
              <i aria-hidden="true" />
              <span>{steps[2]}</span>
              <strong>{active.human}</strong>
            </div>

            <article className="showcase-console showcase-output" data-step-anchor data-state={stepState(3)}>
              <span className="showcase-node-role">{steps[3]}</span>
              <p>{active.outputLabel}</p>
              <ul>
                {active.outputs.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
              </ul>
            </article>
          </div>

          <footer className="showcase-stage-footer">
            <p>{active.summary}</p>
            <span>Example only · no real client data</span>
          </footer>
        </div>

        <div className="showcase-capabilities" aria-label="What Akrithos can build">
          {["Phone calls", "Answers from documents", "Reading documents", "Sales follow-up", "Finance checks", "Operations", "Customer service", "Reports"].map((capability) => <span key={capability}>{capability}</span>)}
        </div>
      </div>
    </section>
  );
}

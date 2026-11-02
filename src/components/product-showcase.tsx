"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

import { useMotionVisibility } from "@/hooks/use-motion-visibility";
import { usePointerLean } from "@/hooks/use-pointer-lean";

/** Shared with the hero preview so both show the same words. */
export const systems = [
  {
    id: "revenue",
    short: "Revenue agent",
    number: "01",
    title: "Find the requests worth human attention.",
    summary: "Voice, forms, and messages become one qualified opportunity brief.",
    effect: "Faster response to qualified demand",
    inputLabel: "Demand arriving",
    inputs: ["Voicemail", "Web form", "Email"],
    work: ["Need", "Urgency", "Owner"],
    outputLabel: "Opportunity brief",
    outputs: ["Need structured", "Sponsor identified", "Next step prepared"],
    human: "Sales confirms qualification",
  },
  {
    id: "knowledge",
    short: "Knowledge copilot",
    number: "02",
    title: "Turn approved material into answers people can trust.",
    summary: "The system searches only selected sources and carries citations into review.",
    effect: "Less searching, clearer source ownership",
    inputLabel: "Approved sources",
    inputs: ["Policies", "Playbooks", "Product docs"],
    work: ["Retrieve", "Evidence", "Compose"],
    outputLabel: "Grounded answer",
    outputs: ["Source linked", "Confidence visible", "Gap identified"],
    human: "Expert reviews low confidence",
  },
  {
    id: "operations",
    short: "Operations control",
    number: "03",
    title: "Hold exceptions before they become expensive.",
    summary: "A repeated exception is detected, checked against policy, and routed for approval.",
    effect: "Less manual triage, explicit approvals",
    inputLabel: "Exception detected",
    inputs: ["Invoice threshold", "Missing field", "Route failure"],
    work: ["Extract", "Policy", "Route"],
    outputLabel: "Decision packet",
    outputs: ["Evidence attached", "Policy named", "Owner notified"],
    human: "Named owner approves action",
  },
  {
    id: "service",
    short: "Service agent",
    number: "04",
    title: "Stay responsive without losing the human handoff.",
    summary: "Voice and chat requests are understood, resolved when safe, or escalated with context.",
    effect: "Always-on intake with defined escalation",
    inputLabel: "Conversation",
    inputs: ["Voice", "Chat", "Message"],
    work: ["Intent", "Context", "Handoff"],
    outputLabel: "Resolved or routed",
    outputs: ["Intent captured", "Context retained", "Owner assigned"],
    human: "Your team owns sensitive moments",
  },
] as const;

type SystemId = (typeof systems)[number]["id"];

const steps = ["Input", "Intelligence", "Human decision", "Output"] as const;
const STEP_MS = 1500;
// Large, tall screens with full motion get the pinned, scroll-driven story. Everyone else keeps the timed showcase.
const SCROLL_QUERY = "(min-width: 64rem) and (min-height: 46rem) and (prefers-reduced-motion: no-preference)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function ProductShowcase() {
  const [sectionRef, visible] = useMotionVisibility<HTMLElement>();
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [activeId, setActiveId] = useState<SystemId>(systems[0].id);
  const [paused, setPaused] = useState(false);
  // 0 input, 1 intelligence, 2 human decision, 3 output. Server and reduced motion render the finished state.
  const [step, setStep] = useState(3);
  const scrollMode = useMedia(SCROLL_QUERY);
  const reduced = useMedia(REDUCED_QUERY);
  const activeIndex = systems.findIndex((system) => system.id === activeId);
  const active = systems[activeIndex] ?? systems[0];
  const shownStep = reduced ? 3 : step;

  usePointerLean(stageRef);

  // Timed mode: rotate through the systems while visible, unless the visitor chose one.
  useEffect(() => {
    if (scrollMode || !visible || paused || reduced) return;
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const index = systems.findIndex((system) => system.id === current);
        return systems[(index + 1) % systems.length].id;
      });
    }, 7600);
    return () => window.clearInterval(timer);
  }, [paused, visible, scrollMode, reduced]);

  // Timed mode: each system plays its path once, input to output, then holds the result.
  useEffect(() => {
    if (scrollMode || !visible || reduced) return;
    const timers = steps.map((_, i) => window.setTimeout(() => setStep(i), i * STEP_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [activeId, visible, scrollMode, reduced]);

  // Scroll mode: the stage is pinned and the page's scroll position chooses the system and how far its work has got.
  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const stage = stageRef.current;
    if (!scrollMode || !track || !pin || !stage) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = parseFloat(getComputedStyle(pin).top) || 0;
      const travel = track.offsetHeight - pin.offsetHeight;
      const progress = travel > 0 ? clamp01((top - track.getBoundingClientRect().top) / travel) : 0;
      const total = progress * systems.length;
      const index = Math.min(systems.length - 1, Math.floor(total));
      const local = clamp01((total - index) / 0.8); // the last fifth of each system holds the finished output
      stage.style.setProperty("--p", local.toFixed(3));
      setActiveId(systems[index].id);
      setStep(Math.min(steps.length - 1, Math.floor(local * steps.length)));
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollMode]);

  // The agent's cursor travels between the four parts of the path, and the route line follows the system row.
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
        const [fx, fy] = shownStep === 2 ? [0.84, 0.82] : [0.62, 0.58]; // at the gate, click beside the words, not on them
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
    setPaused(true);
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!scrollMode || !track || !pin) return;
    // Jump to the point in the scroll story where this system's work is complete.
    const index = systems.findIndex((system) => system.id === id);
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    const travel = track.offsetHeight - pin.offsetHeight;
    window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top - top + travel * ((index + 0.85) / systems.length), behavior: "instant" });
  }

  const stepState = (i: number) => (i < shownStep ? "done" : i === shownStep ? "now" : "next");

  return (
    <section ref={sectionRef} id="platform" className="showcase-section section scroll-mt-header bg-ink text-paper lg:py-7" data-mode={scrollMode ? "scroll" : "timed"}>
      <div className="mx-auto max-w-content">
        <div className="showcase-heading">
          <div>
            <p className="eyebrow text-bronze">Illustrative systems · built around your workflow</p>
            <h2 className="mt-3 max-w-copy text-h2 font-semibold text-paper">See what Akrithos can build.</h2>
          </div>
          <p className="showcase-intro">Choose a system. Watch work move from raw input to a controlled business outcome.</p>
        </div>

        <div ref={trackRef} className="showcase-track">
          <div ref={pinRef} className="showcase-pin">
            <div className="showcase-tabs" role="tablist" aria-label="AI system examples">
              {systems.map((system, i) => (
                <button
                  key={system.id}
                  type="button"
                  role="tab"
                  aria-selected={system.id === activeId}
                  aria-controls="system-showcase-panel"
                  onClick={() => selectSystem(system.id)}
                  className={system.id === activeId ? "is-active" : undefined}
                  data-done={scrollMode && i < activeIndex ? "true" : undefined}
                >
                  {system.short}
                </button>
              ))}
              <button type="button" className="showcase-play-control" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume automatic showcase" : "Pause automatic showcase"}>
                <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
                {paused ? "Play all" : "Auto"}
              </button>
            </div>

            <div
              ref={stageRef}
              id="system-showcase-panel"
              role="tabpanel"
              className="showcase-stage"
              data-system={active.id}
              data-step={shownStep}
              style={scrollMode ? undefined : ({ "--p": shownStep / (steps.length - 1) } as CSSProperties)}
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
                <circle className="showcase-moving-node" r="8">
                  <animateMotion dur="5.8s" repeatCount="indefinite" path="M165 385 L995 385" />
                </circle>
                <circle className="showcase-moving-node showcase-moving-node-delayed" r="6">
                  <animateMotion dur="7.4s" repeatCount="indefinite" path="M165 385 L995 385" />
                </circle>
              </svg>

              <header className="showcase-stage-header">
                <div>
                  <p>{active.short}</p>
                  <h3>{active.title}</h3>
                </div>
                <div className="showcase-effect">
                  <span>Designed business effect</span>
                  <strong>{active.effect}</strong>
                </div>
              </header>

              <ol className="showcase-flow-legend" aria-label="System path">
                {steps.map((label, i) => <li key={label} data-state={stepState(i)}>{label}</li>)}
              </ol>

              <div ref={systemRef} className="showcase-system" key={active.id}>
                <span ref={cursorRef} className="showcase-agent-cursor" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M4 2.5 20 11l-7.2 1.9L9.6 20z" /></svg>
                  <i />
                </span>

                <article className="showcase-console showcase-input" data-step-anchor data-state={stepState(0)}>
                  <span className="showcase-node-role">Input</span>
                  <p>{active.inputLabel}</p>
                  <ul>
                    {active.inputs.map((item) => <li key={item}><span className="showcase-source-icon" aria-hidden="true">{item[0]}</span><strong>{item}</strong><i aria-hidden="true" /></li>)}
                  </ul>
                </article>

                <div className="showcase-core-column" data-state={stepState(1)}>
                  <div className="showcase-core" aria-label="Akrithos orchestration" data-step-anchor>
                    <svg className="showcase-core-ring" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="47" pathLength="1" />
                      <circle cx="50" cy="50" r="47" pathLength="1" />
                    </svg>
                    <span className="showcase-core-orbit" aria-hidden="true" />
                    <span className="showcase-core-orbit showcase-core-orbit-reverse" aria-hidden="true" />
                    <strong>A</strong>
                    <p>Controlled<br />intelligence</p>
                    <small>Rules applied</small>
                  </div>
                  <ol className="showcase-work" aria-label="System work">
                    {active.work.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>

                <div className="showcase-human-gate" data-step-anchor data-state={stepState(2)}>
                  <i aria-hidden="true" />
                  <span>Human decision</span>
                  <strong>{active.human}</strong>
                </div>

                <article className="showcase-console showcase-output" data-step-anchor data-state={stepState(3)}>
                  <span className="showcase-node-role">Output</span>
                  <p>{active.outputLabel}</p>
                  <ul>
                    {active.outputs.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
                  </ul>
                </article>
              </div>

              <footer className="showcase-stage-footer">
                <p>{active.summary}</p>
                <span>Illustrative · no client data</span>
              </footer>
            </div>
          </div>
        </div>

        <div className="showcase-capabilities" aria-label="Akrithos build capabilities">
          {['Voice agents', 'Knowledge systems', 'Document AI', 'Revenue workflows', 'Finance controls', 'Operations', 'Service', 'Analytics'].map((capability) => <span key={capability}>{capability}</span>)}
        </div>
      </div>
    </section>
  );
}

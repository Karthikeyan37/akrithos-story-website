"use client";

import { useEffect, useState } from "react";

import { useMotionVisibility } from "@/hooks/use-motion-visibility";

const flows = [
  {
    id: "lead",
    label: "Qualify a lead",
    workflow: "Lead intake",
    outcome: "Revenue opportunity prioritized",
    handoff: "Sales reviews a qualified request",
    boundary: "Approved intake fields only",
    trace: ["Intake captured", "Intent and urgency classified", "Human follow-up queued"],
  },
  {
    id: "knowledge",
    label: "Ground an answer",
    workflow: "Knowledge request",
    outcome: "Answer grounded in approved material",
    handoff: "Expert reviews low-confidence output",
    boundary: "Selected knowledge sources only",
    trace: ["Question normalized", "Approved sources checked", "Answer and citations prepared"],
  },
  {
    id: "exception",
    label: "Handle an exception",
    workflow: "Operations exception",
    outcome: "Risk contained before action",
    handoff: "Owner approves the next step",
    boundary: "Policy-scoped operational data",
    trace: ["Exception detected", "Policy threshold evaluated", "Approval request created"],
  },
] as const;

const nodes = ["Control", "Intake", "Knowledge", "Operations", "Security", "Analytics"];

export function ControlPlane() {
  const [sectionRef, motionVisible] = useMotionVisibility<HTMLElement>();
  const [flowId, setFlowId] = useState<(typeof flows)[number]["id"]>("lead");
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const flow = flows.find((item) => item.id === flowId) ?? flows[0];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPhase((current) => {
        if (current >= flow.trace.length) {
          window.clearInterval(timer);
          setRunning(false);
          return current;
        }
        return current + 1;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [flow.trace.length, running]);

  useEffect(() => {
    if (!motionVisible || userControlled || running) return;
    const timer = window.setInterval(() => {
      setPhase((current) => {
        if (current >= flows[0].trace.length) {
          setFlowId((currentId) => {
            const currentIndex = flows.findIndex((item) => item.id === currentId);
            return flows[(currentIndex + 1) % flows.length].id;
          });
          return 0;
        }
        return current + 1;
      });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [motionVisible, running, userControlled]);

  function chooseFlow(id: (typeof flows)[number]["id"]) {
    setUserControlled(true);
    setFlowId(id);
    setPhase(0);
    setRunning(false);
  }

  function runFlow() {
    setUserControlled(true);
    setPhase(0);
    setRunning(true);
  }

  return (
    <section ref={sectionRef} id="platform" className="section scroll-mt-header bg-ink text-paper">
      <div className="mx-auto grid max-w-content gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="eyebrow text-bronze">Akrithos control plane · illustrative system</p>
          <h2 className="mt-4 max-w-copy text-h2 text-paper">Choose a flow. Watch the controls respond.</h2>
          <p className="mt-5 max-w-copy text-lead leading-8 text-stone-400">
            Motion shows routing logic, not live client traffic. Select a workflow to compare what enters the system, which control acts, and when a person is involved.
          </p>
          <div className="mt-7 flex flex-wrap gap-3" aria-label="Control plane workflow">
            {flows.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={flowId === item.id}
                onClick={() => chooseFlow(item.id)}
                className={`rounded-pill border px-4 py-3 text-label font-semibold ${
                  flowId === item.id ? "border-terracotta bg-terracotta text-paper" : "border-stone-600 text-paper hover:border-bronze"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={runFlow} disabled={running} className="button mt-5 border border-paper bg-paper text-ink hover:bg-stone-50 disabled:opacity-60">
            {running ? "Routing…" : "Run guided flow"}
          </button>
        </div>

        <div className="rounded-feature border border-stone-600 bg-ink p-5 shadow-lift sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-600 pb-5">
            <div>
              <p className="font-mono text-overline uppercase tracking-widest text-bronze">Simulated orchestration</p>
              <h3 className="mt-2 text-h3 font-semibold text-paper">Outcome-linked agent activity</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-pill border border-bronze px-3 py-2 font-mono text-overline uppercase text-bronze">
              <span className="control-status-dot h-2 w-2 rounded-pill bg-bronze" aria-hidden="true" />
              {userControlled
                ? "Your selection"
                : `Ambient · ${phase === 0 ? "ready" : nodes[Math.min(phase + 1, nodes.length - 1)]}`}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {nodes.map((node, index) => (
              <div
                key={node}
                className={`control-plane-node rounded-card border p-4 ${phase > 0 && index <= Math.min(phase + 1, nodes.length - 1) ? "is-signalled border-bronze bg-ink" : "border-stone-600"}`}
              >
                <p className="font-mono text-overline uppercase tracking-wide text-stone-400">0{index + 1}</p>
                <p className="mt-2 text-label font-semibold text-paper">{node}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Workflow", flow.workflow],
              ["Outcome linked", flow.outcome],
              ["Human review", flow.handoff],
              ["Data boundary", flow.boundary],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card bg-paper p-4 text-ink">
                <p className="font-mono text-overline uppercase tracking-wide text-terracotta">{label}</p>
                <p className="mt-2 text-label font-semibold leading-6">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-card border border-stone-600 p-4" aria-live="polite">
            <p className="font-mono text-overline uppercase tracking-wide text-bronze">Activity · {phase ? `${phase}/${flow.trace.length}` : "ready"}</p>
            <ol className="mt-3 space-y-2">
              {flow.trace.map((event, index) => (
                <li key={event} className={`flex gap-3 text-label ${index < phase ? "text-paper" : "text-stone-400"}`}>
                  <span aria-hidden="true">{index < phase ? "●" : "○"}</span>
                  {event}
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 text-overline leading-5 text-stone-400">Dashboard data is illustrative and does not represent client performance.</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";

const startingPoints = [
  {
    id: "first",
    label: "My first agent",
    title: "Start with the basics.",
    body: "Learn what makes an agent useful, build one with us live, and keep the templates.",
    checks: ["Choose its job", "Give it the right information", "Test the handover to a person"],
  },
  {
    id: "workflow",
    label: "One slow task",
    title: "Focus on one real task.",
    body: "Map the repeat work, decide where a person checks, and shape an agent you can actually build.",
    checks: ["See how it works today", "Decide what the agent may see", "Agree what success looks like"],
  },
  {
    id: "team",
    label: "My whole team",
    title: "Get everyone on the same page.",
    body: "Give your team and leaders a simple way to judge agents, the risks, and when a person steps in.",
    checks: ["Agree who does what", "Make the safety checks clear", "Plan the rollout"],
  },
] as const;

export function ReadinessPanel() {
  const [activeId, setActiveId] = useState<(typeof startingPoints)[number]["id"]>("first");
  const active = startingPoints.find((item) => item.id === activeId) ?? startingPoints[0];

  return (
    <aside className="readiness-panel" aria-labelledby="readiness-title">
      <div className="panel-topline">
        <span className="status-dot" aria-hidden="true" />
        <span>Choose your starting point</span>
      </div>
      <h2 id="readiness-title" className="font-display text-h3 font-semibold">
        Choose the path that fits you.
      </h2>
      <div className="segmented-control" aria-label="Select your starting point">
        {startingPoints.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeId ? "is-active" : undefined}
            aria-pressed={item.id === activeId}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="readiness-output" aria-live="polite">
        <p className="eyebrow">Recommended focus</p>
        <h3 className="font-display text-h3 font-semibold">{active.title}</h3>
        <p>{active.body}</p>
        <ul className="check-list">
          {active.checks.map((item) => (
            <li key={item}>
              <span aria-hidden="true">◆</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="panel-note">A guide only, not an automatic recommendation.</p>
    </aside>
  );
}

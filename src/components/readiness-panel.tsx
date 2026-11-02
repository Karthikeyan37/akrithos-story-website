"use client";

import { useState } from "react";

const startingPoints = [
  {
    id: "first",
    label: "My first agent",
    title: "Start from the foundations.",
    body: "Learn the decisions behind a useful agent, build each layer live, and keep the working templates.",
    checks: ["Define the job", "Ground the knowledge", "Test the handoff"],
  },
  {
    id: "workflow",
    label: "One stubborn workflow",
    title: "Bring a real process into focus.",
    body: "Use the cohort method to map repeated work, identify the control points, and shape a buildable agent workflow.",
    checks: ["Map the baseline", "Choose the boundary", "Set acceptance evidence"],
  },
  {
    id: "team",
    label: "A team rollout",
    title: "Create a shared operating language.",
    body: "Give operators and decision-makers a practical way to evaluate agents, risks, and human escalation together.",
    checks: ["Align roles", "Expose controls", "Plan adoption"],
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
        Make the path fit the work.
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
      <p className="panel-note">Illustrative guidance, not an automated recommendation.</p>
    </aside>
  );
}

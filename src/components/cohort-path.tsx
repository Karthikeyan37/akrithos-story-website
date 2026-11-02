"use client";

import { useState } from "react";

const stages = [
  {
    number: "01",
    label: "Map",
    title: "Choose work worth improving.",
    body: "Start with the repeated task, the person responsible, and the number that should move.",
    output: "A bounded workflow and success measure",
  },
  {
    number: "02",
    label: "Ground",
    title: "Give the agent reliable context.",
    body: "Organize the knowledge, rules, and examples the system needs before it can make a useful move.",
    output: "A traceable source and decision layer",
  },
  {
    number: "03",
    label: "Control",
    title: "Design the human handoff.",
    body: "Define what the agent may do, when it must stop, and how an operator reviews the result.",
    output: "Visible boundaries and escalation points",
  },
  {
    number: "04",
    label: "Ship",
    title: "Turn the lesson into a working system.",
    body: "Test against acceptance evidence, document the operating path, and carry the reusable assets forward.",
    output: "A tested build path and reusable templates",
  },
] as const;

export function CohortPath() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <div className="path-shell">
      <div className="path-controls" role="tablist" aria-label="Four-stage cohort path">
        {stages.map((item, index) => (
          <button
            key={item.number}
            id={`stage-${item.number}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="stage-panel"
            className={active === index ? "is-active" : undefined}
            onClick={() => setActive(index)}
          >
            <span>{item.number}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="stage-panel"
        className="path-output"
        role="tabpanel"
        aria-labelledby={`stage-${stage.number}`}
        tabIndex={0}
      >
        <div className="path-index">{stage.number}</div>
        <div>
          <p className="eyebrow">Current stage · {stage.label}</p>
          <h3 className="font-display text-h2 font-semibold">{stage.title}</h3>
          <p className="path-body">{stage.body}</p>
          <div className="output-chip">
            <span>Output</span>
            <strong>{stage.output}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

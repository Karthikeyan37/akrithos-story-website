"use client";

import { useState } from "react";

const models = [
  {
    id: "agents",
    label: "Agents for every seat",
    shortLabel: "Agents",
    result: "Revenue and efficiency",
    body: "Always-on voice, chat, pipeline, executive, and operations agents that hand work to people at the right moment.",
    stages: [
      ["Signal", "A repeated request enters the system"],
      ["Agent work", "The request is prepared within its boundary"],
      ["Human handoff", "A person takes over at the decision point"],
    ],
    proof: "Response and handoff trace",
  },
  {
    id: "knowledge",
    label: "Captured intelligence",
    shortLabel: "Knowledge",
    result: "Knowledge at scale",
    body: "Grounded knowledge systems and digital twins that make institutional experience available without interrupting experts.",
    stages: [
      ["Source", "Approved knowledge is selected"],
      ["Grounded answer", "The response stays tied to that source set"],
      ["Owner review", "An accountable person resolves exceptions"],
    ],
    proof: "Retrieval and source trace",
  },
  {
    id: "deployment",
    label: "Secure deployment",
    shortLabel: "Deployment",
    result: "Control and resilience",
    body: "Regional, on-premises, and hybrid deployments designed around jurisdiction, resilience, and data-sovereignty requirements.",
    stages: [
      ["Requirement", "Jurisdiction and resilience are defined"],
      ["Runtime", "The approved deployment path is applied"],
      ["Escalation", "Exceptions follow a visible human path"],
    ],
    proof: "Deployment and review record",
  },
] as const;

type ModelId = (typeof models)[number]["id"];

export function OutcomeStage() {
  const [activeId, setActiveId] = useState<ModelId>("agents");
  const active = models.find((model) => model.id === activeId) ?? models[0];

  return (
    <div className="outcome-stage">
      <div className="outcome-selector" role="tablist" aria-label="Choose an operating outcome">
        {models.map((model, index) => (
          <button
            key={model.id}
            type="button"
            role="tab"
            aria-selected={activeId === model.id}
            aria-label={`${model.label}: ${model.result}`}
            aria-controls="outcome-model"
            id={`outcome-tab-${model.id}`}
            onClick={() => setActiveId(model.id)}
            className={activeId === model.id ? "is-active" : undefined}
          >
            <span>0{index + 1}</span>
            <strong><span className="outcome-label-full">{model.label}</span><span className="outcome-label-short">{model.shortLabel}</span></strong>
            <small>{model.result}</small>
          </button>
        ))}
      </div>

      <div
        key={active.id}
        id="outcome-model"
        role="tabpanel"
        aria-labelledby={`outcome-tab-${active.id}`}
        className="outcome-model"
      >
        <div className="outcome-model-heading">
          <div>
            <p className="font-mono text-overline uppercase text-bronze">Operating model · illustrative</p>
            <h3 className="mt-3 text-h3 font-semibold">{active.label}</h3>
          </div>
          <span>{active.result}</span>
        </div>
        <p className="mt-4 max-w-copy text-label leading-6 text-stone-100">{active.body}</p>

        <ol className="outcome-flow" aria-label={`${active.label} illustrative flow`}>
          {active.stages.map(([title, detail], index) => (
            <li key={title}>
              <span className="outcome-flow-index">0{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
              {index < active.stages.length - 1 ? <span className="outcome-flow-connector" aria-hidden="true"><i /></span> : null}
            </li>
          ))}
        </ol>

        <div className="outcome-proof">
          <span aria-hidden="true">✓</span>
          <div>
            <p>Evidence to inspect</p>
            <strong>{active.proof}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

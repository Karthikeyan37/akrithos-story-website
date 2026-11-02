"use client";

import { useState } from "react";

import { useBooking } from "@/components/booking-provider";

const stages = [
  {
    name: "Automated",
    obstacle: "Manual work",
    prompt: "Where should the first automation begin?",
    choices: ["The workflow with a measurable bottleneck", "Every workflow at the same time"],
    correct: 0,
    unlock: "Repeatable work handled",
  },
  {
    name: "Captured",
    obstacle: "Knowledge trapped",
    prompt: "What makes institutional knowledge usable?",
    choices: ["A generic model with no source boundary", "Approved sources with ownership and review"],
    correct: 1,
    unlock: "Knowledge made queryable",
  },
  {
    name: "Secured",
    obstacle: "Deployment risk",
    prompt: "What comes before production access?",
    choices: ["Defined data boundaries and escalation policy", "A public prototype connected to live data"],
    correct: 0,
    unlock: "Deployment controls applied",
  },
  {
    name: "Productized",
    obstacle: "Expertise cannot scale",
    prompt: "How does expertise become an operating system?",
    choices: ["Keep decisions informal", "Encode the workflow, evidence, controls, and handoffs"],
    correct: 1,
    unlock: "Expertise made scalable",
  },
] as const;

export function MaturityRun() {
  const { openBooking } = useBooking();
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [penalties, setPenalties] = useState(0);
  const current = stages[stage];
  const complete = cleared.length === stages.length;
  const correct = selected === current?.correct;
  const score = cleared.length * 250 - penalties * 50;

  function start() {
    setStarted(true);
    setStage(0);
    setCleared([]);
    setSelected(null);
    setPenalties(0);
  }

  function choose(choice: number) {
    if (selected !== null || complete) return;
    setSelected(choice);
    if (choice !== current.correct) setPenalties((value) => value + 1);
  }

  function advance() {
    if (!correct) {
      setSelected(null);
      return;
    }
    const nextCleared = [...cleared, current.name];
    setCleared(nextCleared);
    setSelected(null);
    if (nextCleared.length < stages.length) setStage((value) => value + 1);
  }

  return (
    <section id="gauntlet" className="section scroll-mt-header bg-stone-50">
      <div className="mx-auto max-w-content">
        <header className="maturity-heading">
          <div>
            <p className="eyebrow">Your path · four decisions</p>
            <h2 className="mt-3 max-w-copy text-h2 font-semibold">See an AI operating model take shape.</h2>
          </div>
          <div className="maturity-score" aria-label="Maturity exercise progress">
            <span><small>Score</small><strong>{Math.max(0, score)}</strong></span>
            <span><small>Progress</small><strong>{cleared.length}/4</strong></span>
          </div>
        </header>

        <ol className="maturity-track" aria-label="Four-stage AI maturity path">
          {stages.map((item, index) => {
            const done = cleared.includes(item.name);
            const active = index === stage && started && !complete;
            return (
              <li key={item.name} className={done ? "is-cleared" : active ? "is-current" : undefined}>
                <span>0{index + 1}</span>
                <i aria-hidden="true">{done ? "✓" : ""}</i>
                <strong>{item.name}</strong>
                <small>{item.obstacle}</small>
              </li>
            );
          })}
        </ol>

        <div className="maturity-decision">
          {!started ? (
            <div className="maturity-state">
              <p className="eyebrow">Illustrative exercise</p>
              <h3>Make the first call.</h3>
              <p>No business data is used. Each choice reveals a stronger operating capability.</p>
              <button type="button" onClick={start} className="button button-primary">Start the run</button>
            </div>
          ) : complete ? (
            <div aria-live="polite" className="maturity-state">
              <p className="eyebrow">Operating model unlocked</p>
              <h3>You cleared the path from manual to productized.</h3>
              <p>The Diagnostic applies this sequence to one real workflow.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={openBooking} className="button button-primary">Turn this into my plan</button>
                <button type="button" onClick={start} className="button button-secondary">Run again</button>
              </div>
            </div>
          ) : (
            <div aria-live="polite" className="maturity-state">
              <p className="font-mono text-overline uppercase text-bronze">Stage 0{stage + 1} · {current.name}</p>
              <h3>{current.prompt}</h3>
              <div className="maturity-choices">
                {current.choices.map((choice, index) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => choose(index)}
                    disabled={selected !== null}
                    className={selected === index ? (index === current.correct ? "is-correct" : "is-risky") : undefined}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {choice}
                  </button>
                ))}
              </div>
              {selected !== null ? (
                <div className="maturity-result">
                  <p>{correct ? `Unlocked · ${current.unlock}` : "That path adds avoidable risk."}</p>
                  <button type="button" onClick={advance} className="button button-primary">{correct ? "Next stage" : "Try again"}</button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

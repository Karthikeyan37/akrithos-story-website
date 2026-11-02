"use client";

import { useState } from "react";

const modes = [
  { id: "lead", label: "Lead qualification" },
  { id: "knowledge", label: "Grounded knowledge" },
  { id: "exception", label: "Exception workflow" },
] as const;

type Mode = (typeof modes)[number]["id"];

export function AgentSandbox() {
  const [mode, setMode] = useState<Mode>("lead");
  const [leadRun, setLeadRun] = useState(false);
  const [question, setQuestion] = useState("deployment");
  const [answerRun, setAnswerRun] = useState(false);
  const [scenario, setScenario] = useState("invoice");
  const [exceptionRun, setExceptionRun] = useState(false);

  function selectMode(next: Mode) {
    setMode(next);
  }

  return (
    <section id="sandbox" className="section scroll-mt-header bg-ink text-paper">
      <div className="mx-auto max-w-content">
        <p className="eyebrow text-bronze">Interactive sandbox · illustrative</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
          <div>
            <h2 className="max-w-copy text-h2 font-semibold text-paper">Try an agent workflow.</h2>
            <p className="mt-5 max-w-copy text-lead text-stone-400">Run a contained business exception through detect, diagnose, act, and human escalation. Nothing leaves this page.</p>
          </div>
          <p className="border-l border-bronze pl-5 text-stone-400">A credible workflow makes its inputs, evidence, controls, and review path inspectable.</p>
        </div>

        <div className="mt-7 overflow-hidden rounded-feature border border-stone-600">
          <div className="grid sm:grid-cols-3" role="tablist" aria-label="Agent sandbox mode">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={mode === item.id}
                onClick={() => selectMode(item.id)}
                className={`border-b border-stone-600 px-5 py-4 text-left font-semibold sm:border-r ${mode === item.id ? "bg-terracotta text-paper" : "bg-ink text-stone-400 hover:text-paper"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-card bg-paper p-5 text-ink sm:p-6" role="tabpanel">
              {mode === "lead" ? (
                <>
                  <p className="font-mono text-overline uppercase text-terracotta">Inbound voicemail</p>
                  <blockquote className="mt-4 border-l border-bronze pl-4 text-lead leading-8">“We need to automate invoice approvals across three entities before our next reporting cycle. Our CFO is sponsoring it. Can someone call this week?”</blockquote>
                  <button type="button" onClick={() => setLeadRun(true)} className="button button-primary mt-6">Run agent</button>
                  <div className="mt-5 rounded-card bg-stone-50 p-5" aria-live="polite">
                    <p className="font-semibold">Qualification output</p>
                    {leadRun ? (
                      <dl className="mt-4 grid gap-3 text-label sm:grid-cols-2">
                        <div><dt className="text-stone-600">Need</dt><dd className="font-semibold">Invoice approval automation</dd></div>
                        <div><dt className="text-stone-600">Scope</dt><dd className="font-semibold">Three entities</dd></div>
                        <div><dt className="text-stone-600">Sponsor</dt><dd className="font-semibold">CFO</dd></div>
                        <div><dt className="text-stone-600">Next action</dt><dd className="font-semibold">Human scoping call</dd></div>
                      </dl>
                    ) : <p className="mt-3 text-stone-600">Awaiting input. Run the agent to structure the request.</p>}
                  </div>
                </>
              ) : null}

              {mode === "knowledge" ? (
                <>
                  <label htmlFor="knowledge-question" className="font-mono text-overline uppercase text-terracotta">Select question</label>
                  <select id="knowledge-question" value={question} onChange={(event) => { setQuestion(event.target.value); setAnswerRun(false); }} className="mt-4 min-h-7 w-full rounded-control border border-stone-400 bg-paper px-4">
                    <option value="deployment">How can the system be deployed?</option>
                    <option value="diagnostic">What happens in The Diagnostic?</option>
                    <option value="handoff">When does an agent hand off?</option>
                  </select>
                  <button type="button" onClick={() => setAnswerRun(true)} className="button button-primary mt-5">Generate answer</button>
                  <div className="mt-5 rounded-card bg-stone-50 p-5" aria-live="polite">
                    <p className="font-semibold">Grounded response</p>
                    <p className="mt-3 text-stone-600">
                      {answerRun
                        ? question === "deployment" ? "Deployment can be regional, on-premises, or hybrid, subject to the agreed jurisdiction and data boundary." : question === "diagnostic" ? "The Diagnostic defines the workflow baseline, target metric, data boundary, acceptance criteria, and review path before a build is approved." : "The workflow hands work to a person at a defined confidence, policy, or approval boundary."
                        : "Awaiting question. Select a question and run the agent."}
                    </p>
                  </div>
                </>
              ) : null}

              {mode === "exception" ? (
                <>
                  <label htmlFor="exception-scenario" className="font-mono text-overline uppercase text-terracotta">Business exception</label>
                  <select id="exception-scenario" value={scenario} onChange={(event) => { setScenario(event.target.value); setExceptionRun(false); }} className="mt-4 min-h-7 w-full rounded-control border border-stone-400 bg-paper px-4">
                    <option value="invoice">Invoice exceeds approval threshold</option>
                    <option value="booking">High-value booking is incomplete</option>
                    <option value="route">Regional data route is unavailable</option>
                  </select>
                  <button type="button" onClick={() => setExceptionRun(true)} className="button button-primary mt-5">Run workflow</button>
                  <div className="mt-5 rounded-card bg-stone-50 p-5" aria-live="polite">
                    <p className="font-semibold">Execution trace</p>
                    {exceptionRun ? (
                      <ol className="mt-4 space-y-3 text-label">
                        {[
                          `Detect · ${scenario === "invoice" ? "Approval threshold exceeded" : scenario === "booking" ? "Required booking data missing" : "Primary regional route unavailable"}`,
                          "Diagnose · Check the applicable policy and evidence",
                          "Act · Hold the automated action safely",
                          "Escalate · Route to the named human owner",
                        ].map((item) => <li key={item} className="border-l border-terracotta pl-3">{item}</li>)}
                      </ol>
                    ) : <p className="mt-3 text-stone-600">Awaiting scenario.</p>}
                  </div>
                </>
              ) : null}
            </div>

            <div>
              <p className="font-mono text-overline uppercase text-bronze">Evaluator checklist</p>
              <h3 className="mt-3 text-h3 font-semibold text-paper">What to verify in each run.</h3>
              <ol className="mt-5 space-y-3">
                {[
                  ["01", "Input is explicit", "The request or exception is visible before execution."],
                  ["02", "Basis is exposed", "The output shows rationale, source, or policy context."],
                  ["03", "Handoff is deliberate", "Human review appears at a defined boundary."],
                  ["04", "Trace is reviewable", "The sequence can be inspected after the run."],
                ].map(([number, title, body]) => (
                  <li key={number} className="rounded-card border border-stone-600 p-4">
                    <p className="font-mono text-overline text-bronze">{number}</p>
                    <p className="mt-2 font-semibold">{title}</p>
                    <p className="mt-2 text-label text-stone-400">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

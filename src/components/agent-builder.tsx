"use client";

import { useState } from "react";

type Plan = {
  demo?: boolean;
  summary: string;
  likelyInputs: string[];
  proposedStages: string[];
  humanReviewPoint: string;
  clarifyingQuestions: string[];
  diagnosticFocus: string;
};

const MAX_LENGTH = 600;

const workflowStarters = [
  ["New enquiries", "Leads", "A new website enquiry from someone ready to buy needs to reach the right salesperson quickly, with all the details."],
  ["Invoice approval", "Invoice", "Invoices over an agreed amount need the right person to approve them before they are due."],
  ["Policy questions", "Policy", "Staff need clear answers from our approved policies, and anything unclear should go to the person who owns that policy."],
] as const;

export function AgentBuilder() {
  const [workflow, setWorkflow] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (workflow.trim().length < 5) {
      setError("Describe the task in a sentence or two first.");
      return;
    }

    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workflow }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
      } else {
        setPlan(data);
      }
    } catch {
      setError("Couldn't reach the preview. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function applyStarter(prompt: string) {
    setWorkflow(prompt);
    setPlan(null);
    setError("");
  }

  return (
    <div className="rounded-feature border border-stone-100 bg-paper p-4 sm:p-7" aria-live="polite">
      <p className="font-mono text-overline uppercase text-terracotta">Agent plan preview</p>
      <p className="mt-3 hidden text-h3 font-semibold sm:block">Turn one repeat task into a simple starting plan.</p>
      <p className="mt-3 rounded-card bg-stone-50 p-3 text-label text-stone-600">
        Please use general examples only: no customer details, passwords, health information or anything confidential.
      </p>

      <div className="mt-5" role="group" aria-label="Safe workflow starting points">
        <p className="font-mono text-overline uppercase text-bronze">Start with an example</p>
        <p className="mt-2 text-label text-stone-600">Choose one to prefill the description.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {workflowStarters.map(([label, shortLabel, prompt]) => (
            <button
              key={label}
              type="button"
              onClick={() => applyStarter(prompt)}
              aria-label={label}
              aria-pressed={workflow === prompt}
              className={`min-h-7 whitespace-nowrap rounded-control border px-1 py-2 text-micro font-semibold transition-colors sm:rounded-pill sm:px-4 sm:text-label ${workflow === prompt ? "border-terracotta bg-stone-50 text-terracotta" : "border-stone-100 bg-paper hover:border-terracotta hover:text-terracotta"}`}
            >
              <span aria-hidden="true">{workflow === prompt ? "✓ " : ""}</span>
              <span aria-hidden="true" className="sm:hidden">{shortLabel}</span>
              <span aria-hidden="true" className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <label htmlFor="workflow" className="text-label font-semibold">Describe a task your team repeats</label>
        <textarea
          id="workflow"
          value={workflow}
          onChange={(e) => setWorkflow(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="e.g. Big invoices need approval, but nobody notices until they are overdue"
          rows={3}
          maxLength={MAX_LENGTH}
          className="mt-2 w-full resize-none rounded-control border border-stone-100 p-3 text-label focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        {error && (
          <p className="mt-2 text-label text-terracotta" role="alert">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-label text-stone-600">{workflow.length}/{MAX_LENGTH} characters</p>
          <button type="submit" disabled={loading} className="button button-primary disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Generating…" : "Generate the preview"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 rounded-card bg-stone-50 p-5 text-label text-stone-600">
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-pill bg-terracotta animate-pulse" />
            Drafting the preview…
          </p>
        </div>
      )}

      {!loading && plan && (
        <div className="mt-6 rounded-card bg-stone-50 p-5 text-label">
          <p className="uppercase tracking-wide text-bronze">
            {plan.demo ? "Illustrative example" : "AI-generated draft"}
          </p>
          <p className="mt-2 text-ink font-semibold">{plan.summary}</p>

          <p className="mt-4 font-semibold">What the agent needs</p>
          <ul className="mt-1 space-y-1 text-stone-600">
            {plan.likelyInputs.map((i) => (
              <li key={i}>· {i}</li>
            ))}
          </ul>

          <p className="mt-4 font-semibold">Steps</p>
          <ol className="mt-1 space-y-1 text-stone-600">
            {plan.proposedStages.map((s, idx) => (
              <li key={s}>{idx + 1}. {s}</li>
            ))}
          </ol>

          <p className="mt-4 font-semibold">Where a person checks</p>
          <p className="text-stone-600">{plan.humanReviewPoint}</p>

          <p className="mt-4 font-semibold">Questions we would ask you</p>
          <ul className="mt-1 space-y-1 text-stone-600">
            {plan.clarifyingQuestions.map((q) => (
              <li key={q}>· {q}</li>
            ))}
          </ul>

          <p className="mt-4 text-terracotta">→ To look at in the Diagnostic: {plan.diagnosticFocus}</p>
        </div>
      )}
    </div>
  );
}

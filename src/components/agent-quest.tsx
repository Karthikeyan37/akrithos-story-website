"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBooking } from "@/components/booking-provider";
import { integrations } from "@/config/integrations";
import { ROUNDS, score, type Answers, type Result } from "@/lib/quest";
import { saveLeadToken, track } from "@/lib/track";

const XP_PER_ROUND = 15;
const SYSTEMS = ["Revenue agent", "Knowledge copilot", "Operations control", "Service agent"] as const;

function openAssistant(prefill?: string) {
  window.dispatchEvent(new CustomEvent("akrithos:open-assistant", { detail: { prefill } }));
}

/** Agent Quest: seven questions as a short game, ending in a level, a first agent and a report by email. */
export function AgentQuest() {
  const { openBooking } = useBooking();
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ hours: 20 });
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const current = ROUNDS[round];
  const answered = Object.keys(picked).length;
  const xp = answered * XP_PER_ROUND + (done ? 30 : 0);
  const result: Result = useMemo(() => score(answers), [answers]);
  const agentIndex = answers.bottleneck ? result.agent?.index ?? -1 : -1;
  const value = current.kind === "choice" ? answers[current.id] : undefined;
  const insight = current.kind === "choice" ? current.choices.find((c) => c.id === value)?.insight : picked[round]
    ? `That is about ${((answers.hours ?? 0) * 48).toLocaleString("en-US")} hours a year. If even a third of it is repeat work, an agent can take it on.`
    : undefined;

  // Started from the hero: question one arrives already answered, with its insight showing.
  useEffect(() => {
    const onStart = (e: Event) => {
      const id = (e as CustomEvent<{ choiceId?: string }>).detail?.choiceId;
      const first = ROUNDS[0];
      setDone(false);
      setRound(0);
      if (id && first.kind === "choice" && first.choices.some((c) => c.id === id)) {
        setAnswers((a) => ({ ...a, [first.id]: id }));
        setPicked((p) => ({ ...p, 0: true }));
        setFlash(`+${XP_PER_ROUND} XP · ${first.badge}`);
      }
      window.setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 450);
    };
    window.addEventListener("akrithos:quest-start", onStart);
    return () => window.removeEventListener("akrithos:quest-start", onStart);
  }, []);

  useEffect(() => { if (flash) { const t = window.setTimeout(() => setFlash(null), 1600); return () => window.clearTimeout(t); } }, [flash]);

  function choose(id: string) {
    if (current.kind !== "choice") return;
    const first = !picked[round];
    setAnswers((a) => ({ ...a, [current.id]: id }));
    setPicked((p) => ({ ...p, [round]: true }));
    if (first) setFlash(`+${XP_PER_ROUND} XP · ${current.badge}`);
    window.setTimeout(() => nextRef.current?.focus(), 30);
  }

  function setHours(n: number) {
    const first = !picked[round];
    setAnswers((a) => ({ ...a, hours: n }));
    setPicked((p) => ({ ...p, [round]: true }));
    if (first) setFlash(`+${XP_PER_ROUND} XP · ${current.badge}`);
  }

  function next() {
    if (round < ROUNDS.length - 1) {
      setRound(round + 1);
      window.setTimeout(() => headingRef.current?.focus(), 30);
    } else {
      setDone(true);
      const r = score(answers);
      try { localStorage.setItem("ak-quest", JSON.stringify({ level: r.level.name, agent: r.agent?.name, score: r.score, path: r.path })); } catch { /* storage unavailable */ }
      window.dispatchEvent(new CustomEvent("akrithos:quest-done"));
      window.setTimeout(() => document.getElementById("quest-result")?.focus(), 30);
    }
  }

  function replay() {
    setRound(0); setAnswers({ hours: 20 }); setPicked({}); setDone(false);
    track("replayed-quest");
    window.setTimeout(() => headingRef.current?.focus(), 30);
  }

  return (
    <div className="quest" data-done={done}>
      <div className="quest-card">
        <div className="quest-top">
          <span className="quest-round">{done ? "Quest complete" : `Round ${round + 1} of ${ROUNDS.length}`}</span>
          <span className="quest-xp" aria-label={`${xp} experience points`}><b>{xp}</b> XP</span>
        </div>
        <div className="quest-progress" aria-hidden="true">
          {ROUNDS.map((r, i) => <i key={r.id} data-state={picked[i] ? "done" : i === round && !done ? "now" : "todo"} />)}
        </div>

        {!done ? (
          <div className="quest-body">
            <h3 ref={headingRef} tabIndex={-1} id="quest-prompt" className="quest-prompt">{current.prompt}</h3>
            {current.kind === "choice" ? (
              <div className="quest-choices" role="group" aria-labelledby="quest-prompt">
                {current.choices.map((c) => (
                  <button key={c.id} type="button" className="quest-choice" aria-pressed={value === c.id} onClick={() => choose(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="quest-range">
                <label htmlFor="quest-hours" className="quest-hours">
                  <b>{answers.hours}</b> hours a week
                </label>
                <input id="quest-hours" type="range" min={current.min} max={current.max} step={current.step} value={answers.hours ?? current.initial}
                  onChange={(e) => setHours(Number(e.target.value))} aria-valuetext={`${answers.hours} hours a week`} />
                <div className="quest-range-scale" aria-hidden="true"><span>{current.min}</span><span>{current.max}+</span></div>
              </div>
            )}
            <p className="quest-insight" aria-live="polite">{insight ?? " "}</p>
            <div className="quest-actions">
              {round > 0 ? <button type="button" className="button button-ghost" onClick={() => { setRound(round - 1); window.setTimeout(() => headingRef.current?.focus(), 30); }}>Back</button> : <span />}
              {/* autocomplete="off" stops Firefox restoring the enabled state on reload, which broke hydration and let an empty round through. React's types omit it on buttons, hence the spread. */}
              <button ref={nextRef} type="button" className="button button-primary" disabled={!picked[round]} {...{ autoComplete: "off" }} onClick={next}>
                {round === ROUNDS.length - 1 ? "Reveal my result" : "Next round"}
              </button>
            </div>
          </div>
        ) : (
          <QuestResult result={result} answers={answers} onBook={() => { track("opened-booking"); openBooking(); }} onReplay={replay} />
        )}
        {flash ? <p className="quest-flash" role="status">{flash}</p> : null}
      </div>

      <aside className="quest-map" aria-label="Your agent map">
        <p className="quest-map-title">Your agent map</p>
        <svg viewBox="-120 -110 240 220" className="quest-map-svg" aria-hidden="true">
          <circle r="88" className="quest-orbit" />
          <circle r="58" className="quest-orbit" />
          {SYSTEMS.map((name, i) => {
            const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
            const x = Math.cos(a) * 88, y = Math.sin(a) * 88;
            const on = agentIndex === i;
            return (
              <g key={name} className="quest-node" data-on={on}>
                <line x1="0" y1="0" x2={x} y2={y} />
                <circle cx={x} cy={y} r={on ? 11 : 7} />
              </g>
            );
          })}
          <path d="M-22 18 0 -26 22 18 13 18 0 -8 -13 18Z" className="quest-peak" />
        </svg>
        <p className="quest-map-agent">{agentIndex >= 0 ? SYSTEMS[agentIndex] : "Answer to light up your first agent"}</p>
        <dl className="quest-meters">
          {([["Opportunity", result.meters.opportunity, picked[2]], ["Readiness", result.meters.readiness, picked[3]], ["Control", result.meters.control, picked[5]], ["Momentum", result.meters.momentum, picked[6]]] as const).map(([label, v, known]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd><span className="quest-meter"><i style={{ transform: `scaleX(${known ? v / 100 : 0})` }} /></span><b>{known ? v : "?"}</b></dd>
            </div>
          ))}
        </dl>
        <ul className="quest-badges" aria-label="Badges earned">
          {ROUNDS.map((r, i) => <li key={r.id} data-earned={Boolean(picked[i])}>{r.badge}</li>)}
        </ul>
      </aside>
    </div>
  );
}

function QuestResult({ result, answers, onBook, onReplay }: { result: Result; answers: Answers; onBook: () => void; onReplay: () => void }) {
  const c = 2 * Math.PI * 52;
  const ask = () => openAssistant(`I played Agent Quest and got ${result.level.name}, with ${result.agent?.name ?? "an agent"} as my first agent. What would that look like for us?`);
  return (
    <div className="quest-result" id="quest-result" tabIndex={-1}>
      <div className="quest-score">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="quest-score-track" />
          <circle cx="60" cy="60" r="52" className="quest-score-fill" strokeDasharray={`${(result.score / 100) * c} ${c}`} />
        </svg>
        <div><b>{result.score}</b><span>out of 100</span></div>
      </div>
      <p className="quest-level-label">Your level</p>
      <h3 className="quest-level">{result.level.name}</h3>
      <p className="quest-level-line">{result.level.line}</p>

      {result.agent ? (
        <div className="quest-agent">
          <p className="quest-agent-label">Your first agent</p>
          <h4>{result.agent.name}</h4>
          <p>{result.agent.does}</p>
          <p className="quest-agent-decides"><span aria-hidden="true">◆</span> {result.agent.decides}</p>
        </div>
      ) : null}
      <p className="quest-hours-at-stake">
        From your estimate, about <b>{result.hoursPerYear.toLocaleString("en-US")} hours a year</b> go into this work. In the Diagnostic, we work out how much of it an agent can take on.
      </p>

      <div className="quest-next">
        {result.path === "diagnostic" ? (
          <button type="button" className="button button-primary" onClick={onBook}>Book your Diagnostic</button>
        ) : result.path === "blueprint" ? (
          <a className="button button-primary" href="#live-agent">Sketch your agent in the planner</a>
        ) : (
          <a className="button button-primary" href={integrations.trainingUrl} onClick={() => track("viewed-training")}>Learn to build agents live</a>
        )}
        <button type="button" className="button button-ghost" onClick={ask}>Ask the guide about this</button>
      </div>

      <ReportForm answers={answers} />
      <button type="button" className="quest-replay" onClick={onReplay}>Play again with another workflow</button>
    </div>
  );
}

function ReportForm({ answers }: { answers: Answers }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "preview">("idle");
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "quest", firstName: f.get("firstName"), email: f.get("email"), company: f.get("company"), consent: f.get("consent") === "on", website: f.get("website"), answers }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; field?: string; preview?: boolean; token?: string };
      if (!res.ok || !data.ok) {
        setError({ text: data.error ?? "That did not go through. Please try again.", field: data.field });
        setState("idle");
        if (data.field) (form.elements.namedItem(data.field) as HTMLElement | null)?.focus();
        return;
      }
      saveLeadToken(data.token, String(f.get("firstName") ?? ""));
      setName(String(f.get("firstName") ?? ""));
      setState(data.preview ? "preview" : "sent");
    } catch {
      setError({ text: "We could not reach the server. Check your connection and try again." });
      setState("idle");
    }
  }

  if (state === "sent" || state === "preview") {
    return (
      <div className="quest-sent" role="status">
        <b>On its way{name ? `, ${name}` : ""}.</b>{" "}
        {state === "sent" ? "Your full report will be in your inbox in a minute." : "Preview mode: once GoHighLevel is connected, this saves the contact and starts the report email."}
      </div>
    );
  }

  return (
    <form className="quest-form" onSubmit={submit} noValidate>
      <p className="quest-form-title">Get the full report by email</p>
      <p className="quest-form-sub">Your answers, your first agent in detail, and the three questions to settle before you build.</p>
      <div className="quest-form-grid">
        <label><span>First name</span><input name="firstName" autoComplete="given-name" required maxLength={60} aria-invalid={error?.field === "firstName"} /></label>
        <label><span>Work email</span><input name="email" type="email" autoComplete="email" spellCheck={false} required maxLength={254} aria-invalid={error?.field === "email"} /></label>
        <label className="quest-form-wide"><span>Company <i>(optional)</i></span><input name="company" autoComplete="organization" maxLength={80} /></label>
        <label className="quest-honey" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="quest-consent">
        <input type="checkbox" name="consent" aria-invalid={error?.field === "consent"} />
        <span>Send me my report and occasional ideas from Akrithos. Unsubscribe any time.</span>
      </label>
      {error ? <p className="quest-error" role="alert">{error.text}</p> : null}
      <button type="submit" className="button button-primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my report"}</button>
    </form>
  );
}

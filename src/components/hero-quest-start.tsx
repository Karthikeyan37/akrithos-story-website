"use client";

import { ROUNDS } from "@/lib/quest";

const first = ROUNDS[0];

/** Starts Agent Quest on the first screen: one tap answers question one and carries on in the full quest below. */
export function startQuest(choiceId?: string) {
  window.dispatchEvent(new CustomEvent("akrithos:quest-start", { detail: { choiceId } }));
  const quest = document.getElementById("quest");
  quest?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function HeroQuestStart() {
  if (first.kind !== "choice") return null;
  return (
    <div className="hero-quest" role="group" aria-labelledby="hero-quest-prompt">
      <div className="hero-quest-card">
        <p className="hero-quest-top"><span>Agent Quest</span><span>Question 1 of {ROUNDS.length}</span></p>
        <p id="hero-quest-prompt" className="hero-quest-prompt">{first.prompt}</p>
        <div className="hero-quest-choices">
          {first.choices.map((c) => (
            <button key={c.id} type="button" className="hero-quest-choice" onClick={() => startQuest(c.id)}>{c.label}</button>
          ))}
        </div>
        <p className="hero-quest-note">Takes 2 minutes. No sign-up.</p>
      </div>
    </div>
  );
}

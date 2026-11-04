"use client";

import { ROUNDS } from "@/lib/quest";

const first = ROUNDS[0];

/** Starts Agent Quest from the end of the story: one tap answers question one and carries on in the full quest below. */
export function startQuest(choiceId?: string) {
  window.dispatchEvent(new CustomEvent("akrithos:quest-start", { detail: { choiceId } }));
  const quest = document.getElementById("quest");
  quest?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function QuestStart() {
  if (first.kind !== "choice") return null;
  return (
    <div className="quest-start" role="group" aria-labelledby="quest-start-prompt">
      <div className="quest-start-card">
        <p className="quest-start-top"><span>Agent Quest</span><span>Question 1 of {ROUNDS.length}</span></p>
        <p id="quest-start-prompt" className="quest-start-prompt">{first.prompt}</p>
        <div className="quest-start-choices">
          {first.choices.map((c) => (
            <button key={c.id} type="button" className="quest-start-choice" onClick={() => startQuest(c.id)}>{c.label}</button>
          ))}
        </div>
        <p className="quest-start-note">Takes 2 minutes. No sign-up.</p>
      </div>
    </div>
  );
}

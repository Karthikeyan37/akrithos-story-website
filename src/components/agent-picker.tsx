"use client";

import { systems } from "./product-showcase";
import { focusAgent, showSystem } from "./world/world-stage";

/**
 * Four still buttons for the four agents. Hovering or focusing one lights its orbit in the 3D scene; pressing it
 * opens that agent in the showcase. (The labels floating in the scene move, so they are markers, not targets.)
 */
export function AgentPicker() {
  return (
    <div className="agent-picker" role="group" aria-label="Pick an agent to see how it works">
      {systems.map((system, i) => (
        <button
          key={system.id}
          type="button"
          className="agent-pick"
          onPointerEnter={() => focusAgent(i)}
          onPointerLeave={() => focusAgent(null)}
          onFocus={() => focusAgent(i)}
          onBlur={() => focusAgent(null)}
          onClick={() => showSystem(i)}
        >
          <strong>{system.plain}</strong>
          <span>{system.short}</span>
        </button>
      ))}
    </div>
  );
}

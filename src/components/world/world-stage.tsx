"use client";

import { useEffect, useRef, useState } from "react";
import type { World } from "./engine";

export const AGENTS = [
  { name: "Revenue agent", tab: /Revenue agent/ },
  { name: "Knowledge copilot", tab: /Knowledge copilot/ },
  { name: "Operations control", tab: /Operations control/ },
  { name: "Service agent", tab: /Service agent/ },
] as const;

/** Opens the matching system in the showcase below. */
export function showSystem(index: number) {
  const section = document.getElementById("platform");
  if (!section) return;
  // Land on the agent tabs, not the section heading, so the chosen agent's work is what fills the screen.
  const tabs = section.querySelector<HTMLElement>('[role="tablist"]') ?? section;
  tabs.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const tab = Array.from(section.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((t) => AGENTS[index]?.tab.test(t.textContent ?? ""));
  window.setTimeout(() => tab?.click(), 350);
}

/** Lights up one agent's orbit (or none) from anywhere on the page, such as the agent buttons in the story. */
export function focusAgent(index: number | null) {
  window.dispatchEvent(new CustomEvent("akrithos:agent-focus", { detail: index }));
}

/**
 * The fixed 3D layer behind the opening story. The story may be split into several `.story` sections (the hero, then
 * the chapters after Agent Quest); they share one camera path and the world rests whenever none of them is on screen. The poster (pure CSS and SVG) is always there first; the WebGL
 * world fades in over it when ready, and the poster stays if WebGL is missing or fails.
 */
export function WorldStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<Array<HTMLElement | null>>([]);
  const worldRef = useRef<World | null>(null);
  const [state, setState] = useState<"poster" | "ready" | "failed">("poster");
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stories = Array.from(document.querySelectorAll<HTMLElement>("main .story"));
    if (!canvas || !stories.length) return;
    let cancelled = false;
    const lite = window.matchMedia("(max-width: 768px), (hover: none)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const probe = document.createElement("canvas");
    const supported = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
    if (!supported) { queueMicrotask(() => setState("failed")); return; }

    const chapters = () => stories.flatMap((s) => Array.from(s.querySelectorAll<HTMLElement>("[data-chapter]")));
    const progress = () => {
      const list = chapters();
      if (!list.length) return 0;
      const mid = window.innerHeight * 0.5;
      // Which chapter's middle the screen's middle has passed, and how far towards the next.
      let p = 0;
      list.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const centre = r.top + r.height / 2;
        if (centre <= mid) p = i;
        const next = list[i + 1];
        if (next && centre <= mid) {
          const nr = next.getBoundingClientRect();
          const nc = nr.top + nr.height / 2;
          p = i + Math.max(0, Math.min(1, (mid - centre) / Math.max(1, nc - centre)));
        }
      });
      return Math.max(0, Math.min(list.length - 1, p));
    };

    let world: World | null = null;
    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; world?.setProgress(progress()); });
    };
    const onPointer = (e: PointerEvent) => world?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    const onScreen = new Set<Element>();
    const visible = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? onScreen.add(entry.target) : onScreen.delete(entry.target)));
      world?.setActive(onScreen.size > 0);
      document.documentElement.dataset.world = onScreen.size > 0 ? "on" : "off";
    }, { threshold: 0 });

    import("./engine").then(({ createWorld }) => {
      if (cancelled) return;
      try {
        world = createWorld(canvas, {
          lite,
          reduced,
          onLabels: (labels) => labels.forEach((l, i) => {
            const el = labelRefs.current[i];
            if (!el) return;
            el.style.transform = `translate(${Math.round(l.x)}px, ${Math.round(l.y)}px)`;
            el.dataset.visible = String(l.visible);
          }),
        });
      } catch {
        setState("failed");
        return;
      }
      worldRef.current = world;
      world.setProgress(progress());
      canvas.addEventListener("world-failed", () => setState("failed"), { once: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!lite && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });
      stories.forEach((s) => visible.observe(s));
      requestAnimationFrame(() => { if (!cancelled) { setState("ready"); document.body.dataset.world = "ready"; } });
    }).catch(() => setState("failed"));

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      visible.disconnect();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      world?.destroy();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => { worldRef.current?.focusAgent(focus); }, [focus]);
  useEffect(() => {
    const onFocus = (e: Event) => setFocus((e as CustomEvent<number | null>).detail);
    window.addEventListener("akrithos:agent-focus", onFocus);
    return () => window.removeEventListener("akrithos:agent-focus", onFocus);
  }, []);

  return (
    <div className="world" data-state={state} aria-hidden="false">
      <div className="world-poster" aria-hidden="true">
        <svg viewBox="-160 -150 320 300" className="world-poster-peak">
          <defs>
            <radialGradient id="poster-glow"><stop offset="0" stopColor="#E8714A" stopOpacity="0.55" /><stop offset="1" stopColor="#E8714A" stopOpacity="0" /></radialGradient>
          </defs>
          <circle r="150" fill="url(#poster-glow)" />
          <path d="M-62 48 0 -68 62 48 36 48 0 -18 -36 48Z" fill="#9C4A30" stroke="#E8714A" strokeWidth="1.5" />
        </svg>
      </div>
      <canvas ref={canvasRef} className="world-canvas" aria-hidden="true" />
      {/* Labels ride the moving orbits, so they are markers only. The still buttons in the story are what people press. */}
      <div className="world-labels" aria-hidden="true">
        {AGENTS.map((agent, i) => (
          <span key={agent.name} ref={(el) => { labelRefs.current[i] = el; }} className="world-label" data-visible="false" data-focus={focus === i}>
            <i />{agent.name}
          </span>
        ))}
        <span ref={(el) => { labelRefs.current[4] = el; }} className="world-label world-gate" data-visible="false"><i aria-hidden="true" />A person approves here</span>
      </div>
    </div>
  );
}

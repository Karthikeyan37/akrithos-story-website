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
  section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const tab = Array.from(section.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((t) => AGENTS[index]?.tab.test(t.textContent ?? ""));
  window.setTimeout(() => tab?.click(), 350);
}

/**
 * The fixed 3D layer behind the opening story. The poster (pure CSS and SVG) is always there first; the WebGL
 * world fades in over it when ready, and the poster stays if WebGL is missing or fails.
 */
export function WorldStage({ storyId = "top" }: { storyId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<Array<HTMLElement | null>>([]);
  const worldRef = useRef<World | null>(null);
  const [state, setState] = useState<"poster" | "ready" | "failed">("poster");
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const story = document.getElementById(storyId);
    if (!canvas || !story) return;
    let cancelled = false;
    const lite = window.matchMedia("(max-width: 768px), (hover: none)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const probe = document.createElement("canvas");
    const supported = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
    if (!supported) { queueMicrotask(() => setState("failed")); return; }

    const chapters = () => Array.from(story.querySelectorAll<HTMLElement>("[data-chapter]"));
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
    const visible = new IntersectionObserver(([entry]) => {
      world?.setActive(entry.isIntersecting);
      document.documentElement.dataset.world = entry.isIntersecting ? "on" : "off";
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
      visible.observe(story);
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
  }, [storyId]);

  useEffect(() => { worldRef.current?.focusAgent(focus); }, [focus]);

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
      <div className="world-labels" role="group" aria-label="The four kinds of agent">
        {AGENTS.map((agent, i) => (
          <button
            key={agent.name}
            ref={(el) => { labelRefs.current[i] = el; }}
            type="button"
            className="world-label"
            data-visible="false"
            onPointerEnter={() => setFocus(i)}
            onPointerLeave={() => setFocus(null)}
            onFocus={() => setFocus(i)}
            onBlur={() => setFocus(null)}
            onClick={() => showSystem(i)}
          >
            <i aria-hidden="true" />{agent.name}
          </button>
        ))}
        <span ref={(el) => { labelRefs.current[4] = el; }} className="world-label world-gate" data-visible="false"><i aria-hidden="true" />A person approves here</span>
      </div>
    </div>
  );
}

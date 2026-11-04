"use client";

import { useEffect, useRef, useState } from "react";
import { storyPerson } from "@/config/story";
import { storyChapters, storyProgress } from "@/lib/story-progress";
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
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  tabs.scrollIntoView({ behavior, block: "start" });
  const tab = Array.from(section.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((t) => AGENTS[index]?.tab.test(t.textContent ?? ""));
  // Open the agent, then make sure we arrived: a smooth scroll can stop short if the page shifts on the way.
  window.setTimeout(() => {
    tab?.click();
    tabs.scrollIntoView({ behavior, block: "start" });
    // On a busy page (or a slow phone) the smooth scroll can stop short: once it settles, finish the jump.
    const settle = () => { const top = tabs.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight / 2) tabs.scrollIntoView({ block: "start" }); };
    window.addEventListener("scrollend", settle, { once: true });
    window.setTimeout(settle, 1500);
  }, 350);
}

/** Lights up one agent's orbit (or none) from anywhere on the page, such as the agent buttons in the story. */
export function focusAgent(index: number | null) {
  window.dispatchEvent(new CustomEvent("akrithos:agent-focus", { detail: index }));
}

/**
 * The fixed 3D layer behind the opening story. The story may be split into several `.story` sections (the hero, then
 * the chapters after it); they share one camera path and the world rests whenever none of them is on screen. The poster (pure CSS and SVG) is always there first; the WebGL
 * world fades in over it when ready, and the poster stays if WebGL is missing or fails.
 */
export function WorldStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const [state, setState] = useState<"poster" | "ready" | "failed">("poster");
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stories = Array.from(document.querySelectorAll<HTMLElement>("main .story"));
    if (!canvas || !stories.length) return;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) { queueMicrotask(() => setState("failed")); return; }
    // Without a graphics card, preparing the scene freezes the page for seconds: those computers keep the poster.
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ""));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (software) { queueMicrotask(() => setState("failed")); return; }
    // Phones and touch screens get the light version (no shadows or glow).
    const lite = window.matchMedia("(max-width: 768px), (hover: none)").matches;

    const progress = () => storyProgress(storyChapters());

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

    // Start the 3D once the page is idle, so the first taps and scrolls never wait for it.
    const idle = (fn: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
    new Promise<void>((resolve) => idle(resolve)).then(() => import("./engine")).then(({ createWorld }) => {
      if (cancelled) return;
      try {
        world = createWorld(canvas, {
          lite,
          reduced,
          people: storyPerson.frames,
          onReady: () => { if (!cancelled) { setState("ready"); document.body.dataset.world = "ready"; } },
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
      {/* Before the 3D is ready (or without it): a quiet warm glow, nothing that flashes up and disappears. */}
      <div className="world-poster" aria-hidden="true" />
      <canvas ref={canvasRef} className="world-canvas" aria-hidden="true" />
    </div>
  );
}

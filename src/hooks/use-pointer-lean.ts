"use client";

import { useEffect, type RefObject } from "react";

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Writes the pointer position as --lean-x / --lean-y (each -1..1) on the element, once per frame and without React
 * rerenders. CSS turns those into tilt and depth. Only fine pointers with full motion get it; everyone else keeps 0.
 * scope "window" leans toward the cursor anywhere on screen; "self" only while the pointer is over the element.
 */
export function usePointerLean<T extends HTMLElement>(ref: RefObject<T | null>, scope: "window" | "self" = "self") {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty("--lean-x", x.toFixed(3));
      el.style.setProperty("--lean-y", y.toFixed(3));
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(apply); };
    const move = (e: PointerEvent) => {
      const r = scope === "window" ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : el.getBoundingClientRect();
      x = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      y = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
      queue();
    };
    const leave = () => { x = 0; y = 0; queue(); };
    const target: HTMLElement | Window = scope === "window" ? window : el;
    const leaveTarget = scope === "window" ? document.documentElement : el;
    target.addEventListener("pointermove", move as EventListener, { passive: true });
    leaveTarget.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointermove", move as EventListener);
      leaveTarget.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, scope]);
}

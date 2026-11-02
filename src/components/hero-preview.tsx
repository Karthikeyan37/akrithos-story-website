"use client";

import { useEffect, useRef } from "react";

import { usePointerLean } from "@/hooks/use-pointer-lean";
import { systems } from "./product-showcase";

const revenue = systems[0];
const LAST_STEP = 6;

/**
 * A floating, three-plane preview of the Revenue agent beside the hero promise: what arrives (back plane), the agent
 * working (middle), and the person who approves (front). It leans toward the cursor, sinks back as the story scrolls
 * on, and loops its work while on screen. Decorative: the same content is fully readable in the showcase below.
 */
export function HeroPreview() {
  const ref = useRef<HTMLDivElement>(null);
  usePointerLean(ref, "window");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let step = 0;
    let frame = 0;
    const tick = () => {
      step = (step + 1) % (LAST_STEP + 2); // one extra tick holds the finished brief
      el.dataset.step = String(Math.min(step, LAST_STEP));
    };
    const start = () => { if (!timer) { step = 0; el.dataset.step = "0"; timer = window.setInterval(tick, 1300); } };
    const stop = () => { window.clearInterval(timer); timer = 0; };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(el);
    const onVisibility = () => { if (document.hidden) stop(); };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty("--exit", Math.min(1, window.scrollY / window.innerHeight).toFixed(3));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="hero-preview" data-step={LAST_STEP} aria-hidden="true">
      <div className="hero-preview-scene">
        <ul className="hero-preview-inputs">
          {revenue.inputs.map((item) => <li key={item}><i />{item}</li>)}
        </ul>

        <div className="hero-preview-card">
          <div className="hero-preview-head">
            <span className="hero-preview-mark">
              <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="1" /><circle cx="50" cy="50" r="46" pathLength="1" /></svg>
              A
            </span>
            <div>
              <p>{revenue.short}</p>
              <strong>{revenue.outputLabel}</strong>
            </div>
          </div>

          <div className="hero-preview-status">
            <i />
            <span className="hero-preview-words">
              <span data-for="0">{revenue.inputLabel}</span>
              {revenue.work.map((word, i) => <span key={word} data-for={i + 1}>{word}</span>)}
              <span data-for="4">Human decision</span>
              <span data-for="5">Rules applied</span>
            </span>
          </div>

          <ol className="hero-preview-work">
            {revenue.work.map((word) => <li key={word}>{word}</li>)}
          </ol>

          <ul className="hero-preview-outputs">
            {revenue.outputs.map((item) => <li key={item}><b>✓</b>{item}</li>)}
          </ul>

          <p className="hero-preview-note">Illustrative · no client data</p>
        </div>

        <div className="hero-preview-gate">
          <span>Human decision</span>
          <strong>{revenue.human}</strong>
        </div>
      </div>
    </div>
  );
}

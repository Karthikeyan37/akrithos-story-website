"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Gives the opening story depth as it scrolls: each chapter's copy rises in from below, rests while its chapter is
 * centred, then lifts and fades as the next arrives. A quiet rail marks the chapter in view, and a guide at the bottom
 * says which step this is and what comes next, so nobody stops halfway (pressing it goes there). The last step hands
 * over to Agent Quest. Reduced motion keeps the guide but leaves the copy still and fully visible.
 * `steps` names each chapter in order, in a few plain words; the guide shows the next one.
 */
export function StoryDepth({ steps }: { steps: readonly string[] }) {
  const chapters = steps.length;
  const railRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    // The story is split into the hero and the chapters after it, so every `.story` section takes part.
    const stories = Array.from(document.querySelectorAll<HTMLElement>("main .story"));
    if (!stories.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = stories.flatMap((s) => Array.from(s.querySelectorAll<HTMLElement>("[data-chapter]")));
    const ticks = Array.from(railRef.current?.children ?? []) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      let nearest = 0;
      let best = Infinity;
      list.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        if (!reduced) {
          el.style.setProperty("--d", d.toFixed(3));
          el.style.setProperty("--ad", Math.abs(d).toFixed(3));
        }
        if (Math.abs(d) < best) { best = Math.abs(d); nearest = i; }
      });
      ticks.forEach((t, i) => { t.dataset.on = String(i === nearest); });
      const inStory = stories.some((s) => { const r = s.getBoundingClientRect(); return r.top < vh * 0.5 && r.bottom > vh * 0.5; });
      if (railRef.current) railRef.current.dataset.visible = String(inStory);
      setStep(nearest);
      setShown(inStory);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    if (!reduced) stories.forEach((s) => { s.dataset.depth = "on"; });
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (frame) cancelAnimationFrame(frame);
      stories.forEach((s) => { delete s.dataset.depth; });
    };
  }, []);

  const last = step >= chapters - 1;
  const next = last ? "Agent Quest, 7 quick questions" : steps[step + 1];

  function goNext() {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (last) { document.getElementById("quest")?.scrollIntoView({ behavior, block: "start" }); return; }
    const target = Array.from(document.querySelectorAll<HTMLElement>("main .story [data-chapter]"))[step + 1];
    target?.scrollIntoView({ behavior, block: "center" });
  }

  return (
    <>
      <div ref={railRef} className="story-rail" data-visible="true" aria-hidden="true">
        {Array.from({ length: chapters }, (_, i) => <i key={i} data-on={String(i === 0)} />)}
      </div>
      <button type="button" className="story-cue" data-visible={shown} tabIndex={shown ? 0 : -1} aria-hidden={!shown} onClick={goNext}>
        <span>{last ? "Last step" : `Step ${step + 1} of ${chapters}`}. Keep scrolling</span>
        <strong>Next: {next}</strong>
        <i aria-hidden="true" />
      </button>
    </>
  );
}

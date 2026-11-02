"use client";

import { useEffect, useRef } from "react";

/**
 * Gives the opening story depth as it scrolls: each chapter's copy rises in from below, rests while its chapter is
 * centred, then lifts and fades as the next arrives. A quiet rail marks the chapter in view. Writes CSS variables
 * once per frame; reduced motion leaves everything still and fully visible.
 */
export function StoryDepth({ storyId = "top", chapters }: { storyId?: string; chapters: number }) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const story = document.getElementById(storyId);
    if (!story || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const list = Array.from(story.querySelectorAll<HTMLElement>("[data-chapter]"));
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
        el.style.setProperty("--d", d.toFixed(3));
        el.style.setProperty("--ad", Math.abs(d).toFixed(3));
        if (Math.abs(d) < best) { best = Math.abs(d); nearest = i; }
      });
      ticks.forEach((t, i) => { t.dataset.on = String(i === nearest); });
      if (railRef.current) railRef.current.dataset.visible = String(story.getBoundingClientRect().bottom > vh * 0.6);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    story.dataset.depth = "on";
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (frame) cancelAnimationFrame(frame);
      delete story.dataset.depth;
    };
  }, [storyId]);

  return (
    <div ref={railRef} className="story-rail" data-visible="true" aria-hidden="true">
      {Array.from({ length: chapters }, (_, i) => <i key={i} data-on={String(i === 0)} />)}
    </div>
  );
}

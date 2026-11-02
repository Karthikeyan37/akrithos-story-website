"use client";

import { useEffect, useState } from "react";

const chapters = [
  { id: "platform", label: "Observe" },
  { id: "solutions", label: "Shape" },
  { id: "security", label: "Govern" },
  { id: "gauntlet", label: "Decide" },
  { id: "live-agent", label: "Draft" },
  { id: "live-program", label: "Learn" },
  { id: "diagnostic", label: "Begin" },
] as const;

type ChapterId = (typeof chapters)[number]["id"];

export function JourneyRail() {
  const [activeId, setActiveId] = useState<ChapterId>(chapters[0].id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id as ChapterId);
      },
      { rootMargin: "-28% 0px -54% 0px", threshold: [0, 0.15, 0.35] },
    );

    for (const chapter of chapters) {
      const section = document.getElementById(chapter.id);
      if (section) observer.observe(section);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function navigateTo(id: string) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <div className="journey-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="journey-rail-shell">
        <nav className="journey-rail" aria-label="Page journey">
          <p>Explore</p>
          <ol>
            {chapters.map((chapter, index) => {
              const active = chapter.id === activeId;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(chapter.id)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Go to ${chapter.label}: section ${index + 1} of ${chapters.length}`}
                  >
                    <span className="journey-rail-number">0{index + 1}</span>
                    <span className="journey-rail-label">{chapter.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </>
  );
}

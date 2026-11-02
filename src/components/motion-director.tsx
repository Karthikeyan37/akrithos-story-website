"use client";

import { useEffect, useRef } from "react";

export function MotionDirector() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    root.dataset.motionMode = reduced.matches ? "reduced" : "full";
    sections.forEach((section) => section.classList.add("motion-section"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting);
        });
      },
      { rootMargin: "-96px 0px 80px", threshold: 0.01 },
    );
    sections.forEach((section) => observer.observe(section));

    function handlePointer(event: PointerEvent) {
      if (reduced.matches || !finePointer.matches || !fieldRef.current) return;
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        fieldRef.current?.style.setProperty("--signal-x", `${event.clientX}px`);
        fieldRef.current?.style.setProperty("--signal-y", `${event.clientY}px`);
        fieldRef.current?.setAttribute("data-active", "true");
      });
    }

    function handleVisibility() {
      root.dataset.motionPaused = String(document.hidden);
    }

    function updateProgress() {
      scrollFrameRef.current = null;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
      progressRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    }

    function handleScroll() {
      if (scrollFrameRef.current === null) scrollFrameRef.current = window.requestAnimationFrame(updateProgress);
    }

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    document.addEventListener("visibilitychange", handleVisibility);
    updateProgress();

    return () => {
      observer.disconnect();
      sections.forEach((section) => {
        section.classList.remove("motion-section");
        delete section.dataset.motionVisible;
      });
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      delete root.dataset.motionMode;
      delete root.dataset.motionPaused;
    };
  }, []);

  return (
    <>
      <div className="journey-progress" aria-hidden="true"><span ref={progressRef} /></div>
      <div ref={fieldRef} className="global-signal-field" aria-hidden="true">
        <span />
        <span />
      </div>
    </>
  );
}

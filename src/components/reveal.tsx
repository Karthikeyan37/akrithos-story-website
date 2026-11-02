"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Fades and lifts its content in once, as it scrolls into view (instantly under reduced motion). */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { el.dataset.shown = "true"; return; }
    el.dataset.shown = "false";
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.dataset.shown = "true"; io.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}

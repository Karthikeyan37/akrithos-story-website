"use client";

import { useEffect, useRef, useState } from "react";

export function useMotionVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && !document.hidden),
      { rootMargin: "-96px 0px 80px", threshold: 0.01 },
    );

    function handleVisibility() {
      if (document.hidden) {
        setVisible(false);
      } else {
        const currentElement = ref.current;
        if (!currentElement) return;
        const bounds = currentElement.getBoundingClientRect();
        setVisible(bounds.bottom >= -160 && bounds.top <= window.innerHeight + 160);
      }
    }

    observer.observe(element);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return [ref, visible] as const;
}

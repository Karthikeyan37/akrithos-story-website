"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Quiet, premium motion for the sections after the story: each section headline rises in word by word from behind a
 * mask as it enters the screen, once. Screen readers get the whole headline (SplitText keeps an aria-label). Nothing
 * moves under reduced motion, and everything is readable before the script runs.
 */
export function PageMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const heads = gsap.utils.toArray<HTMLElement>("main > section:not(.story) h2");
      const splits = heads.map((h) => SplitText.create(h, { type: "words", mask: "words", aria: "auto" }));
      splits.forEach((split, i) => {
        gsap.from(split.words, {
          yPercent: 110,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.045,
          scrollTrigger: { trigger: heads[i], start: "top 88%", once: true },
        });
      });
      return () => splits.forEach((s) => s.revert());
    });
    return () => mm.revert();
  }, []);
  return null;
}

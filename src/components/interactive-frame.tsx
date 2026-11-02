"use client";

import { useRef } from "react";

export function InteractiveFrame({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);

  function reset() {
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.setProperty("--frame-rx", "0deg");
    frame.style.setProperty("--frame-ry", "0deg");
    frame.style.setProperty("--frame-x", "50%");
    frame.style.setProperty("--frame-y", "50%");
  }

  function respondToPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = window.requestAnimationFrame(() => {
      frame.style.setProperty("--frame-rx", `${((0.5 - y) * 1.8).toFixed(2)}deg`);
      frame.style.setProperty("--frame-ry", `${((x - 0.5) * 1.8).toFixed(2)}deg`);
      frame.style.setProperty("--frame-x", `${(x * 100).toFixed(1)}%`);
      frame.style.setProperty("--frame-y", `${(y * 100).toFixed(1)}%`);
    });
  }

  return (
    <div
      ref={frameRef}
      className="interactive-frame"
      data-testid="interactive-frame"
      onPointerMove={respondToPointer}
      onPointerLeave={reset}
    >
      <div className="canvas-system-field" aria-hidden="true">
        <svg viewBox="0 0 640 720" role="presentation">
          <g className="canvas-orbit canvas-orbit-one">
            <ellipse cx="320" cy="360" rx="292" ry="214" />
            <circle cx="612" cy="360" r="7" />
          </g>
          <g className="canvas-orbit canvas-orbit-two">
            <ellipse cx="320" cy="360" rx="224" ry="306" />
            <circle cx="320" cy="54" r="5" />
          </g>
          <path className="canvas-signal-path" d="M36 490 C148 410 174 538 284 444 S464 318 606 232" />
        </svg>
      </div>
      <div className="interactive-frame-glow" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

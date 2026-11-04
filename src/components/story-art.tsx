"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { storyArt } from "@/config/story";
import { storyChapters, storyProgress } from "@/lib/story-progress";
import type { PaperFlow } from "./paper-flow";

/**
 * The opening story told with six rendered images (docs/STORY-ART.md), fixed behind the story copy, with the work
 * itself moving through them in live 3D (paper-flow.ts): the pile and the box are cut out of each image and laid over
 * the paper, so sheets sink into the pile, rise out of it and drop inside the box. The images share one camera, so they sit on one stage that
 * pushes in slowly across the whole story; when the step changes, its image dissolves in over the last in half a
 * second, so only one person is ever on screen. Scroll position is smoothed with GSAP. Reduced motion: no paper, push-in or smoothing; the images
 * simply change with the step.
 */
export function StoryArt() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stories = Array.from(document.querySelectorAll<HTMLElement>("main .story"));
    if (!root || !stories.length) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = root.querySelector<HTMLElement>(".story-art-stage")!;
    const frames = Array.from(root.querySelectorAll<HTMLElement>("[data-frame]"));
    const cuts = Array.from(root.querySelectorAll<HTMLElement>("[data-cut]"));
    const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
    const chapters = storyChapters();
    let flow: PaperFlow | null = null;
    let disposed = false;
    let on = false;

    // Where the image sits once cropped to fill the screen (object-fit: cover), for the paper layer.
    const box = () => {
      const w = root.clientWidth, h = root.clientHeight;
      const s = Math.max(w / storyArt.width, h / storyArt.height);
      const iw = storyArt.width * s, ih = storyArt.height * s;
      const ax = parseFloat(getComputedStyle(frames[0].querySelector("img")!).objectPosition) / 100 || 0.5;
      return { w, h, ox: (w - iw) * ax, oy: (h - ih) / 2, iw, ih };
    };

    // The pile and the box, cut out of each image and laid over the moving paper, so paper goes into and behind them.
    const outline = (b: ReturnType<typeof box>, pts: Array<[number, number]>) =>
      "M" + pts.map(([u, v]) => `${(b.ox + u * b.iw).toFixed(1)} ${(b.oy + v * b.ih).toFixed(1)}`).join(" L") + " Z";
    const placeCuts = () => {
      const b = box();
      cuts.forEach((c, i) => { c.style.clipPath = `path("${outline(b, storyArt.frames[i].pile)} ${outline(b, storyArt.box)}")`; });
      return b;
    };

    // The step's image dissolves in over the last one in half a second, whenever the step changes. It is timed, not
    // tied to scroll, so wherever the reader stops there is only ever one person on screen.
    let shown = -1;
    const show = (i: number) => {
      if (i === shown) return;
      const prev = shown;
      shown = i;
      // Each image and its cut-out change together.
      const layers = [frames, cuts];
      layers.forEach((list) => list.forEach((f, k) => { f.style.zIndex = k === i ? "2" : k === prev ? "1" : "0"; }));
      gsap.killTweensOf([...frames, ...cuts]);
      const done = () => layers.forEach((list) => list.forEach((f, k) => { if (k !== i) f.style.opacity = "0"; }));
      if (reduced || prev < 0) { frames[i].style.opacity = "1"; cuts[i].style.opacity = "1"; done(); return; }
      gsap.fromTo([frames[i], cuts[i]], { opacity: Number(frames[i].style.opacity) || 0 }, { opacity: 1, duration: 0.55, ease: "power2.inOut", onComplete: done });
    };

    const state = { p: storyProgress(chapters) };
    const render = () => {
      const p = state.p;
      show(Math.max(0, Math.min(frames.length - 1, Math.round(p))));
      if (!reduced) stage.style.transform = `scale(${(1.02 + 0.012 * p).toFixed(4)})`;
      flow?.setProgress(p);
    };
    const to = reduced ? null : gsap.quickTo(state, "p", { duration: 0.8, ease: "power3.out", onUpdate: render });
    const update = () => { const p = storyProgress(chapters); if (to) to(p); else { state.p = p; render(); } };

    const trigger = ScrollTrigger.create({
      trigger: stories[0], endTrigger: stories[stories.length - 1], start: "top bottom", end: "bottom top", onUpdate: update,
      onToggle: (self) => { on = self.isActive; root.dataset.active = String(on); flow?.setActive(on); },
    });
    const onResize = () => { const b = placeCuts(); flow?.resize(b); update(); };
    window.addEventListener("resize", onResize);
    placeCuts();
    render();
    root.dataset.state = "ready";

    // The moving paper loads after the first image, and only with motion allowed and WebGL available.
    if (!reduced) {
      const probe = document.createElement("canvas").getContext("webgl2");
      const info = probe?.getExtension("WEBGL_debug_renderer_info");
      const software = /swiftshader|llvmpipe|software|basic render/i.test(String(info ? probe!.getParameter(info.UNMASKED_RENDERER_WEBGL) : ""));
      probe?.getExtension("WEBGL_lose_context")?.loseContext();
      const lite = software || window.matchMedia("(max-width: 768px), (hover: none)").matches;
      if (probe) {
        import("./paper-flow").then(({ createPaperFlow }) => {
          if (disposed) return;
          try {
            flow = createPaperFlow(canvas, { lite, tops: storyArt.frames.map((f) => f.top) });
          } catch {
            return; // No paper layer: the images still tell the story.
          }
          flow.resize(box());
          flow.setProgress(state.p);
          flow.setActive(on);
          root.dataset.flow = "on";
        });
      }
    }

    return () => {
      disposed = true;
      trigger.kill();
      window.removeEventListener("resize", onResize);
      flow?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="story-art" data-state="loading" aria-hidden="true">
      <div className="story-art-stage">
        {storyArt.frames.map(({ src }, i) => (
          <div key={src} className="story-art-frame" data-frame={i}>
            {/* Decorative: the story copy carries the meaning, so the images are hidden from screen readers. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" width={storyArt.width} height={storyArt.height} loading={i < 2 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} />
          </div>
        ))}
        <canvas className="story-art-flow" />
        <div className="story-art-cuts">
          {storyArt.frames.map(({ src }, i) => (
            <div key={src} className="story-art-cut" data-cut={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" width={storyArt.width} height={storyArt.height} loading={i < 2 ? "eager" : "lazy"} decoding="async" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

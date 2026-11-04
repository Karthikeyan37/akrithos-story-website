/** Every chapter of the opening story, in order (the story is split into the hero and the chapters after it). */
export function storyChapters(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("main .story [data-chapter]"));
}

/**
 * Where the reader is in the story, from 0 (first chapter) to the last chapter's index: which chapter's middle the
 * screen's middle has passed, plus how far it is towards the next one.
 */
export function storyProgress(chapters: HTMLElement[]): number {
  if (!chapters.length) return 0;
  const mid = window.innerHeight / 2;
  let p = 0;
  chapters.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const c = r.top + r.height / 2;
    if (c > mid) return;
    const next = chapters[i + 1]?.getBoundingClientRect();
    p = next ? i + Math.max(0, Math.min(1, (mid - c) / Math.max(1, next.top + next.height / 2 - c))) : i;
  });
  return Math.max(0, Math.min(chapters.length - 1, p));
}

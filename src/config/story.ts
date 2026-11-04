/**
 * The opening story's artwork (see docs/STORY-ART.md), one image per step. While `ready` is false the page uses the 3D
 * scene instead (the default: the 3D scene is staged like the artwork and moves).
 * All six share one camera, so the moving paper (paper-flow.ts) lands on the same spots in each. Outlines are in
 * fractions of the image (0 = left or top): `pile` traces the paper tower and `top` is the middle of its top sheet;
 * `box` traces the front walls of the kraft box. Those parts of the image are laid back over the moving paper, so
 * paper sinks into the pile, passes behind it and drops inside the box instead of floating on top of the picture.
 */
export type StoryFrame = { src: string; top: [number, number]; pile: Array<[number, number]> };
const TALL: Pick<StoryFrame, "top" | "pile"> = {
  top: [0.748, 0.215],
  pile: [[0.687, 0.234], [0.745, 0.199], [0.809, 0.262], [0.807, 0.743], [0.762, 0.794], [0.684, 0.756]],
};
export const storyArt: { ready: boolean; width: number; height: number; box: Array<[number, number]>; frames: StoryFrame[] } = {
  ready: false,
  width: 1017,
  height: 572,
  box: [[0.804, 0.511], [0.87, 0.574], [0.93, 0.531], [0.93, 0.619], [0.865, 0.67], [0.804, 0.601]],
  frames: [
    { src: "/story/step-1.webp", ...TALL },
    { src: "/story/step-2.webp", ...TALL },
    { src: "/story/step-3.webp", ...TALL },
    { src: "/story/step-4.webp", ...TALL },
    { src: "/story/step-5.webp", top: [0.8, 0.21], pile: [[0.747, 0.226], [0.799, 0.191], [0.861, 0.252], [0.859, 0.49], [0.806, 0.524], [0.745, 0.599]] },
    { src: "/story/step-6.webp", top: [0.745, 0.315], pile: [[0.689, 0.328], [0.735, 0.295], [0.805, 0.35], [0.806, 0.743], [0.76, 0.791], [0.684, 0.756]] },
  ],
};

/**
 * The person in the 3D story: cut out of each step's image (scripts/cut-person.mjs), so their real face shows how they
 * feel at every step.
 */
export const storyPerson = { frames: [1, 2, 3, 4, 5, 6].map((n) => `/story/person-${n}.webp`) };

/**
 * How the person feels at each step, from overwhelmed to happy: the arc visitors should recognise from their own week.
 * `level` places the mood on the meter (0 = worst, 1 = best). `thought` is what they would say to themselves.
 * `face` is that step's close-up portrait (docs/STORY-ART.md); steps without one show the mood alone.
 */
export const storyMood = {
  steps: [
    { mood: "Overwhelmed", level: 0.04, thought: "I'll never get through all of this.", face: "/story/face-1.webp" },
    { mood: "Stressed", level: 0.14, thought: "Did I just miss that call?", face: "/story/face-2.webp" },
    { mood: "Relieved", level: 0.55, thought: "Finally, some help.", face: "/story/face-3.webp" },
    { mood: "Reassured", level: 0.7, thought: "And our data stays with us. Good.", face: "/story/face-4.webp" },
    { mood: "In control", level: 0.86, thought: "I only need to check these three.", face: "/story/face-5.webp" },
    { mood: "Happy", level: 1, thought: "I got my afternoon back.", face: "/story/face-6.webp" },
  ] as { mood: string; level: number; thought: string; face?: string }[],
};

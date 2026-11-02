# Akrithos Checkpoint 10 — Continuous Motion System

## Status

Checkpoint 10 is implemented and verified in a source-isolated successor to Checkpoint 9. Nothing in this handoff has been deployed to the public Vercel site.

## Source identity

- Immutable predecessor: `akrithos-checkpoint9-human-engagement.zip`
- Predecessor SHA-256: `3c9b85ed4816ec84d8c9287ed291a6239dd9e6e108266b94f4e8846ccf01b36d`
- Checkpoint 10 workspace: `akrithos-checkpoint10-continuous-motion/akrithos-checkpoint9-human-engagement`
- Public comparison URL: `https://akrithos-website.vercel.app/`
- Inspiration benchmark: `https://cranium.ai/`

The public Akrithos URL is an older build: it does not expose Checkpoint 9's journey rail or interactive Outcome Stage. Checkpoint 10 was therefore created from the immutable, clean-verified Checkpoint 9 archive rather than reconstructed from the live DOM.

## Objective

Make Akrithos feel continuously active and responsive, while retaining enterprise credibility and a clear human-control story. Cranium informed the principle of a persistent visual system; no Cranium brand assets, layouts, copy, palette, videos, or 3D motifs were copied.

## Implemented

### One Akrithos motion language

A controlled signal now moves through a consistent sequence:

`Intent → Context → Boundary → Agent work → Human gate → Evidence`

The signal is represented through restrained terracotta/bronze pulses, routing lines, status indicators, section passes, and visible workflow progression.

### Continuous but purposeful motion

- Added a continuously moving signal ribbon between the hero and control plane.
- Added a two-pixel page signal/progress line that remains active without covering content.
- Added a hero heartbeat beside the opening premise, including on mobile.
- Added subtle orbital and routed signal layers around the desktop operational canvas.
- Added a signal moving directly through the five execution stages.
- Changed the hero demonstration from a single finite run to a looping, illustrative execution sequence.
- Added an ambient control-plane preview that advances through flows and names the current signalled node.
- Added slow security-field rotation and staggered control-status pulses.
- Added section-boundary pulses and tactile card/button interaction states.

### Visitor control

- Choosing a control-plane flow immediately stops ambient automation and changes the status to `Your selection`.
- `Run guided flow` remains explicit and inspectable.
- Hero scenario controls and Replay remain keyboard-operable.
- Outcome Stage tabs, workflow starters, the command palette, assistant, menus, and modals retain their established interactions.

### Performance and motion safety

- No animation library, video dependency, WebGL, or canvas render loop was added.
- Pointer response uses `requestAnimationFrame` plus CSS custom properties, not React state on pointer movement.
- Section-specific animations pause outside the effective viewport.
- Automatic React timelines pause when the component is off-screen or the document is hidden.
- Coarse-pointer devices do not render pointer-following or orbital canvas decoration.
- `prefers-reduced-motion: reduce` produces a complete static experience with zero running animations.
- Essential content is never hidden behind scroll-reveal logic.

### Hash-navigation correction

The semantic sticky-header offset was corrected from 7rem to 6rem after browser measurement showed a 93.75px header. Real hash navigation now lands the target directly below the header instead of exposing a clipped portion of the preceding signal ribbon.

## Files added

- `src/components/motion-director.tsx`
- `src/components/signal-ribbon.tsx`
- `src/hooks/use-motion-visibility.ts`
- `scripts/capture-motion.mjs`
- `CONTINUOUS_MOTION_HANDOFF.md`

## Files modified

- `src/app/page.tsx`
- `src/components/control-plane.tsx`
- `src/components/execution-brief.tsx`
- `src/components/interactive-frame.tsx`
- `src/styles/globals.css`
- `tailwind.config.mjs`
- `tests/home.spec.ts`

## Preserved boundaries

Checkpoint 10 does not change:

- GHL forms or workflows;
- payment destinations or offer facts;
- login behavior;
- assistant or plan-generation API contracts;
- CRM, authentication, payment, or entitlement operations;
- client claims, testimonials, logos, performance outcomes, or integrations.

All motion-driven product views remain explicitly labelled illustrative or simulated.

## Verification evidence

Final `npm run verify`:

- ESLint: passed with zero warnings
- TypeScript: passed
- design-token and dependency foundation check: passed
- production Next.js build: passed
- Playwright: 32/32 journeys passed across desktop and mobile Chromium

Production-preview temporal QA:

- widths inspected: 393, 1440, and 1920
- horizontal overflow: 0px at every measured viewport
- browser console errors: 0
- full-motion frame hashes changed over time: verified
- reduced-motion animation count: 0
- reduced-motion frame hashes remained byte-identical over time: verified
- coarse-pointer orbital field: `display: none`
- visitor selection stops ambient control-plane mode: verified by Playwright
- real hash navigation clears the 93.75px sticky header: verified by browser geometry

Visual QA:

- final 1920 hero workflow/motion composition: PASS
- 1440 security field: controlled and unclipped
- 1440 reduced-motion fallback: PASS
- 393 mobile geometry: no horizontal overflow and no touch obstruction

## Preview and capture

Run:

```bash
npm ci
npm run dev
```

Capture repeatable motion states:

```bash
BASE_URL=http://127.0.0.1:3000/ node scripts/capture-motion.mjs
```

## Deployment dependency

The public Vercel project currently serves an older source generation. Before promotion, confirm the deployment project is connected to this exact Checkpoint 10 source. Then run `npm ci`, `npm run verify`, deploy a preview, and repeat the published-URL checks before production promotion.

## Rollback

Rollback is source-level and immediate: redeploy the immutable Checkpoint 9 archive identified above. No operational system migration or data rollback is required because this checkpoint is UI/UX-only.

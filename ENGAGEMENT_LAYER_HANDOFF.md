# Akrithos Checkpoint 9 — Human Engagement Layer

## Scope

This checkpoint evolves Checkpoint 8's dynamic layer into a more human-directed, interactive product experience. It preserves approved Akrithos content, offers, links, forms, API boundaries, and the token-first design system.

## Completed

### 1. Editorial journey navigation
- Added a section-aware journey rail for ultrawide screens.
- Added a slim page-progress indicator at all viewport sizes.
- Kept the rail immediately outside the centered content canvas rather than against the viewport edge.
- Converted the rail from a floating card into an editorial ruled index.
- Added native-button keyboard access, active-section state, and reduced-motion-aware scrolling.
- Added the semantic `header` spacing token and replaced ineffective `scroll-mt-28` classes, ensuring fragment navigation clears the sticky header.

### 2. Interactive outcome stage
- Replaced the generic three-card outcome row with a user-controlled operating-model stage.
- Each selection visibly reconfigures the source, system, human review, and inspectable-evidence path.
- Retained explicit `illustrative` labeling and did not introduce outcome claims.
- Added a compact mobile selector with full accessible labels and clear selected state.

### 3. Tactile operational canvas
- Added subtle pointer-responsive depth and a localized light response around the hero execution canvas.
- Used direct CSS-property updates through `requestAnimationFrame` to avoid React render churn.
- Disabled depth and animated signals for coarse pointers and `prefers-reduced-motion` users.

### 4. Faster Workflow Blueprint participation
- Added safe one-click workflow starters for lead handoff, invoice approval, and policy search.
- Added selected-state feedback, visible field labeling, and a consolidated counter/action row.
- Kept the original privacy boundary and API behavior.
- Compressed only the mobile presentation so the full description and Generate action are visible in the first 393×852 viewport.
- Uses concise mobile labels while preserving full accessible and desktop labels.

### 5. AI-guide wide-screen fit
- Preserved the context-aware Ask Akrithos behavior.
- Added a deliberate gutter gap and connecting rule so the guide does not touch accordion controls or feel detached.

### 6. Existing layout repair
- Replaced the undefined `section-pad` class on the control plane with the governed `section` component class.

## Reported and verified

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run tokens:check`: passed; 16 exact dependencies, approved Akrithos tokens, public npm registry only.
- `npm run build`: passed on Next.js 16.3.3.
- `npm run test:e2e`: 26/26 journeys passed across desktop Chromium and mobile Chromium.
- Browser captures: 393, 1440, 1920, and 2560 widths.
- Browser geometry: zero horizontal overflow at every captured width.
- Browser console: zero errors in all six final capture journeys.
- Visual acceptance: desktop hero, 1440 outcome stage, 2560 journey/assistant composition, compact mobile outcome stage, and 393×852 Blueprint action path passed.

## Explicitly unchanged

- GHL form and fallback behavior.
- Payment, training, login, email, and diagnostic destinations.
- API credential handling and environment-variable boundary.
- Approved Akrithos content, offers, staff information, and evidence language.
- Dependency count and package versions.

## Unverified external state

- No public deployment was requested or changed.
- Live third-party checkout, GHL, login, and email systems were not modified.
- A configured production model-provider response is environment-dependent; the existing deterministic no-secret preview boundary remains intact.

## Remaining work

No blocker remains in this checkpoint. Public deployment and live-domain acceptance remain separate approval-bound actions.

## Rollback

Checkpoint 8 remains unchanged at `/tmp/akrithos-checkpoint8-engagement-baseline` for the current session. For a durable rollback, retain the previously delivered Checkpoint 8 ZIP beside this Checkpoint 9 ZIP. The Checkpoint 9 patch can also be reviewed independently before promotion.

## Prework lesson receipt

Applied these lessons from Saathi's scoped prework review:
1. Added interaction only where it communicates state, causality, or navigation.
2. Kept DOM order, keyboard behavior, reduced-motion support, and mobile touch sizing as acceptance criteria.
3. Treated fixed-viewport browser evidence and inspectable state transitions as required proof, not optional polish.

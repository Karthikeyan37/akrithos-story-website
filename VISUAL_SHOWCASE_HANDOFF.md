# Akrithos Checkpoint 11 — Visual AI Showcase

## Status

Checkpoint 11 is a source-isolated redesign built from the clean-verified Checkpoint 10 archive. It has not been pushed to GitHub or deployed to Vercel.

## Purpose

This pass moves the site from a text-led animated marketing page toward a visual AI product showroom. Cranium was used only as a benchmark for continuity, product demonstration, and visual confidence. No Cranium identity, copy, graphics, video, 3D presentation, motifs, or page structure were copied.

## Completed

### Simpler lead journey

- Removed the Explore journey rail.
- Removed the Explore the workflow hero CTA.
- Removed the duplicate desktop header Diagnostic button.
- Hid the contextual assistant dock while the hero is active; it remains available after the hero.
- Reduced the architecture from 13 primary sections to 9.
- Reduced repetition by removing the separate control-plane, evidence-card, capability-accordion, duplicate sandbox, and generic business-impact sections.
- The hero now presents one promise and one primary action.

### AI Systems Showcase

Created `src/components/product-showcase.tsx` with four illustrative system examples:

1. Revenue Agent
2. Knowledge Copilot
3. Operations Control
4. Service Agent

Each example presents a visible four-stage path:

1. Input
2. Controlled intelligence
3. Human decision
4. Output

Each example includes an evidence-safe “Designed business effect” rather than a fabricated customer outcome or metric. The demonstrations are labelled `Illustrative · no client data`.

The showcase:

- automatically rotates while visible;
- pauses when a visitor chooses a system;
- provides an explicit Auto / Play all control;
- uses scalable browser-rendered vector routes and UI rather than low-resolution raster artwork;
- uses visible directional arrowheads and animated route signals;
- pauses when off-screen or the tab is hidden;
- becomes completely static under reduced motion.

### Four-stage operating-model experience

Redesigned `src/components/maturity-run.tsx` as one connected decision track while preserving the approved four stages:

- Automated
- Agentic
- Governed
- Productized

### Motion and accessibility

- Preserved pointer response without React rerenders during pointer movement.
- Preserved coarse-pointer safeguards.
- Preserved keyboard, focus, dialog, and semantic control behavior.
- Preserved a complete reduced-motion experience.
- Corrected a reduced-motion hydration mismatch in `execution-brief.tsx` by using a hydration-safe external-store media-query snapshot.
- Removed competing hero UI while retaining contextual help later in the page.

## Operational preservation

No operational system was rebuilt or changed. This pass preserves:

- existing GHL Diagnostic form behavior;
- checkout destinations;
- member login destination;
- public training destination;
- existing offer facts;
- external API boundaries;
- CRM, authentication, payments, entitlements, and backend ownership.

No credentials or local environment values are included in the source archive.

## Primary modified files

- `src/app/page.tsx`
- `src/components/header.tsx`
- `src/components/ask-akrithos.tsx`
- `src/components/execution-brief.tsx`
- `src/components/maturity-run.tsx`
- `src/components/motion-director.tsx`
- `src/components/product-showcase.tsx` — new
- `src/styles/globals.css`
- `tailwind.config.mjs`
- `tests/home.spec.ts`

## QA scripts

- `scripts/capture-showcase.mjs`
- `scripts/audit-showcase-geometry.mjs`
- `scripts/audit-hero-geometry.mjs`

## Verified

Final source verification:

```text
npm audit --audit-level=low
npm run verify
```

Results:

- npm audit: 0 vulnerabilities
- ESLint: passed with zero warnings
- TypeScript: passed
- design-token/dependency foundation check: passed
- Next.js production build: passed
- Playwright: 24/24 journeys passed across desktop and mobile projects
- browser console errors: 0
- horizontal overflow: 0px
- inspected widths: 393, 1440, 1600, 1920, and 2560
- reduced-motion active animations: 0
- full-motion showcase active animations: 20 in the inspected desktop state

Visual acceptance:

- hero at 1920×1080: PASS
- system showcase at 1600×1000: PASS
- mobile showcase at 393×852: PASS
- four-stage maturity experience at 1440×1000: PASS
- Knowledge Copilot ultrawide composition at 2560×1200: PASS

Hero geometry at 1920×1080:

- complete hero: 94–865px
- heading: 192–425px
- primary CTA: 571–619px

Showcase geometry at 1600×1000:

- complete visual stage: 402–947px in the final four-node layout
- every node and evidence label remained within the viewport

## Deployment boundary

For GitHub/Vercel deployment:

1. Extract the Checkpoint 11 source ZIP.
2. Commit the files inside the extracted project directory to the repository root.
3. Confirm `package.json`, `src`, `public`, and `tailwind.config.mjs` are at the configured Vercel project root.
4. Do not upload only the ZIP and expect Vercel to unpack it.
5. Preserve runtime values in Vercel environment settings; never commit credential-bearing `.env` files.
6. Use a preview branch or separate preview deployment before replacing the current production source.

## Rollback

Checkpoint 10 remains available as the prior clean-verified source archive. Roll back by redeploying the prior repository commit or reconnecting the Vercel project to the Checkpoint 10 branch/commit.

## Evidence limitation

The product examples demonstrate build capability and intended workflow effects. They are not represented as completed customer case studies, measured outcomes, production integrations, or customer endorsements.

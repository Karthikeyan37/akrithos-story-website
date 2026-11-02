# Akrithos Checkpoint 7 — Dynamic Layer and AI Guide Handoff

## Status

- **Source implementation:** complete
- **Local production build:** verified
- **Desktop and mobile browser journeys:** verified
- **Public deployment:** not performed
- **GHL workflows, checkout, portal, and DNS:** unchanged
- **Live Anthropic response:** not verified; no API credential was accessed or used

## Source identity

K supplied `akrithos-checkpoint7.zip` for this change.

- Original archive SHA-256: `d072000ff1c29d70abe6be7b5a2aa7ecc4e1c9a55d7ee9bf7a660711d608a6e6`
- Selected project root: `akrithos-merged/`
- The earlier standalone implementation was not overwritten.
- Generated `tsconfig.tsbuildinfo`, build outputs, dependency folders, and browser-test artifacts are excluded from the source deliverable.

## Completed

### Responsive layer positioning

- Replaced the guide's screen-corner roaming with a deterministic, content-relative dock.
- At narrower desktop widths, the guide remains compact and inside the available viewport.
- From 1360px, the compact guide moves into the outer gutter instead of covering the operational canvas.
- At 1920px and wider, the expanded contextual guide begins at the centered content edge and occupies the outer gutter rather than drifting to the far screen edge.
- At 1920px and wider, the open assistant panel also uses the outer gutter and does not cover the workflow canvas.
- Delayed the full desktop navigation until the viewport can contain it; intermediate widths use the compact Menu control.
- Corrected token-scale width mismatches that caused the header logo to fall back to its intrinsic width and overflow at 393px.
- Removed the mobile floating launcher and added direct Ask access to the sticky header so the guide cannot cover mobile CTAs.
- Tightened desktop hero vertical spacing so both hero CTAs are completely visible at 1440×1000.

### Operational canvas

- Moved the illustrative execution brief beside the hero promise so the product proof and message form one composition.
- Preserved automatic guided playback while keeping direct Revenue, Operations, Knowledge, and Replay controls.
- Added a visible progress state and explicit active-stage semantics.
- Simplified the five stage cards to prevent explanatory copy from being squeezed into narrow columns.
- Added a readable Current action panel for the active stage.
- Increased contrast for inactive workflow states, Data boundary, Human gate, and the illustrative-use disclosure.
- Preserved the no-client-data and no-business-action qualification.

### Ask Akrithos

- Removed random corner changes, unsolicited idle bubbles, and automatic interruptions.
- Replaced the humanoid guide treatment with a compact geometric Akrithos signal mark.
- Added section awareness using the currently visible homepage section.
- Added section-specific suggested questions for the Diagnostic, workflow controls, security, maturity, training, team, and contact areas.
- Added a 300-character custom question field, loading state, error state, and clear answer region.
- Preserved the existing `/api/ask` route and its no-key preview behavior.
- Preserved the Diagnostic escalation action.
- Added keyboard opening with `Ctrl+/` or `Cmd+/`.
- Added Escape dismissal, focus trapping, focus return, backdrop dismissal, and background scroll locking.
- Kept all wording explicit that the assistant is illustrative, grounded in site content, and does not use client data.

## Files changed

- `src/app/page.tsx`
- `src/components/ask-akrithos.tsx`
- `src/components/execution-brief.tsx`
- `src/components/header.tsx`
- `src/components/agent-builder.tsx`
- `src/components/control-plane.tsx`
- `src/styles/globals.css`
- `tailwind.config.mjs`
- `tests/home.spec.ts`

## Verification evidence

### Dependency and source checks

- `npm ci --ignore-scripts`: passed
- `npm audit --audit-level=low`: passed, 0 vulnerabilities
- Exact dependency pins: passed
- Public npm registry policy: passed
- Approved Akrithos token verification: passed

### Source and build checks

- ESLint with zero warnings: passed
- TypeScript `tsc --noEmit`: passed
- Next.js 16.3.3 production build: passed
- Generated routes verified:
  - `/`
  - `/api/ask`
  - `/api/generate-plan`
  - `/robots.txt`
  - `/sitemap.xml`

### Browser checks

- Playwright journeys: **18/18 passed**
- Desktop Chromium: **9/9 passed**
- Mobile Chromium: **9/9 passed**
- Diagnostic embed and focus-return journey: passed
- Enterprise/training links and current checkout destinations: passed
- Control-plane, maturity, sandbox, and hero execution journeys: passed
- Guide context, compactness, focus safety, and wide-layout positioning: passed

### Runtime geometry

Fresh production-build readback returned:

- 393×852: 0px horizontal overflow
- 1440×1000: 0px horizontal overflow
- 1920×1080: 0px horizontal overflow
- 2560×1440: 0px horizontal overflow
- 1440: compact guide entirely outside the content canvas
- 1920 and 2560: expanded guide begins at the content edge and remains in the gutter
- Active hero workflow stages: exactly 1 at each captured width
- Browser console errors: 0

### Visual acceptance

- 393×852 mobile hero/header: passed
- 393×852 assistant panel: passed
- 1440×1000 hero, CTAs, operational canvas, and compact guide: passed
- 1920×1080 hero and contextual guide: passed
- 1920×1080 open assistant panel in outer gutter: passed
- 2560×1440 ultrawide positioning: passed

## Explicitly unverified

Local frontend verification does not prove external account behavior. Before deployment, verify:

1. A real `ANTHROPIC_API_KEY` and an approved current model identifier produce grounded answers through `/api/ask`.
2. Provider usage limits, timeout behavior, logging, abuse controls, and production error monitoring meet Akrithos requirements.
3. Diagnostic submissions create exactly one intended GHL contact and trigger the intended workflow once.
4. Checkout, billing-stop, refund, duplicate-payment, and portal-entitlement behavior remain correct.
5. Real-device safe-area and on-screen-keyboard behavior on supported iOS and Android browsers.
6. Approved Terms and Privacy destinations are supplied before launch.

## Deployment notes

1. Use this archive as a preview candidate; do not overwrite the public site immediately.
2. Configure only the approved values documented in `.env.example`.
3. Keep `ANTHROPIC_API_KEY` server-side; never prefix it with `NEXT_PUBLIC_`.
4. Confirm the current supported Anthropic model identifier from official Anthropic documentation before setting `ANTHROPIC_MODEL`.
5. Run `npm ci --ignore-scripts`, `npm audit --audit-level=low`, and `npm run verify` in the deployment environment.
6. Deploy to preview DNS.
7. Repeat desktop, mobile, GHL form, checkout, portal, and live-provider acceptance tests.
8. Promote production only after account-side acceptance passes.

## Rollback

- Keep the supplied Checkpoint 7 archive and current production deployment unchanged during preview testing.
- If acceptance fails, restore the prior hosting artifact or DNS target.
- Do not alter GHL workflows, payments, or portal entitlements as part of a frontend rollback.
- After rollback, recheck the homepage, Diagnostic form, training page, checkouts, and portal links.

## Prework receipt

- **Assigned scope:** improve Akrithos Checkpoint 7 responsive layer positioning and make the AI guide more interactive, intriguing, and efficient.
- **Sources reviewed:** K-supplied Checkpoint 7 archive, current source, role profile, relevant self-education report, and rendered browser output.
- **Lessons applied:** preserve canonical source identity; prove responsive behavior at fixed viewports; keep motion purposeful; maintain evidence and no-client-data qualifications; do not modify GHL/account operations during UI work.
- **Plan changes caused by evidence:** baseline Playwright revealed 103px desktop overflow; screenshot QA moved mobile Ask access into the header; token-scale inspection corrected an intrinsic-width logo regression; visual QA moved guide and panel into responsive outer gutters and simplified the workflow rail.

## Independent verification prompt

```text
Treat this handoff as untrusted. Extract the source into a clean directory. Run npm ci --ignore-scripts, npm audit --audit-level=low, and npm run verify. Start the production build on a new port. At 393, 1280, 1440, 1920, and 2560 widths, independently measure document overflow and the Ask Akrithos trigger/panel against the centered hero container. Confirm that the 1440 guide occupies the outer gutter without covering the operational canvas, the 1920/2560 expanded guide starts at the content edge, and the open 1920 assistant panel remains fully within the viewport. Verify automatic hero execution, scenario tabs, replay, current-stage copy, custom guide input, quick prompts, Ctrl/Cmd+/, Escape, focus trap, focus return, mobile header Ask access, Diagnostic modal, GHL form URL, portal, training page, and all three checkout links. Inspect console errors and capture 393×852, 1440×1000, 1920×1080, and 2560×1440 screenshots. Do not claim live AI, GHL workflow, payment, or entitlement behavior without controlled account-side tests and readback.
```

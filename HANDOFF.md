# Akrithos Standalone Website — Expanded Implementation Handoff

## Status

**Local implementation:** complete and verified  
**Public deployment:** not performed  
**GHL configuration:** unchanged  
**DNS:** unchanged

## Completed

The standalone website now includes the enterprise and live-program experiences from the earlier Akrithos website inside the approved light Akrithos design system:

- Enterprise navigation: Platform, Solutions, Security, Demos, Company, Live Sessions, Trainings, Member Login, and Diagnostic
- Enterprise hero and illustrative delivery profile
- Interactive control-plane flow selector and trace
- Evidence guide with explicit no-client-performance-claim qualification
- Three business-outcome cards
- Five-item “What we can build” accordion
- Use-case Diagnostic CTA
- Security sectors and four deployment-control cards
- Four-stage gamified maturity exercise with scoring and retry behavior
- Three-mode agent sandbox: lead qualification, grounded knowledge, and exception workflow
- Founding Cohort, Single Session, and Monthly offer cards
- Existing checkout destinations
- Recurring Tuesday 12:00–1:00 PM Central schedule
- Three client-supplied founder portraits extracted byte-for-byte from the earlier source
- Business-impact cards
- Interactive readiness selector
- GHL Diagnostic modal, Calendly fallback, portal, training, and email routes
- FAQ, sitemap, robots route, canonical metadata, responsive navigation, and footer

## Preserved operational destinations

- Diagnostic form: `https://api.leadconnectorhq.com/widget/form/NF6k2MmqcnTNqAfG3Fxd`
- Form loader: `https://link.msgsndr.com/js/form_embed.js`
- Calendly: `https://calendly.com/alex-buriak/akrithos-ai-scoping-call`
- Client Portal: `https://learn.akrithos.com/`
- Training page: `https://akrithos.com/training`
- Founding Cohort checkout: `https://link.fastpaydirect.com/payment-link/6a74dc5a50f272ef3a73c519`
- Single Session checkout: `https://link.fastpaydirect.com/payment-link/6a7a014ac8cc9a2ce7267306`
- Monthly checkout: `https://link.fastpaydirect.com/payment-link/6a830bf573c7ff66b05e890a`
- Contact: `info@akrithos.com`

## Evidence and verification

- Exact dependency pins: 16/16
- Public npm registry policy: passed
- npm audit: zero vulnerabilities
- ESLint with zero warnings: passed
- TypeScript: passed
- Design-token policy: passed
- Next.js static production build: passed
- Desktop Chromium journeys: 6/6
- Mobile Chromium journeys: 6/6
- Total Playwright journeys: 12/12
- Browser console and JavaScript errors: zero on the production candidate
- Fixed 1440px visual QA: passed after correcting maturity-panel stretching
- Fixed 393px visual QA: passed
- Mobile menu visual QA: passed
- Horizontal overflow: none
- Founder source images: all complete with 420px natural width in desktop and mobile browser readback

## Explicitly unverified

Reachability and frontend routing do not prove account-side behavior. Before launch, verify with controlled non-production/test transactions:

1. Diagnostic submission creates exactly one expected GHL contact.
2. The intended workflow starts once without duplicate email/SMS notifications.
3. Founding Cohort checkout grants permanent cohort recording/template access.
4. Single Session checkout grants only the selected session and recording.
5. Monthly grants all 12 sessions and recordings and stops after payment three.
6. Portal login displays only the purchaser’s intended resources.
7. Failed, abandoned, refunded, and duplicate payments follow the intended recovery path.

## Legal-link dependency

The earlier site’s `Terms` and `Privacy` controls currently resolve to `https://akrithos.com/`, not to legal documents. The standalone site therefore labels these destinations as pending instead of publishing misleading homepage links. Supply approved HTTPS Terms and Privacy URLs before launch.

## Deployment procedure

1. Create the hosting project from this source directory.
2. Use Node.js 22.23.2 or a later compatible patched release.
3. Run `npm ci --ignore-scripts`.
4. Configure the variables from `.env.example` using the approved destinations.
5. Run `npm run verify` in the deployment environment.
6. Deploy the immutable build output.
7. Attach preview DNS first; do not replace production immediately.
8. Run the browser acceptance journeys below.
9. Complete controlled GHL/payment/portal testing.
10. Promote DNS only after all accepted checks pass.

## Browser acceptance journeys

### Desktop

1. Confirm all enterprise navigation links scroll to the correct sections.
2. Select each control-plane flow and run a complete trace.
3. Open all five capability disclosures.
4. Complete the four-stage maturity exercise.
5. Run all three sandbox modes.
6. Verify all three checkout destination URLs.
7. Open the training page and Client Portal.
8. Open and close the Diagnostic modal; test Escape and focus return.
9. Submit the approved GHL test record.
10. Inspect all three founder portraits and footer navigation.

### Mobile

Repeat the same flow at 393px, including mobile-menu close behavior, iframe scrolling, touch-target size, and absence of horizontal overflow.

## Rollback

1. Keep the current public Akrithos/GHL site active during preview verification.
2. Retain the previous DNS or hosting deployment target.
3. If acceptance fails, restore the previous target.
4. Verify homepage, training, form, checkout, and portal routes after rollback.
5. Do not alter GHL workflows as part of a frontend rollback.

## Prework receipt

- **Assigned scope:** bring the approved elements, interactions, assets, and verified links from the earlier Akrithos website into the current standalone site.
- **Sources read:** current standalone source; coordinated earlier GHL HTML; live published Akrithos DOM; Saathi role profile, learning ledger, and relevant self-education report.
- **Lessons applied:** canonical-source reconciliation; minimal event-driven React state; supplied-asset preservation; no fabricated legal destinations or performance claims; fixed desktop/mobile browser proof.
- **Plan decisions changed:** added the fifth capability found in the live source; extracted all three supplied portraits byte-for-byte; rejected the old Terms/Privacy links after live readback showed they resolve to the homepage; isolated visual QA on a clean port after detecting a stale server.
- **Verification gate:** clean install, audit, lint, typecheck, token policy, production build, 12 browser journeys, console inspection, image readback, and fixed-viewport visual QA.

## AI verification prompt

```text
Audit the Akrithos standalone website without trusting this handoff. Verify exact source identity and resolved dependencies. Run npm ci --ignore-scripts, npm audit --audit-level=low, and npm run verify. Serve the production build on a clean port and confirm the enterprise navigation, control plane, evidence guide, five capability disclosures, security controls, four-stage maturity exercise, three sandbox modes, three training offers, all three founder portraits, business-impact section, readiness selector, FAQ, Client Portal, training route, Calendly fallback, and GHL Diagnostic modal. Inspect console errors and failed requests. Capture 1440px desktop and 393px mobile screenshots. Confirm no horizontal overflow. Treat form submission, payment, workflow, billing-stop, and portal-entitlement behavior as unverified unless controlled account-side tests and readback are supplied. Reject Terms and Privacy links that resolve only to the homepage.
```

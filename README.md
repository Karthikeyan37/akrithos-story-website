# Akrithos website

A Next.js, Tailwind CSS and TypeScript site for Akrithos: AI agents built around business impact, visible controls and human judgement.

## The experience (November 2026 redesign)

- **A live 3D work engine** behind the opening story (three.js, drawn in code, no downloaded models or video). The Akrithos peak glows at the centre; scrolling moves through five chapters: work arriving from everywhere, agents taking the patterns into four orbits, the boundary closing around the system, and finished work passing through the gate a person holds. The agent labels open the matching system in the showcase. A poster shows first, phones get a lighter scene without bloom, reduced motion gets still frames, and a failed WebGL context leaves the poster.
- **Agent Quest:** a two-minute game with seven rounds, XP, badges, a live agent map and an insight per answer. It ends with a level, a score, the visitor's first agent, the hours at stake (from their own estimate) and the next step: Diagnostic, blueprint or training. The report is sent by email through GoHighLevel, with consent.
- **Ask Akrithos, the guide:** a floating presence that opens the conversation ("what is taking up your team's week?"). It answers from Akrithos's approved facts, knows the section in view and the quest result, offers one next step, and can pass the conversation to a person with consent.
- **GoHighLevel connection:** server routes create or update the contact, add tags and a note, and record later interactions of known visitors as tags. See **GHL-SETUP.md** for the setup and the nurture workflows, with email drafts.
- **Night design:** the brand's ink with luminous terracotta (ember) and bronze (gold). Space Grotesk and Public Sans. Design bans: no monospace eyebrow labels, no numbered labels, no pill buttons, no gradient text, no purple or blue gradients.

## Architecture

- `src/components/world/`: the 3D engine (`engine.ts`) and its React stage with labels and fallback (`world-stage.tsx`).
- `src/components/agent-quest.tsx` and `src/lib/quest.ts`: the game and its scoring. The rules are pure functions, and the server recomputes every score from the answers.
- `src/components/ask-akrithos.tsx` and `src/app/api/ask/route.ts`: the guide. All approved facts go with each request. It has a per-visitor rate limit, a daily cap, no advice outside Akrithos, and visitor text is treated as data.
- `src/app/api/lead/route.ts`, `src/app/api/event/route.ts` and `src/lib/ghl.ts`: lead capture and interaction tags. They use same-origin checks, rate limits, a honeypot, consent required, signed tokens for later events, and the token stays on the server.
- `src/config/integrations.ts`: public destinations (checkout, portal, booking form), unchanged.
- `tailwind.config.mjs`: design tokens (adds the night palette, ember and gold).

## Operational boundary

The site creates or updates contacts, tags and notes in GoHighLevel through the API. It does not process payments, create portal users or grant entitlements; checkout, portal and the Diagnostic booking form remain the existing GHL destinations. Rate limits are kept in memory per server instance (best effort on Vercel). For hard global limits, move them to a shared store such as Upstash Redis.

## Local development

```bash
npm ci --ignore-scripts
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run verify
```

This runs:

1. ESLint with zero warnings
2. TypeScript checks
3. Token, dependency-pin, and public-registry checks
4. Next.js production build
5. Playwright journeys in desktop Chromium and mobile Chromium, against a local stand-in for GoHighLevel (`scripts/mock-ghl.mjs`), so lead capture is tested end to end without touching the real CRM. If Playwright's own Chromium is not installed, set `PW_CHROMIUM` to an installed Chromium.

## Production

```bash
npm ci --ignore-scripts
npm run build
npm run start
```

Configure the public variables documented in `.env.example`. Do not place secret API keys in `NEXT_PUBLIC_*` values.

## Known dependency

Approved Terms and Privacy URLs are not currently available. The old GHL controls resolve to the homepage rather than legal documents, so this implementation intentionally does not reproduce those misleading links.

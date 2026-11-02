import Image from "next/image";

import { AgentBuilder } from "@/components/agent-builder";
import { AgentQuest } from "@/components/agent-quest";
import { AskButton } from "@/components/ask-akrithos-link";
import { BookingButton } from "@/components/booking-provider";
import { Header } from "@/components/header";
import { HeroPreview } from "@/components/hero-preview";
import { ProductShowcase } from "@/components/product-showcase";
import { ReadinessPanel } from "@/components/readiness-panel";
import { Reveal } from "@/components/reveal";
import { StoryDepth } from "@/components/story-depth";
import { WorldStage } from "@/components/world/world-stage";
import { integrations } from "@/config/integrations";

const controls = [
  ["Your region", "Data and deployment stay in the jurisdiction your rules require: cloud region, hybrid or on-premises."],
  ["Named approvers", "Every kind of decision has an owner. Agents prepare the work; people approve what matters."],
  ["Narrow access", "Each agent sees only the fields and systems its job needs, and nothing else."],
  ["Full trail", "Every step an agent takes is logged, so you can always see what happened and why."],
] as const;

const offers = [
  { title: "Founding Cohort", level: "Beginner", price: "$250", qualifier: "paid in full", body: "All twelve live sessions, every recording kept for good, and the templates from each session.", href: integrations.foundingCheckoutUrl, cta: "Join the Founding Cohort for $250", featured: true },
  { title: "Single Session", level: "One week", price: "$30", qualifier: "one-time", body: "One live session and its recording. A good way to see how we teach.", href: integrations.singleSessionCheckoutUrl, cta: "Join a Single Session for $30", featured: false },
  { title: "Monthly", level: "Full cohort", price: "$100/mo", qualifier: "3 payments", body: "All twelve sessions and recordings; billing stops after the third payment.", href: integrations.monthlyCheckoutUrl, cta: "Join Monthly at $100/mo", featured: false },
] as const;

const team = [
  { name: "Alex Buriak", role: "Co-Founder", image: "/team/alex-buriak.webp" },
  { name: "Scott Mendell", role: "Co-Founder", image: "/team/scott-mendell.webp" },
  { name: "Jen Gaudet", role: "Co-Founder", image: "/team/jen-gaudet.webp" },
] as const;

const faqs = [
  ["What happens in the Diagnostic?", "We take one workflow and define its target, its data boundary, the acceptance criteria and the human review path. You leave with a clear build decision, before any build is recommended."],
  ["How long until a first agent is working?", "It depends on the workflow and your systems, so we scope it in the Diagnostic rather than guess here. We always start with one workflow, prove it, then add the next."],
  ["Can our data and deployment stay in our region?", "Yes. Regional, on-premises and hybrid deployments are scoped around your requirements, and every agent action is logged."],
  ["Who stays in control?", "Your people. Agents prepare and route the work; a named person approves anything that matters before it goes out."],
  ["Do the demos on this page use client data?", "No. The 3D scene, the showcases, Agent Quest and the blueprint are illustrative and use no client data."],
  ["I want to learn to build agents myself.", "Join the live training: twelve practical weekly sessions on Tuesdays, 12:00 to 1:00 PM Central, no coding experience required."],
] as const;

export default function HomePage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <WorldStage storyId="top" />

      <main id="main">
        <section id="top" className="story" aria-label="What Akrithos does">
          <StoryDepth chapters={5} />
          <div data-chapter className="chapter chapter-hero">
            <div className="chapter-copy">
              <h1 className="hero-title">Your best people are buried in work a machine should do.</h1>
              <p className="hero-lead">Akrithos builds AI agents that take the repeat work off their desks. Inside your walls, with your people making every call that matters.</p>
              <div className="hero-actions">
                <a href="#quest" className="button button-primary button-large">Play Agent Quest</a>
                <AskButton className="button button-ghost button-large">Ask Akrithos anything</AskButton>
              </div>
              <p className="hero-note">Two minutes, no sign-up. Find the agent your business is missing.</p>
            </div>
            <HeroPreview />
            <a href="#chapter-work" className="scroll-cue" aria-label="Scroll to see how it works"><span aria-hidden="true" /></a>
          </div>

          <div data-chapter id="chapter-work" className="chapter chapter-left">
            <div className="chapter-copy">
              <h2>Work arrives from everywhere.</h2>
              <p>Enquiries, invoices, calls, forms and the same twelve questions. All day, every day. Most of it follows a pattern, and patterns are what agents are for.</p>
            </div>
          </div>

          <div data-chapter className="chapter chapter-right">
            <div className="chapter-copy">
              <h2>Agents take the patterns.</h2>
              <p>Each agent owns one kind of work: qualifying leads, answering from your documents, checking operations, serving customers. Point at one to see it at work.</p>
            </div>
          </div>

          <div data-chapter className="chapter chapter-left">
            <div className="chapter-copy">
              <h2>Nothing leaves your boundary.</h2>
              <p>Cloud region, hybrid or on-premises. Your data stays where your rules say it stays, each agent sees only what its job needs, and every step is logged.</p>
            </div>
          </div>

          <div data-chapter className="chapter chapter-left chapter-final">
            <div className="chapter-copy">
              <h2>Your people still decide.</h2>
              <p>Agents prepare the work. A named person approves what matters before anything goes out. That is how AI earns its place in your company.</p>
              <div className="hero-actions">
                <a href="#quest" className="button button-primary">See how ready you are</a>
                <BookingButton className="button button-ghost">Book your Diagnostic</BookingButton>
              </div>
            </div>
          </div>
        </section>

        <ProductShowcase />

        <section id="quest" className="section night-section quest-section" aria-labelledby="quest-title">
          <div className="wrap">
            <Reveal className="section-head">
              <h2 id="quest-title">Agent Quest: find the agent your business is missing.</h2>
              <p>Seven quick rounds. Every answer earns an insight, and the map lights up your first agent. About two minutes, no sign-up to play.</p>
            </Reveal>
            <AgentQuest />
          </div>
        </section>

        <section id="live-agent" className="section night-section on-night" aria-labelledby="builder-title">
          <div className="wrap">
            <Reveal className="section-head section-head-split">
              <h2 id="builder-title">Describe one process. Watch it become a blueprint.</h2>
              <p>Pick a starter or write a sentence or two. AI drafts the inputs, the stages and where a person reviews. A conversation starter, not a scoped plan.</p>
            </Reveal>
            <AgentBuilder />
          </div>
        </section>

        <section id="security" className="section night-section security-section" aria-labelledby="security-title">
          <div className="wrap security-grid">
            <Reveal className="security-copy">
              <h2 id="security-title">Built to work inside your boundaries.</h2>
              <p>Our principals and engineers come from defence, aerospace and government-grade secure environments. Control is designed before anything reaches production.</p>
              <ul className="sector-list" aria-label="Sectors we serve">
                {["Financial services", "Government", "Healthcare", "Enterprise"].map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Reveal>
            <div className="control-grid">
              {controls.map(([title, body], i) => (
                <Reveal key={title} className="control-card" delay={i * 80}>
                  <span className="control-light" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="diagnostic" className="section night-section diagnostic-section on-night" aria-labelledby="diagnostic-title-h">
          <div className="wrap diagnostic-grid">
            <Reveal>
              <h2 id="diagnostic-title-h">Bring one stuck workflow. Leave with the build decision.</h2>
              <p className="section-lead">One focused session. Together we define:</p>
              <ul className="leave-list">
                <li>The target, and how it will be measured</li>
                <li>The data boundary: what the agent may see</li>
                <li>The acceptance criteria for going live</li>
                <li>Who reviews what, and when</li>
              </ul>
              <BookingButton className="button button-primary button-large">Book your Diagnostic</BookingButton>
            </Reveal>
            <ReadinessPanel />
          </div>
        </section>

        <section id="team" className="section night-section" aria-labelledby="team-title">
          <div className="wrap">
            <Reveal className="section-head section-head-split">
              <h2 id="team-title">Small by design. Accountable end to end.</h2>
              <p>Operators and engineers who connect the business case, the system, the controls and the deployment. You work with us directly.</p>
            </Reveal>
            <div className="team-grid">
              {team.map((p, i) => (
                <Reveal key={p.name} className="team-card" delay={i * 90}>
                  <Image src={p.image} alt={`Portrait of ${p.name}, Akrithos ${p.role}`} width={420} height={420} />
                  <div><h3>{p.name}</h3><p>{p.role}</p></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="live-program" className="section night-section training-section" aria-labelledby="live-program-title">
          <div className="wrap">
            <Reveal className="section-head section-head-split">
              <h2 id="live-program-title">Learn to build agents yourself. Live, twelve weeks.</h2>
              <div>
                <p>Tuesdays, 12:00 to 1:00 PM Central. No coding experience required.</p>
                <a href={integrations.trainingUrl} className="text-link">View the training page</a>
              </div>
            </Reveal>
            <div className="offer-grid" aria-label="Akrithos training offers">
              {offers.map((o, i) => (
                <Reveal key={o.title} className={`offer-card${o.featured ? " offer-featured" : ""}`} delay={i * 90}>
                  <p className="offer-level">{o.level}</p>
                  <h3>{o.title}</h3>
                  <p className="offer-price"><b>{o.price}</b> <span>{o.qualifier}</span></p>
                  <p className="offer-body">{o.body}</p>
                  {o.featured ? (
                    <ul className="offer-includes">
                      <li>Twelve live sessions with Alex, Tuesdays 12:00 to 1:00 PM Central</li>
                      <li>Every recording, yours to keep in the Client Portal</li>
                      <li>The templates from every session</li>
                      <li>No coding experience required</li>
                    </ul>
                  ) : null}
                  <a href={o.href} className={`button ${o.featured ? "button-primary" : "button-ghost"}`}>{o.cta}</a>
                </Reveal>
              ))}
            </div>
            <p className="fine-print">All prices in USD. Founding Cohort access is permanent. Monthly is limited to three payments.</p>
          </div>
        </section>

        <section id="faq" className="section night-section" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <Reveal>
              <h2 id="faq-title">Straight answers.</h2>
              <p className="section-lead">Something else on your mind? <AskButton className="text-link">Ask the guide</AskButton></p>
            </Reveal>
            <div className="faq-list">
              {faqs.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true" /></summary><p>{a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <a href="#top" aria-label="Back to top"><Image src="/akrithos-logo-full-night.png" alt="Akrithos: precision at speed" width={964} height={394} className="footer-logo" /></a>
            <p>AI agents built around business impact, visible controls and human judgement.</p>
          </div>
          <nav aria-label="Footer navigation"><a href="#platform">Agents</a><a href="#quest">Agent Quest</a><a href="#security">Security</a><a href="#live-program">Training</a></nav>
          <nav aria-label="Account and contact"><a href={integrations.portalUrl}>Member Login</a><a href={integrations.calendlyUrl}>Calendar</a><a href={`mailto:${integrations.contactEmail}`}>{integrations.contactEmail}</a></nav>
        </div>
        <p className="wrap footer-base">© Akrithos. Terms and Privacy links will appear here once approved.</p>
      </footer>
    </>
  );
}

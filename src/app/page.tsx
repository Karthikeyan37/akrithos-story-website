import Image from "next/image";

import { AgentBuilder } from "@/components/agent-builder";
import { AgentPicker } from "@/components/agent-picker";
import { AgentQuest } from "@/components/agent-quest";
import { AskButton } from "@/components/ask-akrithos-link";
import { BookingButton } from "@/components/booking-provider";
import { Header } from "@/components/header";
import { HeroQuestStart } from "@/components/hero-quest-start";
import { ProductShowcase } from "@/components/product-showcase";
import { ReadinessPanel } from "@/components/readiness-panel";
import { Reveal } from "@/components/reveal";
import { StoryDepth } from "@/components/story-depth";
import { WorldStage } from "@/components/world/world-stage";
import { integrations } from "@/config/integrations";

const controls = [
  ["Your data stays put", "Your data stays where your rules say: in the cloud region you choose, on your own servers, or a mix."],
  ["A named person approves", "Every kind of decision has an owner. Agents get the work ready; people approve what matters."],
  ["Only what it needs", "Each agent can see only the information its job needs, and nothing else."],
  ["Every step recorded", "Every step an agent takes is written down, so you can always see what happened and why."],
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
  ["What happens in the Diagnostic?", "We look at one task with you and agree the goal, what the agent may see, what \"working\" means, and who checks it. You leave knowing what to build, before we recommend building anything."],
  ["How long until a first agent is working?", "It depends on the task and your systems, so we work it out in the Diagnostic rather than guess here. We always start with one task, prove it works, then add the next."],
  ["Can our data stay in our region?", "Yes. We can keep everything in your region, on your own servers, or a mix, whatever your rules need. Every step an agent takes is recorded."],
  ["Who stays in control?", "Your people. Agents get the work ready and pass it on; a named person approves anything important before it goes out."],
  ["Do the demos on this page use client data?", "No. The 3D scene, the examples, Agent Quest and the planner are examples only and use no client data."],
  ["I want to learn to build agents myself.", "Join the live training: twelve practical weekly sessions on Tuesdays, 12:00 to 1:00 PM Central, no coding experience required."],
] as const;

export default function HomePage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <WorldStage />

      <main id="main">
        <section id="top" className="story story-hero" aria-label="What Akrithos does">
          <StoryDepth chapters={5} />
          <div data-chapter className="chapter chapter-hero">
            <div className="chapter-copy">
              <h1 className="hero-title">Your best people are buried in work a machine should do.</h1>
              <p className="hero-lead">We build AI helpers, called agents, that do the repeat work for your team. Your data stays safe, and your people still make the big decisions.</p>
              <div className="hero-actions">
                <a href="#quest" className="button button-primary button-large">Play Agent Quest</a>
                <AskButton className="button button-ghost button-large">Ask Akrithos anything</AskButton>
              </div>
              <p className="hero-note">Takes 2 minutes. No sign-up. Find out which agent would help you most.</p>
            </div>
            <HeroQuestStart />
          </div>
        </section>

        <section id="quest" className="section night-section quest-section" aria-labelledby="quest-title">
          <div className="wrap">
            <Reveal className="section-head">
              <h2 id="quest-title">Agent Quest: find the agent your business needs.</h2>
              <p>7 quick questions. Each answer teaches you something, and at the end you will see which agent fits you best. About 2 minutes, no sign-up.</p>
            </Reveal>
            <AgentQuest />
          </div>
        </section>

        <section id="story" className="story" aria-label="How an agent works">
          <div data-chapter id="chapter-work" className="chapter chapter-left">
            <div className="chapter-copy">
              <h2>Work arrives from everywhere.</h2>
              <p>Emails, calls, forms, invoices and the same questions, over and over. Most of it is repeat work, and repeat work is exactly what agents are good at.</p>
            </div>
          </div>

          <div data-chapter className="chapter chapter-right">
            <div className="chapter-copy">
              <h2>One agent. One job. Done the same way every time.</h2>
              <p>Each agent has one clear job, like answering new enquiries or answering questions from your documents. Pick one to see how it works.</p>
              <AgentPicker />
            </div>
          </div>

          <div data-chapter className="chapter chapter-left">
            <div className="chapter-copy">
              <h2>Your data stays with you.</h2>
              <p>It stays in your region or on your own servers. Each agent sees only what its job needs, and every step is recorded.</p>
            </div>
          </div>

          <div data-chapter className="chapter chapter-left chapter-final">
            <div className="chapter-copy">
              <h2>Your people still decide.</h2>
              <p>Agents get the work ready. A person checks anything important before it goes out. That is how AI earns your trust.</p>
              <div className="hero-actions">
                <a href="#quest" className="button button-primary">Play Agent Quest</a>
                <BookingButton className="button button-ghost">Book your Diagnostic</BookingButton>
              </div>
            </div>
          </div>
        </section>

        <ProductShowcase />

        <section id="live-agent" className="section night-section on-night" aria-labelledby="builder-title">
          <div className="wrap">
            <Reveal className="section-head section-head-split">
              <h2 id="builder-title">Describe one task. Get a simple plan for an agent.</h2>
              <p>Pick an example, or write a sentence or two. AI sketches what the agent needs, its steps, and where a person checks. A starting point, not a final plan.</p>
            </Reveal>
            <AgentBuilder />
          </div>
        </section>

        <section id="security" className="section night-section security-section" aria-labelledby="security-title">
          <div className="wrap security-grid">
            <Reveal className="security-copy">
              <h2 id="security-title">Safe by design.</h2>
              <p>Our team comes from defence, aerospace and government, where security is never optional. We build in the safety checks before anything goes live.</p>
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
              <h2 id="diagnostic-title-h">Bring one task that slows you down. Leave knowing what to build.</h2>
              <p className="section-lead">One focused session. Together we agree:</p>
              <ul className="leave-list">
                <li>The goal, and how we will measure it</li>
                <li>What information the agent may see</li>
                <li>What &ldquo;working&rdquo; looks like before it goes live</li>
                <li>Who checks what, and when</li>
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
              <p>A small team of business and technology people who see your project through, from first idea to launch. You work with us directly.</p>
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
          <nav aria-label="Footer navigation"><a href="#quest">Agent Quest</a><a href="#platform">Agents</a><a href="#security">Security</a><a href="#live-program">Training</a></nav>
          <nav aria-label="Account and contact"><a href={integrations.portalUrl}>Member Login</a><a href={integrations.calendlyUrl}>Calendar</a><a href={`mailto:${integrations.contactEmail}`}>{integrations.contactEmail}</a></nav>
        </div>
        <p className="wrap footer-base">© Akrithos. Terms and Privacy links will appear here once approved.</p>
      </footer>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBooking } from "@/components/booking-provider";
import { integrations } from "@/config/integrations";
import { knownVisitor, saveLeadToken, track } from "@/lib/track";

/**
 * The Akrithos guide: a presence in the corner that starts the conversation ("what is taking up your team's
 * week?"), answers from the approved facts, knows what the visitor has looked at and played, and offers one next
 * step at a time. It can pass the conversation to a person, with the visitor's consent.
 */
type ChatMessage = { role: "user" | "assistant"; content: string };
type Next = "quest" | "book" | "training" | "blueprint" | "showcase" | "none";

const SECTIONS = ["top", "quest", "story", "platform", "live-agent", "security", "diagnostic", "team", "live-program", "faq"] as const;
const STARTERS: Record<string, string[]> = {
  top: ["Chasing and qualifying leads", "Answering the same questions", "Paperwork and approvals", "Customer requests"],
  story: ["Which agent fits a small team?", "Can our data stay in our region?", "Where do people stay in control?"],
  platform: ["Which agent fits a small team?", "Where do people stay in control?", "How long does a first agent take?"],
  quest: ["What does my level mean?", "What happens in the Diagnostic?", "Can I start with training?"],
  "live-agent": ["What makes a good task to hand to an agent?", "What should I not type in here?"],
  security: ["Can our data stay in our region?", "Who approves what an agent does?"],
  diagnostic: ["What should I bring to the Diagnostic?", "What do I leave with?"],
  team: ["Who is behind Akrithos?", "How do you work with clients?"],
  "live-program": ["Which training option fits me?", "Do I need to code?"],
  faq: ["What happens after I book?", "Do the demos use client data?"],
};
const ACTIONS: Record<Exclude<Next, "none">, string> = {
  quest: "Play Agent Quest",
  book: "Book your Diagnostic",
  training: "See the live training",
  blueprint: "Open the blueprint builder",
  showcase: "See the agents at work",
};
const GREETING = "Hi, I am the Akrithos guide. What is taking up most of your team's week? Pick one or tell me in your own words.";

function questContext() {
  try { return JSON.parse(localStorage.getItem("ak-quest") || "null") as { level?: string; agent?: string; score?: number } | null; } catch { return null; }
}

export function AskAkrithos() {
  const { openBooking } = useBooking();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [next, setNext] = useState<Next>("none");
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [section, setSection] = useState<string>("top");
  const [teaser, setTeaser] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<"hidden" | "offer" | "form" | "sent">("hidden");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const ask = useCallback(async (question: string) => {
    const text = question.trim();
    if (text.length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setQuery(""); setAsking(true); setError(null); setNext("none");
    const history = [...messagesRef.current, { role: "user" as const, content: text }];
    messagesRef.current = history;
    setMessages(history);
    track("asked-assistant");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // The greeting is ours, not part of the conversation the model sees.
        body: JSON.stringify({ messages: history, context: { section, quest: questContext() } }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { answer?: string; error?: string; demo?: boolean; next?: Next };
      if (controller.signal.aborted) return;
      if (!res.ok) { setError(data.error ?? "The guide is unavailable right now."); return; }
      const withReply = [...messagesRef.current, { role: "assistant" as const, content: data.answer ?? "" }];
      messagesRef.current = withReply;
      setMessages(withReply);
      setDemo(Boolean(data.demo));
      setNext(data.next ?? "none");
      const userTurns = withReply.filter((m) => m.role === "user").length;
      if (userTurns >= 2 && !knownVisitor()) setHandoff((h) => (h === "hidden" ? "offer" : h));
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("The guide could not be reached. You can still book the Diagnostic or email info@akrithos.com.");
    } finally {
      if (!controller.signal.aborted) setAsking(false);
    }
  }, [section]);

  const openPanel = useCallback((prefill?: string) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setTeaser(null);
    setOpen(true);
    if (prefill) void ask(prefill);
  }, [ask]);
  const closePanel = useCallback(() => { abortRef.current?.abort(); setOpen(false); }, []);

  // Other parts of the page can open the guide with a question.
  useEffect(() => {
    const onOpen = (e: Event) => openPanel((e as CustomEvent<{ prefill?: string }>).detail?.prefill);
    window.addEventListener("akrithos:open-assistant", onOpen);
    return () => window.removeEventListener("akrithos:open-assistant", onOpen);
  }, [openPanel]);

  // Which part of the page the visitor is on (for starters and context).
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setSection(best.target.id);
    }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.2, 0.5] });
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // A gentle opener, once per visit: after a while on the page, or right after the quest.
  useEffect(() => {
    let shown = false;
    try { shown = sessionStorage.getItem("ak-teased") === "1"; } catch { /* ignore */ }
    if (shown) return;
    const show = (text: string) => {
      if (open) return;
      setTeaser(text);
      try { sessionStorage.setItem("ak-teased", "1"); } catch { /* ignore */ }
    };
    const timer = window.setTimeout(() => show("Curious which agent would save your team the most time? Ask me."), 28_000);
    const onQuest = () => show("Nice result. Want me to explain what your first agent would actually do?");
    window.addEventListener("akrithos:quest-done", onQuest, { once: true });
    if (knownVisitor()) track("returned");
    return () => { window.clearTimeout(timer); window.removeEventListener("akrithos:quest-done", onQuest); };
  }, [open]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [messages, asking, handoff]);

  // Dialog manners: focus inside, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    document.body.dataset.assistantOpen = "true";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const target = returnFocus.current ?? triggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return closePanel();
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(focusTimer); delete document.body.dataset.assistantOpen; document.removeEventListener("keydown", onKey); target?.focus(); };
  }, [open, closePanel]);

  function act(n: Exclude<Next, "none">) {
    if (n === "book") { track("opened-booking"); closePanel(); window.setTimeout(openBooking, 0); return; }
    if (n === "training") { track("viewed-training"); window.location.href = integrations.trainingUrl; return; }
    closePanel();
    const id = n === "quest" ? "quest" : n === "blueprint" ? "live-agent" : "platform";
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const starters = messages.length ? [] : STARTERS[section] ?? STARTERS.top;

  return (
    <>
      {teaser && !open ? (
        <div className="guide-teaser" role="status">
          <button type="button" className="guide-teaser-text" onClick={() => openPanel()}>{teaser}</button>
          <button type="button" className="guide-teaser-close" aria-label="Dismiss" onClick={() => setTeaser(null)}>×</button>
        </div>
      ) : null}
      <button ref={triggerRef} type="button" className="guide-orb" data-open={open} aria-label="Ask Akrithos" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? closePanel() : openPanel())}>
        <span className="guide-orb-core" aria-hidden="true"><i /><i /><i /></span>
        <span className="guide-orb-label">Ask Akrithos</span>
      </button>

      {open ? (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="guide-title" className="guide-panel">
          <header className="guide-head">
            <span className="guide-head-core" aria-hidden="true"><i /><i /><i /></span>
            <div>
              <h2 id="guide-title">Akrithos guide</h2>
              <p>{asking ? "Thinking…" : demo ? "Preview mode" : "Answers from Akrithos's own information"}</p>
            </div>
            <button type="button" className="guide-close" aria-label="Close the guide" onClick={closePanel}>×</button>
          </header>

          <div ref={logRef} className="guide-log" aria-live="polite">
            <p className="guide-msg guide-msg-ai">{GREETING}</p>
            {messages.map((m, i) => <p key={i} className={`guide-msg ${m.role === "user" ? "guide-msg-me" : "guide-msg-ai"}`}>{m.content}</p>)}
            {asking ? <p className="guide-typing" aria-label="The guide is typing"><i /><i /><i /></p> : null}
            {error ? <p className="guide-error" role="alert">{error}</p> : null}
            {!asking && next !== "none" ? (
              <div className="guide-actions"><button type="button" className="button button-primary" onClick={() => act(next)}>{ACTIONS[next]}</button></div>
            ) : null}
            {handoff === "offer" ? (
              <div className="guide-handoff">
                <p>Want someone from Akrithos to follow up on this personally?</p>
                <div><button type="button" className="button button-ghost" onClick={() => setHandoff("form")}>Yes, please</button><button type="button" className="guide-link" onClick={() => setHandoff("sent")}>Not now</button></div>
              </div>
            ) : handoff === "form" ? (
              <Handoff topic={messages.find((m) => m.role === "user")?.content ?? ""} interest={next === "training" ? "training" : next === "blueprint" ? "blueprint" : "diagnostic"} onDone={() => setHandoff("sent")} />
            ) : null}
            {starters.length ? (
              <div className="guide-starters">{starters.map((s) => <button key={s} type="button" onClick={() => void ask(s)}>{s}</button>)}</div>
            ) : null}
          </div>

          <form className="guide-input" onSubmit={(e) => { e.preventDefault(); void ask(query); }}>
            <label htmlFor="guide-q" className="sr-only">Your question</label>
            <input ref={inputRef} id="guide-q" value={query} maxLength={300} autoComplete="off" onChange={(e) => setQuery(e.target.value)} placeholder="Tell me about your work…" />
            <button type="submit" className="button button-primary" disabled={asking || query.trim().length < 2}>Send</button>
          </form>
          <p className="guide-note">Please do not share personal, patient or confidential details here.</p>
        </div>
      ) : null}
    </>
  );
}

function Handoff({ topic, interest, onDone }: { topic: string; interest: string; onDone: () => void }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "assistant", firstName: f.get("firstName"), email: f.get("email"), consent: f.get("consent") === "on", website: f.get("website"), topic, interest }) });
      const data = (await res.json()) as { ok?: boolean; error?: string; token?: string; preview?: boolean };
      if (!res.ok || !data.ok) { setError(data.error ?? "That did not go through."); return; }
      saveLeadToken(data.token, String(f.get("firstName") ?? ""));
      setDone(data.preview ? "Preview mode: once GoHighLevel is connected, this reaches the team." : `Thanks, ${String(f.get("firstName") ?? "")}. Someone from Akrithos will be in touch soon.`);
      window.setTimeout(onDone, 6000);
    } catch { setError("We could not reach the server."); } finally { setSending(false); }
  }
  if (done) return <p className="guide-msg guide-msg-ai" role="status">{done}</p>;
  return (
    <form className="guide-form" onSubmit={submit} noValidate>
      <input name="firstName" placeholder="First name" aria-label="First name" autoComplete="given-name" maxLength={60} required />
      <input name="email" type="email" placeholder="Work email" aria-label="Work email" autoComplete="email" spellCheck={false} maxLength={254} required />
      <input name="website" className="quest-honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="guide-consent"><input type="checkbox" name="consent" /> <span>Contact me about this, and send occasional ideas. Unsubscribe any time.</span></label>
      {error ? <p className="guide-error" role="alert">{error}</p> : null}
      <button type="submit" className="button button-primary" disabled={sending}>{sending ? "Sending…" : "Send to the team"}</button>
    </form>
  );
}

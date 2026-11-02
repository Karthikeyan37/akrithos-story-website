"use client";

import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { label: "Akrithos Workroom", target: "#platform" },
  { label: "Solutions", target: "#solutions" },
  { label: "Security", target: "#security" },
  { label: "Maturity exercise", target: "#gauntlet" },
  { label: "Agent sandbox", target: "#sandbox" },
  { label: "Live training program", target: "#live-program" },
  { label: "Team", target: "#team" },
  { label: "FAQ", target: "#faq" },
];

/**
 * Navigation only. Question-answering lives in one place — the Ask
 * Akrithos panel — so visitors aren't asked to understand three
 * different AI interfaces. A query with no nav match hands off to it.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) setQuery("");
          return !o;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  function goTo(target: string) {
    setOpen(false);
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  }

  function handOffToAssistant() {
    const q = query;
    setOpen(false);
    window.dispatchEvent(new CustomEvent("akrithos:open-assistant", { detail: { prefill: q } }));
  }

  return (
    <>
      <button
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className="hidden items-center gap-2 rounded-control border border-stone-100 px-3 py-2 text-label text-stone-600 hover:border-terracotta transition-colors xl:flex"
        aria-label="Open navigation"
      >
        <span>Navigate</span>
        <kbd className="font-mono text-label bg-stone-50 px-2 py-1 rounded-xs">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-ink/40"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-copy rounded-feature bg-paper shadow-lift overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
              <span className="text-terracotta font-mono">›</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered.length === 0 && query.trim().length >= 3) {
                    handOffToAssistant();
                  }
                }}
                placeholder="Jump to a section..."
                className="flex-1 text-label focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="icon-button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {filtered.length > 0 &&
                filtered.map((item) => (
                  <button
                    key={item.target}
                    onClick={() => goTo(item.target)}
                    className="w-full text-left px-4 py-3 text-label hover:bg-stone-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}

              {filtered.length === 0 && query.trim().length >= 3 && (
                <button
                  onClick={handOffToAssistant}
                  className="w-full text-left px-4 py-3 text-label text-terracotta hover:bg-stone-50 transition-colors"
                >
                  Ask Akrithos: &quot;{query}&quot; →
                </button>
              )}

              {filtered.length === 0 && query.trim().length < 3 && (
                <p className="px-4 py-3 text-label text-stone-400">
                  Type to jump to a section, or ask a question.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

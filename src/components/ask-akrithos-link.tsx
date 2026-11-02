"use client";

import type { ButtonHTMLAttributes } from "react";

/** Opens the Akrithos guide, optionally with a first question. */
export function AskButton({ prefill, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { prefill?: string }) {
  return (
    <button type="button" {...props} onClick={() => window.dispatchEvent(new CustomEvent("akrithos:open-assistant", { detail: { prefill } }))}>
      {children}
    </button>
  );
}

export function AskAkrithosLink() {
  return <AskButton className="text-link">Ask Akrithos</AskButton>;
}

"use client";

import Script from "next/script";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { integrations } from "@/config/integrations";
import { track } from "@/lib/track";

type BookingContextValue = {
  openBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("useBooking must be used inside BookingProvider.");
  return value;
}

export function BookingButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { openBooking } = useBooking();
  return (
    <button type="button" onClick={openBooking} {...props}>
      {children}
    </button>
  );
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openBooking = useCallback(() => {
    track("opened-booking");
    returnFocus.current = document.activeElement as HTMLElement;
    setOpen(true);
  }, []);

  const closeBooking = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.modalOpen = "true";
    closeButton.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBooking();
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(
        dialog.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      delete document.body.dataset.modalOpen;
      document.removeEventListener("keydown", onKeyDown);
      returnFocus.current?.focus();
    };
  }, [closeBooking, open]);

  return (
    <BookingContext.Provider value={{ openBooking }}>
      {children}
      <Script src={integrations.diagnosticScriptUrl} strategy="lazyOnload" />
      {open ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBooking();
          }}
        >
          <div
            ref={dialog}
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnostic-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Start with clarity</p>
                <h2 id="diagnostic-title" className="font-display text-h3 font-semibold">
                  Book your Diagnostic
                </h2>
              </div>
              <button
                ref={closeButton}
                className="icon-button"
                type="button"
                aria-label="Close booking form"
                onClick={closeBooking}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="text-body text-stone-600">
              Share the workflow, outcome, and constraints so the team can prepare for the
              conversation.
            </p>
            <iframe
              className="diagnostic-frame"
              src={integrations.diagnosticFormUrl}
              id={`inline-${integrations.diagnosticFormId}`}
              title="Akrithos Diagnostic booking form"
              loading="lazy"
            />
            <div className="modal-fallback">
              <span>Form unavailable?</span>
              <a href={integrations.calendlyUrl}>Open Calendly</a>
              <span aria-hidden="true">·</span>
              <a href={`mailto:${integrations.contactEmail}`}>{integrations.contactEmail}</a>
            </div>
          </div>
        </div>
      ) : null}
    </BookingContext.Provider>
  );
}

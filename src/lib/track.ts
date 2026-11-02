import type { SiteEvent } from "./events";

/**
 * The browser side of the follow-up: after a visitor has asked for something and agreed to hear from us, the
 * server hands back a signed token. It is kept in this browser only, and lets a few named interactions be added
 * to their contact (once per visit each). No token, no tracking.
 */
const KEY = "ak-lead";

export function saveLeadToken(token: string | null | undefined, firstName: string) {
  try {
    if (token) localStorage.setItem(KEY, JSON.stringify({ token, firstName }));
  } catch { /* storage unavailable: nothing is tracked */ }
}

export function knownVisitor(): { firstName: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as { token?: string; firstName?: string } | null;
    return v?.token ? { firstName: v.firstName ?? "" } : null;
  } catch {
    return null;
  }
}

export function track(event: SiteEvent) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as { token?: string } | null;
    if (!v?.token) return;
    const sent = `ak-sent-${event}`;
    if (sessionStorage.getItem(sent)) return;
    sessionStorage.setItem(sent, "1");
    void fetch("/api/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: v.token, event }), keepalive: true }).catch(() => undefined);
  } catch { /* storage unavailable */ }
}

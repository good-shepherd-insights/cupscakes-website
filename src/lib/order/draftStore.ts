// Client-side persistent draft for the multi-step order flow — the single
// source of truth for every field the customer enters across /order/* steps.
// Backed by sessionStorage so values survive step navigation and reloads
// within the session, and are gone when the tab closes (we don't retain PII
// longer than the in-progress order). Fields are captured incrementally as
// they're entered (see bindOrderCapture) and pushed to an external sink (see
// draftSink) — never via a form submission.

export type OrderDraft = Record<string, string>;

const KEY = 'cupscakes.orderDraft';

export function getDraft(): OrderDraft {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as OrderDraft;
  } catch {
    return {};
  }
}

/** Merge `patch` into the stored draft and return the result. Best-effort:
 *  never throws, so capturing a field can never break the page. */
export function updateDraft(patch: OrderDraft): OrderDraft {
  const next = { ...getDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable/full — capture is best-effort */
  }
  return next;
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Derive the chosen fulfillment method from an /order/* step URL, so the
 *  branch the customer picked (pickup vs delivery) is recorded in the draft
 *  even though it was selected via a plain link on /order. Kept here, not in
 *  bindOrderCapture, so the capture wiring stays generic and URL-agnostic. */
export function fulfillmentFromPath(pathname: string): 'pickup' | 'delivery' | undefined {
  if (pathname.includes('/pickup')) return 'pickup';
  if (pathname.includes('/delivery')) return 'delivery';
  return undefined;
}

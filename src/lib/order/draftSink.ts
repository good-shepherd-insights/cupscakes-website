import type { OrderDraft } from './draftStore';

// The one boundary to the external receiving end (planned: a Google Sheet via
// an Apps Script web-app URL). STUBBED: with no endpoint the draft is captured
// but not transmitted — wiring the destination later touches only this file.
// Timing is the caller's concern (bindOrderCapture debounces), so no timer here.
const SINK_ENDPOINT: string | null = null;

export function syncDraft(draft: OrderDraft): void {
  if (!SINK_ENDPOINT) {
    if (import.meta.env.DEV) console.debug('[orderDraft] captured (no sink wired):', draft);
    return;
  }
  // void fetch(SINK_ENDPOINT, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(draft),
  // }).catch(() => { /* best-effort */ });
}

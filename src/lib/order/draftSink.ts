// The external "receiving end" for the order draft — STUBBED.
//
// System design: as fields are entered they're pushed here (debounced) so the
// collected data lands in an external store. Planned destination: a Google
// Sheet via a Google Apps Script web-app URL (or a SheetDB/Sheety endpoint).
// The endpoint and transport are intentionally deferred — everything upstream
// treats this as an opaque syncDraft(draft) call, so wiring the real
// destination later touches ONLY this file.
import type { OrderDraft } from './draftStore';

// TODO(receiving-end): set to the Apps Script web-app URL (or SheetDB endpoint),
// then implement `send` below with a real fetch. Left null so the sink is a
// safe no-op until the destination is chosen.
const SINK_ENDPOINT: string | null = null;

/** Push the current draft to the external store. WHEN this is called is the
 *  caller's concern — bindOrderCapture already debounces to ~one field's worth
 *  of typing, so there's no second timer here; the sink just transmits. */
export function syncDraft(draft: OrderDraft): void {
  if (!SINK_ENDPOINT) {
    if (import.meta.env.DEV) {
      // Proves capture works end-to-end before any destination is wired.
      console.debug('[orderDraft] captured (no sink wired):', draft);
    }
    return;
  }
  // Deferred receiving-end implementation, e.g.:
  //   void fetch(SINK_ENDPOINT, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(draft),
  //   }).catch(() => { /* best-effort, never blocks the UI */ });
}

# FEATURE(order-flow-incremental-capture)

## Request

Re-architect the multi-step order flow so the customer's data is **collected incrementally as it is entered** (not submitted via an HTML `<form>` POST), pushed to an **external sink** (a Google Sheet via an Apps Script web-app URL / SheetDB-style service) that is **abstracted and stubbed for now** ("receiving end isn't important yet"). This also removes the `method="post"` page navigation that currently 405s on Vercel and leaves the `/order/delivery/date` page rendering incorrectly.

## System Design

```
input/change (as entered)
        │  debounced
        ▼
  draftStore  ──persist──►  sessionStorage   (single source of truth, per-tab)
        │
        ▼
   draftSink.syncDraft(draft)   ◄── the ONE boundary to the external world
        │  (STUBBED today: no-op + console in dev)
        ▼
   [later] fetch → Google Apps Script web-app URL → Google Sheet row
```

- **No `<form>` POST and no page-navigation POST anywhere** → nothing for Vercel to 405. Steps move via client-side `navigate()`.
- **Capture is event-driven but debounced to ~one field's fill time** (see Implementation Update), not per keystroke.

> **Implementation Update — capture cadence (supersedes the per-`input` writes + 600ms sink debounce shown in the code blocks below).**
> Capture does **not** write per keystroke. `bindOrderCapture` debounces a single `commit()` to `FIELD_FILL_DEBOUNCE_MS = 3_000` (~3s of idle: longer than the gap between keystrokes so it won't fire mid-field, short enough to fire right after a field is finished — entering a simple text box takes only a few seconds). Every `input` resets the timer; on pause it snapshots the whole form once → `updateDraft` → `syncDraft`. The **seed** writes to the store on load but does not transmit. **Submit** cancels the pending timer, flushes one final snapshot, then navigates. Consequently `draftSink` carries **no internal debounce** — timing is owned solely by the capture layer; the sink just transmits what it's handed.
- **The receiving end is a single module** (`draftSink.ts`). Wiring the real Google Sheet later changes only that file; nothing upstream knows or cares.
- The `<form>` element **stays** (free HTML5 validation, Enter-to-advance, accessibility) but is never submitted to a server.

Researched options for the eventual sink (deferred): a **Google Apps Script web app** (URL is the only credential, free, fine for a bakery's volume) vs **SheetDB/Sheety/Sheet.best** (REST-over-Sheets, paid tiers, read-write services expose data to anyone with the URL). Decision deferred per the request; the abstraction keeps it open.

## Directory Map

```text
src/
  lib/
    order/
      draftStore.ts        (NEW) persistent per-tab draft, sessionStorage-backed
      draftSink.ts         (NEW) the external-sink boundary — STUBBED
      bindOrderCapture.ts  (NEW) wire a step's inputs → store/sink; submit → client navigate
  components/
    order/
      OrderForm.astro      (M) drop method/action; capture-as-entered; client navigate; keep date/time validation as a hook
      DateSelect.astro     (M) drop method/action; capture-as-entered; client navigate
astro.config.mjs           (NO CHANGE) static site needs no Vercel adapter (per @astrojs/vercel docs)
```

## Modification Table

| File | Action | Why |
|---|---|---|
| `src/lib/order/draftStore.ts` | New | Single source of truth for all entered fields; persists to sessionStorage so values survive step nav/reload. |
| `src/lib/order/draftSink.ts` | New | The one boundary to the external receiving end; stubbed now, real Google-Sheet write dropped in later with no upstream changes. |
| `src/lib/order/bindOrderCapture.ts` | New | Reusable client wiring: hydrate inputs, capture on input/change (debounced sink), submit→validate→`navigate()`. No POST. |
| `src/components/order/OrderForm.astro` | Modify | Remove `method="post" action`; bind capture; route the existing date/time validation through the new submit path. |
| `src/components/order/DateSelect.astro` | Modify | Remove `method="post" action`; bind capture; client-side navigate on NEXT. |
| `astro.config.mjs` | None | Documented: a static Astro site needs no Vercel adapter; it would not change routing. |

## Existing Pattern Audit (this repo)

- **Inline `<script>` per component** is the established pattern (`OrderForm.astro` already ships an inline script for date/time; `[...variant].astro` uses `astro:page-load`/`astro:before-preparation`). New wiring follows the same approach — plain TS modules imported by inline scripts, **no new React island**.
- **`astro:page-load`** is the project's bind point under ClientRouter (used by `cartSync.ts`). Order steps re-bind there too.
- **Content-driven hrefs**: `nextHref` already comes from `src/content/order/*.json` and is passed as a prop; it is forwarded to the client via a `data-next-href` attribute (frontmatter isn't visible to hoisted module scripts).
- **`sessionStorage`** is already used in the repo (`[...variant].astro` scroll restoration), so it is an established, dependency-free persistence choice — no new state library introduced.
- **`navigate()` from `astro:transitions/client`** is the supported programmatic-navigation API for the already-enabled `ClientRouter`.

## Execution Plan

1. Add `draftStore.ts` — get/update/clear over sessionStorage.
2. Add `draftSink.ts` — debounced `syncDraft()`, stubbed (no endpoint), dev-only console.
3. Add `bindOrderCapture.ts` — hydrate + capture-as-entered + submit→validate→navigate.
4. `DateSelect.astro` — drop `method/action`, add `id` + `data-next-href`, add inline script calling `bindOrderCapture`.
5. `OrderForm.astro` — same form changes; pass its date/time validation as the `validate` hook so the single submit path owns navigation.
6. Validate (build + click-through preview).

## File-by-File Changes

### `src/lib/order/draftStore.ts`
**Action:** New
**Why:** One persistent source of truth for everything entered across the flow.

#### After
```ts
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

export function updateDraft(patch: OrderDraft): OrderDraft {
  const next = { ...getDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable/full — capture is best-effort, never throws */
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
```

#### Reasoning
- Pure, dependency-free, SSR-safe (guards `sessionStorage`), never throws — capture must never break the page.

---

### `src/lib/order/draftSink.ts`
**Action:** New
**Why:** The single boundary to the external receiving end, stubbed now.

#### After
```ts
// The external "receiving end" for the order draft — STUBBED.
//
// System design: as fields are entered they're pushed here (debounced) so the
// collected data lands in an external store. Planned destination: a Google
// Sheet via a Google Apps Script web-app URL (or a SheetDB/Sheety endpoint).
// The endpoint + transport are intentionally deferred — everything upstream
// treats this as an opaque syncDraft(draft) call, so wiring the real
// destination later touches ONLY this file.
import type { OrderDraft } from './draftStore';

// TODO(receiving-end): set to the Apps Script web-app URL (or SheetDB endpoint),
// then replace the stub body below with the actual write. Left null so the
// stub is a safe no-op until the destination is chosen.
const SINK_ENDPOINT: string | null = null;

const DEBOUNCE_MS = 600;
let timer: ReturnType<typeof setTimeout> | undefined;

export function syncDraft(draft: OrderDraft): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!SINK_ENDPOINT) {
      if (import.meta.env.DEV) console.debug('[orderDraft] captured (no sink wired):', draft);
      return;
    }
    // Deferred receiving-end work goes here, e.g.:
    //   void fetch(SINK_ENDPOINT, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(draft),
    //   }).catch(() => { /* best-effort */ });
  }, DEBOUNCE_MS);
}
```

#### Reasoning
- One file owns the external contract. The stub proves capture works end-to-end (dev console) without committing to a destination.
- Debounced so rapid typing doesn't hammer the (future) endpoint.

---

### `src/lib/order/bindOrderCapture.ts`
**Action:** New
**Why:** Reusable wiring shared by every order step; no per-page duplication.

#### After
```ts
// Wires an order-step <form>'s inputs to the persistent draft store and the
// external sink, and turns the step's submit into client-side navigation.
// There is no method="post": nothing 405s on Vercel and no PII rides a page
// navigation. Data is captured AS IT'S ENTERED (input/change), not on submit.
import { navigate } from 'astro:transitions/client';
import { getDraft, updateDraft, type OrderDraft } from './draftStore';
import { syncDraft } from './draftSink';

type Field = HTMLInputElement | HTMLSelectElement;

interface Options {
  nextHref: string;
  /** Optional extra validation (e.g. OrderForm's date/time rules). Return
   *  false to block navigation; the callback shows its own messages. */
  validate?: () => boolean;
}

export function bindOrderCapture(form: HTMLFormElement, opts: Options): void {
  if (form.dataset.captureBound === 'true') return; // astro:page-load can fire twice
  form.dataset.captureBound = 'true';

  const fields = Array.from(form.querySelectorAll<Field>('input[name], select[name]'));

  // Hydrate from the store so going back/forward keeps what was entered.
  const draft = getDraft();
  for (const el of fields) {
    const v = draft[el.name];
    if (v === undefined) continue;
    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
      el.checked = el.value === v;
    } else {
      el.value = v;
    }
  }

  // Current value of a field, skipping unchecked radio/checkbox.
  const valueOf = (el: Field): string | undefined => {
    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') && !el.checked) {
      return undefined;
    }
    return el.value;
  };

  // Capture as entered. `input` fires for text, select, radio and checkbox in
  // modern browsers, so one listener per field covers every type (no redundant
  // `change` listener).
  for (const el of fields) {
    el.addEventListener('input', () => {
      const v = valueOf(el);
      if (v !== undefined) syncDraft(updateDraft({ [el.name]: v }));
    });
  }

  // Submit = validate + client navigate. Never POSTs. Flush every field in a
  // SINGLE store write (one sessionStorage read/merge/write, not one per field).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (opts.validate && !opts.validate()) return;
    const patch: OrderDraft = {};
    for (const el of fields) {
      const v = valueOf(el);
      if (v !== undefined) patch[el.name] = v;
    }
    syncDraft(updateDraft(patch));
    navigate(opts.nextHref);
  });
}
```

#### Reasoning
- Single bind path for both steps; the optional `validate` hook lets `OrderForm` keep its bespoke date/time checks without a second submit handler fighting this one.
- `captureBound` guard mirrors the existing `astro:page-load` double-fire guard in `cartSync.ts`.

---

### `src/components/order/DateSelect.astro`
**Action:** Modify
**Why:** Remove the POST navigation; capture the chosen date as entered; advance client-side.

#### Before
```astro
  <form method="post" action={nextHref} class="flex flex-col gap-6 sm:gap-8 md:gap-10">
```

#### After
```astro
  <form id="order-date-form" data-next-href={nextHref} novalidate class="flex flex-col gap-6 sm:gap-8 md:gap-10">
```

Add at the end of the component:
```astro
<script>
  import { bindOrderCapture } from "../../lib/order/bindOrderCapture";
  function init() {
    const form = document.getElementById("order-date-form") as HTMLFormElement | null;
    if (!form) return;
    bindOrderCapture(form, { nextHref: form.dataset.nextHref ?? "/" });
  }
  document.addEventListener("astro:page-load", init);
</script>
```

#### Reasoning
- The radio `name="date"` value is captured on `input` into the draft; NEXT runs `reportValidity()` (the radio is `required`) then navigates. No POST, so the page that previously 405'd is reached by a normal client navigation.
- `novalidate` added for parity with `OrderForm` so both steps use the same explicit `reportValidity()` path.

---

### `src/components/order/OrderForm.astro`
**Action:** Modify
**Why:** Same removal of POST + capture-as-entered. **Implementation finding:** the date/time scheduling UI was already removed from this form (`OrderForm.astro:257` "REMOVED per user request"), so `initOrderFormScheduling()` and its `delivery-orderDate`/`delivery-orderTime` references are **dead code** — the whole script early-returns. Carrying a date/time `validate` hook forward would preserve nothing, so the dead script and its `getAvailableDates`/`getTimeSlots`/config imports are removed and replaced with clean capture wiring (no validate hook needed; `reportValidity()` covers the required contact/address fields).

#### Before
```astro
  <form
    method="post"
    action={nextHref}
    class="grid gap-y-6 sm:gap-y-8 md:gap-y-10 lg:gap-y-12"
    novalidate
  >
```

#### After
```astro
  <form
    id="order-form"
    data-next-href={nextHref}
    class="grid gap-y-6 sm:gap-y-8 md:gap-y-10 lg:gap-y-12"
    novalidate
  >
```

The entire `<script>` (the dead `initOrderFormScheduling` + its `getAvailableDates`/`getTimeSlots`/config imports) is replaced with the capture wiring below — seeded with the pickup/delivery branch derived from the URL.

#### After (full replacement of the OrderForm `<script>`)
```astro
<script>
  // Capture the contact/address fields as they're entered and advance
  // client-side on NEXT — no form POST (which 405s on Vercel), no PII in the
  // URL. The earlier date/time scheduling UI was removed from this form, so
  // there's no date/time validation here; the date is chosen on the separate
  // /order/*/date step (DateSelect). See bindOrderCapture.
  import { bindOrderCapture } from "../../lib/order/bindOrderCapture";
  import { fulfillmentFromPath } from "../../lib/order/draftStore";

  function initOrderCapture() {
    const form = document.getElementById("order-form") as HTMLFormElement | null;
    if (!form) return;
    const fulfillment = fulfillmentFromPath(location.pathname);
    bindOrderCapture(form, {
      nextHref: form.dataset.nextHref ?? "/",
      seed: fulfillment ? { fulfillment } : undefined,
    });
  }

  document.addEventListener("astro:page-load", initOrderCapture);
</script>
```

#### Reasoning
- No date/time validate hook — those inputs don't exist; `reportValidity()` handles the required contact/address fields. Removing the dead script (and its now-unused imports) is the no-slop choice.
- `fulfillmentFromPath(location.pathname)` records pickup-vs-delivery into the draft (the `/order` step chose it via a link), keeping `bindOrderCapture` URL-agnostic via the `seed` option.
- `name`-attribute concern resolved: contact/address inputs already expose `name` (e.g. `name={field.id}`, `name="street"`); capture keys off those.
- **Pre-existing dead props left untouched** (`dateLabel`/`timeLabel`/`hasScheduling` in frontmatter): removing them would change the component's prop interface and the `order-*.json` content contract — out of this change's scope. Flagged, not silently carried.

---

### `astro.config.mjs`
**Action:** None.
**Why:** Per the `@astrojs/vercel` docs, a static Astro site needs no adapter and adding one "enables integration with Vercel-specific features rather than changing routing." The 405 is fixed by removing POST, not by config. No `vercel.json` is added.

## Validation Plan

1. `npm run build` — passes with no new type errors.
2. `npm run preview`, walk `/order → /order/delivery → /order/delivery/date → /products`:
   - Each NEXT is an instant client navigation (no full reload), URL stays clean (no query-string PII), and **the date page renders** (the previously-broken step).
3. In DevTools: type into contact/address fields and watch the dev console log `[orderDraft] captured …` on input — confirms capture-as-entered; refresh mid-flow and confirm fields re-hydrate from `sessionStorage`.
4. Network tab: confirm **no POST request** is issued on NEXT (only client navigation).
5. Back/forward through steps — values persist.

## Risk Notes

- **No-JS**: the flow requires JS (capture + client nav). It already depended on JS (ClientRouter, islands, Snipcart), so this is consistent; there is no `<form>` POST fallback by design. Flagging explicitly.
- **Receiving end deferred**: `draftSink.ts` is a no-op until an endpoint is set. Until then, data lives only in `sessionStorage` and is not transmitted anywhere — intended per "receiving end isn't important for now."
- **Sink transport note**: when wired, the eventual Google-Sheet write will be a client `fetch` (typically POST) to the Apps Script/SheetDB URL. That is a background data call, **not** the HTML form-POST page navigation this feature removes — but worth naming so "no POST" expectations are precise.
- **PII in sessionStorage**: held per-tab and cleared on tab close; `clearDraft()` is available to call after a completed order if desired.
- **OrderForm validation**: the date/time logic is *moved into a hook*, not rewritten — behavior must stay identical; covered by validation step 2–3.
- **Fulfillment choice not captured**: the `/order` step picks pickup-vs-delivery via plain `<a>` links (already GET, no bug). The draft therefore won't record which branch was chosen unless we add it — e.g. set `updateDraft({ fulfillment: 'pickup' | 'delivery' })` from each branch page's inline script. Small add; flagging so it's a decision, not an omission.
- **Two items to verify during implementation (not assumed):** (1) the scheduling `<input id="delivery-orderDate">` / `<select id="delivery-orderTime">` expose `name` attributes — capture keys off `name`; (2) `form.reportValidity()` validates under `novalidate` (expected per the HTML spec, but confirm in the click-through).

## Approval

`Status: Awaiting explicit user approval. Do not implement yet.`
